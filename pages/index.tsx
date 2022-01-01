import type { NextPage } from "next";
import Head from "next/head";
import styles from "../styles/Home.module.scss";
import { useEffect, useState } from "react";
import { Maybe } from "@metamask/providers/dist/utils";
import { Contract, ethers } from "ethers";
import { ExternalProvider, Web3Provider } from "@ethersproject/providers";
import { BsChevronDown } from "react-icons/bs";
import ClipLoader from "react-spinners/ClipLoader";
import moment from "moment";
import abi from "../public/WavePortal.json";
import Collapsible from "react-collapsible";

declare global {
  interface Window {
    ethereum: ExternalProvider & Web3Provider;
  }
  interface Wave {
    waver: string;
    timestamp: number;
    message: string;
  }
  interface WaveCleaned {
    address: string;
    timestamp: Date;
    message: string;
  }
}

const Home: NextPage = () => {
  const [message, setMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState<WaveCleaned[]>([]);
  const [totalWaves, setTotalWaves] = useState(0);
  const contractAddress = "0x58842EDe38E87Edb78c900D36897C3A8bd15695B";
  /**
   * Create a variable here that references the abi content!
   */
  const contractABI = abi.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      /*
       * First make sure we have access to window.ethereum
       */
      if (typeof window === "undefined") {
        return;
      }
      const { ethereum } = window;
      if (
        ethereum == undefined ||
        ethereum == null ||
        ethereum.request == undefined
      ) {
        return null;
      }

      /*
       * Check if we're authorized to access the user's wallet
       */
      const accounts: Maybe<string[]> = await ethereum.request({
        method: "eth_accounts",
      });
      if (accounts == undefined || accounts == null) {
        return;
      }
      if (accounts.length > 0) {
        const account: string | undefined = accounts[0];
        if (account === undefined) {
          return;
        }
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.log(error);
    }
  };
  /**
   * Implement your connectWallet method here
   */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (
        ethereum == undefined ||
        ethereum == null ||
        ethereum.request == undefined
      ) {
        return;
      }

      const accounts: Maybe<string[]> = await ethereum.request({
        method: "eth_requestAccounts",
      });
      if (accounts == undefined || accounts == null) {
        return;
      }
      const account: string | undefined = accounts[0];
      if (account === undefined) {
        return;
      }
      console.log("Connected", account);
      setCurrentAccount(account);
    } catch (error) {
      console.log(error);
    }
  };

  const getContract = () => {
    const { ethereum } = window;
    if (
      ethereum == undefined ||
      ethereum == null ||
      ethereum.request == undefined
    ) {
      return null;
    }
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const wavePortalContract = new ethers.Contract(
      contractAddress,
      contractABI,
      signer
    );
    return wavePortalContract;
  };

  const fetchTotalWaves = async () => {
    const contract = getContract();
    if (contract == null) {
      return "loading";
    }
    const count = await contract.getTotalWaves();
    setTotalWaves(count.toNumber());
  };

  /*
   * Create a method that gets all waves from your contract
   */
  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        /*
         * Call the getAllWaves method from your Smart Contract
         */
        const waves: Wave[] = await wavePortalContract.getAllWaves();

        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        let wavesCleaned: WaveCleaned[] = [];
        waves.forEach((wave) => {
          wavesCleaned.unshift({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          });
        });

        /*
         * Store our data in React State
         */
        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const wave = async () => {
    try {
      const contract = getContract();
      if (contract == null) {
        return "loading";
      }
      /*
       * Execute the actual wave from your smart contract
       */
      setIsSendingMessage(true);
      const waveTxn = await contract.wave(message, { gasLimit: 300000 });
      console.log("Mining...", waveTxn.hash);
      await waveTxn.wait();
      console.log("Mined -- ", waveTxn.hash);

      setIsSendingMessage(false);
      setMessage("");
      fetchTotalWaves();
      getAllWaves();
    } catch (error) {
      console.log(error);
      setIsSendingMessage(false);
      setMessage("");
    }
  };

  const listenToEmitter = async () => {
    let wavePortalContract: Contract;

    const onNewWave = (from: string, timestamp: number, message: string) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  };

  /*
   * This runs our function when the page loads.
   */
  useEffect(() => {
    checkIfWalletIsConnected();
    listenToEmitter();
    fetchTotalWaves();
    getAllWaves();
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <div className={styles.mainContainer}>
          <div className={styles.mainContent}>
            <div className={styles.title}>Wave 👋</div>
            <div className={styles.descriptionContainer}>
              <p>A thread of waves on ethereum.</p>
            </div>
            {!currentAccount && (
              <button className="waveButton" onClick={connectWallet}>
                Connect Wallet
              </button>
            )}
            <div className={styles.waveInputContainer}>
              <input
                type="text"
                className={styles.waveMessageInput}
                placeholder="Say something nice..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <ClipLoader
                color={"#000000"}
                loading={isSendingMessage}
                size={24}
              />
              {!isSendingMessage && (
                <button className={styles.waveButton} onClick={wave}>
                  👋
                </button>
              )}
            </div>
          </div>

          <Collapsible
            trigger={[`${totalWaves} Waves`, <BsChevronDown />]}
            className={styles.waveList}
          >
            {allWaves.map((wave, index) => {
              return (
                <li key={index} className={styles.waveListItem}>
                  <div className={styles.waveListItemHeader}>
                    <p className={styles.waveListItemTimestamp}>
                      {moment(wave.timestamp).fromNow()}
                    </p>
                    <p className={styles.waveListItemAddress}>{wave.address}</p>
                  </div>
                  <div className={styles.waveListItemBody}>
                    <p>{wave.message}</p>
                  </div>
                </li>
              );
            })}
          </Collapsible>
        </div>
      </main>
      <div className={styles.footer}>
        <a href={`https://rinkeby.etherscan.io/address/${contractAddress}`}>
          Rinkeby address
        </a>
      </div>
    </div>
  );
};

export default Home;
