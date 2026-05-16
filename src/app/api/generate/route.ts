import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { anthropic, MODEL, textFromBlocks, HTB_VP } from "@/lib/anthropic";

type GenerateBody = { prospectId: string; type: "ice" | "fol" };

function vp(customVp: string | null | undefined): string {
  const trimmed = (customVp ?? "").trim();
  return trimmed || HTB_VP;
}

function researchBlock(p: { annualReport: string | null; researchCompany: string | null; salesNav: string | null }) {
  let block = "";
  if (p.annualReport) block += `\n\nANNUAL REPORT (${p.researchCompany || "company"}):\n${p.annualReport}`;
  if (p.salesNav && p.salesNav.trim()) block += `\n\nSALES NAVIGATOR INSIGHTS:\n${p.salesNav.trim()}`;
  return block;
}

function buildIcePrompt(p: Awaited<ReturnType<typeof prisma.prospect.findUnique>>, customVp: string | null) {
  if (!p) return "";
  return `Generate a short ultra-personalized LinkedIn icebreaker for ${p.name}.

Instructions:
- Prioritise Annual Report and Sales Navigator data as primary personalisation signals.
- Reference a specific insight that proves real research was done.
- End with one bold open question linked to cybersecurity upskilling, informed by their stated priorities.
- Oral, pragmatic tone. No fluff. No em dash. No filler words like impressed or inspiring.
- Never ask for a meeting. Greet in first message only.
- Return ONLY the message text.

What we sell:
${vp(customVp)}

Prospect:
Name: ${p.name}
Headline: ${p.headline || "N/A"}
Location: ${p.location || "N/A"}
Company: ${p.company || "N/A"}
Recent posts: ${p.posts || "N/A"}
Current role: ${p.current || "N/A"}
Past roles: ${p.past || "N/A"}
Skills: ${p.skills || "N/A"}
Education: ${p.edu || "N/A"}
Certifications: ${p.certs || "N/A"}
Accomplishments: ${p.acc || "N/A"}
Recommendations: ${p.recs || "N/A"}
Extra: ${p.extra || "N/A"}${researchBlock(p)}

Generate the icebreaker now.`;
}

function buildFolPrompt(p: Awaited<ReturnType<typeof prisma.prospect.findUnique>>, customVp: string | null) {
  if (!p) return "";
  return `Generate a natural follow-up for a prospect who has not responded. Max 30 words.
Casual, no jargon, reference initial topic, do not acknowledge silence.
If research is available, introduce a fresh angle not in the icebreaker.

What we sell: ${vp(customVp)}
Initial message: ${p.icebreaker || "N/A"}
Prospect: ${p.name}, ${p.headline || ""}, ${p.location || ""}${researchBlock(p)}

Return ONLY the message text.`;
}

export async function POST(req: Request) {
  const userId = await requireUser();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { prospectId, type } = (await req.json()) as GenerateBody;
  if (!prospectId || (type !== "ice" && type !== "fol")) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, customVp: true } });
  if (!user?.name) {
    return NextResponse.json({ error: "Complete your config first." }, { status: 400 });
  }

  const prospect = await prisma.prospect.findFirst({ where: { id: prospectId, userId } });
  if (!prospect) return NextResponse.json({ error: "not found" }, { status: 404 });

  const prompt = type === "ice"
    ? buildIcePrompt(prospect, user.customVp)
    : buildFolPrompt(prospect, user.customVp);

  try {
    const res = await anthropic().messages.create({
      model: MODEL,
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });
    const text = textFromBlocks(res.content);

    const updated = await prisma.prospect.update({
      where: { id: prospect.id },
      data: type === "ice" ? { icebreaker: text } : { followup: text },
    });
    return NextResponse.json({ text, prospect: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
