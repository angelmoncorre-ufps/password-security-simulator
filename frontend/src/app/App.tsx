import { useState, useEffect } from "react";
import { NavBar, type Screen } from "./components/NavBar";
import { HomeScreen, type SimResult } from "./components/HomeScreen";
import { ResultsScreen } from "./components/ResultsScreen";
import { CodeScreen } from "./components/CodeScreen";
import { LabScreen } from "./components/LabScreen";
import { AttackLabScreen } from "./components/AttackLabScreen";
import { DashboardScreen } from "./components/DashboardScreen";
import { DEFAULT_ACCOUNTS, type DemoAccount, type PythonSimulationResult } from "./components/types";

/* MARKER-MAKE-KIT-INVOKED */

type Lang = "en" | "es";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [lang, setLang] = useState<Lang>("es");
  const [dark, setDark] = useState(true);

  // Shared state: demo accounts (used by Lab + Attack), persisted in localStorage
  const [accounts, setAccounts] = useState<DemoAccount[]>(() => {
    try {
      const saved = localStorage.getItem("accounts");
      if (saved) return JSON.parse(saved) as DemoAccount[];
    } catch {}
    return DEFAULT_ACCOUNTS;
  });

  useEffect(() => {
    localStorage.setItem("accounts", JSON.stringify(accounts));
  }, [accounts]);
  const [attackPreSelected, setAttackPreSelected] = useState<DemoAccount | null>(null);

  // Existing simulator result
  const [simResult, setSimResult] = useState<SimResult | null>(null);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dark]);

  const handleSimDone = (result: SimResult) => {
    setSimResult(result);
    setScreen("results");
  };

  const handleSelectForAttack = (account: DemoAccount) => {
    setAttackPreSelected(account);
    setScreen("attack");
  };

  const bg = dark
    ? "radial-gradient(ellipse at 20% 0%, rgba(59,130,246,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(139,92,246,0.06) 0%, transparent 60%), var(--background)"
    : "radial-gradient(ellipse at 20% 0%, rgba(37,99,235,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(124,58,237,0.04) 0%, transparent 60%), var(--background)";

  return (
    <div className="min-h-screen" style={{ background: bg }}>
      <NavBar
        screen={screen}
        setScreen={setScreen}
        lang={lang}
        setLang={setLang}
        dark={dark}
        setDark={setDark}
      />

      <main>
        {screen === "home" && (
          <HomeScreen lang={lang} dark={dark} onSimulationDone={handleSimDone} />
        )}
        {screen === "lab" && (
          <LabScreen
            lang={lang}
            dark={dark}
            accounts={accounts}
            setAccounts={setAccounts}
            onSelectForAttack={handleSelectForAttack}
          />
        )}
        {screen === "attack" && (
          <AttackLabScreen
            lang={lang}
            dark={dark}
            accounts={accounts}
            preSelected={attackPreSelected}
            onClearPreSelected={() => setAttackPreSelected(null)}
          />
        )}
        {screen === "dashboard" && (
          <DashboardScreen lang={lang} dark={dark} />
        )}
        {screen === "results" && (
          <ResultsScreen
            lang={lang}
            dark={dark}
            result={simResult}
            onGoSim={() => setScreen("home")}
          />
        )}
        {screen === "code" && (
          <CodeScreen lang={lang} dark={dark} />
        )}
      </main>

      <footer
        className="mt-16 py-6 border-t border-border text-center text-xs"
        style={{ color: "var(--muted-foreground)", fontFamily: "'JetBrains Mono', monospace" }}
      >
        {lang === "en"
          ? "University Cybersecurity Project · Educational Use Only · No real attacks performed"
          : "Proyecto Universitario de Ciberseguridad · Solo Uso Educativo · No se realizan ataques reales"}
      </footer>
    </div>
  );
}
