use super::state::*;
use crate::brand::state::Brand;
use crate::errors::CepError;
use crate::ProgramState;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

pub fn create_fungible_reward(
    ctx: Context<CreateFungibleReward>,
    name: String,
    description: String,
    supply: u64,
) -> Result<()> {
    let reward = &mut ctx.accounts.reward;
    let brand = &ctx.accounts.brand;
    let clock = Clock::get()?;

    if name.chars().count() > 50 {
        return Err(CepError::NameTooLong.into());
    }
    if description.chars().count() > 200 {
        return Err(CepError::DescriptionTooLong.into());
    }

    reward.brand = brand.key();
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
    let brand = &ctx.accounts.brand;
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

    reward.brand = brand.key();
    reward.name = name;
    reward.description = description;
    reward.reward_type = RewardType::NonFungible {
        token_mint: ctx.accounts.token_mint.key(),
        metadata_uri,
    };
    reward.created_at = clock.unix_timestamp;
    reward.updated_at = clock.unix_timestamp;
    reward.issued_count = 0; // Initialize issued_count

    Ok(())
}

pub fn issue_fungible_reward(ctx: Context<IssueFungibleReward>, amount: u64) -> Result<()> {
    let reward = &ctx.accounts.reward;

    // Ensure the reward is fungible
    if let RewardType::Fungible {
        token_mint,
        token_supply,
    } = reward.reward_type
    {
        require!(
            token_mint == ctx.accounts.token_mint.key(),
            CepError::InvalidRewardType
        );
        require!(amount <= token_supply, CepError::InsufficientRewardSupply);
    } else {
        return Err(CepError::InvalidRewardType.into());
    }

    // Mint tokens to the user's account
    token::mint_to(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::MintTo {
                mint: ctx.accounts.token_mint.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.tronic_admin.to_account_info(),
            },
        ),
        amount,
    )?;

    Ok(())
}

pub fn issue_non_fungible_reward(ctx: Context<IssueNonFungibleReward>) -> Result<()> {
    let reward = &mut ctx.accounts.reward;
    let instance = &mut ctx.accounts.reward_instance;
    let clock = Clock::get()?;

    if let RewardType::NonFungible { token_mint, .. } = reward.reward_type {
        require!(
            token_mint == ctx.accounts.token_mint.key(),
            CepError::InvalidRewardType
        );
    } else {
        return Err(CepError::InvalidRewardType.into());
    }

    // Increment the issued count and use it as the token_id
    reward.issued_count += 1;

    instance.reward = reward.key();
    instance.owner = ctx.accounts.user.key();
    instance.token_id = reward.issued_count;
    instance.issued_at = clock.unix_timestamp;

    // Mint the NFT to the user's account
    token::mint_to(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::MintTo {
                mint: ctx.accounts.token_mint.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.tronic_admin.to_account_info(),
            },
        ),
        1,
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct CreateFungibleReward<'info> {
    #[account(mut)]
    pub brand: Account<'info, Brand>,
    #[account(
        init,
        payer = tronic_admin,
        space = 8 // Discriminator
            + 32 // Brand pubkey
            + 50 // Name
            + 200 // Description
            + 32 // Reward type discriminator
            + 32 // Token mint pubkey
            + 8 // Token supply
            + 8 // Created at
            + 8 // Updated at
    )]
    pub reward: Account<'info, Reward>,

    #[account(
        init,
        payer = tronic_admin,
        mint::decimals = 0,
        mint::authority = tronic_admin.key(),
        mint::freeze_authority = tronic_admin.key(),
    )]
    pub token_mint: Account<'info, Mint>,

    #[account(
        seeds = [b"program-state"],
        bump,
        constraint = program_state.tronic_admin == tronic_admin.key() @ CepError::UnauthorizedTronicAdmin
    )]
    pub program_state: Account<'info, ProgramState>,

    #[account(mut)]
    pub tronic_admin: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct CreateNonFungibleReward<'info> {
    #[account(mut)]
    pub brand: Account<'info, Brand>,

    #[account(
        init,
        payer = tronic_admin,
        space = 8 // Discriminator
            + 32 // Brand pubkey
            + 50 // Name
            + 200 // Description
            + 32 // Reward type discriminator
            + 32 // Token mint pubkey
            + 200 // Metadata URI
            + 8 // Created at
            + 8 // Updated at
            + 8 // Issued count
    )]
    pub reward: Account<'info, Reward>,

    #[account(
        init,
        payer = tronic_admin,
        mint::decimals = 0,
        mint::authority = tronic_admin.key(),
        mint::freeze_authority = tronic_admin.key(),
    )]
    pub token_mint: Account<'info, Mint>,

    #[account(
        seeds = [b"program-state"],
        bump,
        constraint = program_state.tronic_admin == tronic_admin.key() @ CepError::UnauthorizedTronicAdmin
    )]
    pub program_state: Account<'info, ProgramState>,

    #[account(mut)]
    pub tronic_admin: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct IssueFungibleReward<'info> {
    #[account(mut)]
    pub brand: Account<'info, Brand>,
    #[account(mut)]
    pub reward: Account<'info, Reward>,
    /// CHECK: This account is not read or written in the instruction
    pub user: UncheckedAccount<'info>,
    #[account(
        seeds = [b"program-state"],
        bump,
        constraint = program_state.tronic_admin == tronic_admin.key() @ CepError::UnauthorizedTronicAdmin
    )]
    pub program_state: Account<'info, ProgramState>,
    #[account(mut)]
    pub tronic_admin: Signer<'info>,
    #[account(mut)]
    pub token_mint: Account<'info, Mint>,
    #[account(
        init_if_needed,
        payer = tronic_admin,
        associated_token::mint = token_mint,
        associated_token::authority = user,
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct IssueNonFungibleReward<'info> {
    #[account(mut)]
    pub brand: Account<'info, Brand>,
    #[account(mut, has_one = brand)]
    pub reward: Account<'info, Reward>,
    #[account(
        init,
        payer = tronic_admin,
        space = 8 // Discriminator
            + 32 // Reward pubkey
            + 32 // Owner pubkey
            + 8 // Token ID
            + 8 // Issued at
    )]
    pub reward_instance: Account<'info, NonFungibleRewardInstance>,
    /// CHECK: This account is not read or written in the instruction
    pub user: UncheckedAccount<'info>,
    #[account(
        seeds = [b"program-state"],
        bump,
        constraint = program_state.tronic_admin == tronic_admin.key() @ CepError::UnauthorizedTronicAdmin
    )]
    pub program_state: Account<'info, ProgramState>,
    #[account(mut)]
    pub tronic_admin: Signer<'info>,
    #[account(mut)]
    pub token_mint: Account<'info, Mint>,
    #[account(
        init_if_needed,
        payer = tronic_admin,
        associated_token::mint = token_mint,
        associated_token::authority = user,
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
