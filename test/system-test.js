const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

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
    hogToken = await ethers.getContract("LeveragedV3Manager");
    Treasury = await ethers.getContract("TokenAmountTools");
    timeLock = await ethers.getContract("PrimeNumberStorage");
    coreVoting = await ethers.getContract("V3UniRouteManager");
  });
});
