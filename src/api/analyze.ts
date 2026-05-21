import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { imageBase64 } = req.body;
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: `You are LabLens, an AI that helps patients understand their medical lab results in plain simple language. Read the lab result image carefully. Identify key tests and values. Explain what each result means in simple everyday language. Indicate if values are normal, slightly off, or concerning. Tell the patient whether they should see a doctor. Format your response like this:
**Summary:** [2-3 sentence plain English overview]
**Key Findings:**
- [Test name]: [Value] — [Plain language meaning] — [Normal/Slightly elevated/Low/Concerning]
**Should you see a doctor?** [Yes/No and why]
**Important note:** LabLens is an educational tool only. Always confirm with a licensed healthcare professional.`,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } },
            { type: "text", text: "Analyze this lab result in plain simple language." }
          ]
        }]
      })
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
}