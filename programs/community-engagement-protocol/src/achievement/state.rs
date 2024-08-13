use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum AchievementType {
    NonFungible,
    Fungible,
}

#[account]
pub struct Achievement {
    pub brand: Pubkey,
    pub name: String,
    pub description: String,
    pub criteria: String,
    pub points: u32,
    pub created_at: i64,
    pub updated_at: i64,
    pub achievement_type: AchievementType,
    pub token_mint: Option<Pubkey>,
    pub token_supply: Option<u64>,
    pub metadata_uri: Option<String>,
}

#[account]
pub struct UserAchievement {
    pub user: Pubkey,
    pub achievement: Pubkey,
    pub brand: Pubkey,
    pub awarded_at: i64,
}

#[account]
pub struct UserAchievements {
    pub user: Pubkey,
    pub achievements: Vec<Pubkey>,
}
