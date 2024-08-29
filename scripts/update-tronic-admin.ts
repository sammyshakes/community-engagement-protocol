import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CommunityEngagementProtocol } from "../target/types/community_engagement_protocol";
import fs from "fs";
import path from "path";

async function updateTronicAdmin() {
     // Current admin's keypair 
     const keypairPath = path.join(__dirname, '..', 'deploy-keypair.json');
     const currentAdminKeypair = anchor.web3.Keypair.fromSecretKey(
       new Uint8Array(JSON.parse(fs.readFileSync(keypairPath, 'utf-8')))
     );

  // New admin's public key (replace with the actual new admin's public key)
  const newAdminPublicKey = new anchor.web3.PublicKey("NEW_ADMIN_PUBLIC_KEY_HERE");

  // Check if ANCHOR_PROVIDER_URL is set, if not, use a default value
  const rpcUrl = process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com";
  const connection = new anchor.web3.Connection(rpcUrl, 'confirmed');
  const wallet = new anchor.Wallet(currentAdminKeypair);

  const provider = new anchor.AnchorProvider(connection, wallet, {});
  anchor.setProvider(provider);

  // Read the generated IDL
  const idlPath = path.join(__dirname, '..', 'target', 'idl', 'community_engagement_protocol.json');
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));

  // Generate the program client from IDL
  const program = new anchor.Program(idl) as Program<CommunityEngagementProtocol>;

  try {
    // Call the update_tronic_admin instruction
    const tx = await program.methods
      .updateTronicAdmin(newAdminPublicKey)
      .accounts({
        currentAdmin: currentAdminKeypair.publicKey,
      })
      .signers([currentAdminKeypair])
      .rpc();

    console.log("Transaction signature:", tx);
    console.log("Tronic Admin updated successfully!");
  } catch (error) {
    console.error("Error updating Tronic Admin:", error);
  }
}

updateTronicAdmin();