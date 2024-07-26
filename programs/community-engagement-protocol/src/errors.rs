// File: src/errors.rs

use anchor_lang::prelude::*;

#[error_code]
pub enum CepError {
    #[msg("Name must be 32 characters or less")]
    NameTooLong,
    #[msg("Description must be 200 characters or less")]
    DescriptionTooLong,
    #[msg("URI must be 200 characters or less")]
    UriTooLong,
    #[msg("You are not authorized to perform this action")]
    Unauthorized,
    #[msg("This admin already exists for the group hub")]
    AdminAlreadyExists,
    #[msg("Admin not found in the group hub")]
    AdminNotFound,
    #[msg("Cannot remove the last admin from the group hub")]
    CannotRemoveLastAdmin,
    #[msg("Achievement not found")]
    AchievementNotFound,
    #[msg("A maximum of 5 tags are allowed")]
    TooManyTags,
    // New errors for rewards
    #[msg("Reward not found")]
    RewardNotFound,
    #[msg("Invalid reward type")]
    InvalidRewardType,
    #[msg("Insufficient reward supply")]
    InsufficientRewardSupply,
}
