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
  const NFTPositionManager = await ethers.getContractAt(
    "INonfungiblePositionManager",
    "0xC36442b4a4522E871399CD717aBDD847Ab11FE88"
  );
  Factory = await ethers.getContractAt(
    "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol:IUniswapV3Factory",
    "0x1F98431c8aD98523631AE4a59f267346ea31F984"
  );
  const fee = 3000;
  const decimals = 18;
  //Price of one Hogwell in EPICDai
  let price = 1;
  let sqrtPrice;

  //Need to sort before hand of coruse
  let erc20Address = [mockWeth.address, mockHog.address];
  erc20Address = erc20Address.sort();

  if (erc20Address[0] == mockHog.address) {
    sqrtPrice = calculateSqrtPriceX96(price, decimals, decimals);
  } else {
    sqrtPrice = calculateSqrtPriceX96(1 / price, decimals, decimals);
  }
  //  This is important if the token already has liquidity or not
  const tx = await NFTPositionManager.createAndInitializePoolIfNecessary(
    erc20Address[0], // The token addresses need to be sorted
    erc20Address[1],
    fee,
    sqrtPrice.toFixed(0)
  );
  await tx.wait();
  console.log("Pool initialized");
  const realPrice = calculatePriceFromX96(sqrtPrice, decimals, decimals);
  Factory = await ethers.getContractAt(
    "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol:IUniswapV3Factory",
    "0x1F98431c8aD98523631AE4a59f267346ea31F984"
  );
  console.log("Hello");
  console.log(erc20Address[0], erc20Address[1], fee);
  const hogWEThPool = await Factory.getPool(
    erc20Address[1],
    erc20Address[0],
    fee
  );
  console.log("here112");

  //This is the address of the pool we just made
  const HOGWETHPool = await ethers.getContractAt(
    "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol:IUniswapV3Pool",
    hogWEThPool
  );
  //This the starting slot0 of the HOGWELL/EPIC pool I just made
  const slot0 = await HOGWETHPool.slot0();
  const tickSpacing = await HOGWETHPool.tickSpacing();
  let nearestTick = getNearestUsableTick(parseInt(slot0.tick), tickSpacing);
  //Choose arbitarry tick for testing
  const lowerTick = nearestTick - tickSpacing * 100;
  const upperTick = nearestTick + tickSpacing * 100;
  const token0Amount = new bigDecimal(100 * 10 ** 18);
  const token1Amount = new bigDecimal(100 * 10 ** 18);

  console.log(token0Amount.getValue());
  const timeStamp = (await ethers.provider.getBlock("latest")).timestamp;
  const tx1 = await mockWeth.setBalance(
    deployer.address,
    token0Amount.getValue()
  );
  const tx2 = await mockHog.setBalance(
    deployer.address,
    token0Amount.getValue()
  );

  const tx3 = await mockWeth.approve(
    NFTPositionManager.address,
    token0Amount.getValue()
  );
  const tx4 = await mockHog.approve(
    NFTPositionManager.address,
    token1Amount.getValue()
  );
  const mintParams = {
    token0: erc20Address[0],
    token1: erc20Address[1],
    fee: fee,
    tickLower: lowerTick,
    tickUpper: upperTick,
    amount0Desired: token0Amount.getValue(),
    amount1Desired: token1Amount.getValue(),
    amount0Min: 0,
    amount1Min: 0,
    recipient: deployer.address,
    deadline: timeStamp + 1000,
  };
  await tx1.wait();
  await tx2.wait();
  await tx3.wait();
  await tx4.wait();

  await NFTPositionManager.mint(mintParams);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
