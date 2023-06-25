const { network } = require("hardhat");

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  log("------------------------------------------------------------");
  //const decim = ethers.utils.parseEther("1");
  console.log("dep", deployer);
  const mockHog = "0x5fe9b2cacd42593408a49d97aa061a1666c595e9";
  const mockWeth = "0x963C7950B97e2ce301Eb49Fb1928aA5C7fe8e8eC";

  let args = [
    "0x963C7950B97e2ce301Eb49Fb1928aA5C7fe8e8eC",
    "0x5fe9b2cacd42593408a49d97aa061a1666c595e9",
    "0x963C7950B97e2ce301Eb49Fb1928aA5C7fe8e8eC",
    3000,
    "0xc36442b4a4522e871399cd717abdd847ab11fe88",
    "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    "0x35231d4c2D8B8ADcB5617A638A0c4548684c7C70", //Mailbox
    "0x56f52c0A1ddcD557285f7CBc782D3d83096CE1Cc", //Polygon
  ];
  const otherChainVault = await deploy("otherChainVault", {
    from: deployer,
    args: args,
    log: true,
    blockConfirmations: 2,
  });
};

module.exports.tags = ["all", "other", "Tools"];
