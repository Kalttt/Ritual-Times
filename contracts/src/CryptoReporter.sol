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

    // Community / Drama / Hacks
    string public communitySummary;
    string public communityRaw;
    string public communityImage;

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

    constructor() {
        owner = msg.sender;
    }

    function depositForFees() external payable {
        IRitualWallet(RITUAL_WALLET).deposit{value: msg.value}(50000);
    }

    // Obsolete fetchNews, fetchData, handleFetchResult, scheduleDailyReport removed
    // Sovereign Harness handles all scheduling and execution

    string public latestSovereignNews;

    function sovereignCallback(uint256 executionIndex, bytes calldata rawOutput) external {
        // We can add access control here to ensure only the Sovereign Harness calls this
        // For testnet, we can leave it open or verify the caller is a harness
        
        (bool hasError, bytes memory completionData, , string memory errorMessage, ) = 
            abi.decode(rawOutput, (bool, bytes, bytes, string, StorageRef));

        if (hasError) {
            emit ErrorOccurred(errorMessage);
            return;
        }

        // Decode CompletionData from standard LLM response format
        (,,,,,,, bytes[] memory choicesData, ) = abi.decode(
            completionData, 
            (string, string, uint256, string, string, string, uint256, bytes[], bytes)
        );

        if (choicesData.length > 0) {
            (, , bytes memory messageData) = abi.decode(choicesData[0], (uint256, string, bytes));
            (, string memory content, , ,) = abi.decode(messageData, (string, string, string, uint256, bytes[]));
            
            latestSovereignNews = content;
            emit SummaryGenerated(content);
        }
    }

    function seedSovereignNews(string calldata news) external onlyOwner {
        latestSovereignNews = news;
    }

    function cancelSchedule() external onlyOwner {
        // Obsolete, Sovereign Harness handles scheduling
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
        } else if (category == 3) {
            communityRaw = raw;
            communitySummary = summary;
            communityImage = image;
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
