use super::*;
// use anchor_lang::solana_program::sysvar;
use mpl_token_metadata::types::DataV2;

#[derive(Accounts)]
pub struct InitializeMembership<'info> {
    #[account(init, payer = admin, space = 
        8 +  // discriminator
        8 +  // membership_id
        4 + 100 +  // name (4 bytes for length prefix + max 100 bytes for string)
        4 + 10 +  // symbol (4 bytes for length prefix + max 10 bytes for string)
        4 + 200 +  // base_uri (4 bytes for length prefix + max 200 bytes for string)
        8 +  // max_supply
        1 +  // is_elastic
        1 +  // max_tiers
        8 +  // total_minted
        8 +  // total_burned
        32 +  // admin (Pubkey)
        (4 + 10 + 8 + 1 + 4 + 200) * 10  // tiers (4 bytes for length prefix + max 10 bytes for tier_id + 8 bytes for duration + 1 byte for is_open + 4 bytes for length prefix + max 200 bytes for tier_uri) * max 10 tiers
    )]
    pub membership_data: Account<'info, MembershipData>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}


pub fn initialize_membership(
    ctx: Context<InitializeMembership>,
    membership_id: u64,
    name: String,
    symbol: String,
    base_uri: String,
    max_supply: u64,
    is_elastic: bool,
    max_tiers: u8,
) -> Result<()> {
    let membership_data = &mut ctx.accounts.membership_data;
    membership_data.membership_id = membership_id;
    membership_data.name = name;
    membership_data.symbol = symbol;
    membership_data.base_uri = base_uri;
    membership_data.max_supply = max_supply;
    membership_data.is_elastic = is_elastic;
    membership_data.max_tiers = max_tiers;
    membership_data.admin = ctx.accounts.admin.key();
    membership_data.total_minted = 0;
    membership_data.total_burned = 0;
    membership_data.tiers = Vec::new();
    Ok(())
}

#[derive(Accounts)]
pub struct MintMembership<'info> {
    #[account(mut)]
    pub membership_data: Account<'info, MembershipData>,
    #[account(
        init,
        payer = admin,
        mint::decimals = 0,
        mint::authority = admin.key(),
        mint::freeze_authority = admin.key(),
    )]
    pub mint: Account<'info, Mint>,
    #[account(
        init_if_needed,
        payer = admin,
        associated_token::mint = mint,
        associated_token::authority = recipient,
    )]
    pub token_account: Account<'info, TokenAccount>,
    /// CHECK: This is the account that will receive the minted token
    pub recipient: UncheckedAccount<'info>,
    #[account(mut, constraint = admin.key() == membership_data.admin @ MembershipError::Unauthorized)]
    pub admin: Signer<'info>,
    /// CHECK: This is the metadata account that will be created
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,
    /// CHECK: This is the master edition account that will be created
    #[account(mut)]
    pub master_edition: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_metadata_program: Program<'info, Metadata>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn mint_membership(ctx: Context<MintMembership>, tier_index: u8) -> Result<()> {
    let membership_data = &mut ctx.accounts.membership_data;
    let clock = Clock::get()?;

    require!(
        membership_data.total_minted < membership_data.max_supply,
        MembershipError::MaxSupplyReached
    );

    // Mint the NFT
    anchor_spl::token::mint_to(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            anchor_spl::token::MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.token_account.to_account_info(),
                authority: ctx.accounts.admin.to_account_info(),
            },
        ),
        1,
    )?;

    // Create metadata
    let tier = &membership_data.tiers[tier_index as usize];
    let metadata_accounts = CreateMetadataAccountsV3 {
        metadata: ctx.accounts.metadata.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        mint_authority: ctx.accounts.admin.to_account_info(),
        payer: ctx.accounts.admin.to_account_info(),
        update_authority: ctx.accounts.admin.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        rent: ctx.accounts.rent.to_account_info(),
    };

    let data = DataV2 {
        name: membership_data.name.clone(),
        symbol: membership_data.symbol.clone(),
        uri: format!("{}{}", membership_data.base_uri, tier.tier_uri),
        seller_fee_basis_points: 0,
        creators: None,
        collection: None,
        uses: None,
    };

    create_metadata_accounts_v3(
        CpiContext::new(
            ctx.accounts.token_metadata_program.to_account_info(),
            metadata_accounts,
        ),
        data,
        true,
        true,
        None,
    )?;

    // Create master edition
    let master_edition_accounts = CreateMasterEditionV3 {
        edition: ctx.accounts.master_edition.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        update_authority: ctx.accounts.admin.to_account_info(),
        mint_authority: ctx.accounts.admin.to_account_info(),
        payer: ctx.accounts.admin.to_account_info(),
        metadata: ctx.accounts.metadata.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        rent: ctx.accounts.rent.to_account_info(),
    };

    create_master_edition_v3(
        CpiContext::new(
            ctx.accounts.token_metadata_program.to_account_info(),
            master_edition_accounts,
        ),
        Some(1), // Max supply of 1 for NFT
    )?;

    // Update membership data
    membership_data.total_minted += 1;

    Ok(())
}

#[derive(Accounts)]
pub struct CreateMembershipTier<'info> {
    #[account(mut)]
    pub membership_data: Account<'info, MembershipData>,
    pub authority: Signer<'info>,
}

pub fn create_membership_tier(
    ctx: Context<CreateMembershipTier>,
    tier_id: String,
    duration: i64,
    is_open: bool,
    tier_uri: String,
) -> Result<()> {
    let membership_data = &mut ctx.accounts.membership_data;

    require!(
        membership_data.admin == ctx.accounts.authority.key(),
        MembershipError::Unauthorized
    );

    require!(
        membership_data.tiers.len() < membership_data.max_tiers as usize,
        MembershipError::MaxTiersReached
    );

    for tier in &membership_data.tiers {
        require!(tier.tier_id != tier_id, MembershipError::TierAlreadyExists);
    }

    membership_data.tiers.push(MembershipTier {
        tier_id,
        duration,
        is_open,
        tier_uri,
    });

    Ok(())
}
