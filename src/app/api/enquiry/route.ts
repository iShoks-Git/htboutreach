import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { name, email, company, message } = await req.json();
  if (!name || !email || !message) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const SHEET_URL = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (SHEET_URL) {
    await fetch(SHEET_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, company, message, date: new Date().toISOString() }),
    });
  }

  return NextResponse.json({ ok: true });
}
