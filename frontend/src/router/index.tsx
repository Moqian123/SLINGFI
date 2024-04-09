import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import style from "./index.module.css";
import { Header } from "../components";
import { Home, Create, PoolList, Portolio, Join } from "../page";
// import {
//   ConnectionProvider,
//   WalletProvider,
// } from "@solana/wallet-adapter-react";
// import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
// import { clusterApiUrl } from "@solana/web3.js";
// import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
// import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";

export default function RouterView() {
  // const network = WalletAdapterNetwork.Devnet;
  // console.log('nextwork,',network);
  
  // const endpoint = clusterApiUrl(network);
  // const wallets = [
  //   // new SolongWalletAdapter(),
  //   new PhantomWalletAdapter(),
  // ];
  return (
    <Router>
      {/* <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <div> */}
              <Header />
              <div className={style["page-container"]}>
                <Routes>
                  <Route
                    path="/"
                    element={
                      <Suspense fallback={<div>loading</div>}>
                        <Home />
                      </Suspense>
                    }
                  ></Route>
                  <Route
                    path="/PoolList"
                    element={
                      <Suspense fallback={<div>loading</div>}>
                        <PoolList />
                      </Suspense>
                    }
                  ></Route>
                  <Route
                    path="/Create"
                    element={
                      <Suspense fallback={<div>loading</div>}>
                        <Create />
                      </Suspense>
                    }
                  ></Route>
                  <Route
                    path="/Portolio"
                    element={
                      <Suspense fallback={<div>loading</div>}>
                        <Portolio />
                      </Suspense>
                    }
                  ></Route>
                  <Route
                    path="/Join"
                    element={
                      <Suspense fallback={<div>loading</div>}>
                        <Join />
                      </Suspense>
                    }
                  ></Route>
                </Routes>
              </div>
            {/* </div>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider> */}
    </Router>
  );
}
