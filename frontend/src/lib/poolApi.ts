import { gql } from "@apollo/client";
export const GET_POSTS = gql`
  query {
    permitTokens {
      id
      permit_tokens_account
      mint_token
      mint_token_name
      status
    }
  }
`;
export const GET_PROGRAMID = gql`
  query {
    programId(env:"dev"){
      id
      program_id
      env
    }
  }
`;
export const GET_POOL_FEE_ACCOUNT = gql`
  query GET_POOL_FEE_ACCOUNT($mintToken: String!){
    feeChargeAccounts(mint_token:$mintToken){
      id
      mint_token
      pool_fee_account
    } 
  }
`;

export const POST_POOL_ACCOUNT = gql`
  mutation PostPoolAccount($mts_pool_acount:String!,$mintToken:String!,$creator_account:String!,$pool_token_account:String!,$pool_fee_account:String!){
    postPoolAccount(
      mts_pool_account:$mts_pool_acount,
      mint_token:$mintToken,
      creator_account:$creator_account,
      pool_token_account:$pool_token_account,
      pool_fee_account:$pool_fee_account
    ){
      mts_pool_account
      mint_token
      creator_account
      pool_token_account
      pool_fee_account
      pool_state
    }
  }
`
