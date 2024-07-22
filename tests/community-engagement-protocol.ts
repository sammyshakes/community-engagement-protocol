import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CommunityEngagementProtocol } from "../target/types/community_engagement_protocol";
import { expect } from 'chai';

describe("community-engagement-protocol", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.CommunityEngagementProtocol as Program<CommunityEngagementProtocol>;

  let groupHubList: anchor.web3.Keypair;

  before(async () => {
    groupHubList = anchor.web3.Keypair.generate();
    
    // Initialize the GroupHubList account
    await program.methods
      .initializeGroupHubList()
      .accounts({
        groupHubList: groupHubList.publicKey,
        user: provider.wallet.publicKey,
      })
      .signers([groupHubList])
      .rpc();
  });

  it("Creates a group hub", async () => {
    const groupHub = anchor.web3.Keypair.generate();
    const name = "Test Group Hub";
    const description = "A test group hub for our community engagement protocol";

    await program.methods
      .createGroupHub(name, description)
      .accounts({
        groupHub: groupHub.publicKey,
        groupHubList: groupHubList.publicKey,
        user: provider.wallet.publicKey,
      })
      .signers([groupHub])
      .rpc();

    const groupHubAccount = await program.account.groupHub.fetch(groupHub.publicKey);
    expect(groupHubAccount.name).to.equal(name);
    expect(groupHubAccount.description).to.equal(description);
    expect(groupHubAccount.admins[0].toString()).to.equal(provider.wallet.publicKey.toString());
  });

  it("Updates a group hub", async () => {
    const groupHub = anchor.web3.Keypair.generate();
    const name = "Test Group Hub";
    const description = "A test group hub for our community engagement protocol";
  
    await program.methods
      .createGroupHub(name, description)
      .accounts({
        groupHub: groupHub.publicKey,
        groupHubList: groupHubList.publicKey,
        user: provider.wallet.publicKey,
      })
      .signers([groupHub])
      .rpc();
  
    const newName = "Updated Test Group Hub";
    const newDescription = "An updated test group hub for our community engagement protocol";
  
    await program.methods
      .updateGroupHub(newName, newDescription)
      .accounts({
        groupHub: groupHub.publicKey,
        user: provider.wallet.publicKey,
      })
      .rpc();
  
    const updatedGroupHubAccount = await program.account.groupHub.fetch(groupHub.publicKey);
    expect(updatedGroupHubAccount.name).to.equal(newName);
    expect(updatedGroupHubAccount.description).to.equal(newDescription);
  });

  it("Gets group hub info", async () => {
    const groupHub = anchor.web3.Keypair.generate();
    const name = "Test Group Hub";
    const description = "A test group hub for our community engagement protocol";
  
    await program.methods
      .createGroupHub(name, description)
      .accounts({
        groupHub: groupHub.publicKey,
        groupHubList: groupHubList.publicKey,
        user: provider.wallet.publicKey,
      })
      .signers([groupHub])
      .rpc();
  
    const groupHubInfo = await program.methods
      .getGroupHubInfo()
      .accounts({
        groupHub: groupHub.publicKey,
      })
      .view();
  
    expect(groupHubInfo.name).to.equal(name);
    expect(groupHubInfo.description).to.equal(description);
    expect(groupHubInfo.admins).to.have.lengthOf(1);
    expect(groupHubInfo.admins[0].toString()).to.equal(provider.wallet.publicKey.toString());
  });

  it("Lists all group hubs", async () => {
    // Get initial count of group hubs
    const initialHubs = await program.methods
      .listAllGroupHubs()
      .accounts({
        groupHubList: groupHubList.publicKey,
      })
      .view();
  
    const initialCount = initialHubs.length;
  
    // Create multiple group hubs
    const newHubCount = 3;
    const hubKeys: anchor.web3.PublicKey[] = [];
    for (let i = 0; i < newHubCount; i++) {
      const groupHub = anchor.web3.Keypair.generate();
      await program.methods
        .createGroupHub(`Hub ${i+1}`, `Description for Hub ${i+1}`)
        .accounts({
          groupHub: groupHub.publicKey,
          groupHubList: groupHubList.publicKey,
          user: provider.wallet.publicKey,
        })
        .signers([groupHub])
        .rpc();
      hubKeys.push(groupHub.publicKey);
    }
  
    // List all group hubs
    const allGroupHubs = await program.methods
      .listAllGroupHubs()
      .accounts({
        groupHubList: groupHubList.publicKey,
      })
      .view();
  
    // Check that the correct number of new hubs were added
    expect(allGroupHubs.length).to.equal(initialCount + newHubCount);
  
    // Check that the new hub keys are in the list
    hubKeys.forEach(hubKey => {
      expect(allGroupHubs.some(listedKey => listedKey.equals(hubKey))).to.be.true;
    });
  });

  it("Adds an admin to a group hub", async () => {
    const groupHub = anchor.web3.Keypair.generate();
    const name = "Test Group Hub";
    const description = "A test group hub for our community engagement protocol";

    await program.methods
      .createGroupHub(name, description)
      .accounts({
        groupHub: groupHub.publicKey,
        groupHubList: groupHubList.publicKey,
        user: provider.wallet.publicKey,
      })
      .signers([groupHub])
      .rpc();

    const newAdmin = anchor.web3.Keypair.generate();

    await program.methods
      .addAdmin(newAdmin.publicKey)
      .accounts({
        groupHub: groupHub.publicKey,
        user: provider.wallet.publicKey,
      })
      .rpc();

    const updatedGroupHub = await program.account.groupHub.fetch(groupHub.publicKey);
    expect(updatedGroupHub.admins).to.have.lengthOf(2);
    expect(updatedGroupHub.admins[1].toString()).to.equal(newAdmin.publicKey.toString());
  });

  it("Removes an admin from a group hub", async () => {
    const groupHub = anchor.web3.Keypair.generate();
    const name = "Test Group Hub";
    const description = "A test group hub for our community engagement protocol";

    await program.methods
      .createGroupHub(name, description)
      .accounts({
        groupHub: groupHub.publicKey,
        groupHubList: groupHubList.publicKey,
        user: provider.wallet.publicKey,
      })
      .signers([groupHub])
      .rpc();

    const newAdmin = anchor.web3.Keypair.generate();

    await program.methods
      .addAdmin(newAdmin.publicKey)
      .accounts({
        groupHub: groupHub.publicKey,
        user: provider.wallet.publicKey,
      })
      .rpc();

    await program.methods
      .removeAdmin(newAdmin.publicKey)
      .accounts({
        groupHub: groupHub.publicKey,
        user: provider.wallet.publicKey,
      })
      .rpc();

    const updatedGroupHub = await program.account.groupHub.fetch(groupHub.publicKey);
    expect(updatedGroupHub.admins).to.have.lengthOf(1);
    expect(updatedGroupHub.admins[0].toString()).to.equal(provider.wallet.publicKey.toString());
  });
});