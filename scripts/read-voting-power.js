const { deployContract } = require("ethereum-waffle");
const { ethers, network } = require("hardhat");
async function main() {
  accounts = await ethers.getSigners(); // could also do with getNamedAccounts
  deployer = accounts[0];
  const V3Vault = await ethers.getContract("V3Vault");
  const display = await ethers.getContract("displayVotingPower");
  // const tokenIDs = await V3Vault.viewUserPosition(0);
  // console.log("IDS", tokenIDs.toString());

  let latestBlock = await ethers.provider.getBlock("latest");
  let latestBlockNum = latestBlock.number;
  console.log(latestBlockNum);
  const votingPower2 = await V3Vault.qVP(deployer.address, latestBlockNum + 1);
  console.log("Voting Power is", votingPower2.toString());

  // console.log((await gameClient.num()).toString())
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
