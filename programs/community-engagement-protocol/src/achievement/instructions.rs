use super::state::*;
use crate::brand::state::Brand;
use crate::errors::CepError;
use crate::ProgramState;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        mint_new_edition_from_master_edition_via_token, Metadata,
        MintNewEditionFromMasterEditionViaToken,
    },
    token::{self, mint_to, Mint, MintTo, Token, TokenAccount},
};

pub fn create_achievement(
    ctx: Context<CreateAchievement>,
    name: String,
    description: String,
    criteria: String,
    points: u32,
) -> Result<()> {
    let achievement = &mut ctx.accounts.achievement;
    let brand = &mut ctx.accounts.brand;
    let clock = Clock::get()?;

    if name.chars().count() > 50 {
        return Err(CepError::NameTooLong.into());
    }
    if description.chars().count() > 200 {
        return Err(CepError::DescriptionTooLong.into());
    }

    achievement.brand = brand.key();
    achievement.name = name;
    achievement.description = description;
    achievement.criteria = criteria;
    achievement.points = points;
    achievement.created_at = clock.unix_timestamp;
    achievement.updated_at = clock.unix_timestamp;

    brand.achievements.push(achievement.key());

    msg!(
        "Achievement '{}' created for Brand '{}'",
        achievement.name,
        brand.name
    );
    Ok(())
}

pub fn create_fungible_achievement(
    ctx: Context<CreateFungibleAchievement>,
    name: String,
    description: String,
    criteria: String,
    points: u32,
    supply: u64,
) -> Result<()> {
    let achievement = &mut ctx.accounts.achievement;
    let brand = &mut ctx.accounts.brand;
    let clock = Clock::get()?;

    if name.chars().count() > 50 {
        return Err(CepError::NameTooLong.into());
    }
    if description.chars().count() > 200 {
        return Err(CepError::DescriptionTooLong.into());
    }

    achievement.brand = brand.key();
    achievement.name = name;
    achievement.description = description;
    achievement.criteria = criteria;
    achievement.points = points;
    achievement.created_at = clock.unix_timestamp;
    achievement.updated_at = clock.unix_timestamp;
    achievement.achievement_type = AchievementType::Fungible;
    achievement.token_mint = Some(ctx.accounts.token_mint.key());
    achievement.token_supply = Some(supply);

    brand.achievements.push(achievement.key());

    // The mint is now initialized automatically by Anchor

    msg!(
        "Fungible Achievement '{}' created for Brand '{}'",
        achievement.name,
        brand.name
    );
    Ok(())
}

#[derive(Accounts)]
pub struct CreateNonFungibleAchievement<'info> {
    #[account(mut)]
    pub brand: Account<'info, Brand>,

    #[account(
        init,
        payer = tronic_admin,
        space = 8 // Discriminator
            + 32 // Brand
            + 50 // Name
            + 200 // Description
            + 200 // Criteria
            + 4 // Points
            + 8 // Created At
            + 8 // Updated At
            + 1 // Achievement Type
            + 32 // Token Mint
            + 8 // Token Supply
            + 200 // Metadata URI
    )]
    pub achievement: Account<'info, Achievement>,

    #[account(
        init,
        payer = tronic_admin,
        mint::decimals = 0,
        mint::authority = tronic_admin.key(),
        mint::freeze_authority = tronic_admin.key(),
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        seeds = [b"program-state"],
        bump,
        constraint = program_state.tronic_admin == tronic_admin.key() @ CepError::UnauthorizedTronicAdmin
    )]
    pub program_state: Account<'info, ProgramState>,

    #[account(mut)]
    pub tronic_admin: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn create_non_fungible_achievement(
    ctx: Context<CreateNonFungibleAchievement>,
    name: String,
    description: String,
    criteria: String,
    points: u32,
    metadata_uri: String,
) -> Result<()> {
    msg!("Creating non-fungible achievement: {}", name);

    // Validate inputs
    require!(name.len() <= 100, CepError::NameTooLong);
    require!(description.len() <= 200, CepError::DescriptionTooLong);
    require!(metadata_uri.len() <= 200, CepError::UriTooLong);

    // Set achievement data
    let achievement = &mut ctx.accounts.achievement;
    achievement.brand = ctx.accounts.brand.key();
    achievement.name = name.clone();
    achievement.description = description;
    achievement.criteria = criteria;
    achievement.points = points;
    achievement.created_at = Clock::get()?.unix_timestamp;
    achievement.updated_at = achievement.created_at;
    achievement.achievement_type = AchievementType::NonFungible;
    achievement.token_mint = Some(ctx.accounts.mint.key());
    achievement.token_supply = Some(0);
    achievement.metadata_uri = Some(metadata_uri.clone());

    // Add achievement to brand
    ctx.accounts.brand.achievements.push(achievement.key());

    msg!("Non-fungible achievement created successfully");
    Ok(())
}

pub fn award_fungible_achievement(ctx: Context<AwardFungibleAchievement>) -> Result<()> {
    let achievement = &mut ctx.accounts.achievement;
    let user_achievement = &mut ctx.accounts.user_achievement;
    let clock = Clock::get()?;

    // Record the achievement award
    user_achievement.user = ctx.accounts.user.key();
    user_achievement.achievement = achievement.key();
    user_achievement.brand = achievement.brand;
    user_achievement.awarded_at = clock.unix_timestamp;

    // Add the achievement to the user's list of achievements
    ctx.accounts
        .user_achievements
        .achievements
        .push(achievement.key());

    // Mint one token to the user's associated token account
    let token_mint = &ctx.accounts.token_mint;
    let user_token_account = &ctx.accounts.user_token_account;
    let token_program = &ctx.accounts.token_program;

    mint_to(
        CpiContext::new(
            token_program.to_account_info(),
            MintTo {
                mint: token_mint.to_account_info(),
                to: user_token_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        1,
    )?;

    msg!(
        "Fungible Achievement '{}' awarded to user {}",
        achievement.name,
        ctx.accounts.user.key()
    );
    Ok(())
}

pub fn award_non_fungible_achievement(ctx: Context<AwardNonFungibleAchievement>) -> Result<()> {
    let achievement = &mut ctx.accounts.achievement;
    let user_achievement = &mut ctx.accounts.user_achievement;
    let clock = Clock::get()?;

    // Record the achievement award
    user_achievement.user = ctx.accounts.user.key();
    user_achievement.achievement = achievement.key();
    user_achievement.brand = achievement.brand;
    user_achievement.awarded_at = clock.unix_timestamp;

    // Add the achievement to the user's list of achievements
    ctx.accounts
        .user_achievements
        .achievements
        .push(achievement.key());

    // Mint a new edition of the NFT
    let edition_number = achievement.token_supply.unwrap() + 1;

    // Mint new edition
    mint_new_edition_from_master_edition_via_token(
        CpiContext::new_with_signer(
            ctx.accounts.token_metadata_program.to_account_info(),
            MintNewEditionFromMasterEditionViaToken {
                new_metadata: ctx.accounts.new_metadata.to_account_info(),
                new_edition: ctx.accounts.new_edition.to_account_info(),
                master_edition: ctx.accounts.master_edition.to_account_info(),
                new_mint: ctx.accounts.new_mint.to_account_info(),
                edition_mark_pda: ctx.accounts.edition_mark_pda.to_account_info(),
                new_mint_authority: ctx.accounts.authority.to_account_info(),
                payer: ctx.accounts.authority.to_account_info(),
                token_account_owner: ctx.accounts.authority.to_account_info(),
                token_account: ctx.accounts.token_account.to_account_info(),
                new_metadata_update_authority: ctx.accounts.authority.to_account_info(),
                metadata: ctx.accounts.metadata.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
                metadata_mint: ctx.accounts.metadata_mint.to_account_info(),
            },
            &[&[&b"mint"[..], &[1]]],
        ),
        edition_number,
    )?;

    // Transfer the new edition to the user
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.token_account.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        1,
    )?;

    // Update the achievement's token supply
    achievement.token_supply = Some(edition_number);

    msg!(
        "Non-Fungible Achievement '{}' awarded to user {}",
        achievement.name,
        ctx.accounts.user.key()
    );
    Ok(())
}

pub fn initialize_user_achievements(ctx: Context<InitializeUserAchievements>) -> Result<()> {
    let user_achievements = &mut ctx.accounts.user_achievements;
    user_achievements.user = ctx.accounts.user.key();
    user_achievements.achievements = vec![];
    Ok(())
}

pub fn get_achievement_info(ctx: Context<GetAchievementInfo>) -> Result<AchievementInfo> {
    let achievement = &ctx.accounts.achievement;
    Ok(AchievementInfo {
        name: achievement.name.clone(),
        description: achievement.description.clone(),
        criteria: achievement.criteria.clone(),
        points: achievement.points,
        brand: achievement.brand,
        created_at: achievement.created_at,
        updated_at: achievement.updated_at,
    })
}

pub fn list_user_achievements(ctx: Context<ListUserAchievements>) -> Result<Vec<Pubkey>> {
    let user_achievements = &ctx.accounts.user_achievements;
    Ok(user_achievements.achievements.clone())
}

#[derive(Accounts)]
pub struct CreateAchievement<'info> {
    #[account(mut)]
    pub brand: Account<'info, Brand>,
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 50 + 200 + 200 + 4 + 8 + 8
    )]
    pub achievement: Account<'info, Achievement>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateFungibleAchievement<'info> {
    #[account(mut)]
    pub brand: Account<'info, Brand>,
    #[account(
        init,
        payer = tronic_admin,
        space = 8 // Discriminator
            + 32 // Brand
            + 50 // Name
            + 200 // Description
            + 200 // Criteria
            + 4 // Points
            + 8 // Created At
            + 8 // Updated At
            + 1 // Achievement Type
            + 32 // Token Mint
            + 8 // Token Supply
    )]
    pub achievement: Account<'info, Achievement>,
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
pub struct AwardFungibleAchievement<'info> {
    #[account(mut)]
    pub brand: Account<'info, Brand>,
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 32 + 8
    )]
    pub user_achievement: Account<'info, UserAchievement>,
    #[account(mut, constraint = achievement.brand == brand.key())]
    pub achievement: Account<'info, Achievement>,
    /// CHECK: This account is used to store the public key of the user receiving the achievement
    pub user: UncheckedAccount<'info>,
    #[account(mut)]
    pub user_achievements: Account<'info, UserAchievements>,
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

#[derive(Accounts)]
pub struct AwardNonFungibleAchievement<'info> {
    #[account(mut)]
    pub brand: Account<'info, Brand>,
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 32 + 8
    )]
    pub user_achievement: Account<'info, UserAchievement>,
    #[account(mut, constraint = achievement.brand == brand.key())]
    pub achievement: Account<'info, Achievement>,
    /// CHECK: This account is used to store the public key of the user receiving the achievement
    pub user: UncheckedAccount<'info>,
    #[account(mut)]
    pub user_achievements: Account<'info, UserAchievements>,
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
    pub token_metadata_program: Program<'info, Metadata>,
    /// CHECK: This is the metadata account for the new edition
    #[account(mut)]
    pub new_metadata: UncheckedAccount<'info>,
    /// CHECK: This is the edition account for the new mint
    #[account(mut)]
    pub new_edition: UncheckedAccount<'info>,
    /// CHECK: This is the master edition account of the original NFT
    #[account(mut)]
    pub master_edition: UncheckedAccount<'info>,
    #[account(mut)]
    pub new_mint: Account<'info, Mint>,
    /// CHECK: This is the edition marker PDA
    #[account(mut)]
    pub edition_mark_pda: UncheckedAccount<'info>,
    /// CHECK: This is the token account for the master edition
    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,
    /// CHECK: This is the metadata account for the master edition
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,
    /// CHECK: This account is used to store the metadata mint for the master edition
    #[account(mut)]
    pub metadata_mint: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct InitializeUserAchievements<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 4 + 200 * 32 // Discriminator + user pubkey + vec len + max 200 achievement pubkeys
    )]
    pub user_achievements: Account<'info, UserAchievements>,
    pub user: Signer<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GetAchievementInfo<'info> {
    pub achievement: Account<'info, Achievement>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct AchievementInfo {
    pub name: String,
    pub description: String,
    pub criteria: String,
    pub points: u32,
    pub brand: Pubkey,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Accounts)]
pub struct ListUserAchievements<'info> {
    #[account(has_one = user)]
    pub user_achievements: Account<'info, UserAchievements>,
    pub user: Signer<'info>,
}

#[account]
pub struct UserAchievements {
    pub user: Pubkey,
    pub achievements: Vec<Pubkey>,
}
