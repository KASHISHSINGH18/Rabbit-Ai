import https from 'https';

/**
 * Call Gemini REST API using Node built-in https module.
 * Avoids SDK fetch() TLS issues inside Alpine Docker containers.
 */
function callGeminiRest(apiKey, prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 30000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode === 429) {
            reject({ code: 429, message: `Rate limit exceeded. Please retry in a moment. (${json.error?.message || 'quota exceeded'})` });
          } else if (json.error) {
            reject({ code: json.error.code, message: json.error.message });
          } else {
            resolve(json.candidates[0].content.parts[0].text);
          }
        } catch (e) {
          reject({ code: 0, message: 'Failed to parse Gemini response: ' + data.slice(0, 200) });
        }
      });
    });

    req.on('error', (e) => reject({ code: 0, message: e.message }));
    req.on('timeout', () => { req.destroy(); reject({ code: 0, message: 'Request timed out' }); });
    req.write(body);
    req.end();
  });
}

export async function generateSummary(dataString) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
    console.warn("GEMINI_API_KEY not set or invalid. Returning dummy summary.");
    return "Dummy AI summary: Best performing category: Electronics. Best region: North America. Set a valid GEMINI_API_KEY for real summaries.";
  }

  const prompt = `Analyze the following sales dataset and generate a short executive summary including:
- top performing product category
- best performing region
- revenue insights
- trends or anomalies

Sales Data Sample:
${dataString}`;

  try {
    const text = await callGeminiRest(apiKey, prompt);
    return text;
  } catch (err) {
    if (err.code === 429) {
      console.warn("Gemini Rate Limit hit. Using fallback summary for demonstration.");
      return "### Executive Sales Summary (Simulated)\n\n" +
             "**Top Product Category:** Electronics (Lead by Smartphone sales)\n" +
             "**Best Performing Region:** North America\n" +
             "**Revenue Insights:** Total revenue shows a 12% increase compared to the previous quarter. High volume in mid-range devices.\n" +
             "**Trends/Anomalies:** Notable spike in remote-work accessories in Europe. \n\n" +
             "*Note: This is a fallback summary because your Gemini API key is currently rate-limited (429).*";
    }
    throw new Error(`Gemini API Error: ${err.message || JSON.stringify(err)}`);
  }
}
