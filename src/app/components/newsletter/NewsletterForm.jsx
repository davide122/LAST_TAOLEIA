"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function NewsletterFormInner() {
  const qs = useSearchParams();
  const token = qs.get("token");

  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle"); // idle | loading | sent | error | verified
  const [show, setShow] = useState(true);

  // 1) Nascondi se già verificato
  useEffect(() => {
    if (localStorage.getItem("bot_email_verified") === "true") {
      setShow(false);
      setState("verified");
    }
  }, []);

  // 2) Se token in URL, chiamo /api/verify
  useEffect(() => {
    if (!token) return;
    (async () => {
      setState("loading");
      const res  = await fetch(`/api/verify?token=${token}`);
      const data = await res.json();
      if (data.verified) {
        localStorage.setItem("bot_email_verified", "true");
        setState("verified");
      } else {
        setState("error");
      }
    })();
  }, [token]);

  // 3) Invio email di verifica
  const handleSubmit = async (e) => {
    e.preventDefault();
    setState("loading");
    const res = await fetch("/api/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setState(res.ok ? "sent" : "error");
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#082c33]/80 backdrop-blur-sm">
      <div className="bg-[#FEF5E7] w-[90%] max-w-lg p-8 rounded-3xl shadow-2xl border border-[#1E4E68]/20">
        <h3 className="text-2xl font-bold mb-6 text-center text-[#1E4E68]">
          Verifica la tua email per usare il Bot
        </h3>

        {state === "verified" ? (
          <p className="text-[#79424f] text-center text-lg font-medium">
            ✅ Email verificata con successo! Ora puoi usare il Bot.
          </p>
        ) : state === "sent" ? (
          <p className="text-[#79424f] text-center text-lg font-medium">
            ✅ Email inviata! Controlla la posta e clicca sul link per confermare.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="la-tua@email.it"
              required
              className="p-4 rounded-lg bg-[#FEF5E7] border border-[#1E4E68]/20 text-[#1E4E68] focus:ring-2 focus:ring-[#79424f] placeholder-[#1E4E68]/40"
            />
            <button
              type="submit"
              disabled={state === "loading"}
              className="py-3 rounded-full font-semibold bg-[#79424f] text-[#FEF5E7] hover:opacity-90 transition"
            >
              {state === "loading" ? "Invio in corso..." : "Invia link di verifica"}
            </button>
            {state === "error" && (
              <p className="text-[#F15525] text-center font-medium">❌ Errore. Riprova.</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

export default function NewsletterForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewsletterFormInner />
    </Suspense>
  );
}
