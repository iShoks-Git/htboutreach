"use client";
import { useState } from "react";

export function EnquiryForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    if (!form.name || !form.email || !form.message) { alert("Please fill in name, email and message."); return; }
    setStatus("loading");
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("success");
    } catch {
      setStatus("error");
      alert("Something went wrong. Please try again.");
      setStatus("idle");
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card">
        <button className="modal-close" onClick={onClose}>✕</button>
        {status === "success" ? (
          <div className="enquiry-success">
            <div className="check">✓</div>
            <h3>Message Sent!</h3>
            <p>Thanks for reaching out. We'll get back to you shortly.</p>
            <button className="btn-p" style={{ marginTop: 20 }} onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <div className="modal-header">
              <h2>Get in Touch</h2>
              <p>Interested in HTB Enterprise? Leave your details and we'll reach out.</p>
            </div>
            <label>Full Name *</label>
            <input value={form.name} onChange={set("name")} placeholder="Jane Doe" />
            <label>Email *</label>
            <input type="email" value={form.email} onChange={set("email")} placeholder="jane@company.com" />
            <label>Company</label>
            <input value={form.company} onChange={set("company")} placeholder="Acme Corp" />
            <label>Message *</label>
            <textarea value={form.message} onChange={set("message")} rows={4} placeholder="Tell us about your security team's needs..." />
            <button
              className="btn-p"
              style={{ width: "100%", marginTop: 20, padding: "12px" }}
              onClick={submit}
              disabled={status === "loading"}
            >
              {status === "loading" ? <><span className="spinner" />Sending...</> : "Send Message"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
