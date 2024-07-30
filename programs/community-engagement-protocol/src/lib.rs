use anchor_lang::prelude::*;

pub mod achievement;
pub mod errors;
pub mod group_hub;
pub mod membership;
pub mod reward;

use achievement::instructions::*;
use group_hub::instructions::*;
use group_hub::state::GroupHubInfo;
use membership::instructions::*;
use reward::instructions::*;

declare_id!("7FQ74JMt2Eeca2RD2aLVBv4No8e9PUt8SHfGsUzKhqje");

#[program]
pub mod community_engagement_protocol {
    use super::*;

    // Group Hub Instructions
    pub fn initialize_group_hub_list(ctx: Context<InitializeGroupHubList>) -> Result<()> {
        group_hub::instructions::initialize_group_hub_list(ctx)
    }

    pub fn create_group_hub(
        ctx: Context<CreateGroupHub>,
        name: String,
        description: String,
        website: Option<String>,
        social_media: Option<String>,
        category: Option<String>,
        tags: Vec<String>,
    ) -> Result<()> {
        group_hub::instructions::create_group_hub(
            ctx,
            name,
            description,
            website,
            social_media,
            category,
            tags,
        )
    }

    pub fn update_group_hub(
        ctx: Context<UpdateGroupHub>,
        name: String,
        description: String,
    ) -> Result<()> {
        group_hub::instructions::update_group_hub(ctx, name, description)
    }

    pub fn get_group_hub_info(ctx: Context<GetGroupHubInfo>) -> Result<GroupHubInfo> {
        group_hub::instructions::get_group_hub_info(ctx)
    }

    pub fn list_all_group_hubs(ctx: Context<ListAllGroupHubs>) -> Result<Vec<Pubkey>> {
        group_hub::instructions::list_all_group_hubs(ctx)
    }

    pub fn add_admin(ctx: Context<AddAdmin>, new_admin: Pubkey) -> Result<()> {
        group_hub::instructions::add_admin(ctx, new_admin)
    }

    pub fn remove_admin(ctx: Context<RemoveAdmin>, admin_to_remove: Pubkey) -> Result<()> {
        group_hub::instructions::remove_admin(ctx, admin_to_remove)
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

    pub fn list_group_hub_achievements(
        ctx: Context<ListGroupHubAchievements>,
    ) -> Result<Vec<Pubkey>> {
        group_hub::instructions::list_group_hub_achievements(ctx)
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

    // Reward Instructions
    pub fn initialize_user_rewards(ctx: Context<InitializeUserRewards>) -> Result<()> {
        reward::instructions::initialize_user_rewards(ctx)
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
}
