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
});