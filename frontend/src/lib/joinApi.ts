import { gql } from "@apollo/client";

export const POST_LayerUserData = gql`
    mutation postLayerUserData($layer_pda:String!,$user_pda:String!,$mts_pool_account:String!,$mint_token:String!,$user_pubkey:String!,$user_index:Int!){ 
        postLayerUserData(layer_pda:$layer_pda, user_pda:$user_pda, mts_pool_account:$mts_pool_account,mint_token:$mint_token,user_pubkey:$user_pubkey,user_index:$user_index){ 
            layer_pda
            user_pda
            mts_pool_account
            mint_token
            user_pubkey
            user_index
        }
    }
`;
export const GET_User_Pdas = gql`
  query getUserPdas($user_pubkey:String!){ 
    getUserPdas(user_pubkey:$user_pubkey) { 
        layer_pda 
        user_pda
        mts_pool_account
        user_pubkey
        user_index 
        mint_token_name
    }
}
`;
