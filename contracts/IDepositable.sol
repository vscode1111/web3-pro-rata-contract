// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

/**
 * @dev Interface of the Deposit contract.
 */
interface IDepositable {
  /**
   * @dev Returns the value of user count.
   */
  function getUserCount() external view returns (uint32);

  /**
   * @dev Returns the value of user count.
   */
  function getUserAddress(uint32 index) external view returns (address);

  /**
   * @dev Returns the user's deposited amount.
   */
  function getDepositedAmount(address account) external view returns (uint256);

  /**
   * @dev Returns the total deposited amount.
   */
  function getTotalDeposited() external view returns (uint256);
}
