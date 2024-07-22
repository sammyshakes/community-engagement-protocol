use anchor_lang::prelude::*;

pub mod achievement;
pub mod errors;
pub mod group_hub;

use achievement::instructions::*;
use group_hub::instructions::*;
use group_hub::state::GroupHubInfo;

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
    ) -> Result<()> {
        group_hub::instructions::create_group_hub(ctx, name, description)
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
}
