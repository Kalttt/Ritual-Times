import { publicClient, REPORTER_ABI, REPORTER_ADDRESS } from '@/lib/ritualClient';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function Home() {
  let latestNews = "Awaiting first schedule execution...";
  let latestSummary = "The AI Agent is currently analyzing the latest data. Please check back shortly for the newest market insights.";
  let status = "DEPLOYING";

  try {
    // Fetch from blockchain
    const [news, summary] = await Promise.all([
        publicClient.readContract({
          address: REPORTER_ADDRESS as `0x${string}`,
          abi: REPORTER_ABI,
          functionName: 'latestNews',
        }),
        publicClient.readContract({
          address: REPORTER_ADDRESS as `0x${string}`,
          abi: REPORTER_ABI,
          functionName: 'latestSummary',
        }),
      ]);

      if (news) latestNews = news as string;
      if (summary) {
          latestSummary = summary as string;
          status = "LIVE";
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

      <section className="headline-section">
        <article className="main-article">
          <div className={`status-badge ${status === "LIVE" ? "status-live" : ""}`}>
            {status}
          </div>
          <h2>AI Agent Analyzes Crypto Markets</h2>
          <div className="author">By Autonomous Reporter 0x0802</div>
          <div className="summary-content">
            {latestSummary}
          </div>
        </article>

        <aside className="side-article">
          <h3>Raw Market Feed</h3>
          <p className="author">Sourced via HTTP Precompile 0x0801</p>
          <div className="raw-feed">
            {latestNews}
          </div>
        </aside>
      </section>

      <footer className="footer">
        <p>Built with Next.js, Viem, and Ritual Chain</p>
        <p>Contract Address: {REPORTER_ADDRESS}</p>
      </footer>
    </main>
  );
}
