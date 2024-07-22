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
    expect(groupHubAccount.admin.toString()).to.equal(provider.wallet.publicKey.toString());
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

    // First, create the group hub
    await program.methods
      .createGroupHub(name, description)
      .accounts({
        groupHub: groupHub.publicKey,
        user: provider.wallet.publicKey,
      })
      .signers([groupHub])
      .rpc();

    // Now, update the group hub
    const newName = "Updated Test Group Hub";
    const newDescription = "An updated test group hub for our community engagement protocol";

    await program.methods
      .updateGroupHub(newName, newDescription)
      .accounts({
        groupHub: groupHub.publicKey,
        user: provider.wallet.publicKey,
      })
      .rpc();

    // Fetch the updated group hub account
    const updatedGroupHubAccount = await program.account.groupHub.fetch(groupHub.publicKey);
    expect(updatedGroupHubAccount.name).to.equal(newName);
    expect(updatedGroupHubAccount.description).to.equal(newDescription);
    expect(updatedGroupHubAccount.admin.toString()).to.equal(provider.wallet.publicKey.toString());
  });

  it("Fails to update a group hub with an unauthorized user", async () => {
    const groupHub = anchor.web3.Keypair.generate();
    const name = "Test Group Hub";
    const description = "A test group hub for our community engagement protocol";

    // First, create the group hub
    await program.methods
      .createGroupHub(name, description)
      .accounts({
        groupHub: groupHub.publicKey,
        user: provider.wallet.publicKey,
      })
      .signers([groupHub])
      .rpc();

    // Create a new user
    const unauthorizedUser = anchor.web3.Keypair.generate();

    // Try to update the group hub with the unauthorized user
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

    // First, create the group hub
    await program.methods
      .createGroupHub(name, description)
      .accounts({
        groupHub: groupHub.publicKey,
        user: provider.wallet.publicKey,
      })
      .signers([groupHub])
      .rpc();

    // Now, get the group hub info
    await program.methods
      .getGroupHubInfo()
      .accounts({
        groupHub: groupHub.publicKey,
      })
      .rpc();

    // Fetch the group hub account and verify its contents
    const groupHubAccount = await program.account.groupHub.fetch(groupHub.publicKey);
    expect(groupHubAccount.name).to.equal(name);
    expect(groupHubAccount.description).to.equal(description);
    expect(groupHubAccount.admin.toString()).to.equal(provider.wallet.publicKey.toString());
  });
});