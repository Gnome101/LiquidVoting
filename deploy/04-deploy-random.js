const { network, ethers } = require("hardhat");
const { verify } = require("../utils/verify");
module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  log("------------------------------------------------------------");
  //const decim = ethers.utils.parseEther("1");
  console.log("dep", deployer);
  //They deploy a governnace token first
  let args = [];
  const mockHog = await deploy("displayVotingPower", {
    from: deployer,
    args: args,
    log: true,
    blockConfirmations: 2,
  });
};

module.exports.tags = ["all", "rand", "Tokens"];
