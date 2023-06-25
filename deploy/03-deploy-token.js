const { network, ethers } = require("hardhat");
const { verify } = require("../utils/verify");
module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  log("------------------------------------------------------------");
  //const decim = ethers.utils.parseEther("1");
  console.log("dep", deployer);
  let args = ["HOG", "HOG", deployer];
  //They deploy a governnace token first
  const mockHog = await deploy("MockHog", {
    from: deployer,
    args: args,
    log: true,
    blockConfirmations: 2,
  });

  log("Verifying...");
  //await verify(mockHog.address, args);

  args = ["WETH", "WETH", deployer];

  const mockWeth = await deploy("MockWeth", {
    from: deployer,
    args: args,
    log: true,
    blockConfirmations: 2,
  });
};

module.exports.tags = ["all", "DAO", "Tokens"];
