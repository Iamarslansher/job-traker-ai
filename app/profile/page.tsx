"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, Mail, Save, UserRound } from "lucide-react";
import { updateProfile } from "firebase/auth";
import { WorkspaceLayout } from "@/components/workspace-layout";
import { useWorkspaceData, useWorkspaceUser } from "@/lib/workspace-data";

type ProfileDetails = { name: string; role: string; location: string; phone: string };
const emptyProfile: ProfileDetails = { name: "", role: "", location: "", phone: "" };

export default function ProfilePage() {
  const { user, ready } = useWorkspaceUser();
  const [profile, setProfile] = useWorkspaceData<ProfileDetails>("profile", emptyProfile);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const defaultName = user?.displayName ?? "";
    setName(profile.name || defaultName);
    setRole(profile.role);
    setLocation(profile.location);
    setPhone(profile.phone);
  }, [profile, ready, user]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    const nextProfile = { name: name.trim(), role: role.trim(), location: location.trim(), phone: phone.trim() };
    try {
      if (user && nextProfile.name && nextProfile.name !== user.displayName) {
        await updateProfile(user, { displayName: nextProfile.name });
      }
      setProfile(nextProfile);
      setMessage("Your profile is up to date.");
    } catch (cause) {
      console.error("Unable to save profile:", cause);
      setError(cause instanceof Error ? cause.message : "Could not save your profile.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <WorkspaceLayout title="Profile">
      <div className="page-heading"><div><div className="eyebrow">YOUR ACCOUNT</div><h1>A little context about you.</h1><p className="subtitle">Keep your workspace details current as your search takes shape.</p></div></div>
      <div className="profile-layout">
        <section className="page-panel profile-card">
          <div className="profile-card-heading"><div className="profile-large-avatar"><UserRound size={23} /></div><div><div className="panel-title">{name || "Your profile"}</div><div className="panel-caption">{user ? "Personal workspace" : "Demo workspace"}</div></div></div>
          <div className="profile-account-line"><Mail size={14} /><span>{user?.email || "Demo account — no email connected"}</span></div>
          <p className="profile-private-note">Your profile details are saved for this workspace. Only your name is synced to Firebase when you are signed in.</p>
        </section>
        <section className="page-panel profile-form-panel">
          <div className="panel-title">Profile details</div><p className="panel-caption">Add just the details you want to keep handy.</p>
          <form className="profile-form" onSubmit={save}>
            <div className="form-group"><label className="field-label" htmlFor="profile-name">Name</label><input className="field" id="profile-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" /></div>
            <div className="form-group"><label className="field-label" htmlFor="profile-role">Current or target role</label><input className="field" id="profile-role" value={role} onChange={(event) => setRole(event.target.value)} placeholder="Product designer" /></div>
            <div className="form-grid"><div className="form-group"><label className="field-label" htmlFor="profile-location">Location</label><input className="field" id="profile-location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City, region" /></div><div className="form-group"><label className="field-label" htmlFor="profile-phone">Phone (optional)</label><input className="field" id="profile-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" /></div></div>
            {error && <p className="form-error" role="alert">{error}</p>}
            {message && <p className="profile-success" role="status"><Check size={13} />{message}</p>}
            <div className="profile-save-row"><button className="primary-button" disabled={busy}>{busy ? "Saving…" : <><Save size={13} /> Save profile</>}</button></div>
          </form>
        </section>
      </div>
    </WorkspaceLayout>
  );
}
