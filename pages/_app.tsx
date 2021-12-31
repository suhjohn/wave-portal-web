import "../styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect, useState } from "react";

function MyApp({ Component, pageProps }: AppProps) {
  const onChainChange = async () => {
    // if (window.ethereum != undefined) {
    //   await window.ethereum.request({
    //     method: "wallet_switchEthereumChain",
    //     params: [{ chainId: "0x4" }], // chainId must be in hexadecimal numbers
    //   });
    // }
  };

  /*
   * This runs our function when the page loads.
   */
  useEffect(() => {
    onChainChange();
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
