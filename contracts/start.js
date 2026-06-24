const { createWalletClient, createPublicClient, http, defineChain } = require('viem');
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

const TEE_SERVICE_REGISTRY = "0x9644e8562cE0Fe12b4deeC4163c064A8862Bf47F";
const TEE_SERVICE_REGISTRY_ABI = [{
  inputs: [
    { name: "capability", type: "uint8" },
    { name: "checkValidity", type: "bool" },
  ],
  name: "getServicesByCapability",
  outputs: [
    {
      type: "tuple[]",
      components: [
        {
          name: "node",
          type: "tuple",
          components: [
            { name: "paymentAddress", type: "address" },
            { name: "teeAddress", type: "address" },
            { name: "teeType", type: "uint8" },
            { name: "publicKey", type: "bytes" },
            { name: "endpoint", type: "string" },
            { name: "certPubKeyHash", type: "bytes32" },
            { name: "capability", type: "uint8" },
          ],
        },
        { name: "isValid", type: "bool" },
        { name: "workloadId", type: "bytes32" },
      ],
    },
  ],
  stateMutability: "view",
  type: "function",
}];

const REPORTER_ADDRESS = "0x3064e65d096d1b67b7c1f998786c54477047f01d";
const REPORTER_ABI = [{
  inputs: [
    { name: "executor", type: "address" },
    { name: "url", type: "string" },
    { name: "frequencyBlocks", type: "uint32" },
    { name: "numCalls", type: "uint32" }
  ],
  name: "scheduleDailyReport",
  outputs: [],
  stateMutability: "nonpayable",
  type: "function"
}];

async function main() {
  const pk = process.env.PRIVATE_KEY.startsWith('0x') ? process.env.PRIVATE_KEY : `0x${process.env.PRIVATE_KEY}`;
  const account = privateKeyToAccount(pk);

  const publicClient = createPublicClient({ chain: ritualChain, transport: http() });
  const walletClient = createWalletClient({ account, chain: ritualChain, transport: http() });

  console.log("Fetching TEE executors...");
  // HTTP_CALL capability ID is 0
  const services = await publicClient.readContract({
    address: TEE_SERVICE_REGISTRY,
    abi: TEE_SERVICE_REGISTRY_ABI,
    functionName: "getServicesByCapability",
    args: [0, true],
  });

  if (services.length === 0) throw new Error("No HTTP executors found!");
  const executorAddress = services[0].node.teeAddress;
  console.log(`Found executor: ${executorAddress}`);

  console.log("Starting autonomous agent schedule...");
  const hash = await walletClient.writeContract({
    address: REPORTER_ADDRESS,
    abi: REPORTER_ABI,
    functionName: 'scheduleDailyReport',
    args: [
      executorAddress,
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd",
      246858, // roughly 1 day
      1
    ]
  });

  console.log(`Transaction sent: ${hash}`);
  await publicClient.waitForTransactionReceipt({ hash });
  console.log("Agent started! It will now autonomously fetch and summarize market data.");
}

main().catch(console.error);
