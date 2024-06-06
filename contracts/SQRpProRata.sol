// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// import "hardhat/console.sol";

contract SQRpProRata is OwnableUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable {
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

  string public constant VERSION = "1.1";

  IERC20 public baseToken;
  IERC20 public boostToken;
  address public verifier;
  uint256 public goal;
  uint32 public startDate;
  uint32 public closeDate;
  uint256 public totalDeposited;
  uint256 public totalWithdrew;

  mapping(address => User) private _users;
  mapping(bytes32 => TransactionItem) private _transactionIds;
  address[] private _userAddresses;
  uint32 private _processedUserIndex;

  struct User {
    uint256 depositedAmount;
    uint256 contributionAmount;
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
  error InvalidNonce();
  error TooEarly();
  error TooLate();
  error GoalUnreached();
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
  event WithdrawGoal(address indexed to, uint256 amount);
  event Refund(address account, uint256 amount);

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

  function getUserCount() public view returns (uint32) {
    return (uint32)(_userAddresses.length);
  }

  function fetchUser(address account) external view returns (User memory) {
    return _users[account];
  }

  function getBalance() public view returns (uint256) {
    return baseToken.balanceOf(address(this));
  }

  function balanceOf(address account) external view returns (uint256) {
    User memory fund = _users[account];
    if (fund.depositedAmount > fund.contributionAmount) {
      return fund.depositedAmount - fund.contributionAmount;
    }
    return 0;
  }

  function getHash(string calldata value) private pure returns (bytes32) {
    return keccak256(abi.encodePacked(value));
  }

  function getNonce(address account) public view returns (uint32) {
    return _users[account].nonce;
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

  function calculateOverfundAmount() public view returns (uint256) {
    if (totalDeposited > goal) {
      return totalDeposited - goal;
    }
    return 0;
  }

  function calculateAccountRefundAmount(address account) public view returns (uint256) {
    if (!isAfterCloseDate()) {
      return 0;
    }

    uint256 overfundAmount = calculateOverfundAmount();

    User memory user = _users[account];

    if (overfundAmount > 0) {
      return (overfundAmount * user.depositedAmount) / totalDeposited;
    } else {
      return user.depositedAmount;
    }
  }

  function fetchTransactionItem(
    string calldata transactionId
  ) external view returns (TransactionItem memory) {
    return _transactionIds[getHash(transactionId)];
  }

  function getTransactionItem(
    string calldata transactionId
  ) private view returns (bytes32, TransactionItem memory) {
    bytes32 transactionIdHash = getHash(transactionId);
    return (transactionIdHash, _transactionIds[transactionIdHash]);
  }

  function _setTransactionId(uint256 amount, string calldata transactionId) private {
    (bytes32 transactionIdHash, TransactionItem memory transactionItem) = getTransactionItem(
      transactionId
    );
    if (transactionItem.amount != 0) {
      revert UsedTransactionId();
    }
    _transactionIds[transactionIdHash] = TransactionItem(amount);
  }

  function getProcessedUserIndex() external view returns (uint32) {
    return _processedUserIndex;
  }

  //Write methods-------------------------------------------

  function _deposit(
    address account,
    uint256 amount,
    uint32 nonce,
    string calldata transactionId,
    uint32 timestampLimit
  ) private nonReentrant amountChecker(amount) timeoutBlocker(timestampLimit) periodBlocker {
    if (baseToken.allowance(account, address(this)) < amount) {
      revert UserMustAllowToUseFunds();
    }

    if (baseToken.balanceOf(account) < amount) {
      revert UserMustHaveFunds();
    }

    _setTransactionId(amount, transactionId);

    User storage user = _users[account];

    if (user.nonce != nonce) {
      revert InvalidNonce();
    }

    if (user.nonce == 0) {
      _userAddresses.push(account);
    }

    user.depositedAmount += amount;
    user.nonce += 1;
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
    address account,
    uint256 amount,
    bool boost,
    string calldata transactionId,
    uint32 timestampLimit,
    bytes calldata signature
  ) external {
    uint32 nonce = getNonce(account);
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
    _deposit(account, amount, nonce, transactionId, timestampLimit);
  }

  function refund(uint32 _batchSize) public nonReentrant onlyOwner afterCloseDate {
    uint32 userCount = getUserCount();
    if (_batchSize > userCount - _processedUserIndex) {
      _batchSize = userCount - _processedUserIndex;
    }

    if (_batchSize == 0) {
      revert AllUsersProcessed();
    }

    uint32 endIndex = _processedUserIndex + _batchSize;
    for (uint i = _processedUserIndex; i < endIndex; i++) {
      address userAddress = _userAddresses[i];
      uint256 accountRefundAmount = calculateAccountRefundAmount(userAddress);
      baseToken.safeTransfer(userAddress, accountRefundAmount);
      emit Refund(userAddress, accountRefundAmount);
    }
    _processedUserIndex = endIndex;
  }

  function refundAll() external {
    refund(getUserCount());
  }

  function withdrawGoal() external nonReentrant onlyOwner afterCloseDate {
    if (getBalance() < goal) {
      revert GoalUnreached();
    }

    address to = owner();
    baseToken.safeTransfer(to, goal);
    emit WithdrawGoal(to, goal);
  }
}
