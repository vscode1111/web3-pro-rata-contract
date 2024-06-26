// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IDepositable} from "./IDepositable.sol";

import "hardhat/console.sol";

contract SQRpProRata is
  OwnableUpgradeable,
  UUPSUpgradeable,
  ReentrancyGuardUpgradeable,
  IDepositable
{
  using SafeERC20 for IERC20;
  using MessageHashUtils for bytes32;
  using ECDSA for bytes32;

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  function initialize(
    address _newOwner,
    address _baseToken,
    address _boostToken,
    address _depositVerifier,
    uint256 _baseGoal,
    uint32 _startDate, //0 - skip
    uint32 _closeDate
  ) public initializer {
    if (_newOwner == address(0)) {
      revert NewOwnerNotZeroAddress();
    }

    if (_baseToken == address(0)) {
      revert BaseTokenNotZeroAddress();
    }

    // if (_boostToken == address(0)) {
    //   revert BoostTokenNotZeroAddress();
    // }

    if (_depositVerifier == address(0)) {
      revert DepositVerifierNotZeroAddress();
    }

    if (_baseGoal == 0) {
      revert GoalNotZero();
    }

    if (0 < _startDate && _startDate < uint32(block.timestamp)) {
      revert StartDateMustBeGreaterThanCurrentTime();
    }

    if (_closeDate < uint32(block.timestamp)) {
      revert CloseDateMustBeGreaterThanCurrentTime();
    }

    if (_startDate > 0 && _closeDate > 0 && _startDate > _closeDate) {
      revert CloseDateMustBeGreaterThanStartDate();
    }

    __Ownable_init(_newOwner);
    __UUPSUpgradeable_init();

    baseToken = IERC20(_baseToken);
    boostToken = IERC20(_boostToken);
    depositVerifier = _depositVerifier;
    baseGoal = _baseGoal;
    startDate = _startDate;
    closeDate = _closeDate;
  }

  function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

  //Variables, structs, errors, modifiers, events------------------------

  string public constant VERSION = "2.0";
  uint256 public constant DIVIDER = 1e18;

  IERC20 public baseToken;
  IERC20 public boostToken;
  address public depositVerifier;
  uint256 public baseGoal;
  uint32 public startDate;
  uint32 public closeDate;
  uint256 public totalBaseDeposited;
  uint256 public totalBaseNonBoostDeposited;
  uint256 public totalBaseBoostDeposited;
  uint256 public totalBaseRefunded;
  uint256 public totalBaseWithdrew;

  mapping(address account => AccountItem accountItem) private _accountItems;
  mapping(bytes32 hash => TransactionItem transactionItem) private _transactionIds;
  address[] private _accountAddresses;
  uint32 private _processedAccountIndex;

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
    uint256 baseDeposited;
    uint256 baseDeposit;
    uint256 baseAllocation;
    uint256 baseRefund;
    uint256 baseRefunded;
    uint256 boostDeposit;
    uint256 boostAllocation;
    uint256 boostRefund;
    uint256 boostRefunded;
    uint32 nonce;
    bool boosted;
  }

  struct TransactionItem {
    uint256 amount;
  }

  error NewOwnerNotZeroAddress();
  error BaseTokenNotZeroAddress();
  // error BoostTokenNotZeroAddress();
  error DepositVerifierNotZeroAddress();
  error GoalNotZero();
  error StartDateMustBeGreaterThanCurrentTime();
  error CloseDateMustBeGreaterThanCurrentTime();
  error CloseDateMustBeGreaterThanStartDate();
  error TimeoutBlocker();
  error BaseAmountNotZero();
  error InvalidSignature();
  error UsedTransactionId();
  error UserMustAllowToUseFunds();
  error UserMustHaveFunds();
  error TooEarly();
  error TooLate();
  error UnreachedGoal();
  error AllUsersProcessed();

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

  event Deposit(address indexed account, uint256 amount);
  event Refund(address indexed account, uint256 amount);
  event WithdrawGoal(address indexed account, uint256 amount);

  //Read methods-------------------------------------------

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

  function getAccountCount() public view returns (uint32) {
    return (uint32)(_accountAddresses.length);
  }

  function getAccountByIndex(uint32 index) public view returns (address) {
    return _accountAddresses[index];
  }

  function getAccountDepositAmount(address account) external view returns (uint256) {
    if (!isAfterCloseDate() || !isReachedBaseGoal()) {
      return 0;
    }

    return _accountItems[account].baseDeposit - calculateAccountBaseRefund(account);
  }

  function getTotalDeposited() external view returns (uint256) {
    if (isReachedBaseGoal()) {
      return baseGoal;
    }

    return 0;
  }

  function fetchAccountInfo(address account) external view returns (AccountInfo memory) {
    AccountItem memory accountItem = _accountItems[account];
    uint256 baseRefund = calculateAccountBaseRefund(account);
    uint256 boostRefund = calculateAccountBoostRefund(account);
    return
      AccountInfo(
        accountItem.baseDeposited,
        accountItem.baseDeposit,
        calculateAccountBaseAllocation(account),
        calculateAccountBaseRefund(account),
        accountItem.baseRefunded,
        accountItem.boostDeposit,
        accountItem.boostDeposit - boostRefund,
        boostRefund,
        accountItem.boostRefunded,
        accountItem.nonce,
        accountItem.boosted
      );
  }

  function getBaseBalance() public view returns (uint256) {
    return baseToken.balanceOf(address(this));
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
    return getBaseBalance() - (totalBaseDeposited - totalBaseRefunded - totalBaseWithdrew);
  }

  function calculateOverfundAmount() external view returns (uint256) {
    if (isReachedBaseGoal()) {
      return totalBaseDeposited - baseGoal;
    }
    return 0;
  }

  function calculateAccountBaseAllocation(address account) public view returns (uint256) {
    AccountItem memory accountItem = _accountItems[account];

    if (isReachedBaseGoal()) {
      if (baseGoal >= totalBaseBoostDeposited) {
        if (accountItem.boosted) {
          return accountItem.baseDeposit;
        } else {
          return
            ((baseGoal - totalBaseBoostDeposited) * accountItem.baseDeposit) /
            totalBaseNonBoostDeposited;
        }
      } else if (accountItem.boosted) {
        return (baseGoal * accountItem.baseDeposit) / totalBaseBoostDeposited;
      }
    }

    return 0;
  }

  function calculateAccountBaseRefund(address account) public view returns (uint256) {
    AccountItem memory accountItem = _accountItems[account];

    uint256 baseAllocation = calculateAccountBaseAllocation(account);
    // console.log(200, accountItem.baseDeposit, baseAllocation);

    return accountItem.baseDeposit - baseAllocation;
  }

  //ToDo: fix
  function calculateAccountBoostRefund(address account) public view returns (uint256) {
    // AccountItem memory accountItem = _accountItems[account];

    // if (isReachedBaseGoal()) {
    //   return ((totalBaseDeposited - baseGoal) * accountItem.baseDeposit) / totalBaseDeposited;
    // } else {
    //   return accountItem.baseDeposit;
    // }

    return 0;
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

  function getProcessedAccountIndex() external view returns (uint32) {
    return _processedAccountIndex;
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
    accountItem.baseDeposit += baseAmount;
    accountItem.nonce += 1;
    accountItem.boosted = boost;

    if (boost) {
      totalBaseBoostDeposited += baseAmount;
    } else {
      totalBaseNonBoostDeposited += baseAmount;
    }

    totalBaseDeposited += baseAmount;

    baseToken.safeTransferFrom(account, address(this), baseAmount);
    emit Deposit(account, baseAmount);
  }

  function verifyDepositSignature(
    address account,
    uint256 amount,
    bool boost,
    uint32 nonce,
    string calldata transactionId,
    uint32 timestampLimit,
    bytes calldata signature
  ) private view returns (bool) {
    bytes32 messageHash = keccak256(
      abi.encode(account, amount, boost, nonce, transactionId, timestampLimit)
    );
    address recover = messageHash.toEthSignedMessageHash().recover(signature);
    return recover == owner() || recover == depositVerifier;
  }

  function depositSig(
    uint256 baseAmount,
    bool boost,
    string calldata transactionId,
    uint32 timestampLimit,
    bytes calldata signature
  ) external {
    address account = _msgSender();

    uint32 nonce = getAccountDepositNonce(account);
    if (
      !verifyDepositSignature(
        account,
        baseAmount,
        boost,
        nonce,
        transactionId,
        timestampLimit,
        signature
      )
    ) {
      revert InvalidSignature();
    }
    _deposit(account, baseAmount, boost, transactionId, timestampLimit);
  }

  function refund(uint32 _batchSize) public nonReentrant onlyOwner afterCloseDate {
    uint32 accountCount = getAccountCount();
    if (_batchSize > accountCount - _processedAccountIndex) {
      _batchSize = accountCount - _processedAccountIndex;
    }

    if (_batchSize == 0) {
      revert AllUsersProcessed();
    }

    uint32 endIndex = _processedAccountIndex + _batchSize;
    for (uint32 i = _processedAccountIndex; i < endIndex; i++) {
      address account = getAccountByIndex(i);
      uint256 baseRefund = calculateAccountBaseRefund(account);
      if (baseRefund > 0) {
        AccountItem storage accountItem = _accountItems[account];
        accountItem.baseRefunded = baseRefund;
        baseToken.safeTransfer(account, baseRefund);
        totalBaseRefunded += baseRefund;
        emit Refund(account, baseRefund);
      }
    }
    _processedAccountIndex = endIndex;
  }

  function refundAll() external {
    refund(getAccountCount());
  }

  function withdrawGoal() external nonReentrant onlyOwner afterCloseDate {
    if (!isReachedBaseGoal()) {
      revert UnreachedGoal();
    }

    address to = owner();
    baseToken.safeTransfer(to, baseGoal);
    totalBaseWithdrew += baseGoal;
    emit WithdrawGoal(to, baseGoal);
  }
}
