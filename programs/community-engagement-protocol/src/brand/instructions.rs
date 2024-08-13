use super::state::*;
use crate::errors::CepError;
use anchor_lang::prelude::*;

pub fn initialize_brand_list(ctx: Context<InitializeBrandList>) -> Result<()> {
    let brand_list = &mut ctx.accounts.brand_list;
    brand_list.brands = Vec::with_capacity(200);
    Ok(())
}

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
    let user = &ctx.accounts.user;
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
    brand.admins = vec![user.key()];
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

    ctx.accounts.brand_list.add(brand.key());

    msg!("Brand Hub '{}' created", brand.name);
    Ok(())
}

pub fn update_brand(ctx: Context<UpdateBrand>, name: String, description: String) -> Result<()> {
    let brand = &mut ctx.accounts.brand;
    let user = &ctx.accounts.user;

    if name.chars().count() > 50 {
        return Err(CepError::NameTooLong.into());
    }

    if description.chars().count() > 200 {
        return Err(CepError::DescriptionTooLong.into());
    }

    if !brand.admins.contains(&user.key()) {
        return Err(CepError::Unauthorized.into());
    }

    brand.name = name;
    brand.description = description;

    msg!("Brand Hub '{}' updated", brand.name);
    Ok(())
}

pub fn get_brand_info(ctx: Context<GetBrandInfo>) -> Result<BrandInfo> {
    let brand = &ctx.accounts.brand;
    Ok(BrandInfo {
        name: brand.name.clone(),
        description: brand.description.clone(),
        admins: brand.admins.clone(),
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

pub fn add_admin(ctx: Context<AddAdmin>, new_admin: Pubkey) -> Result<()> {
    let brand = &mut ctx.accounts.brand;
    let user = &ctx.accounts.user;

    if !brand.admins.contains(&user.key()) {
        return Err(CepError::Unauthorized.into());
    }

    if brand.admins.contains(&new_admin) {
        return Err(CepError::AdminAlreadyExists.into());
    }

    brand.admins.push(new_admin);
    msg!("New admin added to Brand Hub '{}'", brand.name);
    Ok(())
}

pub fn remove_admin(ctx: Context<RemoveAdmin>, admin_to_remove: Pubkey) -> Result<()> {
    let brand = &mut ctx.accounts.brand;
    let user = &ctx.accounts.user;

    if !brand.admins.contains(&user.key()) {
        return Err(CepError::Unauthorized.into());
    }

    if !brand.admins.contains(&admin_to_remove) {
        return Err(CepError::AdminNotFound.into());
    }

    if brand.admins.len() == 1 {
        return Err(CepError::CannotRemoveLastAdmin.into());
    }

    brand.admins.retain(|&x| x != admin_to_remove);
    msg!("Admin removed from Brand Hub '{}'", brand.name);
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeBrandList<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 4 + 200 * 32 // Discriminator + Vec length + 200 Pubkeys
    )]
    pub brand_list: Account<'info, BrandList>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateBrand<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + // discriminator
                50 + // name (String)
                200 + // description (String)
                32 + (4 + 32 * 10) + // admins (Vec<Pubkey>)
                32 + (4 + 32 * 50) + // achievements (Vec<Pubkey>)
                8 + // creation_date (i64)
                8 + // last_updated (i64)
                (1 + 50) + // website (Option<String>)
                (1 + 50) + // social_media (Option<String>)
                (1 + 20) + // category (Option<String>)
                (4 + 5 * 20) // tags (Vec<String>)
    )]
    pub brand: Account<'info, Brand>,
    #[account(mut)]
    pub brand_list: Account<'info, BrandList>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateBrand<'info> {
    #[account(mut)]
    pub brand: Account<'info, Brand>,
    pub user: Signer<'info>,
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

#[derive(Accounts)]
pub struct AddAdmin<'info> {
    #[account(mut)]
    pub brand: Account<'info, Brand>,
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct RemoveAdmin<'info> {
    #[account(mut)]
    pub brand: Account<'info, Brand>,
    pub user: Signer<'info>,
}
