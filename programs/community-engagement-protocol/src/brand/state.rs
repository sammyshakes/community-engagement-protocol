use anchor_lang::prelude::*;

#[account]
pub struct Brand {
    pub name: String,
    pub description: String,
    pub admins: Vec<Pubkey>,
    pub achievements: Vec<Pubkey>,
    pub memberships: Vec<Pubkey>,
    pub creation_date: i64,
    pub last_updated: i64,
    pub metadata: BrandMetadata,
}

#[account]
pub struct BrandList {
    pub brands: Vec<Pubkey>,
}

impl BrandList {
    pub fn add(&mut self, brand: Pubkey) {
        self.brands.push(brand);
    }

    pub fn get_all(&self) -> Vec<Pubkey> {
        self.brands.clone()
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct BrandInfo {
    pub name: String,
    pub description: String,
    pub admins: Vec<Pubkey>,
    pub achievements: Vec<Pubkey>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct BrandMetadata {
    pub website: Option<String>,
    pub social_media: Option<String>,
    pub category: Option<String>,
    pub tags: Vec<String>,
}
