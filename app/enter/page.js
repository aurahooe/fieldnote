"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function Enter() {
  const supabase = createClient();
  const router = useRouter();
  const [mode, setMode] = useState("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg("Account created.");
        router.push("/studio");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/studio");
      }
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="shell">
      <header className="top">
        <Link href="/" className="mark">Field<span>note</span></Link>
        <nav className="nav"><Link href="/">Board</Link></nav>
      </header>
      <div className="auth-wrap panel">
        <div className="section-label">{mode === "in" ? "Sign in" : "Create an account"}</div>
        <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 32, marginBottom: 16 }}>Come in. Leave something if you want.</h2>
        <form className="stack" onSubmit={onSubmit}>
          <label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
          <label>Password<input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          {msg && <p className={msg.includes("created") ? "ok" : "err"}>{msg}</p>}
          <div className="row">
            <button className="btn" disabled={busy} type="submit">{busy ? "Working" : mode === "in" ? "Sign in" : "Create account"}</button>
            <button type="button" className="btn ghost" onClick={() => setMode(mode === "in" ? "up" : "in")}>{mode === "in" ? "Need an account" : "Have an account"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
