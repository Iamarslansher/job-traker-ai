"use client";

import { useState } from "react";
import { Bell, Check, Monitor, Save, Sparkles } from "lucide-react";
import { WorkspaceLayout } from "@/components/workspace-layout";
import { useWorkspaceData } from "@/lib/workspace-data";

type Preferences = {
  emailReminders: boolean;
  weeklySummary: boolean;
  productTips: boolean;
  compactView: boolean;
};

const defaultPreferences: Preferences = {
  emailReminders: true,
  weeklySummary: false,
  productTips: true,
  compactView: false,
};

function PreferenceRow({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="preference-row"><span><strong>{title}</strong><small>{description}</small></span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><i aria-hidden="true" /></label>;
}

export default function SettingsPage() {
  const [preferences, setPreferences] = useWorkspaceData<Preferences>("preferences", defaultPreferences);
  const [saved, setSaved] = useState(false);

  function updatePreference(key: keyof Preferences, checked: boolean) {
    setPreferences((current) => ({ ...current, [key]: checked }));
    if (key === "compactView") document.documentElement.classList.toggle("compact-workspace", checked);
    setSaved(false);
  }

  return (
    <WorkspaceLayout title="Settings">
      <div className="page-heading"><div><div className="eyebrow">PREFERENCES</div><h1>Make this workspace yours.</h1><p className="subtitle">Choose how you like to stay organized. Your preferences save on this device.</p></div></div>
      <div className="settings-grid">
        <section className="page-panel settings-panel">
          <div className="settings-section-heading"><span className="settings-section-icon"><Bell size={16} /></span><div><h2>Reminders and updates</h2><p>Choose the updates you would like to see in your workspace.</p></div></div>
          <div className="preference-list">
            <PreferenceRow title="Application reminders" description="Show helpful reminders about your job search." checked={preferences.emailReminders} onChange={(checked) => updatePreference("emailReminders", checked)} />
            <PreferenceRow title="Weekly progress summary" description="Include a weekly recap in your notification center." checked={preferences.weeklySummary} onChange={(checked) => updatePreference("weeklySummary", checked)} />
            <PreferenceRow title="Product tips" description="Show occasional tips for getting more from JobTrack." checked={preferences.productTips} onChange={(checked) => updatePreference("productTips", checked)} />
          </div>
        </section>
        <section className="page-panel settings-panel">
          <div className="settings-section-heading"><span className="settings-section-icon"><Monitor size={16} /></span><div><h2>Workspace display</h2><p>Adjust the way information is laid out.</p></div></div>
          <div className="preference-list">
            <PreferenceRow title="Compact view" description="Use tighter spacing in workspace pages." checked={preferences.compactView} onChange={(checked) => updatePreference("compactView", checked)} />
          </div>
        </section>
        <section className="settings-note"><Sparkles size={15} /><p>Settings only affect your workspace experience; they won&apos;t send email or browser notifications unless you connect a notification service.</p></section>
        <div className="settings-footer"><span>{saved && <><Check size={13} /> Preferences saved.</>}</span><button className="primary-button" onClick={() => setSaved(true)}><Save size={14} /> Save preferences</button></div>
      </div>
    </WorkspaceLayout>
  );
}
