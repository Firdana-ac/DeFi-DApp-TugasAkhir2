pragma solidity ^0.5.0;

import "./DanzeToken.sol";

contract TokenStaking {
    string public name = "DANZE Token Staking DApp";
    DanzeToken public danzeToken;

    //mendeklarasikan variabel status pemilik
    address public owner;

    //declaring default APY (default 0.1% daily or 36.5% APY yearly)
    uint256 public defaultAPY = 100;

    //declaring APY for custom staking ( default 0.137% daily or 50% APY yearly)
    uint256 public customAPY = 137;

    //declaring total staked
    uint256 public totalStaked;
    uint256 public customTotalStaked;

    //users staking balance
    mapping(address => uint256) public stakingBalance;
    mapping(address => uint256) public customStakingBalance;

    //memetakan daftar pengguna yang pernah staking
    mapping(address => bool) public hasStaked;
    mapping(address => bool) public customHasStaked;

    //memetakan daftar pengguna yang staking saat ini
    mapping(address => bool) public isStakingAtm;
    mapping(address => bool) public customIsStakingAtm;

    //array semua staker
    address[] public stakers;
    address[] public customStakers;

    constructor(DanzeToken _danzeToken) public payable {
        danzeToken = _danzeToken;

        //deployment token oleh owner
        owner = msg.sender;
    }

    //stake tokens function

    function stakeTokens(uint256 _amount) public {
        //Harus leibh dari 0
        require(_amount > 0, "Jumlah harus lebih dari 0");

        //User menambahkan danze tokens
        danzeToken.transferFrom(msg.sender, address(this), _amount);
        totalStaked = totalStaked + _amount;

        //pemetaan untuk memperbarui saldo staking untuk pengguna 
        stakingBalance[msg.sender] = stakingBalance[msg.sender] + _amount;

        //memeriksa apakah pengguna mempertaruhkan sebelumnya atau tidak
        if (!hasStaked[msg.sender]) {
            stakers.push(msg.sender);
        }

        //updating staking status
        hasStaked[msg.sender] = true;
        isStakingAtm[msg.sender] = true;
    }

    //unstake tokens function

    function unstakeTokens() public {
        //melihat saldo staking pada user

        uint256 balance = stakingBalance[msg.sender];

        //jumlah harus lebih dari 0
        require(balance > 0, "Jumlah harus lebih dari 0");

        //mentransfer token yang di staking kembali ke pengguna
        danzeToken.transfer(msg.sender, balance);
        totalStaked = totalStaked - balance;

        //menyetel ulang saldo staking pengguna
        stakingBalance[msg.sender] = 0;

        //updating staking status
        isStakingAtm[msg.sender] = false;
    }

    // different APY Pool
    function customStaking(uint256 _amount) public {
        require(_amount > 0, "harus lebih dari 0");
        danzeToken.transferFrom(msg.sender, address(this), _amount);
        customTotalStaked = customTotalStaked + _amount;
        customStakingBalance[msg.sender] =
            customStakingBalance[msg.sender] +
            _amount;

        if (!customHasStaked[msg.sender]) {
            customStakers.push(msg.sender);
        }
        customHasStaked[msg.sender] = true;
        customIsStakingAtm[msg.sender] = true;
    }

    function customUnstake() public {
        uint256 balance = customStakingBalance[msg.sender];
        require(balance > 0, "Jumlah harus lebih dari 0");
        danzeToken.transfer(msg.sender, balance);
        customTotalStaked = customTotalStaked - balance;
        customStakingBalance[msg.sender] = 0;
        customIsStakingAtm[msg.sender] = false;
    }

    //airdropp tokens
    function redistributeRewards() public {
        //hanya pemilik yang dapat mengeluarkan airdrop
        require(msg.sender == owner, "Hanya pembuat kontrak yang dapat mendistribusikan ulang");

        //melakukan drop untuk semua alamat
        for (uint256 i = 0; i < stakers.length; i++) {
            address recipient = stakers[i];

            //calculating daily apy untuk user
            uint256 balance = stakingBalance[recipient] * defaultAPY;
            balance = balance / 100000;

            if (balance > 0) {
                danzeToken.transfer(recipient, balance);
            }
        }
    }

    //customAPY airdrop
    function customRewards() public {
        require(msg.sender == owner, "Hanya pembuat kontrak yang dapat mendistribusikan ulang");
        for (uint256 i = 0; i < customStakers.length; i++) {
            address recipient = customStakers[i];
            uint256 balance = customStakingBalance[recipient] * customAPY;
            balance = balance / 100000;

            if (balance > 0) {
                danzeToken.transfer(recipient, balance);
            }
        }
    }

    //change APY value for custom staking
    function changeAPY(uint256 _value) public {
        //only owner can issue airdrop
        require(msg.sender == owner, "Hanya pembuat kontrak yang dapat merubah APY");
        require(
            _value > 0,
            "Nilai APY harus lebih dari 0, coba 100 untuk (0.100% perhari)"
        );
        customAPY = _value;
    }

    //cliam danze 1000 DNZ 
    function claimToken() public {
        address recipient = msg.sender;
        uint256 dnz = 1000000000000000000000;
        uint256 balance = dnz;
        danzeToken.transfer(recipient, balance);
    }
}
