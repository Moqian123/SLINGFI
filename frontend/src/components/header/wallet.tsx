import React from "react";
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

import { WalletModalProvider,WalletMultiButton} from '@solana/wallet-adapter-react-ui';
import "@solana/wallet-adapter-react-ui/styles.css";
import { clusterApiUrl } from '@solana/web3.js';

// import {SolongWalletAdapter} from '@solana/wallet-adapter-solong'
import {PhantomWalletAdapter} from '@solana/wallet-adapter-phantom';
// import store from "../../redux/store";
// import {changePublickeyActionCreator} from '../../redux/publicKey/publickActions'

export const WalletBtn:React.FC = () => {
    const network = WalletAdapterNetwork.Devnet;
    // const network = 'https://radial-nameless-county.solana-devnet.quiknode.pro/6bebb9ec55f87563cda3b23166b175e7fa3e2727/';
    
    // You can also provide a custom RPC endpoint. https://api.devnet.solana.com
    const endpoint =  clusterApiUrl(network);
    console.log('network=====',endpoint);
    // wallets num
    const wallets =[
        // new SolongWalletAdapter(),
        new PhantomWalletAdapter(),
    ];
    return (
        <>
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <WalletMultiButton />
                    {/* <DisplayPublicKey /> */}
                </WalletModalProvider>
            </WalletProvider>
         </ConnectionProvider>
        </>
    )
}
  
// const DisplayPublicKey: React.FC = () => {
//     const { publicKey } = useWallet();
//     const pub = !publicKey ? '' : publicKey.toBase58();
//     const action = changePublickeyActionCreator(pub)
//     store.dispatch(action)
//     return <></>;
// };