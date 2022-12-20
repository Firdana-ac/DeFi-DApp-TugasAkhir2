import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import classes from './App.module.css';
import DanzeToken from '../src/abis/DanzeToken.json';
import TokenStaking from '../src/abis/TokenStaking.json';
import Staking from './components/Staking';
import AdminTesting from './components/AdminTesting';
import Navigation from './components/Navigation';

const App = () => {
  const [account, setAccount] = useState('Connecting to Metamask..');
  const [network, setNetwork] = useState({ id: '0', name: 'none' });
  const [danzeTokenContract, setDanzeTokenContract] = useState('');
  const [tokenStakingContract, setTokenStakingContract] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [contractBalance, setContractBalance] = useState('0');
  const [totalStaked, setTotalStaked] = useState([0, 0]);
  const [myStake, setMyStake] = useState([0, 0]);
  const [appStatus, setAppStatus] = useState(true);
  const [loader, setLoader] = useState(false);
  const [userBalance, setUserBalance] = useState('0');
  const [apy, setApy] = useState([0, 0]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    //connecting to ethereum blockchain
    const ethEnabled = async () => {
      fetchDataFromBlockchain();
    };

    ethEnabled();
  }, []);

  const fetchDataFromBlockchain = async () => {
    if (window.ethereum) {
      // await window.ethereum.send('eth_requestAccounts');
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      window.web3 = new Web3(window.ethereum);

      //menghubungkan ke metamask
      let web3 = window.web3;
      const accounts = await web3.eth.getAccounts();
      setAccount(accounts[0]);

      //memuat ID dan jaringan pengguna
      const networkId = await web3.eth.net.getId();
      const networkType = await web3.eth.net.getNetworkType();
      setNetwork({ ...network, id: networkId, name: networkType });

      //loading DanzeToken contract data
      const danzeTokenData = DanzeToken.networks[networkId];
      if (danzeTokenData) {
        let web3 = window.web3;
        const danzeToken = new web3.eth.Contract(
          DanzeToken.abi,
          danzeTokenData.address
        );
        setDanzeTokenContract(danzeToken);
        //  melihat saldo Danzetoken dan menyimpannya dalam status
        let danzeTokenBalance = await danzeToken.methods
          .balanceOf(accounts[0])
          .call();
        let convertedBalance = window.web3.utils.fromWei(
          danzeTokenBalance.toString(),
          'Ether'
        );
        setUserBalance(convertedBalance);

        //Melihat saldo pada contract 
        //updating total staked balance
        const tempBalance = TokenStaking.networks[networkId];
        let totalStaked = await danzeToken.methods
          .balanceOf(tempBalance.address)
          .call();

        convertedBalance = window.web3.utils.fromWei(
          totalStaked.toString(),
          'Ether'
        );
        //removing initial balance
        setContractBalance(convertedBalance);
      } else {
        setAppStatus(false);
        window.alert(
          'DanzeToken contract is not deployed on this network, please change to testnet'
        );
      }

      //loading TokenStaking contract data
      const tokenStakingData = TokenStaking.networks[networkId];

      if (tokenStakingData) {
        let web3 = window.web3;
        const tokenStaking = new web3.eth.Contract(
          TokenStaking.abi,
          tokenStakingData.address
        );
        setTokenStakingContract(tokenStaking);
        //  fetching total staked TokenStaking  and storing in state
        let myStake = await tokenStaking.methods
          .stakingBalance(accounts[0])
          .call();

        let convertedBalance = window.web3.utils.fromWei(
          myStake.toString(),
          'Ether'
        );

        let myCustomStake = await tokenStaking.methods
          .customStakingBalance(accounts[0])
          .call();

        let tempCustomdBalance = window.web3.utils.fromWei(
          myCustomStake.toString(),
          'Ether'
        );

        setMyStake([convertedBalance, tempCustomdBalance]);

        //Mengecek totalStaked
        let tempTotalStaked = await tokenStaking.methods.totalStaked().call();
        convertedBalance = window.web3.utils.fromWei(
          tempTotalStaked.toString(),
          'Ether'
        );
        let tempcustomTotalStaked = await tokenStaking.methods
          .customTotalStaked()
          .call();
        let tempconvertedBalance = window.web3.utils.fromWei(
          tempcustomTotalStaked.toString(),
          'Ether'
        );
        setTotalStaked([convertedBalance, tempconvertedBalance]);

        // mengambil nilai APY dari kontrak
        let tempApy =
          ((await tokenStaking.methods.defaultAPY().call()) / 1000) * 365;
        let tempcustomApy =
          ((await tokenStaking.methods.customAPY().call()) / 1000) * 365;
        setApy([tempApy, tempcustomApy]);
      } else {
        setAppStatus(false);
        window.alert(
          'Kontrak TokenStaking tidak diterapkan di jaringan ini, harap ubah ke testnet'
        );
      }

      //removing loader
      setLoader(false);
    } else if (!window.web3) {
      setAppStatus(false);
      setAccount('Metamask tidak terdeteksi');
      setLoader(false);
    }
  };

  const inputHandler = (received) => {
    setInputValue(received);
  };

  const changePage = () => {
    if (page === 1) {
      setPage(2);
    } else if (page === 2) {
      setPage(1);
    }
  };

  const stakeHandler = () => {
    if (!appStatus) {
    } else {
      if (!inputValue || inputValue === '0' || inputValue < 0) {
        setInputValue('');
      } else {
        setLoader(true);
        let convertToWei = window.web3.utils.toWei(inputValue, 'Ether');

        //aproving tokens for spending
        danzeTokenContract.methods
          .approve(tokenStakingContract._address, convertToWei)
          .send({ from: account })
          .on('transactionHash', (hash) => {
            if (page === 1) {
              tokenStakingContract.methods
                .stakeTokens(convertToWei)
                .send({ from: account })
                .on('transactionHash', (hash) => {
                  setLoader(false);
                  fetchDataFromBlockchain();
                })
                .on('receipt', (receipt) => {
                  setLoader(false);
                  fetchDataFromBlockchain();
                })
                .on('confirmation', (confirmationNumber, receipt) => {
                  setLoader(false);
                  fetchDataFromBlockchain();
                });
            } else if (page === 2) {
              tokenStakingContract.methods
                .customStaking(convertToWei)
                .send({ from: account })
                .on('transactionHash', (hash) => {
                  setLoader(false);
                  fetchDataFromBlockchain();
                })
                .on('receipt', (receipt) => {
                  setLoader(false);
                  fetchDataFromBlockchain();
                })
                .on('confirmation', (confirmationNumber, receipt) => {
                  setLoader(false);
                  fetchDataFromBlockchain();
                });
            }
          })
          .on('error', function(error) {
            setLoader(false);
            console.log('Error Code:', error.code);
            console.log(error.message);
          });
        setInputValue('');
      }
    }
  };

  const unStakeHandler = () => {
    if (!appStatus) {
    } else {
      setLoader(true);

      // let convertToWei = window.web3.utils.toWei(inputValue, 'Ether')
      if (page === 1) {
        tokenStakingContract.methods
          .unstakeTokens()
          .send({ from: account })
          .on('transactionHash', (hash) => {
            setLoader(false);
            fetchDataFromBlockchain();
          })
          .on('receipt', (receipt) => {
            setLoader(false);
            fetchDataFromBlockchain();
          })
          .on('confirmation', (confirmationNumber, receipt) => {
            setLoader(false);
            fetchDataFromBlockchain();
          })
          .on('error', function(error) {
            console.log('Error Code:', error.code);
            console.log(error.message);
            setLoader(false);
          });

        setInputValue('');
      } else if (page === 2) {
        tokenStakingContract.methods
          .customUnstake()
          .send({ from: account })
          .on('transactionHash', (hash) => {
            setLoader(false);
            fetchDataFromBlockchain();
          })
          .on('receipt', (receipt) => {
            setLoader(false);
            fetchDataFromBlockchain();
          })
          .on('confirmation', (confirmationNumber, receipt) => {
            setLoader(false);
            fetchDataFromBlockchain();
          })

          .on('error', function(error) {
            console.log('Error Code:', error.code);
            console.log(error.message);
            setLoader(false);
          });
        setInputValue('');
      }
    }
  };

  const redistributeRewards = async () => {
    if (!appStatus) {
    } else {
      setLoader(true);
      tokenStakingContract.methods
        .redistributeRewards()
        .send({ from: account })
        .on('transactionHash', (hash) => {
          setLoader(false);
          fetchDataFromBlockchain();
        })
        .on('receipt', (receipt) => {
          setLoader(false);
          fetchDataFromBlockchain();
        })
        .on('confirmation', (confirmationNumber, receipt) => {
          setLoader(false);
          fetchDataFromBlockchain();
        })
        .on('error', function(error) {
          console.log('Error Code:', error.code);
          console.log(error.code);
          setLoader(false);
        });
    }
  };

  const redistributeCustomRewards = async () => {
    if (!appStatus) {
    } else {
      setLoader(true);
      tokenStakingContract.methods
        .customRewards()
        .send({ from: account })
        .on('transactionHash', (hash) => {
          setLoader(false);
          fetchDataFromBlockchain();
        })
        .on('receipt', (receipt) => {
          setLoader(false);
          fetchDataFromBlockchain();
        })
        .on('confirmation', (confirmationNumber, receipt) => {
          setLoader(false);
          fetchDataFromBlockchain();
        })
        .on('error', function(error) {
          console.log('Error Code:', error.code);
          console.log(error.code);
          setLoader(false);
        });
    }
  };

  const claimToken = async () => {
    if (!appStatus) {
    } else {
      setLoader(true);
      tokenStakingContract.methods
        .claimToken()
        .send({ from: account })
        .on('transactionHash', (hash) => {
          setLoader(false);
          fetchDataFromBlockchain();
        })
        .on('receipt', (receipt) => {
          setLoader(false);
          fetchDataFromBlockchain();
        })
        .on('confirmation', (confirmationNumber, receipt) => {
          setLoader(false);
          fetchDataFromBlockchain();
        })
        .on('error', function(error) {
          console.log('Error Code:', error.code);
          console.log(error.code);
          setLoader(false);
        });
    }
  };

  return (
    <div className={classes.Grid}>
      {loader ? <div className={classes.curtain}></div> : null}
      <div className={classes.loader}></div>
      <div className={classes.Child}>
        <Navigation apy={apy} changePage={changePage} />
        <div>
          <Staking
            account={account}
            totalStaked={page === 1 ? totalStaked[0] : totalStaked[1]}
            myStake={page === 1 ? myStake[0] : myStake[1]}
            userBalance={userBalance}
            unStakeHandler={unStakeHandler}
            stakeHandler={stakeHandler}
            inputHandler={inputHandler}
            apy={page === 1 ? apy[0] : apy[1]}
            page={page}
          />
        </div>
        <div className={classes.for_testing}>
          <AdminTesting
            network={network}
            tokenStakingContract={tokenStakingContract}
            contractBalance={contractBalance}
            redistributeRewards={
              page === 1 ? redistributeRewards : redistributeCustomRewards
            }
            claimToken={claimToken}
            page={page}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
