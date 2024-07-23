use super::state::*;
use crate::errors::CepError;
use crate::group_hub::state::GroupHub;
use anchor_lang::prelude::*;

pub fn create_achievement(
    ctx: Context<CreateAchievement>,
    name: String,
    description: String,
    criteria: String,
    points: u32,
) -> Result<()> {
    let achievement = &mut ctx.accounts.achievement;
    let group_hub = &mut ctx.accounts.group_hub;
    let clock = Clock::get()?;

    if name.chars().count() > 50 {
        return Err(CepError::NameTooLong.into());
    }
    if description.chars().count() > 200 {
        return Err(CepError::DescriptionTooLong.into());
    }

    achievement.group_hub = group_hub.key();
    achievement.name = name;
    achievement.description = description;
    achievement.criteria = criteria;
    achievement.points = points;
    achievement.created_at = clock.unix_timestamp;
    achievement.updated_at = clock.unix_timestamp;

    group_hub.achievements.push(achievement.key());

    msg!(
        "Achievement '{}' created for Group Hub '{}'",
        achievement.name,
        group_hub.name
    );
    Ok(())
}

pub fn initialize_user_achievements(ctx: Context<InitializeUserAchievements>) -> Result<()> {
    let user_achievements = &mut ctx.accounts.user_achievements;
    user_achievements.user = ctx.accounts.user.key();
    user_achievements.achievements = vec![];
    Ok(())
}

pub fn award_achievement(ctx: Context<AwardAchievement>) -> Result<()> {
    let user_achievement = &mut ctx.accounts.user_achievement;
    let achievement = &ctx.accounts.achievement;
    let group_hub = &ctx.accounts.group_hub;
    let user_achievements = &mut ctx.accounts.user_achievements;
    let clock = Clock::get()?;

    if !group_hub.admins.contains(&ctx.accounts.authority.key()) {
        return Err(CepError::Unauthorized.into());
    }

    user_achievement.user = ctx.accounts.user.key();
    user_achievement.achievement = achievement.key();
    user_achievement.group_hub = group_hub.key();
    user_achievement.awarded_at = clock.unix_timestamp;

    user_achievements.achievements.push(achievement.key());

    msg!(
        "Achievement '{}' awarded to user {}",
        achievement.name,
        ctx.accounts.user.key()
    );
    Ok(())
}

pub fn get_achievement_info(ctx: Context<GetAchievementInfo>) -> Result<AchievementInfo> {
    let achievement = &ctx.accounts.achievement;
    Ok(AchievementInfo {
        name: achievement.name.clone(),
        description: achievement.description.clone(),
        criteria: achievement.criteria.clone(),
        points: achievement.points,
        group_hub: achievement.group_hub,
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
    pub group_hub: Account<'info, GroupHub>,
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
pub struct AwardAchievement<'info> {
    #[account(mut)]
    pub group_hub: Account<'info, GroupHub>,
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 32 + 8
    )]
    pub user_achievement: Account<'info, UserAchievement>,
    #[account(constraint = achievement.group_hub == group_hub.key())]
    pub achievement: Account<'info, Achievement>,
    /// CHECK: This account is used to store the public key of the user receiving the achievement
    pub user: AccountInfo<'info>,
    #[account(mut, has_one = user)]
    pub user_achievements: Account<'info, UserAchievements>,
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
    pub group_hub: Pubkey,
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
