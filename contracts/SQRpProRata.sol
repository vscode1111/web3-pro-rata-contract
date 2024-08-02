// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IContractInfo} from "./IContractInfo.sol";
import {IDepositRefund} from "./IDepositRefund.sol";
import {UsefulMath} from "./UsefulMath.sol";

import "hardhat/console.sol";

contract SQRpProRata is
  OwnableUpgradeable,
  UUPSUpgradeable,
  ReentrancyGuardUpgradeable,
  IContractInfo,
  IDepositRefund
{
  using SafeERC20 for IERC20;
  using MessageHashUtils for bytes32;
  using ECDSA for bytes32;

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  function initialize(ContractParams calldata contractParams) public initializer {
    if (contractParams.newOwner == address(0)) {
      revert NewOwnerNotZeroAddress();
    }

    if (contractParams.baseToken == address(0)) {
      revert BaseTokenNotZeroAddress();
    }

    if (contractParams.depositVerifier == address(0)) {
      revert DepositVerifierNotZeroAddress();
    }

    if (contractParams.baseGoal == 0) {
      revert GoalNotZero();
    }

    if (0 < contractParams.startDate && contractParams.startDate < uint32(block.timestamp)) {
      revert StartDateMustBeGreaterThanCurrentTime();
    }

    if (contractParams.closeDate < uint32(block.timestamp)) {
      revert CloseDateMustBeGreaterThanCurrentTime();
    }

    if (
      contractParams.startDate > 0 &&
      contractParams.closeDate > 0 &&
      contractParams.startDate > contractParams.closeDate
    ) {
      revert CloseDateMustBeGreaterThanStartDate();
    }

    if (contractParams.linearAllocation && contractParams.linearBoostFactor < PRECISION_FACTOR) {
      revert LinearBoostFactorMustBeMoreOne();
    }

    __Ownable_init(contractParams.newOwner);
    __UUPSUpgradeable_init();

    baseToken = IERC20(contractParams.baseToken);
    baseDecimals = contractParams.baseDecimals;
    boostToken = IERC20(contractParams.boostToken);
    boostDecimals = contractParams.boostDecimals;
    depositVerifier = contractParams.depositVerifier;
    baseGoal = contractParams.baseGoal;
    startDate = contractParams.startDate;
    closeDate = contractParams.closeDate;
    externalRefund = contractParams.externalRefund;
    linearAllocation = contractParams.linearAllocation;
    linearBoostFactor = contractParams.linearBoostFactor;

    (decimalsFactor1, decimalsFactor2) = calculateDecimalsFactors(baseDecimals, boostDecimals);
  }

  function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

  //Variables, structs, errors, modifiers, events------------------------
  string public constant VERSION = "3.2.0";
  uint256 public constant PRECISION_FACTOR = 1e18;

  //Contract params
  IERC20 public baseToken;
  uint8 public baseDecimals;
  IERC20 public boostToken;
  uint8 public boostDecimals;
  address public depositVerifier;
  uint256 public baseGoal;
  uint32 public startDate;
  uint32 public closeDate;
  bool public externalRefund;
  bool public linearAllocation;
  uint256 public linearBoostFactor;

  //Public variables
  uint256 public decimalsFactor1;
  uint256 public decimalsFactor2;
  uint256 public totalBaseDeposited;
  uint256 public totalBaseNonBoostDeposited;
  uint256 public totalBaseBoostDeposited;
  uint256 public totalBaseRefunded;
  uint256 public totalBaseWithdrew;
  uint256 public totalBoostWithdrew;
  uint256 public totalBoostRefunded;
  uint256 public totalBoostSwapped;
  uint256 public totalBaseSwappedAmount;

  mapping(address account => AccountItem accountItem) private _accountItems;
  address[] private _accountAddresses;

  mapping(bytes32 hash => TransactionItem transactionItem) private _transactionIds;

  uint32 private _processedRefundIndex;
  uint32 private _processedBaseSwappedIndex;
  bool private _isWithdrewBaseGoal;
  bool private _isWithdrewBaseSwappedAmount;

  struct ContractParams {
    address newOwner;
    address baseToken;
    uint8 baseDecimals;
    address boostToken;
    uint8 boostDecimals;
    address depositVerifier;
    uint256 baseGoal;
    uint32 startDate; //0 - skip
    uint32 closeDate;
    bool externalRefund;
    bool linearAllocation;
    uint256 linearBoostFactor;
  }

  struct AccountItem {
    uint256 baseDeposited;
    uint256 baseDeposit;
    uint256 baseRefunded;
    uint256 boostDeposit;
    uint256 boostRefunded;
    uint32 nonce;
    bool boosted;
  }

  struct AccountInfo {
    //init
    uint256 baseDeposited;
    bool boosted;
    uint256 baseAllocation;
    //base
    uint256 baseDeposit;
    uint256 baseRefund;
    uint256 baseRefunded;
    //boost
    uint256 boostDeposit;
    uint256 boostRefund;
    uint256 boostRefunded;
    //extra
    uint32 nonce;
    uint256 boostAverageExchangeRate;
    uint256 share;
  }

  struct DepositSigParams {
    uint256 baseAmount;
    bool boost;
    uint256 boostExchangeRate;
    string transactionId;
    uint32 timestampLimit;
    bytes signature;
  }

  struct TransactionItem {
    uint256 amount;
  }

  error NewOwnerNotZeroAddress();
  error BaseTokenNotZeroAddress();
  error BoostTokenNotZeroAddress();
  error DepositVerifierNotZeroAddress();
  error GoalNotZero();
  error StartDateMustBeGreaterThanCurrentTime();
  error CloseDateMustBeGreaterThanCurrentTime();
  error CloseDateMustBeGreaterThanStartDate();
  error LinearBoostFactorMustBeMoreOne();
  error TimeoutBlocker();
  error BaseAmountNotZero();
  error BoostExchangeRateNotZero();
  error InvalidSignature();
  error UsedTransactionId();
  error UserMustAllowToUseFunds();
  error UserMustHaveFunds();
  error UserHasBoostedDeposit();
  error TooEarly();
  error TooLate();
  error UnreachedGoal();
  error AllUsersProcessedRefund();
  error AllUsersProcessedBaseSwapped();
  error NotAllUsersProcessedBaseSwapped();
  error NotRefunded();
  error NotWithdrawBaseGoal();
  error ContractForExternalRefund();
  error ContractHasNoEnoughBaseTokensForRefund();
  error ContractHasNoEnoughBoostTokensForRefund();
  error AlreadyWithdrewBaseGoal();
  error WithdrewBaseSwappedAmount();

  modifier timeoutBlocker(uint32 timestampLimit) {
    if (block.timestamp > timestampLimit) {
      revert TimeoutBlocker();
    }
    _;
  }

  modifier baseAmountChecker(uint256 amount) {
    if (amount == 0) {
      revert BaseAmountNotZero();
    }
    _;
  }

  modifier periodBlocker() {
    if (isBeforeStartDate()) {
      revert TooEarly();
    }
    if (isAfterCloseDate()) {
      revert TooLate();
    }
    _;
  }

  modifier afterCloseDate() {
    if (!isAfterCloseDate()) {
      revert TooEarly();
    }
    _;
  }

  event Deposit(
    address indexed account,
    bool indexed isBoost,
    uint256 baseAmount,
    uint256 boostAmount
  );
  event Refund(
    address indexed account,
    bool indexed isBoost,
    uint256 baseAmount,
    uint256 boostAmount,
    uint256 boostAverageExchangeRate
  );
  event WithdrawBaseGoal(address indexed account, uint256 baseAmount);
  event WithdrawSwappedAmount(address indexed account, uint256 baseAmount);
  event WithdrawExcessTokens(address indexed account, uint256 baseAmount, uint256 boostAmount);
  event ForceWithdraw(address indexed token, address indexed to, uint256 amount);
  event CalculateBaseSwappedAmount(uint32 batchSize, uint32 endIndex);

  //Read methods-------------------------------------------
  //IContractInfo implementation
  function getContractName() external pure returns (string memory) {
    return "Pro-rata";
  }

  function getContractVersion() external pure returns (string memory) {
    return VERSION;
  }

  //IDepositRefund implementation
  function getBaseGoal() external view returns (uint256) {
    return baseGoal;
  }

  function getStartDate() external view returns (uint32) {
    return startDate;
  }

  function getCloseDate() external view returns (uint32) {
    return closeDate;
  }

  function getDepositRefundFetchReady() external view returns (bool) {
    return isAfterCloseDate();
  }

  function getAccountCount() public view returns (uint32) {
    return (uint32)(_accountAddresses.length);
  }

  function getAccountByIndex(uint32 index) public view returns (address) {
    return _accountAddresses[index];
  }

  function getDepositRefundTokensInfo() external view returns (DepositRefundTokensInfo memory) {
    return DepositRefundTokensInfo(address(baseToken), address(boostToken));
  }

  function getDepositRefundAllocation(address account) external view returns (uint256) {
    return calculateAccountBaseAllocation(account);
  }

  function getDepositRefundAccountInfo(
    address account
  ) external view returns (DepositRefundAccountInfo memory) {
    AccountItem memory accountItem = _accountItems[account];

    return
      DepositRefundAccountInfo(
        accountItem.baseDeposited,
        accountItem.boosted,
        calculateAccountBaseAllocation(account),
        calculateAccountBaseRefund(account),
        calculateAccountBoostRefund(account),
        accountItem.nonce
      );
  }

  function getDepositRefundContractInfo() external view returns (DepositRefundContractInfo memory) {
    return DepositRefundContractInfo(totalBaseDeposited);
  }

  //Custom
  function isBeforeStartDate() public view returns (bool) {
    return startDate > 0 && block.timestamp < startDate;
  }

  function isAfterCloseDate() public view returns (bool) {
    return block.timestamp > closeDate;
  }

  function isDepositReady() public view returns (bool) {
    return !isBeforeStartDate() && !isAfterCloseDate();
  }

  function isReachedBaseGoal() public view returns (bool) {
    return totalBaseDeposited >= baseGoal;
  }

  function fetchAccountInfo(address account) external view returns (AccountInfo memory) {
    AccountItem memory accountItem = _accountItems[account];

    return
      AccountInfo(
        accountItem.baseDeposited,
        accountItem.boosted,
        calculateAccountBaseAllocation(account),
        accountItem.baseDeposit,
        calculateAccountBaseRefund(account),
        accountItem.baseRefunded,
        accountItem.boostDeposit,
        calculateAccountBoostRefund(account),
        accountItem.boostRefunded,
        accountItem.nonce,
        calculateAccountBoostAverageExchangeRate(account),
        calculateAccountShare(account)
      );
  }

  function getBaseBalance() public view returns (uint256) {
    return baseToken.balanceOf(address(this));
  }

  function getBoostBalance() public view returns (uint256) {
    return boostToken.balanceOf(address(this));
  }

  function balanceOf(
    address account
  ) external view returns (uint256 baseDeposited, uint256 boostDeposited) {
    return (_accountItems[account].baseDeposit, _accountItems[account].boostDeposit);
  }

  function getHash(string calldata value) private pure returns (bytes32) {
    return keccak256(abi.encodePacked(value));
  }

  function getAccountDepositNonce(address account) public view returns (uint32) {
    return _accountItems[account].nonce;
  }

  function calculateRemainDeposit() external view returns (uint256) {
    if (!isDepositReady()) {
      return 0;
    }

    if (!isReachedBaseGoal()) {
      return baseGoal - totalBaseDeposited;
    }

    return 0;
  }

  function calculateAccidentAmount() external view returns (uint256) {
    return getBaseBalance() + totalBaseRefunded + totalBaseWithdrew - totalBaseDeposited;
  }

  function calculateOverfundAmount() external view returns (uint256) {
    if (isReachedBaseGoal()) {
      return totalBaseDeposited - baseGoal;
    }
    return 0;
  }

  function _calculateLinearAccountBaseAllocation(address account) private view returns (uint256) {
    AccountItem memory accountItem = _accountItems[account];

    if (isReachedBaseGoal()) {
      if (
        // baseGoal < totalBaseBoostDeposited
        linearBoostFactor * totalBaseBoostDeposited > totalBaseNonBoostDeposited
      ) {
        uint256 accountFactor = PRECISION_FACTOR;
        if (accountItem.boosted) {
          accountFactor = linearBoostFactor;
        }
        return
          UsefulMath.divisionRoundUp(
            (accountFactor * baseGoal * accountItem.baseDeposited) / PRECISION_FACTOR,
            totalBaseNonBoostDeposited +
              (linearBoostFactor * totalBaseBoostDeposited) /
              PRECISION_FACTOR
          );
      } else {
        if (accountItem.boosted) {
          return accountItem.baseDeposited;
        } else {
          return
            UsefulMath.divisionRoundUp(
              ((baseGoal - totalBaseBoostDeposited) * accountItem.baseDeposited),
              totalBaseNonBoostDeposited
            );
        }
      }
    }
    return 0;
  }

  function _calculateQueueAccountBaseAllocation(address account) private view returns (uint256) {
    AccountItem memory accountItem = _accountItems[account];
    if (isReachedBaseGoal()) {
      if (baseGoal > totalBaseBoostDeposited) {
        if (accountItem.boosted) {
          return accountItem.baseDeposited;
        } else {
          return
            UsefulMath.divisionRoundUp(
              ((baseGoal - totalBaseBoostDeposited) * accountItem.baseDeposited),
              totalBaseNonBoostDeposited
            );
        }
      } else if (accountItem.boosted) {
        return
          UsefulMath.divisionRoundUp(baseGoal * accountItem.baseDeposited, totalBaseBoostDeposited);
      }
    }
    return 0;
  }

  function calculateAccountBaseAllocation(address account) public view returns (uint256) {
    if (linearAllocation) {
      return _calculateLinearAccountBaseAllocation(account);
    } else {
      return _calculateQueueAccountBaseAllocation(account);
    }
  }

  function calculateAccountBaseRefund(address account) public view returns (uint256) {
    AccountItem memory accountItem = _accountItems[account];
    if (!accountItem.boosted) {
      return accountItem.baseDeposited - calculateAccountBaseAllocation(account);
    }
    return 0;
  }

  function calculateAccountBoostRefund(address account) public view returns (uint256) {
    AccountItem memory accountItem = _accountItems[account];
    if (accountItem.boosted) {
      uint256 boostAverageExchangeRate = calculateAccountBoostAverageExchangeRate(account);
      return
        ((accountItem.baseDeposited - calculateAccountBaseAllocation(account)) *
          PRECISION_FACTOR *
          decimalsFactor1) /
        decimalsFactor2 /
        boostAverageExchangeRate;
    }
    return 0;
  }

  function calculateAccountBoostAverageExchangeRate(address account) public view returns (uint256) {
    AccountItem memory accountItem = _accountItems[account];
    if (accountItem.boostDeposit > 0) {
      return
        (accountItem.baseDeposited * PRECISION_FACTOR * decimalsFactor1) /
        decimalsFactor2 /
        accountItem.boostDeposit;
    }
    return 0;
  }

  function calculateAccountShare(address account) public view returns (uint256) {
    return (calculateAccountBaseAllocation(account) * PRECISION_FACTOR) / baseGoal;
  }

  function fetchTransactionItem(
    string calldata transactionId
  ) external view returns (TransactionItem memory) {
    return _transactionIds[getHash(transactionId)];
  }

  function _getTransactionItem(
    string calldata transactionId
  ) private view returns (bytes32, TransactionItem memory) {
    bytes32 transactionIdHash = getHash(transactionId);
    return (transactionIdHash, _transactionIds[transactionIdHash]);
  }

  function getProcessedRefundIndex() external view returns (uint32) {
    return _processedRefundIndex;
  }

  function getProcessedBaseSwappedIndex() external view returns (uint32) {
    return _processedBaseSwappedIndex;
  }

  function calculateTotalBoostRefundAmount() public view returns (uint256) {
    uint256 total = 0;
    uint32 accountCount = getAccountCount();
    for (uint32 i = 0; i < accountCount; i++) {
      address account = getAccountByIndex(i);
      total += calculateAccountBoostRefund(account);
    }
    return total;
  }

  function calculateRequiredBoostAmount() external view returns (uint256) {
    uint256 contractBoostBalance = getBoostBalance();
    uint256 totalBoostRefundAmount = calculateTotalBoostRefundAmount();
    if (totalBoostRefundAmount > contractBoostBalance) {
      return totalBoostRefundAmount - contractBoostBalance;
    }
    return 0;
  }

  function calculateExcessBoostAmount() external view returns (uint256) {
    uint256 contractBoostBalance = getBoostBalance();
    uint256 totalBoostRefundAmount = calculateTotalBoostRefundAmount();
    if (contractBoostBalance > totalBoostRefundAmount) {
      return contractBoostBalance - totalBoostRefundAmount;
    }
    return 0;
  }

  function calculateDecimalsFactors(
    uint8 _baseDecimals,
    uint8 _boostDecimals
  ) public pure returns (uint256 factor1, uint256 factor2) {
    if (_baseDecimals >= _boostDecimals) {
      return (1, 10 ** (_baseDecimals - _boostDecimals));
    } else {
      return (10 ** (_boostDecimals - _baseDecimals), 1);
    }
  }

  function calculateRemainProcessedRefundIndex() public view returns (uint256) {
    return getAccountCount() - _processedRefundIndex;
  }

  function calculateRemainProcessedBaseSwappedIndex() public view returns (uint256) {
    return getAccountCount() - _processedBaseSwappedIndex;
  }

  function calculateTotalRefundTokens(uint32 _batchSize) public view returns (uint256, uint256) {
    uint32 accountCount = getAccountCount();
    if (_batchSize > accountCount - _processedRefundIndex) {
      _batchSize = accountCount - _processedRefundIndex;
    }

    if (_batchSize == 0) {
      return (0, 0);
    }

    uint32 endIndex = _processedRefundIndex + _batchSize;

    uint256 totalBaseRefund = 0;
    uint256 totalBoostRefund = 0;

    for (uint32 i = _processedRefundIndex; i < endIndex; i++) {
      address account = getAccountByIndex(i);
      totalBaseRefund += calculateAccountBaseRefund(account);
      totalBoostRefund += calculateAccountBoostRefund(account);
    }

    return (totalBaseRefund, totalBoostRefund);
  }

  function calculateTotalRefundTokensAll() public view returns (uint256, uint256) {
    return calculateTotalRefundTokens(getAccountCount());
  }

  //Write methods-------------------------------------------
  function _setTransactionId(string calldata transactionId, uint256 amount) private {
    (bytes32 transactionIdHash, TransactionItem memory transactionItem) = _getTransactionItem(
      transactionId
    );
    if (transactionItem.amount != 0) {
      revert UsedTransactionId();
    }
    _transactionIds[transactionIdHash] = TransactionItem(amount);
  }

  function _deposit(
    address account,
    uint256 baseAmount,
    bool boost,
    uint256 boostExchangeRate,
    string calldata transactionId,
    uint32 timestampLimit
  )
    private
    nonReentrant
    baseAmountChecker(baseAmount)
    timeoutBlocker(timestampLimit)
    periodBlocker
  {
    if (baseToken.allowance(account, address(this)) < baseAmount) {
      revert UserMustAllowToUseFunds();
    }

    if (baseToken.balanceOf(account) < baseAmount) {
      revert UserMustHaveFunds();
    }

    _setTransactionId(transactionId, baseAmount);

    AccountItem storage accountItem = _accountItems[account];

    if (accountItem.nonce == 0) {
      _accountAddresses.push(account);
    }

    accountItem.baseDeposited += baseAmount;

    uint256 boostDeposit = 0;

    if (boost) {
      if (address(boostToken) == address(0)) {
        revert BoostTokenNotZeroAddress();
      }

      if (boostExchangeRate == 0) {
        revert BoostExchangeRateNotZero();
      }

      uint256 baseDeposit = baseAmount;
      if (accountItem.baseDeposit > 0) {
        baseDeposit += accountItem.baseDeposit;
        totalBaseNonBoostDeposited -= accountItem.baseDeposit;
        accountItem.baseDeposit = 0;
      }

      boostDeposit =
        (baseDeposit * PRECISION_FACTOR * decimalsFactor1) /
        decimalsFactor2 /
        boostExchangeRate;

      accountItem.boostDeposit += boostDeposit;
      totalBaseBoostDeposited += baseDeposit;
      totalBoostSwapped += boostDeposit;
    } else {
      if (accountItem.boosted) {
        revert UserHasBoostedDeposit();
      }

      accountItem.baseDeposit += baseAmount;
      totalBaseNonBoostDeposited += baseAmount;
    }

    accountItem.nonce += 1;
    accountItem.boosted = boost;

    totalBaseDeposited += baseAmount;

    baseToken.safeTransferFrom(account, address(this), baseAmount);
    emit Deposit(account, boost, baseAmount, boostDeposit);
  }

  function verifyDepositSignature(
    address account,
    uint256 baseAmount,
    bool boost,
    uint256 boostExchangeRate,
    uint32 nonce,
    string calldata transactionId,
    uint32 timestampLimit,
    bytes calldata signature
  ) private view returns (bool) {
    bytes32 messageHash = keccak256(
      abi.encode(
        account,
        baseAmount,
        boost,
        boostExchangeRate,
        nonce,
        transactionId,
        timestampLimit
      )
    );
    address recover = messageHash.toEthSignedMessageHash().recover(signature);
    return recover == owner() || recover == depositVerifier;
  }

  function depositSig(DepositSigParams calldata depositSigParams) external {
    address account = _msgSender();

    uint32 nonce = getAccountDepositNonce(account);
    if (
      !verifyDepositSignature(
        account,
        depositSigParams.baseAmount,
        depositSigParams.boost,
        depositSigParams.boostExchangeRate,
        nonce,
        depositSigParams.transactionId,
        depositSigParams.timestampLimit,
        depositSigParams.signature
      )
    ) {
      revert InvalidSignature();
    }
    _deposit(
      account,
      depositSigParams.baseAmount,
      depositSigParams.boost,
      depositSigParams.boostExchangeRate,
      depositSigParams.transactionId,
      depositSigParams.timestampLimit
    );
  }

  function refund(uint32 _batchSize) public nonReentrant onlyOwner afterCloseDate {
    if (externalRefund) {
      revert ContractForExternalRefund();
    }

    uint32 accountCount = getAccountCount();
    if (_batchSize > accountCount - _processedRefundIndex) {
      _batchSize = accountCount - _processedRefundIndex;
    }

    if (_batchSize == 0) {
      revert AllUsersProcessedRefund();
    }

    uint32 endIndex = _processedRefundIndex + _batchSize;
    for (uint32 i = _processedRefundIndex; i < endIndex; i++) {
      address account = getAccountByIndex(i);
      uint256 boostAverageExchangeRate = calculateAccountBoostAverageExchangeRate(account);

      uint256 baseRefund = calculateAccountBaseRefund(account);
      if (baseRefund > 0) {
        if (getBaseBalance() < baseRefund) {
          revert ContractHasNoEnoughBaseTokensForRefund();
        }
        AccountItem storage accountItem = _accountItems[account];
        accountItem.baseRefunded = baseRefund;
        baseToken.safeTransfer(account, baseRefund);
        totalBaseRefunded += baseRefund;
        emit Refund(account, accountItem.boosted, baseRefund, 0, boostAverageExchangeRate);
      }

      uint256 boostRefund = calculateAccountBoostRefund(account);
      if (boostRefund > 0) {
        if (getBoostBalance() < boostRefund) {
          revert ContractHasNoEnoughBoostTokensForRefund();
        }
        AccountItem storage accountItem = _accountItems[account];
        accountItem.boostRefunded = boostRefund;
        boostToken.safeTransfer(account, boostRefund);
        totalBoostRefunded += boostRefund;
        emit Refund(account, accountItem.boosted, 0, boostRefund, boostAverageExchangeRate);
      }
    }
    _processedRefundIndex = endIndex;
  }

  function refundAll() external {
    refund(getAccountCount());
  }

  function withdrawBaseGoal() external nonReentrant onlyOwner afterCloseDate {
    if (_isWithdrewBaseGoal) {
      revert AlreadyWithdrewBaseGoal();
    }

    if (!isReachedBaseGoal()) {
      revert UnreachedGoal();
    }

    _isWithdrewBaseGoal = true;

    address to = owner();
    baseToken.safeTransfer(to, baseGoal);
    totalBaseWithdrew += baseGoal;
    emit WithdrawBaseGoal(to, baseGoal);
  }

  function calculateBaseSwappedAmount(uint32 _batchSize) public onlyOwner afterCloseDate {
    uint32 accountCount = getAccountCount();
    if (_batchSize > accountCount - _processedBaseSwappedIndex) {
      _batchSize = accountCount - _processedBaseSwappedIndex;
    }

    if (_batchSize == 0) {
      revert AllUsersProcessedBaseSwapped();
    }

    uint32 endIndex = _processedBaseSwappedIndex + _batchSize;
    for (uint32 i = _processedBaseSwappedIndex; i < endIndex; i++) {
      address account = getAccountByIndex(i);
      AccountItem memory accountItem = _accountItems[account];
      if (accountItem.boosted) {
        totalBaseSwappedAmount +=
          accountItem.baseDeposited -
          calculateAccountBaseAllocation(account);
      }
    }
    _processedBaseSwappedIndex = endIndex;

    emit CalculateBaseSwappedAmount(_batchSize, endIndex);
  }

  function calculateBaseSwappedAmountAll() public {
    calculateBaseSwappedAmount(getAccountCount());
  }

  function withdrawBaseSwappedAmount() public nonReentrant onlyOwner afterCloseDate {
    if (_isWithdrewBaseSwappedAmount) {
      revert WithdrewBaseSwappedAmount();
    }

    if (calculateRemainProcessedBaseSwappedIndex() > 0) {
      revert NotAllUsersProcessedBaseSwapped();
    }

    _isWithdrewBaseSwappedAmount = true;

    address to = owner();
    baseToken.safeTransfer(to, totalBaseSwappedAmount);
    totalBaseWithdrew += totalBaseSwappedAmount;
    emit WithdrawSwappedAmount(to, totalBaseSwappedAmount);
  }

  function withdrawExcessTokens() external nonReentrant onlyOwner afterCloseDate {
    if (!externalRefund) {
      if (calculateRemainProcessedRefundIndex() > 0) {
        revert NotRefunded();
      }

      if (isReachedBaseGoal() && totalBaseWithdrew < baseGoal) {
        revert NotWithdrawBaseGoal();
      }
    }

    address to = owner();

    uint256 baseBalance = getBaseBalance();
    if (baseBalance > 0) {
      baseToken.safeTransfer(to, baseBalance);
      totalBaseWithdrew += baseBalance;
    }

    uint256 boostBalance = getBoostBalance();
    if (boostBalance > 0) {
      boostToken.safeTransfer(to, boostBalance);
      totalBoostWithdrew += boostBalance;
    }

    emit WithdrawExcessTokens(to, baseBalance, boostBalance);
  }

  function forceWithdraw(address token, address to, uint256 amount) external onlyOwner {
    IERC20 _token = IERC20(token);
    _token.safeTransfer(to, amount);
    emit ForceWithdraw(token, to, amount);
  }
}
