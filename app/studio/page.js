"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function Studio() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [msg, setMsg] = useState("");
  const [ready, setReady] = useState(false);

  async function load(uid) {
    const { data } = await supabase.from("notes").select("*").eq("user_id", uid).order("created_at", { ascending: false });
    setNotes(data || []);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace("/enter"); return; }
      setUser(data.user);
      setReady(true);
      load(data.user.id);
    });
  }, []);

  async function save(e) {
    e.preventDefault();
    setMsg("");
    const { error } = await supabase.from("notes").insert({
      user_id: user.id,
      title: title.trim(),
      body: body.trim(),
      is_public: isPublic,
    });
    if (error) { setMsg(error.message); return; }
    setTitle(""); setBody(""); setIsPublic(false); setMsg("Saved."); load(user.id);
  }

  async function togglePublic(note) {
    await supabase.from("notes").update({ is_public: !note.is_public, updated_at: new Date().toISOString() }).eq("id", note.id);
    load(user.id);
  }

  async function remove(id) {
    await supabase.from("notes").delete().eq("id", id);
    load(user.id);
  }

  if (!ready) return null;

  return (
    <div className="shell">
      <header className="top">
        <Link href="/" className="mark">Field<span>note</span></Link>
        <nav className="nav">
          <Link href="/">Board</Link>
          <button className="btn ghost" onClick={() => supabase.auth.signOut().then(() => router.push("/"))}>Sign out</button>
        </nav>
      </header>
      <section className="hero" style={{ paddingBottom: 12 }}>
        <div>
          <h1>Studio</h1>
          <p className="lede">Notes save to your account. Flip a piece public and it appears on the board.</p>
        </div>
      </section>
      <div className="panel">
        <div className="section-label">New note</div>
        <form className="stack" onSubmit={save}>
          <label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} /></label>
          <label>Body<textarea value={body} onChange={(e) => setBody(e.target.value)} required maxLength={8000} /></label>
          <label className="check"><input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} /> Mark public — show this on the board</label>
          {msg && <p className={msg === "Saved." ? "ok" : "err"}>{msg}</p>}
          <button className="btn" type="submit">Save note</button>
        </form>
      </div>
      <div className="section-label" style={{ marginTop: 36 }}>Your notes</div>
      <div className="grid">
        {notes.map((n) => (
          <article className="card" key={n.id}>
            <div className="meta">{n.is_public ? "Public" : "Private"} · {new Date(n.created_at).toLocaleString()}</div>
            <h3>{n.title}</h3>
            <p className="body">{n.body}</p>
            <div className="row">
              <button className="btn ghost" onClick={() => togglePublic(n)}>{n.is_public ? "Make private" : "Make public"}</button>
              <button className="btn ghost" onClick={() => remove(n.id)}>Delete</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
