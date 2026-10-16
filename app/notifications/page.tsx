"use client";

import Link from "next/link";
import { Bell, CalendarDays, Check, CheckCheck, CircleHelp, Trash2 } from "lucide-react";
import { WorkspaceLayout } from "@/components/workspace-layout";
import { useWorkspaceData } from "@/lib/workspace-data";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  date: string;
  href: string;
  icon: "calendar" | "help" | "bell";
  read: boolean;
};

const starterNotifications: NotificationItem[] = [
  { id: "welcome", title: "Welcome to your workspace", body: "Your job search tools are ready. Add an application, plan an event, or start building your network.", date: "Your first day", href: "/dashboard", icon: "bell", read: false },
  { id: "calendar-tip", title: "Make space for the next step", body: "Add an interview or follow-up to your calendar so it is easy to find when you need it.", date: "A quick tip", href: "/calendar", icon: "calendar", read: false },
  { id: "network-tip", title: "Keep good conversations close", body: "Save a recruiter or mentor in Contacts and add a note for your next follow-up.", date: "A quick tip", href: "/contacts", icon: "help", read: true },
];

export default function NotificationsPage() {
  const [items, setItems] = useWorkspaceData<NotificationItem[]>("notifications", starterNotifications);
  const unreadCount = items.filter((item) => !item.read).length;
  const Icon = ({ kind }: { kind: NotificationItem["icon"] }) => kind === "calendar" ? <CalendarDays size={16} /> : kind === "help" ? <CircleHelp size={16} /> : <Bell size={16} />;

  return (
    <WorkspaceLayout title="Notifications">
      <div className="page-heading">
        <div><div className="eyebrow">UPDATES</div><h1>Stay close to what&apos;s next.</h1><p className="subtitle">Helpful reminders and ideas for keeping your search moving.</p></div>
        {unreadCount > 0 && <button className="secondary-button" onClick={() => setItems((current) => current.map((item) => ({ ...item, read: true })))}><CheckCheck size={14} /> Mark all read</button>}
      </div>
      <section className="page-panel notifications-panel">
        <div className="notifications-heading"><div><div className="panel-title">Your notifications</div><div className="panel-caption">{unreadCount ? `${unreadCount} unread` : "You’re all caught up."}</div></div></div>
        {items.length ? <div className="notification-list">{items.map((item) => <article className={`notification-item${item.read ? " is-read" : ""}`} key={item.id}>
          <span className="notification-icon"><Icon kind={item.icon} /></span>
          <div className="notification-copy"><div className="notification-title-row"><h2>{item.title}</h2>{!item.read && <span className="unread-indicator">New</span>}</div><p>{item.body}</p><span className="notification-date">{item.date}</span><Link className="notification-link" href={item.href}>Open {item.href === "/calendar" ? "calendar" : item.href === "/contacts" ? "contacts" : "workspace"} <span aria-hidden="true">→</span></Link></div>
          <div className="notification-actions">{!item.read && <button className="card-menu" aria-label={`Mark ${item.title} as read`} title="Mark as read" onClick={() => setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, read: true } : entry))}><Check size={15} /></button>}<button className="card-menu" aria-label={`Dismiss ${item.title}`} title="Dismiss" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}><Trash2 size={14} /></button></div>
        </article>)}</div> : <div className="empty-state"><span className="empty-state-icon"><CheckCheck size={19} /></span><strong>You&apos;re all caught up.</strong><p>New reminders and updates will show up here.</p><Link className="secondary-button" href="/dashboard">Back to your applications</Link></div>}
      </section>
    </WorkspaceLayout>
  );
}
