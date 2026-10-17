"use client";

import { DragEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  addDoc, collection, onSnapshot, query, updateDoc, where, doc,
} from "firebase/firestore";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import toast from "react-hot-toast";
import {
  ArrowDownUp, ArrowRight, Bell, BriefcaseBusiness, CalendarDays, Check,
  CircleHelp, Clock3, Filter, LayoutGrid, LogOut, MapPin, MoreHorizontal,
  Plus, Search, Settings2, Sparkles, Target, TrendingUp, Users, X,
} from "lucide-react";
import { generateJobMessage, parseJobDescription } from "@/app/actions";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";
import { demoJobs, Job, JobStatus, STAGES, stageLabels } from "@/lib/jobs";

const stageColor: Record<JobStatus, string> = {
  wishlist: "#f5a623", applied: "#6d7dff", interviewing: "#bd70f4", offer: "#36c995", rejected: "#f16b83",
};
const companyColors: Record<string, [string, string]> = {
  figma: ["#ff7262", "#2b191a"], linear: ["#a99aff", "#221f3c"], notion: ["#e5ebf3", "#272e38"],
  vercel: ["#e7edf5", "#1e2835"], stripe: ["#8c78ff", "#26203b"], airbnb: ["#ff8295", "#3a202a"],
  shopify: ["#9bd36e", "#23351f"], meta: ["#72b5ff", "#1b3044"],
};

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function companyStyle(company: string): React.CSSProperties {
  const [color, background] = companyColors[company.toLowerCase()] ?? ["#91a7c8", "#26364a"];
  return { color, background };
}

function formatDate(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Recently added";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(parsed);
}

function todayLabel() {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date()).toUpperCase();
}

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>(demoJobs);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!isFirebaseConfigured);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [draggingId, setDraggingId] = useState("");

  useEffect(() => {
    if (!auth || !db) {
      const stored = localStorage.getItem("jobtrack-jobs");
      if (stored) {
        try { setJobs(JSON.parse(stored) as Job[]); }
        catch { localStorage.removeItem("jobtrack-jobs"); }
      }
      return;
    }
    let unsubscribeJobs: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeJobs?.();
      setFirebaseUser(user);
      setAuthReady(true);
      if (!user || !db) {
        const stored = localStorage.getItem("jobtrack-jobs");
        if (stored) {
          try { setJobs(JSON.parse(stored) as Job[]); }
          catch { localStorage.removeItem("jobtrack-jobs"); setJobs(demoJobs); }
        } else {
          setJobs(demoJobs);
        }
        return;
      }
      const jobsQuery = query(collection(db, "jobs"), where("userId", "==", user.uid));
      unsubscribeJobs = onSnapshot(jobsQuery, (snapshot) => {
        const loaded = snapshot.docs.map((item) => ({ ...item.data(), id: item.id } as Job));
        setJobs(loaded);
      }, (error) => {
        console.error("Unable to load Firestore jobs:", error);
        toast.error("Could not load your saved jobs. Check your Firestore rules.");
      });
    });
    return () => { unsubscribeJobs?.(); unsubscribeAuth(); };
  }, []);

  useEffect(() => {
    if (!firebaseUser && authReady) localStorage.setItem("jobtrack-jobs", JSON.stringify(jobs));
  }, [jobs, firebaseUser, authReady]);

  const visibleJobs = useMemo(() => jobs.filter((job) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || [job.jobTitle, job.companyName, job.location, ...job.keyRequirements].some((value) => value?.toLowerCase().includes(term));
    return matchesSearch && (statusFilter === "all" || job.status === statusFilter);
  }), [jobs, search, statusFilter]);

  async function saveJob(job: Job) {
    if (firebaseUser && db) {
      const { id: _id, ...data } = job;
      const ref = await addDoc(collection(db, "jobs"), { ...data, userId: firebaseUser.uid });
      return { ...job, id: ref.id, userId: firebaseUser.uid };
    }
    return job;
  }

  async function persistUpdate(job: Job, patch: Partial<Job>) {
    const updated = { ...job, ...patch };
    if (firebaseUser && db) await updateDoc(doc(db, "jobs", job.id), patch);
    setJobs((current) => current.map((item) => item.id === job.id ? updated : item));
    setSelectedJob(updated);
    return updated;
  }

  async function changeStatus(job: Job, status: JobStatus) {
    try {
      await persistUpdate(job, { status });
      toast.success(`${job.companyName} moved to ${stageLabels[status]}.`);
    } catch (error) {
      console.error("Unable to update job status:", error);
      toast.error("Could not save that status change.");
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, status: JobStatus) {
    event.preventDefault();
    const job = jobs.find((item) => item.id === event.dataTransfer.getData("text/plain"));
    setDraggingId("");
    if (job && job.status !== status) void changeStatus(job, status);
  }

  async function doSignOut() {
    if (!auth) return;
    try {
      await signOut(auth);
      toast.success("You have been signed out.");
    } catch (error) {
      console.error("Unable to sign out:", error);
      toast.error("Could not sign out. Please try again.");
    }
  }

  const activeCount = jobs.filter((job) => job.status !== "rejected").length;
  const interviewCount = jobs.filter((job) => job.status === "interviewing").length;
  const offerCount = jobs.filter((job) => job.status === "offer").length;
  const responseRate = jobs.length ? Math.round(((interviewCount + offerCount) / jobs.length) * 100) : 0;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand" style={{ textDecoration: "none", color: "inherit" }}><div className="brand-mark"><BriefcaseBusiness size={17}/></div><div className="brand-name">JobTrack<span> AI</span></div></Link>
        <div className="workspace">Workspace</div>
        <Link className="nav-item active" href="/dashboard" aria-current="page"><LayoutGrid size={16}/> Application board <span className="nav-count">{jobs.length}</span></Link>
        <Link className="nav-item" href="/calendar"><CalendarDays size={16}/> Calendar</Link>
        <Link className="nav-item" href="/contacts"><Users size={16}/> Contacts</Link>
        <Link className="nav-item" href="/notifications"><Bell size={16}/> Notifications</Link>
        <div className="workspace">Preferences</div>
        <Link className="nav-item" href="/settings"><Settings2 size={16}/> Settings</Link>
        <Link className="nav-item" href="/help"><CircleHelp size={16}/> Help center</Link>
        <div className="sidebar-spacer"/>
        <div className="upgrade-card"><span className="upgrade-icon"><Sparkles size={15}/></span><div className="upgrade-title">Your search, supercharged</div><p className="upgrade-copy">Let AI handle the busywork, so you can focus on what&apos;s next.</p><a className="upgrade-link" href="#ai-tools">Explore AI tools <ArrowRight size={11}/></a></div>
        <div className="profile"><div className="avatar">{firebaseUser ? initials(firebaseUser.displayName || firebaseUser.email || "You") : "JL"}</div><Link href="/profile" className="dashboard-profile-link"><div className="profile-name">{firebaseUser?.displayName || firebaseUser?.email || "Jordan Lee"}</div><div className="profile-plan">{firebaseUser ? "Personal workspace" : "Demo workspace"}</div></Link>{firebaseUser && <button className="card-menu" title="Sign out" onClick={doSignOut}><LogOut size={14}/></button>}</div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><ArrowRight size={12}/><strong>Application board</strong></div>
          <div className="top-actions"><div className="search-wrap"><Search size={14}/><input className="search-input" aria-label="Search jobs" placeholder="Search jobs..." value={search} onChange={(event)=>setSearch(event.target.value)}/></div><Link className="icon-button" aria-label="Notifications" href="/notifications"><Bell size={15}/></Link><Link className="icon-button" aria-label="Your profile" href="/profile"><Users size={15}/></Link><button className="icon-button mobile-menu" aria-label="Open menu" onClick={()=>toast("Use the board filters to find your applications.")}><MoreHorizontal size={16}/></button></div>
        </header>

        <div className="content">
          <div className="page-heading"><div><div className="eyebrow">{todayLabel()}</div><h1>Your next move starts here.</h1><p className="subtitle">A little progress every day adds up. Here&apos;s where things stand.</p></div><button className="primary-button" onClick={()=>setShowAdd(true)}><Plus size={15}/> Add a job</button></div>
          {!firebaseUser && <div style={{ marginTop: 17 }}><span className="demo-badge"><Sparkles size={11}/> Demo workspace · your changes save on this device</span></div>}
          <section className="metric-grid" aria-label="Application summary">
            <Metric label="Active applications" value={String(activeCount).padStart(2,"0")} note="Across your pipeline" icon={<BriefcaseBusiness size={14}/>} accent="#65a1ff" tint="#315d9828"/>
            <Metric label="In the interview room" value={String(interviewCount).padStart(2,"0")} note="Keep the momentum going" icon={<Users size={15}/>} accent="#c185ff" tint="#8d55c926"/>
            <Metric label="Offers on the table" value={String(offerCount).padStart(2,"0")} note="Your hard work is paying off" icon={<Target size={15}/>} accent="#45d29d" tint="#21866125"/>
            <Metric label="Response rate" value={`${responseRate}%`} note="Interviews + offers" icon={<TrendingUp size={15}/>} accent="#f1b94b" tint="#b77f1925"/>
          </section>

          <div className="board-toolbar"><div className="board-label">Application pipeline <span>{visibleJobs.length}</span></div><div className="board-tools"><select aria-label="Filter applications" className="view-select" value={statusFilter} onChange={(event)=>setStatusFilter(event.target.value)}><option value="all">All applications</option>{STAGES.map((stage)=><option value={stage} key={stage}>{stageLabels[stage]}</option>)}</select><button className="icon-button" title="Sort by newest" onClick={()=>setJobs((current)=>[...current].reverse())}><ArrowDownUp size={14}/></button><button className="icon-button" title="Filters" onClick={()=>setStatusFilter(statusFilter==="all"?"applied":"all")}><Filter size={14}/></button></div></div>
          <section className="board" aria-label="Job application stages">
            {STAGES.map((stage)=>{
              const columnJobs=visibleJobs.filter((job)=>job.status===stage);
              return <div key={stage} className="column" style={{ "--stage": stageColor[stage] } as React.CSSProperties} onDragOver={(event)=>event.preventDefault()} onDrop={(event)=>handleDrop(event,stage)}>
                <div className="column-header"><div className="column-title"><i className="column-dot"/>{stageLabels[stage]}<span className="column-count">{columnJobs.length}</span></div><button className="card-menu" aria-label={`Add to ${stageLabels[stage]}`} onClick={()=>setShowAdd(true)}><Plus size={15}/></button></div>
                {columnJobs.map((job)=><JobCard key={job.id} job={job} dragging={draggingId===job.id} onClick={()=>setSelectedJob(job)} onDragStart={(event)=>{event.dataTransfer.setData("text/plain",job.id);setDraggingId(job.id);}} onDragEnd={()=>setDraggingId("")}/>)}
                {!columnJobs.length&&<div className="empty-column">{search?"No matching jobs":"Drop a job here or add one to get started."}</div>}
              </div>;
            })}
          </section>
          <div className="board-hint"><Sparkles size={12}/> Tip: drag a card between columns to update its status.</div>
        </div>
      </main>

      {showAdd&&<AddJobModal onClose={()=>setShowAdd(false)} onSave={async(job)=>{const saved=await saveJob(job);setJobs((current)=>[saved,...current.filter((item)=>item.id!==saved.id)]);setShowAdd(false);toast.success(`${saved.jobTitle} at ${saved.companyName} added.`);}} onError={(message)=>toast.error(message)}/>}
      {selectedJob&&<JobDetailModal job={selectedJob} onClose={()=>setSelectedJob(null)} onChangeStatus={(status)=>changeStatus(selectedJob,status)} onUpdateNotes={async(notes)=>{try{await persistUpdate(selectedJob,{notes});toast.success("Your notes were saved.");}catch(error){console.error("Unable to save notes:",error);toast.error("Could not save your notes.");}}}/>}
    </div>
  );
}

function Metric({label,value,note,icon,accent,tint}:{label:string;value:string;note:string;icon:React.ReactNode;accent:string;tint:string}) {
  return <article className="metric-card" style={{"--accent":accent,"--tint":tint,"--glow":tint} as React.CSSProperties}><div className="metric-top">{label}<span className="metric-icon">{icon}</span></div><div className="metric-value">{value}</div><div className="metric-foot">{note}</div></article>;
}

function JobCard({job,dragging,onClick,onDragStart,onDragEnd}:{job:Job;dragging:boolean;onClick:()=>void;onDragStart:(event:DragEvent<HTMLDivElement>)=>void;onDragEnd:()=>void}) {
  return <div className="job-card" role="button" tabIndex={0} draggable onClick={onClick} onKeyDown={(event)=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();onClick();}}} onDragStart={onDragStart} onDragEnd={onDragEnd} style={{opacity:dragging ? .55 : 1}}>
    <div className="job-company-row"><div className="company-mark" style={companyStyle(job.companyName)}>{initials(job.companyName)}</div><MoreHorizontal size={15} className="card-menu" aria-hidden="true"/></div>
    <div className="job-title">{job.jobTitle}</div><div className="company-name">{job.companyName}</div>
    <div className="job-meta">{job.location&&<span><MapPin size={11}/>{job.location}</span>}{job.salary&&<span>{job.salary}</span>}</div>
    {job.keyRequirements.length>0&&<div className="skills">{job.keyRequirements.slice(0,3).map((skill,index)=><span className="skill" key={`${skill}-${index}`}>{skill}</span>)}{job.keyRequirements.length>3&&<span className="skill">+{job.keyRequirements.length-3}</span>}</div>}
    <div className="card-footer"><span className="card-date"><Clock3 size={11}/>{formatDate(job.createdAt)}</span><span className="card-avatars"><span className="tiny-avatar">{initials(job.companyName)}</span></span></div>
  </div>;
}

function AddJobModal({onClose,onSave,onError}:{onClose:()=>void;onSave:(job:Job)=>Promise<void>;onError:(message:string)=>void}) {
  const [title,setTitle]=useState(""); const [company,setCompany]=useState(""); const [location,setLocation]=useState(""); const [salary,setSalary]=useState(""); const [description,setDescription]=useState(""); const [status,setStatus]=useState<JobStatus>("wishlist"); const [requirements,setRequirements]=useState(""); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  const submitting=useRef(false);
  async function parseDescription() {
    setError("");setBusy(true);
    try {
      const parsed=await parseJobDescription(description);
      setTitle(parsed.jobTitle);setCompany(parsed.companyName);setLocation(parsed.location);setSalary(parsed.salary);setRequirements(parsed.keyRequirements.join(", "));
    } catch(cause) { const message=cause instanceof Error?cause.message:"Unable to parse this job description.";setError(message);onError(message); }
    finally {setBusy(false);}
  }
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setError("");
    if(submitting.current||busy)return;
    submitting.current=true;
    const job:Job={id:crypto.randomUUID(),jobTitle:title.trim(),companyName:company.trim(),location:location.trim(),status,salary:salary.trim(),jobDescription:description.trim(),keyRequirements:requirements.split(",").map((item)=>item.trim()).filter(Boolean),notes:"",createdAt:new Date().toISOString()};
    try {setBusy(true);await onSave(job);} catch(cause) {const message=cause instanceof Error?cause.message:"Could not save this job.";setError(message);onError(message);} finally {submitting.current=false;setBusy(false);}
  }
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event)=>{if(event.target===event.currentTarget)onClose();}}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="add-job-title"><div className="modal-head"><div><h2 id="add-job-title" className="modal-title">Add a job to your pipeline</h2><p className="modal-subtitle">Keep the details together, then take the next step.</p></div><button className="close-button" aria-label="Close" onClick={onClose}><X size={17}/></button></div>
    <form className="modal-body" onSubmit={submit}><div className="form-group"><label className="field-label" htmlFor="job-description">Job description</label><textarea className="textarea" id="job-description" value={description} onChange={(event)=>setDescription(event.target.value)} placeholder="Paste the job description here to extract the role, company, salary, and key skills…"/><button type="button" className="secondary-button" style={{marginTop:8}} onClick={parseDescription} disabled={busy||description.trim().length<30}><Sparkles size={13}/>{busy?"Reading the description…":"Auto-parse with AI"}</button></div>
      <div className="form-grid"><div className="form-group"><label className="field-label" htmlFor="job-title">Job title *</label><input className="field" id="job-title" required value={title} onChange={(event)=>setTitle(event.target.value)} placeholder="Product Designer"/></div><div className="form-group"><label className="field-label" htmlFor="company-name">Company *</label><input className="field" id="company-name" required value={company} onChange={(event)=>setCompany(event.target.value)} placeholder="Company name"/></div><div className="form-group"><label className="field-label" htmlFor="job-location">Location</label><input className="field" id="job-location" value={location} onChange={(event)=>setLocation(event.target.value)} placeholder="Remote, city, or hybrid"/></div><div className="form-group"><label className="field-label" htmlFor="job-salary">Salary range</label><input className="field" id="job-salary" value={salary} onChange={(event)=>setSalary(event.target.value)} placeholder="$120k – $160k"/></div><div className="form-group"><label className="field-label" htmlFor="job-status">Stage</label><select className="select" id="job-status" value={status} onChange={(event)=>setStatus(event.target.value as JobStatus)}>{STAGES.map((stage)=><option key={stage} value={stage}>{stageLabels[stage]}</option>)}</select></div><div className="form-group"><label className="field-label" htmlFor="job-skills">Key skills <span style={{color:"#748197"}}>(comma separated)</span></label><input className="field" id="job-skills" value={requirements} onChange={(event)=>setRequirements(event.target.value)} placeholder="React, Figma, TypeScript"/></div></div>
      {error&&<p className="form-error" role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose} disabled={busy}>Cancel</button><button className="primary-button" disabled={busy}><Plus size={14}/>{busy?"Saving…":"Add to pipeline"}</button></div>
    </form></section></div>;
}

function JobDetailModal({job,onClose,onChangeStatus,onUpdateNotes}:{job:Job;onClose:()=>void;onChangeStatus:(status:JobStatus)=>void;onUpdateNotes:(notes:string)=>Promise<void>}) {
  const [notes,setNotes]=useState(job.notes); const [generated,setGenerated]=useState(""); const [messageKind,setMessageKind]=useState<"cover-letter"|"follow-up"|null>(null); const [error,setError]=useState("");
  async function generate(kind:"cover-letter"|"follow-up") {
    setError("");setGenerated("");setMessageKind(kind);
    try {setGenerated(await generateJobMessage(job,kind));}
    catch(cause) {setError(cause instanceof Error?cause.message:"Unable to generate your draft.");}
    finally {setMessageKind(null);}
  }
  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(generated);
    } catch (cause) {
      console.error("Unable to copy generated draft:", cause);
      setError("Could not copy the draft. Select and copy the text instead.");
    }
  }
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event)=>{if(event.target===event.currentTarget)onClose();}}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="job-detail-title"><div className="modal-head"><div><div className="eyebrow" style={{marginBottom:5}}>APPLICATION DETAILS</div><h2 id="job-detail-title" className="modal-title">Your opportunity</h2></div><button className="close-button" aria-label="Close" onClick={onClose}><X size={17}/></button></div>
    <div className="modal-body"><div className="detail-company"><div className="detail-logo" style={companyStyle(job.companyName)}>{initials(job.companyName)}</div><div><h2>{job.jobTitle}</h2><p>{job.companyName}{job.location?` · ${job.location}`:""}{job.salary?` · ${job.salary}`:""}</p></div></div>
      <div className="detail-section"><h3>Application stage</h3><select className="select" value={job.status} onChange={(event)=>onChangeStatus(event.target.value as JobStatus)}>{STAGES.map((stage)=><option key={stage} value={stage}>{stageLabels[stage]}</option>)}</select></div>
      {job.keyRequirements.length>0&&<div className="detail-section"><h3>Key skills</h3><div className="skills">{job.keyRequirements.map((skill,index)=><span className="skill" key={`${skill}-${index}`}>{skill}</span>)}</div></div>}
      {job.jobDescription&&<div className="detail-section"><h3>Job description</h3><p>{job.jobDescription}</p></div>}
      <div className="detail-section"><h3>Your notes</h3><textarea className="textarea" value={notes} onChange={(event)=>setNotes(event.target.value)} placeholder="Add a reminder, interview notes, or a next step…" style={{minHeight:75}}/><button className="secondary-button" style={{marginTop:8}} onClick={()=>void onUpdateNotes(notes)}><Check size={13}/>Save notes</button></div>
      <div className="detail-section" id="ai-tools"><h3><Sparkles size={13} style={{display:"inline",verticalAlign:"-2px",color:"#9b8cff"}}/> AI writing studio</h3><div className="detail-actions"><button className="secondary-button" disabled={!!messageKind} onClick={()=>void generate("cover-letter")}><Sparkles size={13}/>{messageKind==="cover-letter"?"Drafting…":"Tailored cover letter"}</button><button className="secondary-button" disabled={!!messageKind} onClick={()=>void generate("follow-up")}><ArrowRight size={13}/>{messageKind==="follow-up"?"Drafting…":"Follow-up email"}</button></div>
        {error&&<p className="form-error" style={{marginTop:10}} role="alert">{error}</p>}{messageKind&&<p className="modal-subtitle" style={{marginTop:11}}>Writing a thoughtful first draft…</p>}{generated&&<div style={{marginTop:12}}><div className="generated-copy">{generated}</div><button className="secondary-button" style={{marginTop:8}} onClick={()=>void copyDraft()}><Check size={13}/>Copy draft</button></div>}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:6,color:"#718096",fontSize:9}}><Clock3 size={11}/>Added {formatDate(job.createdAt)}</div>
    </div></section></div>;
}
