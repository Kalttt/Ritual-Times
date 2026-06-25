const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const solc = require('solc');
require('dotenv').config({ path: '../.env' });

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'https://rpc.ritualfoundation.org');
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error("Missing PRIVATE_KEY in .env");
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log(`Deploying with account: ${wallet.address}`);
  
  console.log("Compiling CryptoReporter.sol...");
  const source = fs.readFileSync(path.join(__dirname, 'src', 'CryptoReporter.sol'), 'utf8');
  const input = {
    language: 'Solidity',
    sources: { 'CryptoReporter.sol': { content: source } },
    settings: { outputSelection: { '*': { '*': ['*'] } } }
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  if (output.errors && output.errors.some(e => e.severity === 'error')) {
      console.error("Compilation errors:", output.errors);
      process.exit(1);
  }
  const contract = output.contracts['CryptoReporter.sol']['CryptoReporter'];
  const abi = contract.abi;
  const bytecode = contract.evm.bytecode.object;

  console.log("Deploying contract...");
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contractInstance = await factory.deploy({ gasLimit: 5000000 });
  await contractInstance.waitForDeployment();
  const address = await contractInstance.getAddress();
  
  console.log(`Contract deployed successfully at: ${address}`);

  console.log("=========================================");
  console.log(`SUCCESS! Reporter Contract is ready at: ${address}`);
  console.log(`Please update REPORTER_ADDRESS in your frontend 'ritualClient.ts'`);
  console.log("=========================================");

  console.log("\n--- Sovereign Agent Architecture ---");
  console.log("Factory: 0x9dC4C054e53bCc4Ce0A0Ff09E890A7a8e817f304");
  console.log("Schedule Frequency: 2571 blocks (~15 minutes)");
  console.log("Delivery Target:", address);
  console.log("Wake Mode: ROLLING_FIXED_WINDOW");

  console.log("Simulating initial TEE Callback to initialize the newspaper state...");
  const mockJson = JSON.stringify([
    {
      "marketSummary": "The crypto market remains heavily bullish as institutional demand surges.",
      "defiSummary": "DeFi protocols are witnessing increased TVL, largely driven by staking mechanisms.",
      "aiSummary": "On-chain AI agents are revolutionizing autonomous trading strategies.",
      "communitySummary": "Regulators are increasing scrutiny on centralized exchanges following recent developments."
    }
  ]);
  
  const tx = await contractInstance.seedSovereignNews(mockJson, { gasLimit: 500000 });
  await tx.wait();
  
  console.log(`Initial Sovereign State Set! Tx Hash: ${tx.hash}`);
}

main().catch(console.error);
