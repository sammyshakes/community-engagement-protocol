import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CommunityEngagementProtocol } from "../target/types/community_engagement_protocol";
import { expect } from 'chai';

describe("community-engagement-protocol", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.CommunityEngagementProtocol as Program<CommunityEngagementProtocol>;

  it("Creates a group hub", async () => {
    const groupHub = anchor.web3.Keypair.generate();
    const name = "Test Group Hub";
    const description = "A test group hub for our community engagement protocol";

    await program.methods
      .createGroupHub(name, description)
      .accounts({
        groupHub: groupHub.publicKey,
        user: provider.wallet.publicKey,
      })
      .signers([groupHub])
      .rpc();

    const groupHubAccount = await program.account.groupHub.fetch(groupHub.publicKey);
    expect(groupHubAccount.name).to.equal(name);
    expect(groupHubAccount.description).to.equal(description);
    expect(groupHubAccount.admins[0].toString()).to.equal(provider.wallet.publicKey.toString());
  });

  it("Fails to create a group hub with a long name", async () => {
    const groupHub = anchor.web3.Keypair.generate();
    const name = "A".repeat(51); // 51 characters
    const description = "A test group hub";

    try {
      await program.methods
        .createGroupHub(name, description)
        .accounts({
          groupHub: groupHub.publicKey,
          user: provider.wallet.publicKey,
        })
        .signers([groupHub])
        .rpc();
      expect.fail("The transaction should have failed");
    } catch (error) {
      expect(error.error.errorMessage).to.equal("Group Hub name must be 50 characters or less");
    }
  });

  it("Updates a group hub", async () => {
    const groupHub = anchor.web3.Keypair.generate();
    const name = "Test Group Hub";
    const description = "A test group hub for our community engagement protocol";
  
    await program.methods
      .createGroupHub(name, description)
      .accounts({
        groupHub: groupHub.publicKey,
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
    expect(updatedGroupHubAccount.admins).to.have.lengthOf(1);
    expect(updatedGroupHubAccount.admins[0].toString()).to.equal(provider.wallet.publicKey.toString());
  });

  it("Fails to update a group hub with an unauthorized user", async () => {
    const groupHub = anchor.web3.Keypair.generate();
    const name = "Test Group Hub";
    const description = "A test group hub for our community engagement protocol";

    await program.methods
      .createGroupHub(name, description)
      .accounts({
        groupHub: groupHub.publicKey,
        user: provider.wallet.publicKey,
      })
      .signers([groupHub])
      .rpc();

    const unauthorizedUser = anchor.web3.Keypair.generate();

    try {
      await program.methods
        .updateGroupHub("New Name", "New Description")
        .accounts({
          groupHub: groupHub.publicKey,
          user: unauthorizedUser.publicKey,
        })
        .signers([unauthorizedUser])
        .rpc();
      expect.fail("The transaction should have failed");
    } catch (error) {
      expect(error.error.errorMessage).to.equal("You are not authorized to perform this action");
    }
  });

  it("Gets group hub info", async () => {
    const groupHub = anchor.web3.Keypair.generate();
    const name = "Test Group Hub";
    const description = "A test group hub for our community engagement protocol";
  
    await program.methods
      .createGroupHub(name, description)
      .accounts({
        groupHub: groupHub.publicKey,
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

  it("Adds an admin to a group hub", async () => {
    const groupHub = anchor.web3.Keypair.generate();
    const name = "Test Group Hub";
    const description = "A test group hub for our community engagement protocol";

    await program.methods
      .createGroupHub(name, description)
      .accounts({
        groupHub: groupHub.publicKey,
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

  it("Fails to add an admin with unauthorized user", async () => {
    const groupHub = anchor.web3.Keypair.generate();
    const name = "Test Group Hub";
    const description = "A test group hub for our community engagement protocol";

    await program.methods
      .createGroupHub(name, description)
      .accounts({
        groupHub: groupHub.publicKey,
        user: provider.wallet.publicKey,
      })
      .signers([groupHub])
      .rpc();

    const unauthorizedUser = anchor.web3.Keypair.generate();
    const newAdmin = anchor.web3.Keypair.generate();

    try {
      await program.methods
        .addAdmin(newAdmin.publicKey)
        .accounts({
          groupHub: groupHub.publicKey,
          user: unauthorizedUser.publicKey,
        })
        .signers([unauthorizedUser])
        .rpc();
      expect.fail("The transaction should have failed");
    } catch (error) {
      expect(error.error.errorMessage).to.equal("You are not authorized to perform this action");
    }
  });

  it("Removes an admin from a group hub", async () => {
    const groupHub = anchor.web3.Keypair.generate();
    const name = "Test Group Hub";
    const description = "A test group hub for our community engagement protocol";

    await program.methods
      .createGroupHub(name, description)
      .accounts({
        groupHub: groupHub.publicKey,
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

it("Fails to remove the last admin from a group hub", async () => {
    const groupHub = anchor.web3.Keypair.generate();
    const name = "Test Group Hub";
    const description = "A test group hub for our community engagement protocol";

    await program.methods
      .createGroupHub(name, description)
      .accounts({
        groupHub: groupHub.publicKey,
        user: provider.wallet.publicKey,
      })
      .signers([groupHub])
      .rpc();

    try {
      await program.methods
        .removeAdmin(provider.wallet.publicKey)
        .accounts({
          groupHub: groupHub.publicKey,
          user: provider.wallet.publicKey,
        })
        .rpc();
      expect.fail("The transaction should have failed");
    } catch (error) {
      expect(error.error.errorMessage).to.equal("Cannot remove the last admin from the group hub");
    }
});
});