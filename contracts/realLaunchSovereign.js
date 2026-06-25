const { ethers } = require('ethers');
const { encrypt, ECIES_CONFIG } = require('eciesjs');
require('dotenv').config({ path: '../.env' });

// IMPORTANT: Ritual's ECIES spec requires nonce length 12
ECIES_CONFIG.symmetricNonceLength = 12;

const FACTORY_ADDRESS = '0x9dC4C054e53bCc4Ce0A0Ff09E890A7a8e817f304';

// Target consumer address we deployed earlier
const REPORTER_ADDRESS = '0xF1DD6ce67a1E5a507Af5ad8906f2F45d55abbc49';

async function main() {
    const provider = new ethers.JsonRpcProvider('https://rpc.ritualfoundation.org');
    const privateKey = process.env.PRIVATE_KEY;
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log(`Using wallet: ${wallet.address}`);

    // Get executor's public key
    console.log("Fetching executor from TEEServiceRegistry...");
    const teeRegAbi = [
      {
        name: 'getServicesByCapability',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'capability', type: 'uint8' }, { name: 'checkValidity', type: 'bool' }],
        outputs: [{
          name: '',
          type: 'tuple[]',
          components: [
            { name: 'node', type: 'tuple', components: [
              { name: 'paymentAddress', type: 'address' },
              { name: 'teeAddress', type: 'address' },
              { name: 'teeType', type: 'uint8' },
              { name: 'publicKey', type: 'bytes' },
              { name: 'endpoint', type: 'string' },
              { name: 'certPubKeyHash', type: 'bytes32' },
              { name: 'capability', type: 'uint8' },
            ]},
            { name: 'isValid', type: 'bool' }
          ]
        }]
      }
    ];
    // TEE Registry is often retrieved from factory, but we found it manually
    const registryAddress = '0x9644e8562cE0Fe12b4deeC4163c064A8862Bf47F';
    const reg = new ethers.Contract(registryAddress, teeRegAbi, provider);
    const svcs = await reg.getServicesByCapability(0, true);
    
    if (!svcs || svcs.length === 0) {
        throw new Error("No active TEE Executors found on Ritual Testnet");
    }

    const executor = svcs[0].node.teeAddress;
    const executorPubKey = svcs[0].node.publicKey;
    console.log(`Selected Executor: ${executor}`);
    console.log(`Executor PubKey: ${executorPubKey.slice(0,10)}...`);

    // Encrypt Secrets
    const secrets = {
        LLM_PROVIDER: "openrouter",
        OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
        HF_TOKEN: process.env.HF_TOKEN
    };
    const secretsJson = JSON.stringify(secrets);
    console.log("Encrypting secrets using ECIES...");
    
    // Convert public key hex to buffer, assuming uncompressed (starts with 04)
    // The executor pub key from registry is 64 bytes (X and Y), we need to prepend 0x04
    let pubKeyHex = executorPubKey.startsWith('0x') ? executorPubKey.slice(2) : executorPubKey;
    if (pubKeyHex.length === 128) {
        pubKeyHex = '04' + pubKeyHex;
    }
    
    const encryptedSecretsBuffer = encrypt(pubKeyHex, Buffer.from(secretsJson));
    const encryptedSecrets = `0x${Buffer.from(encryptedSecretsBuffer).toString('hex')}`;

    const salt = ethers.id("ritual-times-news-v6");
    
    // Use predictHarness for two-step
    const factory = new ethers.Contract(FACTORY_ADDRESS, [
        "function predictHarness(address owner, bytes32 userSalt) view returns (address harness, bytes32 childSalt)",
        "function deployHarness(bytes32 userSalt) returns (address harness)"
    ], wallet);
    
    const prediction = await factory.predictHarness(wallet.address, salt);
    const harnessAddress = prediction.harness;
    console.log(`Predicted Harness Address: ${harnessAddress}`);

    // Build the parameters matching the python template
    const hfRepo = "kalttt/the-ritual-times";
    const hfConvo = { platform: "hf", path: `${hfRepo}/sessions/session-001.jsonl`, keyRef: "HF_TOKEN" };
    const hfOutput = { platform: "hf", path: `${hfRepo}/artifacts/`, keyRef: "HF_TOKEN" };
    const hfSystem = { platform: "hf", path: `${hfRepo}/system-prompt.txt`, keyRef: "" };

    const params = {
        executor: executor,
        ttl: 500n, // blocks
        userPublicKey: "0x",
        pollIntervalBlocks: 5n,
        maxPollBlock: 6000n,
        taskIdMarker: "SOVEREIGN_AGENT_TASK",
        deliveryTarget: harnessAddress,
        deliverySelector: "0x8ca12055", // "onSovereignAgentResult(bytes32,bytes)"
        deliveryGasLimit: 3000000n,
        deliveryMaxFeePerGas: 1000000000n, // 1 gwei
        deliveryMaxPriorityFeePerGas: 100000000n, // 0.1 gwei
        agentType: 5, // 5 = crush
        prompt: "Cập nhật tin tức crypto", // Prompt to trigger the agent
        encryptedSecrets: encryptedSecrets,
        convoHistory: hfConvo,
        output: hfOutput,
        skills: [],
        systemPrompt: hfSystem,
        model: "openai/gpt-4o-mini", // OpenRouter Model
        tools: [],
        maxTurns: 50,
        maxTokens: 8192,
        rpcUrls: ""
    };

    const schedule = {
        schedulerGas: 2500000,
        frequency: 2571, // 15 mins
        schedulerTtl: 500,
        maxFeePerGas: ethers.parseUnits("1.5", "gwei"),
        maxPriorityFeePerGas: ethers.parseUnits("0.01", "gwei"),
        value: 0
    };

    const rolling = {
        windowNumCalls: 3, // 3 calls per window
        rolloverThresholdBps: 5000,
        rolloverRetryEveryCalls: 1
    };

    const schedulerLockDuration = 86400 * 30; // 30 days
    const schedulerFunding = ethers.parseEther("0.05"); // Fund the scheduler with 0.05 Ritual

    console.log("Deploying Harness...");
    const deployTx = await factory.deployHarness(salt, { gasLimit: 5000000, gasPrice: ethers.parseUnits("1.5", "gwei") });
    await deployTx.wait();
    console.log(`Harness deployed!`);

    console.log("Configuring and Starting Harness...");
    const harnessAbi = [
        "function configureFundAndStart(tuple(address executor, uint256 ttl, bytes userPublicKey, uint64 pollIntervalBlocks, uint64 maxPollBlock, string taskIdMarker, address deliveryTarget, bytes4 deliverySelector, uint256 deliveryGasLimit, uint256 deliveryMaxFeePerGas, uint256 deliveryMaxPriorityFeePerGas, uint16 agentType, string prompt, bytes encryptedSecrets, tuple(string platform, string path, string keyRef) convoHistory, tuple(string platform, string path, string keyRef) output, tuple(string platform, string path, string keyRef)[] skills, tuple(string platform, string path, string keyRef) systemPrompt, string model, string[] tools, uint16 maxTurns, uint32 maxTokens, string rpcUrls) params, tuple(uint32 schedulerGas, uint32 frequency, uint32 schedulerTtl, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, uint256 value) schedule, tuple(uint32 windowNumCalls, uint16 rolloverThresholdBps, uint16 rolloverRetryEveryCalls) rolling, uint256 schedulerLockDuration) payable returns (uint256 schedulerCallId)"
    ];
    const harness = new ethers.Contract(harnessAddress, harnessAbi, wallet);
    const startTx = await harness.configureFundAndStart(params, schedule, rolling, schedulerLockDuration, {
        value: schedulerFunding,
        gasLimit: 5000000,
        gasPrice: ethers.parseUnits("1.5", "gwei")
    });
    console.log(`Start Tx Hash: ${startTx.hash}`);
    const receipt = await startTx.wait();
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    console.log(`\n🎉 SOVEREIGN AGENT DEPLOYMENT COMPLETE!`);
    console.log(`Agent Harness Contract: ${harnessAddress}`);
}

main().catch(console.error);
