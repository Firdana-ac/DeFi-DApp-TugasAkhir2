const TokenStaking = artifacts.require('TokenStaking');

module.exports = async function(callback) {

  let yearly = process.argv[4] * 365;
  let APY = process.argv[4] * 1000;
  let tokenStaking = await TokenStaking.deployed();
  await tokenStaking.changeAPY(APY);

  console.log(
    `--- APY telah diubah menjadi ${process.argv[4]}% Perhari. (${yearly}% Pertahun) ---`
  );

  callback();
};

// for 0.1% Daily APY pass 0.1 as an argument
// to run script  -  truffle exec scripts/changeAPY.js 0.1
