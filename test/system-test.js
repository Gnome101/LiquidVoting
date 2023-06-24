const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const {
  isCallTrace,
} = require("hardhat/internal/hardhat-network/stack-traces/message-trace");

const {
  calculateSqrtPriceX96,
  calculatePriceFromX96,
  getNearestUsableTick,
  getWalletEthBalance,
} = require("../utils/V3Tools");

const bigDecimal = require("js-big-decimal");
describe("Council Tests", function () {
  //This is every contract or that we will call on/use
  let hogToken,
    Treasury,
    timeLock,
    coreVoting,
    mockWeth,
    HOGWETHPool,
    NFTPositionManager,
    V3Vault,
    Factory;

  const hundy = ethers.utils.parseEther("100");
  const ten = ethers.utils.parseEther("10");
  beforeEach(async () => {
    accounts = await ethers.getSigners(); // could also do with getNamedAccounts
    deployer = accounts[0];
    user = accounts[1];
    await deployments.fixture(["all"]);
    mockHog = await ethers.getContract("MockHog");
    mockWeth = await ethers.getContract("MockWeth");
    Treasury = await ethers.getContract("Treasury");
    timeLock = await ethers.getContract("Timelock");
    coreVoting = await ethers.getContract("CoreVoting");
    friendlyVault = await ethers.getContract("FriendlyVault");
    V3Vault = await ethers.getContract("V3Vault");
    NFTPositionManager = await ethers.getContractAt(
      "INonfungiblePositionManager",
      "0xc36442b4a4522e871399cd717abdd847ab11fe88"
    );
  });
  it("all contracts exist", async () => {
    hogToken.address;
    Treasury.address;
    timeLock.address;
    coreVoting.address;
    friendlyVault.address;
  });
  it("test creating a proposal", async () => {
    const abi = ethers.utils.defaultAbiCoder;
    const encodedData = abi.encode(["uint256"], ["100"]);
    console.log("Encoded Data", encodedData);
    const timeStamp = (await ethers.provider.getBlock("latest")).timestamp;
    const blankAddy =
      "0x0000000000000000000000000000000000000000000000000000000000000000";
    //console.log((await coreVoting.proposalCount).toString());

    let proposalCount = await coreVoting.proposalCount();
    console.log(proposalCount.toString());
    await coreVoting.proposal(
      [friendlyVault.address],
      [encodedData],
      [deployer.address],
      [blankAddy],
      timeStamp + 10000,
      0
    );
    proposalCount = await coreVoting.proposalCount();
    console.log(proposalCount.toString());

    const proposalInfo = await coreVoting.proposals(0);
    console.log(proposalInfo.toString());
  });
  describe("V3 testing", () => {
    let hog;
    beforeEach(async () => {
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
      //This is important if the token already has liquidity or not
      await NFTPositionManager.createAndInitializePoolIfNecessary(
        erc20Address[0], // The token addresses need to be sorted
        erc20Address[1],
        fee,
        sqrtPrice.toFixed(0)
      );

      const realPrice = calculatePriceFromX96(sqrtPrice, decimals, decimals);
      Factory = await ethers.getContractAt(
        "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol:IUniswapV3Factory",
        "0x1F98431c8aD98523631AE4a59f267346ea31F984"
      );

      const hogWEThPool = await Factory.getPool(
        erc20Address[0],
        erc20Address[1],
        fee
      );
      //This is the address of the pool we just made
      HOGWETHPool = await ethers.getContractAt(
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
      const token0Amount = new bigDecimal(10 ** 18);
      const token1Amount = new bigDecimal(10 ** 18);

      console.log(token0Amount.getValue());
      const timeStamp = (await ethers.provider.getBlock("latest")).timestamp;
      await mockWeth.setBalance(deployer.address, token0Amount.getValue());
      await mockHog.setBalance(deployer.address, token0Amount.getValue());

      await mockWeth.approve(
        NFTPositionManager.address,
        token0Amount.getValue()
      );
      await mockHog.approve(
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
      await NFTPositionManager.mint(mintParams);
    });
    it("user can build a v3 position 121", async () => {
      console.log("HOG", HOGWETHPool.address);
      const slot0 = await HOGWETHPool.slot0();
      const tickSpacing = await HOGWETHPool.tickSpacing();
      let nearestTick = getNearestUsableTick(parseInt(slot0.tick), tickSpacing);
      //Choose arbitarry tick for testing
      const lowerTick = nearestTick - tickSpacing * 50;
      const upperTick = nearestTick + tickSpacing * 50;
      //I will need an NFT position manager
      const amountT0 = new bigDecimal(10 * 10 ** 18);
      const v3Info = {
        desiredPool: HOGWETHPool.address,
        centerTick: nearestTick,
        width: 50,
        userToken: mockWeth.address,
        token0AmountDesired: amountT0.getValue(),
        token1AmountDesired: amountT0,
      };

      await V3Vault.mintPosition(v3Info);
    });
  });
});
