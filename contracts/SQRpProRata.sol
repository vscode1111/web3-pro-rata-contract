// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

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
    address _erc20Token,
    address _verifier,
    uint256 _goal,
    uint32 _startDate, //0 - skip
    uint32 _closeDate,
    address _coldWallet,
    uint256 _balanceLimit
  ) public initializer {
    if (_newOwner == address(0)) {
      revert NewOwnerNotZeroAddress();
    }

    if (_erc20Token == address(0)) {
      revert ERC20TokenNotZeroAddress();
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

    if (_coldWallet == address(0)) {
      revert ColdWalletNotZeroAddress();
    }

    __Ownable_init(_newOwner);
    __UUPSUpgradeable_init();

    erc20Token = IERC20(_erc20Token);
    verifier = _verifier;
    goal = _goal;
    startDate = _startDate;
    closeDate = _closeDate;
    coldWallet = _coldWallet;
    balanceLimit = _balanceLimit;
  }

  function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

  //Variables, structs, errors, modifiers, events------------------------

  string public constant VERSION = "1.0";

  IERC20 public erc20Token;
  address public coldWallet;
  address public verifier;
  uint256 public goal;
  uint32 public startDate;
  uint32 public closeDate;
  uint256 public balanceLimit;
  uint256 public totalDeposited;
  uint256 public totalWithdrew;

  mapping(address => FundItem) private _balances;
  // mapping(address => uint32) private _nonces;
  mapping(bytes32 => TransactionItem) private _transactionIds;
  address[] private _userAddresses;
  uint32 private _processedUserIndex;

  struct FundItem {
    uint256 depositedAmount;
    uint256 contributionAmount;
    uint32 nonce;
  }

  struct TransactionItem {
    uint256 amount;
  }

  error NewOwnerNotZeroAddress();
  error ERC20TokenNotZeroAddress();
  error VerifierNotZeroAddress();
  error GoalNotZero();
  error StartDateMustBeGreaterThanCurrentTime();
  error CloseDateMustBeGreaterThanCurrentTime();
  error CloseDateMustBeGreaterThanStartDate();
  error ColdWalletNotZeroAddress();
  error TimeoutBlocker();
  error AmountNotZero();
  error InvalidSignature();
  error UsedTransactionId();
  error UserMustAllowToUseFunds();
  error UserMustHaveFunds();
  error InvalidNonce();
  error TooEarly();
  error TooLate();

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
    if (isAfterCloseDate()) {
      revert TooLate();
    }
    _;
  }

  event ChangeBalanceLimit(address indexed sender, uint256 balanceLimit);
  event Deposit(address indexed account, uint256 amount);
  event WithdrawExcessReward(address indexed to, uint256 amount);

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

  function fetchFundItem(address account) external view returns (FundItem memory) {
    return _balances[account];
  }

  function getBalance() public view returns (uint256) {
    return erc20Token.balanceOf(address(this));
  }

  function balanceOf(address account) external view returns (uint256) {
    FundItem memory fund = _balances[account];
    if (fund.depositedAmount > fund.contributionAmount) {
      return fund.depositedAmount - fund.contributionAmount;
    }
    return 0;
  }

  function getHash(string calldata value) private pure returns (bytes32) {
    return keccak256(abi.encodePacked(value));
  }

  function getNonce(address account) public view returns (uint32) {
    return _balances[account].nonce;
  }

  function calculateRemainDeposit() external view returns (uint256) {
    if (!isReady()) {
      return 0;
    }

    return goal - totalDeposited;
  }

  function calculateExcessReward() public view returns (uint256) {
    uint256 contractBalance = getBalance();
    if (contractBalance > goal) {
      return contractBalance - goal;
    }
    return 0;
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

  //Write methods-------------------------------------------

  function _deposit(
    address account,
    uint256 amount,
    uint32 nonce,
    string calldata transactionId,
    uint32 timestampLimit
  ) private nonReentrant amountChecker(amount) timeoutBlocker(timestampLimit) periodBlocker {
    if (erc20Token.allowance(account, address(this)) < amount) {
      revert UserMustAllowToUseFunds();
    }

    if (erc20Token.balanceOf(account) < amount) {
      revert UserMustHaveFunds();
    }

    _setTransactionId(amount, transactionId);

    FundItem storage fund = _balances[account];

    if (fund.nonce != nonce) {
      revert InvalidNonce();
    }

    if (fund.nonce == 0) {
      _userAddresses.push(account);
    }

    fund.depositedAmount += amount;
    fund.nonce += 1;
    totalDeposited += amount;

    uint256 contractBalance = getBalance();
    uint256 supposedBalance = contractBalance + amount;

    if (supposedBalance > balanceLimit) {
      uint256 userToContractAmount = 0;
      uint256 userToColdWalletAmount = supposedBalance - balanceLimit;
      uint256 contractToColdWalletAmount = 0;

      if (amount > userToColdWalletAmount) {
        userToContractAmount = amount - userToColdWalletAmount;
      } else {
        userToColdWalletAmount = amount;
        contractToColdWalletAmount = contractBalance - balanceLimit;
      }

      if (userToContractAmount > 0) {
        erc20Token.safeTransferFrom(account, address(this), userToContractAmount);
      }
      if (userToColdWalletAmount > 0) {
        erc20Token.safeTransferFrom(account, coldWallet, userToColdWalletAmount);
      }
      if (contractToColdWalletAmount > 0) {
        erc20Token.safeTransfer(coldWallet, contractToColdWalletAmount);
      }
    } else {
      erc20Token.safeTransferFrom(account, address(this), amount);
    }

    emit Deposit(account, amount);
  }

  function verifyDepositSignature(
    address account,
    uint256 amount,
    uint32 nonce,
    string calldata transactionId,
    uint32 timestampLimit,
    bytes calldata signature
  ) private view returns (bool) {
    bytes32 messageHash = keccak256(
      abi.encode(account, amount, nonce, transactionId, timestampLimit)
    );
    address recover = messageHash.toEthSignedMessageHash().recover(signature);
    return recover == owner() || recover == verifier;
  }

  function depositSig(
    address account,
    uint256 amount,
    string calldata transactionId,
    uint32 timestampLimit,
    bytes calldata signature
  ) external {
    uint32 nonce = getNonce(account);
    if (!verifyDepositSignature(account, amount, nonce, transactionId, timestampLimit, signature)) {
      revert InvalidSignature();
    }
    _deposit(account, amount, nonce, transactionId, timestampLimit);
  }

  function refund(uint32 usersCount) external nonReentrant onlyOwner {
    uint32 userLength = (uint32)(_userAddresses.length);
    if (usersCount > userLength - _processedUserIndex) {
      usersCount = userLength - _processedUserIndex;
    }

    require(usersCount > 0, "all users processed");
    // require(expired || raiseConditionsNotMet, "not refundable");

    uint32 endIndex = _processedUserIndex + usersCount;
    for (uint i = _processedUserIndex; i < endIndex; i++) {
      address userAddress = _userAddresses[i];
      // User storage user = users[userAddress];
      // depositToken.safeTransfer(userAddress, user.contributionAmount);
      // emit Refund(userAddress, offeringId, user.contributionAmount);
    }
    _processedUserIndex = endIndex;
  }

  function withdrawExcessReward() external nonReentrant onlyOwner {
    uint256 amount = calculateExcessReward();
    address to = owner();
    erc20Token.safeTransfer(to, amount);
    emit WithdrawExcessReward(to, amount);
  }

  function changeBalanceLimit(uint256 _balanceLimit) external onlyOwner {
    balanceLimit = _balanceLimit;
    emit ChangeBalanceLimit(_msgSender(), _balanceLimit);
  }
}
