/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect,useState } from "react";

import styles from './Portolio.module.css'
import CustomTable,{PoolData} from "./tables/index";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@apollo/client";
import {GET_User_Pdas} from '../../lib/joinApi'
import {Connection, PublicKey } from "@solana/web3.js";
import {
    Program,
    setProvider,
    AnchorProvider,
} from "@project-serum/anchor";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import {Spin} from 'antd'

export const JoinedPool:React.FC = () =>{
    window.Buffer = window.Buffer || require("buffer").Buffer;
    const {publicKey} = useWallet();
    const [spinning,setSpinning] = useState(true);
    const [arrLength,setArrLength] = useState(0)
    
    
    const user_pubkey = publicKey?.toString();
    const [poolDataState,setPoolDateState] = useState<PoolData[]>([])

    // const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const connection = new Connection('https://radial-nameless-county.solana-devnet.quiknode.pro/6bebb9ec55f87563cda3b23166b175e7fa3e2727/');
    const programId = new PublicKey( "FXdkYrxybRLydDdRFpyzMXwzJTCBc78UrNVX36pDPS9j");
    const anchorWallet = useAnchorWallet();
    const provider = new AnchorProvider(connection, anchorWallet as any, {});
    setProvider(provider);
    // 1.生成一个新的密钥对 2.获取智能合约公钥
    const IDL = require("../../idl/mts_pool.json");
    const program = new Program(IDL, programId);

    const queyUserPdas:any = useQuery(GET_User_Pdas,{
        variables: { user_pubkey }
    });

    const handleButtonClick = (record: any) => {
        console.log('Button clicked for record:', record);
    };

    useEffect(() => {
        if(poolDataState.length === arrLength) {
            setSpinning(false)
        }
    },[poolDataState.length])
    
    function newDataFun(el,mtspoolJson,layerJson, userJson) {
        console.log(el);
        let status = '',layerPda = '';
        console.log('------mtspoolJson----',mtspoolJson.toString() !== '{}');
        
        if(mtspoolJson.toString() !== '{}') {
            for(let k in mtspoolJson.poolStatus) {
                status = k
            }
            for(let k in layerJson) {
                console.log(k+':'+parseFloat(layerJson[k]));
                
            }
            console.log('mtspoolJson.layerPdas----',mtspoolJson.layerPdas);
            
            layerPda =!mtspoolJson?.layerPdas ? '' : mtspoolJson.layerPdas[mtspoolJson.layerPdas.length - 1].layerPda;
            console.log(status === 'investing' && el.user_pda !== layerPda);
            console.log(el.user_pda);
            console.log(layerPda);
        }
        
        
        
        
        const obj:PoolData = {
            id: !el.user_pda ? '--' : el.user_pda,
            poolAccount: !el.mts_pool_account?'--':el.mts_pool_account,
            poolSymbol: !el.mint_token_name ? '' : el.mint_token_name,
            poolStatus: !status ? '--' : status,
            layerNo:!layerJson.layerNo ? '--' : layerJson.layerNo,
            /**Redeemable: 如果Pool Status为0（Investing）且Layer No不是最后一层时，Redeemable为true；如果Pool Status为2（Settled）时，Redeemable为true；如果Pool Status为1（Stop Profit）时，Redeemable为false；如果Pool Status为0（Investing）且Layer No是最后一层时，Redeemable为false */
            redeemable: (status === 'investing' && el.user_pda !== layerPda) || status === 'settled' ? 'true' :'false',
            joinedAmount: !userJson.joinAmount? '--': parseFloat(userJson.joinAmount).toString(),
            redeemAmount:(parseFloat(userJson.allocedProfitAmt)+parseFloat(userJson.settledCostAmt)).toString(),
        }
        console.log(obj);
        
        setPoolDateState((old) => [...old,obj])
    }
    
    
    useEffect(() => {
        setSpinning(true)
        if(queyUserPdas?.data?.getUserPdas) {
            setArrLength(queyUserPdas?.data?.getUserPdas.length)
            console.log('queyUserPdas',program.account);
            queyUserPdas?.data?.getUserPdas.forEach(async el => {
                const acount = (new PublicKey(el.mts_pool_account))
                const layerpda = (new PublicKey(el.layer_pda))
                const userpda = (new PublicKey(el.user_pda))
                // const mtspool = await program.account.mtsPoolData.fetch(acount)
                // const layer = await program.account.mtsPoolLayerAccount.fetch(layerpda)
                // const user = await program.account.mtsLayerUserData.fetch(userpda)
                let [mtspool,layer,user] = [{},{},{}]
                try{
                    [mtspool,layer,user] =await Promise.all([
                        program.account.mtsPoolData.fetch(acount),
                        program.account.mtsPoolLayerAccount.fetch(layerpda),
                        program.account.mtsLayerUserData.fetch(userpda)
                   ])
                }catch(err) {
                    console.log(err);
                    
                }
                
                // const tx = await mtsdata(el.mts_pool_account)
                const mtspoolJson =JSON.parse(JSON.stringify(mtspool))
                const layerJson = JSON.parse(JSON.stringify(layer))
                const userJson = JSON.parse(JSON.stringify(user))
                console.log('mtspoolJson-----',mtspoolJson);
                console.log('layerJson-----',layerJson);
                console.log('userJson-----',userJson);
                
                newDataFun(el,mtspoolJson,layerJson,userJson)
            })
        }
        
    },[queyUserPdas]);

    

    return (
        // <Header></Header>
        <div className={styles['page-container']}>
            {/* <div className={styles['page-inner']}>
                <div style={{marginTop:'20px'}}> */}
                <Spin spinning={!publicKey ? false : spinning} tip="Loading...">
                    <CustomTable key='poollist' data={poolDataState} type='joinedPool' onButtonClick={handleButtonClick}/>
                </Spin>
                {/* </div>
            </div> */}
        </div>
    )
}