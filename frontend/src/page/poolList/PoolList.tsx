/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";

import styles from './PoolList.module.css'

// import CountUp from 'react-countup'
// import { Tooltip, Typography } from 'antd';
// import  {QuestionCircleOutlined} from '@ant-design/icons'
import CustomTable, {PoolData} from './tables'
import { useQuery } from "@apollo/client";
import {GET_POOLACCOUNT}from '../../lib/poolMarketApi'
// import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import {
    Program,
    setProvider,
    AnchorProvider,
  } from "@project-serum/anchor";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useNavigate } from 'react-router-dom';
import {Spin} from 'antd'

export const PoolList:React.FC = () =>{
    window.Buffer = window.Buffer || require("buffer").Buffer;
    const [poolDataState,setPoolDateState] = useState<PoolData[]>([])
    const [spinning,setSpinning] = useState(true);
    const [arrLength,setArrLength] = useState(0)
    const getPoolAccount = useQuery(GET_POOLACCOUNT);
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const programId = new PublicKey( "FXdkYrxybRLydDdRFpyzMXwzJTCBc78UrNVX36pDPS9j");
    const anchorWallet = useAnchorWallet();
    const naviget = useNavigate();
    
    const provider = new AnchorProvider(connection, anchorWallet as any, {});
    setProvider(provider);
    // 1.生成一个新的密钥对 2.获取智能合约公钥
    const IDL = require("../../idl/mts_pool.json");
    const program = new Program(IDL, programId);
    
    const handleButtonClick = (record: any) => {
        const params = {
            ...record,
            layer_account:record.layerPdas[record.layerPdas.length - 1].layerPda
        }
        const queryString = new URLSearchParams(params).toString();
        naviget(`/Join?${queryString}`);
        console.log('Button clicked for record:', record);
        
    };
    
    function newDataFun(el,tx) {
        console.log(el);
        
        const obj:PoolData = {
            id:el.id,
            POOL_ID:el.mts_pool_account,
            // Mint_Token:el.mint_token,
            Mint_Token_name:el.mint_token_name,
            TVL:!parseInt(tx.tokenAmountSum) ? '--' : parseInt(tx.tokenAmountSum),
            Curent_Layer:!tx.layerPdas ? '--' : tx.layerPdas[tx.layerPdas.length - 1].layerNo.toString(),
            Goal_Profit_Ratio:!tx.goalProfRat ? '--' : tx.goalProfRat.toString(),
            Profit_Share_Percent:!tx.profSharePect ? '--' : tx.profSharePect.toString(),
            status:el.pool_state === '0' ? 'Investing':(el.pool_state === '1'? 'StopedProfit':'Settled'),
            ...el,
            ...tx,
        }
        setPoolDateState((old) => [...old,obj])
    }
    useEffect(() => {
        setSpinning(true)
        if(getPoolAccount?.data) {
            setArrLength(getPoolAccount.data.poolAccounts.length)
            getPoolAccount.data.poolAccounts.forEach(async el => {
                let tx = {} 
                try {
                    const acount = (new PublicKey(el.mts_pool_account))
                    tx = await program.account.mtsPoolData.fetch(acount)
                }catch(err){
                    console.log(err);
                }
                
                // const tx = await mtsdata(el.mts_pool_account)
                const txJson = !tx ? {} : JSON.parse(JSON.stringify(tx))
                
                newDataFun(el,txJson)
            })
        }
    },[getPoolAccount.data]);

    useEffect(() => {
        if(poolDataState.length === arrLength) {
            setSpinning(false)
        }
    },[poolDataState.length]);
    return (
        // <Header></Header>
        <div className={styles['page-container']}>
            <div className={styles['page-inner']}>
                <div className={styles['first-part']}>
                    {/* <Typography.Title className={styles['first_part_title']} level={4}>Rewards(USD</Typography.Title>
                    <div className={styles['first_part_main']}>
                        <div className={styles['first_part_main_item']}>
                            <div className={styles['topic']}>Current Total Rewards</div>
                            <CountUp className={styles['value']} start={0} end={634598671} duration={2} decimals={0} suffix={''} />
                        </div>
                        <div className={styles['first_part_main_item']}>
                            <div className={styles['topic']}>Max Pool Rewards</div>
                            <CountUp className={styles['value']} start={0} end={634598671} duration={2} decimals={0} suffix={''} />
                        </div>
                        <div className={styles['first_part_main_item']}>
                            <div className={styles['topic']}>Total Generated Rewards</div>
                            <CountUp className={styles['value']} start={0} end={634598671} duration={2} decimals={0} suffix={''} />
                        </div>
                        <div className={styles['first_part_main_item']}>
                            <div className={styles['topic']}>
                                <span style={{marginRight:'5px'}}>Boost Standard</span>
                                <Tooltip placement="top" title='The Pool TVL is greater than or equal to 1% of the total TVL.'>
                                    <QuestionCircleOutlined/>
                                </Tooltip>
                            </div>
                            <CountUp className={styles['value']} start={0} end={634598671} duration={2} decimals={0} suffix={''} />
                        </div>
                    </div> */}
                </div>
                <div className={styles['two-part']}>
                <Spin spinning={spinning} tip="Loading...">
                    <CustomTable data={poolDataState} onButtonClick={handleButtonClick}/>
                </Spin>
                </div>
            </div>
        </div>
    )
}