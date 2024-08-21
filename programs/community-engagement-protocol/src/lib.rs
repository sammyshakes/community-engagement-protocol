use anchor_lang::prelude::*;

pub mod achievement;
pub mod brand;
pub mod errors;
pub mod membership;
pub mod reward;

use achievement::instructions::*;
use brand::instructions::*;
use brand::state::BrandInfo;
use membership::instructions::*;
use reward::instructions::*;

declare_id!("7FQ74JMt2Eeca2RD2aLVBv4No8e9PUt8SHfGsUzKhqje");

#[program]
pub mod community_engagement_protocol {
    use errors::CepError;

    use super::*;

    pub fn initialize_program(ctx: Context<InitializeProgram>) -> Result<()> {
        let program_state = &mut ctx.accounts.program_state;
        require!(
            program_state.tronic_admin == Pubkey::default(),
            CepError::AlreadyInitialized
        );
        program_state.tronic_admin = ctx.accounts.payer.key();
        program_state.version = 1;
        msg!(
            "Program initialized by Tronic Admin: {}",
            program_state.tronic_admin
        );
        Ok(())
    }

    // Brand Instructions
    pub fn initialize_brand_list(ctx: Context<InitializeBrandList>) -> Result<()> {
        brand::instructions::initialize_brand_list(ctx)
    }

    pub fn create_brand(
        ctx: Context<CreateBrand>,
        name: String,
        description: String,
        website: Option<String>,
        social_media: Option<String>,
        category: Option<String>,
        tags: Vec<String>,
    ) -> Result<()> {
        brand::instructions::create_brand(
            ctx,
            name,
            description,
            website,
            social_media,
            category,
            tags,
        )
    }

    pub fn update_brand(
        ctx: Context<UpdateBrand>,
        name: String,
        description: String,
    ) -> Result<()> {
        brand::instructions::update_brand(ctx, name, description)
    }

    pub fn get_brand_info(ctx: Context<GetBrandInfo>) -> Result<BrandInfo> {
        brand::instructions::get_brand_info(ctx)
    }

    pub fn list_all_brands(ctx: Context<ListAllBrands>) -> Result<Vec<Pubkey>> {
        brand::instructions::list_all_brands(ctx)
    }

    // Membership Instructions
    pub fn initialize_membership(
        ctx: Context<InitializeMembership>,
        membership_id: u64,
        name: String,
        symbol: String,
        base_uri: String,
        max_supply: u64,
        is_elastic: bool,
        max_tiers: u8,
    ) -> Result<()> {
        membership::instructions::initialize_membership(
            ctx,
            membership_id,
            name,
            symbol,
            base_uri,
            max_supply,
            is_elastic,
            max_tiers,
        )
    }

    pub fn mint_membership(ctx: Context<MintMembership>, tier_index: u8) -> Result<()> {
        membership::instructions::mint_membership(ctx, tier_index)
    }

    pub fn create_membership_tier(
        ctx: Context<CreateMembershipTier>,
        tier_id: String,
        duration: i64,
        is_open: bool,
        tier_uri: String,
    ) -> Result<()> {
        membership::instructions::create_membership_tier(ctx, tier_id, duration, is_open, tier_uri)
    }

    // Achievement Instructions
    pub fn create_achievement(
        ctx: Context<CreateAchievement>,
        name: String,
        description: String,
        criteria: String,
        points: u32,
    ) -> Result<()> {
        achievement::instructions::create_achievement(ctx, name, description, criteria, points)
    }

    pub fn create_fungible_achievement(
        ctx: Context<CreateFungibleAchievement>,
        name: String,
        description: String,
        criteria: String,
        points: u32,
        supply: u64,
    ) -> Result<()> {
        achievement::create_fungible_achievement(ctx, name, description, criteria, points, supply)
    }

    pub fn create_non_fungible_achievement(
        ctx: Context<CreateNonFungibleAchievement>,
        name: String,
        description: String,
        criteria: String,
        points: u32,
        metadata_uri: String,
    ) -> Result<()> {
        achievement::instructions::create_non_fungible_achievement(
            ctx,
            name,
            description,
            criteria,
            points,
            metadata_uri,
        )
    }

    pub fn award_fungible_achievement(ctx: Context<AwardFungibleAchievement>) -> Result<()> {
        achievement::instructions::award_fungible_achievement(ctx)
    }

    pub fn award_non_fungible_achievement(ctx: Context<AwardNonFungibleAchievement>) -> Result<()> {
        achievement::instructions::award_non_fungible_achievement(ctx)
    }

    pub fn list_brand_achievements(ctx: Context<ListBrandAchievements>) -> Result<Vec<Pubkey>> {
        brand::instructions::list_brand_achievements(ctx)
    }

    pub fn get_achievement_info(ctx: Context<GetAchievementInfo>) -> Result<AchievementInfo> {
        achievement::instructions::get_achievement_info(ctx)
    }

    pub fn list_user_achievements(ctx: Context<ListUserAchievements>) -> Result<Vec<Pubkey>> {
        achievement::instructions::list_user_achievements(ctx)
    }

    pub fn initialize_user_achievements(ctx: Context<InitializeUserAchievements>) -> Result<()> {
        achievement::instructions::initialize_user_achievements(ctx)
    }

    pub fn create_fungible_reward(
        ctx: Context<CreateFungibleReward>,
        name: String,
        description: String,
        supply: u64,
    ) -> Result<()> {
        reward::instructions::create_fungible_reward(ctx, name, description, supply)
    }

    pub fn issue_fungible_reward(ctx: Context<IssueFungibleReward>, amount: u64) -> Result<()> {
        reward::instructions::issue_fungible_reward(ctx, amount)
    }

    pub fn create_non_fungible_reward(
        ctx: Context<CreateNonFungibleReward>,
        name: String,
        description: String,
        metadata_uri: String,
    ) -> Result<()> {
        reward::instructions::create_non_fungible_reward(ctx, name, description, metadata_uri)
    }

    pub fn issue_non_fungible_reward(ctx: Context<IssueNonFungibleReward>) -> Result<()> {
        reward::instructions::issue_non_fungible_reward(ctx)
    }

    pub fn update_tronic_admin(ctx: Context<UpdateTronicAdmin>, new_admin: Pubkey) -> Result<()> {
        let program_state = &mut ctx.accounts.program_state;
        program_state.tronic_admin = new_admin;
        Ok(())
    }

    #[derive(Accounts)]
    pub struct UpdateTronicAdmin<'info> {
        #[account(
            mut,
            seeds = [b"program-state"],
            bump,
            constraint = program_state.tronic_admin == current_admin.key() @ CepError::UnauthorizedTronicAdmin
        )]
        pub program_state: Account<'info, ProgramState>,
        pub current_admin: Signer<'info>,
    }

    #[derive(Accounts)]
    pub struct InitializeProgram<'info> {
        #[account(
        init,
        payer = payer,
        space = 8 + 32 + 1, // discriminator + pubkey + version
        seeds = [b"program-state"],
        bump
    )]
        pub program_state: Account<'info, ProgramState>,
        #[account(mut)]
        pub payer: Signer<'info>,
        pub system_program: Program<'info, System>,
    }

    #[account]
    pub struct ProgramState {
        pub tronic_admin: Pubkey,
        pub version: u8,
    }
}
