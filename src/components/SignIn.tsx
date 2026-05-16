"use client";

import { signIn } from "next-auth/react";

export function SignIn() {
  return (
    <>
      <header>
        <div className="logo">
          <div className="logo-mark">HTB</div>
          <div>
            <div className="logo-text">Hack The Box</div>
            <div className="logo-sub">Outreach Tool</div>
          </div>
        </div>
      </header>
      <div className="login-shell">
        <div className="login-card">
          <h2>Sign in to continue</h2>
          <p>
            Use your LinkedIn account to authenticate. Sales Navigator data is still
            copied from your browser session — LinkedIn does not expose it over public OAuth.
          </p>
          <button className="login-btn" onClick={() => signIn("linkedin", { callbackUrl: "/" })}>
            Sign in with LinkedIn
          </button>
        </div>
      </div>
    </>
  );
}
