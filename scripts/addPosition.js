const { deployContract } = require("ethereum-waffle");
const { ethers, network } = require("hardhat");
const {
  calculateSqrtPriceX96,
  calculatePriceFromX96,
  getNearestUsableTick,
  getWalletEthBalance,
  sleep,
} = require("../utils/V3Tools");

const bigDecimal = require("js-big-decimal");

async function main() {
  accounts = await ethers.getSigners(); // could also do with getNamedAccounts
  deployer = accounts[0];

  const mockHog = await ethers.getContract("MockHog");
  const mockWeth = await ethers.getContract("MockWeth");
  //0x4893376342d5D7b3e31d4184c08b265e5aB2A3f6 is factory for arbgoerli
  const HOGWETHPool = await ethers.getContractAt(
    "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol:IUniswapV3Pool",
    "0xa74cd5e13431FF7969F5b8770fC121768b14607e"
  );
  const V3Vault = await ethers.getContract("V3Vault");
  console.log("HOG", HOGWETHPool.address);
  const slot0 = await HOGWETHPool.slot0();
  const tickSpacing = await HOGWETHPool.tickSpacing();
  let nearestTick = getNearestUsableTick(parseInt(slot0.tick), tickSpacing);
  //Choose arbitarry tick for testing
  const lowerTick = nearestTick - tickSpacing * 10;
  const upperTick = nearestTick + tickSpacing * 10;
  //I will need an NFT position manager
  let amountT0 = new bigDecimal(10 * 10 ** 18);

  console.log(v3Info);
  await V3Vault.addPosition(deployer.address, 10, 1000, -100, 100);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
