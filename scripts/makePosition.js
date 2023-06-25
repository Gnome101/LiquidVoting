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

  let v3Info = {
    desiredPool: HOGWETHPool.address,
    centerTick: nearestTick,
    width: 10,
    userToken: mockWeth.address,
    token0AmountDesired: amountT0.getValue(),
    token1AmountDesired: amountT0.getValue(),
  };
  console.log(v3Info);
  const tx1 = await mockWeth.setBalance(deployer.address, amountT0.getValue());
  await tx1.wait();
  await sleep(3000);
  console.log("Tx1 finished");
  const tx2 = await mockHog.setBalance(deployer.address, amountT0.getValue());
  await tx2.wait();
  await sleep(3000);
  console.log("Tx2 finished");

  const tx3 = await mockWeth.approve(V3Vault.address, amountT0.getValue());
  await tx3.wait();

  await sleep(3000);
  console.log("Tx3 finished");

  const tx4 = await mockHog.approve(V3Vault.address, amountT0.getValue());
  await tx4.wait();
  console.log("Tx4 finished");

  await sleep(3000);

  await V3Vault.mintPosition(v3Info);
} //338374998097383714278

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
