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

  const otherVault = await ethers.getContract("otherChainVault");
  const V3VaultAddy = "0xc1C87Bb2862ad5dD28d5846eD981c2c088893D2E";
  // address sender,
  // address destination,
  // uint256 gasAmount,
  // uint256 gasCount
  const value = ethers.utils.parseEther("0.002");
  console.log(value.toString());
  await otherVault.sendPositionInfo(
    deployer.address,
    V3VaultAddy,
    "200000",
    deployer.address,
    10,
    "338374998097383714278",
    -10,
    10,
    {
      value: ethers.utils.parseEther("0.002"),
    }
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
