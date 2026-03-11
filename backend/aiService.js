import { GoogleGenerativeAI } from '@google/generative-ai';

export async function generateSummary(dataString) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY environment variable not set. Returning dummy summary.");
    return "This is a dummy summary. To get an actual AI summary, provide a GEMINI_API_KEY environment variable.";
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `Analyze the following sales dataset and generate a short executive summary including:
- top performing product category
- best performing region
- revenue insights
- trends or anomalies

Sales Data Sample:
${dataString}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (err) {
    throw new Error(`Gemini API Error: ${err.message}`);
  }
}
