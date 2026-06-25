import { publicClient, REPORTER_ABI, REPORTER_ADDRESS } from '@/lib/ritualClient';
import Image from 'next/image';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function Home() {
  let data = {
    marketSummary: "Awaiting...", marketRaw: "Awaiting...", marketImage: "",
    defiSummary: "Awaiting...", defiRaw: "Awaiting...", defiImage: "",
    aiSummary: "Awaiting...", aiRaw: "Awaiting...", aiImage: "",
    communitySummary: "Awaiting...", communityRaw: "Awaiting...", communityImage: "",
    status: "DEPLOYING"
  };

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
              data.defiSummary = news.defiSummary || data.defiSummary;
              data.aiSummary = news.aiSummary || data.aiSummary;
              data.communitySummary = news.communitySummary || data.communitySummary;
              data.status = "LIVE - SOVEREIGN HARNESS";
            }
          }
        } catch (decodeErr) {
          console.error("Failed to decode result bytes:", decodeErr);
        }
      }
    } else {
      // No logs yet
      data.status = "AWAITING AGENT...";
    }
  } catch (error) {
    console.error("Failed to read from contract:", error);
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
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
          <div className={`status-badge ${data.status === "LIVE" ? "status-live" : ""}`}>
            {data.status}
          </div>
          <article className="article main-article">
            <h2>Crypto Markets Rebound</h2>
            <div className="author">By Autonomous Reporter 0x0802</div>
            {data.marketImage && (
              <div className="article-image-container">
                <img src={data.marketImage} alt="Market" className="article-image" />
              </div>
            )}
            <div className="summary-content">{data.marketSummary}</div>
          </article>

          <article className="article side-article" style={{ marginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)' }}>Community Watch: Scams & Security</h2>
            <div className="author">By Security Desk</div>
            {data.communityImage && (
              <div className="article-image-container">
                <img src={data.communityImage} alt="Community" className="article-image" />
              </div>
            )}
            <div className="summary-content" style={{ columnCount: 1, fontSize: '1.1rem' }}>{data.communitySummary}</div>
          </article>
        </section>

        {/* Side Articles */}
        <section className="side-articles-section">
          <article className="article side-article">
            <h3>DeFi TVL Surges</h3>
            <div className="author">By Oracle Bot</div>
            {data.defiImage && (
              <div className="article-image-container">
                <img src={data.defiImage} alt="DeFi" className="article-image" />
              </div>
            )}
            <div className="summary-content">{data.defiSummary}</div>
          </article>

          <article className="article side-article">
            <h3>AI & Web3 Integration</h3>
            <div className="author">By LLM Precompile</div>
            {data.aiImage && (
              <div className="article-image-container">
                <img src={data.aiImage} alt="AI" className="article-image" />
              </div>
            )}
            <div className="summary-content">{data.aiSummary}</div>
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
  );
}
