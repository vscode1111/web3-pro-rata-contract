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
    address _verifier,
    uint256 _goal,
    uint32 _startDate, //0 - skip
    uint32 _closeDate
  ) public initializer {
    if (_newOwner == address(0)) {
      revert NewOwnerNotZeroAddress();
    }

    if (_baseToken == address(0)) {
      revert BaseTokenNotZeroAddress();
    }

    if (_boostToken == address(0)) {
      revert BoostTokenNotZeroAddress();
    }

    if (_verifier == address(0)) {
      revert VerifierNotZeroAddress();
    }

    if (_goal == 0) {
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
    verifier = _verifier;
    goal = _goal;
    startDate = _startDate;
    closeDate = _closeDate;
  }

  function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

  //Variables, structs, errors, modifiers, events------------------------

  string public constant VERSION = "1.11";

  IERC20 public baseToken;
  IERC20 public boostToken;
  address public verifier;
  uint256 public goal;
  uint32 public startDate;
  uint32 public closeDate;
  uint256 public totalDeposited;
  uint256 public totalRefunded;
  uint256 public totalWithdrew;

  mapping(address => AccountItem) private _accountItems;
  mapping(bytes32 => TransactionItem) private _transactionIds;
  address[] private _accountAddresses;
  uint32 private _processedAccountIndex;

  struct AccountItem {
    uint256 deposited;
    uint256 refunded;
    uint32 nonce;
  }

  struct AccountInfo {
    uint256 deposited;
    uint256 depositAmount;
    uint256 refunded;
    uint256 refundAmount;
    uint32 nonce;
  }

  struct TransactionItem {
    uint256 amount;
  }

  error NewOwnerNotZeroAddress();
  error BaseTokenNotZeroAddress();
  error BoostTokenNotZeroAddress();
  error VerifierNotZeroAddress();
  error GoalNotZero();
  error StartDateMustBeGreaterThanCurrentTime();
  error CloseDateMustBeGreaterThanCurrentTime();
  error CloseDateMustBeGreaterThanStartDate();
  error TimeoutBlocker();
  error AmountNotZero();
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

  modifier amountChecker(uint256 amount) {
    if (amount == 0) {
      revert AmountNotZero();
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

  function isReady() public view returns (bool) {
    return !isBeforeStartDate() && !isAfterCloseDate();
  }

  function isReachedGoal() public view returns (bool) {
    return totalDeposited >= goal;
  }

  function getAccountCount() public view returns (uint32) {
    return (uint32)(_accountAddresses.length);
  }

  function fetchAccountInfo(address account) external view returns (AccountInfo memory) {
    AccountItem memory accountItem = _accountItems[account];
    uint256 refundAmount = calculateAccountRefundAmount(account);
    return
      AccountInfo(
        accountItem.deposited,
        accountItem.deposited - refundAmount,
        accountItem.refunded,
        refundAmount,
        accountItem.nonce
      );
  }

  function getBaseBalance() public view returns (uint256) {
    return baseToken.balanceOf(address(this));
  }

  function balanceOf(address account) external view returns (uint256) {
    return _accountItems[account].deposited;
  }

  function getHash(string calldata value) private pure returns (bytes32) {
    return keccak256(abi.encodePacked(value));
  }

  function getAccountDepositNonce(address account) public view returns (uint32) {
    return _accountItems[account].nonce;
  }

  function getAccountByIndex(uint32 index) public view returns (address) {
    return _accountAddresses[index];
  }

  function getAccountDepositAmount(address account) external view returns (uint256) {
    if (!isAfterCloseDate() || !isReachedGoal()) {
      return 0;
    }

    return _accountItems[account].deposited - calculateAccountRefundAmount(account);
  }

  function getTotalDeposited() external view returns (uint256) {
    if (isReachedGoal()) {
      return goal;
    }

    return 0;
  }

  function calculateRemainDeposit() external view returns (uint256) {
    if (!isReady()) {
      return 0;
    }

    if (goal > totalDeposited) {
      return goal - totalDeposited;
    }

    return 0;
  }

  function calculateAccidentAmount() external view returns (uint256) {
    return getBaseBalance() - (totalDeposited - totalRefunded - totalWithdrew);
  }

  function calculateOverfundAmount() external view returns (uint256) {
    if (isReachedGoal()) {
      return totalDeposited - goal;
    }
    return 0;
  }

  function calculateAccountRefundAmount(address account) public view returns (uint256) {
    AccountItem memory accountItem = _accountItems[account];

    if (isReachedGoal()) {
      return ((totalDeposited - goal) * accountItem.deposited) / totalDeposited;
    } else {
      return accountItem.deposited;
    }
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
    uint256 amount,
    string calldata transactionId,
    uint32 timestampLimit
  ) private nonReentrant amountChecker(amount) timeoutBlocker(timestampLimit) periodBlocker {
    if (baseToken.allowance(account, address(this)) < amount) {
      revert UserMustAllowToUseFunds();
    }

    if (baseToken.balanceOf(account) < amount) {
      revert UserMustHaveFunds();
    }

    _setTransactionId(transactionId, amount);

    AccountItem storage accountItem = _accountItems[account];

    if (accountItem.nonce == 0) {
      _accountAddresses.push(account);
    }

    accountItem.deposited += amount;
    accountItem.nonce += 1;
    totalDeposited += amount;

    baseToken.safeTransferFrom(account, address(this), amount);
    emit Deposit(account, amount);
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
    return recover == owner() || recover == verifier;
  }

  function depositSig(
    uint256 amount,
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
        amount,
        boost,
        nonce,
        transactionId,
        timestampLimit,
        signature
      )
    ) {
      revert InvalidSignature();
    }
    _deposit(account, amount, transactionId, timestampLimit);
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
      uint256 refundAmount = calculateAccountRefundAmount(account);
      if (refundAmount > 0) {
        AccountItem storage accountItem = _accountItems[account];
        accountItem.refunded = refundAmount;
        baseToken.safeTransfer(account, refundAmount);
        totalRefunded += refundAmount;
        emit Refund(account, refundAmount);
      }
    }
    _processedAccountIndex = endIndex;
  }

  function refundAll() external {
    refund(getAccountCount());
  }

  function withdrawGoal() external nonReentrant onlyOwner afterCloseDate {
    if (!isReachedGoal()) {
      revert UnreachedGoal();
    }

    address to = owner();
    baseToken.safeTransfer(to, goal);
    totalWithdrew += goal;
    emit WithdrawGoal(to, goal);
  }
}
