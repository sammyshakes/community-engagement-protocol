// tests/group_hub_tests.ts
import { expect } from 'chai';
import * as anchor from "@coral-xyz/anchor";
import { program, provider, groupHubList, initializeGroupHubList, log } from './common';

describe("Group Hub Tests", () => {
  before(initializeGroupHubList);

  it("Creates a group hub", async () => {
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

    log("Created GroupHub with publicKey:", groupHub.publicKey.toBase58());

    const groupHubAccount = await program.account.groupHub.fetch(groupHub.publicKey);
    log("GroupHub Account:", groupHubAccount);
    expect(groupHubAccount.name).to.equal(name);
    expect(groupHubAccount.description).to.equal(description);
    expect(groupHubAccount.admins[0].toString()).to.equal(provider.wallet.publicKey.toString());
  });

  it("Creates a group hub", async () => {
    const groupHub = anchor.web3.Keypair.generate();
    const name = "Test Group Hub";
    const description = "A test group hub for our community engagement protocol";

    await program.methods
      .createGroupHub(
        name, 
        description,
        null,  // website
        null,  // social_media
        null,  // category
        []     // tags
      )
      .accounts({
        groupHub: groupHub.publicKey,
        groupHubList: groupHubList.publicKey,
        user: provider.wallet.publicKey,
      })
      .signers([groupHub])
      .rpc();

    log("Created GroupHub with publicKey:", groupHub.publicKey.toBase58());

    const groupHubAccount = await program.account.groupHub.fetch(groupHub.publicKey);
    log("GroupHub Account:", groupHubAccount);
    expect(groupHubAccount.name).to.equal(name);
    expect(groupHubAccount.description).to.equal(description);
    expect(groupHubAccount.admins[0].toString()).to.equal(provider.wallet.publicKey.toString());
  });

  it("Creates a group hub with enhanced metadata", async () => {
    const groupHub = anchor.web3.Keypair.generate();
    const name = "Enhanced Test Group Hub";
    const description = "A test group hub with enhanced metadata";
    const website = "https://testhub.com";
    const socialMedia = "@testhub";
    const category = "Technology";
    const tags = ["test", "community", "engagement"];

    await program.methods
      .createGroupHub(name, description, website, socialMedia, category, tags)
      .accounts({
        groupHub: groupHub.publicKey,
        groupHubList: groupHubList.publicKey,
        user: provider.wallet.publicKey,
      })
      .signers([groupHub])
      .rpc();

    log("Created Enhanced GroupHub with publicKey:", groupHub.publicKey.toBase58());

    const groupHubAccount = await program.account.groupHub.fetch(groupHub.publicKey);
    log("Enhanced GroupHub Account:", groupHubAccount);
    
    expect(groupHubAccount.name).to.equal(name);
    expect(groupHubAccount.description).to.equal(description);
    expect(groupHubAccount.admins[0].toString()).to.equal(provider.wallet.publicKey.toString());
    expect(groupHubAccount.metadata.website).to.equal(website);
    expect(groupHubAccount.metadata.socialMedia).to.equal(socialMedia);
    expect(groupHubAccount.metadata.category).to.equal(category);
    expect(groupHubAccount.metadata.tags).to.deep.equal(tags);
    expect(groupHubAccount.creationDate.toNumber()).to.be.greaterThan(0);
    expect(groupHubAccount.lastUpdated.toNumber()).to.be.greaterThan(0);

    log("Enhanced GroupHub metadata:", groupHubAccount.metadata);
  });

  it("Updates a group hub", async () => {
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
  
    log("Created GroupHub for update test with publicKey:", groupHub.publicKey.toBase58());

    const newName = "Updated Test Group Hub";
    const newDescription = "An updated test group hub for our community engagement protocol";
  
    await program.methods
      .updateGroupHub(newName, newDescription)
      .accounts({
        groupHub: groupHub.publicKey,
        user: provider.wallet.publicKey,
      })
      .rpc();
  
    log("Updated GroupHub with publicKey:", groupHub.publicKey.toBase58());

    const updatedGroupHubAccount = await program.account.groupHub.fetch(groupHub.publicKey);
    log("Updated GroupHub Account:", updatedGroupHubAccount);
    expect(updatedGroupHubAccount.name).to.equal(newName);
    expect(updatedGroupHubAccount.description).to.equal(newDescription);
  });

  it("Gets group hub info", async () => {
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

    log("Created GroupHub for get info test with publicKey:", groupHub.publicKey.toBase58());
  
    const groupHubInfo = await program.account.groupHub.fetch(groupHub.publicKey);
    log("GroupHub Info:", groupHubInfo);

    expect(groupHubInfo.name).to.equal(name);
    expect(groupHubInfo.description).to.equal(description);
    expect(groupHubInfo.admins).to.have.lengthOf(1);
    expect(groupHubInfo.admins[0].toString()).to.equal(provider.wallet.publicKey.toString());
  });

  it("Lists all group hubs", async () => {
    // Get initial count of group hubs
    const initialHubs = await program.account.groupHubList.fetch(groupHubList.publicKey);
    log("Initial GroupHubs:", initialHubs);

    const initialCount = initialHubs.groupHubs.length;
  
    // Create multiple group hubs
    const newHubCount = 3;
    const hubKeys: anchor.web3.PublicKey[] = [];
    for (let i = 0; i < newHubCount; i++) {
      const groupHub = anchor.web3.Keypair.generate();
      await program.methods
        .createGroupHub(`Hub ${i+1}`, `Description for Hub ${i+1}`, null, null, null, [])
        .accounts({
          groupHub: groupHub.publicKey,
          groupHubList: groupHubList.publicKey,
          user: provider.wallet.publicKey,
        })
        .signers([groupHub])
        .rpc();

      log(`Created GroupHub ${i+1} with publicKey:`, groupHub.publicKey.toBase58());
      hubKeys.push(groupHub.publicKey);
    }
  
    // List all group hubs
    const allGroupHubs = await program.account.groupHubList.fetch(groupHubList.publicKey);
    log("All GroupHubs:", allGroupHubs);

    // Check that the correct number of new hubs were added
    expect(allGroupHubs.groupHubs.length).to.equal(initialCount + newHubCount);
  
    // Check that the new hub keys are in the list
    hubKeys.forEach(hubKey => {
      expect(allGroupHubs.groupHubs.some(listedKey => listedKey.equals(hubKey))).to.be.true;
    });
  });

  it("Adds an admin to a group hub", async () => {
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

    log("Created GroupHub for add admin test with publicKey:", groupHub.publicKey.toBase58());

    const newAdmin = anchor.web3.Keypair.generate();

    await program.methods
      .addAdmin(newAdmin.publicKey)
      .accounts({
        groupHub: groupHub.publicKey,
        user: provider.wallet.publicKey,
      })
      .rpc();

    log("Added new admin with publicKey:", newAdmin.publicKey.toBase58());

    const updatedGroupHub = await program.account.groupHub.fetch(groupHub.publicKey);
    log("Updated GroupHub Account after adding admin:", updatedGroupHub);
    expect(updatedGroupHub.admins).to.have.lengthOf(2);
    expect(updatedGroupHub.admins[1].toString()).to.equal(newAdmin.publicKey.toString());
  });

  it("Removes an admin from a group hub", async () => {
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

    log("Created GroupHub for remove admin test with publicKey:", groupHub.publicKey.toBase58());

    const newAdmin = anchor.web3.Keypair.generate();

    await program.methods
      .addAdmin(newAdmin.publicKey)
      .accounts({
        groupHub: groupHub.publicKey,
        user: provider.wallet.publicKey,
      })
      .rpc();

    log("Added new admin with publicKey:", newAdmin.publicKey.toBase58());

    await program.methods
      .removeAdmin(newAdmin.publicKey)
      .accounts({
        groupHub: groupHub.publicKey,
        user: provider.wallet.publicKey,
      })
      .rpc();

    log("Removed admin with publicKey:", newAdmin.publicKey.toBase58());

    const updatedGroupHub = await program.account.groupHub.fetch(groupHub.publicKey);
    log("Updated GroupHub Account after removing admin:", updatedGroupHub);
    expect(updatedGroupHub.admins).to.have.lengthOf(1);
    expect(updatedGroupHub.admins[0].toString()).to.equal(provider.wallet.publicKey.toString());
  });
});