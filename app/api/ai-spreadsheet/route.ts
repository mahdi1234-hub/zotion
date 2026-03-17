import { NextRequest, NextResponse } from "next/server";

const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY || "";
const CEREBRAS_API_URL = "https://api.cerebras.ai/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    const { message, spreadsheetData, headers, action } = await req.json();

    let systemPrompt = `You are an AI assistant integrated into a next-generation spreadsheet application called Zotion Sheets. You have full knowledge of the spreadsheet data and can help users analyze data, create formulas, generate insights, and suggest chart configurations.

Current spreadsheet headers: ${JSON.stringify(headers || [])}
Current spreadsheet data (first 50 rows): ${JSON.stringify((spreadsheetData || []).slice(0, 50))}

You can help with:
1. Data analysis and insights
2. Formula suggestions (SUM, AVERAGE, COUNT, MAX, MIN, IF)
3. Chart recommendations based on the data
4. Data cleaning suggestions
5. Workflow automation ideas
6. Dashboard layout suggestions

When suggesting charts, respond with a JSON block in this format:
\`\`\`chart
{
  "type": "bar" | "line" | "area" | "radial",
  "title": "Chart Title",
  "labelKey": "column name for labels/x-axis",
  "dataKeys": ["column1", "column2"],
  "description": "Brief description"
}
\`\`\`

Always be helpful, concise, and reference the actual data in the spreadsheet.`;

    if (action === "analyze") {
      systemPrompt += "\n\nThe user wants you to analyze the spreadsheet data. Provide key insights, patterns, and recommendations.";
    } else if (action === "suggest-chart") {
      systemPrompt += "\n\nThe user wants chart suggestions. Analyze the data and suggest the best chart types with specific configurations. Always include the chart JSON block.";
    } else if (action === "formula") {
      systemPrompt += "\n\nThe user needs help with spreadsheet formulas. Suggest appropriate formulas based on their request.";
    }

    const response = await fetch(CEREBRAS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CEREBRAS_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-4-scout-17b-16e-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Cerebras API error:", errorText);
      return NextResponse.json(
        { error: "AI service error", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";

    // Parse chart suggestions from the response
    const chartMatch = aiMessage.match(/```chart\n([\s\S]*?)\n```/);
    let chartSuggestion = null;
    if (chartMatch) {
      try {
        chartSuggestion = JSON.parse(chartMatch[1]);
      } catch {
        // ignore parse errors
      }
    }

    return NextResponse.json({
      message: aiMessage,
      chartSuggestion,
    });
  } catch (error) {
    console.error("AI Spreadsheet API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
