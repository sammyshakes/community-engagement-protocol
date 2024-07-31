import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CommunityEngagementProtocol } from "../target/types/community_engagement_protocol";
import { expect } from "chai";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { program, provider, groupHubList, initializeGroupHubList, log, TOKEN_METADATA_PROGRAM_ID } from './common';

describe("Membership Tests", () => {
  before(initializeGroupHubList);

  let membershipData: anchor.web3.Keypair;

  it("Initializes membership", async () => {
    membershipData = anchor.web3.Keypair.generate();
    const admin = provider.wallet;

    log("Creating membership data with publicKey:", membershipData.publicKey.toBase58());

    try {
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
            })
            .signers([membershipData])
            .rpc();

        log("Membership data initialized");

        const account = await program.account.membershipData.fetch(membershipData.publicKey);
        log("Fetched membership data:", account);

        expect(account.membershipId.toNumber()).to.equal(1);
        expect(account.name).to.equal("Test Membership");
        expect(account.symbol).to.equal("TEST");
        expect(account.baseUri).to.equal("https://example.com/");
        expect(account.maxSupply.toNumber()).to.equal(1000);
        expect(account.isElastic).to.be.true;
        expect(account.maxTiers).to.equal(5);
        expect(account.admin.toString()).to.equal(admin.publicKey.toString());

        log("Membership initialization test passed");
    } catch (error) {
        log("Error initializing membership:", error);
        throw error;
    }
  });

  it("Creates a membership tier", async () => {
    const tierId = "BASIC";
    const duration = new anchor.BN(30 * 24 * 60 * 60); // 30 days in seconds
    const isOpen = true;
    const tierUri = "basic.json";

    log("Creating membership tier:", tierId);

    try {
      await program.methods
        .createMembershipTier(tierId, duration, isOpen, tierUri)
        .accounts({
          membershipData: membershipData.publicKey,
          authority: provider.wallet.publicKey,
        })
        .rpc();

      log("Membership tier created");

      const account = await program.account.membershipData.fetch(membershipData.publicKey);
      log("Fetched updated membership data:", account);

      expect(account.tiers.length).to.equal(1);
      expect(account.tiers[0].tierId).to.equal(tierId);
      expect(account.tiers[0].duration.toNumber()).to.equal(duration.toNumber());
      expect(account.tiers[0].isOpen).to.equal(isOpen);
      expect(account.tiers[0].tierUri).to.equal(tierUri);

      log("Membership tier creation test passed");
    } catch (error) {
      log("Error creating membership tier:", error);
      throw error;
    }
  });

  it("Mints a membership NFT", async () => {
    const mint = anchor.web3.Keypair.generate();
    const recipient = anchor.web3.Keypair.generate();
    const admin = provider.wallet;

    log("Minting membership NFT");
    log("Mint address:", mint.publicKey.toBase58());
    log("Recipient address:", recipient.publicKey.toBase58());

    const airdropSignature = await provider.connection.requestAirdrop(
      recipient.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSignature);
    log("Airdropped SOL to recipient");

    const tokenAccountAddress = await getAssociatedTokenAddress(
      mint.publicKey,
      recipient.publicKey
    );
    log("Token account address:", tokenAccountAddress.toBase58());

    const metadataAddress = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.publicKey.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )[0];
    log("Metadata address:", metadataAddress.toBase58());

    const masterEditionAddress = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.publicKey.toBuffer(),
        Buffer.from("edition"),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )[0];
    log("Master edition address:", masterEditionAddress.toBase58());

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

      log("Membership NFT minted successfully");

      const tokenAccount = await provider.connection.getTokenAccountBalance(
        tokenAccountAddress
      );
      log("Token account balance:", tokenAccount.value.uiAmount);
      expect(tokenAccount.value.uiAmount).to.equal(1);

      const membershipDataAccount = await program.account.membershipData.fetch(membershipData.publicKey);
      log("Updated membership data:", membershipDataAccount);
      expect(membershipDataAccount.totalMinted.toNumber()).to.equal(1);

      log("Membership NFT minting test passed");
    } catch (error) {
      log("Error minting membership NFT:", error);
      throw error;
    }
  });

  it("Creates multiple membership tiers", async () => {
    const admin = provider.wallet;
  
    // Create a new membership data account
    const membershipData = anchor.web3.Keypair.generate();
    log("Creating membership data with publicKey:", membershipData.publicKey.toBase58());
  
    try {
      await program.methods
        .initializeMembership(
          new anchor.BN(2), // Different membership_id
          "Multi-Tier Membership",
          "MTM",
          "https://example.com/multi-tier/",
          new anchor.BN(10000),
          true,
          5
        )
        .accounts({
          membershipData: membershipData.publicKey,
          admin: admin.publicKey,
        })
        .signers([membershipData])
        .rpc();
  
      log("Multi-tier membership data initialized");
  
      // Define tiers
      const tiers = [
        { id: "BRONZE", duration: 30 * 24 * 60 * 60, isOpen: true, uri: "bronze.json" },
        { id: "SILVER", duration: 90 * 24 * 60 * 60, isOpen: true, uri: "silver.json" },
        { id: "GOLD", duration: 365 * 24 * 60 * 60, isOpen: true, uri: "gold.json" },
      ];
  
      // Create each tier
      for (const tier of tiers) {
        log(`Creating ${tier.id} tier`);
        try {
          await program.methods
            .createMembershipTier(
              tier.id,
              new anchor.BN(tier.duration),
              tier.isOpen,
              tier.uri
            )
            .accounts({
              membershipData: membershipData.publicKey,
              authority: admin.publicKey,
            })
            .rpc();
          log(`${tier.id} tier created`);
        } catch (error) {
          log(`Error creating ${tier.id} tier:`, error);
          throw error;
        }
      }
  
      // Fetch and verify the membership data
      const account = await program.account.membershipData.fetch(membershipData.publicKey);
      log("Fetched updated membership data:", account);
  
      expect(account.tiers.length).to.equal(tiers.length);
  
      for (let i = 0; i < tiers.length; i++) {
        log(`Verifying ${tiers[i].id} tier`);
        expect(account.tiers[i].tierId).to.equal(tiers[i].id);
        expect(account.tiers[i].duration.toNumber()).to.equal(tiers[i].duration);
        expect(account.tiers[i].isOpen).to.equal(tiers[i].isOpen);
        expect(account.tiers[i].tierUri).to.equal(tiers[i].uri);
      }
  
      log("Multiple membership tiers creation test passed");
    } catch (error) {
      log("Error in multiple membership tiers test:", error);
      throw error;
    }
  });
  
  it("Mints NFTs for different membership tiers", async () => {
    const admin = provider.wallet;

    // Use the membership data from the previous test
    const membershipDataAccount = await program.account.membershipData.fetch(membershipData.publicKey);
    log("Using membership data:", membershipDataAccount);

    const initialTotalMinted = membershipDataAccount.totalMinted.toNumber();
    log("Initial total minted:", initialTotalMinted);

    // Mint an NFT for each tier
    for (let i = 0; i < membershipDataAccount.tiers.length; i++) {
        const mint = anchor.web3.Keypair.generate();
        const recipient = anchor.web3.Keypair.generate();

        log(`Minting ${membershipDataAccount.tiers[i].tierId} membership NFT`);
        log("Mint address:", mint.publicKey.toBase58());
        log("Recipient address:", recipient.publicKey.toBase58());

        // Airdrop some SOL to the recipient
        const airdropSignature = await provider.connection.requestAirdrop(
            recipient.publicKey,
            2 * anchor.web3.LAMPORTS_PER_SOL
        );
        await provider.connection.confirmTransaction(airdropSignature);
        log("Airdropped SOL to recipient");

        const tokenAccountAddress = await getAssociatedTokenAddress(
            mint.publicKey,
            recipient.publicKey
        );
        log("Token account address:", tokenAccountAddress.toBase58());

        const metadataAddress = anchor.web3.PublicKey.findProgramAddressSync(
            [
                Buffer.from("metadata"),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                mint.publicKey.toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM_ID
        )[0];
        log("Metadata address:", metadataAddress.toBase58());

        const masterEditionAddress = anchor.web3.PublicKey.findProgramAddressSync(
            [
                Buffer.from("metadata"),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                mint.publicKey.toBuffer(),
                Buffer.from("edition"),
            ],
            TOKEN_METADATA_PROGRAM_ID
        )[0];
        log("Master edition address:", masterEditionAddress.toBase58());

        try {
            await program.methods
                .mintMembership(i) // Use the index as the tier index
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

            log(`${membershipDataAccount.tiers[i].tierId} membership NFT minted successfully`);

            const tokenAccount = await provider.connection.getTokenAccountBalance(
                tokenAccountAddress
            );
            log("Token account balance:", tokenAccount.value.uiAmount);
            expect(tokenAccount.value.uiAmount).to.equal(1);

        } catch (error) {
            log(`Error minting ${membershipDataAccount.tiers[i].tierId} membership NFT:`, error);
            throw error;
        }

        // Add a delay between mints to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Verify the total minted count
    const updatedMembershipData = await program.account.membershipData.fetch(membershipData.publicKey);
    log("Updated membership data:", updatedMembershipData);
    
    const expectedTotalMinted = initialTotalMinted + membershipDataAccount.tiers.length;
    log("Expected total minted:", expectedTotalMinted);
    log("Actual total minted:", updatedMembershipData.totalMinted.toNumber());
    
    expect(updatedMembershipData.totalMinted.toNumber()).to.equal(expectedTotalMinted);

    log("Minting NFTs for different membership tiers test passed");
  });
});