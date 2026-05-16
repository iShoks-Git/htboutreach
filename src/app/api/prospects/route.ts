import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TEXT_FIELDS = [
  "headline", "location", "company", "liurl",
  "posts", "current", "past", "vol",
  "skills", "langs", "edu", "certs", "acc",
  "recs", "extra",
] as const;

export async function GET() {
  const userId = await requireUser();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const prospects = await prisma.prospect.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(prospects);
}

export async function POST(req: Request) {
  const userId = await requireUser();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = (body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const data: Record<string, string | null> = { name };
  for (const key of TEXT_FIELDS) {
    if (key in body) data[key] = body[key] || null;
  }

  const prospect = await prisma.prospect.create({ data: { ...data, name, userId } });
  return NextResponse.json(prospect);
}
