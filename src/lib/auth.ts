import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [],
  callbacks: {},
};

export async function requireUser() {
  return "local-user";
}
