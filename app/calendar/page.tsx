"use client";

import { FormEvent, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin, Plus, Trash2 } from "lucide-react";
import { WorkspaceLayout } from "@/components/workspace-layout";
import { useWorkspaceData } from "@/lib/workspace-data";

type CalendarEvent = {
  id: string;
  title: string;
  company: string;
  date: string;
  time: string;
  location: string;
};

const noEvents: CalendarEvent[] = [];
const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function CalendarPage() {
  const [events, setEvents] = useWorkspaceData<CalendarEvent[]>("calendar-events", noEvents);
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(dateKey(new Date()));
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(first.getDate() - offset);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [month]);

  const selectedEvents = events.filter((event) => event.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time));

  function addEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const date = String(form.get("date") ?? "");
    if (!title || !date) {
      setError("Add an event title and date.");
      return;
    }
    setEvents((current) => [...current, {
      id: crypto.randomUUID(),
      title,
      company: String(form.get("company") ?? "").trim(),
      date,
      time: String(form.get("time") ?? ""),
      location: String(form.get("location") ?? "").trim(),
    }]);
    setSelectedDate(date);
    setMonth(new Date(`${date}T12:00:00`));
    setShowForm(false);
  }

  return (
    <WorkspaceLayout title="Calendar">
      <div className="page-heading">
        <div><div className="eyebrow">YOUR SCHEDULE</div><h1>Keep every next step in view.</h1><p className="subtitle">Plan interviews, follow-ups, and the moments that move your search forward.</p></div>
        <button className="primary-button" onClick={() => { setError(""); setShowForm(true); }}><Plus size={15} /> Add event</button>
      </div>
      <div className="calendar-layout">
        <section className="page-panel calendar-panel">
          <div className="calendar-toolbar">
            <div><div className="panel-title">{month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div><div className="panel-caption">Select a day to see your schedule</div></div>
            <div className="calendar-controls">
              <button className="icon-button" aria-label="Previous month" onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}><ChevronLeft size={15} /></button>
              <button className="secondary-button calendar-today" onClick={() => { const today = new Date(); setMonth(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDate(dateKey(today)); }}>Today</button>
              <button className="icon-button" aria-label="Next month" onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}><ChevronRight size={15} /></button>
            </div>
          </div>
          <div className="calendar-grid">
            {weekdayLabels.map((label) => <div className="calendar-weekday" key={label}>{label}</div>)}
            {days.map((day) => {
              const key = dateKey(day);
              const count = events.filter((event) => event.date === key).length;
              const isCurrentMonth = day.getMonth() === month.getMonth();
              return <button key={key} className={`calendar-day${isCurrentMonth ? "" : " outside-month"}${selectedDate === key ? " selected" : ""}${dateKey(new Date()) === key ? " is-today" : ""}`} onClick={() => setSelectedDate(key)}>
                <span>{day.getDate()}</span>{count > 0 && <i className="calendar-event-dot" aria-label={`${count} events`} />}
              </button>;
            })}
          </div>
          <div className="calendar-legend"><i className="calendar-event-dot" /> Scheduled event</div>
        </section>
        <aside className="page-panel agenda-panel">
          <div className="agenda-date"><div className="eyebrow">YOUR AGENDA</div><h2>{new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</h2></div>
          {selectedEvents.length ? <div className="agenda-list">{selectedEvents.map((event) => <article className="agenda-event" key={event.id}>
            <div className="agenda-event-time">{event.time || "Any time"}</div><div className="agenda-event-body"><strong>{event.title}</strong>{event.company && <span>{event.company}</span>}{event.location && <small><MapPin size={12} />{event.location}</small>}</div>
            <button className="card-menu" aria-label={`Delete ${event.title}`} onClick={() => setEvents((current) => current.filter((item) => item.id !== event.id))}><Trash2 size={14} /></button>
          </article>)}</div> : <div className="empty-state"><span className="empty-state-icon"><CalendarDays size={19} /></span><strong>A little breathing room.</strong><p>No events scheduled for this day. Add an interview or follow-up when you&apos;re ready.</p><button className="secondary-button" onClick={() => setShowForm(true)}><Plus size={13} /> Add an event</button></div>}
        </aside>
      </div>
      {showForm && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false); }}>
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="event-form-title">
          <div className="modal-head"><div><h2 className="modal-title" id="event-form-title">Add a calendar event</h2><p className="modal-subtitle">Keep interviews and follow-ups together.</p></div><button className="close-button" aria-label="Close" onClick={() => setShowForm(false)}>×</button></div>
          <form className="modal-body" onSubmit={addEvent}>
            <div className="form-group"><label className="field-label" htmlFor="event-title">Event name</label><input className="field" id="event-title" name="title" placeholder="Interview with the product team" required /></div>
            <div className="form-grid">
              <div className="form-group"><label className="field-label" htmlFor="event-date">Date</label><input className="field" id="event-date" name="date" type="date" defaultValue={selectedDate} required /></div>
              <div className="form-group"><label className="field-label" htmlFor="event-time">Time</label><input className="field" id="event-time" name="time" type="time" /></div>
            </div>
            <div className="form-grid">
              <div className="form-group"><label className="field-label" htmlFor="event-company">Company (optional)</label><input className="field" id="event-company" name="company" placeholder="Company name" /></div>
              <div className="form-group"><label className="field-label" htmlFor="event-location">Location or link</label><input className="field" id="event-location" name="location" placeholder="Video call or office" /></div>
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Cancel</button><button className="primary-button"><Clock3 size={13} /> Save event</button></div>
          </form>
        </section>
      </div>}
    </WorkspaceLayout>
  );
}
