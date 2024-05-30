//SPDX-License-Identifier: MIT
pragma solidity =0.8.14;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract DAOPrefundingRaise is Ownable, ReentrancyGuard {
  using SafeERC20 for IERC20;
  using ECDSA for bytes32;

  uint internal constant EXPIRES_AFTER = 30 days;

  struct User {
    uint104 contributionAmount;
    uint64 daoPower;
    uint64 totalWeightingInLottery;
    uint16 tickets;
    bool isRegisteredInLottery;
  }
  mapping(address => User) public users;
  address[] public userAddresses;

  string public offeringId;
  uint public targetRaiseAmount;
  uint public registrationEndTime;
  uint public guaranteedRatio;

  IERC20 public immutable depositToken;
  address public immutable fundsCollector;
  address public immutable signer;
  uint public immutable minRaiseAmount;
  uint public immutable minTotalDaoPower;
  uint public immutable minRegistrationsCount;
  uint public immutable initialRegistrationEndTime;
  uint public immutable ticketSize;
  uint public immutable personalGasFee;

  uint public tickets;
  uint public totalContributionAmount;
  uint public totalContributionAmountInLottery;
  uint public totalGuaranteedContributionAmount;
  uint public totalFundsCollected;
  uint public totalDaoPower;
  uint public totalDaoPowerInLottery;
  uint public totalWeightingInLottery;
  uint public processedUserIndex;
  uint public guaranteedContributionIndex;
  bytes32 public randomHash;
  bool public lotteryForWinners;

  event Registration(address user, string offeringId, uint64 daoPower, uint contributionAmount);
  event Refund(address user, string offeringId, uint contributionAmount);
  event FundsCollection(
    address user,
    string offeringId,
    uint contributionAmount,
    uint excessiveAmount,
    uint daoPower
  );

  constructor(
    string memory _offeringId,
    IERC20 _depositToken,
    address _fundsCollector,
    address _signer,
    uint _ticketSize,
    uint _targetRaiseAmount,
    uint _minRaiseAmount,
    uint _minTotalDaoPower,
    uint _minRegistrationsCount,
    uint _registrationEndTime,
    uint _personalGasFee
  ) {
    uint _guaranteedRatio = 95000;

    require(address(_depositToken) != address(0));
    require(_fundsCollector != address(0));
    require(_signer != address(0));
    require(_targetRaiseAmount > 0);
    require(_targetRaiseAmount >= _minRaiseAmount);
    require(_registrationEndTime > block.timestamp);
    require(_registrationEndTime < block.timestamp + EXPIRES_AFTER); // ensure that it's not too much in the future
    require(_guaranteedRatio <= 100000);

    depositToken = _depositToken;
    fundsCollector = _fundsCollector;
    signer = _signer;
    ticketSize = _ticketSize;
    targetRaiseAmount = _targetRaiseAmount;
    minRaiseAmount = _minRaiseAmount;
    minTotalDaoPower = _minTotalDaoPower;
    minRegistrationsCount = _minRegistrationsCount;
    registrationEndTime = _registrationEndTime;
    guaranteedRatio = _guaranteedRatio;
    personalGasFee = _personalGasFee;
    offeringId = _offeringId;

    initialRegistrationEndTime = registrationEndTime;
  }

  // =================== OWNER FUNCTIONS  =================== //

  /**
   * Allows the owner to change the targetRaiseAmount.
   * @param newTargetRaiseAmount new targetRaiseAmount
   */
  function setTargetRaiseAmount(uint newTargetRaiseAmount) external onlyOwner {
    require(newTargetRaiseAmount > 0);
    require(newTargetRaiseAmount >= minRaiseAmount);
    require(block.timestamp < registrationEndTime);
    require(guaranteedContributionIndex == 0);

    targetRaiseAmount = newTargetRaiseAmount;
  }

  /**
   * Allows the owner to change the registration end time.
   * @param newRegistrationEndTime new registrationEndTime
   */
  function setRegistrationEndTime(uint newRegistrationEndTime) external onlyOwner {
    require(newRegistrationEndTime > block.timestamp);
    require(newRegistrationEndTime < initialRegistrationEndTime + EXPIRES_AFTER);
    require(guaranteedContributionIndex == 0);

    registrationEndTime = newRegistrationEndTime;
  }

  /**
   * Allows the owner to change the guaranteed ratio.
   * @param newGuaranteedRatio new guaranteedRatio
   */
  function setGuaranteedRatio(uint newGuaranteedRatio) external onlyOwner {
    require(newGuaranteedRatio <= 100000);
    require(guaranteedContributionIndex == 0);

    guaranteedRatio = newGuaranteedRatio;
  }

  // =================== EXTERNAL FUNCTIONS  =================== //

  /**
        Calculates users' guaranteed contribution amounts. 
        It must be done before collecting the funds if the raise is overfunded.
        @param usersCount Must be splittable into multiple TXs because of block gas limits
     */
  function setGuaranteedContributionAmounts(uint usersCount) external {
    if (usersCount > userAddresses.length - guaranteedContributionIndex) {
      usersCount = userAddresses.length - guaranteedContributionIndex;
    }

    require(usersCount > 0, "all users processed");
    require(totalContributionAmount > targetRaiseAmount, "not overfunded");
    _checkRaiseConditions();

    uint _totalDaoPowerInLottery = totalDaoPowerInLottery;
    uint _totalWeightingInLottery = totalWeightingInLottery;
    uint _totalContributionAmountInLottery;
    uint _totalGuaranteedContributionAmount;
    uint endIndex = guaranteedContributionIndex + usersCount;
    for (uint i = guaranteedContributionIndex; i < endIndex; i++) {
      address userAddress = userAddresses[i];
      User storage user = users[userAddress];

      if (user.isRegisteredInLottery) {
        user.totalWeightingInLottery = uint64(_totalWeightingInLottery);
        _totalDaoPowerInLottery += user.daoPower;
        _totalWeightingInLottery += _getWeightingInLottery(user);
        _totalContributionAmountInLottery += user.contributionAmount;
      } else {
        uint guaranteedContributionAmount = (user.daoPower * targetRaiseAmount * guaranteedRatio) /
          totalDaoPower /
          100000;
        if (user.contributionAmount < guaranteedContributionAmount) {
          guaranteedContributionAmount = user.contributionAmount;
        }
        _totalGuaranteedContributionAmount += guaranteedContributionAmount;
      }
    }
    totalDaoPowerInLottery = _totalDaoPowerInLottery;
    totalWeightingInLottery = _totalWeightingInLottery;
    totalContributionAmountInLottery += _totalContributionAmountInLottery;
    totalGuaranteedContributionAmount += _totalGuaranteedContributionAmount;
    guaranteedContributionIndex = endIndex;

    if (guaranteedContributionIndex == userAddresses.length && totalDaoPowerInLottery > 0) {
      (uint _tickets, bool _lotteryForWinners) = _calculateTickets();
      tickets = _tickets;
      lotteryForWinners = _lotteryForWinners;

      randomHash = keccak256(abi.encodePacked(block.timestamp, block.difficulty));
    }
  }

  /**
        Runs the lottery and selects winners/losers.
        It must be done before collecting the funds if the raise is overfunded.
        @param indexes Must be splittable into multiple TXs because of block gas limits
     */
  function runLottery(uint16[] calldata indexes) external {
    require(totalContributionAmount > targetRaiseAmount, "not overfunded");
    require(
      guaranteedContributionIndex == userAddresses.length,
      "final contribution amounts are not set"
    );
    require(tickets > 0, "all tickets were processed");

    uint _tickets = tickets;
    bytes32 _randomHash = randomHash;
    for (uint i = 0; i < indexes.length; i++) {
      User storage user = users[userAddresses[indexes[i]]];

      _randomHash = keccak256(abi.encodePacked(_randomHash));
      uint randomNumber = uint(_randomHash) % totalWeightingInLottery;
      uint userWeightingInLottery = _getWeightingInLottery(user);
      require(
        user.isRegisteredInLottery &&
          user.totalWeightingInLottery <= randomNumber &&
          (user.totalWeightingInLottery + userWeightingInLottery) > randomNumber,
        "index is not correct"
      );

      if (user.tickets < user.contributionAmount / ticketSize) {
        user.tickets++;
        _tickets--;
      }

      if (_tickets == 0) {
        break;
      }
    }
    tickets = _tickets;
    randomHash = _randomHash;
  }

  /**
        Sends raised funds to the fundsCollector and excessive amounts back to the users (if any).
        It reverts if some of the raise conditions haven't been satisfied (_checkRaiseConditions).
        @param usersCount Must be splittable into multiple TXs because of block gas limits
     */
  function collectFunds(uint usersCount) external nonReentrant {
    if (usersCount > userAddresses.length - processedUserIndex) {
      usersCount = userAddresses.length - processedUserIndex;
    }

    bool overfunded = totalContributionAmount > targetRaiseAmount;
    require(usersCount > 0, "all users processed");
    if (overfunded) {
      require(
        guaranteedContributionIndex == userAddresses.length,
        "final contribution amounts are not set"
      );
      require(tickets == 0, "lottery results are not set");
    }
    _checkRaiseConditions();

    (uint _tickets, ) = _calculateTickets();

    uint totalLotteryAmount;
    if (lotteryForWinners) {
      totalLotteryAmount = _tickets * ticketSize;
    } else {
      totalLotteryAmount = totalContributionAmountInLottery - _tickets * ticketSize;
    }
    uint totalExcessiveAmount = 0;
    uint totalExcessiveContributionAmount = 0;
    if (targetRaiseAmount - totalLotteryAmount > totalGuaranteedContributionAmount) {
      totalExcessiveAmount =
        targetRaiseAmount -
        totalLotteryAmount -
        totalGuaranteedContributionAmount;
    }
    if (
      totalContributionAmount - totalContributionAmountInLottery > totalGuaranteedContributionAmount
    ) {
      totalExcessiveContributionAmount =
        totalContributionAmount -
        totalContributionAmountInLottery -
        totalGuaranteedContributionAmount;
    }

    uint fundsCollected;
    uint endIndex = processedUserIndex + usersCount;
    for (uint i = processedUserIndex; i < endIndex; i++) {
      address userAddress = userAddresses[i];
      User storage user = users[userAddress];

      uint finalContributionAmount = user.contributionAmount;
      uint excessiveAmount;

      if (overfunded) {
        if (user.isRegisteredInLottery) {
          if (lotteryForWinners) {
            finalContributionAmount = user.tickets * ticketSize;
          } else {
            finalContributionAmount = user.contributionAmount - user.tickets * ticketSize;
          }
        } else {
          finalContributionAmount =
            (user.daoPower * targetRaiseAmount * guaranteedRatio) /
            totalDaoPower /
            100000;
          if (
            user.contributionAmount > finalContributionAmount &&
            totalExcessiveContributionAmount > 0
          ) {
            uint excessiveContributionAmount = user.contributionAmount - finalContributionAmount;
            finalContributionAmount +=
              (totalExcessiveAmount * excessiveContributionAmount) /
              totalExcessiveContributionAmount;
          } else {
            finalContributionAmount = user.contributionAmount;
          }
        }

        if (user.contributionAmount > finalContributionAmount) {
          excessiveAmount = user.contributionAmount - finalContributionAmount;
          depositToken.safeTransfer(userAddress, excessiveAmount);
        }
      }

      fundsCollected += finalContributionAmount;
      emit FundsCollection(
        userAddress,
        offeringId,
        finalContributionAmount,
        excessiveAmount,
        user.daoPower
      );
    }
    processedUserIndex = endIndex;

    totalFundsCollected += fundsCollected;
    depositToken.safeTransfer(fundsCollector, fundsCollected);

    _transferGasFee(usersCount * personalGasFee, true);
  }

  /**
        The sender registers for the raise and prefunds some amount of tokens (capped at maxContributionAmount).
        Participants can re-register multiple times as they can upgrade daoPower and maxContributionAmount.
        @param signature Owner's signature containing offeringId, user address, his daoPower and maxContributionAmount
        @param daoPower The sender's daoPower
        @param contributionAmount The amount of tokens
        @param maxContributionAmount The maximum amount that the sender can prefund
     */
  function register(
    bytes calldata signature,
    uint64 daoPower,
    uint104 contributionAmount,
    uint maxContributionAmount,
    bool isRegisteredInLottery
  ) external payable {
    _register(
      signature,
      daoPower,
      contributionAmount,
      maxContributionAmount,
      isRegisteredInLottery,
      msg.sender
    );
  }

  /**
        The sender registers other wallet for the raise and prefunds some amount of tokens (capped at maxContributionAmount).
        Participants can re-register multiple times as they can upgrade daoPower and maxContributionAmount.
        @param signature Owner's signature containing offeringId, user address, his daoPower and maxContributionAmount
        @param daoPower The sender's daoPower
        @param contributionAmount The amount of tokens
        @param maxContributionAmount The maximum amount that the sender can prefund
        @param applicant The wallet address that is registered
     */
  function registerFor(
    bytes calldata signature,
    uint64 daoPower,
    uint104 contributionAmount,
    uint maxContributionAmount,
    bool isRegisteredInLottery,
    address applicant
  ) external payable {
    _register(
      signature,
      daoPower,
      contributionAmount,
      maxContributionAmount,
      isRegisteredInLottery,
      applicant
    );
  }

  /**
        Sends back prefunded tokens to the participants if one or more of the raise conditions 
        haven't been satisfied (minRaiseAmount, minTotalDaoPower, minRegistrationsCount).
        @param usersCount Must be splittable into multiple TXs because of block gas limits
     */
  function refund(uint usersCount) external nonReentrant {
    if (usersCount > userAddresses.length - processedUserIndex) {
      usersCount = userAddresses.length - processedUserIndex;
    }

    bool raiseConditionsNotMet = block.timestamp > registrationEndTime &&
      (totalContributionAmount < minRaiseAmount ||
        totalDaoPower < minTotalDaoPower ||
        userAddresses.length < minRegistrationsCount);
    bool expired = block.timestamp > registrationEndTime + EXPIRES_AFTER;

    require(usersCount > 0, "all users processed");
    require(expired || raiseConditionsNotMet, "not refundable");

    uint endIndex = processedUserIndex + usersCount;
    for (uint i = processedUserIndex; i < endIndex; i++) {
      address userAddress = userAddresses[i];
      User storage user = users[userAddress];
      depositToken.safeTransfer(userAddress, user.contributionAmount);
      emit Refund(userAddress, offeringId, user.contributionAmount);
    }
    processedUserIndex = endIndex;

    _transferGasFee(usersCount * personalGasFee, !expired);
  }

  // =================== INTERNAL FUNCTIONS  =================== //

  function _register(
    bytes calldata signature,
    uint64 daoPower,
    uint104 contributionAmount,
    uint maxContributionAmount,
    bool isRegisteredInLottery,
    address applicant
  ) internal nonReentrant {
    User storage user = users[applicant];
    require(block.timestamp < registrationEndTime, "registration closed");

    if (isRegisteredInLottery && ticketSize > 0) {
      uint _tickets = (user.contributionAmount + contributionAmount) / ticketSize;
      require(
        _tickets > 0 && (_tickets * ticketSize) == (user.contributionAmount + contributionAmount),
        "contribution amount must be multiple of ticket size"
      );
    }

    require(user.contributionAmount + contributionAmount > 0, "0 contribution amount");
    if (user.contributionAmount == 0) {
      require(msg.value == personalGasFee, "not enough gas fee");
      userAddresses.push(applicant);
    } else {
      require(msg.value == 0);
    }

    _verifySignature(applicant, signature, daoPower, maxContributionAmount);
    _contribute(
      applicant,
      daoPower,
      contributionAmount,
      maxContributionAmount,
      isRegisteredInLottery
    );
    emit Registration(applicant, offeringId, daoPower, user.contributionAmount);
  }

  function _contribute(
    address applicant,
    uint64 daoPower,
    uint104 contributionAmount,
    uint maxContributionAmount,
    bool isRegisteredInLottery
  ) internal {
    User storage user = users[applicant];
    require(
      user.contributionAmount + contributionAmount <= maxContributionAmount,
      "contribution amount too high"
    );

    totalDaoPower -= user.daoPower;
    user.daoPower = daoPower;
    totalDaoPower += daoPower;

    if (contributionAmount > 0) {
      user.contributionAmount += contributionAmount;
      totalContributionAmount += contributionAmount;
      depositToken.safeTransferFrom(msg.sender, address(this), contributionAmount);
    }

    user.isRegisteredInLottery = isRegisteredInLottery;
  }

  function _transferGasFee(uint value, bool successRequired) internal {
    (bool success, ) = fundsCollector.call{value: value}("");
    if (successRequired) {
      require(success, "failed to send eth");
    }
  }

  // =================== VIEW FUNCTIONS  =================== //

  function getRaiseInfo()
    external
    view
    returns (IERC20, uint, uint, uint, uint, uint, uint, uint, uint, uint)
  {
    return (
      depositToken,
      targetRaiseAmount,
      minRaiseAmount,
      minTotalDaoPower,
      minRegistrationsCount,
      registrationEndTime,
      personalGasFee,
      totalContributionAmount,
      totalDaoPower,
      userAddresses.length
    );
  }

  function _getWeightingInLottery(User storage user) internal view returns (uint weighting) {
    uint guaranteedAllocation = (((targetRaiseAmount * guaranteedRatio) / 100000) * user.daoPower) /
      totalDaoPower;
    uint excessiveAllocation = 0;
    if (
      user.contributionAmount > guaranteedAllocation &&
      totalContributionAmount > ((targetRaiseAmount * guaranteedRatio) / 100000)
    ) {
      uint excessive = user.contributionAmount - guaranteedAllocation;
      uint totalExcessive = totalContributionAmount -
        ((targetRaiseAmount * guaranteedRatio) / 100000);
      if (excessive > totalExcessive) {
        excessive = totalExcessive;
      }
      excessiveAllocation =
        (((targetRaiseAmount * (100000 - guaranteedRatio)) / 100000) * excessive) /
        totalExcessive;
    }
    weighting = (guaranteedAllocation + excessiveAllocation) / 1e15;
  }

  function _verifySignature(
    address applicant,
    bytes calldata signature,
    uint daoPower,
    uint maxContributionAmount
  ) internal view {
    bytes32 dataHash = keccak256(
      abi.encodePacked(offeringId, applicant, daoPower, maxContributionAmount)
    );
    require(
      dataHash.toEthSignedMessageHash().recover(signature) == signer,
      "signature verification failed"
    );
  }

  function _checkRaiseConditions() internal view {
    require(block.timestamp > registrationEndTime, "registrations open");
    require(totalContributionAmount >= minRaiseAmount, "not enough contribution amount");
    require(totalDaoPower >= minTotalDaoPower, "not enough dao power");
    require(userAddresses.length >= minRegistrationsCount, "not enough registrations");
  }

  function _calculateTickets() internal view returns (uint _tickets, bool _lotteryForWinners) {
    if (ticketSize == 0) {
      return (0, true);
    }

    uint totalGuaranteedAllocation = (((targetRaiseAmount * guaranteedRatio) / 100000) *
      totalDaoPowerInLottery) / totalDaoPower;
    uint totalExcessiveAllocation = 0;
    if (
      totalContributionAmountInLottery > totalGuaranteedAllocation &&
      totalContributionAmount > ((targetRaiseAmount * guaranteedRatio) / 100000)
    ) {
      uint excessive = totalContributionAmountInLottery - totalGuaranteedAllocation;
      uint totalExcessive = totalContributionAmount -
        ((targetRaiseAmount * guaranteedRatio) / 100000);
      if (excessive > totalExcessive) {
        excessive = totalExcessive;
      }
      totalExcessiveAllocation =
        (((targetRaiseAmount * (100000 - guaranteedRatio)) / 100000) * excessive) /
        totalExcessive;
    }

    if (targetRaiseAmount > totalGuaranteedAllocation + totalExcessiveAllocation + ticketSize) {
      _tickets = (totalGuaranteedAllocation + totalExcessiveAllocation) / ticketSize + 1;
    } else {
      _tickets = targetRaiseAmount / ticketSize;
    }

    if (
      totalContributionAmount - totalContributionAmountInLottery <
      targetRaiseAmount - (_tickets * ticketSize)
    ) {
      _tickets =
        (targetRaiseAmount + totalContributionAmountInLottery - totalContributionAmount) /
        ticketSize;
    }

    if (_tickets > totalContributionAmountInLottery / ticketSize) {
      _tickets = totalContributionAmountInLottery / ticketSize;
    }

    if ((_tickets * ticketSize * 3) / 2 <= totalContributionAmountInLottery) {
      _lotteryForWinners = true;
    } else {
      _lotteryForWinners = false;
      _tickets = (totalContributionAmountInLottery - (_tickets * ticketSize)) / ticketSize;
    }
  }
}
