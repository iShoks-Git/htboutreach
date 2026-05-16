import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userId = await requireUser();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, image: true, team: true, language: true, goal: true, bookingLink: true, customVp: true },
  });
  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const userId = await requireUser();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const data: Record<string, string | null> = {};
  for (const key of ["name", "team", "language", "goal", "bookingLink", "customVp"] as const) {
    if (key in body) data[key] = body[key] ?? null;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: { name: true, team: true, language: true, goal: true, bookingLink: true, customVp: true },
  });
  return NextResponse.json(user);
}
