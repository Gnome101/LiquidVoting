// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.3;
import "./vaults/V3Vault.sol";

contract displayVotingPower {
    uint256[] array = [1, 2, 3];
    address v3VaultAddress = 0xaD3d2dbAE27c6F17b76487ce0875c33d2047EFa4;

    function displayVotingPower1() public returns (uint256) {
        bytes memory ting = abi.encode(array);

        return
            V3Vault(v3VaultAddress).queryVotePower(
                msg.sender,
                block.number - 2,
                ting
            );
    }

    function displayVotingPower2(address user) public returns (uint256) {
        bytes memory ting = abi.encode(array);

        return
            V3Vault(v3VaultAddress).queryVotePower(
                user,
                block.number - 2,
                ting
            );
    }

    function displayVotingPower3(
        address user,
        uint256 blockNumber
    ) public returns (uint256) {
        bytes memory ting = abi.encode(array);

        return V3Vault(v3VaultAddress).queryVotePower(user, blockNumber, ting);
    }
}
