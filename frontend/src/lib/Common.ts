import axios from 'axios';
import { PublicKey,} from "@solana/web3.js";
import { BN } from "@project-serum/anchor";

// 获取币价格的接口
export const getUsdtPrice = async(types) => {
    console.log(types);
    interface ApiResponse {}
    const apiUrl = `https://api.dexscreener.com/latest/dex/search?q=${types}%20USDC`;
    try {
      const response:any = await axios.get<ApiResponse>(apiUrl);
      console.log(response.data);
      const resPriceUsd = response?.data?.pairs[0].priceUsd;
      return resPriceUsd
    } catch (error) {
      console.error('Error fetching data:', error);
    }
} 

export const createTokenAcount = async(publicKey,mintToken) => {
  // 使用用户的钱包pubkey作为值创建creator_token_account
  const OWN = new PublicKey(publicKey);

  const TOKEN_PROGRAM_ID = new PublicKey(
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
  );
  const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
    "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
  );
  // const creatorTokenAccount = new PublicKey(publicKey);
  const creatorTokenAccount = await PublicKey.findProgramAddressSync(
    [OWN.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), new PublicKey(mintToken).toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  const creatorTokenAccountBase58 = new PublicKey(
    creatorTokenAccount[0].toString()
  ).toBase58();
  console.log('creatorTokenAccountBase58:',creatorTokenAccountBase58);
  
  return creatorTokenAccountBase58// new PublicKey('D2ZecaRk95tu89tS21FNfAejVqs21scenZJVwLwyFqe2')
}

// 将浮点数转为精度为9的整数
export const FloatToBn = (e) => {
    const floatValue = parseFloat(e);
    if (!isNaN(floatValue)) {
      // 将浮点数转换为整数字符串（乘以 10^decimals 后取整）
      const decimals = 9; // 设置精度
      const integerValue = Math.round(floatValue * Math.pow(10, decimals)).toString();
      // 使用整数字符串创建 BigNumber 对象
      const bn = new BN(integerValue);
      return bn
    }
};