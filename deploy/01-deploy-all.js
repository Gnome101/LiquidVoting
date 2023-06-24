const { network } = require("hardhat");

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  log("------------------------------------------------------------");
  //const decim = ethers.utils.parseEther("1");
  let args = [];

  const timeLock = await deploy("PrimeNumberStorage", {
    from: deployer,
    args: args,
    log: true,
    blockConfirmations: 2,
  });
  console.log(timeLock.address);
  log("------------------------------------------------------------");
  args = [];
  const governanceSteering = await deploy("PrimeNumberStorage", {
    from: deployer,
    args: args,
    log: true,
    blockConfirmations: 2,
  });
  console.log(governanceSteering.address);
  log("------------------------------------------------------------");
  const votingVault = await deploy("PrimeNumberStorage", {
    from: deployer,
    args: args,
    log: true,
    blockConfirmations: 2,
  });
  console.log(votingVault.address);
};
module.exports.tags = ["all", "DAO", "Tools"];
