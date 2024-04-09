use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer as SplTransfer};

declare_id!("FXdkYrxybRLydDdRFpyzMXwzJTCBc78UrNVX36pDPS9j");

#[program]
pub mod mts_pool {
    use super::*;
    // Initialization
    pub fn initialize(ctx: Context<Initialize>, token: Pubkey) -> Result<()> {
        let permit_tokens = &mut ctx.accounts.permit_tokens;
        //set initializer pubky
        permit_tokens.initializer = ctx.accounts.initializer.key();
        //set initial permit token
        permit_tokens.ptokens.push(token);
        msg!(
            "Initial permited token {} be added in PDA {}!",
            token,
            permit_tokens.key()
        );
        Ok(())
    }

    // Add the permited token that mts pool can be used
    pub fn add_permit_token(ctx: Context<AddPermitToken>, token: Pubkey) -> Result<()> {
        let permit_tokens = &mut ctx.accounts.permit_tokens;
        //check permited token not exist.
        require!(
            !permit_tokens.ptokens.contains(&token),
            MTSError::MintTokenExist
        );
        require!(
            permit_tokens.ptokens.len() < 318,
            MTSError::PermitTokenExceedLargestNumber
        );
        permit_tokens.ptokens.push(token);
        msg!("New permited token {} be added!", token);
        Ok(())
    }

    // Delete the permited token that mts pool can be used
    pub fn del_permit_token(ctx: Context<DelPermitToken>, token: Pubkey) -> Result<()> {
        let permit_tokens = &mut ctx.accounts.permit_tokens;
        //check cancellation token exist
        require!(
            permit_tokens.ptokens.contains(&token),
            MTSError::MintTokenNotExist
        );
        let index = permit_tokens
            .ptokens
            .iter()
            .position(|&x| x == token)
            .unwrap();
        permit_tokens.ptokens.remove(index);
        msg!("Permited token {} be deleted!", token);
        Ok(())
    }

    // Create MTS pool (MTS means Martinger Strategy)
    pub fn create_mts_pool(
        ctx: Context<CreateMTSPool>,
        iv_init_amt: u64,
        _unique_id: Pubkey,
    ) -> Result<()> {
        let permit_tokens = &mut ctx.accounts.permit_tokens;
        let mint_token = &ctx.accounts.mint_token;
        let mts_pool = &mut ctx.accounts.mts_pool;

        // Check the pool mint token was the permited token
        let mut check_fial = true;
        for token in &permit_tokens.ptokens {
            if mint_token.key() == *token {
                check_fial = false;
                break;
            }
        }
        require_eq!(check_fial, false, MTSError::MinTokenNotPermitedForMTSPool);

        // Check initial amount cannt not be zero
        require!(iv_init_amt > 0, MTSError::InitAmtCantbezero);

        // Set pool information
        let pool = PoolInfo {
            pool_pubkey: mts_pool.key(),
            pool_id: permit_tokens.pools.len() as u32 + 1,
        };
        permit_tokens.pools.push(pool);

        Ok(())
    }

    // Initial MTS pool
    pub fn init_mts_pool(
        ctx: Context<InitMTSPool>,
        iv_init_amt: u64,
        is_pool_data: MTSPoolData,
        is_other_paras: PoolInitParas,
        //user_index: u32,
    ) -> Result<()> {
        // let mts_pool = &ctx.accounts.mts_pool;
        let pool_token_account = &ctx.accounts.pool_token_account;
        let creator_deposit_token_account = &ctx.accounts.creator_deposit_token_account;
        let token_program = &ctx.accounts.token_program;
        let authority = &ctx.accounts.creator;
        //layer one account
        let layer_one = &mut ctx.accounts.layer_one;
        let layer_user_pda = &mut ctx.accounts.layer_user_pda;

        // Check initial amount cannt not be zero
        require!(iv_init_amt > 0, MTSError::InitAmtCantbezero);

        // Check layer one volume amount can not be zero
        require!(
            is_other_paras.layerone_vol > 0,
            MTSError::LayerVolCantbezero
        );
        // Check in price can not be zero
        require!(is_other_paras.in_price > 0, MTSError::InPriceCantbezero);

        // Check initial amount are multiples of add unit.
        msg!("Initial amount is: {}", is_pool_data.init_amt);
        msg!("Add unit is: {}", is_pool_data.add_unit);
        if is_pool_data.add_unit > 0 {
            let remain = iv_init_amt % is_pool_data.add_unit;
            require_eq!(remain, 0_u64, MTSError::InintAmtNotMlutiplesOfUnit);
        } else {
            return Err(error!(MTSError::AddUnitIsZero));
        };

        let cpi_program = token_program.to_account_info();

        msg!("Transfer mint token from token account of creator to the token account of mtspool!");
        // transfer mint token from token account of creator to the token account of mtspool
        let cpi_accounts = SplTransfer {
            from: creator_deposit_token_account.to_account_info().clone(),
            to: pool_token_account.to_account_info().clone(),
            authority: authority.to_account_info().clone(),
        };

        token::transfer(CpiContext::new(cpi_program, cpi_accounts), iv_init_amt)?;

        // Transfer form pda to another token account
        //let mint_token = &ctx.accounts.mint_token.key();
        //let creator_key = &ctx.accounts.creator.key();
        //let seeds = vec![b"zmts-pool".as_ref(),mint_token.as_ref(),creator_key.as_ref()];
        //let signer_seeds = vec![seeds.as_slice()];//&[&seeds[..]];

        //token::transfer(
        //    CpiContext::new_with_signer(cpi_program, cpi_accounts,signer_seeds.as_slice()),
        //    iv_init_amt,
        //)?;

        // Initial value
        let init_value: u64 = iv_init_amt * is_other_paras.in_price;

        // Save the initialize data to pool PDA.
        **ctx.accounts.mts_pool = is_pool_data.clone();
        ctx.accounts.mts_pool.init_amt = iv_init_amt;
        ctx.accounts.mts_pool.total_cost = init_value;

        // Save layer one acocunt address
        let layer_one_s = MTSPoolLayerPDAs {
            layer_no: 1_u8,
            layer_pda: layer_one.key(),
        };
        ctx.accounts.mts_pool.layer_pdas.push(layer_one_s);

        // Save layer one data to layer one PDA
        layer_one.layer_no = 1_u8;
        layer_one.start_price = is_other_paras.in_price;
        layer_one.layer_vol = is_other_paras.layerone_vol;
        layer_one.curl_amt = iv_init_amt;
        layer_one.total_cost = init_value;
        layer_one.layer_status = 0_u8; // Opening

        // save user data into layer one data
        let clock = Clock::get()?;
        layer_user_pda.user_account = authority.key();
        layer_user_pda.index = 1;
        layer_user_pda.deposit_account = creator_deposit_token_account.key();
        layer_user_pda.join_amount = iv_init_amt;
        layer_user_pda.in_price = is_other_paras.in_price;
        layer_user_pda.join_time = clock.unix_timestamp;
        layer_user_pda.settled_cost_amt = 0;
        layer_user_pda.alloced_profit_amt = 0;
        layer_user_pda.is_redeemed = false;
        layer_user_pda.redeem_time = 0;

        layer_one.user_acct_number = 1;
        layer_one.last_user_pda = layer_user_pda.key();

        Ok(())
    }

    // Create(Open) next layer for pools
    pub fn create_next_layer(
        ctx: Context<CreateNextLayer>,
        _iv_layer_inx: u16,
        current_price: u64,
    ) -> Result<()> {
        let last_layer = &ctx.accounts.last_layer;
        let next_layer = &mut ctx.accounts.next_layer;
        let mts_pool = &mut ctx.accounts.mts_pool;

        // Check the right last layer
        let last_layer_pubkey = mts_pool.layer_pdas.last().unwrap().clone();
        require!(
            last_layer_pubkey.layer_pda == last_layer.key(),
            MTSError::LastlayerError
        );

        // Check the last layer in the pool is pending stata
        require!(
            last_layer.layer_status == LayerState::Pending.to_code(),
            MTSError::LastlayerNotPending
        );

        // Check the price arrived the next layer start price
        //let current_price = 1000_u64;
        let start_price: u64 = last_layer.start_price * (100 - mts_pool.fall_pect) as u64 / 100;
        require!(current_price <= start_price, MTSError::PriceGTStartprice);

        // Check the pool state
        require!(
            mts_pool.pool_status == PoolState::Investing,
            MTSError::PoolCantJoin
        );

        // Check the layer number
        let next_layer_no = last_layer.layer_no + 1;
        require!(
            next_layer_no <= mts_pool.max_layers,
            MTSError::NextLayerSupMaxAmt
        );

        // Initial next layer account data
        next_layer.layer_no = next_layer_no;
        next_layer.layer_vol = last_layer.layer_vol * mts_pool.multiple as u64;
        next_layer.curl_amt = 0;
        next_layer.total_cost = 0;
        next_layer.layer_status = LayerState::Opening.to_code();

        // Change pool acocunt data
        let layer_account = MTSPoolLayerPDAs {
            layer_no: next_layer_no,
            layer_pda: next_layer.key(),
        };
        mts_pool.layer_pdas.push(layer_account);

        Ok(())
    }

    // User join MTS Pool
    pub fn join_mtspool(
        ctx: Context<JoinMTSPool>,
        iv_join_amt: u64,
        _unique_id: Pubkey,
        join_price: u64,
    ) -> Result<()> {
        let user = &ctx.accounts.user;
        let mts_pool = &mut ctx.accounts.mts_pool;
        let layer_user_pda = &mut ctx.accounts.layer_user_pda;
        let mint_token = &mut ctx.accounts.mint_token;
        let deposit_token_account = &mut ctx.accounts.deposit_token_account;
        let pool_token_account = &mut ctx.accounts.pool_token_account;
        let layer_account = &mut ctx.accounts.layer_account;
        let token_program = &ctx.accounts.token_program;

        //let join_price: u64 = 10; // current price

        // Check the join amout greater than 0
        require!(iv_join_amt > 0, MTSError::JoinAmtInvalid);

        // Check the input token equal the pool token
        require!(
            mts_pool.mint_token == mint_token.key(),
            MTSError::InTokenNEPoolToken
        );

        // Check the status of pool
        require!(
            mts_pool.pool_status == PoolState::Investing,
            MTSError::PoolCantJoin
        );

        // Check the join layer is Opening status
        require!(
            layer_account.layer_status == LayerState::Opening.to_code(),
            MTSError::LayerNotOpening
        );

        // Check the join amount less remain amount of the layer.
        let remain_amount = layer_account.layer_vol - layer_account.curl_amt;
        require!(
            iv_join_amt <= remain_amount,
            MTSError::JoinAmtExceedRemainAmt
        );

        //transfer tokens from the user's account to the pool's account
        let cpi_program = token_program.to_account_info();

        // transfer mint token from user's token account to mtspool's token account
        let cpi_accounts = SplTransfer {
            from: deposit_token_account.to_account_info().clone(),
            to: pool_token_account.to_account_info().clone(),
            authority: user.to_account_info().clone(),
        };

        token::transfer(CpiContext::new(cpi_program, cpi_accounts), iv_join_amt)?;

        // Modify user's data in the layer data account.
        // get token's on chain price
        let clock = Clock::get()?;

        layer_user_pda.user_account = user.key();
        //layer_user_pda.index = unique_id;
        layer_user_pda.deposit_account = deposit_token_account.key();
        layer_user_pda.join_amount = iv_join_amt;
        layer_user_pda.in_price = join_price;
        layer_user_pda.join_time = clock.unix_timestamp;
        layer_user_pda.settled_cost_amt = 0;
        layer_user_pda.alloced_profit_amt = 0;
        layer_user_pda.is_redeemed = false;
        layer_user_pda.redeem_time = 0;

        layer_account.user_acct_number += 1;
        layer_account.last_user_pda = layer_user_pda.key();

        // Updata layer current amount(curl_amt)
        layer_account.curl_amt += iv_join_amt;

        // Update layer cost value
        let amt_value = iv_join_amt * join_price;
        layer_account.total_cost += amt_value;

        // Update layer state
        if layer_account.curl_amt >= layer_account.layer_vol {
            layer_account.layer_status = 1;
        }

        // Updata the total amount and total cost in the pool data
        mts_pool.token_amount_sum += iv_join_amt;
        mts_pool.total_cost += amt_value;

        Ok(())
    }

    // User redeem token
    pub fn redeem_token(ctx: Context<RedeemToken>) -> Result<()> {
        let mts_pool = &mut ctx.accounts.mts_pool;
        let layer_user_pda = &mut ctx.accounts.layer_user_pda;

        let pool_token_account = &ctx.accounts.pool_token_account;
        let user_token_account = &ctx.accounts.user_token_account;
        let fee_token_account = &ctx.accounts.fee_token_account;
        let layer_account = &mut ctx.accounts.layer_account;
        let token_program = &ctx.accounts.token_program;

        require!(
            layer_user_pda.is_redeemed == false,
            MTSError::AlreadyRedeemed
        );

        let mut redeem_amt: u64 = 0;

        let last_layer = mts_pool.layer_pdas.last().unwrap().clone();

        // Get current price.
        let timestamp = Clock::get()?.unix_timestamp;
        //let current_price = 1000_u64;

        // User can not redeem during stop-profit state.
        // Last layer user cant redeem when pool is investable state,
        // user in other layer can redeem at anytime.
        // Get user account amount in all layers
        if layer_account.key() != Pubkey::default() {
            match mts_pool.pool_status {
                PoolState::Investing => {
                    if layer_account.key() != last_layer.layer_pda {
                        let user_cost = layer_user_pda.join_amount * layer_user_pda.in_price;
                        // Update layer cost value
                        layer_account.total_cost -= user_cost;
                        // Update the pool total cost
                        mts_pool.total_cost -= user_cost;
                        // Update token summary amount in the pool account
                        mts_pool.token_amount_sum -= layer_user_pda.join_amount;

                        // Redeem deposited amount
                        redeem_amt = layer_user_pda.join_amount;
                        // Update the redeem state
                        layer_user_pda.is_redeemed = true;
                        layer_user_pda.redeem_time = timestamp;
                    } else {
                        return Err(error!(MTSError::LLayreNotRedeem));
                    }
                }
                PoolState::StopedProfit => {
                    return Err(error!(MTSError::RedeemAfterSettle));
                }
                PoolState::Settled => {
                    require!(mts_pool.total_profit > 0, MTSError::ProfitInsufficient);

                    // User's personal cost
                    let user_cost = layer_user_pda.join_amount * layer_user_pda.in_price;
                    // User's base profit
                    let user_base_profit: u64 = (100 - mts_pool.prof_share_pect) as u64
                        * mts_pool.total_profit
                        * (user_cost / mts_pool.total_cost)
                        / 100;
                    // User's settle cost amount
                    layer_user_pda.settled_cost_amt = user_cost / mts_pool.settle_price;

                    if layer_account.key() == last_layer.layer_pda {
                        // User's extra profit
                        let user_extra_profit: u64 = mts_pool.prof_share_pect as u64
                            * mts_pool.total_profit
                            * (user_cost / layer_account.total_cost);
                        // User's profit allocate amount
                        layer_user_pda.alloced_profit_amt =
                            (user_base_profit + user_extra_profit) / mts_pool.settle_price;
                    } else {
                        // User's profit allocate amount
                        layer_user_pda.alloced_profit_amt =
                            user_base_profit / mts_pool.settle_price;
                    }

                    // Redeem amount
                    redeem_amt =
                        layer_user_pda.settled_cost_amt + layer_user_pda.alloced_profit_amt;
                    // Update the redeem state
                    layer_user_pda.is_redeemed = true;
                    layer_user_pda.redeem_time = timestamp;
                }
            };
        }

        if redeem_amt > 0 {
            // Update layer cost value
            //(*ctx.accounts.layer_account.load_mut()?).cost_value -= cost_sum;

            // Update the pool total cost
            //mts_pool.total_cost -= cost_sum;

            // Update token summary amount in the pool account
            //mts_pool.token_amount_sum -= redeem_amt_sum;

            // Calculate redeem amount and redeem fee
            let fee_rate: u64 = 2;
            let redeem_fee = (redeem_amt * fee_rate) / 1000;
            let redeem_amt = redeem_amt - redeem_fee;

            // Transfer token from mtspool to user's token accout
            let cpi_program = token_program.to_account_info();

            let user_cpi_accounts = SplTransfer {
                from: pool_token_account.to_account_info().clone(),
                to: user_token_account.to_account_info().clone(),
                authority: mts_pool.to_account_info().clone(),
            };
            //let mts_pool_pubkey = mts_pool.key();

            // let seeds = vec![
            //     b"zmts-pool".as_ref(),
            //     //mts_pool_pubkey.as_ref(),
            //     mts_pool.mint_token.as_ref(),
            //     mts_pool.creator_account.as_ref(),
            // ];
            // let signer_seeds = vec![seeds.as_slice()]; //&[&seeds[..]];

            //let bump = *ctx.bumps.get("pool_token_account").unwrap();
            //let seeds = &[b"zmts-pool".as_ref(), mts_pool_pubkey.as_ref(),&[bump]];

            //let bump = *ctx.bumps.get("mts_pool").unwrap();

            let seeds = &[
                b"zmts-pool".as_ref(),
                mts_pool.mint_token.as_ref(),
                mts_pool.creator_account.as_ref(),
                &[mts_pool.pool_pda_bump],
            ];

            let signer_seeds = &[&seeds[..]];

            token::transfer(
                CpiContext::new_with_signer(
                    cpi_program.clone(),
                    user_cpi_accounts,
                    signer_seeds.as_slice(),
                ),
                redeem_amt,
            )?;

            msg!("Transfer token from pool token account to user's token account success!");

            // Transfer tr fee to fee account
            let fee_cpi_accounts = SplTransfer {
                from: pool_token_account.to_account_info().clone(),
                to: fee_token_account.to_account_info().clone(),
                authority: mts_pool.to_account_info().clone(),
            };
            token::transfer(
                CpiContext::new_with_signer(
                    cpi_program.clone(),
                    fee_cpi_accounts,
                    signer_seeds.as_slice(),
                ),
                redeem_fee,
            )?;

            msg!("Transfer token from pool token account to fee's token account success!");
        }
        Ok(())
    }

    // Change MTS Pool status
    pub fn change_mtspool_state(
        ctx: Context<ChangeMTSPoolState>,
        iv_state: PoolState,
        current_price: u64,
    ) -> Result<()> {
        let mts_pool = &mut ctx.accounts.mts_pool;

        match iv_state {
            // Set Stop-Profit state
            PoolState::StopedProfit => {
                //let current_price = 1000_u64;
                // Two options: 1.Reached goal price 2. Reached goal profit price
                require!(
                    current_price >= mts_pool.goal_price,
                    MTSError::GoalPriceNotArrived
                );

                //let average_price: u64 = mts_pool.total_cost / mts_pool.token_amount_sum;
                //let stop_profit_price: u64 = average_price * (1 + average_price);
                //require!(
                //  current_price >= stop_profit_price,
                //    MTSError::GoalProfRatNotArrived
                //);

                require!(
                    mts_pool.pool_status == PoolState::Investing,
                    MTSError::PoolNotInvest
                );

                // Update pool state
                mts_pool.pool_status = PoolState::StopedProfit;
            }
            // Set settle state
            PoolState::Settled => {
                require!(
                    mts_pool.pool_status == PoolState::StopedProfit,
                    MTSError::PoolNotStpp
                );
                // Settle the pool token, calculate the user cost token amount and should be allocated profit amount

                // Change the user data in the pool layer
                // Update pool state
                mts_pool.pool_status = PoolState::Settled;
            }
            _ => msg!("Importing error state!"),
        }

        Ok(())
    }

    // Calculate and save the total profit of pool.
    pub fn calc_pool_profit(ctx: Context<CalcPoolProfit>, current_price: u64) -> Result<()> {
        let mts_pool = &mut ctx.accounts.mts_pool;

        require!(
            mts_pool.pool_status == PoolState::StopedProfit,
            MTSError::PoolNotStpp
        );

        //let current_price = 1000_u64;
        let total_profit = mts_pool.token_amount_sum * current_price - mts_pool.total_cost;

        mts_pool.total_profit = total_profit;

        Ok(())
    }

    // Calculate user's settle amount on layer
    // pub fn calc_user_settle_amt(ctx: Context<CalcSettleAmtOnLayer>) -> Result<()> {
    //     let mts_pool = &mut ctx.accounts.mts_pool;
    //     let current_price = 1000_u64;

    //     require!(mts_pool.total_profit > 0, MTSError::ProfitInsufficient);

    //     let last_layer = mts_pool.layer_pdas.last().unwrap().clone();

    //     if last_layer == ctx.accounts.layer_acct.key() {
    //         // Last layer user's settle logic
    //         // Loop the user's data in the layer
    //         for user in (*ctx.accounts.layer_acct.load_mut()?).layer_users.iter_mut() {
    //             // User's personal cost
    //             let user_cost = user.join_amount * user.in_price;
    //             // User's base profit
    //             let user_base_profit = ( 10000 - mts_pool.prof_share_pect ) * mts_pool.total_profit *
    //                                 ( user_cost / mts_pool.total_cost );
    //             // User's extra profit
    //             let user_extra_profit = mts_pool.prof_share_pect * mts_pool.total_profit *
    //                                 ( user_cost / (*ctx.accounts.layer_acct.load()?).total_cost);
    //             // User's settle cost amount
    //             user.settled_cost_amt = user_cost / current_price;
    //             // User's profit allocate amount
    //             user.alloced_profit_amt =  ( user_base_profit + user_extra_profit ) / current_price;
    //         }
    //     } else {
    //         // Other layers user's settle logic(apart form last layer)
    //         // Loop the user's data in the layer
    //         for user in (*ctx.accounts.layer_acct.load_mut()?).layer_users.iter_mut() {
    //             // User's personal cost
    //             let user_cost = user.join_amount * user.in_price;
    //             // User's base profit
    //             let user_base_profit = ( 10000 - mts_pool.prof_share_pect ) * mts_pool.total_profit *
    //                                 ( user_cost / mts_pool.total_cost );
    //             // User's settle cost amount
    //             user.settled_cost_amt = user_cost / current_price;
    //             // User's profit allocate amount
    //             user.alloced_profit_amt =  user_base_profit  / current_price;
    //         }
    //     }

    // }
}
//system_program, which will own our new account and handle the SOL transfer between accounts
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub initializer: Signer<'info>,
    #[account(
        init,
        seeds = [b"zpermit-token", initializer.key().as_ref()],
        bump,
        payer = initializer,
        space = 10240, //>= 8 +32 +4 +32 * n (n ≈ 318)
        //has_one = initializer,
    )]
    pub permit_tokens: Account<'info, PermitTokens>,
    pub system_program: Program<'info, System>,
}

// add mts tokens
#[derive(Accounts)]
pub struct AddPermitToken<'info> {
    #[account(mut)]
    pub initializer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"zpermit-token", initializer.key().as_ref()],
        bump,
        // realloc = len as usize,
        // realloc::payer = initializer,
        // realloc::zero = false, 
    )]
    pub permit_tokens: Account<'info, PermitTokens>,
    pub system_program: Program<'info, System>,
}

// delete mts tokens
#[derive(Accounts)]
pub struct DelPermitToken<'info> {
    #[account(mut)]
    pub initializer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"zpermit-token", initializer.key().as_ref()],
        bump,
        // realloc = len as usize,
        // realloc::payer = initializer,
        // realloc::zero = false,
    )]
    pub permit_tokens: Account<'info, PermitTokens>,
    pub system_program: Program<'info, System>,
}

// initial MTS pool
#[derive(Accounts)]
#[instruction(iv_init_amt: u64, _unique_id: Pubkey)]
pub struct CreateMTSPool<'info> {
    // the creator
    #[account(mut)]
    pub creator: Signer<'info>,
    //seed: the mint token and the pubkey of creator's account.
    //so one account can only create one pool for a given mint token.
    #[account(
         init,
         seeds = [_unique_id.key().as_ref()], 
         bump,
         payer = creator,
         space = 1024 as usize //831 Bytes used
     )]
    pub mts_pool: Box<Account<'info, MTSPoolData>>,
    // First layer account
    #[account(
         init,
         seeds = [b"Layer",b"00001",mts_pool.key().as_ref()],//1_u16.to_be_bytes().as_ref()
         bump,
         payer = creator,
         space = 10 * 1024 as usize
     )]
    pub layer_one: Account<'info, MTSPoolLayerAccount>,
    // mint token
    #[account(mut)]
    pub mint_token: Account<'info, Mint>,
    // token account for mint token
    #[account(
        init,
        seeds = [b"zmts-pool",mts_pool.key().as_ref()],
        bump,
        payer = creator,
        token::mint = mint_token,
        token::authority = mts_pool,
    )]
    pub pool_token_account: Account<'info, TokenAccount>,
    #[account(
        mut @ MTSError::DepositAccountNotMutable,
        constraint = creator_deposit_token_account.amount >= iv_init_amt
        @ MTSError::CreatorAccountInsufficient,
    )]
    pub creator_deposit_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub permit_tokens: Account<'info, PermitTokens>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(iv_init_amt: u64)]
pub struct InitMTSPool<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(mut)]
    pub mts_pool: Box<Account<'info, MTSPoolData>>,
    #[account(mut)]
    pub layer_one: Account<'info, MTSPoolLayerAccount>,
    #[account(
        init,
        seeds = [creator.key().as_ref(),mts_pool.key().as_ref(),b"1"],//1_u32.to_be_bytes().as_ref()
        bump,
        payer = creator,
        space = 150 as usize
    )]
    pub layer_user_pda: Account<'info, MTSLayerUserData>,
    #[account(mut)]
    pub pool_token_account: Account<'info, TokenAccount>,
    #[account(
        mut @ MTSError::DepositAccountNotMutable,
        constraint = creator_deposit_token_account.amount >= iv_init_amt
        @ MTSError::CreatorAccountInsufficient,
    )]
    pub creator_deposit_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// Create next layer account
#[derive(Accounts)]
#[instruction(_iv_layer_inx: u16)]
pub struct CreateNextLayer<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(mut)]
    pub last_layer: Account<'info, MTSPoolLayerAccount>,
    #[account(
         init,
         seeds = [b"Layer",_iv_layer_inx.to_be_bytes().as_ref(),mts_pool.key().as_ref()],
         bump,
         payer = creator,
         space = 10 * 1024 as usize // *  Bytes used
     )]
    pub next_layer: Account<'info, MTSPoolLayerAccount>,
    #[account(mut)]
    pub mts_pool: Box<Account<'info, MTSPoolData>>,
    pub system_program: Program<'info, System>,
}

// Join pool layer
#[derive(Accounts)]
#[instruction(iv_join_amt: u64, _unique_id: Pubkey)]
pub struct JoinMTSPool<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub mts_pool: Box<Account<'info, MTSPoolData>>,
    #[account(
        init,
        seeds = [_unique_id.key().as_ref()],
        bump,
        payer = user,
        space = 150 as usize
    )]
    pub layer_user_pda: Account<'info, MTSLayerUserData>,
    #[account(mut)]
    pub mint_token: Account<'info, Mint>,
    #[account(
        mut @ MTSError::DepositAccountNotMutable,
        constraint = deposit_token_account.amount >= iv_join_amt
        @ MTSError::UserAccountInsufficient,
    )]
    pub deposit_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub layer_account: Account<'info, MTSPoolLayerAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RedeemToken<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub mts_pool: Box<Account<'info, MTSPoolData>>,
    #[account(mut)]
    pub layer_user_pda: Account<'info, MTSLayerUserData>,
    #[account(mut)]
    pub mint_token: Account<'info, Mint>,
    #[account(
        mut,
        seeds = [b"zmts-pool",mts_pool.key().as_ref()],
        bump, 
    )]
    pub pool_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub fee_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub layer_account: Account<'info, MTSPoolLayerAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ChangeMTSPoolState<'info> {
    #[account(mut)]
    pub mts_pool: Box<Account<'info, MTSPoolData>>,
    #[account(mut)]
    pub layer_acct1: Option<Account<'info, MTSPoolLayerAccount>>,
    #[account(mut)]
    pub layer_acct2: Option<Account<'info, MTSPoolLayerAccount>>,
    #[account(mut)]
    pub layer_acct3: Option<Account<'info, MTSPoolLayerAccount>>,
    #[account(mut)]
    pub layer_acct4: Option<Account<'info, MTSPoolLayerAccount>>,
    #[account(mut)]
    pub layer_acct5: Option<Account<'info, MTSPoolLayerAccount>>,
}

#[derive(Accounts)]
pub struct CalcPoolProfit<'info> {
    #[account(mut)]
    pub mts_pool: Box<Account<'info, MTSPoolData>>,
}

#[derive(Accounts)]
pub struct CalcSettleAmtOnLayer<'info> {
    #[account(mut)]
    pub mts_pool: Box<Account<'info, MTSPoolData>>,
    #[account(mut)]
    pub layer_acct: Option<Account<'info, MTSPoolLayerAccount>>,
}

#[derive(Default, AnchorSerialize, AnchorDeserialize, Copy, Clone)]
pub struct PoolInfo {
    pub pool_pubkey: Pubkey,
    pub pool_id: u32,
}

#[account]
pub struct PermitTokens {
    pub initializer: Pubkey,
    // spl mint token account
    pub ptokens: Vec<Pubkey>,
    // The pool ids
    pub pools: Vec<PoolInfo>,
}

//#[derive(Default, AnchorSerialize, AnchorDeserialize, Copy, Clone)]
#[account]
pub struct MTSLayerUserData {
    // User account in the mtspool
    pub user_account: Pubkey, // 32
    // User index
    pub index: u32, //4
    // User deposit account (token account)
    pub deposit_account: Pubkey, //32
    // User join token amount in the mtspool
    pub join_amount: u64, //8
    // Price when user deposited in
    pub in_price: u64, //8
    // Join timestamp
    pub join_time: i64, //8
    // Settled cost amount
    pub settled_cost_amt: u64, //8
    // Allocated Profit amount(Include base profit and extra profit)
    pub alloced_profit_amt: u64, //8
    // Redeem status
    pub is_redeemed: bool, //1
    // Redeem timestamp
    pub redeem_time: i64, //8
}

//#[derive(Default, AnchorSerialize, AnchorDeserialize, Copy, Clone)]
#[account]
pub struct MTSPoolLayerAccount {
    // Mtspool layer（from 0 to n）
    pub layer_no: u8, //1
    // Layer start price
    pub start_price: u64, //8
    // The volum of current layer
    pub layer_vol: u64, //8
    // The tokens amount of current layer
    pub curl_amt: u64, //8
    // The total cost value
    pub total_cost: u64, //8
    // Layer status
    pub layer_status: u8, // 1
    // The users account number in current layer
    pub user_acct_number: u32,
    // The last user account
    pub last_user_pda: Pubkey,
}

#[derive(Default, AnchorSerialize, AnchorDeserialize, Copy, Clone, PartialEq)]
pub struct MTSPoolLayerPDAs {
    //layner no
    pub layer_no: u8, // 1
    //layre PDA address
    pub layer_pda: Pubkey, //32
}

#[account]
pub struct MTSPoolData {
    // The pool account bump
    pub pool_pda_bump: u8, //1
    // The creator of mtspool
    pub creator_account: Pubkey, //32
    // The mint token for this mtspool(represent SPL Token X)
    pub mint_token: Pubkey, //32
    // Address of token X liquidity account(token account for SPL Token X)
    pub token_account: Pubkey, //32
    // Initial token amount
    pub init_amt: u64, //8
    // The fall percent(to decide enable next layer)
    pub fall_pect: u8, //1(two decimals)
    // The multiple of next layer(base up layer)
    pub multiple: u32, //4
    // Add uint
    pub add_unit: u64, //8
    // Profit target price
    pub goal_price: u64, //4
    // Target profit ratio
    pub goal_prof_rat: u8, //1
    // Pool settle price
    pub settle_price: u64, //4
    // The share percent for profit
    pub prof_share_pect: u8, //1
    // The state of mtspool
    pub pool_status: PoolState, //1
    // Pool token account to receive the withdrawal fees
    pub pool_fee_account: Pubkey, //32
    // the fee information
    //pub fees: Fees,
    // Layer pdas for the mtspool
    //pub layer_pdas: [MTSPoolLayerPDAs; 20], // 33 * 20
    pub layer_pdas: Vec<MTSPoolLayerPDAs>, // 33 * 20
    // The max user number for layer(should LE 100)
    pub max_layer_user_no: u8, //1
    // The max lyaer number(should LE 20)
    pub max_layers: u8, //1
    // The amount sumarrize of token X
    pub token_amount_sum: u64, //8
    // Pool total cost
    pub total_cost: u64,
    // Pool total profit
    pub total_profit: u64,
    // Pool create timestamp
    pub crete_time: i64, //8
}
#[derive(Default, AnchorSerialize, AnchorDeserialize, Copy, Clone)]
pub struct PoolInitParas {
    // The layre one volum
    pub layerone_vol: u64,
    // The token price when creating the pool
    pub in_price: u64,
}

#[error_code]
pub enum MTSError {
    // Error message for method add_permit_token.
    #[msg("Permited Mint Token for MTS pool already exist!")]
    MintTokenExist,

    #[msg("Permit token exceeded the largest permit token number(318)!")]
    PermitTokenExceedLargestNumber,

    // Error message for method del_permit_token.
    #[msg("Cancellation Mint Token not exist!")]
    MintTokenNotExist,

    // Error message for method create_mts_pool.
    #[msg("Imported Mint Token does't permited for MTS pool!")]
    MinTokenNotPermitedForMTSPool,

    #[msg("Initial amount cannot be zero!")]
    InitAmtCantbezero,

    // Error message for method init_mts_pool.
    #[msg("Layre amount volume cannot be zero!")]
    LayerVolCantbezero,

    #[msg("Importing price cannot be zero!")]
    InPriceCantbezero,

    #[msg("Initial amount are not multiples of add uinit!")]
    InintAmtNotMlutiplesOfUnit,

    #[msg("Add unit should not equal zero when initial MTS pool!")]
    AddUnitIsZero,

    // Error message for method Create_next_layer
    #[msg("Importing last layer acocunt is not the last layer account in the pool!")]
    LastlayerError,

    #[msg("Last layer acocunt is not appending state, cant create next layer!")]
    LastlayerNotPending,

    #[msg("Current price higher than layer start price!")]
    PriceGTStartprice,

    #[msg("Next layer number supered the max layer amount!")]
    NextLayerSupMaxAmt,

    // Error message for method join_mtspool.
    #[msg("Join amount must greater than 0!")]
    JoinAmtInvalid,

    #[msg("Input mint token is not equal pool mint token!")]
    InTokenNEPoolToken,

    #[msg("Pool are not investing status and cant be join!")]
    PoolCantJoin,

    #[msg("The join layer are not opening status!")]
    LayerNotOpening,

    #[msg("Join amount exceed the remain amount of layer!")]
    JoinAmtExceedRemainAmt,

    #[msg("Creator deposit token account not mutable!")]
    DepositAccountNotMutable,

    // Error message for method redeem.
    #[msg("Pool is still settling now, please redeem after settlement finished!")]
    RedeemAfterSettle,

    #[msg("Already redeemed, prohibition of double redemption!")]
    AlreadyRedeemed,

    #[msg("Last layer user cant redeem when pool is investable state!")]
    LLayreNotRedeem,

    // Error message for method change_mtspool_state
    #[msg("Goal price not arrived, can not stop profit!")]
    GoalPriceNotArrived,

    #[msg("Pool are not investing state, can't stop profit!")]
    PoolNotInvest,

    #[msg("Pool are not Stop-Profit state, can't settle!")]
    PoolNotStpp,

    // Error message for [Accounts].
    #[msg("Creator token account are insufficient!")]
    CreatorAccountInsufficient,

    #[msg("User token account are insufficient!")]
    UserAccountInsufficient,

    #[msg("Pool profit are insufficient or pool profit are not be calcaluted!")]
    ProfitInsufficient,
}

#[derive(AnchorSerialize, AnchorDeserialize, Copy, Clone, PartialEq)]
pub enum PoolState {
    // Investing state, user can jonin pool.
    Investing,

    // Stoped profit state, token goal price already achieved.
    StopedProfit,

    // Settled state, the profit in the pool already be settled.
    Settled,
}

// impl PoolState {
//     fn to_code(&self) -> u8 {
//         match self {
//             PoolState::Investing => 0,
//             PoolState::StopedProfit => 1,
//             PoolState::Settled => 2,
//         }
//     }
// }

pub enum LayerState {
    // Opening state, user can join the pool.
    Opening,

    // Pending state, user can not join the pool.
    Pending,
}

impl LayerState {
    fn to_code(&self) -> u8 {
        match self {
            LayerState::Opening => 0,
            LayerState::Pending => 1,
        }
    }
}

// impl<'info> RedeemToken<'info> {
//     fn sum_redeem_amt(
//         layer_account: &mut MTSPoolLayerAccount,
//         user_account: &Pubkey,
//         current_price: &u64,
//         timestamp: i64,
//     ) -> u64 {
//         let mut redeem_amt_sum: u64 = 0;
//         for user_data in layer_account.layer_users.iter_mut() {
//             if user_data.user_account == *user_account {
//                 // Redeem deposited amount
//                 redeem_amt_sum =
//                     redeem_amt_sum + (user_data.amount * user_data.in_price) / *current_price;

//                 // Redeem allocated profit amount
//                 redeem_amt_sum += user_data.alloc_profit;

//                 // Update the redeem state
//                 user_data.is_redeemed = true;
//                 user_data.redeem_time = timestamp;
//             }
//         }
//         return redeem_amt_sum;
//     }
// }

// impl<'info> ChangeMTSPoolState<'info> {
//     fn get_layer_cost(
//         layer_account: &mut MTSPoolLayerAccount,
//     ) -> u64 {
//         for user_data in layer_account.layer_users.iter() {
//             // Account cost
//             let per_acct_cost = user_data.join_amount * user_data.in_price;
//             // Layer total cost
//             let total_acct_cost = total_acct_cost + per_acct_cost;
//         }
//         return total_acct_cost;
//     }

//     fn settle_layer(
//         mts_pool: &mut MTSPoolData,
//         layer_account: &mut MTSPoolLayerAccount,
//         ) -> bool {
//         let layer_cost =  get_layer_cost(layer_account);
//         let (unlastl_total_cost, lastl_total_cost) =
//         // Total cost
//         let total_cost = unlastl_total_cost + lastl_total_cost;
//     }
// }
