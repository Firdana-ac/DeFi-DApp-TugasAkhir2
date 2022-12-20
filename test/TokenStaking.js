const { assert, use } = require('chai');
const { default: Web3 } = require('web3');

const DanzeToken = artifacts.require('DanzeToken');
const TokenStaking = artifacts.require('TokenStaking');

require('chai')
  .use(require('chai-as-promised'))
  .should();

//fungsi membantu untuk mengonversi token menjadi ether
function tokenCorvert(n) {
  return web3.utils.toWei(n, 'ether');
}

contract('TokenStaking', ([creator, user]) => {
  let danzeToken, tokenStaking;

  before(async () => {
    //Memuat kontrak
    danzeToken = await DanzeToken.new();
    tokenStaking = await TokenStaking.new(danzeToken.address);

    //transfer 500k to TokenStaking
    await danzeToken.transfer(tokenStaking.address, tokenCorvert('500000'));

    //mengirim beberapa token danze ke Pengguna di address[1] { explaining where it comes from}
    await danzeToken.transfer(user, tokenCorvert('2234'), {
      from: creator,
    });
  });

  // Test 1
  // 1.1 Memeriksa apakah kontrak Token memiliki nama yang sama seperti yang diharapkan
  describe('DanzeToken deployment', async () => {
    it('token deployed and has a name', async () => {
      const name = await danzeToken.name();
      assert.equal(name, 'DanzeToken');
    });
  });

  // Test 2
  // 2.1 Memeriksa apakah kontrak TokenStaking memiliki nama yang sama seperti yang diharapkan
  describe('TokenStaking deployment', async () => {
    it('staking contract deployed and has a name', async () => {
      const name = await tokenStaking.name();
      assert.equal(name, 'DANZE Token Staking DApp');
    });

    //2.2 memeriksa nilai apy default
    it('checking default APY value', async () => {
      const value = await tokenStaking.defaultAPY();
      assert.equal(value, '100', 'default APY set ke 100');
    });

    //2.3 memeriksa nilai apy 
    it('checking custom APY value', async () => {
      const value = await tokenStaking.customAPY();
      assert.equal(value, '137', 'custom APY set ke 137');
    });

    // 2.4 Memeriksa apakah kontrak TokenStaking memiliki 500k DanzeTokens
    it('staking contract has 500k DanzeTokens tokens inside', async () => {
      let balance = await danzeToken.balanceOf(tokenStaking.address);
      assert.equal(balance.toString(), tokenCorvert('500000'));
    });
  });

  // Test 3
  // 3.1 Menguji fungsi stakeTokens
  describe('TokenStaking stakeTokens function', async () => {
    let result;
    it('saldo pengguna sudah benar sebelum dipertaruhkan', async () => {
      result = await danzeToken.balanceOf(user);
      assert.equal(
        result.toString(),
        tokenCorvert('2234'),
        'saldo pengguna sudah benar sebelum dipertaruhkan'
      );
    });

    // 3.2 memeriksa total banalce TokenStaking
    it('memeriksa total yang dipertaruhkan sebelum staking', async () => {
      result = await tokenStaking.totalStaked();
      assert.equal(
        result.toString(),
        tokenCorvert('0'),
        'total staked seharusnya 0'
      );
    });

    // 3.3 Menguji fungsi stakeTokens
    it('approving tokens, staking tokens, checking balance', async () => {
      // pertama-tama setujui token yang akan dipertaruhkan
      await danzeToken.approve(tokenStaking.address, tokenCorvert('1000'), {
        from: user,
      });
      // stake tokens
      await tokenStaking.stakeTokens(tokenCorvert('1000'), { from: user });

      // periksa saldo pengguna jika mereka memiliki 0 setelah di staking
      result = await danzeToken.balanceOf(user);
      assert.equal(
        result.toString(),
        tokenCorvert('1234'),
        'Saldo pengguna setelah dipertaruhkan 1234'
      );
    });

    // 3.4 memeriksa saldo kontrak TokenStaking seharusnya 500k +1000
    it('memeriksa saldo kontrak setelah di staking', async () => {
      result = await danzeToken.balanceOf(tokenStaking.address);
      assert.equal(
        result.toString(),
        tokenCorvert('501000'),
        'Smart contract total balance setelah staking 1000'
      );
    });

    // 3.5 memeriksa saldo pengguna kontrak TokenStaking
    it('memeriksa saldo pengguna di dalam kontrak', async () => {
      result = await tokenStaking.stakingBalance(user);
      assert.equal(
        result.toString(),
        tokenCorvert('1000'),
        'Saldo kontrak pintar untuk pengguna'
      );
    });

    // 3.6 memeriksa saldo TokenStaking totalstaked
    it('mengecek total staked', async () => {
      result = await tokenStaking.totalStaked();
      assert.equal(
        result.toString(),
        tokenCorvert('1000'),
        'total staked seharusnya 1000'
      );
    });

    // 3.7 memeriksa fungsi isStaking untuk melihat apakah pengguna melakukan staking
    it('menguji apakah pengguna mempertaruhkan saat ini', async () => {
      result = await tokenStaking.isStakingAtm(user);
      assert.equal(result.toString(), 'true', 'pengguna saat ini yang staking');
    });

    // 3.8 memeriksa fungsi hasStaked untuk melihat apakah pengguna pernah mengintai
    it('pengujian jika pengguna telah di staking', async () => {
      result = await tokenStaking.hasStaked(user);
      assert.equal(result.toString(), 'true', 'pengguna telah staking');
    });
  });

  // Test 4
  describe('TokenStaking redistributeRewards function', async () => {
    let result;
    // 4.1 memeriksa siapa yang dapat mengeluarkan token
    it('memeriksa siapa yang dapat melakukan redistribusi', async () => {
      //issue tokens function from creator
      await tokenStaking.redistributeRewards({ from: creator });

      //mengeluarkan fungsi token dari pengguna, seharusnya tidak bisa
      await tokenStaking.redistributeRewards({ from: user }).should.be.rejected;
    });

    // 4.2 memeriksa saldo kontrak TokenStaking setelah redistribusi
    it('memeriksa saldo TokenStaking', async () => {
      result = await danzeToken.balanceOf(tokenStaking.address);
      assert.equal(
        result.toString(),
        tokenCorvert('500999'),
        'Smart contract total balance setelah staking 1000'
      );
    });

    // 4.3 periksa saldo pengguna setelah redistribusi seharusnya X / 1000
    it('memeriksa saldo pengguna', async () => {
      result = await danzeToken.balanceOf(user);
      assert.equal(
        result.toString(),
        tokenCorvert('1235'),
        'User total balance setelah redistribution 1 + 1234'
      );
    });
  });

  // Test 5
  describe('TokenStaking unstakeTokens function', async () => {
    let result;
    // 5.1 Menguji fungsi unstaking
    it('unstaking dan memeriksa saldo pengguna setelah unstake', async () => {
      await tokenStaking.unstakeTokens({ from: user });
      result = await danzeToken.balanceOf(user);
      assert.equal(
        result.toString(),
        tokenCorvert('2235'),
        'User balance setelah unstaking 1000 + 1235'
      );
    });

    // 5.2 memeriksa total saldo yang dipertaruhkan TokenStaking
    it('memeriksa total dipertaruhkan', async () => {
      result = await tokenStaking.totalStaked();
      assert.equal(
        result.toString(),
        tokenCorvert('0'),
        'total staked seharusnya 0'
      );
    });
  });

  // Test 6
  describe('TokenStaking [custom] staking/unstaking functions', async () => {
    let result;
    // 6.1 memeriksa TokenStaking total custom staking banalce
    it('memeriksa total taruhan yang dipertaruhkan sebelum staking', async () => {
      result = await tokenStaking.customTotalStaked();
      assert.equal(
        result.toString(),
        tokenCorvert('0'),
        'total staked seharusnya 0'
      );
    });

    // 6.2 memeriksa Saldo Pengguna sebelum mempertaruhkan
    it('checking users balance before staking', async () => {
      result = await danzeToken.balanceOf(user);
      assert.equal(
        result.toString(),
        tokenCorvert('2235'),
        'User balance setelah staking 2235'
      );
    });

    // 6.3 menguji apakah pengguna dapat mempertaruhkan taruhan khusus
    it('approving tokens, staking tokens, checking balance', async () => {
      // first approve tokens to be staked
      await danzeToken.approve(tokenStaking.address, tokenCorvert('1234'), {
        from: user,
      });
      // stake tokens
      await tokenStaking.customStaking(tokenCorvert('1234'), { from: user });

      // periksa saldo pengguna jika mereka memiliki 1001 setelah dipertaruhkan
      result = await danzeToken.balanceOf(user);
      assert.equal(
        result.toString(),
        tokenCorvert('1001'),
        'User balance setelah staking 1001'
      );
    });

    // 6.4 periksa saldo taruhan total khusus
    it('checking custom total staked', async () => {
      result = await tokenStaking.customTotalStaked();
      assert.equal(
        result.toString(),
        tokenCorvert('1234'),
        'total staked seharusnya 1234'
      );
    });

    // 6.5 memeriksa fungsi customIsStakingAtm untuk melihat apakah pengguna melakukan staking
    it('menguji apakah pengguna melakukan staking pada custom staking saat ini', async () => {
      result = await tokenStaking.customIsStakingAtm(user);
      assert.equal(result.toString(), 'true', 'pengguna saat ini sedang staking');
    });

    // 6.6 memeriksa fungsi customHasStaked untuk melihat apakah pengguna pernah mengintai
    it('menguji apakah pengguna telah melakukan staking pada custom staking', async () => {
      result = await tokenStaking.customHasStaked(user);
      assert.equal(result.toString(), 'true', 'user telah staked');
    });

    // 6.7 unstaking dari custom staking dan memeriksa saldo
    it('unstaking dari custom staking dan memeriksa saldo pengguna', async () => {
      await tokenStaking.customUnstake({ from: user });
      result = await danzeToken.balanceOf(user);
      assert.equal(
        result.toString(),
        tokenCorvert('2235'),
        'User balance setelah unstaking 1000 + 1235'
      );
    });
  });

  // Test 7
  describe('Claim Token', async () => {
    let result;
    // 7.1 testing claim danze token function
    it('mencoba mendapatkan 1000 token danze', async () => {
      await tokenStaking.claimToken({ from: user });

      result = await danzeToken.balanceOf(user);
      assert.equal(result.toString(), tokenCorvert('3235'), '2235 + 1000');
    });
  });

  // Test 8
  describe('Ubah nilai APY khusus', async () => {
    let result;

    // 8.1 menguji siapa yang dapat mengubah APY khusus
    it('memeriksa siapa yang dapat mengubah APY', async () => {
      await tokenStaking.changeAPY('200', { from: creator });
      // testing with invalid arguments
      await tokenStaking.changeAPY({ from: creator }).should.be.rejected;
      await tokenStaking.changeAPY(tokenCorvert('0'), { from: creator }).should
        .be.rejected;
      await tokenStaking.changeAPY(tokenCorvert('200'), { from: user }).should
        .be.rejected;
    });

    // 8.2 memeriksa Nilai APY kustom baru
    it('memeriksa nilai APY kustom baru', async () => {
      const value = await tokenStaking.customAPY();
      assert.equal(value, '200', 'custom APY set to 200 (0.2% Daily)');
    });
  });

  // Test 9
  describe('Menguji redistribusi hadiah APY khusus', async () => {
    let result;
    // 9.1 mendistribusikan ulang hadiah APY khusus
    it('staking at customStaking', async () => {
      await danzeToken.approve(tokenStaking.address, tokenCorvert('1000'), {
        from: user,
      });
      // stake tokens
      await tokenStaking.customStaking(tokenCorvert('1000'), { from: user });
      // memeriksa saldo pengguna setelah dipertaruhkan
      result = await danzeToken.balanceOf(user);
      assert.equal(
        result.toString(),
        tokenCorvert('2235'),
        'User balance setelah unstaking 3235 - 1000'
      );
    });
    // 9.2 mengeluarkan hadiah khusus
    it('redistributing rewards, mengecek hanya admin yang bisa mendistribusikan ulang', async () => {
      // terbitkan fungsi customRewards dari pencipta
      await tokenStaking.customRewards({ from: creator });

      // mengeluarkan fungsi customRewards dari pengguna, seharusnya tidak bisa
      await tokenStaking.customRewards({ from: user }).should.be.rejected;
    });
    // 9.2 memeriksa saldo pengguna baru setelah imbalan khusus
    it('checking user balance setelah custom APY rewards ', async () => {
      result = await danzeToken.balanceOf(user);
      assert.equal(
        result.toString(),
        tokenCorvert('2237'),
        'User balance setelah unstaking 2235 + 2'
      );
    });
  });
});

//to run test - truffle test
