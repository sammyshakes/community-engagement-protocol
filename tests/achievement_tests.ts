// tests/achievement_tests.ts
import { expect } from 'chai';
import * as anchor from "@coral-xyz/anchor";
import { program, provider, groupHubList, initializeGroupHubList, log, TOKEN_METADATA_PROGRAM_ID } from './common';

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

  it("Creates and awards a fungible achievement", async () => {
    log("Starting fungible achievement test");
    const groupHub = anchor.web3.Keypair.generate();
    const achievement = anchor.web3.Keypair.generate();
    const tokenMint = anchor.web3.Keypair.generate();
    const user = anchor.web3.Keypair.generate();
    const userAchievements = anchor.web3.Keypair.generate();
    const userAchievement = anchor.web3.Keypair.generate();
  
    log("Creating group hub");
    await program.methods
      .createGroupHub(
        "Test Group Hub",
        "A test group hub for fungible achievements",
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
    log("Group hub created with publicKey:", groupHub.publicKey.toBase58());
  
    log("Creating fungible achievement");
    await program.methods
      .createFungibleAchievement(
        "Test Fungible Achievement",
        "A test fungible achievement",
        "Complete the test",
        100,
        new anchor.BN(1000000)
      )
      .accounts({
        groupHub: groupHub.publicKey,
        achievement: achievement.publicKey,
        tokenMint: tokenMint.publicKey,
        authority: provider.wallet.publicKey,
      })
      .signers([achievement, tokenMint])
      .rpc();
    log("Fungible achievement created with publicKey:", achievement.publicKey.toBase58());
  
    log("Initializing user achievements");
    await program.methods
      .initializeUserAchievements()
      .accounts({
        userAchievements: userAchievements.publicKey,
        user: user.publicKey,
        authority: provider.wallet.publicKey,
      })
      .signers([userAchievements, user])
      .rpc();
    log("User achievements initialized with publicKey:", userAchievements.publicKey.toBase58());
  
    const userTokenAccount = await anchor.utils.token.associatedAddress({
      mint: tokenMint.publicKey,
      owner: user.publicKey
    });
    log("User token account:", userTokenAccount.toBase58());
  
    log("Awarding fungible achievement");
    await program.methods
      .awardFungibleAchievement()
      .accounts({
        groupHub: groupHub.publicKey,
        userAchievement: userAchievement.publicKey,
        achievement: achievement.publicKey,
        user: user.publicKey,
        userAchievements: userAchievements.publicKey,
        authority: provider.wallet.publicKey,
        tokenMint: tokenMint.publicKey,
      })
      .signers([userAchievement])
      .rpc();
    log("Fungible achievement awarded");
  
    log("Verifying award");
    const userTokenAccountInfo = await provider.connection.getTokenAccountBalance(userTokenAccount);
    log("User token account balance:", userTokenAccountInfo.value.uiAmount);
    expect(userTokenAccountInfo.value.uiAmount).to.equal(1);
  
    const updatedUserAchievements = await program.account.userAchievements.fetch(userAchievements.publicKey);
    log("Updated user achievements:", updatedUserAchievements);
    expect(updatedUserAchievements.achievements).to.have.lengthOf(1);
    expect(updatedUserAchievements.achievements[0].toString()).to.equal(achievement.publicKey.toString());
    
    log("Fungible achievement test completed successfully");
  });
  
  it("Creates and verifies a non-fungible achievement", async () => {
    log("Starting non-fungible achievement test");
    const groupHub = anchor.web3.Keypair.generate();
    const achievement = anchor.web3.Keypair.generate();
    const tokenMint = anchor.web3.Keypair.generate();
  
    log("Creating group hub");
    await program.methods
      .createGroupHub(
        "Test Group Hub",
        "A test group hub for non-fungible achievements",
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
    log("Group hub created with publicKey:", groupHub.publicKey.toBase58());
  
    const name = "Test Non-Fungible Achievement";
    const description = "A test non-fungible achievement";
    const criteria = "Complete the special test";
    const points = 1000;
    const metadataUri = "https://example.com/metadata.json";
  
    log("Calculating PDA addresses");
    const [metadataAccount] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        tokenMint.publicKey.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );
    log("Metadata account:", metadataAccount.toBase58());
  
    const [masterEditionAccount] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        tokenMint.publicKey.toBuffer(),
        Buffer.from("edition"),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );
    log("Master edition account:", masterEditionAccount.toBase58());
  
    const tokenAccount = await anchor.utils.token.associatedAddress({
      mint: tokenMint.publicKey,
      owner: provider.wallet.publicKey,
    });
    log("Token account:", tokenAccount.toBase58());

    log("Accounts being passed to create_non_fungible_achievement:");
    log("Achievement:", achievement.publicKey.toBase58());
    log("Token Mint:", tokenMint.publicKey.toBase58());
    log("Authority:", provider.wallet.publicKey.toBase58());
  
    log("Creating non-fungible achievement");
    try {
      await program.methods
        .createNonFungibleAchievement(
          name,
          description,
          criteria,
          points,
          metadataUri
        )
        .accounts({
          groupHub: groupHub.publicKey,
          achievement: achievement.publicKey,
          tokenMint: tokenMint.publicKey,
          metadataAccount: metadataAccount,
          masterEditionAccount: masterEditionAccount,
          authority: provider.wallet.publicKey,
        })
        .signers([achievement, tokenMint])
        .rpc();
      log("Non-fungible achievement created with publicKey:", achievement.publicKey.toBase58());
    } catch (error) {
      log("Error creating non-fungible achievement:", error);
      throw error;
    }
  
    log("Verifying non-fungible achievement");
    const achievementAccount = await program.account.achievement.fetch(achievement.publicKey);
    log("Achievement account:", achievementAccount);
    expect(achievementAccount.name).to.equal(name);
    expect(achievementAccount.description).to.equal(description);
    expect(achievementAccount.criteria).to.equal(criteria);
    expect(achievementAccount.points).to.equal(points);
    expect(achievementAccount.achievementType).to.deep.equal({ nonFungible: {} });
    // expect(achievementAccount.tokenMint.toString()).to.equal(tokenMint.publicKey.toString());
    // expect(achievementAccount.tokenSupply.toString()).to.equal("1");
    expect(achievementAccount.metadataUri).to.equal(metadataUri);
  
    log("Verifying metadata account");
    const metadataAccountInfo = await provider.connection.getAccountInfo(metadataAccount);
    log("Metadata account info:", metadataAccountInfo);
    expect(metadataAccountInfo).to.not.be.null;
  
    log("Verifying master edition account");
    const masterEditionAccountInfo = await provider.connection.getAccountInfo(masterEditionAccount);
    log("Master edition account info:", masterEditionAccountInfo);
    expect(masterEditionAccountInfo).to.not.be.null;
  
    log("Verifying token account");
    const tokenAccountInfo = await provider.connection.getAccountInfo(tokenAccount);
    log("Token account info:", tokenAccountInfo);
    expect(tokenAccountInfo).to.not.be.null;
  
    // Check the token balance
    const tokenBalance = await provider.connection.getTokenAccountBalance(tokenAccount);
    log("Token balance:", tokenBalance.value.uiAmount);
    expect(tokenBalance.value.uiAmount).to.equal(1);
  
    log("Non-fungible achievement created and verified successfully");
  });
});