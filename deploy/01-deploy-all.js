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
  //await verify(mockWeth.address, args);
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
  //await verify(timeLock.address, args);

  console.log(timeLock.address);
  log("------------------------------------------------------------");
  args = [timeLock.address];
  const votingVault = await deploy("Treasury", {
    from: deployer,
    args: args,
    log: true,
    blockConfirmations: 2,
  });
  //await verify(votingVault.address, args);

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
  // await verify(friendlyVault.address, args);

  log("------------------------------------------------------------");

  args = [
    "0xc36442b4a4522e871399cd717abdd847ab11fe88",
    mockHog.address,
    mockWeth.address,
    3000, //Fee tier
    "0xc36442b4a4522e871399cd717abdd847ab11fe88", //NFT Position Manager
    "0x1F98431c8aD98523631AE4a59f267346ea31F984", //Factory
    "0xE8fF097481A54Ea1730c8828cf6B8F5eB3f64D85", //Vault on polygon
    "0x35231d4c2D8B8ADcB5617A638A0c4548684c7C70", //Factory
    "137", //Polygon Domain
  ];
  const V3Vault = await deploy("V3Vault", {
    from: deployer,
    args: args,
    log: true,
    blockConfirmations: 2,
  });
  //await verify(V3Vault.address, args);

  console.log("112");

  console.log(V3Vault.address);
  log("------------------------------------------------------------");
  args = [timeLock.address, 10, 10, nonAddy, [friendlyVault.address]];

  const coreVoting = await deploy("CoreVoting", {
    from: deployer,
    args: args,
    log: true,
    blockConfirmations: 2,
  });
  //await verify(coreVoting.address, args);

  console.log(coreVoting.address);
};

module.exports.tags = ["all", "DAO", "Tools"];
