import { publicClient, REPORTER_ABI, REPORTER_ADDRESS } from '@/lib/ritualClient';
import Image from 'next/image';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function Home() {
  const renderParagraphs = (text: string) => {
    if (!text) return null;
    return text.split('\n').filter((p: string) => p.trim() !== '').map((p: string, i: number) => (
      <p key={i} style={{ marginBottom: '1rem', textIndent: '1.5rem', lineHeight: '1.6' }}>{p}</p>
    ));
  };
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
      data.status = "LIVE (MOCK DATA)";
      data.marketImage = "https://images.cointelegraph.com/cdn-cgi/image/format=auto,onerror=redirect,quality=90,width=717/https://s3.cointelegraph.com/uploads/2023-11/c9f9660d-0348-43d9-ab70-65004312abf2.jpg";
      data.marketSummary = "Thị trường tiền điện tử hôm nay chứng kiến sự phục hồi mạnh mẽ sau chuỗi ngày điều chỉnh sâu. Giá Bitcoin (BTC) đã có lúc vượt qua ngưỡng kháng cự $65,000 một cách đầy thuyết phục, kéo theo sắc xanh lan tỏa toàn bộ thị trường altcoin. Động thái này được cho là nhờ vào những báo cáo kinh tế vĩ mô tích cực từ Mỹ và sự tham gia mạnh mẽ của các quỹ ETF.\n\nNhiều nhà phân tích cho rằng nếu BTC giữ vững mức này trong phiên đóng cửa tuần, chúng ta có thể sẽ thấy một chu kỳ tăng giá mới (bull run) được kích hoạt sớm hơn dự kiến. Các đồng tiền top đầu như Ethereum (ETH) và Solana (SOL) cũng ghi nhận mức tăng lần lượt là 5% và 8% trong 24 giờ qua.\n\nBên cạnh đó, dòng tiền đang có dấu hiệu luân chuyển từ các dự án vốn hóa lớn sang nhóm memecoin và các dự án gameFi, báo hiệu sự trở lại của khẩu vị rủi ro cao trong giới đầu tư bán lẻ. Khối lượng giao dịch trên các sàn phi tập trung (DEX) cũng tăng vọt hơn 30%.";

      data.defiImage = "https://images.cointelegraph.com/cdn-cgi/image/format=auto,onerror=redirect,quality=90,width=717/https://s3.cointelegraph.com/uploads/2024-01/ab6419d8-c922-446d-986c-ba3fcb2b2b1a.jpg";
      data.defiSummary = "Tổng giá trị khóa (TVL) trong mảng Tài chính Phi tập trung (DeFi) tiếp tục đạt đỉnh mới, vượt qua mốc 100 tỷ USD. Động lực chính cho sự bùng nổ này đến từ các nền tảng Liquid Restaking như EigenLayer và Ether.fi, thu hút hàng tỷ USD vốn nhàn rỗi nhờ vào lợi suất hấp dẫn.\n\nKhông chỉ trên Ethereum, các blockchain như Solana và Base cũng ghi nhận sự trỗi dậy mạnh mẽ của các giao thức lending và AMM thế hệ mới. Các dự án này liên tục tung ra các chương trình điểm thưởng (points) và airdrop để tranh giành thị phần, tạo nên một 'mùa hè DeFi 2.0' đầy sôi động.\n\nTuy nhiên, sự phát triển quá nóng cũng đi kèm với rủi ro. Các chuyên gia bảo mật cảnh báo về việc tái thế chấp (restaking) quá mức có thể tạo ra rủi ro hệ thống kiểu domino. Nhà đầu tư được khuyến cáo nên đa dạng hóa rủi ro và không nên mù quáng đuổi theo lợi suất cao mà bỏ qua việc kiểm tra audit của dự án.";

      data.aiImage = "https://images.cointelegraph.com/cdn-cgi/image/format=auto,onerror=redirect,quality=90,width=717/https://s3.cointelegraph.com/uploads/2024-02/952cd37d-304b-44ec-b91c-7f5eecc9492f.jpg";
      data.aiSummary = "Xu hướng kết hợp AI và Web3 (AI x Crypto) đang trở thành tâm điểm chú ý lớn nhất của chu kỳ này. Hàng loạt các dự án lớn công bố việc tích hợp mô hình ngôn ngữ lớn (LLM) và học máy trực tiếp vào Smart Contract, mở ra khả năng tự động hóa và ra quyết định thông minh hoàn toàn trên chuỗi (on-chain).\n\nĐiển hình là Ritual Chain, một mạng lưới chuyên biệt dành riêng cho việc thực thi AI phi tập trung, vừa công bố những bản cập nhật mới nhất cho phép các Agent tự động đọc tin tức, phân tích dữ liệu và tự động giao dịch mà không cần sự can thiệp của con người. Các mô hình AI hiện có thể chạy hoàn toàn trong môi trường thực thi tin cậy (TEE), đảm bảo tính minh bạch và chống giả mạo.\n\nSự quan tâm của các quỹ đầu tư mạo hiểm vào mảng này đang ở mức cao nhất mọi thời đại. Nhiều dự án AI-crypto dù chỉ mới ở giai đoạn testnet đã định giá lên tới hàng tỷ USD. Các chuyên gia dự đoán AI sẽ là chất xúc tác lớn nhất đẩy thị trường tiền mã hóa tiến tới giai đoạn phổ cập (mass adoption) trong vài năm tới.";

      data.communityImage = "https://images.cointelegraph.com/cdn-cgi/image/format=auto,onerror=redirect,quality=90,width=717/https://s3.cointelegraph.com/uploads/2023-08/1fa5afba-17dc-401c-92b1-d57f00bf754a.jpg";
      data.communitySummary = "Cộng đồng tiền mã hóa hôm nay đang xôn xao bàn tán về vụ việc một nền tảng cross-chain bridge vừa bị hacker tấn công, cuỗm đi khối lượng tài sản trị giá hơn 50 triệu USD. Kẻ tấn công đã lợi dụng một lỗ hổng trong quá trình xác thực đa chữ ký (multi-sig) để rút tiền.\n\nNgay sau sự việc, các chuyên gia bảo mật on-chain đã nhanh chóng vào cuộc truy vết dòng tiền và phát hiện hacker đang cố gắng rửa tiền thông qua các mixer như Tornado Cash. Sự việc một lần nữa dấy lên hồi chuông cảnh báo về tính an toàn của các cầu nối liên chuỗi, vốn luôn là miếng mồi ngon cho tội phạm mạng.\n\nBên cạnh những tin tức tiêu cực, cộng đồng mạng cũng đang háo hức chờ đợi đợt airdrop khủng từ dự án Layer-2 sắp ra mắt vào cuối tuần này. Hàng ngàn người dùng đã tích cực 'cày cuốc' on-chain suốt nhiều tháng qua và hy vọng sẽ nhận được một phần thưởng xứng đáng. Cảnh báo lừa đảo (phishing) mạo danh trang nhận airdrop cũng đã bắt đầu xuất hiện dày đặc trên X (Twitter).";
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
          <div className={`status-badge ${data.status.includes("LIVE") ? "status-live" : ""}`}>
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
            <div className="summary-content">{renderParagraphs(data.marketSummary)}</div>
          </article>

          <article className="article side-article" style={{ marginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)' }}>Community Watch: Scams & Security</h2>
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
            <h3>DeFi TVL Surges</h3>
            <div className="author">By Oracle Bot</div>
            {data.defiImage && (
              <div className="article-image-container">
                <img src={data.defiImage} alt="DeFi" className="article-image" />
              </div>
            )}
            <div className="summary-content">{renderParagraphs(data.defiSummary)}</div>
          </article>

          <article className="article side-article">
            <h3>AI & Web3 Integration</h3>
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
  );
}
