# Autonomous Crypto Reporter

This project is an autonomous agent running entirely on Ritual Chain. It uses the Ritual Scheduler to run daily. Each day it:
1. Calls the HTTP precompile to fetch crypto price data or news.
2. Passes that data to the LLM precompile to generate a brief market summary.
3. Stores the latest news and summary in the contract.

## Prerequisites

You will need `forge` installed to compile and deploy the smart contracts. 
You will also need testnet `RITUAL` tokens to fund the executor fees.

## Setup

1. Copy `.env.example` to `.env` and fill in your private key:
   ```bash
   cp .env.example .env
   ```

2. Compile the contracts:
   ```bash
   forge build
   ```

3. Deploy the contracts to Ritual Chain:
   ```bash
   forge script script/Deploy.s.sol --rpc-url https://rpc.ritualfoundation.org --broadcast
   ```

   **Note**: The deployment script automatically deposits 0.05 RITUAL into the `RitualWallet` to cover execution fees for the async operations.

## How it works

Once deployed, you can start the scheduled reporting loop by calling:
```solidity
scheduleDailyReport(
    0x... ,             // Executor Address (Query TEEServiceRegistry for this)
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd", 
    246858,             // 1 Day in blocks (~350ms per block)
    365                 // Number of times to run
)
```

The contract will now fetch data and summarize it autonomously.
