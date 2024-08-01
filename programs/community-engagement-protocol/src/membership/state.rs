use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct MembershipTier {
    pub tier_id: String,
    pub duration: i64,
    pub is_open: bool,
    pub tier_uri: String,
}

#[account]
pub struct MembershipData {
    pub group_hub: Pubkey,
    pub membership_id: u64,
    pub name: String,
    pub symbol: String,
    pub base_uri: String,
    pub max_supply: u64,
    pub is_elastic: bool,
    pub max_tiers: u8,
    pub total_minted: u64,
    pub total_burned: u64,
    pub tiers: Vec<MembershipTier>,
    pub admin: Pubkey,
}
