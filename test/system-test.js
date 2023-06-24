const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

const bigDecimal = require("js-big-decimal");
describe("Leveraged V3 Manager ", function () {
  //This is every contract or that we will call on/use
  let hogToken, Treasury, timeLock, coreVoting;

  const ten = ethers.utils.parseEther("10");
  beforeEach(async () => {
    accounts = await ethers.getSigners(); // could also do with getNamedAccounts
    deployer = accounts[0];
    user = accounts[1];
    await deployments.fixture(["all"]);
    hogToken = await ethers.getContract("LeveragedV3Manager");
    Treasury = await ethers.getContract("TokenAmountTools");
    timeLock = await ethers.getContract("PrimeNumberStorage");
    coreVoting = await ethers.getContract("V3UniRouteManager");

    playerLeveragedV3Manager = await ethers.getContract(
      "LeveragedV3Manager",
      user.address
    );
    EPICDAI = await ethers.getContract("EPICDAI");
    HOGWELL = await ethers.getContract("HOGWELL");

    PlayerEPICDAI = await ethers.getContract("EPICDAI", user.address);
    PlayerHOGWELL = await ethers.getContract("HOGWELL", user.address);
  });
});
