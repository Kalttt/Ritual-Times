const fs = require('fs');

const HF_TOKEN = process.env.HF_TOKEN;
const REPO_ID = 'kalttt/the-ritual-times';

const systemPrompt = `You are an elite cryptocurrency journalist and market analyst for "The Ritual Times".
Your job is to read current trends (if any tools are provided) or use your knowledge to generate a high-quality newspaper edition.
You MUST strictly output a raw JSON array containing exactly one object with the following fields:
[
  {
    "marketSummary": "A 2-sentence summary of the overall crypto market...",
    "defiSummary": "A 2-sentence summary of DeFi...",
    "aiSummary": "A 2-sentence summary of AI in Web3...",
    "communitySummary": "A 2-sentence summary of community dramas or scams..."
  }
]
Do NOT include markdown formatting or backticks around the JSON.`;

async function uploadToHF() {
    try {
        console.log("Checking if repo exists...");
        const checkRes = await fetch(`https://huggingface.co/api/models/${REPO_ID}`, {
            headers: { 'Authorization': `Bearer ${HF_TOKEN}` }
        });
        
        if (checkRes.status === 404) {
            console.log("Repo does not exist. Creating...");
            const createRes = await fetch('https://huggingface.co/api/repos/create', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${HF_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'model',
                    name: REPO_ID.split('/')[1],
                    private: false
                })
            });
            if (!createRes.ok) {
                console.error("Failed to create repo:", await createRes.text());
            } else {
                console.log("Repo created.");
            }
        }

        const { uploadFile } = await import('@huggingface/hub');
        
        await uploadFile({
            repo: { type: 'model', name: REPO_ID },
            credentials: { accessToken: HF_TOKEN },
            file: {
                path: 'system-prompt.txt',
                content: new Blob([systemPrompt], { type: 'text/plain' })
            },
            commitTitle: 'Update system prompt for Sovereign Agent'
        });
        
        console.log("system-prompt.txt uploaded successfully!");
    } catch (e) {
        console.error("Error uploading to HuggingFace:", e);
    }
}

uploadToHF();
