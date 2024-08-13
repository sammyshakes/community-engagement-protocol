// tests/common.ts
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CommunityEngagementProtocol } from "../target/types/community_engagement_protocol";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";

export const DEBUG = true;

export function log(...args: any[]) {
  if (DEBUG) {
    console.log(...args);
  }
}

export const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

export const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

export const program = anchor.workspace.CommunityEngagementProtocol as Program<CommunityEngagementProtocol>;

export let brandList: anchor.web3.Keypair;

export async function initializeBrandList() {
  brandList = anchor.web3.Keypair.generate();
  
  await program.methods
    .initializeBrandList()
    .accounts({
      brandList: brandList.publicKey,
      user: provider.wallet.publicKey,
    })
    .signers([brandList])
    .rpc();

  log("Initialized BrandList with publicKey:", brandList.publicKey.toBase58());
}

export async function createUniqueBrand() {
  const brand = anchor.web3.Keypair.generate();
  await program.methods
    .createBrand(
      `Test Brand ${Date.now()}`,
      "A test brand for memberships",
      null,
      null,
      null,
      []
    )
    .accounts({
      brand: brand.publicKey,
      brandList: brandList.publicKey,
      user: provider.wallet.publicKey,
    })
    .signers([brand])
    .rpc();
  
  log("Created unique Brand with publicKey:", brand.publicKey.toBase58());
  return brand;
}

// Export the token-related constants and functions
export { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress };