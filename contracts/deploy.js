const fs = require('fs');
const path = require('path');
const solc = require('solc');
const { createWalletClient, createPublicClient, http, defineChain, parseEther } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
require('dotenv').config({ path: '../.env' }); // load from parent dir since .env is there

const ritualChain = defineChain({
  id: 1979,
  name: 'Ritual',
  nativeCurrency: { name: 'RITUAL', symbol: 'RITUAL', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.RITUAL_RPC_URL || 'https://rpc.ritualfoundation.org'] },
  },
});

async function main() {
  if (!process.env.PRIVATE_KEY) {
    console.error("Error: PRIVATE_KEY not found in .env");
    process.exit(1);
  }

  const pk = process.env.PRIVATE_KEY.startsWith('0x') ? process.env.PRIVATE_KEY : `0x${process.env.PRIVATE_KEY}`;
  const account = privateKeyToAccount(pk);

  const publicClient = createPublicClient({ chain: ritualChain, transport: http() });
  const walletClient = createWalletClient({ account, chain: ritualChain, transport: http() });

  console.log(`Deploying from account: ${account.address}`);
  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`Balance: ${balance / 10n**18n} RITUAL`);

  if (balance < parseEther('0.06')) {
    console.warn("Warning: Balance might be too low to deploy and deposit 0.05 RITUAL.");
  }

  // 1. Compile the Solidity code
  console.log("Compiling CryptoReporter.sol...");
  const sourceCode = fs.readFileSync(path.join(__dirname, 'src', 'CryptoReporter.sol'), 'utf8');

  const input = {
    language: 'Solidity',
    sources: {
      'CryptoReporter.sol': {
        content: sourceCode
      }
    },
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200
      },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode']
        }
      }
    }
  };

  const compiled = JSON.parse(solc.compile(JSON.stringify(input)));
  if (compiled.errors) {
    const errors = compiled.errors.filter(e => e.severity === 'error');
    if (errors.length > 0) {
      console.error("Compilation errors:", errors);
      process.exit(1);
    }
  }

  const contract = compiled.contracts['CryptoReporter.sol']['CryptoReporter'];
  const abi = contract.abi;
  const bytecode = contract.evm.bytecode.object;

  // 2. Deploy
  console.log("Deploying contract...");
  const schedulerAddress = "0x56e776BAE2DD60664b69Bd5F865F1180ffB7D58B";
  
  const currentNonce = await publicClient.getTransactionCount({ address: account.address });

  const deployHash = await walletClient.deployContract({
    abi,
    bytecode: `0x${bytecode}`,
    args: [schedulerAddress]
  });
  console.log(`Deployment transaction sent: ${deployHash}`);

  // 3. Wait for deployment receipt
  const receipt = await publicClient.waitForTransactionReceipt({ hash: deployHash });
  const contractAddress = receipt.contractAddress;
  console.log(`Contract deployed successfully at: ${contractAddress}`);

  // 4. Deposit fees
  console.log("Depositing 0.05 RITUAL for execution fees...");
  const depositHash = await walletClient.writeContract({
    address: contractAddress,
    abi,
    functionName: 'depositForFees',
    value: parseEther('0.05')
  });
  
  console.log(`Deposit transaction sent: ${depositHash}`);
  await publicClient.waitForTransactionReceipt({ hash: depositHash });
  console.log("Deposit confirmed!");

  console.log("\n=========================================");
  console.log(`SUCCESS! Contract is ready at: ${contractAddress}`);
  console.log("Please update REPORTER_ADDRESS in your frontend 'ritualClient.ts'");
  console.log("=========================================\n");
}

main().catch(console.error);
