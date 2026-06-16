import { Shield, Sun, Moon, Globe, Menu, X } from "lucide-react";
import { useState } from "react";

export type Screen = "home" | "lab" | "attack" | "dashboard" | "results" | "code";

type Lang = "en" | "es";

interface NavBarProps {
  screen: Screen;
  setScreen: (s: Screen) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  dark: boolean;
  setDark: (d: boolean) => void;
}

const tabs: { id: Screen; en: string; es: string }[] = [
  { id: "home",      en: "Simulator",  es: "Simulador" },
  { id: "lab",       en: "Lab",        es: "Laboratorio" },
  { id: "attack",    en: "Attack",     es: "Ataque" },
  { id: "dashboard", en: "Dashboard",  es: "Panel" },
  { id: "results",   en: "Results",    es: "Resultados" },
  { id: "code",      en: "Code",       es: "Código" },
];

export function NavBar({ screen, setScreen, lang, setLang, dark, setDark }: NavBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50 border-b border-border backdrop-blur-md"
      style={{ background: dark ? "rgba(10,15,30,0.92)" : "rgba(240,244,255,0.94)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, var(--cyber-blue), var(--cyber-purple))" }}
          >
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span
            className="hidden sm:block text-sm font-semibold tracking-wide shrink-0"
            style={{ fontFamily: "'Rajdhani', sans-serif", color: "var(--cyber-blue)" }}
          >
            BruteForce Lab
          </span>
        </div>

        {/* Desktop tabs */}
        <div className="hidden md:flex items-center gap-0.5 bg-muted rounded-xl p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setScreen(t.id)}
              className="px-3 py-1.5 rounded-lg text-sm transition-all duration-200 whitespace-nowrap"
              style={{
                background: screen === t.id ? "var(--primary)" : "transparent",
                color: screen === t.id ? "#fff" : "var(--muted-foreground)",
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 600,
                letterSpacing: "0.04em",
              }}
            >
              {lang === "en" ? t.en : t.es}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === "en" ? "es" : "en")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-sm transition-colors hover:bg-muted"
            style={{ color: "var(--muted-foreground)" }}
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="font-semibold" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              {lang.toUpperCase()}
            </span>
          </button>

          <button
            onClick={() => setDark(!dark)}
            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center transition-colors hover:bg-muted"
            style={{ color: "var(--muted-foreground)" }}
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Mobile hamburger */}
          <button
            className="md:hidden w-8 h-8 rounded-lg border border-border flex items-center justify-center"
            style={{ color: "var(--muted-foreground)" }}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div
          className="md:hidden border-t border-border px-4 py-3 flex flex-col gap-1"
          style={{ background: dark ? "rgba(10,15,30,0.97)" : "rgba(240,244,255,0.97)" }}
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => { setScreen(t.id); setMobileOpen(false); }}
              className="text-left px-3 py-2 rounded-lg text-sm transition-colors"
              style={{
                background: screen === t.id ? "var(--primary)" : "transparent",
                color: screen === t.id ? "#fff" : "var(--muted-foreground)",
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 600,
                letterSpacing: "0.04em",
              }}
            >
              {lang === "en" ? t.en : t.es}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}
