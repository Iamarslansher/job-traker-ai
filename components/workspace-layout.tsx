"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell, BriefcaseBusiness, CalendarDays, CircleHelp, LayoutGrid,
  LogOut, Settings2, Users,
} from "lucide-react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useWorkspaceData } from "@/lib/workspace-data";

const navigation = [
  { href: "/dashboard", label: "Application board", icon: LayoutGrid },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings2 },
  { href: "/help", label: "Help center", icon: CircleHelp },
];
const defaultPreferences = { compactView: false };

function getInitials(value: string) {
  return value.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function WorkspaceLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [preferences, , preferencesReady] = useWorkspaceData("preferences", defaultPreferences);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!preferencesReady) return;
    document.documentElement.classList.toggle("compact-workspace", preferences.compactView);
    return () => document.documentElement.classList.remove("compact-workspace");
  }, [preferences.compactView, preferencesReady]);

  async function handleSignOut() {
    if (!auth) return;
    await signOut(auth);
    router.push("/login");
  }

  const displayName = user?.displayName || user?.email || "Jordan Lee";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand workspace-brand">
          <span className="brand-mark"><BriefcaseBusiness size={17} /></span>
          <span className="brand-name">JobTrack<span> AI</span></span>
        </Link>
        <div className="workspace">Workspace</div>
        {navigation.slice(0, 4).map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={`nav-item${pathname === href ? " active" : ""}`} aria-current={pathname === href ? "page" : undefined}>
            <Icon size={16} />{label}
          </Link>
        ))}
        <div className="workspace">Preferences</div>
        {navigation.slice(4).map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={`nav-item${pathname === href ? " active" : ""}`} aria-current={pathname === href ? "page" : undefined}>
            <Icon size={16} />{label}
          </Link>
        ))}
        <div className="sidebar-spacer" />
        <div className="profile">
          <div className="avatar">{getInitials(displayName) || "JL"}</div>
          <Link href="/profile" className="workspace-profile-link">
            <div className="profile-name">{displayName}</div>
            <div className="profile-plan">{user ? "Personal workspace" : "Demo workspace"}</div>
          </Link>
          {user && <button className="card-menu" title="Sign out" aria-label="Sign out" onClick={() => void handleSignOut()}><LogOut size={14} /></button>}
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><span aria-hidden="true">/</span><strong>{title}</strong></div>
          <div className="top-actions">
            <Link className="icon-button" aria-label="Notifications" href="/notifications"><Bell size={15} /></Link>
            <Link className="workspace-avatar-link" href="/profile" aria-label="Your profile">{getInitials(displayName) || "JL"}</Link>
          </div>
        </header>
        <div className="content workspace-content">{children}</div>
      </main>
    </div>
  );
}
