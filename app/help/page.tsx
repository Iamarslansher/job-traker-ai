"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CircleHelp, Mail, Search } from "lucide-react";
import { WorkspaceLayout } from "@/components/workspace-layout";

const articles = [
  { category: "Getting started", question: "How do I add a job application?", answer: "Open Application board and choose Add a job. Enter the role and company details, or paste a job description to let the AI tools help extract key information." },
  { category: "Getting started", question: "Can I try JobTrack without an account?", answer: "Yes. Open the demo workspace to explore the application board. Demo data is saved in this browser on this device." },
  { category: "Your workspace", question: "How do I change an application stage?", answer: "Drag an application card between columns on the board, or open the card and select a new stage from its details." },
  { category: "Your workspace", question: "Where can I keep interview notes and reminders?", answer: "Open an application card to add notes, and use Calendar to schedule interviews, follow-ups, or other job-search events." },
  { category: "Your workspace", question: "How do I save a recruiter or interviewer?", answer: "Open Contacts and choose Add contact. You can save a name, role, company, email, and a short note." },
  { category: "Privacy", question: "Where is my workspace data saved?", answer: "When Firebase is configured and you sign in, application records use your account. Calendar events, contacts, and preferences are currently saved in this browser on this device." },
];

export default function HelpPage() {
  const [search, setSearch] = useState("");
  const [openArticle, setOpenArticle] = useState<string | null>(articles[0].question);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return articles.filter((article) => !term || `${article.category} ${article.question} ${article.answer}`.toLowerCase().includes(term));
  }, [search]);
  const categories = Array.from(new Set(filtered.map((article) => article.category)));

  return (
    <WorkspaceLayout title="Help center">
      <div className="help-hero"><span className="help-icon"><CircleHelp size={20} /></span><div className="eyebrow">HERE WHEN YOU NEED US</div><h1>Let&apos;s find your answer.</h1><p>Browse a few quick guides to make your next step easier.</p><label className="help-search"><Search size={15} /><input aria-label="Search help articles" placeholder="Search topics, questions, or keywords..." value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>
      <div className="help-content">
        <section className="page-panel help-articles">
          <div className="panel-title"><BookOpen size={16} /> Quick answers</div>
          {filtered.length ? categories.map((category) => <div className="help-category" key={category}><div className="eyebrow">{category}</div>{filtered.filter((article) => article.category === category).map((article) => <article className="help-article" key={article.question}>
            <button aria-expanded={openArticle === article.question} onClick={() => setOpenArticle((current) => current === article.question ? null : article.question)}><span>{article.question}</span><span className="help-toggle">{openArticle === article.question ? "−" : "+"}</span></button>
            {openArticle === article.question && <p>{article.answer}</p>}
          </article>)}</div>) : <div className="empty-state"><strong>No answers found.</strong><p>Try a different keyword or contact us below.</p></div>}
        </section>
        <aside className="help-contact-card"><span className="help-contact-icon"><Mail size={17} /></span><h2>Still need a hand?</h2><p>Send us a note and tell us what you were trying to do.</p><a className="primary-button" href="mailto:support@jobtrack.ai?subject=JobTrack%20support">Contact support <ArrowRight size={13} /></a><Link className="help-secondary-link" href="/dashboard">Back to your workspace</Link></aside>
      </div>
    </WorkspaceLayout>
  );
}
