const { network } = require("hardhat");

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  log("------------------------------------------------------------");
  //const decim = ethers.utils.parseEther("1");
  console.log("dep", deployer);
  let args = ["HOG", "HOG", deployer];
  //They deploy a governnace token first
  const HOG = await deploy("MockHog", {
    from: deployer,
    args: args,
    log: true,
    blockConfirmations: 2,
  });
  args = ["WETH", "WETH", deployer];

  const mockWeth = await deploy("MockWeth", {
    from: deployer,
    args: args,
    log: true,
    blockConfirmations: 2,
  });

  //They deploy the GSC next, I will skip this because I cannot find its code
  // args = [];
  // const governanceSteering = await deploy("governanceSteering", {
  //   from: deployer,
  //   args: args,
  //   log: true,
  //   blockConfirmations: 2,
  // });
  // console.log(governanceSteering.address);
  log("------------------------------------------------------------");
  const nonAddy = "0x0000000000000000000000000000000000000000";
  args = [10, deployer, nonAddy];
  //I am setting the GSC as 0
  const timeLock = await deploy("Timelock", {
    from: deployer,
    args: args,
    log: true,
    blockConfirmations: 2,
  });
  console.log(timeLock.address);
  log("------------------------------------------------------------");
  args = [timeLock.address];
  const votingVault = await deploy("Treasury", {
    from: deployer,
    args: args,
    log: true,
    blockConfirmations: 2,
  });
  console.log(votingVault.address);
  log("------------------------------------------------------------");
  args = [];
  const friendlyVault = await deploy("FriendlyVault", {
    from: deployer,
    args: args,
    log: true,
    blockConfirmations: 2,
  });
  console.log(friendlyVault.address);
  log("------------------------------------------------------------");
  args = [timeLock.address, 10, 10, nonAddy, [friendlyVault.address]];

  const coreVoting = await deploy("CoreVoting", {
    from: deployer,
    args: args,
    log: true,
    blockConfirmations: 2,
  });
  console.log(coreVoting.address);
};

module.exports.tags = ["all", "DAO", "Tools"];
