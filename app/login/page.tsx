"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, updateProfile, type User } from "firebase/auth";
import { ArrowLeft, BriefcaseBusiness, Eye, EyeOff, Sparkles } from "lucide-react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("mode") === "signup") setMode("signup");
  }, []);

  async function ensureUserProfile(user: User) {
    if (!db) return;
    const reference = doc(db, "users", user.uid);
    const profile = await getDoc(reference);
    if (!profile.exists()) {
      await setDoc(reference, {
        uid: user.uid,
        email: user.email ?? "",
        displayName: user.displayName ?? name.trim(),
        createdAt: serverTimestamp(),
      });
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!isFirebaseConfigured || !auth) {
      const message = "Sign-in is not configured yet. You can still explore the demo workspace.";
      setError(message);
      toast.error(message);
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) await updateProfile(credential.user, { displayName: name.trim() });
        await ensureUserProfile(credential.user);
      } else {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        await ensureUserProfile(credential.user);
      }
      toast.success(mode === "signup" ? "Your account was created successfully." : "Welcome back!");
      router.push("/dashboard");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Unable to sign in.";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function signInGoogle() {
    setError("");
    if (!isFirebaseConfigured || !auth) {
      const message = "Sign-in is not configured yet. You can still explore the demo workspace.";
      setError(message);
      toast.error(message);
      return;
    }
    setBusy(true);
    try {
      const credential = await signInWithPopup(auth, new GoogleAuthProvider());
      await ensureUserProfile(credential.user);
      toast.success("Signed in with Google.");
      router.push("/dashboard");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Unable to sign in with Google.";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-layout">
      <section className="login-art">
        <Link className="back-link" href="/"><ArrowLeft size={14}/> Back to home</Link>
        <div className="login-art-center"><div className="login-orb"><Sparkles size={22}/></div><h1>A little more clarity.<br/><span>A lot more momentum.</span></h1><p>Your job search deserves a workspace that moves with you.</p>
          <div className="login-mini-board"><div><i/> APPLIED <b>08</b></div><div><i/> INTERVIEWING <b>03</b></div><div><i/> OFFERS <b>01</b></div></div>
        </div>
        <span className="art-caption">YOUR NEXT CHAPTER STARTS HERE</span>
      </section>
      <section className="login-panel"><Link href="/" className="brand login-brand"><div className="brand-mark"><BriefcaseBusiness size={18}/></div><div className="brand-name">JobTrack<span> AI</span></div></Link>
        <div className="login-form-wrap"><span className="login-kicker">YOUR WORKSPACE AWAITS</span><h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2><p>{mode === "login" ? "Pick up where your next opportunity begins." : "A calmer, clearer job search starts here."}</p>
          <button type="button" className="google-button" onClick={signInGoogle} disabled={busy}><span className="google-g">G</span> Continue with Google</button>
          <div className="or-divider"><span>or continue with email</span></div>
          <form onSubmit={submit}>
            {mode === "signup" && <label className="login-label">Your name<input autoComplete="name" value={name} onChange={(event)=>setName(event.target.value)} placeholder="Jordan Lee" required/></label>}
            <label className="login-label">Email address<input type="email" autoComplete="email" value={email} onChange={(event)=>setEmail(event.target.value)} placeholder="you@example.com" required/></label>
            <label className="login-label">Password<span className="password-field"><input type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={6} value={password} onChange={(event)=>setPassword(event.target.value)} placeholder="At least 6 characters" required/><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={()=>setShowPassword(!showPassword)}>{showPassword?<EyeOff size={15}/>:<Eye size={15}/>}</button></span></label>
            {error && <p className="login-error">{error}</p>}
            <button className="login-submit" disabled={busy}>{busy ? "Just a moment…" : mode === "login" ? "Sign in" : "Create account"}</button>
          </form>
          <div className="auth-switch">{mode === "login" ? "New to JobTrack?" : "Already have an account?"}<button onClick={()=>{setMode(mode==="login"?"signup":"login");setError("");}}>{mode==="login"?"Create an account":"Sign in"}</button></div>
          {!isFirebaseConfigured && <div className="demo-hint">Demo mode is ready. No account needed — <Link href="/dashboard">explore the workspace</Link>.</div>}
        </div><span className="login-legal">By continuing, you agree to our Terms of Service and Privacy Policy.</span>
      </section>
      <style>{`
        .login-layout{min-height:100vh;display:grid;grid-template-columns:1fr 1fr;background:#090d16}.login-art{position:relative;min-height:100vh;display:flex;flex-direction:column;justify-content:space-between;padding:31px 36px;background:radial-gradient(ellipse at 50% 48%,#17274a 0%,#101a2c 36%,#0c121e 75%);border-right:1px solid #202a39;overflow:hidden}.login-art:before,.login-art:after{content:"";position:absolute;border:1px solid #477ce51b;border-radius:50%;width:490px;height:490px;top:50%;left:50%;transform:translate(-50%,-50%)}.login-art:after{width:650px;height:650px;border-color:#477ce510}.back-link{position:relative;z-index:1;display:flex;align-items:center;gap:7px;color:#a0aec1;text-decoration:none;font-size:11px}.login-art-center{position:relative;z-index:1;text-align:center;margin:auto}.login-orb{display:grid;place-items:center;width:55px;height:55px;margin:0 auto 25px;border:1px solid #6d9fff66;border-radius:17px;background:linear-gradient(140deg,#277afa,#584ff2);color:white;box-shadow:0 0 70px #3979ff74}.login-art-center h1{font:700 clamp(29px,3vw,39px)/1.26 "Manrope",sans-serif;letter-spacing:-1.4px}.login-art-center h1 span{color:#7eaaff}.login-art-center p{color:#91a1b7;font-size:12px}.login-mini-board{display:flex;justify-content:center;gap:8px;margin-top:30px}.login-mini-board div{display:flex;align-items:center;gap:6px;padding:10px;border:1px solid #29374d;border-radius:7px;background:#111a29;color:#acb8ca;font-size:7px;font-weight:700;letter-spacing:.4px}.login-mini-board i{width:6px;height:6px;border-radius:50%;background:#7189ff}.login-mini-board div:nth-child(2) i{background:#bf79fa}.login-mini-board div:nth-child(3) i{background:#49d4a1}.login-mini-board b{color:#e5edf8}.art-caption{color:#66778f;font-size:8px;letter-spacing:1.4px}.login-panel{position:relative;min-height:100vh;padding:31px 36px;display:flex;flex-direction:column}.login-brand{align-self:flex-start;text-decoration:none}.login-form-wrap{width:min(100%,350px);margin:auto}.login-kicker{color:#7da8ff;font-size:9px;letter-spacing:1.3px;font-weight:700}.login-form-wrap h2{margin:10px 0 6px;font:700 25px "Manrope",sans-serif;letter-spacing:-.7px}.login-form-wrap>p{color:#8e9caf;font-size:11px;margin-bottom:22px}.google-button{width:100%;height:40px;display:flex;align-items:center;justify-content:center;gap:10px;border:1px solid #303a49;border-radius:7px;color:#e1e8f2;background:#141b25;font-size:11px;font-weight:600}.google-button:hover{border-color:#59708f}.google-g{font:bold 15px Arial;color:#4285f4}.or-divider{display:flex;align-items:center;gap:12px;margin:18px 0;color:#718096;font-size:9px}.or-divider:before,.or-divider:after{content:"";height:1px;flex:1;background:#26303f}.login-label{display:block;margin-bottom:14px;color:#a8b4c5;font-size:10px;font-weight:600}.login-label>input,.password-field{display:flex;width:100%;height:39px;margin-top:6px;border:1px solid #2d3747;border-radius:7px;background:#101721}.login-label>input,.password-field input{padding:0 11px;outline:0;color:#e7edf7;font-size:11px}.login-label>input{width:100%}.password-field input{width:100%;border:0;background:transparent}.password-field:focus-within,.login-label>input:focus{border-color:#4d8dff;box-shadow:0 0 0 3px #3b82f620}.password-field button{width:38px;border:0;color:#8190a5;background:transparent}.login-error{color:#fb7185;font-size:10px;line-height:1.5}.login-submit{width:100%;height:40px;margin-top:3px;border:0;border-radius:7px;background:#3478f6;color:white;font-size:11px;font-weight:700}.login-submit:hover{background:#4b89ff}.login-submit:disabled,.google-button:disabled{opacity:.65;cursor:wait}.auth-switch{text-align:center;margin-top:17px;color:#8996a9;font-size:10px}.auth-switch button{margin-left:5px;border:0;color:#8eb3ff;background:transparent;font-size:10px;font-weight:700}.demo-hint{margin-top:19px;padding:10px;border:1px solid #77622a55;border-radius:6px;color:#c0ab6e;background:#715a1517;text-align:center;font-size:9px;line-height:1.5}.demo-hint a{color:#e1c978}.login-legal{margin-top:auto;color:#637187;text-align:center;font-size:8px}
        @media(max-width:720px){.login-layout{grid-template-columns:1fr}.login-art{display:none}.login-panel{min-height:100vh;padding:23px 20px}.login-form-wrap{margin:auto}.login-legal{padding-top:30px}}
      `}</style>
    </main>
  );
}
