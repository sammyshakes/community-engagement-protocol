use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum RewardType {
    Fungible {
        token_mint: Pubkey,
        token_supply: u64,
    },
    NonFungible {
        token_mint: Pubkey,
        metadata_uri: String,
    },
}

#[account]
pub struct Reward {
    pub brand: Pubkey,
    pub name: String,
    pub description: String,
    pub reward_type: RewardType,
    pub created_at: i64,   // Time this reward was created
    pub updated_at: i64,   // Last time this reward was updated
    pub issued_count: u64, // Number of times this reward has been issued
}

#[account]
pub struct NonFungibleRewardInstance {
    pub reward: Pubkey,
    pub owner: Pubkey,
    pub token_id: u64,  // Unique token id
    pub issued_at: i64, // Time this reward was issued
}
