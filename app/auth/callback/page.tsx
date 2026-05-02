"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Connexion en cours...");

  useEffect(() => {
    const finish = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMessage("Lien invalide ou expiré.");
          return;
        }
      } else {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          setMessage("Aucune session trouvée.");
          return;
        }
      }

      router.replace("/discover");
    };
    void finish();
  }, [router]);

  return (
    <section className="mx-auto max-w-md py-10 md:py-16">
      <div className="rounded-[28px] bg-white p-8 text-center shadow-elevated ring-1 ring-ink/[0.06]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep">
          Connexion
        </p>
        <p className="mt-3 text-[15px] font-medium leading-snug text-ink">{message}</p>
      </div>
    </section>
  );
}
