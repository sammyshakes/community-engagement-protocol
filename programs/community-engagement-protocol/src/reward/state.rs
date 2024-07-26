use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum RewardType {
    Fungible,
    NonFungible,
}

#[account]
pub struct Reward {
    pub group_hub: Pubkey,
    pub name: String,
    pub description: String,
    pub reward_type: RewardType,
    pub token_mint: Option<Pubkey>,
    pub token_supply: Option<u64>,
    pub metadata_uri: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[account]
pub struct UserReward {
    pub user: Pubkey,
    pub reward: Pubkey,
    pub group_hub: Pubkey,
    pub awarded_at: i64,
}

#[account]
pub struct UserRewards {
    pub user: Pubkey,
    pub rewards: Vec<Pubkey>,
}
