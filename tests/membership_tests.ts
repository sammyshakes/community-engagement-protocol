import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CommunityEngagementProtocol } from "../target/types/community_engagement_protocol";
import { expect } from "chai";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { Signer } from "@solana/web3.js";

describe("Membership Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace
    .CommunityEngagementProtocol as Program<CommunityEngagementProtocol>;

  const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );

  let groupHubList: anchor.web3.Keypair;
  let membershipData: anchor.web3.Keypair;

  before(async () => {
    groupHubList = anchor.web3.Keypair.generate();
    
    await program.methods
      .initializeGroupHubList()
      .accounts({
        groupHubList: groupHubList.publicKey,
        user: provider.wallet.publicKey,
      })
      .signers([groupHubList])
      .rpc();

    console.log("Initialized GroupHubList with publicKey:", groupHubList.publicKey.toBase58());
  });

  it("Initializes membership", async () => {
    membershipData = anchor.web3.Keypair.generate();
    const admin = provider.wallet;

    await program.methods
      .initializeMembership(
        new anchor.BN(1), // membership_id
        "Test Membership", // name
        "TEST", // symbol
        "https://example.com/", // base_uri
        new anchor.BN(1000), // max_supply
        true, // is_elastic
        5 // max_tiers
      )
      .accounts({
        membershipData: membershipData.publicKey,
        admin: admin.publicKey,
      })
      .signers([membershipData])
      .rpc();

    const account = await program.account.membershipData.fetch(membershipData.publicKey);
    expect(account.membershipId.toNumber()).to.equal(1);
    expect(account.name).to.equal("Test Membership");
    expect(account.symbol).to.equal("TEST");
    expect(account.baseUri).to.equal("https://example.com/");
    expect(account.maxSupply.toNumber()).to.equal(1000);
    expect(account.isElastic).to.be.true;
    expect(account.maxTiers).to.equal(5);
    expect(account.admin.toString()).to.equal(admin.publicKey.toString());
  });

  it("Creates a membership tier", async () => {
    const tierId = "BASIC";
    const duration = new anchor.BN(30 * 24 * 60 * 60); // 30 days in seconds
    const isOpen = true;
    const tierUri = "basic.json";

    await program.methods
      .createMembershipTier(tierId, duration, isOpen, tierUri)
      .accounts({
        membershipData: membershipData.publicKey,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    const account = await program.account.membershipData.fetch(membershipData.publicKey);
    expect(account.tiers.length).to.equal(1);
    expect(account.tiers[0].tierId).to.equal(tierId);
    expect(account.tiers[0].duration.toNumber()).to.equal(duration.toNumber());
    expect(account.tiers[0].isOpen).to.equal(isOpen);
    expect(account.tiers[0].tierUri).to.equal(tierUri);
  });
  it("Mints a membership NFT", async () => {
    const mint = anchor.web3.Keypair.generate();
    const recipient = anchor.web3.Keypair.generate();
    const admin = provider.wallet; // The admin is the one who initializes and mints
  
    // Airdrop some SOL to the recipient
    const airdropSignature = await provider.connection.requestAirdrop(
      recipient.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSignature);
  
    // Initialize membership data
    const membershipData = anchor.web3.Keypair.generate();
    await program.methods
      .initializeMembership(
        new anchor.BN(1),
        "Test Membership",
        "TEST",
        "https://example.com/",
        new anchor.BN(1000),
        true,
        5
      )
      .accounts({
        membershipData: membershipData.publicKey,
        admin: admin.publicKey,
        // systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([membershipData])
      .rpc();
  
    // Create a membership tier
    await program.methods
      .createMembershipTier(
        "BASIC",
        new anchor.BN(30 * 24 * 60 * 60),
        true,
        "basic.json"
      )
      .accounts({
        membershipData: membershipData.publicKey,
        authority: admin.publicKey,
      })
      .rpc();
  
    const tokenAccountAddress = await getAssociatedTokenAddress(
      mint.publicKey,
      recipient.publicKey
    );
  
    const metadataAddress = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.publicKey.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )[0];
  
    const masterEditionAddress = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.publicKey.toBuffer(),
        Buffer.from("edition"),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )[0];
  
    try {
      await program.methods
        .mintMembership(0)
        .accounts({
          membershipData: membershipData.publicKey,
          mint: mint.publicKey,
          tokenAccount: tokenAccountAddress,
          recipient: recipient.publicKey,
          admin: admin.publicKey,
          metadata: metadataAddress,
          masterEdition: masterEditionAddress,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([mint])
        .rpc();
  
      const tokenAccount = await provider.connection.getTokenAccountBalance(
        tokenAccountAddress
      );
      expect(tokenAccount.value.uiAmount).to.equal(1);
  
      const membershipDataAccount = await program.account.membershipData.fetch(membershipData.publicKey);
      expect(membershipDataAccount.totalMinted.toNumber()).to.equal(1);
    } catch (error) {
      console.error("Error details:", error);
      throw error;
    }
  });
});