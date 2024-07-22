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
