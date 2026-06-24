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
    inputs: [],
    name: "latestNews",
    outputs: [{ type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "latestSummary",
    outputs: [{ type: "string" }],
    stateMutability: "view",
    type: "function",
  }
] as const;

// Replace with deployed address. For now we use a dummy one until deployed
export const REPORTER_ADDRESS = "0x6b62f2cec6679fa18e30df42b8e4d77eae0130b7";
