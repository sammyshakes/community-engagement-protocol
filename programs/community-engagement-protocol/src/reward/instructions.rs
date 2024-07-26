use super::state::*;
use crate::errors::CepError;
use crate::group_hub::state::GroupHub;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

pub fn initialize_user_rewards(ctx: Context<InitializeUserRewards>) -> Result<()> {
    let user_rewards = &mut ctx.accounts.user_rewards;
    user_rewards.user = ctx.accounts.user.key();
    user_rewards.rewards = vec![];
    Ok(())
}

pub fn create_fungible_reward(
    ctx: Context<CreateFungibleReward>,
    name: String,
    description: String,
    supply: u64,
) -> Result<()> {
    let reward = &mut ctx.accounts.reward;
    let group_hub = &ctx.accounts.group_hub;
    let clock = Clock::get()?;

    if name.chars().count() > 50 {
        return Err(CepError::NameTooLong.into());
    }
    if description.chars().count() > 200 {
        return Err(CepError::DescriptionTooLong.into());
    }

    reward.group_hub = group_hub.key();
    reward.name = name;
    reward.description = description;
    reward.reward_type = RewardType::Fungible {
        token_mint: ctx.accounts.token_mint.key(),
        token_supply: supply,
    };
    reward.created_at = clock.unix_timestamp;
    reward.updated_at = clock.unix_timestamp;

    Ok(())
}

pub fn create_non_fungible_reward(
    ctx: Context<CreateNonFungibleReward>,
    name: String,
    description: String,
    metadata_uri: String,
) -> Result<()> {
    let reward = &mut ctx.accounts.reward;
    let group_hub = &ctx.accounts.group_hub;
    let clock = Clock::get()?;

    if name.chars().count() > 50 {
        return Err(CepError::NameTooLong.into());
    }
    if description.chars().count() > 200 {
        return Err(CepError::DescriptionTooLong.into());
    }
    if metadata_uri.chars().count() > 200 {
        return Err(CepError::UriTooLong.into());
    }

    reward.group_hub = group_hub.key();
    reward.name = name;
    reward.description = description;
    reward.reward_type = RewardType::NonFungible {
        token_mint: ctx.accounts.token_mint.key(),
        metadata_uri,
    };
    reward.created_at = clock.unix_timestamp;
    reward.updated_at = clock.unix_timestamp;

    Ok(())
}

pub fn issue_fungible_reward(ctx: Context<IssueFungibleReward>, amount: u64) -> Result<()> {
    let reward = &ctx.accounts.reward;
    let user_reward = &mut ctx.accounts.user_reward;
    let clock = Clock::get()?;

    // Ensure the reward is fungible
    if let RewardType::Fungible {
        token_mint,
        token_supply,
    } = reward.reward_type
    {
        if token_mint != ctx.accounts.token_mint.key() {
            return Err(CepError::InvalidRewardType.into());
        }
        if amount > token_supply {
            return Err(CepError::InsufficientRewardSupply.into());
        }
    } else {
        return Err(CepError::InvalidRewardType.into());
    }

    user_reward.user = ctx.accounts.user.key();
    user_reward.reward = reward.key();
    user_reward.group_hub = reward.group_hub;
    user_reward.awarded_at = clock.unix_timestamp;

    ctx.accounts.user_rewards.rewards.push(reward.key());

    // Mint tokens to the user's account
    token::mint_to(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::MintTo {
                mint: ctx.accounts.token_mint.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        amount,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct InitializeUserRewards<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 4 + 200 * 32 // Discriminator + user pubkey + vec len + max 200 reward pubkeys
    )]
    pub user_rewards: Account<'info, UserRewards>,
    pub user: Signer<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateFungibleReward<'info> {
    #[account(mut)]
    pub group_hub: Account<'info, GroupHub>,
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 50 + 200 + 32 + 8 + 8 + 8 // Adjust space as needed
    )]
    pub reward: Account<'info, Reward>,
    #[account(
        init,
        payer = authority,
        mint::decimals = 0,
        mint::authority = authority.key(),
        mint::freeze_authority = authority.key(),
    )]
    pub token_mint: Account<'info, Mint>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct CreateNonFungibleReward<'info> {
    #[account(mut)]
    pub group_hub: Account<'info, GroupHub>,
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 50 + 200 + 32 + 200 + 8 + 8 // Adjust space as needed
    )]
    pub reward: Account<'info, Reward>,
    #[account(
        init,
        payer = authority,
        mint::decimals = 0,
        mint::authority = authority.key(),
        mint::freeze_authority = authority.key(),
    )]
    pub token_mint: Account<'info, Mint>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct IssueFungibleReward<'info> {
    #[account(mut)]
    pub group_hub: Account<'info, GroupHub>,
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 32 + 8
    )]
    pub user_reward: Account<'info, UserReward>,
    #[account(mut)]
    pub reward: Account<'info, Reward>,
    /// CHECK: This account is not read or written in the instruction
    pub user: UncheckedAccount<'info>,
    #[account(mut)]
    pub user_rewards: Account<'info, UserRewards>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    #[account(mut)]
    pub token_mint: Account<'info, Mint>,
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = token_mint,
        associated_token::authority = user,
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}
