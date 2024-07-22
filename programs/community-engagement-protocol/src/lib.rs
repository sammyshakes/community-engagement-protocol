use anchor_lang::prelude::*;

declare_id!("7FQ74JMt2Eeca2RD2aLVBv4No8e9PUt8SHfGsUzKhqje");

#[program]
pub mod community_engagement_protocol {
    use super::*;

    pub fn create_group_hub(
        ctx: Context<CreateGroupHub>,
        name: String,
        description: String,
    ) -> Result<()> {
        let group_hub = &mut ctx.accounts.group_hub;
        let user = &ctx.accounts.user;

        if name.chars().count() > 50 {
            return Err(CepError::NameTooLong.into());
        }

        if description.chars().count() > 200 {
            return Err(CepError::DescriptionTooLong.into());
        }

        group_hub.name = name;
        group_hub.description = description;
        group_hub.admins = vec![user.key()];

        msg!("Group Hub '{}' created", group_hub.name);
        Ok(())
    }

    pub fn update_group_hub(
        ctx: Context<UpdateGroupHub>,
        name: String,
        description: String,
    ) -> Result<()> {
        let group_hub = &mut ctx.accounts.group_hub;
        let user = &ctx.accounts.user;

        if name.chars().count() > 50 {
            return Err(CepError::NameTooLong.into());
        }

        if description.chars().count() > 200 {
            return Err(CepError::DescriptionTooLong.into());
        }

        if !group_hub.admins.contains(&user.key()) {
            return Err(CepError::Unauthorized.into());
        }

        group_hub.name = name;
        group_hub.description = description;

        msg!("Group Hub '{}' updated", group_hub.name);
        Ok(())
    }

    pub fn get_group_hub_info(ctx: Context<GetGroupHubInfo>) -> Result<GroupHubInfo> {
        let group_hub = &ctx.accounts.group_hub;
        Ok(GroupHubInfo {
            name: group_hub.name.clone(),
            description: group_hub.description.clone(),
            admins: group_hub.admins.clone(),
        })
    }

    pub fn add_admin(ctx: Context<AddAdmin>, new_admin: Pubkey) -> Result<()> {
        let group_hub = &mut ctx.accounts.group_hub;
        let user = &ctx.accounts.user;

        if !group_hub.admins.contains(&user.key()) {
            return Err(CepError::Unauthorized.into());
        }

        if group_hub.admins.contains(&new_admin) {
            return Err(CepError::AdminAlreadyExists.into());
        }

        group_hub.admins.push(new_admin);
        msg!("New admin added to Group Hub '{}'", group_hub.name);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateGroupHub<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 50 + 4 + 200 + 4 + 32 // discriminator + name + description + admin
    )]
    pub group_hub: Account<'info, GroupHub>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateGroupHub<'info> {
    #[account(mut)]
    pub group_hub: Account<'info, GroupHub>,
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct GetGroupHubInfo<'info> {
    pub group_hub: Account<'info, GroupHub>,
}

#[derive(Accounts)]
pub struct AddAdmin<'info> {
    #[account(mut)]
    pub group_hub: Account<'info, GroupHub>,
    pub user: Signer<'info>,
}

#[account]
pub struct GroupHub {
    pub name: String,
    pub description: String,
    pub admins: Vec<Pubkey>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct GroupHubInfo {
    pub name: String,
    pub description: String,
    pub admins: Vec<Pubkey>,
}

#[error_code]
pub enum CepError {
    #[msg("Group Hub name must be 50 characters or less")]
    NameTooLong,
    #[msg("Group Hub description must be 200 characters or less")]
    DescriptionTooLong,
    #[msg("You are not authorized to perform this action")]
    Unauthorized,
    #[msg("This admin already exists for the group hub")]
    AdminAlreadyExists,
}
