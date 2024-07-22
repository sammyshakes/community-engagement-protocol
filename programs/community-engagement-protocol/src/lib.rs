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
        group_hub.admin = user.key();

        msg!("Group Hub '{}' created", group_hub.name);
        Ok(())
    }

    // Other functions will be implemented in future steps
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

#[account]
pub struct GroupHub {
    pub name: String,
    pub description: String,
    pub admin: Pubkey,
}

#[error_code]
pub enum CepError {
    #[msg("Group Hub name must be 50 characters or less")]
    NameTooLong,
    #[msg("Group Hub description must be 200 characters or less")]
    DescriptionTooLong,
}
