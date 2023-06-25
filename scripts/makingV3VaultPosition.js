const { deployContract } = require("ethereum-waffle");
const { ethers, network } = require("hardhat");
const bigDecimal = require("js-big-decimal");

const {
  calculateSqrtPriceX96,
  calculatePriceFromX96,
  getNearestUsableTick,
  getWalletEthBalance,
  sleep,
} = require("../utils/V3Tools");
async function main() {
  accounts = await ethers.getSigners(); // could also do with getNamedAccounts
  deployer = accounts[0];
  const HOGWETHPool = await ethers.getContractAt(
    "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol:IUniswapV3Pool",
    "0x9a75BE84bD636E2F1FA8c14789072f3d71d90EDb"
  );
  const V3Vault = await ethers.getContract("V3Vault");
  const mockHog = await ethers.getContract("MockHog");
  const mockWeth = await ethers.getContract("MockWeth");
  console.log("HOG", HOGWETHPool.address);

  const slot0 = await HOGWETHPool.slot0();
  const tickSpacing = await HOGWETHPool.tickSpacing();
  let nearestTick = getNearestUsableTick(parseInt(slot0.tick), tickSpacing);
  //Choose arbitarry tick for testing
  const lowerTick = nearestTick - tickSpacing * 10;
  const upperTick = nearestTick + tickSpacing * 10;
  //I will need an NFT position manager
  const amountT0 = new bigDecimal(10 * 10 ** 18);

  const v3Info = {
    desiredPool: HOGWETHPool.address,
    centerTick: nearestTick,
    width: 10,
    userToken: mockWeth.address,
    token0AmountDesired: amountT0.getValue(),
    token1AmountDesired: amountT0.getValue(),
  };
  console.log("addy", mockWeth.address, mockHog.address);
  console.log(amountT0.getValue());
  console.log(HOGWETHPool.address);
  console.log("Now setting balances");
  const tx1 = await mockWeth.setBalance(deployer.address, amountT0.getValue());
  const tx2 = await mockHog.setBalance(deployer.address, amountT0.getValue());
  console.log("Finished, now approving token transfer");
  const tx3 = await mockWeth.approve(V3Vault.address, amountT0.getValue());
  const tx4 = await mockHog.approve(V3Vault.address, amountT0.getValue());
  console.log("Finished, now minting position");
  await tx1.wait();
  await tx2.wait();
  await tx3.wait();
  await tx4.wait();

  await V3Vault.mintPosition(v3Info);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
