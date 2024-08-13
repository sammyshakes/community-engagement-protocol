import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CommunityEngagementProtocol } from "../target/types/community_engagement_protocol";
import { expect } from 'chai';

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
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.CommunityEngagementProtocol as Program<CommunityEngagementProtocol>;

  let brandList: anchor.web3.Keypair;
  let brand: anchor.web3.Keypair;

  before(async () => {
    brandList = anchor.web3.Keypair.generate();
    brand = anchor.web3.Keypair.generate();
    
    // Initialize the BrandList account
    await program.methods
      .initializeBrandList()
      .accounts({
        brandList: brandList.publicKey,
        user: provider.wallet.publicKey,
      })
      .signers([brandList])
      .rpc();

    // Create a Brand
    await program.methods
      .createBrand(
        "Test Brand",
        "A test brand for rewards",
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
        brand: brand.publicKey,
        reward: reward.publicKey,
        tokenMint: tokenMint.publicKey,
        authority: provider.wallet.publicKey,
      })
      .signers([reward, tokenMint])
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
        brand: brand.publicKey,
        reward: reward.publicKey,
        tokenMint: tokenMint.publicKey,
        authority: provider.wallet.publicKey,
      })
      .signers([reward, tokenMint])
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
    const userRewards = anchor.web3.Keypair.generate();

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
        brand: brand.publicKey,
        reward: reward.publicKey,
        tokenMint: tokenMint.publicKey,
        authority: provider.wallet.publicKey,
      })
      .signers([reward, tokenMint])
      .rpc();

    // Initialize user rewards
    await program.methods
      .initializeUserRewards()
      .accounts({
        userRewards: userRewards.publicKey,
        user: user.publicKey,
        authority: provider.wallet.publicKey,
      })
      .signers([userRewards, user])
      .rpc();

    // Issue the reward
    const userReward = anchor.web3.Keypair.generate();
    const userTokenAccount = await anchor.utils.token.associatedAddress({
      mint: tokenMint.publicKey,
      owner: user.publicKey
    });

    await program.methods
      .issueFungibleReward(new anchor.BN(100)) // Issue 100 tokens
      .accounts({
        brand: brand.publicKey,
        userReward: userReward.publicKey,
        reward: reward.publicKey,
        user: user.publicKey,
        userRewards: userRewards.publicKey,
        authority: provider.wallet.publicKey,
        tokenMint: tokenMint.publicKey,
      })
      .signers([userReward])
      .rpc();

    // Verify the reward issuance
    const userTokenAccountInfo = await provider.connection.getTokenAccountBalance(userTokenAccount);
    expect(userTokenAccountInfo.value.uiAmount).to.equal(100);

    const updatedUserRewards = await program.account.userRewards.fetch(userRewards.publicKey);
    expect(updatedUserRewards.rewards).to.have.lengthOf(1);
    expect(updatedUserRewards.rewards[0].toString()).to.equal(reward.publicKey.toString());
  });

  it("Issues a non-fungible reward", async () => {
    const reward = anchor.web3.Keypair.generate();
    const tokenMint = anchor.web3.Keypair.generate();
    const user = anchor.web3.Keypair.generate();
    const userRewards = anchor.web3.Keypair.generate();
    const rewardInstance = anchor.web3.Keypair.generate();
  
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
        brand: brand.publicKey,
        reward: reward.publicKey,
        tokenMint: tokenMint.publicKey,
        authority: provider.wallet.publicKey,
      })
      .signers([reward, tokenMint])
      .rpc();
  
    // Initialize user rewards if not already done
    await program.methods
      .initializeUserRewards()
      .accounts({
        userRewards: userRewards.publicKey,
        user: user.publicKey,
        authority: provider.wallet.publicKey,
      })
      .signers([userRewards, user])
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
        userRewards: userRewards.publicKey,
        authority: provider.wallet.publicKey,
        tokenMint: tokenMint.publicKey,
      })
      .signers([rewardInstance, user])
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
  
    const updatedUserRewards = await program.account.userRewards.fetch(userRewards.publicKey);
    expect(updatedUserRewards.rewards).to.have.lengthOf(1);
    expect(updatedUserRewards.rewards[0].toString()).to.equal(reward.publicKey.toString());
  });
});