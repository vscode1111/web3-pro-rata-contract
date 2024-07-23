// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library UsefulMath {
  function divisionRoundUp(uint256 x, uint256 y) internal pure returns (uint256) {
    return x / y + (x % y == 0 ? 0 : 1);
  }
}
