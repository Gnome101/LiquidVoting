// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.3;

import "../libraries/History.sol";
import "../libraries/Storage.sol";
import "./IERC721.sol";
import "./IVotingVault.sol";

import "../interfaces/INonfungiblePositionManager.sol";

contract NFTVault is IVotingVault {
    // Bring our libraries into scope
    using History for *;
    using Storage for *;

    // Only immutables can be declared without using the hash locations
    IERC721 immutable token;

    constructor(IERC721 _token) {
        token = _token;
    }

    /// @notice Returns the historical voting power tracker
    /// @return A struct which can push to and find items in block indexed storage
    function _votingPower()
        internal
        pure
        returns (History.HistoricalBalances memory)
    {
        // This call returns a storage mapping with a unique non overwrite-able storage location
        // which can be persisted through upgrades, even if they change storage layout
        return (History.load("votingPower"));
    }

    /// @notice Transfers one NFT of our collection to this contract and then adds one vote to the user's voting power
    /// @param tokenId The token Id, not the NFT to transfer.
    function deposit(uint256 tokenId) external {
        // Get the token from the user
        token.transferFrom(msg.sender, address(this), tokenId);
        // Get the hash pointer to the history mapping
        History.HistoricalBalances memory votingPower = _votingPower();
        // Load the user votes
        uint256 currentVotes = votingPower.loadTop(msg.sender);
        // Push their new voting power
        votingPower.push(msg.sender, currentVotes + 1);
    }

    /// @notice Attempts to load the voting power of a user
    /// @param user The address we want to load the voting power of
    /// @param blockNumber the block number at which we want the user's voting power
    /// @return the number of votes
    function queryVotePower(
        address user,
        uint256 blockNumber,
        bytes calldata
    ) external override returns (uint256) {
        // Get our reference to historical data
        History.HistoricalBalances memory votingPower = _votingPower();
        // Find the historical data in our mapping
        return votingPower.find(user, blockNumber);
    }
}
