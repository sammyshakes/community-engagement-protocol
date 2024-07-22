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
