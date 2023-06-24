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
const { deployContract } = require("ethereum-waffle");
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
    it("user can build a v3 position ", async () => {
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
      await mockWeth.setBalance(deployer.address, amountT0.getValue());
      await mockHog.setBalance(deployer.address, amountT0.getValue());

      await mockWeth.approve(V3Vault.address, amountT0.getValue());
      await mockHog.approve(V3Vault.address, amountT0.getValue());

      await V3Vault.mintPosition(v3Info);

      let latestBlock = await ethers.provider.getBlock("latest");
      let latestBlockNum = latestBlock.number;
      const blankAddy =
        "0x0000000000000000000000000000000000000000000000000000000000000000";
      const votingPower = await V3Vault.queryVotePower(
        deployer.address,
        latestBlockNum + 1,
        blankAddy
      );
      console.log(votingPower.toString());
      //71794946851985505209 with 50 width
      //338374998097383714278 with 10 width

      SwapRouter = await ethers.getContractAt(
        "ISwapRouter",
        "0xE592427A0AEce92De3Edee1F18E0157C05861564"
      );
      const swapAmount = new bigDecimal(11 * 10 ** 18);

      mockHog.approve(SwapRouter.address, swapAmount.getValue());
      mockHog.setBalance(deployer.address, swapAmount.getValue());
      const timeStamp = (await ethers.provider.getBlock("latest")).timestamp;

      const ExactInputSingleParams = {
        tokenIn: mockHog.address,
        tokenOut: mockWeth.address,
        fee: "3000",
        recipient: deployer.address,
        deadline: timeStamp + 1000, //Timestamp is in seconds
        amountIn: swapAmount.getValue(),
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0,
      };

      await SwapRouter.exactInputSingle(ExactInputSingleParams);

      console.log((await HOGWETHPool.slot0()).toString());
      console.log(lowerTick, upperTick);
      latestBlock = await ethers.provider.getBlock("latest");
      latestBlockNum = latestBlock.number;
      const votingPower2 = await V3Vault.queryVotePower(
        deployer.address,
        latestBlockNum + 2,
        blankAddy
      );
      console.log(votingPower2.toString());
    });
    it("user can build a v3 position ", async () => {
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

      await mockWeth.setBalance(deployer.address, amountT0.getValue());
      await mockHog.setBalance(deployer.address, amountT0.getValue());

      await mockWeth.approve(V3Vault.address, amountT0.getValue());
      await mockHog.approve(V3Vault.address, amountT0.getValue());

      await V3Vault.mintPosition(v3Info);
      amountT0 = new bigDecimal(20 * 10 ** 18);

      v3Info = {
        desiredPool: HOGWETHPool.address,
        centerTick: nearestTick,
        width: 40,
        userToken: mockWeth.address,
        token0AmountDesired: amountT0.getValue(),
        token1AmountDesired: amountT0.getValue(),
      };
      await mockWeth.setBalance(deployer.address, amountT0.getValue());
      await mockHog.setBalance(deployer.address, amountT0.getValue());

      await mockWeth.approve(V3Vault.address, amountT0.getValue());
      await mockHog.approve(V3Vault.address, amountT0.getValue());

      await V3Vault.mintPosition(v3Info);
      //338374998097383714278
      //338374998097383714278
      let latestBlock = await ethers.provider.getBlock("latest");
      let latestBlockNum = latestBlock.number;
      const blankAddy =
        "0x0000000000000000000000000000000000000000000000000000000000000000";
      const votingPower = await V3Vault.queryVotePower(
        deployer.address,
        latestBlockNum + 1,
        blankAddy
      );
      console.log(votingPower.toString());
      //71794946851985505209 with 50 width
      //338374998097383714278 with 10 width

      SwapRouter = await ethers.getContractAt(
        "ISwapRouter",
        "0xE592427A0AEce92De3Edee1F18E0157C05861564"
      );
      const swapAmount = new bigDecimal(17 * 10 ** 18);

      mockHog.approve(SwapRouter.address, swapAmount.getValue());
      mockHog.setBalance(deployer.address, swapAmount.getValue());
      const timeStamp = (await ethers.provider.getBlock("latest")).timestamp;

      const ExactInputSingleParams = {
        tokenIn: mockHog.address,
        tokenOut: mockWeth.address,
        fee: "3000",
        recipient: deployer.address,
        deadline: timeStamp + 1000, //Timestamp is in seconds
        amountIn: swapAmount.getValue(),
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0,
      };

      await SwapRouter.exactInputSingle(ExactInputSingleParams);

      console.log((await HOGWETHPool.slot0()).toString());
      console.log(lowerTick, upperTick);
      latestBlock = await ethers.provider.getBlock("latest");
      latestBlockNum = latestBlock.number;
      const votingPower2 = await V3Vault.queryVotePower(
        deployer.address,
        latestBlockNum + 2,
        blankAddy
      );
      console.log(votingPower2.toString());
    });
  });
  describe("Spark testing 121", () => {
    it("I can interact with spark", async () => {
      //Pool is the main user facing
      const daiToken = await ethers.getContractAt(
        "IERC20Mint",
        "0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844"
      );
      const wethToken = await ethers.getContractAt(
        "IERC20Mint",
        "0x7D5afF7ab67b431cDFA6A94d50d3124cC4AB2611"
      );

      const Pool = await ethers.getContractAt(
        "@aave/core-v3/contracts/interfaces/IPool.sol:IPool",
        "0x7D5afF7ab67b431cDFA6A94d50d3124cC4AB2611"
      );

      // const sDAi = await ethers.getContractAt(
      //   "@aave/core-v3/contracts/interfaces/IPool.sol:IPool",
      //   "0x7D5afF7ab67b431cDFA6A94d50d3124cC4AB2611"
      // );
      console.log(await daiToken.name());
      console.log(await wethToken.name());
      const mintAmount = new bigDecimal(100 * 10 ** 18);
      await daiToken.mint(deployer.address, mintAmount.getValue());
      console.log(
        "Bal",
        (await daiToken.balanceOf(deployer.address)).toString()
      );
      // const supplyAmount = new bigDecimal(20 * 10 ** 18);
      // await daiToken.approve(Pool.address, supplyAmount);
      // await Pool.supply(daiToken.address, supplyAmount, deployer.address, 0);
      // console.log("here");
      // await Pool.getUserAccountData(deployer.address);
    });
  });
});
