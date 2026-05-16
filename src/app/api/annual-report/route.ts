import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { anthropic, MODEL, textFromBlocks } from "@/lib/anthropic";

export async function POST(req: Request) {
  const userId = await requireUser();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { prospectId, company } = (await req.json()) as { prospectId?: string; company?: string };
  if (!company || !company.trim()) {
    return NextResponse.json({ error: "company required" }, { status: 400 });
  }

  const prompt = `You are a research assistant for an enterprise cybersecurity sales team at Hack The Box.

Search for the most recent annual report or 10-K filing for: ${company}

Return a SHORT structured summary with ONLY these sections, max 2-3 bullet points each:

- PRIORITIES: Top 3 org priorities
- CYBERSECURITY: Key cyber/security mentions
- COMPLIANCE: Frameworks mentioned (ISO 27001, SOC 2, GDPR etc)
- SECURITY INVESTMENTS: Budget or tooling investments
- RISKS: Key cyber risk disclosures

Keep it concise. No long paragraphs. Bullets only.`;

  try {
    const res = await anthropic().messages.create({
      model: MODEL,
      max_tokens: 1500,
      tools: [{ type: "web_search_20250305", name: "web_search" } as never],
      messages: [{ role: "user", content: prompt }],
    });
    const text = textFromBlocks(res.content);

    if (prospectId) {
      const owned = await prisma.prospect.findFirst({ where: { id: prospectId, userId }, select: { id: true } });
      if (owned) {
        await prisma.prospect.update({
          where: { id: prospectId },
          data: { annualReport: text, researchCompany: company },
        });
      }
    }
    return NextResponse.json({ text, company });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
