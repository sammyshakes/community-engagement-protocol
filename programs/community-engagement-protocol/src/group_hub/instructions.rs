use super::state::*;
use crate::errors::CepError;
use anchor_lang::prelude::*;

pub fn initialize_group_hub_list(ctx: Context<InitializeGroupHubList>) -> Result<()> {
    let group_hub_list = &mut ctx.accounts.group_hub_list;
    group_hub_list.group_hubs = Vec::with_capacity(200);
    Ok(())
}

pub fn create_group_hub(
    ctx: Context<CreateGroupHub>,
    name: String,
    description: String,
    website: Option<String>,
    social_media: Option<String>,
    category: Option<String>,
    tags: Vec<String>,
) -> Result<()> {
    let group_hub = &mut ctx.accounts.group_hub;
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

    group_hub.name = name;
    group_hub.description = description;
    group_hub.admins = vec![user.key()];
    group_hub.achievements = Vec::new();
    group_hub.creation_date = clock.unix_timestamp;
    group_hub.last_updated = clock.unix_timestamp;
    group_hub.metadata = GroupHubMetadata {
        website,
        social_media,
        category,
        tags,
    };

    ctx.accounts.group_hub_list.add(group_hub.key());

    msg!("Group Hub '{}' created", group_hub.name);
    Ok(())
}

pub fn update_group_hub(
    ctx: Context<UpdateGroupHub>,
    name: String,
    description: String,
) -> Result<()> {
    let group_hub = &mut ctx.accounts.group_hub;
    let user = &ctx.accounts.user;

    if name.chars().count() > 50 {
        return Err(CepError::NameTooLong.into());
    }

    if description.chars().count() > 200 {
        return Err(CepError::DescriptionTooLong.into());
    }

    if !group_hub.admins.contains(&user.key()) {
        return Err(CepError::Unauthorized.into());
    }

    group_hub.name = name;
    group_hub.description = description;

    msg!("Group Hub '{}' updated", group_hub.name);
    Ok(())
}

pub fn get_group_hub_info(ctx: Context<GetGroupHubInfo>) -> Result<GroupHubInfo> {
    let group_hub = &ctx.accounts.group_hub;
    Ok(GroupHubInfo {
        name: group_hub.name.clone(),
        description: group_hub.description.clone(),
        admins: group_hub.admins.clone(),
        achievements: group_hub.achievements.clone(),
    })
}

pub fn list_all_group_hubs(ctx: Context<ListAllGroupHubs>) -> Result<Vec<Pubkey>> {
    Ok(ctx.accounts.group_hub_list.get_all())
}

pub fn list_group_hub_achievements(ctx: Context<ListGroupHubAchievements>) -> Result<Vec<Pubkey>> {
    let group_hub = &ctx.accounts.group_hub;
    Ok(group_hub.achievements.clone())
}

pub fn add_admin(ctx: Context<AddAdmin>, new_admin: Pubkey) -> Result<()> {
    let group_hub = &mut ctx.accounts.group_hub;
    let user = &ctx.accounts.user;

    if !group_hub.admins.contains(&user.key()) {
        return Err(CepError::Unauthorized.into());
    }

    if group_hub.admins.contains(&new_admin) {
        return Err(CepError::AdminAlreadyExists.into());
    }

    group_hub.admins.push(new_admin);
    msg!("New admin added to Group Hub '{}'", group_hub.name);
    Ok(())
}

pub fn remove_admin(ctx: Context<RemoveAdmin>, admin_to_remove: Pubkey) -> Result<()> {
    let group_hub = &mut ctx.accounts.group_hub;
    let user = &ctx.accounts.user;

    if !group_hub.admins.contains(&user.key()) {
        return Err(CepError::Unauthorized.into());
    }

    if !group_hub.admins.contains(&admin_to_remove) {
        return Err(CepError::AdminNotFound.into());
    }

    if group_hub.admins.len() == 1 {
        return Err(CepError::CannotRemoveLastAdmin.into());
    }

    group_hub.admins.retain(|&x| x != admin_to_remove);
    msg!("Admin removed from Group Hub '{}'", group_hub.name);
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeGroupHubList<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 4 + 200 * 32 // Discriminator + Vec length + 200 Pubkeys
    )]
    pub group_hub_list: Account<'info, GroupHubList>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateGroupHub<'info> {
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
    pub group_hub: Account<'info, GroupHub>,
    #[account(mut)]
    pub group_hub_list: Account<'info, GroupHubList>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateGroupHub<'info> {
    #[account(mut)]
    pub group_hub: Account<'info, GroupHub>,
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct GetGroupHubInfo<'info> {
    pub group_hub: Account<'info, GroupHub>,
}

#[derive(Accounts)]
pub struct ListAllGroupHubs<'info> {
    pub group_hub_list: Account<'info, GroupHubList>,
}

#[derive(Accounts)]
pub struct ListGroupHubAchievements<'info> {
    pub group_hub: Account<'info, GroupHub>,
}

#[derive(Accounts)]
pub struct AddAdmin<'info> {
    #[account(mut)]
    pub group_hub: Account<'info, GroupHub>,
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct RemoveAdmin<'info> {
    #[account(mut)]
    pub group_hub: Account<'info, GroupHub>,
    pub user: Signer<'info>,
}
