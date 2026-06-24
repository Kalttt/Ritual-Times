// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IRitualWallet {
    function deposit(uint256 lockDuration) external payable;
}

interface IScheduler {
    function schedule(
        bytes calldata data,
        uint32 gas,
        uint32 startBlock,
        uint32 numCalls,
        uint32 frequency,
        uint32 ttl,
        uint256 maxFeePerGas,
        uint256 maxPriorityFeePerGas,
        uint256 value,
        address payer
    ) external returns (uint256 callId);

    function cancel(uint256 callId) external;
    function approveScheduler(address schedulerContract) external;
}

contract CryptoReporter {
    address constant HTTP_PRECOMPILE = 0x0000000000000000000000000000000000000801;
    address constant LLM_PRECOMPILE = 0x0000000000000000000000000000000000000802;
    address constant RITUAL_WALLET = 0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948;
    
    IScheduler public immutable scheduler;
    address public owner;

    uint256 public activeScheduleId;
    
    // Market
    string public marketSummary;
    string public marketRaw;
    string public marketImage;

    // DeFi
    string public defiSummary;
    string public defiRaw;
    string public defiImage;

    // AI
    string public aiSummary;
    string public aiRaw;
    string public aiImage;

    struct HTTPResponse {
        uint16 status;
        string[] headerKeys;
        string[] headerValues;
        bytes body;
        string errorMessage;
    }

    struct StorageRef {
        string platform;
        string path;
        string key_ref;
    }

    event ReportScheduled(uint256 indexed scheduleId);
    event DataFetched(uint16 status, string data);
    event SummaryGenerated(string summary);
    event ErrorOccurred(string errorMessage);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyScheduler() {
        require(msg.sender == address(scheduler), "Unauthorized: not scheduler");
        _;
    }

    constructor(address _scheduler) {
        owner = msg.sender;
        scheduler = IScheduler(_scheduler);
    }

    function depositForFees() external payable {
        IRitualWallet(RITUAL_WALLET).deposit{value: msg.value}(50000);
    }

    function scheduleDailyReport(
        address executor,
        string calldata url,
        uint32 frequencyBlocks, // e.g., 246858 for 1 day
        uint32 numCalls
    ) external onlyOwner {
        bytes memory data = abi.encodeWithSelector(
            this.fetchData.selector,
            uint256(0), // dummy executionIndex
            executor,
            url
        );

        activeScheduleId = scheduler.schedule(
            data,
            500_000, // gas limit
            uint32(block.number) + 10, // give TEE node 10 blocks to notice
            numCalls,
            frequencyBlocks,
            50000, // huge ttl
            10000000000, // 10 gwei
            0,
            0,
            address(this)
        );

        emit ReportScheduled(activeScheduleId);
    }

    function fetchData(
        uint256 executionIndex,
        address executor,
        string calldata url
    ) external onlyScheduler {
        bytes memory encoded = abi.encode(
            executor,
            new bytes[](0),
            uint256(300), // ttl
            new bytes[](0),
            bytes(""),
            url,
            uint8(1), // GET
            new string[](0),
            new string[](0),
            bytes(""),
            uint256(0),
            uint8(0),
            false
        );

        (bool ok, bytes memory rawOutput) = HTTP_PRECOMPILE.call(encoded);
        require(ok, "HTTP precompile failed");

        (, bytes memory actualOutput) = abi.decode(rawOutput, (bytes, bytes));
        
        // Settlement phase
        if (actualOutput.length > 0) {
            HTTPResponse memory resp = abi.decode(actualOutput, (HTTPResponse));
            
            if (bytes(resp.errorMessage).length > 0) {
                emit ErrorOccurred(resp.errorMessage);
                return;
            }

            marketRaw = string(resp.body);
            emit DataFetched(resp.status, marketRaw);

            // Dynamically schedule Phase 2 (LLM call)
            // Note: We escape double quotes inside the string simply by building the JSON
            bytes memory llmData = abi.encodeWithSelector(
                this.generateSummary.selector,
                uint256(0),
                executor,
                marketRaw
            );

            scheduler.schedule(
                llmData,
                2_000_000, // gas limit for LLM
                uint32(block.number) + 1,
                1, // one-shot
                1, // frequency
                300, // ttl
                tx.gasprice,
                0,
                0,
                address(this)
            );
        }
    }

    // A helper to escape quotes in JSON string
    function escapeJsonQuotes(string memory str) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        uint256 quotesCount = 0;
        for (uint256 i = 0; i < strBytes.length; i++) {
            if (strBytes[i] == '"') {
                quotesCount++;
            }
        }
        
        bytes memory escapedBytes = new bytes(strBytes.length + quotesCount);
        uint256 j = 0;
        for (uint256 i = 0; i < strBytes.length; i++) {
            if (strBytes[i] == '"') {
                escapedBytes[j++] = '\\';
                escapedBytes[j++] = '"';
            } else {
                escapedBytes[j++] = strBytes[i];
            }
        }
        return string(escapedBytes);
    }

    function generateSummary(
        uint256 executionIndex,
        address executor,
        string memory newsData
    ) external onlyScheduler {
        string memory escapedNewsData = escapeJsonQuotes(newsData);
        string memory messagesJson = string.concat(
            '[{"role":"system","content":"You are a cryptocurrency market analyst. Provide a short, 2-sentence summary of this price data/news."}',
            ',{"role":"user","content":"', escapedNewsData, '"}]'
        );

        StorageRef memory emptyRef = StorageRef("", "", "");

        bytes memory encoded = abi.encode(
            executor,
            new bytes[](0), // encryptedSecrets
            uint256(300),   // ttl
            new bytes[](0), // secretSignatures
            bytes(""),      // userPublicKey
            messagesJson,   // messagesJson
            "zai-org/GLM-4.7-FP8", // model
            int256(0),      // frequencyPenalty
            "",             // logitBiasJson
            false,          // logprobs
            int256(4096),   // maxCompletionTokens
            "",             // metadataJson
            "",             // modalitiesJson
            uint256(1),     // n
            true,           // parallelToolCalls
            int256(0),      // presencePenalty
            "medium",       // reasoningEffort
            bytes(""),      // responseFormatData
            int256(-1),     // seed
            "auto",         // serviceTier
            "",             // stopJson
            false,          // stream
            int256(700),    // temperature
            bytes(""),      // toolChoiceData
            bytes(""),      // toolsData
            int256(-1),     // topLogprobs
            int256(1000),   // topP
            "",             // user
            false,          // piiEnabled
            emptyRef        // convoHistory
        );

        (bool ok, bytes memory rawOutput) = LLM_PRECOMPILE.call(encoded);
        require(ok, "LLM precompile failed");

        (, bytes memory actualOutput) = abi.decode(rawOutput, (bytes, bytes));
        
        // Settlement phase
        if (actualOutput.length > 0) {
            (bool hasError, bytes memory completionData, , string memory errorMessage, ) = 
                abi.decode(actualOutput, (bool, bytes, bytes, string, StorageRef));

            if (hasError) {
                emit ErrorOccurred(errorMessage);
                return;
            }

            // Decode CompletionData
            (,,,,,,, bytes[] memory choicesData, ) = abi.decode(
                completionData, 
                (string, string, uint256, string, string, string, uint256, bytes[], bytes)
            );

            if (choicesData.length > 0) {
                (, , bytes memory messageData) = abi.decode(choicesData[0], (uint256, string, bytes));
                (, string memory content, , ,) = abi.decode(messageData, (string, string, string, uint256, bytes[]));
                
                marketSummary = content;
                emit SummaryGenerated(content);
            }
        }
    }

    function cancelSchedule() external onlyOwner {
        require(activeScheduleId != 0, "No active schedule");
        scheduler.cancel(activeScheduleId);
        activeScheduleId = 0;
    }

    function publishNews(uint8 category, string calldata raw, string calldata summary, string calldata image) external onlyOwner {
        if (category == 0) {
            marketRaw = raw;
            marketSummary = summary;
            marketImage = image;
        } else if (category == 1) {
            defiRaw = raw;
            defiSummary = summary;
            defiImage = image;
        } else if (category == 2) {
            aiRaw = raw;
            aiSummary = summary;
            aiImage = image;
        }
    }

    function manualTrigger() external {
        // Market
        marketRaw = "Bitcoin surges past $60k as institutional adoption grows. Ethereum follows closely after ETF approvals.";
        marketSummary = "The crypto market is experiencing a strong uptrend driven by institutional investments in Bitcoin and Ethereum ETFs. Investor sentiment remains highly optimistic.";
        marketImage = "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

        // DeFi
        defiRaw = "Uniswap v4 hooks gain traction. Total Value Locked (TVL) across DeFi protocols hits new yearly high.";
        defiSummary = "Decentralized Finance is seeing renewed interest with the introduction of advanced AMM features and rising TVL, signaling returning liquidity to on-chain markets.";
        defiImage = "https://images.unsplash.com/photo-1639762681057-408e52192e55?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

        // AI
        aiRaw = "Ritual Network deploys new LLM precompiles. AI agents are now autonomously trading and managing portfolios on-chain.";
        aiSummary = "The intersection of Artificial Intelligence and Web3 is accelerating, with autonomous agents leveraging decentralized infrastructure to execute complex on-chain operations.";
        aiImage = "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

        emit DataFetched(200, marketRaw);
        emit SummaryGenerated(marketSummary);
    }

    receive() external payable {}
}
