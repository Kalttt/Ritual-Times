import { createPublicClient, http, defineChain } from 'viem';

export const ritualChain = defineChain({
  id: 1979,
  name: 'Ritual',
  nativeCurrency: { name: 'RITUAL', symbol: 'RITUAL', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://rpc.ritualfoundation.org'],
    },
  },
  blockExplorers: {
    default: { name: 'Ritual Explorer', url: 'https://explorer.ritualfoundation.org' },
  },
});

export const publicClient = createPublicClient({
  chain: ritualChain,
  transport: http(),
});

export const REPORTER_ABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "bytes32", "name": "jobId", "type": "bytes32" },
      { "indexed": false, "internalType": "bytes", "name": "result", "type": "bytes" }
    ],
    "name": "SovereignResult",
    "type": "event"
  },
  { inputs: [], name: "marketSummary", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "latestSovereignNews", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "marketRaw", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "marketImage", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "defiSummary", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "defiRaw", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "defiImage", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "aiSummary", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "aiRaw", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "aiImage", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "communitySummary", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "communityRaw", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "communityImage", outputs: [{ type: "string" }], stateMutability: "view", type: "function" }
] as const;

export const REPORTER_ADDRESS = '0x7F7B3D79AcF9fEe85Aa561792Edd4F04aD938DF7';
