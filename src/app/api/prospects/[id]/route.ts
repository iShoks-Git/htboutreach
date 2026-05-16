import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const EDITABLE = [
  "stage",
  "name", "headline", "location", "company", "liurl",
  "posts", "current", "past", "vol",
  "skills", "langs", "edu", "certs", "acc",
  "recs", "extra",
  "annualReport", "researchCompany", "salesNav",
  "icebreaker", "followup",
  "notes",
] as const;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const userId = await requireUser();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const prospect = await prisma.prospect.findFirst({ where: { id: params.id, userId } });
  if (!prospect) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(prospect);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const userId = await requireUser();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const owned = await prisma.prospect.findFirst({ where: { id: params.id, userId }, select: { id: true } });
  if (!owned) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await req.json();
  const data: Record<string, string | null> = {};
  for (const key of EDITABLE) {
    if (key in body) data[key] = body[key] ?? null;
  }

  const prospect = await prisma.prospect.update({ where: { id: params.id }, data });
  return NextResponse.json(prospect);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const userId = await requireUser();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const owned = await prisma.prospect.findFirst({ where: { id: params.id, userId }, select: { id: true } });
  if (!owned) return NextResponse.json({ error: "not found" }, { status: 404 });

  await prisma.prospect.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
