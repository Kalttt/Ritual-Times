import { publicClient, REPORTER_ABI, REPORTER_ADDRESS } from '@/lib/ritualClient';
import Image from 'next/image';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function Home() {
  let data = {
    marketSummary: "Awaiting...", marketRaw: "Awaiting...", marketImage: "",
    defiSummary: "Awaiting...", defiRaw: "Awaiting...", defiImage: "",
    aiSummary: "Awaiting...", aiRaw: "Awaiting...", aiImage: "",
    status: "DEPLOYING"
  };

  try {
    const keys = [
      'marketSummary', 'marketRaw', 'marketImage',
      'defiSummary', 'defiRaw', 'defiImage',
      'aiSummary', 'aiRaw', 'aiImage'
    ];

    const results = await Promise.all(
      keys.map(key => publicClient.readContract({
        address: REPORTER_ADDRESS as `0x${string}`,
        abi: REPORTER_ABI,
        functionName: key as any,
      }))
    );

    keys.forEach((key, index) => {
      if (results[index]) (data as any)[key] = results[index] as string;
    });

    if (data.marketSummary && data.marketSummary !== "Awaiting...") {
      data.status = "LIVE";
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
            <div className="raw-feed-box">
              <strong>Raw Feed:</strong> {data.marketRaw}
            </div>
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
