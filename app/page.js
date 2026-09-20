"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

function excerpt(text, n = 160) {
  if (!text) return "";
  return text.length > n ? text.slice(0, n).trim() + "\u2026" : text;
}

export default function Home() {
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [hour, setHour] = useState(null);
  const [notes, setNotes] = useState([]);
  const [now, setNow] = useState("");

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNow(
        d.toLocaleString(undefined, {
          weekday: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
    });

    supabase
      .from("hours")
      .select("*")
      .order("slot", { ascending: false })
      .limit(1)
      .then(({ data }) => setHour(data?.[0] || null));

    supabase
      .from("notes")
      .select("id, title, body, created_at, user_id, profiles(handle, display_name)")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(24)
      .then(({ data }) => setNotes(data || []));

    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <div className="shell">
      <header className="top">
        <Link href="/" className="mark">
          Field<span>note</span>
        </Link>
        <nav className="nav">
          <Link href="/">Board</Link>
          <Link href="/studio">Studio</Link>
          {user ? (
            <button className="btn ghost" onClick={() => supabase.auth.signOut()}>
              Sign out
            </button>
          ) : (
            <Link className="btn" href="/enter">
              Enter
            </Link>
          )}
        </nav>
      </header>

      <section className="hero">
        <div>
          <h1>What people leave on the table this hour.</h1>
          <p className="lede">
            Write privately. Publish when it feels finished. Public notes live
            on the board. Every hour, the desk turns over.
          </p>
        </div>
        <aside className="clock">
          <div className="hour-hand" />
          <div className="tick">{now || "\u2014"}</div>
          <h2>{hour?.headline || "The first hour is still warming up."}</h2>
          <p>{hour?.editorial || "An editorial will land here on the hour."}</p>
        </aside>
      </section>

      <div className="section-label">Public notes</div>
      {notes.length === 0 ? (
        <p className="lede">Nothing public yet. Be the first in the studio.</p>
      ) : (
        <div className="grid">
          {notes.map((n) => (
            <article className="card" key={n.id}>
              <div className="meta">
                {n.profiles?.handle || "anon"} · {new Date(n.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit" })}
              </div>
              <h3>{n.title}</h3>
              <p className="body">{excerpt(n.body)}</p>
            </article>
          ))}
        </div>
      )}
      <footer className="fine">Fieldnote keeps what you save. Public is public. Private stays yours.</footer>
    </div>
  );
}
