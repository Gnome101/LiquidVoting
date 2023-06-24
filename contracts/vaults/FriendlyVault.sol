// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.3;

import "../interfaces/IERC20.sol";
import "../libraries/History.sol";
import "../libraries/VestingVaultStorage.sol";
import "../libraries/Storage.sol";
import "../interfaces/IVotingVault.sol";
import "@aave/core-v3/contracts/mocks/tokens/MintableERC20.sol";

contract FriendlyVault is IVotingVault {
    // extraData encodes a uint128 of votes to give to the user via abi.encode
    function queryVotePower(
        address user,
        uint256 blockNumber,
        bytes calldata extraData
    ) external override returns (uint256) {
        uint128 votes = abi.decode(extraData, (uint128));
        return uint256(votes);
    }
}
