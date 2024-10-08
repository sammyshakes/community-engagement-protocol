use super::state::*;
use crate::{errors::CepError, ProgramState};
use anchor_lang::prelude::*;

pub fn create_brand(
    ctx: Context<CreateBrand>,
    name: String,
    description: String,
    website: Option<String>,
    social_media: Option<String>,
    category: Option<String>,
    tags: Vec<String>,
) -> Result<()> {
    let brand = &mut ctx.accounts.brand;
    let brand_list = &mut ctx.accounts.brand_list;
    let clock = Clock::get()?;

    if name.chars().count() > 50 {
        return Err(CepError::NameTooLong.into());
    }

    if description.chars().count() > 200 {
        return Err(CepError::DescriptionTooLong.into());
    }

    if tags.len() > 5 {
        return Err(CepError::TooManyTags.into());
    }

    brand.name = name;
    brand.description = description;
    brand.achievements = Vec::new();
    brand.memberships = Vec::new();
    brand.creation_date = clock.unix_timestamp;
    brand.last_updated = clock.unix_timestamp;
    brand.metadata = BrandMetadata {
        website,
        social_media,
        category,
        tags,
    };

    brand_list.add(brand.key());

    msg!("Brand '{}' created", brand.name);
    Ok(())
}

pub fn update_brand(ctx: Context<UpdateBrand>, name: String, description: String) -> Result<()> {
    let brand = &mut ctx.accounts.brand;
    let clock = Clock::get()?;

    if name.chars().count() > 50 {
        return Err(CepError::NameTooLong.into());
    }

    if description.chars().count() > 200 {
        return Err(CepError::DescriptionTooLong.into());
    }

    brand.name = name;
    brand.description = description;
    brand.last_updated = clock.unix_timestamp;

    msg!("Brand '{}' updated", brand.name);
    Ok(())
}

pub fn get_brand_info(ctx: Context<GetBrandInfo>) -> Result<BrandInfo> {
    let brand = &ctx.accounts.brand;
    Ok(BrandInfo {
        name: brand.name.clone(),
        description: brand.description.clone(),
        achievements: brand.achievements.clone(),
    })
}

pub fn list_all_brands(ctx: Context<ListAllBrands>) -> Result<Vec<Pubkey>> {
    Ok(ctx.accounts.brand_list.get_all())
}

pub fn list_brand_achievements(ctx: Context<ListBrandAchievements>) -> Result<Vec<Pubkey>> {
    let brand = &ctx.accounts.brand;
    Ok(brand.achievements.clone())
}

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateBrand<'info> {
    #[account(
        init,
        payer = tronic_admin,
        space = 8 + // discriminator
                50 + // name (String)
                200 + // description (String)
                32 + (4 + 32 * 50) + // achievements (Vec<Pubkey>)
                32 + (4 + 32 * 50) + // memberships (Vec<Pubkey>)
                8 + // creation_date (i64)
                8 + // last_updated (i64)
                (1 + 50) + // website (Option<String>)
                (1 + 50) + // social_media (Option<String>)
                (1 + 20) + // category (Option<String>)
                (4 + 5 * 20), // tags (Vec<String>)
        seeds = [b"brand", name.as_bytes()],
        bump
    )]
    pub brand: Account<'info, Brand>,
    #[account(
        init_if_needed,
        payer = tronic_admin,
        space = 8 + 4 + 200 * 32, // Discriminator + Vec length + 200 Pubkeys
        seeds = [b"brand-list"],
        bump
    )]
    pub brand_list: Account<'info, BrandList>,
    #[account(
        seeds = [b"program-state"],
        bump,
        constraint = program_state.tronic_admin == tronic_admin.key() @ CepError::UnauthorizedTronicAdmin
    )]
    pub program_state: Account<'info, ProgramState>,
    #[account(mut)]
    pub tronic_admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateBrand<'info> {
    #[account(mut)]
    pub brand: Account<'info, Brand>,
    #[account(
        seeds = [b"program-state"],
        bump,
        constraint = program_state.tronic_admin == tronic_admin.key() @ CepError::UnauthorizedTronicAdmin
    )]
    pub program_state: Account<'info, ProgramState>,
    pub tronic_admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct GetBrandInfo<'info> {
    pub brand: Account<'info, Brand>,
}

#[derive(Accounts)]
pub struct ListAllBrands<'info> {
    pub brand_list: Account<'info, BrandList>,
}

#[derive(Accounts)]
pub struct ListBrandAchievements<'info> {
    pub brand: Account<'info, Brand>,
}
