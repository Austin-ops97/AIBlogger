import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { resolveAnthropicApiKey } from "@/lib/anthropic-key";

async function fetchPageContent(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.statusText}`);
  }

  const html = await response.text();

  // Simple HTML to text extraction
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  // Limit to first 8000 chars to avoid token limits
  return text.slice(0, 8000);
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const apiKey = await resolveAnthropicApiKey();
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "No Anthropic API key. Add one in Admin → Settings or set ANTHROPIC_API_KEY on the server.",
        },
        { status: 503 }
      );
    }

    const client = new Anthropic({ apiKey });

    // Fetch the page content
    let pageContent: string;
    try {
      pageContent = await fetchPageContent(url);
    } catch (error) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${error instanceof Error ? error.message : "Unknown error"}` },
        { status: 400 }
      );
    }

    // Generate blog post using Claude
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `You are a professional tech blogger. I've scraped the content from a webpage and I need you to write a comprehensive, engaging blog post reviewing or discussing the product/service/content at this URL: ${url}

Here's the content from the page:
---
${pageContent}
---

Please write a well-structured blog post that:
1. Has an engaging title (output it as: TITLE: [your title here])
2. Includes a brief excerpt/summary (output it as: EXCERPT: [your excerpt here])
3. Has the main blog post content in Markdown format (output it as: CONTENT: [your content here])

The blog post should:
- Be informative and engaging (600-1200 words)
- Have clear sections with ## headings
- Include a proper introduction and conclusion
- Highlight key features, benefits, or insights
- Be written in a professional but conversational tone
- End with a clear recommendation or takeaway

Format your response EXACTLY like this:
TITLE: [The blog post title]
EXCERPT: [A 1-2 sentence excerpt]
CONTENT:
[The full markdown content]`,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse the structured response
    const titleMatch = responseText.match(/TITLE:\s*(.+)/);
    const excerptMatch = responseText.match(/EXCERPT:\s*(.+)/);
    const contentMatch = responseText.match(/CONTENT:\s*([\s\S]+)/);

    const title = titleMatch ? titleMatch[1].trim() : "AI Generated Review";
    const excerpt = excerptMatch ? excerptMatch[1].trim() : "";
    const content = contentMatch ? contentMatch[1].trim() : responseText;

    return NextResponse.json({
      title,
      excerpt,
      content,
      source_url: url,
    });
  } catch (error) {
    console.error("AI generation error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    const lower = msg.toLowerCase();
    if (
      lower.includes("api key") ||
      lower.includes("x-api-key") ||
      lower.includes("authentication") ||
      msg.includes("401")
    ) {
      return NextResponse.json(
        {
          error:
            "Anthropic rejected the API key. In Admin → Settings, paste the full secret key from console.anthropic.com (starts with sk-ant-), one line, no quotes.",
        },
        { status: 503 }
      );
    }
    if (
      lower.includes("not the expected") ||
      lower.includes("expected string") ||
      lower.includes("invalid_request_error")
    ) {
      return NextResponse.json(
        {
          error:
            "The request was rejected, often because the API key is incomplete or malformed. Copy the entire secret key again (sk-ant-…), with no spaces or line breaks. Do not use a “publishable” key — use the secret key.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Failed to generate blog post" },
      { status: 500 }
    );
  }
}
