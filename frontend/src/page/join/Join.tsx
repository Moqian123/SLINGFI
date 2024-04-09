/* eslint-disable react-hooks/exhaustive-deps */
import React, {useEffect, useState} from "react";
import style from './Join.module.css';
import { Row,Col, message,Alert } from 'antd';
import { CopyOutlined } from '@ant-design/icons'
import {useLocation} from 'react-router-dom'
import queryString from "query-string"
import CustomModal from "./customModal/customModal";
import TableModal from "./customModal/tableModal";
// import LineChart from './LineChart'
// import { ChartData, ChartOptions } from 'chart.js';
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import {
    Connection,
    PublicKey,
    SystemProgram,
    Keypair,
  } from "@solana/web3.js";
import {
    Program,
    setProvider,
    AnchorProvider,
} from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {FloatToBn, createTokenAcount} from '../../lib/Common'
import logo from "../../assets/logo.jpg"
import { useMutation } from "@apollo/client";
import {POST_LayerUserData} from '../../lib/joinApi'


export const Join:React.FC = () => {
    window.Buffer = window.Buffer || require("buffer").Buffer;
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isTableModalVisible, setIsTableModalVisible] = useState(false);
    const [maxMtsLayerAcount,setMtsLayerAcount] = useState(0);

    const {search} = useLocation();
    const queryParam:any = queryString.parse(search)
    const [layerUseData] = useMutation(POST_LayerUserData)
    console.log(queryParam);
    
    const {publicKey} = useWallet();
    const connection = new Connection('https://radial-nameless-county.solana-devnet.quiknode.pro/6bebb9ec55f87563cda3b23166b175e7fa3e2727/');
    
    const programId = new PublicKey("FXdkYrxybRLydDdRFpyzMXwzJTCBc78UrNVX36pDPS9j");
    // const publicKey = wallet.publicKey;

    const anchorWallet = useAnchorWallet();
    const provider = new AnchorProvider(connection, anchorWallet as any, {});
    setProvider(provider);
    const IDL = require("../../idl/mts_pool.json");
    const program = new Program(IDL, programId);
    
    
    
    
    const showModal = () => {
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    
    useEffect(() => {
        const mtsLayerAccountFun = async() => {
            const mts_layer_account:any = await program.account.mtsPoolLayerAccount.fetch(
                new PublicKey(queryParam.layer_account)
            );
            console.log('mts_layer_account---------------------',mts_layer_account);
            for(let k in mts_layer_account) {
                console.log(k+':'+parseFloat(mts_layer_account[k]));
                
            }
            setMtsLayerAcount(parseFloat(mts_layer_account.layerVol))
        }
        mtsLayerAccountFun()
    },[search])
    const handleConfirm = async (value,usdPrice) => {
        
        if(!publicKey)return;
        console.log(publicKey,queryParam);
        
        const create_token_acount = await createTokenAcount(publicKey,queryParam.mint_token);
        const latestBlockhash = await connection.getLatestBlockhash("finalized");
        let unique_id_pubkey = Keypair.generate().publicKey;
        const [layer_user_pda] = await PublicKey.findProgramAddressSync(
            [unique_id_pubkey.toBuffer()],
            programId
        );
        const tokenProgramId = TOKEN_PROGRAM_ID.toBase58();
        console.log('layer_user_pda',layer_user_pda);
        // 加入池子参数
        const join_context = {
            user: publicKey?.toString(),
            mtsPool: queryParam.mts_pool_account,
            layerUserPda: layer_user_pda,
            mintToken: queryParam.mint_token,
            depositTokenAccount: create_token_acount,
            poolTokenAccount: queryParam.pool_token_account,
            layerAccount: queryParam.layer_account,
            tokenProgram: tokenProgramId,
            systemProgram: SystemProgram.programId,
        };
        // 赎回参数
        // const redeem_context = {
        //     user: publicKey,
        //     mtsPool: queryParam.mts_pool_account,
        //     mintToken: queryParam.mint_token,
        //     poolTokenAccount: queryParam.pool_token_account,
        //     userTokenAccount: user_token_account,
        //     feeTokenAccount: user_token_account,
            
        //     tokenProgram:tokenProgramId,
        // }
        // 创建下一层级
        

        await JoinPool(join_context,value,usdPrice,latestBlockhash,unique_id_pubkey)
        try {
            const layer_pda = queryParam.layer_account;
            const user_pda = layer_user_pda;
            const mts_pool_account = queryParam.mts_pool_account;
            const user_pubkey=publicKey?.toString();
            const user_index = 2;
            const mint_token = queryParam.mint_token;

            const post_layerUser_data_api =await layerUseData({variables:{layer_pda,user_pda,mts_pool_account,user_pubkey,user_index,mint_token}})
            console.log(post_layerUser_data_api);
            message.info('Joined Pool Success!')
            setIsModalVisible(false);
        }catch(error){
            console.log(error);
        }
        
    }
    const tableHandleCancel =() => {
        setIsTableModalVisible(false)
    }
    // 加入池子
    const JoinPool = async(join_context,value,usdPrice,latestBlockhash,unique_id_pubkey) => {
       for(let k in join_context) {
            console.log(k+':'+join_context[k])
        }
        console.log('program----------',program.account);
        
        const joinpool_tx = await program.methods
        .joinMtspool(FloatToBn(value),unique_id_pubkey,FloatToBn(usdPrice))
        .accounts(join_context)
        .rpc({skipPreflight:true});

        console.log(`Use 'solana confirm -v ${joinpool_tx}' to see the logs`);

        await connection.confirmTransaction({
            signature: joinpool_tx,
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        });
        // console.log(`https://explorer.solana.com/init_tx/${tx}?cluster=devnet`);
        const mtsPool_data_af = await program.account.mtsPoolData.fetch(
            queryParam.mts_pool_account
        );
        
        console.log(
        "After join, pool token summary amount is: ",
        mtsPool_data_af
        );
          
        const first_layer_data = await program.account.mtsPoolLayerAccount.fetch(
            queryParam.layer_account
        );
        console.log(first_layer_data);
    }
    // 创建下一层级
    const CreateNextLayer = async() =>{
        if(!publicKey)return;
        // const create_token_acount = await createTokenAcount(publicKey,queryParam.mint_token);
        const latestBlockhash = await connection.getLatestBlockhash("finalized");
        let unique_id_pubkey = Keypair.generate().publicKey;
        const [layer_user_pda] = await PublicKey.findProgramAddressSync(
            [unique_id_pubkey.toBuffer()],
            programId
        );
        // const tokenProgramId = TOKEN_PROGRAM_ID.toBase58();
        const create_next_layer_context = {
            creator: publicKey?.toString(),
            lastLayer: queryParam.layer_account,//pool_account-->layer_pdas取最后一个account
            nextLayer: layer_user_pda,
            mtsPool: queryParam.mts_pool_account,
            systemProgram: SystemProgram.programId,
        }
        for(let k in create_next_layer_context) {
            console.log(k+':'+create_next_layer_context[k])
        }
        console.log('program----------',program.account);
        
        const joinpool_tx = await program.methods
        .joinMtspool(unique_id_pubkey)
        .accounts(create_next_layer_context)
        .rpc({skipPreflight:true});

        console.log(`Use 'solana confirm -v ${joinpool_tx}' to see the logs`);

        await connection.confirmTransaction({
            signature: joinpool_tx,
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        });
        // console.log(`https://explorer.solana.com/init_tx/${tx}?cluster=devnet`);
        const mtsPool_data_af = await program.account.mtsPoolData.fetch(
            queryParam.mts_pool_account
        );
        
        console.log( "After join, pool token summary amount is: ", mtsPool_data_af);
          
        // const first_layer_data = await program.account.mtsPoolLayerAccount.fetch(
        //     queryParam.layer_account
        // );
        // console.log(first_layer_data);
    }
    return (
        <div className={style.inner}>
            <div className={style['first_part']}>
                <div className={style['first_part_header']}>
                    <div className={style['type']}>
                        <img style={{marginRight: '16px',borderRadius:'50%'}} src={logo} alt="" width={62} height={62}/>
                        <span>{queryParam.mint_token_name}</span>
                        {/* <UploadOutlined style={{marginLeft: '16px'}}/> */}
                    </div>
                    <div className={style['creator']}>
                        <div>
                            <span>Creator : </span>
                            <span>{queryParam.creator_account}</span>
                            <CopyOutlined />
                        </div>
                        <div>
                            <span>Pool ID : </span>
                            <span>{queryParam.POOL_ID}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className={style['second_part']}>
                <Row style={{display:'flex',justifyContent:'space-between',width:'100%'}}>
                    <Col span={8}>
                        <div className={style['second-left']}>
                            <div className={style['li']}>
                                <div className={style['lay']}>L0</div>
                                <div className={style['shap']}>
                                    <div className={style['shapeTitle']}>
                                        <span>$59.736</span>
                                        <span>509/19000</span>
                                    </div>
                                    <div className={style['progress']} style={{width:'calc(2.68102% + 2px)'}}></div>
                                </div>
                            </div>
                            <div className={style['li-scrroly']}>
                                <div className={style['li']}>
                                    <div className={style['lay']}>L1</div>
                                    <div className={style['shap']}>
                                        <div className={style['shapeTitle']}>
                                            <span>$5.45</span>
                                            <span>600/19000</span>
                                        </div>
                                        <div className={style['progress']} style={{width:'calc(1.3% + 2px)'}}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Col>
                    <Col span={14}>
                        <Row style={{display:'flex',justifyContent:'space-between'}}>
                            <Col className={style['colItem']}>
                                <span>Current Layer</span>
                                <p>
                                    <span>{queryParam.Curent_Layer}</span>
                                    {/* <span style={{fontSize: '14px', color: 'rgb(183, 55, 55)', marginLeft: '10px'}}>1.2098/Unit</span> */}
                                </p>
                            </Col>
                            <Col className={style['colItem']}>
                                <span>Multiple</span>
                                <p>
                                    <span>{queryParam.multiple}</span>
                                    {/* <span style={{fontSize: '14px', color: 'rgb(183, 55, 55)', marginLeft: '10px'}}>0/D/Unit</span> */}
                                </p>
                            </Col>
                        </Row>
                        <Row style={{display:'flex',justifyContent:'space-between',marginTop:'20px'}}>
                            <Col className={style['colItem']}>
                            <span>Profit Share Percent</span>
                                <p>
                                    <span>{queryParam.Profit_Share_Percent}%</span>
                                </p>
                            </Col>
                            <Col className={style['colItem']}>
                                <span>Goal Profit Ratio</span>
                                <p>
                                    <span>{queryParam.goalProfRat}%</span>
                                </p>
                            </Col>
                        </Row>
                        <Row style={{display:'flex',justifyContent:'space-between',marginTop:'20px'}}>
                            <Col className={style['colItem']}>
                            <span>Total Invested Amount</span>
                                <p>
                                    <span>{parseFloat(queryParam.tokenAmountSum)}</span>
                                </p>
                            </Col>
                            <Col className={style['colItem']}>
                                <span>Total Invested Cost</span>
                                <p>
                                    <span>{parseFloat(queryParam.totalCost)}</span>
                                </p>
                            </Col>
                        </Row>
                        <Row style={{display:'flex',justifyContent:'space-between',marginTop:'20px'}}>
                            <Col className={style['colItem']}>
                            <span>Average Price</span>
                                <p>
                                    <span>0.0000</span>
                                </p>
                            </Col>
                        </Row>
                        <div className={style['operate-content']}>
                            <div className={style['bottom-left']}>
                                <span>Pool Status:</span>
                                <span>{queryParam.status}</span>
                            </div>
                            <div className={style['bottom-right']}>
                                {/* className={style.dis} */}
                                {
                                   (maxMtsLayerAcount !== 0&& queryParam.Curent_Layer >= maxMtsLayerAcount) ?
                                    (<div onClick={CreateNextLayer}>Create Next Layer</div>):
                                    (<div onClick={showModal}>Join Pool</div>)
                                }
                                <div onClick={() => {setIsTableModalVisible(true)}}>Redeem</div>
                            </div>
                        </div>
                        {
                            (maxMtsLayerAcount !== 0&&queryParam.Curent_Layer >= maxMtsLayerAcount) ? (
                                <Alert
                                    message="Notice"
                                    description="Current layer token amount have reached maximum quantity. If you want join this pool, please create next layer at first"
                                    type="warning"
                                    showIcon
                                />
                            ) : ''
                        }
                        
                    </Col>
                </Row>
            </div>
            <CustomModal param={queryParam} key='join' visible={isModalVisible} onOk={handleConfirm} onClose={handleCancel} />
            <TableModal key='redeem' visible={isTableModalVisible} onClose={tableHandleCancel} />
        </div>
    )
}