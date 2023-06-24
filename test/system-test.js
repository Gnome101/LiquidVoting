const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const {
  isCallTrace,
} = require("hardhat/internal/hardhat-network/stack-traces/message-trace");

const bigDecimal = require("js-big-decimal");
describe("Council Tests", function () {
  //This is every contract or that we will call on/use
  let hogToken, Treasury, timeLock, coreVoting;

  const ten = ethers.utils.parseEther("10");
  beforeEach(async () => {
    accounts = await ethers.getSigners(); // could also do with getNamedAccounts
    deployer = accounts[0];
    user = accounts[1];
    await deployments.fixture(["all"]);
    hogToken = await ethers.getContract("MockERC20");
    Treasury = await ethers.getContract("Treasury");
    timeLock = await ethers.getContract("Timelock");
    coreVoting = await ethers.getContract("CoreVoting");
  });
  it("all contracts exist", async () => {
    await hogToken.address;
    await Treasury.address;
    await timeLock.address;
    await coreVoting.address;
  });
});
