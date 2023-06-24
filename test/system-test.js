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
    friendlyVault = await ethers.getContract("FriendlyVault");
  });
  it("all contracts exist", async () => {
    hogToken.address;
    Treasury.address;
    timeLock.address;
    coreVoting.address;
    friendlyVault.address;
  });
  it("test creating a proposal 121", async () => {
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

    describe("v3 testing");
  });
});
