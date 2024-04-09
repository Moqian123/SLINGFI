import React from 'react';
import styles from "./App.module.css";
import RouterView from './router';
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";

function App() {
  const network = WalletAdapterNetwork.Devnet;
  console.log('nextwork,',network);
  
  const endpoint = clusterApiUrl(network);
  const wallets = [
    // new SolongWalletAdapter(),
    new PhantomWalletAdapter(),
  ];
  return (
      <div className={styles.App}>
        <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
              <RouterView></RouterView>
        </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
      </div>
  );
}

export default App;
