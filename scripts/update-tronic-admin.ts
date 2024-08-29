import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CommunityEngagementProtocol } from "../target/types/community_engagement_protocol";

async function updateTronicAdmin() {
  // Configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());

  // Read the generated IDL
  const idl = JSON.parse(
    require("fs").readFileSync("./target/idl/community_engagement_protocol.json", "utf8")
  );

  // Address of the deployed program
  const programId = new anchor.web3.PublicKey("7FQ74JMt2Eeca2RD2aLVBv4No8e9PUt8SHfGsUzKhqje");

  // Generate the program client from IDL
  const program = new anchor.Program(idl, programId) as Program<CommunityEngagementProtocol>;

  // Current admin's keypair (you'll need to replace this with the actual keypair)
  const currentAdminKeypair = anchor.web3.Keypair.fromSecretKey(
    Buffer.from(JSON.parse(require("fs").readFileSync("/path/to/current/admin/keypair.json", "utf-8")))
  );

  // New admin's public key (replace with the actual new admin's public key)
  const newAdminPublicKey = new anchor.web3.PublicKey("NEW_ADMIN_PUBLIC_KEY_HERE");

  // Derive the PDA for the program state
  const [programStatePda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("program-state")],
    program.programId
  );

  try {
    // Call the update_tronic_admin instruction
    const tx = await program.methods
      .updateTronicAdmin(newAdminPublicKey)
      .accounts({
        programState: programStatePda,
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