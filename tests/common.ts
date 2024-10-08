// tests/common.ts
import * as fs from 'fs';
import * as path from 'path';
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CommunityEngagementProtocol } from "../target/types/community_engagement_protocol";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { Connection, PublicKey } from '@solana/web3.js';

export const DEBUG = false;

export function log(...args: any[]) {
  if (DEBUG) {
    console.log(...args);
  }
}

// Load the admin keypair from the deploy-keypair.json file
const rawdata = fs.readFileSync(path.join(__dirname, '../deploy-keypair.json'), 'utf-8');
const keypairBuffer = Buffer.from(JSON.parse(rawdata));
export const TRONIC_ADMIN_KEYPAIR = anchor.web3.Keypair.fromSecretKey(keypairBuffer);

// You can also export the public key for convenience
export const TRONIC_ADMIN_PUBKEY = TRONIC_ADMIN_KEYPAIR.publicKey;

export const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

export const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

export const program = anchor.workspace.CommunityEngagementProtocol as Program<CommunityEngagementProtocol>;

export let brandList: anchor.web3.Keypair;

export async function fundAccount(connection: Connection, address: PublicKey, amount: number = 1000000000) {
  const airdropSignature = await connection.requestAirdrop(address, amount);
  await connection.confirmTransaction(airdropSignature);
  log(`Airdropped ${amount / anchor.web3.LAMPORTS_PER_SOL} SOL to ${address.toBase58()}`);
}

export async function initializeProgramState() {
  const [programStatePda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("program-state")],
    program.programId
  );

  try {
    // Try to fetch the program state account
    const account = await program.account.programState.fetch(programStatePda);
    log("Program state already initialized:", account);
  } catch (error) {
    log("Error fetching program state, attempting to initialize:", error);
    
    try {
      const tx = await program.methods
        .initializeProgram()
        .accounts({
          payer: TRONIC_ADMIN_KEYPAIR.publicKey,
        })
        .signers([TRONIC_ADMIN_KEYPAIR])
        .rpc();

      log("Program state initialized with Tronic Admin:", TRONIC_ADMIN_PUBKEY.toBase58());
      log("Transaction signature:", tx);
      
      // Fetch the account again to confirm it's initialized
      const account = await program.account.programState.fetch(programStatePda);
      log("Initialized program state account:", account);
    } catch (initError) {
      error("Failed to initialize program state:", initError);
      if (initError instanceof anchor.AnchorError) {
        error("Error code:", initError.error.errorCode.number);
        error("Error message:", initError.error.errorMessage);
      }
      throw initError;
    }
  }
}

export async function createUniqueBrand() {
  const name = `Test Brand ${Date.now()}`;

  const [brandPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("brand"), Buffer.from(name)],
    program.programId
  );

  await program.methods
    .createBrand(
      name,
      "A test brand for memberships",
      null,
      null,
      null,
      []
    )
    .accounts({
      tronicAdmin: TRONIC_ADMIN_PUBKEY,
    })
    .signers([TRONIC_ADMIN_KEYPAIR])
    .rpc();
  
  log("Created unique Brand with publicKey:", brandPda);
  return brandPda;
}

// Export the token-related constants and functions
export { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress };