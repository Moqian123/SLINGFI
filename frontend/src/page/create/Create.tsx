import React, { useEffect, useState } from "react";
import { useQuery,useMutation } from "@apollo/client";
// import dnsx from "./dsnx.png"
import { Buffer } from "buffer";
import { Select, Tooltip, Input, Slider, message,Spin } from "antd";
import 'antd/dist/reset.css';
import { QuestionCircleOutlined } from "@ant-design/icons";
import TradingViewChart from './TradingViewChart';
import styles from "./Create.module.css";
// import {useSelector} from "../../redux/hooks";
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import {GET_POSTS, GET_PROGRAMID, GET_POOL_FEE_ACCOUNT, POST_POOL_ACCOUNT} from '../../lib/poolApi'

import {
  Connection,
  PublicKey,
  SystemProgram,
  clusterApiUrl,
  Keypair,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  BN,
  Program,
  setProvider,
  AnchorProvider,
  web3,
} from "@project-serum/anchor";

import {marksWaller,marksDouble} from './common'
import {getUsdtPrice,FloatToBn, createTokenAcount} from '../../lib/Common'
import {POST_LayerUserData} from '../../lib/joinApi'

export const Create: React.FC = () => {
  window.Buffer = window.Buffer || require("buffer").Buffer;
  const [postPoolAccount] = useMutation(POST_POOL_ACCOUNT); //保存pool数据接口
  const [selectLabel, setSelectLabel] = useState(''); //下拉选择器被选择的文本
  const [selectOptions, setSelectOptions] = useState<any[]>([]); //下拉选项
  const [mintToken,setMintTokens] = useState(''); //下拉选项币的Token
  const [permitTokens,setPermitTokens] = useState(''); //币账户 account
  const [priceUsd,setPriceUsd] = useState('0'); //币账户 account
  const [ispin,setispin] = useState(false);
  const getOptions = useQuery(GET_POSTS);
  const [layerUseData] = useMutation(POST_LayerUserData)
  const wallet = useWallet();
  const publicKey = wallet.publicKey;
  const tokenProgramId = TOKEN_PROGRAM_ID.toBase58();
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const programId = new PublicKey(
    // "BxyFR41fdDG6hYF39Y2xQAhscQywWCVYBJnmDS9baoQG"
    "FXdkYrxybRLydDdRFpyzMXwzJTCBc78UrNVX36pDPS9j"
  ); //目前写死 
  // const mintToken = new PublicKey(
  //   "F6EqTeQ3mEmRu87LBrGqsHKiMbkeUnTER29e1VNZDhBc"
  // );

  const anchorWallet = useAnchorWallet();
  const provider = new AnchorProvider(connection, anchorWallet as any, {});
  setProvider(provider);
  const IDL = require("../../idl/mts_pool.json");
  const program = new Program(IDL, programId);

  // 获取create表单里的value值
  const [formObj, setFormObj] = useState({
    baseUnit: "",
    unitAmount: "",
    // initialAmount: "",
    fallPercent: 0,
    multiper: 2,
    goalPrice: "",
    profitSharePerent: 0,
    goalProfitRatio:0,
  });
  
  const handleInputChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>,
    inputName: string
  ) => {
    e.preventDefault();
    const value = e.target.value;
    setFormObj((preInputValue) => ({
      ...preInputValue,
      [inputName]: value,
    }));
  };
  const handleSliderChange = (value: number, sliderName: string) => {
    setFormObj((prevState) => ({
      ...prevState,
      [sliderName]: value,
    }));
  };
    //   接口部分
  const getPrice = async(type) => {
      const price =  await getUsdtPrice(type.replace('Z',''))
      setPriceUsd(price)
  }
  /**获取币种类型：mintToken/permitToken */
  useEffect(() => {
    const op = getOptions.data?.permitTokens.map(
        ({ mint_token_name,id, ...rest }) => {
        return { label: mint_token_name, value: id, ...rest };
        }
    );
    if(op) {
      setSelectOptions(op)
      setSelectLabel(op[0].label)
      setMintTokens(op[0].mint_token)
      setPermitTokens(op[0].permit_tokens_account)
      getPrice(op[0].label)
    }
  },[getOptions])

  const getProgramId = useQuery(GET_PROGRAMID)
    console.log('programId',getProgramId);
    // const poolfeeDate = useQuery(GET_POOL_FEE_ACCOUNT, {
    //   variables: { mintToken }, // 传递参数
    // })
    // console.log('poolfeeDate:',poolfeeDate);
  

    // 创建池子部分
  const createClick = async () => {
    if (!publicKey) return message.error("Wallet is not Conection！");
    if(ispin) return message.info('Creating pool in progress, please do not click repeatedly');
    let isInputValue = false;
    let arryKey:any = []
    for(let k in formObj) {
      if(!formObj[k]&&formObj[k] !== 0) {
        arryKey.push(k)
        isInputValue = true;
      }

    }
    if(isInputValue) {
      return message.error('Please enter a value:' + arryKey.join(','))
    }
    setispin(true)
    const create_token_acount = await createTokenAcount(publicKey,mintToken);
    const poolFeeAccount = new web3.PublicKey(
      "2E8uwstbizha65dpASh45dVMbbACp5pJmMX1YagJEWAU"
    );
    // 获取 Solana 区块链上最新的区块哈希值
    const latestBlockhash = await connection.getLatestBlockhash("finalized");
    
    let unique_id_pubkey =  Keypair.generate().publicKey
    const [mtsPoolAccount,poolPdaBump] =
      await PublicKey.findProgramAddressSync(
        [unique_id_pubkey.toBuffer()],
        programId
      );
    
    console.log('mtsPoolAccount',mtsPoolAccount);
    
    const [poolTokenAccountPda] = await PublicKey.findProgramAddressSync(
      [Buffer.from("zmts-pool"), mtsPoolAccount.toBuffer()],
      programId
    );
    console.log('latestBlockhash:',latestBlockhash);
    
    // Layer one account
    const [layerOnePda] = await web3.PublicKey.findProgramAddressSync(
        [Buffer.from("Layer"), Buffer.from("00001"), mtsPoolAccount.toBuffer()],
        programId
      );
    const [layer_user_pda] = await PublicKey.findProgramAddressSync(
        [publicKey.toBuffer(),mtsPoolAccount.toBuffer(), Buffer.from("1")],
        programId
    );
    console.log("web3----", web3);
    if(publicKey) {
      // 保存pool数据
        try{
          
          await CreateAndInitPool(latestBlockhash,mtsPoolAccount,poolPdaBump,layerOnePda,poolTokenAccountPda,create_token_acount,unique_id_pubkey,poolFeeAccount,layer_user_pda);
          
        }catch(err) {
          setispin(false)
        }
        
        try {
          const mts_pool_acount = mtsPoolAccount.toString()
          const creator_account = create_token_acount
          const pool_token_account = poolTokenAccountPda.toString()
          const pool_fee_account = poolFeeAccount.toString()
          const poolData = await postPoolAccount({variables:{mts_pool_acount,mintToken,creator_account,pool_token_account,pool_fee_account}})
          console.log(poolData);
        }catch(error){
          setispin(false)
        }

        try {
          const layer_pda = layerOnePda;
          const user_pda = layer_user_pda;
          const mts_pool_account = mtsPoolAccount.toString();
          const user_pubkey=publicKey?.toString();
          const user_index = 1;
          const mint_token = mintToken.toString();

          const post_layerUser_data_api =await layerUseData({variables:{layer_pda,user_pda,mts_pool_account,user_pubkey,user_index,mint_token}})
          console.log('post_layerUser_data_api---',post_layerUser_data_api);
          message.success('Creation completed!')
          resetInput()
      }catch(error){
          console.log(error);
          setispin(false)
      }

    }
   
  };
  const resetInput = () => {
    
      setFormObj((prevState) => ({
        ...prevState,
          baseUnit: "",
          unitAmount: "",
          // initialAmount: "",
          fallPercent: 0,
          multiper: 2,
          goalPrice: "",
          profitSharePerent: 0,
          goalProfitRatio:0,
      }));
  }
  
  // 调用创建池子和初始化池子
  async function CreateAndInitPool(latestBlockhash,mtsPoolAccount,poolPdaBump,layerOnePda,poolTokenAccountPda,create_token_acount,unique_id_pubkey,pool_fee_account,layer_user_pda) {
    await create_pool(
      latestBlockhash,
      mtsPoolAccount,
      layerOnePda,
      poolTokenAccountPda,
      create_token_acount,
      unique_id_pubkey
    );
    await init_pool(
      latestBlockhash,
      mtsPoolAccount,
      poolPdaBump,
      layerOnePda,
      poolTokenAccountPda,
      create_token_acount,
      pool_fee_account,
      layer_user_pda
    );
  }
    //   创建池子
  const create_pool = async (
    latestBlockhash,
    mtsPoolAccount,
    layerOnePda,
    poolTokenAccountPda,
    create_token_acount,
    unique_id_pubkey
  ) => {
    if (!publicKey) return;
    // permit tokens [mint_token账户集代表token]
    // const permitTokens = new PublicKey(
    //     "BPom3AVSTHxEeUD4VyZ88btE8qsw6sdon7Ydd9QSrNQV"
    // );

    const initTokenAmount = new BN(10);
    console.log('mtsPoolAccount:',mtsPoolAccount.toString())
    console.log('layerOnePda:',layerOnePda.toString())
    console.log('mintToken:',mintToken)
    console.log('poolTokenAccountPda:',poolTokenAccountPda.toString())
    console.log('create_token_acount:',create_token_acount.toString())
    console.log('permitTokens:',permitTokens)
    console.log('tokenProgramId:',tokenProgramId.toString())
    console.log('tokenProgramId:',SystemProgram.programId.toString())
    // // group the instruction accounts
    const zcontext = {
      creator: publicKey,
      mtsPool: mtsPoolAccount,
      layerOne: layerOnePda,
      mintToken: new PublicKey(mintToken),
      poolTokenAccount: poolTokenAccountPda,
      creatorDepositTokenAccount: create_token_acount,
      permitTokens: new PublicKey(permitTokens),
      tokenProgram: tokenProgramId,
      systemProgram: SystemProgram.programId,
    };
    
    for(let k in zcontext){
      console.log(k+ ':'+ zcontext[k].toString() );
    }

    const tx = await program.methods
    .createMtsPool(initTokenAmount,unique_id_pubkey)
    .accounts(zcontext)
    .rpc({ skipPreflight: true });
    console.log("jjjjjj---", tx);

      console.log(`Use 'solana confirm -v ${tx}' to see the logs`);

      await connection.confirmTransaction({
        signature: tx,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      });

    console.log(`https://explorer.solana.com/tx/${tx}?cluster=devnet`);
  };
    //   初始化池子
  const init_pool = async (
    latestBlockhash,
    mtsPoolAccount,
    poolPdaBump,
    layerOnePda,
    poolTokenAccountPda,
    create_token_acount,
    pool_fee_account,
    layer_user_pda) =>{
    if(!publicKey) return
      
      const zinit_context = {
        creator: publicKey,
        mtsPool: mtsPoolAccount,
        layerOne: layerOnePda,
        layerUserPda: layer_user_pda,
        poolTokenAccount: poolTokenAccountPda,
        creatorDepositTokenAccount: create_token_acount,
        tokenProgram: tokenProgramId,
        systemProgram: SystemProgram.programId,
      };
      console.log("----888------初始化", zinit_context);
  
      const pool_state = { investing: {} };
      const layer_pdas = [{ layerNo: 1, layerPda: layerOnePda }];
      const settlePrice = new BN(1);
      const totalCost = new BN(100);
      const totalProfit = new BN(1);
      const creteTime = new BN(Date.now());
      const amt = FloatToBn((parseFloat(formObj.baseUnit)*parseFloat(formObj.unitAmount)).toFixed(2));
      const is_pool_data = {
        pool_pda_bump:poolPdaBump,
        creatorAccount: publicKey, //用户钱包公钥
        mintToken: new PublicKey(mintToken),
        tokenAccount: poolTokenAccountPda,
        initAmt:amt,
        fallPect: formObj.fallPercent, //用户页面选择的下跌百分比
        multiple:FloatToBn(formObj.multiper), //用户页面选择的下一层级倍数
        addUnit: FloatToBn(formObj.baseUnit), //用户页面输入的加入最小单位数量
        goalPrice: FloatToBn(formObj.goalPrice), //用户页面填的目标价格
        goalProfRat: formObj.goalProfitRatio, //用户页面填的目标止盈率--------
        settlePrice: settlePrice, //创建时默认传值0
        profSharePect: formObj.profitSharePerent, //用户页面选择的利润分享率值
        poolStatus: pool_state, //创建时默认投资中状态 const pool_state = { investing: {} };
        poolFeeAccount: pool_fee_account, //默认项目的mint token的token account 从API C中实时取
        layerPdas: layer_pdas, //默认layer 1 。const layer_pdas = [{ layerNo: 1, layerPda: layerOnePda }];
        maxlayerUserNo: 100, //当前默认100，后期考虑用户在页面输入或取消限制
        maxLayers: 10, //当前默认10，后期考虑用户在页面输入或取消限制
        tokenAmountSum: amt,
        totalCost: totalCost, //创建时默认传值0
        totalProfit: totalProfit, //创建时默认传值0
        creteTime: creteTime, //当前时间 const timestamp = new BN(Date.now());
      };
      const other_paras = {
        layeroneVol: new BN(1000000000000), //Layer one容量
        inPrice: FloatToBn(priceUsd), //创建时mint token的价格
      };
      for(let k in is_pool_data){
        console.log(k+ ':'+ is_pool_data[k].toString() );
      }
      
      const init_tx = await program.methods
        .initMtsPool(amt, is_pool_data, other_paras)
        .accounts(zinit_context)
        // .signers([new web3.Keypair()])
        .rpc({ skipPreflight: true });
        
      console.log(init_tx);
      
      console.log(
        `https://explorer.solana.com/init_tx/${init_tx}?cluster=devnet`
      );
      await connection.confirmTransaction({
        signature: init_tx,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      });
      const mtsPool_data = await program.account.mtsPoolData.fetch(mtsPoolAccount)
      // console.log('mtsPool_data',mtsPool_data);
      
      // const mtsPool_data = await program.account.mTSPoolData.fetch(
      //   mtsPoolAccount
      // );
      // console.log("The mts pool account pubkey is: ", mtsPoolAccount.toString());
  
      const first_layer_data = await program.account.mtsPoolLayerAccount.fetch(
        layerOnePda
      );
      console.log("mtsPool_data----", mtsPool_data);
      console.log("first_layer_data---", first_layer_data);
  }

  // 获取下拉接口数据
  // Dropdown 下拉菜单
  async function handleChange(e) {
    console.log(selectOptions);
    console.log("click", e);
    const selectObj = selectOptions.filter(item => item.value === e)[0]
    console.log(selectObj);
    setSelectLabel(selectObj.label)
    setMintTokens(selectObj.mint_token)
    setPermitTokens(selectObj.permit_tokens_account)
    await getPrice(selectObj.label)

  }
  
  return (
    <div className={styles["page-container"]}>
      <div className={styles["page-inner"]}>
        <div className={styles["left"]}>
          <div className={styles["select-box"]}>
            <Select
              key={selectLabel}
              className={styles["button"]}
              defaultValue={selectLabel}
              style={{ width: 120 }}
              onChange={handleChange}
              options={selectOptions}
            />
          </div>
          {/* form */}
          <div className={styles.operate}>
            <div className={styles["operate_item"]}>
              <div className={styles["item"]}>
                <div className={styles["input-title"]}>
                  <span>Base Unit</span>
                  <Tooltip
                    placement="top"
                    title="The size of a unit or minimum deposit"
                  >
                    <QuestionCircleOutlined />
                  </Tooltip>
                </div>
                <div className={styles["input-box"]}>
                  <Input
                    value={formObj.baseUnit}
                    onChange={(e) => handleInputChange(e, "baseUnit")}
                    className={styles["input-input"]}
                    placeholder="Base Unit"
                  />
                  <span
                    style={{
                      margin: "0px 5px",
                      color: "rgb(189, 182, 182)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    (=$ {
                      isNaN((parseFloat(formObj.baseUnit)*parseFloat(priceUsd))) ? '0' : (parseFloat(formObj.baseUnit)*parseFloat(priceUsd)).toFixed(4)
                    })
                  </span>
                  <span>{selectLabel}</span>
                </div>
              </div>
              <div className={styles["item"]}>
                <div className={styles["input-title"]}>
                  <span>Unit Amount</span>
                  <Tooltip
                    placement="top"
                    title="Creator's initial investment amount"
                  >
                    <QuestionCircleOutlined />
                  </Tooltip>
                </div>
                <div className={styles["input-box"]}>
                  <Input
                    value={formObj.unitAmount}
                    onChange={(e) => handleInputChange(e, "unitAmount")}
                    className={styles["input-input"]}
                  />
                  <span
                    style={{
                      margin: "0px 5px",
                      color: "rgb(189, 182, 182)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    = {
                      isNaN(parseFloat(formObj.baseUnit)*parseFloat(formObj.unitAmount)) ?'0':(parseFloat(formObj.baseUnit)*parseFloat(formObj.unitAmount)).toFixed(2)
                    } {selectLabel} (${
                      isNaN((parseFloat(formObj.baseUnit)*parseFloat(formObj.unitAmount)*parseFloat(priceUsd))) ? '0' : (parseFloat(formObj.baseUnit)*parseFloat(formObj.unitAmount)*parseFloat(priceUsd)).toFixed(4)
                    })
                  </span>
                  <span>MAX</span>
                </div>
              </div>
            </div>
            <div className={styles["operate_item"]}>
              <div className={styles["item"]}>
                <div className={styles["input-title"]}>
                  <span>Initial Amount</span>
                  <Tooltip
                    placement="top"
                    title="The quantity of the final winner."
                  >
                    <QuestionCircleOutlined />
                  </Tooltip>
                </div>
                <div style={{ display: "flex" }}>
                  <div
                    className={styles["input-box"]}
                    style={{ flex: "1 1 0%" }}
                  >
                    <Input
                      style={{backgroundColor:'transparent',color:'rgba(0,0,0,0.88)'}}
                      disabled
                      value={isNaN(parseFloat(formObj.baseUnit)*parseFloat(formObj.unitAmount)) ? '' : (parseFloat(formObj.baseUnit)*parseFloat(formObj.unitAmount)).toFixed(2)}
                      onChange={(e) => handleInputChange(e, "initialAmount")}
                      className={styles["input-input"]}
                    />
                  </div>
                  {/* <div
                    style={{
                      flex: "1 1 0%",
                      display: "flex",
                      alignItems: "center",
                      padding: "0px 0.625rem",
                      color: "rgb(5, 4, 4)",
                      fontWeight: "600",
                      fontSize: "12px",
                    }}
                  >
                    * 0 = 0
                  </div> */}
                </div>
              </div>
              <div className={styles["item"]}>
                <p className={styles["balance-text"]}>
                  Fall percent : 0 {selectLabel} (0 units)){" "}
                </p>
                <div className={styles["balance-slider"]}>
                  <Slider
                    marks={marksWaller}
                    value={formObj.fallPercent}
                    step={10}
                    defaultValue={0}
                    onChange={(v) => handleSliderChange(v, "fallPercent")}
                  />
                </div>
              </div>
            </div>
            <div className={styles["operate_item"]}>
              <div className={styles["item"]}>
                <div className={styles["input-title"]}>
                  <span>Multiple</span>
                  <Tooltip
                    placement="top"
                    title="Refers to the multiple of the expansion compared to the previous layer"
                  >
                    <QuestionCircleOutlined />
                  </Tooltip>
                </div>
                <div className={styles["balance-slider"]}>
                  <Slider
                    marks={marksDouble}
                    value={formObj.multiper}
                    step={1}
                    defaultValue={2}
                    max={5}
                    min={2}
                    onChange={(v) => handleSliderChange(v, "multiper")}
                  />
                </div>
              </div>
              <div className={styles["item"]}>
                <div className={styles["input-title"]}>
                  <span>Goal price</span>
                  <Tooltip
                    placement="top"
                    title="The percentage of the final winner eligible for a prize."
                  >
                    <QuestionCircleOutlined />
                  </Tooltip>
                </div>
                <div className={styles["input-box"]}>
                  <Input
                    value={formObj.goalPrice}
                    onChange={(e) => handleInputChange(e, "goalPrice")}
                    className={styles["input-input"]}
                    placeholder="0.5-100"
                  />
                  <span style={{ color: "#b73737" }}>%</span>
                </div>
              </div>
            </div>
            <div className={styles["operate_item"]}>
              <div className={styles["item"]}>
                <div className={styles["input-title"]}>
                  <span>Goal Profit Ratio</span>
                  <Tooltip
                    placement="top"
                    title="Refers to the multiple of the expansion compared to the previous layer"
                  >
                    <QuestionCircleOutlined />
                  </Tooltip>
                </div>
                <div className={styles["balance-slider"]}>
                  <Slider
                    value={formObj.goalProfitRatio}
                    marks={marksWaller}
                    step={1}
                    defaultValue={0}
                    onChange={(v) => handleSliderChange(v, "goalProfitRatio")}
                  />
                </div>
              </div>
              <div className={styles["item"]}>
                <div className={styles["input-title"]}>
                  <span>Profit Share Percent</span>
                  <Tooltip
                    placement="top"
                    title="Refers to the multiple of the expansion compared to the previous layer"
                  >
                    <QuestionCircleOutlined />
                  </Tooltip>
                </div>
                <div className={styles["balance-slider"]}>
                  <Slider
                    value={formObj.profitSharePerent}
                    marks={marksWaller}
                    step={1}
                    defaultValue={0}
                    onChange={(v) => handleSliderChange(v, "profitSharePerent")}
                  />
                </div>
              </div>
            </div>
            {/* <div className={styles["operate_item"]}>
              <div className={styles["item"]}>
                <div className={styles["input-title"]}>
                  <span>Profit Share Percent</span>
                  <Tooltip
                    placement="top"
                    title="Stop profit /lock profit/ the realization of unrealized gains"
                  >
                    <QuestionCircleOutlined />
                  </Tooltip>
                </div>
                <div className={styles["input-box"]}>
                  <Input
                    min={0.5}
                    value={formObj.profitSharePerent}
                    onChange={(e) => handleInputChange(e, "profitSharePerent")}
                    className={styles["input-input"]}
                    placeholder="Min 0.5"
                  />
                  <span style={{ color: "#b73737" }}>%</span>
                </div>
              </div>
            </div> */}
          </div>
          <div className={styles["btn"]} onClick={createClick}>
            {
              !ispin ? null :<Spin />
            }
            <span style={{marginLeft:'8px'}}>CREATE</span>
          </div>
        </div>
        <div className={styles["kline-box"]}><TradingViewChart biType={selectLabel}/></div>
      </div>
    </div>
  );
};
