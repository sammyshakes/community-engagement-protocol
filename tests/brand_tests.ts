// tests/brand_tests.ts
import { expect } from 'chai';
import * as anchor from "@coral-xyz/anchor";
import { 
  program, 
  provider, 
  brandList, 
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
    const brand = anchor.web3.Keypair.generate();
    const name = "Test Brand";
    const description = "A test brand for our community engagement protocol";
  
    const [programStatePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("program-state")],
      program.programId
    );
  
    console.log("Program State PDA:", programStatePda.toBase58());
    console.log("Tronic Admin Public Key:", TRONIC_ADMIN_PUBKEY.toBase58());
  
    try {
      const tx = await program.methods
        .createBrand(name, description, null, null, null, [])
        .accounts({
          brand: brand.publicKey,
          brandList: brandList.publicKey,
          tronicAdmin: TRONIC_ADMIN_PUBKEY,
          // Commenting out programState to see if it still works
          // programState: programStatePda,
        })
        .signers([brand, TRONIC_ADMIN_KEYPAIR])
        .rpc();
  
      console.log("Transaction signature:", tx);
  
      // Fetch the logs from the transaction
      const txInfo = await provider.connection.getTransaction(tx, { commitment: 'confirmed' });
      console.log("Transaction logs:", txInfo?.meta?.logMessages);
  
      const brandAccount = await program.account.brand.fetch(brand.publicKey);
      console.log("Created Brand Account:", brandAccount);
  
      expect(brandAccount.name).to.equal(name);
      expect(brandAccount.description).to.equal(description);
    } catch (error) {
      console.error("Error creating brand:", error);
      throw error;
    }
  });

  it("Creates a brand with enhanced metadata", async () => {
    const brand = anchor.web3.Keypair.generate();
    const name = "Enhanced Test Brand";
    const description = "A test brand with enhanced metadata";
    const website = "https://testhub.com";
    const socialMedia = "@testhub";
    const category = "Technology";
    const tags = ["test", "community", "engagement"];

    await program.methods
      .createBrand(name, description, website, socialMedia, category, tags)
      .accounts({
        brand: brand.publicKey,
        brandList: brandList.publicKey,
      })
      .signers([brand, TRONIC_ADMIN_KEYPAIR])
      .rpc();

    log("Created Enhanced Brand with publicKey:", brand.publicKey.toBase58());

    const brandAccount = await program.account.brand.fetch(brand.publicKey);
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
    const brand = anchor.web3.Keypair.generate();
    const name = "Test Brand";
    const description = "A test brand for our community engagement protocol";
  
    await program.methods
      .createBrand(name, description, null, null, null, [])
      .accounts({
        brand: brand.publicKey,
        brandList: brandList.publicKey,
      })
      .signers([brand, TRONIC_ADMIN_KEYPAIR])
      .rpc();
  
    log("Created Brand for update test with publicKey:", brand.publicKey.toBase58());

    const newName = "Updated Test Brand";
    const newDescription = "An updated test brand for our community engagement protocol";
  
    await program.methods
      .updateBrand(newName, newDescription)
      .accounts({
        brand: brand.publicKey,
      })
      .signers([TRONIC_ADMIN_KEYPAIR])
      .rpc();
  
    log("Updated Brand with publicKey:", brand.publicKey.toBase58());

    const updatedBrandAccount = await program.account.brand.fetch(brand.publicKey);
    log("Updated Brand Account:", updatedBrandAccount);
    expect(updatedBrandAccount.name).to.equal(newName);
    expect(updatedBrandAccount.description).to.equal(newDescription);
  });

  it("Gets brand info", async () => {
    const brand = anchor.web3.Keypair.generate();
    const name = "Test Brand";
    const description = "A test brand for our community engagement protocol";
  
    await program.methods
      .createBrand(name, description, null, null, null, [])
      .accounts({
        brand: brand.publicKey,
        brandList: brandList.publicKey,
      })
      .signers([brand, TRONIC_ADMIN_KEYPAIR])
      .rpc();

    log("Created Brand for get info test with publicKey:", brand.publicKey.toBase58());
  
    const brandInfo = await program.account.brand.fetch(brand.publicKey);
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
      const brand = anchor.web3.Keypair.generate();
      await program.methods
        .createBrand(`Hub ${i+1}`, `Description for Hub ${i+1}`, null, null, null, [])
        .accounts({
          brand: brand.publicKey,
          brandList: brandList.publicKey,
        })
        .signers([brand, TRONIC_ADMIN_KEYPAIR])
        .rpc();

      log(`Created Brand ${i+1} with publicKey:`, brand.publicKey.toBase58());
      hubKeys.push(brand.publicKey);
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
    const brand = anchor.web3.Keypair.generate();
    const name = "Test Brand";
    const description = "A test brand for our community engagement protocol";
    const nonAdminKeypair = anchor.web3.Keypair.generate();

    // Fund the non-admin account
    await fundAccount(program.provider.connection, nonAdminKeypair.publicKey);

    const [programStatePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("program-state")],
      program.programId
    );

    console.log("Program State PDA:", programStatePda.toBase58());
    console.log("Non-admin Public Key:", nonAdminKeypair.publicKey.toBase58());
    console.log("Actual Tronic Admin Public Key:", TRONIC_ADMIN_PUBKEY.toBase58());

    // Fund the non-admin account
    const connection = program.provider.connection;
    const airdropSignature = await connection.requestAirdrop(nonAdminKeypair.publicKey, 1000000000);
    await connection.confirmTransaction(airdropSignature);

    try {
      const tx = await program.methods
        .createBrand(name, description, null, null, null, [])
        .accounts({
          brand: brand.publicKey,
          brandList: brandList.publicKey,
          programState: programStatePda,
          tronicAdmin: nonAdminKeypair.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([brand, nonAdminKeypair])
        .rpc();

      console.log("Transaction signature (unexpected success):", tx);
      expect.fail("Expected an error but none was thrown");
    } catch (error) {
      console.log("Error caught:", error.message);
      
      // Check if the error is due to unauthorized access, not insufficient funds
      if (error.message.includes("custom program error: 0x1")) {
        // Fetch the logs to see if our custom error message is there
        const logs = error?.logs || [];
        console.log("Transaction logs:", logs);
        
        const unauthorizedLog = logs.find(log => log.includes("Unauthorized: Signer is not the Tronic Admin"));
        if (unauthorizedLog) {
          console.log("Found unauthorized log:", unauthorizedLog);
        } else {
          expect.fail("Expected to find 'Unauthorized: Signer is not the Tronic Admin' in logs, but it was not present");
        }
      } else {
        expect(error.message).to.include("Error Code: UnauthorizedTronicAdmin");
      }
    }
  });
});