// tests/common.ts
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CommunityEngagementProtocol } from "../target/types/community_engagement_protocol";

export const DEBUG = false;

export function log(...args: any[]) {
  if (DEBUG) {
    console.log(...args);
  }
}

export const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

export const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

export const program = anchor.workspace.CommunityEngagementProtocol as Program<CommunityEngagementProtocol>;

export let groupHubList: anchor.web3.Keypair;

export async function initializeGroupHubList() {
  groupHubList = anchor.web3.Keypair.generate();
  
  await program.methods
    .initializeGroupHubList()
    .accounts({
      groupHubList: groupHubList.publicKey,
      user: provider.wallet.publicKey,
    })
    .signers([groupHubList])
    .rpc();

  log("Initialized GroupHubList with publicKey:", groupHubList.publicKey.toBase58());
}