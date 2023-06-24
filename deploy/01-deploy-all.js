const { network } = require("hardhat");

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  log("------------------------------------------------------------");
  //const decim = ethers.utils.parseEther("1");
  let args = [];

  const timeLock = await deploy("TimeLock", {
    from: deployer,
    args: args,
    log: true,
    blockConfirmations: 2,
  });
  console.log(timeLock.address);
  log("------------------------------------------------------------");
  args = [];
  const governanceSteering = await deploy("governanceSteering", {
    from: deployer,
    args: args,
    log: true,
    blockConfirmations: 2,
  });
  console.log(governanceSteering.address);
  log("------------------------------------------------------------");
  const votingVault = await deploy("votingVault", {
    from: deployer,
    args: args,
    log: true,
    blockConfirmations: 2,
  });
  console.log(votingVault.address);
  log("------------------------------------------------------------");

  const coreVoting = await deploy("coreVoting", {
    from: deployer,
    args: args,
    log: true,
    blockConfirmations: 2,
  });
  console.log(coreVoting.address);
};
};
module.exports.tags = ["all", "DAO", "Tools"];
