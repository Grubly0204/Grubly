"use client";

import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/plan", label: "Meal Plan" },
  { href: "/shopping", label: "Shopping" },
  { href: "/settings", label: "Settings" },
];

export default function Navbar({ userName }: { userName: string | null }) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="bg-white border-b border-sand sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <a href="/dashboard" className="text-xl font-black text-teal tracking-tight">
            Grubly
          </a>
          <nav className="hidden sm:flex items-center gap-1">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                  pathname === link.href
                    ? "bg-teal/10 text-teal"
                    : "text-muted hover:text-body hover:bg-sand"
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {userName && (
            <span className="hidden sm:block text-sm text-muted font-medium">
              {userName}
            </span>
          )}
          <button
            onClick={handleSignOut}
            className="text-sm font-semibold text-muted hover:text-body transition"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
