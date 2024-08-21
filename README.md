# Community Engagement Protocol

This project implements a Solana-based Community Engagement Protocol using the Anchor framework.

## Prerequisites

- Rust and Cargo (latest stable version)
- Solana CLI tools
- Anchor CLI
- Node.js and npm (for running tests)

## Setup

1. Clone the repository:
   ```
   git clone git@github.com:tronicapp/community-engagement-protocol.git
   cd community-engagement-protocol
   ```

2. Install dependencies:
   ```
   yarn install
   ```

3. Build the project:
   ```
   anchor build
   ```

## Running Tests

To run the test suite, use the following command:

```
anchor test
```

This command will build the project, deploy it to a local Solana cluster, and run all the tests located in the `tests/` directory.

---

# Deploying Community Engagement Protocol to Solana Devnet

This guide outlines the steps to deploy the Community Engagement Protocol program to Solana's devnet.

## Prerequisites

1. Ensure you have Rust and Cargo installed (https://www.rust-lang.org/tools/install)
2. Install Solana CLI tools (https://docs.solana.com/cli/install-solana-cli-tools)
3. Install Anchor CLI (https://www.anchor-lang.com/docs/installation)
4. Have a Solana wallet with some devnet SOL

## Step 1: Configure Solana CLI for Devnet

```bash
solana config set --url https://api.devnet.solana.com
```

## Step 2: Create a Keypair for Program Deployment

```bash
solana-keygen new -o deploy-keypair.json
```

Save the public key displayed after running this command.

## Step 3: Fund the Deploy Keypair

```bash
solana airdrop 2 <PUBKEY_FROM_STEP_2> --url https://api.devnet.solana.com
```

Repeat this command if you need more SOL.

## Step 4: Update Anchor.toml

Open `Anchor.toml` and update the following:

```toml
[programs.devnet]
community_engagement_protocol = "<PUBKEY_FROM_STEP_2>"

[provider]
cluster = "devnet"
wallet = "/path/to/deploy-keypair.json"
```

## Step 5: Update Declared Program ID

In `programs/community_engagement_protocol/src/lib.rs`, update the declared program ID:

```rust
declare_id!("<PUBKEY_FROM_STEP_2>");
```

## Step 6: Build the Program

```bash
anchor build
```

## Step 7: Deploy to Devnet

```bash
anchor deploy
```

## Step 8: Verify Deployment

```bash
solana confirm -v <TRANSACTION_SIGNATURE>
```

Replace <TRANSACTION_SIGNATURE> with the signature output from the deploy command.

## Step 9: Interact with Your Program

You can now interact with your program on devnet using the Anchor client or direct Solana transactions.

## Troubleshooting

- If you encounter "insufficient funds" errors, airdrop more SOL to your deploy keypair.
- Ensure all dependencies are up to date in `Cargo.toml`.
- If you face issues with account sizes, you may need to adjust the space allocated for accounts in your program.

## Next Steps

- Update your client applications to point to the devnet URL and new program ID.
- Consider setting up a continuous integration/deployment pipeline for future updates.
- Monitor your program's performance and usage on devnet before considering mainnet deployment.

