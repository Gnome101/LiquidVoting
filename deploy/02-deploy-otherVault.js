const { network } = require("hardhat");

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  log("------------------------------------------------------------");
  //const decim = ethers.utils.parseEther("1");
  console.log("dep", deployer);
  const mockHog = "0x58b3541343adf4c920748032bA1425569591406A";
  const mockWeth = "0x6c82C6a018e71dB30FF9FE13579fafc681707f32";

  let args = [
    "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
    mockHog,
    mockWeth,
    3000,
    "0xc36442b4a4522e871399cd717abdd847ab11fe88", //NFT Position Manager
    "0xCC737a94FecaeC165AbCf12dED095BB13F037685", //Mailbox
    "0x8f9C3888bFC8a5B25AED115A82eCbb788b196d2a", //Gas
    421613,
  ];
  const otherChainVault = await deploy("otherChainVault", {
    from: deployer,
    args: args,
    log: true,
    blockConfirmations: 2,
  });
};

module.exports.tags = ["all", "other", "Tools"];
