"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUser(data.user ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-ink/[0.06] bg-cream/75 backdrop-blur-xl supports-[backdrop-filter]:bg-cream/65">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          aria-label="Retour à l'accueil HealthyHub"
          className="flex items-center transition hover:opacity-90"
        >
          <Logo />
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/partners"
            className="hidden rounded-full px-3.5 py-2 text-[13px] font-medium text-ink/65 transition hover:bg-ink/5 hover:text-ink sm:inline-flex"
          >
            Pour les restos
          </Link>
          <Link
            href="/discover"
            className="inline-flex h-10 items-center justify-center rounded-full bg-brand px-4 text-[13px] font-semibold text-white shadow-soft transition duration-250 ease-out-expo hover:bg-brand-dark hover:shadow-elevated active:translate-y-px"
          >
            La carte
          </Link>
          {!user ? (
            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-full bg-white px-4 text-[13px] font-semibold text-ink ring-1 ring-ink/15 transition hover:bg-brand-light"
            >
              Connexion
            </Link>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-3 text-[13px] font-semibold text-ink ring-1 ring-ink/15 transition hover:bg-brand-light"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-light text-[11px] text-brand-dark">
                  {(user.email ?? "U").slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden max-w-[140px] truncate sm:inline">
                  {user.email}
                </span>
              </button>
              {open ? (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl bg-white py-1 shadow-xl ring-1 ring-ink/10">
                  <Link
                    href="/favorites"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2.5 text-sm text-ink/80 transition hover:bg-brand-light"
                  >
                    Mes spots favoris
                  </Link>
                  <Link
                    href="/history"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2.5 text-sm text-ink/80 transition hover:bg-brand-light"
                  >
                    Adresses récentes
                  </Link>
                  <button
                    type="button"
                    onClick={signOut}
                    className="block w-full px-4 py-2.5 text-left text-sm text-ink/80 transition hover:bg-brand-light"
                  >
                    Déconnexion
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
