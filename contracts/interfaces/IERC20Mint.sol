// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.3;
import "./IERC20.sol";

interface IERC20Mint is IERC20 {
    function mint(address usr, uint256 value) external returns (bool);
}
