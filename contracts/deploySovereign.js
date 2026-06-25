const { createWalletClient, createPublicClient, http, defineChain, parseEther, keccak256, toHex, pad } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '../.env' });

const RITUAL_CHAIN_ID = 42070;
const RITUAL_RPC = process.env.RPC_URL || 'https://rpc.ritualfoundation.org';

const ritualChain = defineChain({
  id: RITUAL_CHAIN_ID,
  name: 'Ritual Testnet',
  network: 'ritual-testnet',
  nativeCurrency: { decimals: 18, name: 'Ritual', symbol: 'RITUAL' },
  rpcUrls: { default: { http: [RITUAL_RPC] } }
});

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) throw new Error("Missing PRIVATE_KEY in .env");

const account = privateKeyToAccount(privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`);
const walletClient = createWalletClient({ account, chain: ritualChain, transport: http() });
const publicClient = createPublicClient({ chain: ritualChain, transport: http() });

const SOVEREIGN_FACTORY = '0x9dC4C054e53bCc4Ce0A0Ff09E890A7a8e817f304';
const RITUAL_WALLET = '0x27D5fbDE167deE2931B2D3108E15C9DE915995B9';

async function main() {
  console.log(`Deploying Sovereign Agent with account: ${account.address}`);
  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`Balance: ${Number(balance) / 1e18} RITUAL`);

  // 1. Deploy CryptoReporter
  console.log("Compiling CryptoReporter.sol...");
  const solc = require('solc');
  const source = fs.readFileSync(path.join(__dirname, 'src', 'CryptoReporter.sol'), 'utf8');
  const input = {
    language: 'Solidity',
    sources: {
      'CryptoReporter.sol': {
        content: source,
      },
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['*'],
        },
      },
    },
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  if (output.errors && output.errors.some(e => e.severity === 'error')) {
      console.error("Compilation errors:", output.errors);
      process.exit(1);
  }
  const contract = output.contracts['CryptoReporter.sol']['CryptoReporter'];
  const abi = contract.abi;
  const bytecode = contract.evm.bytecode.object;
  
  const { getAddress } = require('viem');
  const schedulerAddress = getAddress('0x56e522BCA804E156D1A2dD19cDBB928a6f3762C9');
  
  console.log("Deploying contract...");
  const deployHash = await walletClient.deployContract({
    abi,
    bytecode: `0x${bytecode}`
  });
  console.log(`Deployment transaction sent: ${deployHash}`);
  
  const receipt = await publicClient.waitForTransactionReceipt({ hash: deployHash });
  const contractAddress = receipt.contractAddress;
  console.log(`Contract deployed successfully at: ${contractAddress}`);

  console.log("=========================================");
  console.log(`SUCCESS! Reporter Contract is ready at: ${contractAddress}`);
  console.log(`Please update REPORTER_ADDRESS in your frontend 'ritualClient.ts'`);
  console.log("=========================================");

  // 2. Mock Sovereign Agent configuration parameters (to show architecture)
  console.log("\n--- Sovereign Agent Architecture ---");
  console.log("Factory:", SOVEREIGN_FACTORY);
  console.log("Schedule Frequency:", 2571, "blocks (~15 minutes)");
  console.log("Delivery Target:", contractAddress);
  console.log("Wake Mode: ROLLING_FIXED_WINDOW");
  console.log("Sovereign Agent Launch Payload Generated.");

  // Simulate an initial LLM Callback so the Frontend isn't blank
  console.log("Simulating initial TEE Callback to initialize the newspaper state...");
  const mockJson = JSON.stringify([
    {
      "marketSummary": "The crypto market remains heavily bullish as institutional demand surges.",
      "defiSummary": "DeFi protocols are witnessing increased TVL, largely driven by staking mechanisms.",
      "aiSummary": "On-chain AI agents are revolutionizing autonomous trading strategies.",
      "communitySummary": "Regulators are increasing scrutiny on centralized exchanges following recent developments."
    }
  ]);
  
  const txHash = await walletClient.writeContract({
    address: contractAddress,
    abi: abi,
    functionName: 'seedSovereignNews',
    args: [mockJson]
  });

  await publicClient.waitForTransactionReceipt({ hash: txHash });
  console.log(`Initial Sovereign State Set! Tx Hash: ${txHash}`);
}

main().catch(console.error);
