// tests/group_hub_tests.ts
import { expect } from 'chai';
import * as anchor from "@coral-xyz/anchor";
import { program, provider, brandList, initializeBrandList, log } from './common';

describe("Brand Tests", () => {
  before(initializeBrandList);

  it("Creates a brand", async () => {
    const brand = anchor.web3.Keypair.generate();
    const name = "Test Brand";
    const description = "A test brand for our community engagement protocol";

    await program.methods
      .createBrand(name, description, null, null, null, [])
      .accounts({
        brand: brand.publicKey,
        brandList: brandList.publicKey,
        user: provider.wallet.publicKey,
      })
      .signers([brand])
      .rpc();

    log("Created Brand with publicKey:", brand.publicKey.toBase58());

    const brandAccount = await program.account.brand.fetch(brand.publicKey);
    log("Brand Account:", brandAccount);
    expect(brandAccount.name).to.equal(name);
    expect(brandAccount.description).to.equal(description);
    expect(brandAccount.admins[0].toString()).to.equal(provider.wallet.publicKey.toString());
  });

  it("Creates a brand", async () => {
    const brand = anchor.web3.Keypair.generate();
    const name = "Test Brand";
    const description = "A test brand for our community engagement protocol";

    await program.methods
      .createBrand(
        name, 
        description,
        null,  // website
        null,  // social_media
        null,  // category
        []     // tags
      )
      .accounts({
        brand: brand.publicKey,
        brandList: brandList.publicKey,
        user: provider.wallet.publicKey,
      })
      .signers([brand])
      .rpc();

    log("Created Brand with publicKey:", brand.publicKey.toBase58());

    const brandAccount = await program.account.brand.fetch(brand.publicKey);
    log("Brand Account:", brandAccount);
    expect(brandAccount.name).to.equal(name);
    expect(brandAccount.description).to.equal(description);
    expect(brandAccount.admins[0].toString()).to.equal(provider.wallet.publicKey.toString());
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
        user: provider.wallet.publicKey,
      })
      .signers([brand])
      .rpc();

    log("Created Enhanced Brand with publicKey:", brand.publicKey.toBase58());

    const brandAccount = await program.account.brand.fetch(brand.publicKey);
    log("Enhanced Brand Account:", brandAccount);
    
    expect(brandAccount.name).to.equal(name);
    expect(brandAccount.description).to.equal(description);
    expect(brandAccount.admins[0].toString()).to.equal(provider.wallet.publicKey.toString());
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
        user: provider.wallet.publicKey,
      })
      .signers([brand])
      .rpc();
  
    log("Created Brand for update test with publicKey:", brand.publicKey.toBase58());

    const newName = "Updated Test Brand";
    const newDescription = "An updated test brand for our community engagement protocol";
  
    await program.methods
      .updateBrand(newName, newDescription)
      .accounts({
        brand: brand.publicKey,
        user: provider.wallet.publicKey,
      })
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
        user: provider.wallet.publicKey,
      })
      .signers([brand])
      .rpc();

    log("Created Brand for get info test with publicKey:", brand.publicKey.toBase58());
  
    const brandInfo = await program.account.brand.fetch(brand.publicKey);
    log("Brand Info:", brandInfo);

    expect(brandInfo.name).to.equal(name);
    expect(brandInfo.description).to.equal(description);
    expect(brandInfo.admins).to.have.lengthOf(1);
    expect(brandInfo.admins[0].toString()).to.equal(provider.wallet.publicKey.toString());
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
          user: provider.wallet.publicKey,
        })
        .signers([brand])
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

  it("Adds an admin to a brand", async () => {
    const brand = anchor.web3.Keypair.generate();
    const name = "Test Brand";
    const description = "A test brand for our community engagement protocol";

    await program.methods
      .createBrand(name, description, null, null, null, [])
      .accounts({
        brand: brand.publicKey,
        brandList: brandList.publicKey,
        user: provider.wallet.publicKey,
      })
      .signers([brand])
      .rpc();

    log("Created Brand for add admin test with publicKey:", brand.publicKey.toBase58());

    const newAdmin = anchor.web3.Keypair.generate();

    await program.methods
      .addAdmin(newAdmin.publicKey)
      .accounts({
        brand: brand.publicKey,
        user: provider.wallet.publicKey,
      })
      .rpc();

    log("Added new admin with publicKey:", newAdmin.publicKey.toBase58());

    const updatedBrand = await program.account.brand.fetch(brand.publicKey);
    log("Updated Brand Account after adding admin:", updatedBrand);
    expect(updatedBrand.admins).to.have.lengthOf(2);
    expect(updatedBrand.admins[1].toString()).to.equal(newAdmin.publicKey.toString());
  });

  it("Removes an admin from a brand", async () => {
    const brand = anchor.web3.Keypair.generate();
    const name = "Test Brand";
    const description = "A test brand for our community engagement protocol";

    await program.methods
      .createBrand(name, description, null, null, null, [])
      .accounts({
        brand: brand.publicKey,
        brandList: brandList.publicKey,
        user: provider.wallet.publicKey,
      })
      .signers([brand])
      .rpc();

    log("Created Brand for remove admin test with publicKey:", brand.publicKey.toBase58());

    const newAdmin = anchor.web3.Keypair.generate();

    await program.methods
      .addAdmin(newAdmin.publicKey)
      .accounts({
        brand: brand.publicKey,
        user: provider.wallet.publicKey,
      })
      .rpc();

    log("Added new admin with publicKey:", newAdmin.publicKey.toBase58());

    await program.methods
      .removeAdmin(newAdmin.publicKey)
      .accounts({
        brand: brand.publicKey,
        user: provider.wallet.publicKey,
      })
      .rpc();

    log("Removed admin with publicKey:", newAdmin.publicKey.toBase58());

    const updatedBrand = await program.account.brand.fetch(brand.publicKey);
    log("Updated Brand Account after removing admin:", updatedBrand);
    expect(updatedBrand.admins).to.have.lengthOf(1);
    expect(updatedBrand.admins[0].toString()).to.equal(provider.wallet.publicKey.toString());
  });
});