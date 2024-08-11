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

