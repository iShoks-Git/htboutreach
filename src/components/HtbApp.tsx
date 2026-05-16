"use client";
import { EnquiryForm } from "./EnquiryForm";
import { useEffect, useMemo, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";

type Stage = "Not Contacted" | "Icebreaker Sent" | "Follow-up Sent" | "Replied" | "Interested" | "Booked";

const STAGES: Stage[] = ["Not Contacted", "Icebreaker Sent", "Follow-up Sent", "Replied", "Interested", "Booked"];
const SBGS: Record<Stage, string> = {
  "Not Contacted": "#1E2A3A", "Icebreaker Sent": "#1e3a5f", "Follow-up Sent": "#3d2e00",
  "Replied": "#2d1b4e", "Interested": "#0d3320", "Booked": "#2a5c00",
};
const SCOLS: Record<Stage, string> = {
  "Not Contacted": "#A4B1CD", "Icebreaker Sent": "#60a5fa", "Follow-up Sent": "#fbbf24",
  "Replied": "#c084fc", "Interested": "#4ade80", "Booked": "#9FEF00",
};

const HTB_VP_DISPLAY = (
  <>
    <strong>HTB Enterprise Platform</strong> is the leading hands-on cybersecurity upskilling platform,
    trusted by enterprises, governments, and MSSPs. It helps security teams build attack-ready skills
    through realistic labs, AI-augmented cyber ranges, structured learning paths, and live-fire
    simulations. HTB benchmarks team capabilities, identifies skill gaps, and measurably reduces breach
    risk, with new content on CVEs and TTPs released weekly.
  </>
);

type Config = {
  name: string | null;
  team: string;
  language: string;
  goal: string;
  bookingLink: string | null;
  customVp: string | null;
};

type Prospect = {
  id: string;
  stage: Stage;
  name: string;
  headline: string | null;
  location: string | null;
  company: string | null;
  liurl: string | null;
  posts: string | null;
  current: string | null;
  past: string | null;
  vol: string | null;
  skills: string | null;
  langs: string | null;
  edu: string | null;
  certs: string | null;
  acc: string | null;
  recs: string | null;
  extra: string | null;
  annualReport: string | null;
  researchCompany: string | null;
  salesNav: string | null;
  icebreaker: string | null;
  followup: string | null;
  notes: string | null;
};

type View = "list" | "config" | "new" | "detail";

const HTB_VP_TEXT =
  "Hack The Box (HTB) Enterprise Platform is the leading hands-on cybersecurity upskilling platform, trusted by enterprises, government organisations, and MSSPs. It helps security teams build attack-ready skills through realistic labs, AI-augmented cyber ranges, structured learning paths, and live-fire simulations. HTB benchmarks team capabilities, identifies skill gaps, and measurably reduces breach risk. New content on CVEs, TTPs, and emerging threats is released weekly. Trusted by 4M+ security professionals globally.";

function Badge({ stage }: { stage: Stage }) {
  return (
    <span className="badge" style={{ background: SBGS[stage], color: SCOLS[stage] }}>{stage}</span>
  );
}

export function HtbApp() {
  const { data: session } = useSession();
  const [view, setView] = useState<View>("list");
  const [config, setConfig] = useState<Config | null>(null);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [filter, setFilter] = useState<string>("All");
  const [selId, setSelId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string>("");
  const [showEnquiry, setShowEnquiry] = useState(false);

  useEffect(() => {
    void Promise.all([
      fetch("/api/config").then((r) => r.json()).then(setConfig),
      fetch("/api/prospects").then((r) => r.json()).then(setProspects),
    ]);
  }, []);

  const toast = (m: string) => {
    setToastMsg(m);
    setTimeout(() => setToastMsg(""), 1800);
  };

  const showPage = (v: View) => {
    setView(v);
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  };

  const selected = useMemo(
    () => prospects.find((p) => p.id === selId) ?? null,
    [prospects, selId],
  );

  const updateProspect = (id: string, patch: Partial<Prospect>) => {
    setProspects((cur) => cur.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const persistProspect = async (id: string, patch: Partial<Prospect>) => {
    updateProspect(id, patch);
    await fetch(`/api/prospects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  };

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
        <div className="row">
         <button className="btn-enquiry" onClick={() => setShowEnquiry(true)}>Enquire</button>
<button className="btn-p" onClick={() => showPage("new")}>+ Prospect</button>
          <button
            className={config?.name ? "btn-cfg-ok" : "btn-s"}
            onClick={() => showPage("config")}
          >
            Config
          </button>
          <span className="user-chip">
            <strong>{session?.user?.name?.split(" ")[0] ?? "You"}</strong>
            {" · "}
            <a href="#" onClick={(e) => { e.preventDefault(); signOut(); }} style={{ color: "var(--muted)" }}>
              Sign out
            </a>
          </span>
        </div>
      </header>

      {view === "list" && (
        <ListView
          config={config}
          prospects={prospects}
          filter={filter}
          setFilter={setFilter}
          onOpenConfig={() => showPage("config")}
          onOpen={(id) => { setSelId(id); showPage("detail"); }}
        />
      )}

      {view === "config" && config && (
        <ConfigView
          config={config}
          onBack={() => showPage("list")}
          onSave={async (next) => {
            const res = await fetch("/api/config", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(next),
            });
            const updated = await res.json();
            setConfig((c) => ({ ...(c ?? next), ...updated }));
            showPage("list");
          }}
        />
      )}

      {view === "new" && (
        <NewView
          onBack={() => showPage("list")}
          onCreated={(p) => {
            setProspects((cur) => [p, ...cur]);
            setSelId(p.id);
            showPage("detail");
          }}
        />
      )}

      {view === "detail" && selected && config && (
        <DetailView
          prospect={selected}
          config={config}
          onBack={() => showPage("list")}
          onPatch={(patch) => persistProspect(selected.id, patch)}
          toast={toast}
          onOpenConfig={() => showPage("config")}
        />
      )}

      {toastMsg && <div className="toast">{toastMsg}</div>}
      {showEnquiry && <EnquiryForm onClose={() => setShowEnquiry(false)} />}
    </>
  );
}

function ListView(props: {
  config: Config | null;
  prospects: Prospect[];
  filter: string;
  setFilter: (s: string) => void;
  onOpenConfig: () => void;
  onOpen: (id: string) => void;
}) {
  const filtered = props.filter === "All" ? props.prospects : props.prospects.filter((p) => p.stage === props.filter);
  return (
    <div className="page">
      <div className="spacer" />
      {!props.config?.name && (
        <div className="banner">
          Set up your agent config to generate messages.{" "}
          <a href="#" onClick={(e) => { e.preventDefault(); props.onOpenConfig(); }}>Open Config</a>
        </div>
      )}
      <div style={{ marginBottom: 12 }}>
        <select onChange={(e) => props.setFilter(e.target.value)} value={props.filter} style={{ background: "var(--surface)" }}>
          <option>All</option>
          {STAGES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      {filtered.length === 0 ? (
        <div className="empty">No prospects yet. Add one to get started.</div>
      ) : (
        filtered.map((p) => {
          const hasResearch = !!(p.annualReport || p.salesNav);
          return (
            <div key={p.id} className="card" onClick={() => props.onOpen(p.id)}>
              <div className="fb">
                <h3>{p.name || "Unnamed"}</h3>
                <Badge stage={p.stage} />
              </div>
              {p.headline && <p>{p.headline}</p>}
              {hasResearch && (
                <p style={{ marginTop: 5 }}>
                  <span style={{ color: "var(--accent)", fontSize: 11, fontWeight: 700 }}>Research loaded</span>
                </p>
              )}
            </div>
          );
        })
      )}
      <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", marginTop: 8 }}>
        {props.prospects.length} {props.prospects.length === 1 ? "prospect" : "prospects"}
      </div>
    </div>
  );
}

function ConfigView(props: { config: Config; onBack: () => void; onSave: (c: Partial<Config>) => void }) {
  const [name, setName] = useState(props.config.name ?? "");
  const [team, setTeam] = useState(props.config.team || "Hack The Box");
  const [language, setLanguage] = useState(props.config.language || "English");
  const [goal, setGoal] = useState(props.config.goal || "book a demo");
  const [bookingLink, setBookingLink] = useState(props.config.bookingLink ?? "");
  const [customVp, setCustomVp] = useState(props.config.customVp ?? "");

  return (
    <div className="page">
      <div className="spacer" />
      <div className="row" style={{ marginBottom: 16 }}>
        <button className="btn-s" onClick={props.onBack}>Back</button>
        <span style={{ fontSize: 16, fontWeight: 700 }}>Agent Config</span>
      </div>

      <div className="sec">Your Details</div>
      <label>Your Name</label>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alex Carter" />
      <label>Team</label>
      <input value={team} onChange={(e) => setTeam(e.target.value)} />
      <label>Language</label>
      <input value={language} onChange={(e) => setLanguage(e.target.value)} />

      <div className="sec">Outreach Goal</div>
      <label>Goal</label>
      <input value={goal} onChange={(e) => setGoal(e.target.value)} />
      <label>Booking Link</label>
      <input value={bookingLink} onChange={(e) => setBookingLink(e.target.value)} placeholder="https://hackthebox.com/demo" />

      <div className="sec">Value Proposition</div>
      <div className="vp-box">
        {HTB_VP_DISPLAY}
        <div style={{ marginTop: 8 }}>
          <span className="tag">Hands-on labs</span>
          <span className="tag">AI Cyber Range</span>
          <span className="tag">Skill benchmarking</span>
          <span className="tag">4M+ community</span>
        </div>
      </div>
      <label>Custom Value Prop (optional override)</label>
      <textarea value={customVp} onChange={(e) => setCustomVp(e.target.value)} rows={4} placeholder="Leave blank to use HTB default above" />
      <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 5 }}>Maps into all three generated messages.</p>

      <div className="spacer" />
      <button
        className="btn-p"
        style={{ width: "100%" }}
        onClick={() =>
          props.onSave({
            name: name || null,
            team: team || "Hack The Box",
            language: language || "English",
            goal: goal || "book a demo",
            bookingLink: bookingLink || null,
            customVp: customVp || null,
          })
        }
      >
        Save and Back
      </button>
    </div>
  );
}

function NewView(props: { onBack: () => void; onCreated: (p: Prospect) => void }) {
  const [form, setForm] = useState({
    name: "", headline: "", location: "", company: "", liurl: "",
    posts: "", current: "", past: "", vol: "",
    skills: "", langs: "", edu: "", certs: "", acc: "",
    recs: "", extra: "",
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    if (!form.name.trim()) { alert("Full name is required."); return; }
    const res = await fetch("/api/prospects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) { alert("Failed to create prospect"); return; }
    const created = (await res.json()) as Prospect;
    props.onCreated(created);
  };

  return (
    <div className="page">
      <div className="spacer" />
      <div className="row" style={{ marginBottom: 16 }}>
        <button className="btn-s" onClick={props.onBack}>Back</button>
        <span style={{ fontSize: 16, fontWeight: 700 }}>New Prospect</span>
      </div>

      <div className="info-box">
        Look up the prospect in your browser (LinkedIn, Sales Navigator, Apollo) and paste their
        details below. Sales Nav data is added on the prospect detail page after creation.
      </div>

      <div className="sec">Basic Profile</div>
      <label>Full Name *</label><input value={form.name} onChange={set("name")} placeholder="Jane Doe" />
      <label>Headline</label><input value={form.headline} onChange={set("headline")} placeholder="CISO at Acme Corp" />
      <label>Location</label><input value={form.location} onChange={set("location")} placeholder="London, UK" />
      <label>Company</label><input value={form.company} onChange={set("company")} placeholder="Acme Corp" />
      <label>LinkedIn URL</label><input value={form.liurl} onChange={set("liurl")} placeholder="https://linkedin.com/in/janedoe" />

      <div className="sec">Posts (Highest Priority)</div>
      <label>Recent LinkedIn Posts</label>
      <textarea value={form.posts} onChange={set("posts")} placeholder="Paste their recent posts here..." />

      <div className="sec">Experience</div>
      <label>Current Role</label>
      <textarea value={form.current} onChange={set("current")} rows={2} placeholder="Current role and responsibilities..." />
      <label>Past Roles</label>
      <textarea value={form.past} onChange={set("past")} rows={2} placeholder="Previous positions..." />
      <label>Volunteer / Community</label>
      <input value={form.vol} onChange={set("vol")} placeholder="e.g. OWASP Chapter Lead" />

      <div className="sec">Skills and Background</div>
      <label>Skills</label>
      <textarea value={form.skills} onChange={set("skills")} rows={2} placeholder="e.g. Penetration Testing, SOC, Cloud Security..." />
      <label>Languages</label><input value={form.langs} onChange={set("langs")} placeholder="English, French..." />
      <label>Education</label><input value={form.edu} onChange={set("edu")} placeholder="MSc Cybersecurity, MIT..." />
      <label>Certifications</label><input value={form.certs} onChange={set("certs")} placeholder="CISSP, OSCP, CEH..." />
      <label>Accomplishments</label>
      <textarea value={form.acc} onChange={set("acc")} rows={2} placeholder="Awards, publications, CTF wins..." />

      <div className="sec">Social Proof</div>
      <label>Recommendations</label>
      <textarea value={form.recs} onChange={set("recs")} placeholder="Key quotes from recommendations..." />

      <div className="sec">Additional</div>
      <label>Extra Context</label>
      <textarea value={form.extra} onChange={set("extra")} rows={2} placeholder="Anything else worth knowing..." />

      <div className="spacer" />
      <button className="btn-p" style={{ width: "100%" }} onClick={submit}>Add Prospect</button>
    </div>
  );
}

function buildCtxPrompt(cfg: Config) {
  const vp = (cfg.customVp ?? "").trim() || HTB_VP_TEXT;
  return [
    `You are ${cfg.name || "[Agent Name]"}, a representative of ${cfg.team}.`,
    "Reaching out personally to prospects on LinkedIn in natural, human-like conversations.",
    "",
    `Mission: guide prospects to ${cfg.goal} via ${cfg.bookingLink || "[booking link]"} if interested. Exit gracefully if not.`,
    "",
    "What you are selling:",
    vp,
    "",
    "Rules:",
    "- Keep messages under 30 words",
    `- Oral, pragmatic tone. Speak in ${cfg.language}`,
    "- No em dash. No verb sentence starts. Include subject pronouns.",
    "- Max 2 questions across the conversation",
    "- Do not share the link until the prospect shows clear interest",
    "- No free trial available",
    "- Exit gracefully if no interest",
  ].join("\n");
}

function DetailView(props: {
  prospect: Prospect;
  config: Config;
  onBack: () => void;
  onPatch: (patch: Partial<Prospect>) => Promise<void> | void;
  toast: (m: string) => void;
  onOpenConfig: () => void;
}) {
  const { prospect: p, config, onPatch, toast } = props;

  const [arBusy, setArBusy] = useState(false);
  const [iceBusy, setIceBusy] = useState(false);
  const [folBusy, setFolBusy] = useState(false);
  const [companyInput, setCompanyInput] = useState(p.researchCompany || p.company || "");
  const [salesNav, setSalesNav] = useState(p.salesNav ?? "");
  const [notes, setNotes] = useState(p.notes ?? "");

  const salesNavTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCompanyInput(p.researchCompany || p.company || "");
    setSalesNav(p.salesNav ?? "");
    setNotes(p.notes ?? "");
  }, [p.id, p.researchCompany, p.company, p.salesNav, p.notes]);

  const ctxPrompt = config.name ? buildCtxPrompt(config) : "Configure agent details to generate this prompt.";

  const copy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => toast("Copied!"));
  };

  const openLinkedIn = () => {
    let url = "https://www.linkedin.com";
    if (p.liurl && p.liurl.includes("linkedin.com")) url = p.liurl;
    else if (p.name) {
      url = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(p.name + (p.company ? " " + p.company : ""))}`;
    }
    window.open(url, "_blank");
  };
  const openSalesNav = () => {
    let url = "https://www.linkedin.com/sales/";
    if (p.liurl && p.liurl.includes("linkedin.com")) {
      const handle = p.liurl
        .replace("https://www.linkedin.com/in/", "")
        .replace("https://linkedin.com/in/", "")
        .replace(/\//g, "");
      url = `https://www.linkedin.com/sales/people/${handle}`;
    } else if (p.name) {
      url = `https://www.linkedin.com/sales/search/people?query=${encodeURIComponent(p.name)}`;
    }
    window.open(url, "_blank");
  };

  const runAnnualReport = async () => {
    const company = companyInput.trim();
    if (!company) { alert("Enter a company name first."); return; }
    setArBusy(true);
    try {
      const res = await fetch("/api/annual-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId: p.id, company }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      await onPatch({ annualReport: data.text, researchCompany: company });
    } catch (e) {
      alert("Error: " + (e instanceof Error ? e.message : "Unknown error"));
    } finally {
      setArBusy(false);
    }
  };

  const generate = async (type: "ice" | "fol") => {
    if (!config.name) {
      alert("Complete your config first.");
      props.onOpenConfig();
      return;
    }
    const setBusy = type === "ice" ? setIceBusy : setFolBusy;
    setBusy(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId: p.id, type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      await onPatch(type === "ice" ? { icebreaker: data.text } : { followup: data.text });
    } catch (e) {
      alert("Error: " + (e instanceof Error ? e.message : "Unknown error"));
    } finally {
      setBusy(false);
    }
  };

  const onSalesNavChange = (val: string) => {
    setSalesNav(val);
    if (salesNavTimer.current) clearTimeout(salesNavTimer.current);
    salesNavTimer.current = setTimeout(() => { void onPatch({ salesNav: val }); }, 600);
  };
  const onNotesChange = (val: string) => {
    setNotes(val);
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => { void onPatch({ notes: val }); }, 600);
  };

  return (
    <div className="page">
      <div className="spacer" />
      <div className="fb" style={{ marginBottom: 14 }}>
        <button className="btn-s" onClick={props.onBack}>Back</button>
        <Badge stage={p.stage} />
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{p.name}</div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{p.headline ?? ""}</div>
      </div>

      <div className="sec">Stage</div>
      <div className="pills">
        {STAGES.map((s) => (
          <span
            key={s}
            className={"pill" + (p.stage === s ? " on" : "")}
            style={{ background: SBGS[s], color: SCOLS[s] }}
            onClick={() => onPatch({ stage: s })}
          >
            {s}
          </span>
        ))}
      </div>

      <div className="sec">Research Intelligence</div>

      <div className="rc">
        <div className="fb" style={{ marginBottom: 6 }}>
          <div>
            <h4>Annual Report</h4>
            <p>Extracts cybersecurity priorities from the latest public filing</p>
          </div>
          <div className="row">
            <input
              value={companyInput}
              onChange={(e) => setCompanyInput(e.target.value)}
              placeholder="Company"
              style={{ width: 120, fontSize: 12, padding: "5px 8px" }}
            />
            <button className="btn-p btn-sm" onClick={runAnnualReport} disabled={arBusy}>
              {arBusy ? <span className="spinner" /> : null}
              {p.annualReport ? "Refresh" : "Search"}
            </button>
          </div>
        </div>
        <div className={"msg-box" + (p.annualReport ? "" : " msg-empty")}>
          {p.annualReport || "No annual report data yet."}
        </div>
        {p.annualReport && (
          <div className="fb" style={{ marginTop: 8 }}>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>
              Source: {p.researchCompany || companyInput} annual report
            </span>
            <button className="btn-s btn-sm" onClick={() => copy(p.annualReport!)}>Copy</button>
          </div>
        )}
      </div>

      <div className="rc">
        <div className="fb" style={{ marginBottom: 6 }}>
          <div>
            <h4>Sales Navigator Insights</h4>
            <p>Open Sales Nav or LinkedIn, copy insights, paste below</p>
          </div>
          <div className="row">
            <button className="btn-blue btn-sm" onClick={openLinkedIn}>LinkedIn</button>
            <button className="btn-blue btn-sm" onClick={openSalesNav}>Sales Nav</button>
          </div>
        </div>
        <div className="info-box">
          LinkedIn and Sales Nav require your browser login. Click the buttons above to jump directly to
          this prospect, then copy and paste insights here.
        </div>
        <textarea
          value={salesNav}
          onChange={(e) => onSalesNavChange(e.target.value)}
          rows={4}
          placeholder="e.g. 23% headcount growth in security, new CISO hired 3 months ago, zero-trust initiative posted..."
          style={{ background: "var(--bg)" }}
        />
      </div>

      <div className="sec">Icebreaker</div>
      <div className="fb" style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>First LinkedIn message</span>
        <div className="row">
          {p.icebreaker && <button className="btn-s btn-sm" onClick={() => copy(p.icebreaker!)}>Copy</button>}
          <button className="btn-p btn-sm" onClick={() => generate("ice")} disabled={iceBusy}>
            {iceBusy ? <span className="spinner" /> : null}
            {p.icebreaker ? "Regen" : "Generate"}
          </button>
        </div>
      </div>
      <div className={"msg-box" + (p.icebreaker ? "" : " msg-empty")}>
        {p.icebreaker || "Not generated yet"}
      </div>

      <div className="sec">Follow-up</div>
      <div className="fb" style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>No response follow-up</span>
        <div className="row">
          {p.followup && <button className="btn-s btn-sm" onClick={() => copy(p.followup!)}>Copy</button>}
          <button className="btn-p btn-sm" onClick={() => generate("fol")} disabled={folBusy}>
            {folBusy ? <span className="spinner" /> : null}
            {p.followup ? "Regen" : "Generate"}
          </button>
        </div>
      </div>
      <div className={"msg-box" + (p.followup ? "" : " msg-empty")}>
        {p.followup || "Not generated yet"}
      </div>

      <div className="sec">Conversation Agent Prompt</div>
      <div className="fb" style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>System prompt for Claude conversation handler</span>
        <button className="btn-s btn-sm" onClick={() => copy(ctxPrompt)}>Copy</button>
      </div>
      <div className={"msg-box" + (config.name ? "" : " msg-empty")} style={{ fontSize: 12 }}>
        {ctxPrompt}
      </div>

      <div className="sec">Notes</div>
      <textarea
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        rows={3}
        placeholder="Internal notes..."
        style={{ background: "var(--surface2)" }}
      />
    </div>
  );
}
