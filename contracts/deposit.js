const { createWalletClient, createPublicClient, http, defineChain, parseEther } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
require('dotenv').config({ path: '../.env' });

const ritualChain = defineChain({
  id: 1979,
  name: 'Ritual',
  nativeCurrency: { name: 'RITUAL', symbol: 'RITUAL', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.RITUAL_RPC_URL || 'https://rpc.ritualfoundation.org'] },
  },
});

const REPORTER_ADDRESS = "0x3064e65d096d1b67b7c1f998786c54477047f01d";
const REPORTER_ABI = [{
  inputs: [],
  name: "depositForFees",
  outputs: [],
  stateMutability: "payable",
  type: "function"
}];

async function main() {
  const pk = process.env.PRIVATE_KEY.startsWith('0x') ? process.env.PRIVATE_KEY : `0x${process.env.PRIVATE_KEY}`;
  const account = privateKeyToAccount(pk);

  const publicClient = createPublicClient({ chain: ritualChain, transport: http() });
  const walletClient = createWalletClient({ account, chain: ritualChain, transport: http() });

  console.log("Depositing 0.5 RITUAL...");
  const depositHash = await walletClient.writeContract({
    address: REPORTER_ADDRESS,
    abi: REPORTER_ABI,
    functionName: 'depositForFees',
    value: parseEther('0.5')
  });
  
  console.log(`Transaction sent: ${depositHash}`);
  await publicClient.waitForTransactionReceipt({ hash: depositHash });
  console.log("Deposit confirmed! Now trying to start agent again...");
}

main().catch(console.error);
