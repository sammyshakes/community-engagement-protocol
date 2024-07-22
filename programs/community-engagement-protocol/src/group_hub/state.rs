use anchor_lang::prelude::*;

#[account]
pub struct GroupHub {
    pub name: String,
    pub description: String,
    pub admins: Vec<Pubkey>,
    pub achievements: Vec<Pubkey>,
}

#[account]
pub struct GroupHubList {
    pub group_hubs: Vec<Pubkey>,
}

impl GroupHubList {
    pub fn add(&mut self, group_hub: Pubkey) {
        self.group_hubs.push(group_hub);
    }

    pub fn get_all(&self) -> Vec<Pubkey> {
        self.group_hubs.clone()
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct GroupHubInfo {
    pub name: String,
    pub description: String,
    pub admins: Vec<Pubkey>,
    pub achievements: Vec<Pubkey>,
}
