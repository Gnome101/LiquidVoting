// const { run } = require("hardhat");

// const verify = async (contractAddress, args) => {
//   console.log("Verifying contract...");
//   try {
//     await run("verify:verify", {
//       address: contractAddress,
//       constructorArguments: args,
//     });
//   } catch (e) {
//     if (e.message.toLowerCase().includes("already verified")) {
//       console.log("Already verified!");
//     } else {
//       console.log(e);
//     }
//   }
// };
// if (
//   !developmentChains.includes(network.name) &&
//   process.env.ETHERSCAN_API_KEY
// ) {
//   log("Verifying...");
//   await verify(ContractName.address, args);
// }
// module.exports = {
//   verify,
// };
