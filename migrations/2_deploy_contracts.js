const DanzeToken = artifacts.require('DanzeToken');
const TokenStaking = artifacts.require('TokenStaking');

module.exports = async function(deployer, network, accounts) {
  //deploying Danzeoken
  await deployer.deploy(DanzeToken);
  //fetching back DanzeToken address
  const danzeToken = await DanzeToken.deployed();

  //deploying staking contract, passing token address
  await deployer.deploy(TokenStaking, danzeToken.address);
  const tokenStaking = await TokenStaking.deployed();

  //transfer 500k DanzeToken ke smart contract sebagai rewards
  await danzeToken.transfer(tokenStaking.address, '500000000000000000000000');

  //  Mengirim 1000 DanzeTokens ke User dan Creator
  await danzeToken.transfer(accounts[1], '1000000000000000000000');
};
