// import * as anchor from "@coral-xyz/anchor";
// import { Program } from "@coral-xyz/anchor";
// import { CommunityEngagementProtocol } from "../target/types/community_engagement_protocol";
// import { expect } from 'chai';
// import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";

// const DEBUG = false;

// function log(...args: any[]) {
//   if (DEBUG) {
//     console.log(...args);
//   }
// }

// const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

// describe("community-engagement-protocol", () => {
//   const provider = anchor.AnchorProvider.env();
//   anchor.setProvider(provider);

//   const program = anchor.workspace.CommunityEngagementProtocol as Program<CommunityEngagementProtocol>;

//   let groupHubList: anchor.web3.Keypair;

//   before(async () => {
//     groupHubList = anchor.web3.Keypair.generate();
    
//     // Initialize the GroupHubList account
//     await program.methods
//       .initializeGroupHubList()
//       .accounts({
//         groupHubList: groupHubList.publicKey,
//         user: provider.wallet.publicKey,
//       })
//       .signers([groupHubList])
//       .rpc();

//     log("Initialized GroupHubList with publicKey:", groupHubList.publicKey.toBase58());
//   });

//   it("Creates a group hub", async () => {
//     const groupHub = anchor.web3.Keypair.generate();
//     const name = "Test Group Hub";
//     const description = "A test group hub for our community engagement protocol";

//     await program.methods
//       .createGroupHub(
//         name, 
//         description,
//         null,  // website
//         null,  // social_media
//         null,  // category
//         []     // tags
//       )
//       .accounts({
//         groupHub: groupHub.publicKey,
//         groupHubList: groupHubList.publicKey,
//         user: provider.wallet.publicKey,
//       })
//       .signers([groupHub])
//       .rpc();

//     log("Created GroupHub with publicKey:", groupHub.publicKey.toBase58());

//     const groupHubAccount = await program.account.groupHub.fetch(groupHub.publicKey);
//     log("GroupHub Account:", groupHubAccount);
//     expect(groupHubAccount.name).to.equal(name);
//     expect(groupHubAccount.description).to.equal(description);
//     expect(groupHubAccount.admins[0].toString()).to.equal(provider.wallet.publicKey.toString());
//   });

//   it("Creates a group hub with enhanced metadata", async () => {
//     const groupHub = anchor.web3.Keypair.generate();
//     const name = "Enhanced Test Group Hub";
//     const description = "A test group hub with enhanced metadata";
//     const website = "https://testhub.com";
//     const socialMedia = "@testhub";
//     const category = "Technology";
//     const tags = ["test", "community", "engagement"];

//     await program.methods
//       .createGroupHub(name, description, website, socialMedia, category, tags)
//       .accounts({
//         groupHub: groupHub.publicKey,
//         groupHubList: groupHubList.publicKey,
//         user: provider.wallet.publicKey,
//       })
//       .signers([groupHub])
//       .rpc();

//     log("Created Enhanced GroupHub with publicKey:", groupHub.publicKey.toBase58());

//     const groupHubAccount = await program.account.groupHub.fetch(groupHub.publicKey);
//     log("Enhanced GroupHub Account:", groupHubAccount);
    
//     expect(groupHubAccount.name).to.equal(name);
//     expect(groupHubAccount.description).to.equal(description);
//     expect(groupHubAccount.admins[0].toString()).to.equal(provider.wallet.publicKey.toString());
//     expect(groupHubAccount.metadata.website).to.equal(website);
//     expect(groupHubAccount.metadata.socialMedia).to.equal(socialMedia);
//     expect(groupHubAccount.metadata.category).to.equal(category);
//     expect(groupHubAccount.metadata.tags).to.deep.equal(tags);
//     expect(groupHubAccount.creationDate.toNumber()).to.be.greaterThan(0);
//     expect(groupHubAccount.lastUpdated.toNumber()).to.be.greaterThan(0);

//     log("Enhanced GroupHub metadata:", groupHubAccount.metadata);
//   });

//   it("Updates a group hub", async () => {
//     const groupHub = anchor.web3.Keypair.generate();
//     const name = "Test Group Hub";
//     const description = "A test group hub for our community engagement protocol";
  
//     await program.methods
//       .createGroupHub(name, description, null, null, null, [])
//       .accounts({
//         groupHub: groupHub.publicKey,
//         groupHubList: groupHubList.publicKey,
//         user: provider.wallet.publicKey,
//       })
//       .signers([groupHub])
//       .rpc();
  
//     log("Created GroupHub for update test with publicKey:", groupHub.publicKey.toBase58());

//     const newName = "Updated Test Group Hub";
//     const newDescription = "An updated test group hub for our community engagement protocol";
  
//     await program.methods
//       .updateGroupHub(newName, newDescription)
//       .accounts({
//         groupHub: groupHub.publicKey,
//         user: provider.wallet.publicKey,
//       })
//       .rpc();
  
//     log("Updated GroupHub with publicKey:", groupHub.publicKey.toBase58());

//     const updatedGroupHubAccount = await program.account.groupHub.fetch(groupHub.publicKey);
//     log("Updated GroupHub Account:", updatedGroupHubAccount);
//     expect(updatedGroupHubAccount.name).to.equal(newName);
//     expect(updatedGroupHubAccount.description).to.equal(newDescription);
//   });

//   it("Gets group hub info", async () => {
//     const groupHub = anchor.web3.Keypair.generate();
//     const name = "Test Group Hub";
//     const description = "A test group hub for our community engagement protocol";
  
//     await program.methods
//       .createGroupHub(name, description, null, null, null, [])
//       .accounts({
//         groupHub: groupHub.publicKey,
//         groupHubList: groupHubList.publicKey,
//         user: provider.wallet.publicKey,
//       })
//       .signers([groupHub])
//       .rpc();

//     log("Created GroupHub for get info test with publicKey:", groupHub.publicKey.toBase58());
  
//     const groupHubInfo = await program.account.groupHub.fetch(groupHub.publicKey);
//     log("GroupHub Info:", groupHubInfo);

//     expect(groupHubInfo.name).to.equal(name);
//     expect(groupHubInfo.description).to.equal(description);
//     expect(groupHubInfo.admins).to.have.lengthOf(1);
//     expect(groupHubInfo.admins[0].toString()).to.equal(provider.wallet.publicKey.toString());
//   });

//   it("Lists all group hubs", async () => {
//     // Get initial count of group hubs
//     const initialHubs = await program.account.groupHubList.fetch(groupHubList.publicKey);
//     log("Initial GroupHubs:", initialHubs);

//     const initialCount = initialHubs.groupHubs.length;
  
//     // Create multiple group hubs
//     const newHubCount = 3;
//     const hubKeys: anchor.web3.PublicKey[] = [];
//     for (let i = 0; i < newHubCount; i++) {
//       const groupHub = anchor.web3.Keypair.generate();
//       await program.methods
//         .createGroupHub(`Hub ${i+1}`, `Description for Hub ${i+1}`, null, null, null, [])
//         .accounts({
//           groupHub: groupHub.publicKey,
//           groupHubList: groupHubList.publicKey,
//           user: provider.wallet.publicKey,
//         })
//         .signers([groupHub])
//         .rpc();

//       log(`Created GroupHub ${i+1} with publicKey:`, groupHub.publicKey.toBase58());
//       hubKeys.push(groupHub.publicKey);
//     }
  
//     // List all group hubs
//     const allGroupHubs = await program.account.groupHubList.fetch(groupHubList.publicKey);
//     log("All GroupHubs:", allGroupHubs);

//     // Check that the correct number of new hubs were added
//     expect(allGroupHubs.groupHubs.length).to.equal(initialCount + newHubCount);
  
//     // Check that the new hub keys are in the list
//     hubKeys.forEach(hubKey => {
//       expect(allGroupHubs.groupHubs.some(listedKey => listedKey.equals(hubKey))).to.be.true;
//     });
//   });

//   it("Adds an admin to a group hub", async () => {
//     const groupHub = anchor.web3.Keypair.generate();
//     const name = "Test Group Hub";
//     const description = "A test group hub for our community engagement protocol";

//     await program.methods
//       .createGroupHub(name, description, null, null, null, [])
//       .accounts({
//         groupHub: groupHub.publicKey,
//         groupHubList: groupHubList.publicKey,
//         user: provider.wallet.publicKey,
//       })
//       .signers([groupHub])
//       .rpc();

//     log("Created GroupHub for add admin test with publicKey:", groupHub.publicKey.toBase58());

//     const newAdmin = anchor.web3.Keypair.generate();

//     await program.methods
//       .addAdmin(newAdmin.publicKey)
//       .accounts({
//         groupHub: groupHub.publicKey,
//         user: provider.wallet.publicKey,
//       })
//       .rpc();

//     log("Added new admin with publicKey:", newAdmin.publicKey.toBase58());

//     const updatedGroupHub = await program.account.groupHub.fetch(groupHub.publicKey);
//     log("Updated GroupHub Account after adding admin:", updatedGroupHub);
//     expect(updatedGroupHub.admins).to.have.lengthOf(2);
//     expect(updatedGroupHub.admins[1].toString()).to.equal(newAdmin.publicKey.toString());
//   });

//   it("Removes an admin from a group hub", async () => {
//     const groupHub = anchor.web3.Keypair.generate();
//     const name = "Test Group Hub";
//     const description = "A test group hub for our community engagement protocol";

//     await program.methods
//       .createGroupHub(name, description, null, null, null, [])
//       .accounts({
//         groupHub: groupHub.publicKey,
//         groupHubList: groupHubList.publicKey,
//         user: provider.wallet.publicKey,
//       })
//       .signers([groupHub])
//       .rpc();

//     log("Created GroupHub for remove admin test with publicKey:", groupHub.publicKey.toBase58());

//     const newAdmin = anchor.web3.Keypair.generate();

//     await program.methods
//       .addAdmin(newAdmin.publicKey)
//       .accounts({
//         groupHub: groupHub.publicKey,
//         user: provider.wallet.publicKey,
//       })
//       .rpc();

//     log("Added new admin with publicKey:", newAdmin.publicKey.toBase58());

//     await program.methods
//       .removeAdmin(newAdmin.publicKey)
//       .accounts({
//         groupHub: groupHub.publicKey,
//         user: provider.wallet.publicKey,
//       })
//       .rpc();

//     log("Removed admin with publicKey:", newAdmin.publicKey.toBase58());

//     const updatedGroupHub = await program.account.groupHub.fetch(groupHub.publicKey);
//     log("Updated GroupHub Account after removing admin:", updatedGroupHub);
//     expect(updatedGroupHub.admins).to.have.lengthOf(1);
//     expect(updatedGroupHub.admins[0].toString()).to.equal(provider.wallet.publicKey.toString());
//   });

//   it("Initializes user achievements", async () => {
//     const user = anchor.web3.Keypair.generate();
//     const userAchievements = anchor.web3.Keypair.generate();

//     await program.methods
//       .initializeUserAchievements()
//       .accounts({
//         userAchievements: userAchievements.publicKey,
//         user: user.publicKey,
//         authority: provider.wallet.publicKey,
//       })
//       .signers([userAchievements, user])
//       .rpc();

//     log("Initialized UserAchievements with publicKey:", userAchievements.publicKey.toBase58());

//     const userAchievementsAccount = await program.account.userAchievements.fetch(userAchievements.publicKey);
//     log("UserAchievements Account:", userAchievementsAccount);
//     expect(userAchievementsAccount.user.toString()).to.equal(user.publicKey.toString());
//     expect(userAchievementsAccount.achievements).to.be.an('array').that.is.empty;
//   });

//   it("Lists user achievements", async () => {
//     const user = anchor.web3.Keypair.generate();
//     const userAchievements = anchor.web3.Keypair.generate();

//     await program.methods
//       .initializeUserAchievements()
//       .accounts({
//         userAchievements: userAchievements.publicKey,
//         user: user.publicKey,
//         authority: provider.wallet.publicKey,
//       })
//       .signers([userAchievements, user])
//       .rpc();

//     log("Initialized UserAchievements for listing test with publicKey:", userAchievements.publicKey.toBase58());

//     // Award some achievements to the user (TODO: create these first)
//     // ... (Create group hub, achievements, and award them to the user)

//     const achievements = await program.methods
//       .listUserAchievements()
//       .accounts({
//         userAchievements: userAchievements.publicKey,
//         user: user.publicKey,
//       })
//       .view();

//     log("Listed User Achievements:", achievements);

//     expect(achievements).to.be.an('array');
//     // Add more specific checks based on the achievements you've awarded
//   });

//   it("Lists achievements for a group hub", async () => {
//     const groupHub = anchor.web3.Keypair.generate();
//     const name = "Test Group Hub";
//     const description = "A test group hub for our community engagement protocol";

//     await program.methods
//       .createGroupHub(name, description, null, null, null, [])
//       .accounts({
//         groupHub: groupHub.publicKey,
//         groupHubList: groupHubList.publicKey,
//         user: provider.wallet.publicKey,
//       })
//       .signers([groupHub])
//       .rpc();

//     log("Created GroupHub for listing achievements test with publicKey:", groupHub.publicKey.toBase58());

//     const achievementCount = 3;
//     const achievementKeys: anchor.web3.PublicKey[] = [];

//     for (let i = 0; i < achievementCount; i++) {
//       const achievement = anchor.web3.Keypair.generate();
//       await program.methods
//         .createAchievement(`Achievement ${i+1}`, `Description ${i+1}`, `Criteria ${i+1}`, 100 * (i+1))
//         .accounts({
//           groupHub: groupHub.publicKey,
//           achievement: achievement.publicKey,
//           authority: provider.wallet.publicKey,
//         })
//         .signers([achievement])
//         .rpc();

//       log(`Created Achievement ${i+1} with publicKey:`, achievement.publicKey.toBase58());
//       achievementKeys.push(achievement.publicKey);
//     }

//     const achievements = await program.methods
//       .listGroupHubAchievements()
//       .accounts({
//         groupHub: groupHub.publicKey,
//       })
//       .view();

//     log("Listed GroupHub Achievements:", achievements);

//     expect(achievements).to.have.lengthOf(achievementCount);
//     achievementKeys.forEach(key => {
//       expect(achievements.some(a => a.equals(key))).to.be.true;
//     });
//   });

//   it("Gets achievement info", async () => {
//     const groupHub = anchor.web3.Keypair.generate();
//     await program.methods
//       .createGroupHub("Test Group Hub", "A test group hub", null, null, null, [])
//       .accounts({
//         groupHub: groupHub.publicKey,
//         groupHubList: groupHubList.publicKey,
//         user: provider.wallet.publicKey,
//       })
//       .signers([groupHub])
//       .rpc();

//     log("Created GroupHub for get achievement info test with publicKey:", groupHub.publicKey.toBase58());

//     const achievement = anchor.web3.Keypair.generate();
//     const name = "Test Achievement";
//     const description = "A test achievement";
//     const criteria = "Complete the test";
//     const points = 100;

//     await program.methods
//       .createAchievement(name, description, criteria, points)
//       .accounts({
//         groupHub: groupHub.publicKey,
//         achievement: achievement.publicKey,
//         authority: provider.wallet.publicKey,
//       })
//       .signers([achievement])
//       .rpc();

//     log("Created Achievement for get info test with publicKey:", achievement.publicKey.toBase58());

//     const achievementInfo = await program.methods
//       .getAchievementInfo()
//       .accounts({
//         achievement: achievement.publicKey,
//       })
//       .view();

//     log("Achievement Info:", achievementInfo);

//     expect(achievementInfo.name).to.equal(name);
//     expect(achievementInfo.description).to.equal(description);
//     expect(achievementInfo.criteria).to.equal(criteria);
//     expect(achievementInfo.points).to.equal(points);
//     expect(achievementInfo.groupHub.toString()).to.equal(groupHub.publicKey.toString());
//     expect(achievementInfo.createdAt.toNumber()).to.be.a('number');
//     expect(achievementInfo.updatedAt.toNumber()).to.be.a('number');
//   });

//   it("Creates and awards a fungible achievement", async () => {
//     log("Starting fungible achievement test");
//     const groupHub = anchor.web3.Keypair.generate();
//     const achievement = anchor.web3.Keypair.generate();
//     const tokenMint = anchor.web3.Keypair.generate();
//     const user = anchor.web3.Keypair.generate();
//     const userAchievements = anchor.web3.Keypair.generate();
//     const userAchievement = anchor.web3.Keypair.generate();
  
//     log("Creating group hub");
//     await program.methods
//       .createGroupHub(
//         "Test Group Hub",
//         "A test group hub for fungible achievements",
//         null,
//         null,
//         null,
//         []
//       )
//       .accounts({
//         groupHub: groupHub.publicKey,
//         groupHubList: groupHubList.publicKey,
//         user: provider.wallet.publicKey,
//         systemProgram: anchor.web3.SystemProgram.programId,
//       })
//       .signers([groupHub])
//       .rpc();
//     log("Group hub created with publicKey:", groupHub.publicKey.toBase58());
  
//     log("Creating fungible achievement");
//     await program.methods
//       .createFungibleAchievement(
//         "Test Fungible Achievement",
//         "A test fungible achievement",
//         "Complete the test",
//         100,
//         new anchor.BN(1000000)
//       )
//       .accounts({
//         groupHub: groupHub.publicKey,
//         achievement: achievement.publicKey,
//         tokenMint: tokenMint.publicKey,
//         authority: provider.wallet.publicKey,
//         systemProgram: anchor.web3.SystemProgram.programId,
//         tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
//         rent: anchor.web3.SYSVAR_RENT_PUBKEY,
//       })
//       .signers([achievement, tokenMint])
//       .rpc();
//     log("Fungible achievement created with publicKey:", achievement.publicKey.toBase58());
  
//     log("Initializing user achievements");
//     await program.methods
//       .initializeUserAchievements()
//       .accounts({
//         userAchievements: userAchievements.publicKey,
//         user: user.publicKey,
//         authority: provider.wallet.publicKey,
//         systemProgram: anchor.web3.SystemProgram.programId,
//       })
//       .signers([userAchievements, user])
//       .rpc();
//     log("User achievements initialized with publicKey:", userAchievements.publicKey.toBase58());
  
//     const userTokenAccount = await anchor.utils.token.associatedAddress({
//       mint: tokenMint.publicKey,
//       owner: user.publicKey
//     });
//     log("User token account:", userTokenAccount.toBase58());
  
//     log("Awarding fungible achievement");
//     await program.methods
//       .awardFungibleAchievement()
//       .accounts({
//         groupHub: groupHub.publicKey,
//         userAchievement: userAchievement.publicKey,
//         achievement: achievement.publicKey,
//         user: user.publicKey,
//         userAchievements: userAchievements.publicKey,
//         authority: provider.wallet.publicKey,
//         // systemProgram: anchor.web3.SystemProgram.programId,
//         tokenMint: tokenMint.publicKey,
//         userTokenAccount: userTokenAccount,
//         tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
//         associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
//         rent: anchor.web3.SYSVAR_RENT_PUBKEY,
//       })
//       .signers([userAchievement])
//       .rpc();
//     log("Fungible achievement awarded");
  
//     log("Verifying award");
//     const userTokenAccountInfo = await provider.connection.getTokenAccountBalance(userTokenAccount);
//     log("User token account balance:", userTokenAccountInfo.value.uiAmount);
//     expect(userTokenAccountInfo.value.uiAmount).to.equal(1);
  
//     const updatedUserAchievements = await program.account.userAchievements.fetch(userAchievements.publicKey);
//     log("Updated user achievements:", updatedUserAchievements);
//     expect(updatedUserAchievements.achievements).to.have.lengthOf(1);
//     expect(updatedUserAchievements.achievements[0].toString()).to.equal(achievement.publicKey.toString());
    
//     log("Fungible achievement test completed successfully");
//   });
  
//   it("Creates and verifies a non-fungible achievement", async () => {
//     log("Starting non-fungible achievement test");
//     const groupHub = anchor.web3.Keypair.generate();
//     const achievement = anchor.web3.Keypair.generate();
//     const tokenMint = anchor.web3.Keypair.generate();
  
//     log("Creating group hub");
//     await program.methods
//       .createGroupHub(
//         "Test Group Hub",
//         "A test group hub for non-fungible achievements",
//         null,
//         null,
//         null,
//         []
//       )
//       .accounts({
//         groupHub: groupHub.publicKey,
//         groupHubList: groupHubList.publicKey,
//         user: provider.wallet.publicKey,
//         // systemProgram: anchor.web3.SystemProgram.programId,
//       })
//       .signers([groupHub])
//       .rpc();
//     log("Group hub created with publicKey:", groupHub.publicKey.toBase58());
  
//     const name = "Test Non-Fungible Achievement";
//     const description = "A test non-fungible achievement";
//     const criteria = "Complete the special test";
//     const points = 1000;
//     const metadataUri = "https://example.com/metadata.json";
  
//     log("Calculating PDA addresses");
//     const [metadataAccount] = anchor.web3.PublicKey.findProgramAddressSync(
//       [
//         Buffer.from("metadata"),
//         TOKEN_METADATA_PROGRAM_ID.toBuffer(),
//         tokenMint.publicKey.toBuffer(),
//       ],
//       TOKEN_METADATA_PROGRAM_ID
//     );
//     log("Metadata account:", metadataAccount.toBase58());
  
//     const [masterEditionAccount] = anchor.web3.PublicKey.findProgramAddressSync(
//       [
//         Buffer.from("metadata"),
//         TOKEN_METADATA_PROGRAM_ID.toBuffer(),
//         tokenMint.publicKey.toBuffer(),
//         Buffer.from("edition"),
//       ],
//       TOKEN_METADATA_PROGRAM_ID
//     );
//     log("Master edition account:", masterEditionAccount.toBase58());
  
//     const tokenAccount = await anchor.utils.token.associatedAddress({
//       mint: tokenMint.publicKey,
//       owner: provider.wallet.publicKey,
//     });
//     log("Token account:", tokenAccount.toBase58());

//     log("Accounts being passed to create_non_fungible_achievement:");
//     log("Achievement:", achievement.publicKey.toBase58());
//     log("Token Mint:", tokenMint.publicKey.toBase58());
//     log("Authority:", provider.wallet.publicKey.toBase58());
  
//     log("Creating non-fungible achievement");
//     try {
//       await program.methods
//         .createNonFungibleAchievement(
//           name,
//           description,
//           criteria,
//           points,
//           metadataUri
//         )
//         .accounts({
//           groupHub: groupHub.publicKey,
//           achievement: achievement.publicKey,
//           tokenMint: tokenMint.publicKey,
//           tokenAccount: tokenAccount,
//           metadataAccount: metadataAccount,
//           masterEditionAccount: masterEditionAccount,
//           authority: provider.wallet.publicKey,
//           // systemProgram: anchor.web3.SystemProgram.programId,
//           tokenProgram: TOKEN_PROGRAM_ID,
//           associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//           tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
//           rent: anchor.web3.SYSVAR_RENT_PUBKEY,
//         })
//         .signers([achievement, tokenMint])
//         .rpc();
//       log("Non-fungible achievement created with publicKey:", achievement.publicKey.toBase58());
//     } catch (error) {
//       log("Error creating non-fungible achievement:", error);
//       throw error;
//     }
  
//     log("Verifying non-fungible achievement");
//     const achievementAccount = await program.account.achievement.fetch(achievement.publicKey);
//     log("Achievement account:", achievementAccount);
//     expect(achievementAccount.name).to.equal(name);
//     expect(achievementAccount.description).to.equal(description);
//     expect(achievementAccount.criteria).to.equal(criteria);
//     expect(achievementAccount.points).to.equal(points);
//     expect(achievementAccount.achievementType).to.deep.equal({ nonFungible: {} });
//     expect(achievementAccount.tokenMint.toString()).to.equal(tokenMint.publicKey.toString());
//     expect(achievementAccount.tokenSupply.toString()).to.equal("1");
//     expect(achievementAccount.metadataUri).to.equal(metadataUri);
  
//     log("Verifying metadata account");
//     const metadataAccountInfo = await provider.connection.getAccountInfo(metadataAccount);
//     log("Metadata account info:", metadataAccountInfo);
//     expect(metadataAccountInfo).to.not.be.null;
  
//     log("Verifying master edition account");
//     const masterEditionAccountInfo = await provider.connection.getAccountInfo(masterEditionAccount);
//     log("Master edition account info:", masterEditionAccountInfo);
//     expect(masterEditionAccountInfo).to.not.be.null;
  
//     log("Verifying token account");
//     const tokenAccountInfo = await provider.connection.getAccountInfo(tokenAccount);
//     log("Token account info:", tokenAccountInfo);
//     expect(tokenAccountInfo).to.not.be.null;
  
//     // Check the token balance
//     const tokenBalance = await provider.connection.getTokenAccountBalance(tokenAccount);
//     log("Token balance:", tokenBalance.value.uiAmount);
//     expect(tokenBalance.value.uiAmount).to.equal(1);
  
//     log("Non-fungible achievement created and verified successfully");
//   });
  

// });
