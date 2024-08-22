import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CommunityEngagementProtocol } from "../target/types/community_engagement_protocol";
import { expect } from 'chai';

import { program, provider, brandList, createUniqueBrand, initializeProgramState, initializeBrandList, log, fundAccount, TRONIC_ADMIN_PUBKEY, TRONIC_ADMIN_KEYPAIR } from './common';

type RewardType = {
    fungible?: {
      tokenMint: anchor.web3.PublicKey;
      tokenSupply: anchor.BN;
    };
    nonFungible?: {
      tokenMint: anchor.web3.PublicKey;
      metadataUri: string;
    };
  };

type RewardAccount = {
    brand: anchor.web3.PublicKey;
    name: string;
    description: string;
    rewardType: RewardType;
    createdAt: anchor.BN;
    updatedAt: anchor.BN;
    issuedCount: anchor.BN;
  };
  

describe("Reward Tests", () => {
  before(initializeProgramState);
  before(initializeBrandList);

  let brandPda: anchor.web3.PublicKey;

  before(async () => {
    brandPda = await createUniqueBrand();
  });

  it("Creates a fungible reward", async () => {
    const reward = anchor.web3.Keypair.generate();
    const tokenMint = anchor.web3.Keypair.generate();
  
    await program.methods
      .createFungibleReward(
        "Test Fungible Reward",
        "A test fungible reward",
        new anchor.BN(1000000) // 1 million tokens
      )
      .accounts({
        brand: brandPda,
        reward: reward.publicKey,
        tokenMint: tokenMint.publicKey,
        tronicAdmin: TRONIC_ADMIN_PUBKEY,
      })
      .signers([reward, tokenMint, TRONIC_ADMIN_KEYPAIR])
      .rpc();
  
    // Fetch and check the reward account
    const rewardAccount = await program.account.reward.fetch(reward.publicKey) as RewardAccount;
    // console.log("Reward Account:", JSON.stringify(rewardAccount, (key, value) =>
    //     typeof value === 'bigint' ? value.toString() : value
    // , 2));

    expect(rewardAccount.name).to.equal("Test Fungible Reward");
    expect(rewardAccount.description).to.equal("A test fungible reward");
    
    // Check the reward type
    expect(rewardAccount.rewardType.fungible).to.not.be.undefined;
    if (rewardAccount.rewardType.fungible) {
        expect(rewardAccount.rewardType.fungible.tokenMint.toString()).to.equal(tokenMint.publicKey.toString());
        expect(rewardAccount.rewardType.fungible.tokenSupply.toString()).to.equal('1000000');
    } else {
        throw new Error("Reward type is not fungible");
    }
  });

  it("Creates a non-fungible reward", async () => {
    const reward = anchor.web3.Keypair.generate();
    const tokenMint = anchor.web3.Keypair.generate();

    await program.methods
      .createNonFungibleReward(
        "Test Non-Fungible Reward",
        "A test non-fungible reward",
        "https://example.com/metadata.json"
      )
      .accounts({
        brand: brandPda,
        reward: reward.publicKey,
        tokenMint: tokenMint.publicKey,
        tronicAdmin: TRONIC_ADMIN_PUBKEY,
      })
      .signers([reward, tokenMint, TRONIC_ADMIN_KEYPAIR])
      .rpc();

    // Fetch and check the reward account
    const rewardAccount = await program.account.reward.fetch(reward.publicKey) as RewardAccount;
    // console.log("Reward Account:", JSON.stringify(rewardAccount, (key, value) =>
    //   typeof value === 'bigint' ? value.toString() : value
    // , 2));

    expect(rewardAccount.name).to.equal("Test Non-Fungible Reward");
    expect(rewardAccount.description).to.equal("A test non-fungible reward");
    
    expect(rewardAccount.rewardType.nonFungible).to.not.be.undefined;
    if (rewardAccount.rewardType.nonFungible) {
      expect(rewardAccount.rewardType.nonFungible.tokenMint.toString()).to.equal(tokenMint.publicKey.toString());
      expect(rewardAccount.rewardType.nonFungible.metadataUri).to.equal("https://example.com/metadata.json");
    }
});

  it("Issues a fungible reward", async () => {
    const reward = anchor.web3.Keypair.generate();
    const tokenMint = anchor.web3.Keypair.generate();
    const user = anchor.web3.Keypair.generate();

    // Airdrop some SOL to the user for rent
    const signature = await provider.connection.requestAirdrop(user.publicKey, 1000000000);
    await provider.connection.confirmTransaction(signature);

    // First, create the fungible reward
    await program.methods
      .createFungibleReward(
        "Test Fungible Reward",
        "A test fungible reward",
        new anchor.BN(1000000) // 1 million tokens
      )
      .accounts({
        brand: brandPda,
        reward: reward.publicKey,
        tokenMint: tokenMint.publicKey,
        tronicAdmin: TRONIC_ADMIN_PUBKEY,
      })
      .signers([reward, tokenMint, TRONIC_ADMIN_KEYPAIR])
      .rpc();

    // Issue the reward
    const userTokenAccount = await anchor.utils.token.associatedAddress({
      mint: tokenMint.publicKey,
      owner: user.publicKey
    });

    await program.methods
      .issueFungibleReward(new anchor.BN(100)) // Issue 100 tokens
      .accounts({
        brand: brandPda,
        reward: reward.publicKey,
        user: user.publicKey,
        tronicAdmin: TRONIC_ADMIN_PUBKEY,
        tokenMint: tokenMint.publicKey,
      })
      .signers([TRONIC_ADMIN_KEYPAIR])
      .rpc();

    // Verify the reward issuance
    const userTokenAccountInfo = await provider.connection.getTokenAccountBalance(userTokenAccount);
    expect(userTokenAccountInfo.value.uiAmount).to.equal(100);

  });

  it("Issues a non-fungible reward", async () => {
    const reward = anchor.web3.Keypair.generate();
    const tokenMint = anchor.web3.Keypair.generate();
    const user = anchor.web3.Keypair.generate();
    const rewardInstance = anchor.web3.Keypair.generate();

    console.log("reward:", reward.publicKey.toBase58());
    console.log("tokenMint:", tokenMint.publicKey.toBase58());
    console.log("user:", user.publicKey.toBase58());
    console.log("rewardInstance:", rewardInstance.publicKey.toBase58());
  
    // Airdrop some SOL to the user for rent
    const signature = await provider.connection.requestAirdrop(user.publicKey, 1000000000);
    await provider.connection.confirmTransaction(signature);
  
    // First, create the non-fungible reward
    await program.methods
      .createNonFungibleReward(
        "Test Non-Fungible Reward",
        "A test non-fungible reward",
        "https://example.com/metadata.json"
      )
      .accounts({
        brand: brandPda,
        reward: reward.publicKey,
        tokenMint: tokenMint.publicKey,
        tronicAdmin: TRONIC_ADMIN_PUBKEY,
      })
      .signers([reward, tokenMint, TRONIC_ADMIN_KEYPAIR])
      .rpc();
  
    
    // Issue the non-fungible reward
    const userTokenAccount = await anchor.utils.token.associatedAddress({
      mint: tokenMint.publicKey,
      owner: user.publicKey
    });
  
    await program.methods
      .issueNonFungibleReward()
      .accounts({
        reward: reward.publicKey,
        rewardInstance: rewardInstance.publicKey,
        user: user.publicKey,
        tronicAdmin: TRONIC_ADMIN_PUBKEY,
        tokenMint: tokenMint.publicKey,
      })
      .signers([rewardInstance, TRONIC_ADMIN_KEYPAIR])
      .rpc();
  
    // Verify the reward issuance
    const rewardInstanceAccount = await program.account.nonFungibleRewardInstance.fetch(rewardInstance.publicKey);
    expect(rewardInstanceAccount.reward.toString()).to.equal(reward.publicKey.toString());
    expect(rewardInstanceAccount.owner.toString()).to.equal(user.publicKey.toString());
    expect(rewardInstanceAccount.tokenId.toNumber()).to.equal(1);
  
    const updatedRewardAccount = await program.account.reward.fetch(reward.publicKey) as RewardAccount;
    expect(updatedRewardAccount.issuedCount.toNumber()).to.equal(1);
  
    const userTokenAccountInfo = await provider.connection.getTokenAccountBalance(userTokenAccount);
    expect(userTokenAccountInfo.value.uiAmount).to.equal(1);
  });

  it("Fails to create a fungible reward with non-admin signer", async () => {
    const reward = anchor.web3.Keypair.generate();
    const tokenMint = anchor.web3.Keypair.generate();
    const nonAdminKeypair = anchor.web3.Keypair.generate();

    // Fund the non-admin account
    await fundAccount(program.provider.connection, nonAdminKeypair.publicKey);

    try {
      await program.methods
        .createFungibleReward("Test Reward", "A test reward", new anchor.BN(1000000))
        .accounts({
          brand: brandPda,
          reward: reward.publicKey,
          tokenMint: tokenMint.publicKey,
          tronicAdmin: nonAdminKeypair.publicKey,
        })
        .signers([reward, tokenMint, nonAdminKeypair])
        .rpc();

      expect.fail("Expected an error but none was thrown");
    } catch (error) {
      expect(error.message).to.include("Error Code: UnauthorizedTronicAdmin");
    }
  });

  it("Fails to create a non-fungible reward with non-admin signer", async () => {
    const reward = anchor.web3.Keypair.generate();
    const tokenMint = anchor.web3.Keypair.generate();
    const nonAdminKeypair = anchor.web3.Keypair.generate();

    // Fund the non-admin account
    await fundAccount(program.provider.connection, nonAdminKeypair.publicKey);

    try {
      await program.methods
        .createNonFungibleReward("Test NFT Reward", "A test NFT reward", "https://example.com/metadata.json")
        .accounts({
          brand: brandPda,
          reward: reward.publicKey,
          tokenMint: tokenMint.publicKey,
          tronicAdmin: nonAdminKeypair.publicKey,
        })
        .signers([reward, tokenMint, nonAdminKeypair])
        .rpc();

      expect.fail("Expected an error but none was thrown");
    } catch (error) {
      expect(error.message).to.include("Error Code: UnauthorizedTronicAdmin");
    }
  });

  it("Fails to issue a fungible reward with non-admin signer", async () => {
    const reward = anchor.web3.Keypair.generate();
    const tokenMint = anchor.web3.Keypair.generate();
    const user = anchor.web3.Keypair.generate();
    const nonAdminKeypair = anchor.web3.Keypair.generate();

    // Create the reward first (as admin)
    const sig = await program.methods
      .createFungibleReward("Test Reward", "A test reward", new anchor.BN(1000000))
      .accounts({
        brand: brandPda,
        reward: reward.publicKey,
        tokenMint: tokenMint.publicKey,
        tronicAdmin: TRONIC_ADMIN_PUBKEY,
      })
      .signers([reward, tokenMint, TRONIC_ADMIN_KEYPAIR])
      .rpc();

      console.log("sig:", sig);

    // Fund the non-admin account
    await fundAccount(program.provider.connection, nonAdminKeypair.publicKey);

    // Try to issue the reward as non-admin
    try {
      await program.methods
        .issueFungibleReward(new anchor.BN(100))
        .accounts({
          brand: brandPda,
          reward: reward.publicKey,
          user: user.publicKey,
          tronicAdmin: nonAdminKeypair.publicKey,
          tokenMint: tokenMint.publicKey,
        })
        .signers([nonAdminKeypair])
        .rpc();

      expect.fail("Expected an error but none was thrown");
    } catch (error) {
      expect(error.message).to.include("Error Code: UnauthorizedTronicAdmin");
    }
  });
});