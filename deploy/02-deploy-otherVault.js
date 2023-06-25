const { network } = require("hardhat");

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  log("------------------------------------------------------------");
  //const decim = ethers.utils.parseEther("1");
  console.log("dep", deployer);
  const mockHog = "0x963C7950B97e2ce301Eb49Fb1928aA5C7fe8e8eC";
  const mockWeth = "0x65dbc1F05bF843032c26355f42a6E9a703c75885";

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
