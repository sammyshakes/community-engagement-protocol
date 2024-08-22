// tests/brand_tests.ts
import { expect } from 'chai';
import * as anchor from "@coral-xyz/anchor";
import { 
  program, 
  provider, 
  brandList,
  createUniqueBrand, 
  initializeProgramState,
  initializeBrandList,
  fundAccount,
  log, 
  TRONIC_ADMIN_KEYPAIR, 
  TRONIC_ADMIN_PUBKEY 
} from './common';

describe("Brand Tests", () => {
  before(initializeProgramState);
  before(initializeBrandList);
  fundAccount(program.provider.connection, TRONIC_ADMIN_PUBKEY)

  it("Creates a brand", async () => {
    const name = "Test Brand";
    const description = "A test brand for our community engagement protocol";
  
    const [programStatePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("program-state")],
      program.programId
    );
  
    log("Program State PDA:", programStatePda.toBase58());
    log("Tronic Admin Public Key:", TRONIC_ADMIN_PUBKEY.toBase58());

    const [brandPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("brand"), Buffer.from(name)],
      program.programId
    );
  
    const tx = await program.methods
      .createBrand(name, description, null, null, null, [])
      .accounts({
        brandList: brandList.publicKey,
        tronicAdmin: TRONIC_ADMIN_PUBKEY,
      })
      .signers([TRONIC_ADMIN_KEYPAIR])
      .rpc();

    log("Transaction signature:", tx);

    // Fetch the logs from the transaction
    const txInfo = await provider.connection.getTransaction(tx, { commitment: 'confirmed' });
    log("Transaction logs:", txInfo?.meta?.logMessages);

    const brandAccount = await program.account.brand.fetch(brandPda);
    log("Created Brand Account:", brandAccount);

    expect(brandAccount.name).to.equal(name);
    expect(brandAccount.description).to.equal(description);
    expect(brandAccount.creationDate.toNumber()).to.be.greaterThan(0);
  });

  it("Creates a brand with enhanced metadata", async () => {
    const name = "Enhanced Test Brand";
    const description = "A test brand with enhanced metadata";
    const website = "https://testhub.com";
    const socialMedia = "@testhub";
    const category = "Technology";
    const tags = ["test", "community", "engagement"];

    const [brandPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("brand"), Buffer.from(name)],
      program.programId
    );

    await program.methods
      .createBrand(name, description, website, socialMedia, category, tags)
      .accounts({
        brandList: brandList.publicKey,
        tronicAdmin: TRONIC_ADMIN_PUBKEY,
      })
      .signers([TRONIC_ADMIN_KEYPAIR])
      .rpc();

    log("Created Enhanced Brand with brandPda:", brandPda);

    const brandAccount = await program.account.brand.fetch(brandPda);
    log("Enhanced Brand Account:", brandAccount);
    
    expect(brandAccount.name).to.equal(name);
    expect(brandAccount.description).to.equal(description);
    expect(brandAccount.metadata.website).to.equal(website);
    expect(brandAccount.metadata.socialMedia).to.equal(socialMedia);
    expect(brandAccount.metadata.category).to.equal(category);
    expect(brandAccount.metadata.tags).to.deep.equal(tags);
    expect(brandAccount.creationDate.toNumber()).to.be.greaterThan(0);
    expect(brandAccount.lastUpdated.toNumber()).to.be.greaterThan(0);

    log("Enhanced Brand metadata:", brandAccount.metadata);
  });

  it("Updates a brand", async () => {
    const brandPda = await createUniqueBrand();
    log("Created Brand for update test with publicKey:", brandPda);

    const newName = "Updated Test Brand";
    const newDescription = "An updated test brand for our community engagement protocol";
  
    await program.methods
      .updateBrand(newName, newDescription)
      .accounts({
        brand: brandPda,
      })
      .signers([TRONIC_ADMIN_KEYPAIR])
      .rpc();
  
    log("Updated Brand with publicKey:", brandPda);

    const updatedBrandAccount = await program.account.brand.fetch(brandPda);
    log("Updated Brand Account:", updatedBrandAccount);
    expect(updatedBrandAccount.name).to.equal(newName);
    expect(updatedBrandAccount.description).to.equal(newDescription);
  });

  it("Gets brand info", async () => {
    const name = "Test Brand 2";
    const description = "A test brand for our community engagement protocol";
  
    const [brandPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("brand"), Buffer.from(name)],
      program.programId
    );

    await program.methods
      .createBrand(name, description, null, null, null, [])
      .accounts({
        brandList: brandList.publicKey,
      })
      .signers([TRONIC_ADMIN_KEYPAIR])
      .rpc();

    log("Created Brand for get info test with publicKey:", brandPda);
  
    const brandInfo = await program.account.brand.fetch(brandPda);
    log("Brand Info:", brandInfo);

    expect(brandInfo.name).to.equal(name);
    expect(brandInfo.description).to.equal(description);
  });

  it("Lists all brands", async () => {
    // Get initial count of brands
    const initialHubs = await program.account.brandList.fetch(brandList.publicKey);
    log("Initial Brands:", initialHubs);

    const initialCount = initialHubs.brands.length;
  
    // Create multiple brands
    const newHubCount = 3;
    const hubKeys: anchor.web3.PublicKey[] = [];
    for (let i = 0; i < newHubCount; i++) {
      const brandPda = await createUniqueBrand();
      log(`Created Brand with publicKey:`, brandPda);
      hubKeys.push(brandPda);
    }
  
    // List all brands
    const allBrands = await program.account.brandList.fetch(brandList.publicKey);
    log("All Brands:", allBrands);

    // Check that the correct number of new hubs were added
    expect(allBrands.brands.length).to.equal(initialCount + newHubCount);
  
    // Check that the new hub keys are in the list
    hubKeys.forEach(hubKey => {
      expect(allBrands.brands.some(listedKey => listedKey.equals(hubKey))).to.be.true;
    });
  });

  it("Fails to create a brand with non-admin signer", async () => {
    const name = "Test Brand 4";
    const description = "A test brand for our community engagement protocol";
    const nonAdminKeypair = anchor.web3.Keypair.generate();

    // Fund the non-admin account
    await fundAccount(program.provider.connection, nonAdminKeypair.publicKey);

    const [programStatePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("program-state")],
      program.programId
    );

    log("Program State PDA:", programStatePda.toBase58());
    log("Non-admin Public Key:", nonAdminKeypair.publicKey.toBase58());
    log("Actual Tronic Admin Public Key:", TRONIC_ADMIN_PUBKEY.toBase58());

    // Fund the non-admin account
    const connection = program.provider.connection;
    const airdropSignature = await connection.requestAirdrop(nonAdminKeypair.publicKey, 1000000000);
    await connection.confirmTransaction(airdropSignature);

    try {
      const tx = await program.methods
        .createBrand(name, description, null, null, null, [])
        .accounts({
          brandList: brandList.publicKey,
          tronicAdmin: nonAdminKeypair.publicKey,
        })
        .signers([nonAdminKeypair])
        .rpc();

      log("Transaction signature (unexpected success):", tx);
      expect.fail("Expected an error but none was thrown");
    } catch (error) {
      log("Error caught:", error.message);
      
      // Check if the error is due to unauthorized access, not insufficient funds
      if (error.message.includes("custom program error: 0x1")) {
        // Fetch the logs to see if our custom error message is there
        const logs = error?.logs || [];
        log("Transaction logs:", logs);
        
        const unauthorizedLog = logs.find(log => log.includes("Unauthorized: Signer is not the Tronic Admin"));
        if (unauthorizedLog) {
          log("Found unauthorized log:", unauthorizedLog);
        } else {
          expect.fail("Expected to find 'Unauthorized: Signer is not the Tronic Admin' in logs, but it was not present");
        }
      } else {
        expect(error.message).to.include("Error Code: UnauthorizedTronicAdmin");
      }
    }
  });

  it("Fails to update a brand with non-admin signer", async () => {
    // First, create a brand with the Tronic Admin
    const brandName = "Original Brand 1";
    const [brandPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("brand"), Buffer.from(brandName)],
      program.programId
    );
  
    await program.methods
      .createBrand(brandName, "Original description", null, null, null, [])
      .accounts({
        brandList: brandList.publicKey,
        tronicAdmin: TRONIC_ADMIN_PUBKEY,
      })
      .signers([TRONIC_ADMIN_KEYPAIR])
      .rpc();
  
    // Now try to update the brand with a non-admin signer
    const nonAdminKeypair = anchor.web3.Keypair.generate();
    
    // Fund the non-admin account
    await fundAccount(program.provider.connection, nonAdminKeypair.publicKey);
  
    try {
      await program.methods
        .updateBrand("Updated Brand", "Updated description")
        .accounts({
          brand: brandPda,
          tronicAdmin: nonAdminKeypair.publicKey,
        })
        .signers([nonAdminKeypair])
        .rpc();
  
      expect.fail("Expected an error but none was thrown");
    } catch (error) {
      log("Error caught:", error.message);
      expect(error.message).to.include("Error Code: UnauthorizedTronicAdmin");
    }
  
    // Verify the brand wasn't updated
    const brandAccount = await program.account.brand.fetch(brandPda);
    expect(brandAccount.name).to.equal(brandName);
    expect(brandAccount.description).to.equal("Original description");
  });
});