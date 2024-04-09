import { gql } from "@apollo/client";
// 获取所有池子数据列表
export const GET_POOLACCOUNT = gql`
  query {
    poolAccounts{
        id
        mts_pool_account
        mint_token
        creator_account
        pool_token_account
        pool_fee_account
        pool_state
        mint_token_name
    }
  }
`;