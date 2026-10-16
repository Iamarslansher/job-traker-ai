"use client";

import { FormEvent, useMemo, useState } from "react";
import { Mail, Plus, Search, Trash2, UserRound, Users } from "lucide-react";
import { WorkspaceLayout } from "@/components/workspace-layout";
import { useWorkspaceData } from "@/lib/workspace-data";

type Contact = { id: string; name: string; role: string; company: string; email: string; notes: string };
const noContacts: Contact[] = [];

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export default function ContactsPage() {
  const [contacts, setContacts] = useWorkspaceData<Contact[]>("contacts", noContacts);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return contacts.filter((contact) => !term || [contact.name, contact.role, contact.company, contact.email].some((value) => value.toLowerCase().includes(term)));
  }, [contacts, search]);

  function saveContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    if (!name) {
      setError("A contact name is required.");
      return;
    }
    setContacts((current) => [...current, {
      id: crypto.randomUUID(),
      name,
      role: String(form.get("role") ?? "").trim(),
      company: String(form.get("company") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      notes: String(form.get("notes") ?? "").trim(),
    }]);
    setShowForm(false);
  }

  return (
    <WorkspaceLayout title="Contacts">
      <div className="page-heading">
        <div><div className="eyebrow">YOUR NETWORK</div><h1>Good conversations start here.</h1><p className="subtitle">Keep the people supporting your search close at hand.</p></div>
        <button className="primary-button" onClick={() => { setError(""); setShowForm(true); }}><Plus size={15} /> Add contact</button>
      </div>
      <section className="page-panel contacts-panel">
        <div className="contacts-toolbar"><div><div className="panel-title">Your contacts <span className="panel-count">{contacts.length}</span></div><div className="panel-caption">Recruiters, interviewers, mentors, and more.</div></div><label className="contact-search"><Search size={14} /><input aria-label="Search contacts" placeholder="Search contacts..." value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>
        {filtered.length ? <div className="contacts-grid">{filtered.map((contact, index) => <article className="contact-card" key={contact.id}>
          <div className={`contact-avatar avatar-tone-${index % 5}`}>{initials(contact.name) || <UserRound size={18} />}</div>
          <div className="contact-card-heading"><div><h2>{contact.name}</h2><p>{contact.role || "Contact"}{contact.company ? ` · ${contact.company}` : ""}</p></div><button className="card-menu" aria-label={`Delete ${contact.name}`} onClick={() => setContacts((current) => current.filter((item) => item.id !== contact.id))}><Trash2 size={14} /></button></div>
          {contact.email && <a className="contact-detail" href={`mailto:${encodeURIComponent(contact.email)}`}><Mail size={13} />{contact.email}</a>}
          {contact.notes && <p className="contact-notes">{contact.notes}</p>}
        </article>)}</div> : <div className="empty-state contacts-empty"><span className="empty-state-icon"><Users size={19} /></span><strong>{search ? "No contacts match that search." : "Your network, in one place."}</strong><p>{search ? "Try another name, role, or company." : "Save the people you meet along the way, along with a note to remember the conversation."}</p>{!search && <button className="secondary-button" onClick={() => setShowForm(true)}><Plus size={13} /> Add your first contact</button>}</div>}
      </section>
      {showForm && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false); }}>
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="contact-form-title">
          <div className="modal-head"><div><h2 className="modal-title" id="contact-form-title">Add a contact</h2><p className="modal-subtitle">A quick note helps you pick up the conversation later.</p></div><button className="close-button" aria-label="Close" onClick={() => setShowForm(false)}>×</button></div>
          <form className="modal-body" onSubmit={saveContact}>
            <div className="form-group"><label className="field-label" htmlFor="contact-name">Name</label><input className="field" id="contact-name" name="name" placeholder="Alex Morgan" required /></div>
            <div className="form-grid"><div className="form-group"><label className="field-label" htmlFor="contact-role">Role</label><input className="field" id="contact-role" name="role" placeholder="Recruiter" /></div><div className="form-group"><label className="field-label" htmlFor="contact-company">Company</label><input className="field" id="contact-company" name="company" placeholder="Company name" /></div></div>
            <div className="form-group"><label className="field-label" htmlFor="contact-email">Email</label><input className="field" id="contact-email" name="email" type="email" placeholder="alex@example.com" /></div>
            <div className="form-group"><label className="field-label" htmlFor="contact-notes">Notes</label><textarea className="textarea" id="contact-notes" name="notes" placeholder="Where you met, what you discussed, or a good time to follow up..." /></div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Cancel</button><button className="primary-button"><Plus size={13} /> Save contact</button></div>
          </form>
        </section>
      </div>}
    </WorkspaceLayout>
  );
}
