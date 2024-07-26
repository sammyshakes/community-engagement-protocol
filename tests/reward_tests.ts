import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CommunityEngagementProtocol } from "../target/types/community_engagement_protocol";
import { expect } from 'chai';
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";

describe("Reward Tests", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.CommunityEngagementProtocol as Program<CommunityEngagementProtocol>;

  let groupHubList: anchor.web3.Keypair;
  let groupHub: anchor.web3.Keypair;

  before(async () => {
    groupHubList = anchor.web3.Keypair.generate();
    groupHub = anchor.web3.Keypair.generate();
    
    // Initialize the GroupHubList account
    await program.methods
      .initializeGroupHubList()
      .accounts({
        groupHubList: groupHubList.publicKey,
        user: provider.wallet.publicKey,
      })
      .signers([groupHubList])
      .rpc();

    // Create a GroupHub
    await program.methods
      .createGroupHub(
        "Test Group Hub",
        "A test group hub for rewards",
        null,
        null,
        null,
        []
      )
      .accounts({
        groupHub: groupHub.publicKey,
        groupHubList: groupHubList.publicKey,
        user: provider.wallet.publicKey,
      })
      .signers([groupHub])
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
        groupHub: groupHub.publicKey,
        reward: reward.publicKey,
        tokenMint: tokenMint.publicKey,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([reward, tokenMint])
      .rpc();

    // Fetch and check the reward account
    const rewardAccount = await program.account.reward.fetch(reward.publicKey);
    expect(rewardAccount.name).to.equal("Test Fungible Reward");
    expect(rewardAccount.description).to.equal("A test fungible reward");
    expect(rewardAccount.rewardType).to.deep.equal({ fungible: {} });
    expect(rewardAccount.tokenMint.toString()).to.equal(tokenMint.publicKey.toString());
    expect(rewardAccount.tokenSupply.toString()).to.equal("1000000");
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
        groupHub: groupHub.publicKey,
        reward: reward.publicKey,
        tokenMint: tokenMint.publicKey,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
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
        systemProgram: anchor.web3.SystemProgram.programId,
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
        groupHub: groupHub.publicKey,
        userReward: userReward.publicKey,
        reward: reward.publicKey,
        user: user.publicKey,
        userRewards: userRewards.publicKey,
        authority: provider.wallet.publicKey,
        tokenMint: tokenMint.publicKey,
        userTokenAccount: userTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
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
});