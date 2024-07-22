use anchor_lang::prelude::*;

#[error_code]
pub enum CepError {
    #[msg("Name must be 50 characters or less")]
    NameTooLong,
    #[msg("Description must be 200 characters or less")]
    DescriptionTooLong,
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
}
