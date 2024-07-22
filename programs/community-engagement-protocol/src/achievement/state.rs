use anchor_lang::prelude::*;

#[account]
pub struct Achievement {
    pub group_hub: Pubkey,
    pub name: String,
    pub description: String,
    pub criteria: String,
    pub points: u32,
    pub created_at: i64,
    pub updated_at: i64,
}

#[account]
pub struct UserAchievement {
    pub user: Pubkey,
    pub achievement: Pubkey,
    pub group_hub: Pubkey,
    pub awarded_at: i64,
}
