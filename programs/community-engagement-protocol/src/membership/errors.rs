use anchor_lang::prelude::*;

#[error_code]
pub enum MembershipError {
    #[msg("Max supply reached")]
    MaxSupplyReached,
    #[msg("Invalid tier index")]
    InvalidTierIndex,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Tier already exists")]
    TierAlreadyExists,
    #[msg("Max tiers reached")]
    MaxTiersReached,
}
