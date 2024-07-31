// tests/achievement_tests.ts
import { expect } from 'chai';
import * as anchor from "@coral-xyz/anchor";
import { program, provider, groupHubList, initializeGroupHubList, log, TOKEN_METADATA_PROGRAM_ID, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from './common';

describe("Achievement Tests", () => {
  before(initializeGroupHubList);

  it("Lists achievements for a group hub", async () => {
    const groupHub = anchor.web3.Keypair.generate();
    const name = "Test Group Hub";
    const description = "A test group hub for our community engagement protocol";

    await program.methods
      .createGroupHub(name, description, null, null, null, [])
      .accounts({
        groupHub: groupHub.publicKey,
        groupHubList: groupHubList.publicKey,
        user: provider.wallet.publicKey,
      })
      .signers([groupHub])
      .rpc();

    log("Created GroupHub for listing achievements test with publicKey:", groupHub.publicKey.toBase58());

    const achievementCount = 3;
    const achievementKeys: anchor.web3.PublicKey[] = [];

    for (let i = 0; i < achievementCount; i++) {
      const achievement = anchor.web3.Keypair.generate();
      await program.methods
        .createAchievement(`Achievement ${i+1}`, `Description ${i+1}`, `Criteria ${i+1}`, 100 * (i+1))
        .accounts({
          groupHub: groupHub.publicKey,
          achievement: achievement.publicKey,
          authority: provider.wallet.publicKey,
        })
        .signers([achievement])
        .rpc();

      log(`Created Achievement ${i+1} with publicKey:`, achievement.publicKey.toBase58());
      achievementKeys.push(achievement.publicKey);
    }

    const achievements = await program.methods
      .listGroupHubAchievements()
      .accounts({
        groupHub: groupHub.publicKey,
      })
      .view();

    log("Listed GroupHub Achievements:", achievements);

    expect(achievements).to.have.lengthOf(achievementCount);
    achievementKeys.forEach(key => {
      expect(achievements.some(a => a.equals(key))).to.be.true;
    });
  });

  it("Gets achievement info", async () => {
    const groupHub = anchor.web3.Keypair.generate();
    await program.methods
      .createGroupHub("Test Group Hub", "A test group hub", null, null, null, [])
      .accounts({
        groupHub: groupHub.publicKey,
        groupHubList: groupHubList.publicKey,
        user: provider.wallet.publicKey,
      })
      .signers([groupHub])
      .rpc();

    log("Created GroupHub for get achievement info test with publicKey:", groupHub.publicKey.toBase58());

    const achievement = anchor.web3.Keypair.generate();
    const name = "Test Achievement";
    const description = "A test achievement";
    const criteria = "Complete the test";
    const points = 100;

    await program.methods
      .createAchievement(name, description, criteria, points)
      .accounts({
        groupHub: groupHub.publicKey,
        achievement: achievement.publicKey,
        authority: provider.wallet.publicKey,
      })
      .signers([achievement])
      .rpc();

    log("Created Achievement for get info test with publicKey:", achievement.publicKey.toBase58());

    const achievementInfo = await program.methods
      .getAchievementInfo()
      .accounts({
        achievement: achievement.publicKey,
      })
      .view();

    log("Achievement Info:", achievementInfo);

    expect(achievementInfo.name).to.equal(name);
    expect(achievementInfo.description).to.equal(description);
    expect(achievementInfo.criteria).to.equal(criteria);
    expect(achievementInfo.points).to.equal(points);
    expect(achievementInfo.groupHub.toString()).to.equal(groupHub.publicKey.toString());
    expect(achievementInfo.createdAt.toNumber()).to.be.a('number');
    expect(achievementInfo.updatedAt.toNumber()).to.be.a('number');
  });


  it("Creates a non-fungible achievement", async () => {
    const groupHub = anchor.web3.Keypair.generate();
    await program.methods
      .createGroupHub("Test Group Hub", "A test group hub", null, null, null, [])
      .accounts({
        groupHub: groupHub.publicKey,
        groupHubList: groupHubList.publicKey,
        user: provider.wallet.publicKey,
      })
      .signers([groupHub])
      .rpc();
  
    log("Created GroupHub for non-fungible achievement test with publicKey:", groupHub.publicKey.toBase58());
  
    const achievement = anchor.web3.Keypair.generate();
    const mint = anchor.web3.Keypair.generate();

    log("Creating non-fungible achievement");
    log("Achievement public key:", achievement.publicKey.toBase58());
    log("Mint public key:", mint.publicKey.toBase58());
  
    try {
      await program.methods
        .createNonFungibleAchievement(
          "Test Non-Fungible Achievement",
          "A test non-fungible achievement",
          "Complete the special test",
          1000,
          "https://example.com/metadata.json"
        )
        .accounts({
          groupHub: groupHub.publicKey,
          achievement: achievement.publicKey,
          mint: mint.publicKey,
          admin: provider.wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([achievement, mint])
        .rpc();
  
      log("Non-fungible achievement created successfully");
  
      const achievementAccount = await program.account.achievement.fetch(achievement.publicKey);
      log("Achievement account:", achievementAccount);
  
      expect(achievementAccount.name).to.equal("Test Non-Fungible Achievement");
      expect(achievementAccount.description).to.equal("A test non-fungible achievement");
      expect(achievementAccount.criteria).to.equal("Complete the special test");
      expect(achievementAccount.points).to.equal(1000);
      expect(achievementAccount.achievementType).to.deep.equal({ nonFungible: {} });
      expect(achievementAccount.tokenMint.toString()).to.equal(mint.publicKey.toString());
      expect(achievementAccount.tokenSupply.toString()).to.equal("0");
      expect(achievementAccount.metadataUri).to.equal("https://example.com/metadata.json");
  
      // Verify the mint account
      const mintAccount = await provider.connection.getAccountInfo(mint.publicKey);
      log("Mint account exists:", mintAccount !== null);
      expect(mintAccount).to.not.be.null;
      
      log("Non-fungible achievement test passed");
    } catch (error) {
      console.error("Error creating non-fungible achievement:", error);
      throw error;
    }
  });
});