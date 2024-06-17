// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

/**
 * @dev Interface of the Deposit contract.
 */
interface IDepositable {
  /**
   * @dev Returns the value of account count.
   */
  function getAccountCount() external view returns (uint32);

  /**
   * @dev Returns the account by index.
   */
  function getAccountByIndex(uint32 index) external view returns (address);

  /**
   * @dev Returns the account's deposited amount.
   */
  function getAccountDepositAmount(address account) external view returns (uint256);

  /**
   * @dev Returns the total deposited amount.
   */
  function getTotalDeposited() external view returns (uint256);
}
