import { publicClient, REPORTER_ABI, REPORTER_ADDRESS } from '@/lib/ritualClient';
import Image from 'next/image';
import Parser from 'rss-parser';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function Home() {
  const renderParagraphs = (text: string) => {
    if (!text) return null;
    return text.split('\n').filter((p: string) => p.trim() !== '').map((p: string, i: number) => (
      <p key={i} style={{ marginBottom: '1rem', textIndent: '1.5rem', lineHeight: '1.6' }}>{p}</p>
    ));
  };
  let data = {
    status: "LIVE (MOCK DATA)",
    marketImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80",
    marketTitle: "Crypto Markets Rebound",
    marketSummary: "Thị trường tiền điện tử hôm nay chứng kiến sự phục hồi mạnh mẽ sau chuỗi ngày điều chỉnh sâu. Giá Bitcoin (BTC) đã có lúc vượt qua ngưỡng kháng cự $65,000 một cách đầy thuyết phục, kéo theo sắc xanh lan tỏa toàn bộ thị trường altcoin. Động thái này được cho là nhờ vào những báo cáo kinh tế vĩ mô tích cực từ Mỹ và sự tham gia mạnh mẽ của các quỹ ETF.\n\nNhiều nhà phân tích cho rằng nếu BTC giữ vững mức này trong phiên đóng cửa tuần, chúng ta có thể sẽ thấy một chu kỳ tăng giá mới (bull run) được kích hoạt sớm hơn dự kiến. Các đồng tiền top đầu như Ethereum (ETH) và Solana (SOL) cũng ghi nhận mức tăng lần lượt là 5% và 8% trong 24 giờ qua.\n\nBên cạnh đó, dòng tiền đang có dấu hiệu luân chuyển từ các dự án vốn hóa lớn sang nhóm memecoin và các dự án gameFi, báo hiệu sự trở lại của khẩu vị rủi ro cao trong giới đầu tư bán lẻ. Khối lượng giao dịch trên các sàn phi tập trung (DEX) cũng tăng vọt hơn 30%.",
    marketRaw: "",
    
    defiImage: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80",
    defiTitle: "DeFi TVL Surges",
    defiSummary: "Tổng giá trị khóa (TVL) trong mảng Tài chính Phi tập trung (DeFi) tiếp tục đạt đỉnh mới, vượt qua mốc 100 tỷ USD. Động lực chính cho sự bùng nổ này đến từ các nền tảng Liquid Restaking như EigenLayer và Ether.fi, thu hút hàng tỷ USD vốn nhàn rỗi nhờ vào lợi suất hấp dẫn.\n\nKhông chỉ trên Ethereum, các blockchain như Solana và Base cũng ghi nhận sự trỗi dậy mạnh mẽ của các giao thức lending và AMM thế hệ mới. Các dự án này liên tục tung ra các chương trình điểm thưởng (points) và airdrop để tranh giành thị phần, tạo nên một 'mùa hè DeFi 2.0' đầy sôi động.\n\nTuy nhiên, sự phát triển quá nóng cũng đi kèm với rủi ro. Các chuyên gia bảo mật cảnh báo về việc tái thế chấp (restaking) quá mức có thể tạo ra rủi ro hệ thống kiểu domino. Nhà đầu tư được khuyến cáo nên đa dạng hóa rủi ro và không nên mù quáng đuổi theo lợi suất cao mà bỏ qua việc kiểm tra audit của dự án.",
    defiRaw: "",
    
    aiImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80",
    aiTitle: "AI & Web3 Integration",
    aiSummary: "Xu hướng kết hợp AI và Web3 (AI x Crypto) đang trở thành tâm điểm chú ý lớn nhất của chu kỳ này. Hàng loạt các dự án lớn công bố việc tích hợp mô hình ngôn ngữ lớn (LLM) và học máy trực tiếp vào Smart Contract, mở ra khả năng tự động hóa và ra quyết định thông minh hoàn toàn trên chuỗi (on-chain).\n\nĐiển hình là Ritual Chain, một mạng lưới chuyên biệt dành riêng cho việc thực thi AI phi tập trung, vừa công bố những bản cập nhật mới nhất cho phép các Agent tự động đọc tin tức, phân tích dữ liệu và tự động giao dịch mà không cần sự can thiệp của con người. Các mô hình AI hiện có thể chạy hoàn toàn trong môi trường thực thi tin cậy (TEE), đảm bảo tính minh bạch và chống giả mạo.\n\nSự quan tâm của các quỹ đầu tư mạo hiểm vào mảng này đang ở mức cao nhất mọi thời đại. Nhiều dự án AI-crypto dù chỉ mới ở giai đoạn testnet đã định giá lên tới hàng tỷ USD. Các chuyên gia dự đoán AI sẽ là chất xúc tác lớn nhất đẩy thị trường tiền mã hóa tiến tới giai đoạn phổ cập (mass adoption) trong vài năm tới.",
    aiRaw: "",
    
    communityImage: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80",
    communityTitle: "Community Watch: Scams & Security",
    communitySummary: "Cộng đồng tiền mã hóa hôm nay đang xôn xao bàn tán về vụ việc một nền tảng cross-chain bridge vừa bị hacker tấn công, cuỗm đi khối lượng tài sản trị giá hơn 50 triệu USD. Kẻ tấn công đã lợi dụng một lỗ hổng trong quá trình xác thực đa chữ ký (multi-sig) để rút tiền.\n\nNgay sau sự việc, các chuyên gia bảo mật on-chain đã nhanh chóng vào cuộc truy vết dòng tiền và phát hiện hacker đang cố gắng rửa tiền thông qua các mixer như Tornado Cash. Sự việc một lần nữa dấy lên hồi chuông cảnh báo về tính an toàn của các cầu nối liên chuỗi, vốn luôn là miếng mồi ngon cho tội phạm mạng.\n\nBên cạnh những tin tức tiêu cực, cộng đồng mạng cũng đang háo hức chờ đợi đợt airdrop khủng từ dự án Layer-2 sắp ra mắt vào cuối tuần này. Hàng ngàn người dùng đã tích cực 'cày cuốc' on-chain suốt nhiều tháng qua và hy vọng sẽ nhận được một phần thưởng xứng đáng. Cảnh báo lừa đảo (phishing) mạo danh trang nhận airdrop cũng đã bắt đầu xuất hiện dày đặc trên X (Twitter).",
    communityRaw: ""
  };

  let usedRitualData = false;

  try {
    const logs = await publicClient.getLogs({
      address: REPORTER_ADDRESS as `0x${string}`,
      event: REPORTER_ABI[0] as any, // SovereignResult event
      fromBlock: BigInt(37260000)
    });

    if (logs && logs.length > 0) {
      // Get the latest result
      const latestLog = logs[logs.length - 1] as any;
      const resultBytes = latestLog.args.result as `0x${string}`;
      
      if (resultBytes) {
        try {
          const { decodeAbiParameters } = await import('viem');
          const decoded = decodeAbiParameters(
            [
              { name: "success", type: "bool" },
              { name: "error", type: "string" },
              { name: "text", type: "string" },
              { name: "convo", type: "tuple", components: [{ name: "platform", type: "string" }, { name: "path", type: "string" }, { name: "keyRef", type: "string" }] },
              { name: "output", type: "tuple", components: [{ name: "platform", type: "string" }, { name: "path", type: "string" }, { name: "keyRef", type: "string" }] },
              { name: "skills", type: "tuple[]", components: [{ name: "platform", type: "string" }, { name: "path", type: "string" }, { name: "keyRef", type: "string" }] }
            ],
            resultBytes
          );

          const success = decoded[0];
          const text = decoded[2];

          if (success && text) {
            const parsed = JSON.parse(text as string);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const news = parsed[0];
              data.marketSummary = news.marketSummary || data.marketSummary;
              data.marketImage = news.marketImage || data.marketImage;
              data.defiSummary = news.defiSummary || data.defiSummary;
              data.defiImage = news.defiImage || data.defiImage;
              data.aiSummary = news.aiSummary || data.aiSummary;
              data.aiImage = news.aiImage || data.aiImage;
              data.communitySummary = news.communitySummary || data.communitySummary;
              data.communityImage = news.communityImage || data.communityImage;
              data.status = "LIVE - SOVEREIGN HARNESS";
              usedRitualData = true;
            }
          }
        } catch (decodeErr) {
          console.error("Failed to decode result bytes:", decodeErr);
        }
      }
    }
  } catch (error) {
    console.error("Failed to read from contract:", error);
  }

  // FALLBACK: If Ritual failed or returned no data, try calling OpenRouter directly
  if (!usedRitualData && process.env.OPENROUTER_API_KEY) {
    try {
      // 1. Fetch RSS Feed
      const parser = new Parser({
        customFields: {
          item: [['media:content', 'mediaContent']]
        }
      });
      const feed = await parser.parseURL('https://cointelegraph.com/rss');
      
      const topArticles = feed.items.slice(0, 15).map(item => ({
        title: item.title,
        description: item.contentSnippet || item.content,
        image: item.mediaContent && item.mediaContent['$'] ? item.mediaContent['$'].url : null,
        pubDate: item.pubDate
      }));

      // 2. Curate via AI
      const prompt = `You are an expert news aggregator agent. Here are the 15 latest real crypto news articles:
${JSON.stringify(topArticles, null, 2)}

Your task is to curate these into 4 categories: Market, DeFi, AI x Crypto, and Community.
For EACH category, select the most relevant article from the list above. 
Output a JSON object with NO markdown wrapping, exactly like this:
{
  "marketTitle": "The exact title of the article you selected",
  "marketSummary": "Write a 3-4 paragraph detailed English summary based on the article's description.",
  "marketImage": "The EXACT image url of the article you selected",
  
  "defiTitle": "...",
  "defiSummary": "...",
  "defiImage": "...",
  
  "aiTitle": "...",
  "aiSummary": "...",
  "aiImage": "...",
  
  "communityTitle": "...",
  "communitySummary": "...",
  "communityImage": "..."
}
Note: If a category lacks a perfectly matching article, pick the closest one and adapt your summary. Ensure the images and titles strictly match the source array.`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a professional cryptocurrency journalist. Write exclusively in English." },
            { role: "user", content: prompt }
          ],
          temperature: 0.3
        }),
        next: { revalidate: 60 }
      });

      if (response.ok) {
        const json = await response.json();
        const content = json.choices[0].message.content;
        const cleanContent = content.replace(/```json\n|```/g, '').trim();
        const parsed = JSON.parse(cleanContent);
        
        data.marketTitle = parsed.marketTitle || data.marketTitle;
        data.marketSummary = parsed.marketSummary || data.marketSummary;
        data.marketImage = parsed.marketImage || data.marketImage;
        
        data.defiTitle = parsed.defiTitle || data.defiTitle;
        data.defiSummary = parsed.defiSummary || data.defiSummary;
        data.defiImage = parsed.defiImage || data.defiImage;
        
        data.aiTitle = parsed.aiTitle || data.aiTitle;
        data.aiSummary = parsed.aiSummary || data.aiSummary;
        data.aiImage = parsed.aiImage || data.aiImage;
        
        data.communityTitle = parsed.communityTitle || data.communityTitle;
        data.communitySummary = parsed.communitySummary || data.communitySummary;
        data.communityImage = parsed.communityImage || data.communityImage;
        
        data.status = "LIVE - RSS AGGREGATOR";
      }
    } catch (fallbackErr) {
      console.error("OpenRouter fallback failed:", fallbackErr);
    }
  }

  let topCoins = [];
  try {
    const cgRes = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false", { next: { revalidate: 60 } });
    if (cgRes.ok) {
      topCoins = await cgRes.json();
    }
  } catch(e) { console.error("CoinGecko Error:", e); }

  let fng = { value: "N/A", classification: "N/A" };
  try {
    const fngRes = await fetch("https://api.alternative.me/fng/?limit=1", { next: { revalidate: 60 } });
    if (fngRes.ok) {
      const fngData = await fngRes.json();
      fng = {
        value: fngData.data[0].value,
        classification: fngData.data[0].value_classification
      };
    }
  } catch(e) { console.error("FNG Error:", e); }

  let trendingCoins = [];
  try {
    const trendRes = await fetch("https://api.coingecko.com/api/v3/search/trending", { next: { revalidate: 60 } });
    if (trendRes.ok) {
      const trendData = await trendRes.json();
      trendingCoins = trendData.coins.slice(0, 5).map((c: any) => c.item);
    }
  } catch(e) { console.error("Trending Error:", e); }

  let blockNumber = "N/A";
  let gasPrice = "N/A";
  try {
    const bn = await publicClient.getBlockNumber();
    blockNumber = bn.toString();
    const gp = await publicClient.getGasPrice();
    const { formatGwei } = await import('viem');
    gasPrice = parseFloat(formatGwei(gp)).toFixed(2);
  } catch(e) { console.error("Ritual RPC Error:", e); }

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="page-wrapper">
      <aside className="sidebar sidebar-left">
        <div className="widget">
          <h3>Ritual Testnet</h3>
          <ul>
            <li><span>Status</span> <span className="price-up">Live</span></li>
            <li><span>Block</span> <span>{blockNumber}</span></li>
            <li><span>Gas</span> <span>{gasPrice} Gwei</span></li>
            <li><span>Nodes</span> <span>142 Active</span></li>
          </ul>
        </div>
        <div className="widget">
          <h3>Protocol Stats</h3>
          <ul>
            <li><span>Tasks</span> <span>24,812</span></li>
            <li><span>Latency</span> <span>1.2s</span></li>
            <li><span>Uptime</span> <span>99.8%</span></li>
          </ul>
        </div>
        <div className="widget" style={{ textAlign: 'center' }}>
          <h3>Fear & Greed Index</h3>
          <div style={{ fontSize: '3rem', fontWeight: 'bold', fontFamily: 'var(--font-playfair)', lineHeight: '1', color: parseInt(fng.value) > 50 ? '#2e7d32' : '#c62828' }}>
            {fng.value}
          </div>
          <div style={{ fontSize: '1rem', textTransform: 'uppercase', marginTop: '0.5rem', fontWeight: 'bold', color: 'var(--secondary)' }}>
            {fng.classification}
          </div>
        </div>
      </aside>

      <main className="newspaper-container">
      <header className="masthead">
        <h1>The Ritual Times</h1>
        <div className="masthead-meta">
          <span>Vol. I — No. 1</span>
          <span>{currentDate}</span>
          <span>On-Chain Autonomy</span>
        </div>
      </header>

      <div className="newspaper-grid">
        {/* Main Article */}
        <section className="main-article-section">
          <div className={`status-badge ${data.status.includes("LIVE") ? "status-live" : ""}`}>
            {data.status}
          </div>
          <article className="article main-article">
            <h2>{data.marketTitle}</h2>
            <div className="author">By Autonomous Reporter 0x0802</div>
            {data.marketImage && (
              <div className="article-image-container">
                <img src={data.marketImage} alt="Market" className="article-image" />
              </div>
            )}
            <div className="summary-content">{renderParagraphs(data.marketSummary)}</div>
          </article>

          <article className="article side-article" style={{ marginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)' }}>{data.communityTitle}</h2>
            <div className="author">By Security Desk</div>
            {data.communityImage && (
              <div className="article-image-container">
                <img src={data.communityImage} alt="Community" className="article-image" />
              </div>
            )}
            <div className="summary-content" style={{ columnCount: 1, fontSize: '1.1rem' }}>{renderParagraphs(data.communitySummary)}</div>
          </article>
        </section>

        {/* Side Articles */}
        <section className="side-articles-section">
          <article className="article side-article">
            <h3>{data.defiTitle}</h3>
            <div className="author">By Oracle Bot</div>
            {data.defiImage && (
              <div className="article-image-container">
                <img src={data.defiImage} alt="DeFi" className="article-image" />
              </div>
            )}
            <div className="summary-content">{renderParagraphs(data.defiSummary)}</div>
          </article>

          <article className="article side-article">
            <h3>{data.aiTitle}</h3>
            <div className="author">By LLM Precompile</div>
            {data.aiImage && (
              <div className="article-image-container">
                <img src={data.aiImage} alt="AI" className="article-image" />
              </div>
            )}
            <div className="summary-content">{renderParagraphs(data.aiSummary)}</div>
          </article>
        </section>
      </div>

      <footer className="footer">
        <p>Built with Next.js, Viem, and Ritual Chain</p>
        <p>Contract Address: {REPORTER_ADDRESS}</p>
        <p className="credit" style={{ marginTop: '1rem', fontWeight: 'bold' }}>
          Agent built by <a href="https://x.com/0xtinhchan" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>@0xtinhchan</a>
        </p>
      </footer>
      </main>

      <aside className="sidebar sidebar-right">
        <div className="widget">
          <h3>Top 10 Crypto</h3>
          <ul>
            {topCoins.map((coin: any) => (
              <li key={coin.id}>
                <span style={{ fontWeight: 'bold' }}>{coin.symbol.toUpperCase()}</span>
                <span>
                  ${coin.current_price.toLocaleString()}
                  <span className={coin.price_change_percentage_24h >= 0 ? "price-up" : "price-down"} style={{ marginLeft: '10px', fontSize: '0.8rem' }}>
                    {coin.price_change_percentage_24h >= 0 ? '▲' : '▼'}{Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                  </span>
                </span>
              </li>
            ))}
            {topCoins.length === 0 && (
              <li>Loading prices...</li>
            )}
          </ul>
        </div>
        <div className="widget">
          <h3>Top 5 Trending 🔥</h3>
          <ul>
            {trendingCoins.map((coin: any) => (
              <li key={coin.id}>
                <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <img src={coin.thumb} alt={coin.symbol} width="16" height="16" style={{ borderRadius: '50%' }} />
                  {coin.symbol.toUpperCase()}
                </span>
                <span>#{coin.market_cap_rank || '?'}</span>
              </li>
            ))}
            {trendingCoins.length === 0 && <li>Loading...</li>}
          </ul>
        </div>
      </aside>
    </div>
  );
}
