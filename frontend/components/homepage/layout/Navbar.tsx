"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Menu, X, Waves, Settings, Zap, LogOut } from "lucide-react";
import { useAuth } from "@/lib/authStore/auth-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Voices", href: "#voices" },
  { label: "Pricing", href: "#pricing" },
  { label: "API", href: "#playground" },
  { label: "Blog", href: "/blog" },
] as const;

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("");
  const { user, signOut, isAdmin } = useAuth();

  const initials = user?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 80);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const handleNavClick = (href: string) => {
    setActiveLink(href);
    setDrawerOpen(false);
    if (href.startsWith("#")) {
      const el = document.querySelector(href);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      <header
        role="banner"
        className={[
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "glass border-b border-white/5 shadow-[0_1px_0_rgba(108,60,225,0.15)]"
            : "bg-transparent",
        ].join(" ")}
      >
        <nav
          className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between"
          aria-label="Main navigation"
        >
          {/* ── Logo ── */}
          <Link
            href="/"
            className="flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vocera-purple rounded-lg"
            aria-label="Vocera — Go to homepage"
          >
            <div className="relative flex items-center justify-center w-8 h-8">
              <Waves
                className="w-7 h-7 text-vocera-purple group-hover:scale-110 transition-transform duration-300"
                strokeWidth={2.5}
                aria-hidden="true"
              />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-vocera-violet rounded-full glow-purple-sm" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-white">
              Voce<span className="text-gradient">ra</span>
            </span>
          </Link>

          {/* ── Desktop Nav Links ── */}
          <ul className="hidden md:flex items-center gap-1" role="list">
            {NAV_LINKS.map(({ label, href }) => (
              <li key={href}>
                <button
                  onClick={() => handleNavClick(href)}
                  aria-current={activeLink === href ? "page" : undefined}
                  className={[
                    "relative px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-150",
                    "hover:text-white hover:bg-white/5",
                    activeLink === href
                      ? "text-white after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-vocera-violet after:rounded-full"
                      : "text-vocera-muted",
                  ].join(" ")}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>

          {/* ── Desktop CTAs ── */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {/* dashboard btn */}
                <Link
                  href="/dashboard"
                  className="relative inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl bg-vocera-purple hover:bg-vocera-violet transition-all duration-200 glow-purple-sm hover:glow-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vocera-violet"
                >
                  Dashboard
                </Link>
                {/* user dropdown icon */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="rounded-full focus:outline-none focus:ring-2
                         focus:ring-[rgb(var(--accent))] focus:ring-offset-1
                         focus:ring-offset-[rgb(var(--surface-2))]"
                      aria-label="User menu"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback
                          className="bg-[rgba(120,62,246,0.3)]
                             text-[rgb(167,139,250)]
                             text-[10px] font-semibold"
                        >
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    sideOffset={8}
                    className="w-52 bg-[#141424] border-[#282846] text-white"
                  >
                    <DropdownMenuLabel className="py-2 font-normal">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-white">
                          {user.name}
                        </span>
                        <span className="text-xs text-white/40 truncate">
                          {user.email}
                        </span>
                      </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator className="bg-[#282846]" />

                    <DropdownMenuItem
                      asChild
                      className="cursor-pointer text-white/60 hover:text-white
                         hover:bg-white/5 focus:bg-white/5 focus:text-white"
                    >
                      <Link href="/settings">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      asChild
                      className="cursor-pointer text-white/60 hover:text-white
                         hover:bg-white/5 focus:bg-white/5 focus:text-white"
                    >
                      <Link href="/billing">
                        <Zap className="h-4 w-4 mr-2" />
                        Upgrade plan
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-[#282846]" />

                    <DropdownMenuItem
                      onClick={() => signOut()}
                      className="cursor-pointer text-red-400 hover:text-red-300
                         hover:bg-red-500/10 focus:bg-red-500/10
                         focus:text-red-300"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/sign-in"
                  className="text-sm font-medium text-vocera-muted hover:text-white transition-colors duration-150 px-3 py-2 rounded-lg hover:bg-white/5"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="relative inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl bg-vocera-purple hover:bg-vocera-violet transition-all duration-200 glow-purple-sm hover:glow-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vocera-violet"
                >
                  Get Started Free
                </Link>
              </div>
            )}
          </div>

          {/* ── Mobile Hamburger ── */}
          <button
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl text-vocera-muted hover:text-white hover:bg-white/5 transition-colors"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={drawerOpen}
            aria-controls="mobile-drawer"
          >
            <Menu className="w-5 h-5" />
          </button>
        </nav>
      </header>

      {/* ── Mobile Full-Screen Drawer ── */}
      <div
        id="mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        className={[
          "fixed inset-0 z-100 flex flex-col md:hidden",
          "transition-all duration-300 ease-out",
          drawerOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        ].join(" ")}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-vocera-bg/95 backdrop-blur-xl"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />

        {/* Drawer content */}
        <div
          className={[
            "relative flex flex-col h-full px-6 py-6 transition-transform duration-300 ease-out",
            drawerOpen ? "translate-x-0" : "translate-x-full",
          ].join(" ")}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between mb-10">
            <Link
              href="/"
              onClick={() => setDrawerOpen(false)}
              className="flex items-center gap-2"
            >
              <Waves className="w-6 h-6 text-vocera-purple" />
              <span className="font-display font-bold text-xl text-white">
                Voce<span className="text-gradient">ra</span>
              </span>
            </Link>
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Close navigation menu"
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 text-vocera-muted hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer nav links */}
          <nav className="flex flex-col gap-2 flex-1">
            {NAV_LINKS.map(({ label, href }, i) => (
              <button
                key={href}
                onClick={() => handleNavClick(href)}
                className="flex items-center px-4 py-4 text-lg font-semibold text-left text-vocera-muted hover:text-white hover:bg-white/5 rounded-xl transition-all duration-150"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Drawer CTAs */}
          <div className="flex flex-col gap-3 pt-6 border-t border-white/8">
            <Link
              href="/sign-in"
              onClick={() => setDrawerOpen(false)}
              className="flex items-center justify-center py-3.5 text-sm font-semibold text-white rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              onClick={() => setDrawerOpen(false)}
              className="flex items-center justify-center py-3.5 text-sm font-semibold text-white rounded-xl bg-vocera-purple hover:bg-vocera-violet transition-colors glow-purple"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
