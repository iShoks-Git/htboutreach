import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function anthropic() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export const MODEL = "claude-sonnet-4-5";

export function textFromBlocks(blocks: Anthropic.ContentBlock[]): string {
  return blocks
    .filter((b): b is Anthropic.TextBlock => b.type === "text" && b.text.trim() !== "")
    .map((b) => b.text)
    .join("")
    .trim();
}

export const HTB_VP =
  "Hack The Box (HTB) Enterprise Platform is the leading hands-on cybersecurity upskilling platform, trusted by enterprises, government organisations, and MSSPs. It helps security teams build attack-ready skills through realistic labs, AI-augmented cyber ranges, structured learning paths, and live-fire simulations. HTB benchmarks team capabilities, identifies skill gaps, and measurably reduces breach risk. New content on CVEs, TTPs, and emerging threats is released weekly. Trusted by 4M+ security professionals globally.";
