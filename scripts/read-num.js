const { deployContract } = require("ethereum-waffle");
const { ethers, network } = require("hardhat");
const {
  calculateSqrtPriceX96,
  calculatePriceFromX96,
  getNearestUsableTick,
  getWalletEthBalance,
} = require("../utils/V3Tools");

const bigDecimal = require("js-big-decimal");

async function main() {
  accounts = await ethers.getSigners(); // could also do with getNamedAccounts
  deployer = accounts[0];

  const V3Vault = await ethers.getContract("V3Vault");

  const randNum = await V3Vault.randNum();
  console.log(randNum);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
