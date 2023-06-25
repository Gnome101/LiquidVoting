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

  const mockHog = await ethers.getContract("MockHog");
  const mockWeth = await ethers.getContract("MockWeth");
  const tokenAmount = new bigDecimal(1000 * 10 ** 18);
  await mockWeth.setBalance(
    "0x19d96301865fdD07427db3c445508A051BC6D352",
    tokenAmount.getValue()
  );
  await mockHog.setBalance(
    "0x19d96301865fdD07427db3c445508A051BC6D352",
    tokenAmount.getValue()
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
