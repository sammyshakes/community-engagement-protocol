// tests/achievement_tests.ts
import { expect } from 'chai';
import * as anchor from "@coral-xyz/anchor";
import { program, provider, brandList, createUniqueBrand, initializeProgramState, initializeBrandList, log, TOKEN_METADATA_PROGRAM_ID, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, TRONIC_ADMIN_PUBKEY, TRONIC_ADMIN_KEYPAIR, fundAccount } from './common';

describe("Achievement Tests", () => {
  before(initializeProgramState);
  before(initializeBrandList);

  it("Lists achievements for a brand", async () => {
    //Create a brand
    const brandPda = await createUniqueBrand();

    const achievementCount = 3;
    const achievementKeys: anchor.web3.PublicKey[] = [];

    for (let i = 0; i < achievementCount; i++) {
      const achievement = anchor.web3.Keypair.generate();
      await program.methods
        .createAchievement(`Achievement ${i+1}`, `Description ${i+1}`, `Criteria ${i+1}`, 100 * (i+1))
        .accounts({
          brand: brandPda,
          achievement: achievement.publicKey,
          authority: provider.wallet.publicKey,
        })
        .signers([achievement])
        .rpc();

      log(`Created Achievement ${i+1} with publicKey:`, achievement.publicKey.toBase58());
      achievementKeys.push(achievement.publicKey);
    }

    const achievements = await program.methods
      .listBrandAchievements()
      .accounts({
        brand: brandPda,
      })
      .view();

    log("Listed Brand Achievements:", achievements);

    expect(achievements).to.have.lengthOf(achievementCount);
    achievementKeys.forEach(key => {
      expect(achievements.some(a => a.equals(key))).to.be.true;
    });
  });

  it("Gets achievement info", async () => {
    const brandPda = await createUniqueBrand();
    const achievement = anchor.web3.Keypair.generate();
    const name = "Test Achievement";
    const description = "A test achievement";
    const criteria = "Complete the test";
    const points = 100;

    await program.methods
      .createAchievement(name, description, criteria, points)
      .accounts({
        brand: brandPda,
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
    expect(achievementInfo.brand.toString()).to.equal(brandPda.toString());
    expect(achievementInfo.createdAt.toNumber()).to.be.a('number');
    expect(achievementInfo.updatedAt.toNumber()).to.be.a('number');
  });

  it("Creates and awards a fungible achievement", async () => {
    log("Starting fungible achievement test");
    const achievement = anchor.web3.Keypair.generate();
    const tokenMint = anchor.web3.Keypair.generate();
    const user = anchor.web3.Keypair.generate();
    const userAchievements = anchor.web3.Keypair.generate();
    const userAchievement = anchor.web3.Keypair.generate();
  
    log("Creating brand");
    const brandPda = await createUniqueBrand();

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
        brand: brandPda,
        achievement: achievement.publicKey,
        tokenMint: tokenMint.publicKey,
        tronicAdmin: TRONIC_ADMIN_PUBKEY,
      })
      .signers([achievement, tokenMint, TRONIC_ADMIN_KEYPAIR])
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
        brand: brandPda,
        userAchievement: userAchievement.publicKey,
        achievement: achievement.publicKey,
        user: user.publicKey,
        userAchievements: userAchievements.publicKey,
        authority: provider.wallet.publicKey,
        tokenMint: tokenMint.publicKey,
        // userTokenAccount: userTokenAccount,
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


  it("Creates a non-fungible achievement", async () => {
    const brandPda = await createUniqueBrand();
   
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
          brand: brandPda,
          achievement: achievement.publicKey,
          mint: mint.publicKey,
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

  it("Fails to create a fungible achievement with non-admin signer", async () => {
    const brandPda = await createUniqueBrand();
    const achievement = anchor.web3.Keypair.generate();
    const tokenMint = anchor.web3.Keypair.generate();
    const nonAdminKeypair = anchor.web3.Keypair.generate();

    // fund the non-admin keypair
    await fundAccount(program.provider.connection, nonAdminKeypair.publicKey);

    try {
      await program.methods
        .createFungibleAchievement(
          "Test Fungible Achievement",
          "A test fungible achievement",
          "Complete the test",
          100,
          new anchor.BN(1000000)
        )
        .accounts({
          brand: brandPda,
          achievement: achievement.publicKey,
          tokenMint: tokenMint.publicKey,
          tronicAdmin: nonAdminKeypair.publicKey,
        })
        .signers([achievement, tokenMint, nonAdminKeypair])
        .rpc();

        console.log("Fungible achievement created with publicKey:", achievement.publicKey.toBase58());

      expect.fail("Expected an error but none was thrown");
    } catch (error) {
      log("Fungible achievement creation failed as expected", error.message);
      expect(error.message).to.include("Error Code: UnauthorizedTronicAdmin");
    }
  });

  it("Fails to create a non-fungible achievement with non-admin signer", async () => {
    const brandPda = await createUniqueBrand();
    const achievement = anchor.web3.Keypair.generate();
    const mint = anchor.web3.Keypair.generate();
    const nonAdminKeypair = anchor.web3.Keypair.generate();

    // fund the non-admin keypair
    await fundAccount(program.provider.connection, nonAdminKeypair.publicKey);

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
          brand: brandPda,
          achievement: achievement.publicKey,
          mint: mint.publicKey,
          tronicAdmin: nonAdminKeypair.publicKey,
        })
        .signers([achievement, mint, nonAdminKeypair])
        .rpc();

      expect.fail("Expected an error but none was thrown");
    } catch (error) {
      expect(error.message).to.include("Error Code: UnauthorizedTronicAdmin");
    }
  });
});