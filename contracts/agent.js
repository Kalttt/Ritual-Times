const { createWalletClient, createPublicClient, http, defineChain } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const Parser = require('rss-parser');
require('dotenv').config({ path: '../.env' });

const parser = new Parser();

// Configure blockchain
const pk = process.env.PRIVATE_KEY.startsWith('0x') ? process.env.PRIVATE_KEY : '0x' + process.env.PRIVATE_KEY;
const account = privateKeyToAccount(pk);

const ritualChain = defineChain({
  id: 1979,
  name: 'Ritual',
  nativeCurrency: { name: 'RITUAL', symbol: 'RITUAL', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.ritualfoundation.org'] } }
});

const walletClient = createWalletClient({ account, chain: ritualChain, transport: http() });
const publicClient = createPublicClient({ chain: ritualChain, transport: http() });

const CONTRACT_ADDRESS = '0xcdc70fc6e70edf6927aa1d3b32c5b3cf43016739';
const ABI = [{
  name: 'publishNews',
  type: 'function',
  stateMutability: 'nonpayable',
  inputs: [
    { name: 'category', type: 'uint8' },
    { name: 'raw', type: 'string' },
    { name: 'summary', type: 'string' },
    { name: 'image', type: 'string' }
  ],
  outputs: []
}];

// Clean HTML tags from RSS description
function cleanHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').trim();
}

// Ensure the article is long enough by appending extra paragraphs if needed
function makeLongArticle(title, description, fallbackText) {
    let content = `${title}\n\n${description}`;
    if (content.length < 300) {
        content += `\n\n${fallbackText}`;
    }
    return content;
}

async function fetchAndPublish() {
  console.log(`[${new Date().toISOString()}] Starting news fetch cycle...`);
  
  try {
    // 1. Fetch Market News (Cointelegraph Bitcoin RSS)
    const marketFeed = await parser.parseURL('https://cointelegraph.com/rss/tag/bitcoin');
    const marketItem = marketFeed.items[0];
    const marketSummary = makeLongArticle(
      marketItem.title, 
      cleanHtml(marketItem.contentSnippet || marketItem.content),
      "The Bitcoin market continues to demonstrate resilience as institutional adoption metrics hit new highs. Analysts point to the recent ETF inflows as a primary catalyst for the sustained momentum. However, macroeconomic factors such as interest rate decisions and global inflation data remain key drivers to watch in the coming weeks. Traders are advised to monitor key support and resistance levels closely as volatility is expected to spike during the upcoming trading sessions."
    );
    const marketImage = marketItem.enclosure?.url || "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

    // 2. Fetch DeFi News (Cointelegraph DeFi RSS)
    const defiFeed = await parser.parseURL('https://cointelegraph.com/rss/tag/defi');
    const defiItem = defiFeed.items[0];
    const defiSummary = makeLongArticle(
        defiItem.title,
        cleanHtml(defiItem.contentSnippet || defiItem.content),
        "Decentralized Finance (DeFi) is experiencing a resurgence in Total Value Locked (TVL), driven by innovative yield farming strategies and the rollout of next-generation Automated Market Makers (AMMs). Security remains a top priority for protocol developers following recent high-profile exploits, leading to more rigorous smart contract audits. The integration of real-world assets (RWAs) into DeFi protocols is also opening up new avenues for institutional capital to enter the decentralized ecosystem."
    );
    const defiImage = defiItem.enclosure?.url || "https://images.unsplash.com/photo-1639762681057-408e52192e55?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

    // 3. Fetch AI/Web3 News (Cointelegraph AI RSS)
    const aiFeed = await parser.parseURL('https://cointelegraph.com/rss/tag/ai');
    const aiItem = aiFeed.items[0];
    const aiSummary = makeLongArticle(
        aiItem.title,
        cleanHtml(aiItem.contentSnippet || aiItem.content),
        "The convergence of Artificial Intelligence and Web3 is creating unprecedented opportunities for decentralized applications. Autonomous agents are now capable of executing complex multi-step transactions, managing portfolios, and interacting with smart contracts without human intervention. This paradigm shift relies heavily on secure on-chain infrastructure and cryptographic verification to ensure the integrity of AI-generated outputs. As LLMs become more integrated with blockchain networks, we can expect a new wave of highly intelligent and autonomous decentralized protocols."
    );
    const aiImage = aiItem.enclosure?.url || "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

    // 4. Fetch Community/Regulation News
    const communityFeed = await parser.parseURL('https://cointelegraph.com/rss/tag/regulation');
    const commItem = communityFeed.items[0];
    const commSummary = makeLongArticle(
        commItem.title,
        cleanHtml(commItem.contentSnippet || commItem.content),
        "The crypto community remains on high alert as sophisticated phishing campaigns and smart contract vulnerabilities continue to exploit retail investors. Industry leaders are urging users to adopt stricter security hygiene, including hardware wallets and multi-factor authentication, to safeguard their digital assets against evolving threats. Meanwhile, law enforcement agencies are ramping up their efforts to track illicit on-chain money flows, leading to several high-profile arrests and asset recoveries this quarter."
    );
    const commImage = commItem.enclosure?.url || "https://images.unsplash.com/photo-1593642532744-d377ab507dc8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

    // Publish all 4 categories
    const categories = [
      { id: 0, raw: `Source: ${marketItem.link}`, sum: marketSummary, img: marketImage },
      { id: 1, raw: `Source: ${defiItem.link}`, sum: defiSummary, img: defiImage },
      { id: 2, raw: `Source: ${aiItem.link}`, sum: aiSummary, img: aiImage },
      { id: 3, raw: `Source: ${commItem.link}`, sum: commSummary, img: commImage }
    ];

    for (const cat of categories) {
      console.log(`Publishing category ${cat.id}...`);
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'publishNews',
        args: [cat.id, cat.raw, cat.sum, cat.img]
      });
      await publicClient.waitForTransactionReceipt({ hash });
      console.log(`Successfully published category ${cat.id}. Hash: ${hash}`);
    }

    console.log(`[${new Date().toISOString()}] News update complete! Waiting for next cycle...`);
  } catch (error) {
    console.error('Error during fetch and publish cycle:', error);
  }
}

// Run immediately, then every 5 minutes (300,000 ms)
fetchAndPublish();
setInterval(fetchAndPublish, 5 * 60 * 1000);
