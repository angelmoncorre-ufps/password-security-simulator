import { useState, useEffect, useRef } from "react";
import {
  Shield, ShieldCheck, ShieldX, Play, Eye, EyeOff,
  Clock, Hash, Zap, Lock, Info, AlertTriangle, CheckCircle, XCircle,
} from "lucide-react";
import PasswordSimulationService from "../../services/passwordSimulationService";

type Lang = "en" | "es";

interface Props {
  lang: Lang;
  dark: boolean;
  onSimulationDone: (result: SimResult) => void;
}

export interface SimResult {
  password: string;
  strength: "weak" | "medium" | "strong";
  crackTimeLabel: string;
  crackTimeSeconds: number;
  attempts: number;
  charset: number;
  entropy: number;
  found: boolean;
  weakComparison: string;
  strongComparison: string;
}

const content = {
  en: {
    heroTitle: "Password Brute-Force",
    heroSub: "Educational Simulator",
    heroDesc: "Understand how attackers use automated tools to guess passwords — and why strong passwords are your best defense.",
    disclaimer: "⚠️ This is a safe educational simulation. No real attacks are performed. Data never leaves your browser.",
    inputLabel: "Enter a demo password",
    inputPlaceholder: "Type any password…",
    show: "Show",
    hide: "Hide",
    startBtn: "Start Simulation",
    simulating: "Simulating…",
    strengthLabel: "Password Strength",
    weak: "Weak",
    medium: "Medium",
    strong: "Strong",
    attemptsLabel: "Est. Attempts",
    timeLabel: "Est. Crack Time",
    charsetLabel: "Character Set",
    entropyLabel: "Entropy (bits)",
    tipsTitle: "Strong Password Tips",
    tips: [
      "Use at least 12 characters",
      "Mix uppercase and lowercase letters",
      "Include numbers and symbols (!@#$)",
      "Avoid dictionary words or names",
      "Never reuse passwords across sites",
      "Use a password manager",
    ],
    whatIsBrute: "What is Brute Force?",
    bruteDesc: "Brute-force attacks systematically try every possible combination of characters until the correct password is found. Short, simple passwords can be cracked in milliseconds; long complex ones would take longer than the age of the universe.",
    charsetInfo: [
      { label: "Lowercase only", chars: 26 },
      { label: "Lower + Upper", chars: 52 },
      { label: "Alphanumeric", chars: 62 },
      { label: "Full ASCII", chars: 95 },
    ],
  },
  es: {
    heroTitle: "Fuerza Bruta de Contraseñas",
    heroSub: "Simulador Educativo",
    heroDesc: "Entiende cómo los atacantes usan herramientas automatizadas para adivinar contraseñas — y por qué las contraseñas fuertes son tu mejor defensa.",
    disclaimer: "⚠️ Esta es una simulación educativa segura. No se realizan ataques reales. Los datos nunca salen de tu navegador.",
    inputLabel: "Ingresa una contraseña de prueba",
    inputPlaceholder: "Escribe cualquier contraseña…",
    show: "Mostrar",
    hide: "Ocultar",
    startBtn: "Iniciar Simulación",
    simulating: "Simulando…",
    strengthLabel: "Fortaleza de Contraseña",
    weak: "Débil",
    medium: "Media",
    strong: "Fuerte",
    attemptsLabel: "Intentos Est.",
    timeLabel: "Tiempo Est. de Crackeo",
    charsetLabel: "Conjunto de Caracteres",
    entropyLabel: "Entropía (bits)",
    tipsTitle: "Consejos para Contraseñas Fuertes",
    tips: [
      "Usa al menos 12 caracteres",
      "Mezcla mayúsculas y minúsculas",
      "Incluye números y símbolos (!@#$)",
      "Evita palabras del diccionario o nombres",
      "Nunca reutilices contraseñas",
      "Usa un gestor de contraseñas",
    ],
    whatIsBrute: "¿Qué es la Fuerza Bruta?",
    bruteDesc: "Los ataques de fuerza bruta prueban sistemáticamente todas las combinaciones posibles de caracteres hasta encontrar la contraseña correcta. Las contraseñas cortas y simples pueden crackerse en milisegundos; las largas y complejas tomarían más tiempo que la edad del universo.",
    charsetInfo: [
      { label: "Solo minúsculas", chars: 26 },
      { label: "Min. + Mayúsc.", chars: 52 },
      { label: "Alfanumérico", chars: 62 },
      { label: "ASCII completo", chars: 95 },
    ],
  },
};

async function analyzePassword(pwd: string) {
  try {
    const result = await PasswordSimulationService.runNormalSimulation(pwd, 1000);
    
    const formatTime = (s: number): string => {
      if (s < 0.001) return "< 1 ms";
      if (s < 1) return `${(s * 1000).toFixed(0)} ms`;
      if (s < 60) return `${s.toFixed(1)} sec`;
      if (s < 3600) return `${(s / 60).toFixed(1)} min`;
      if (s < 86400) return `${(s / 3600).toFixed(1)} hrs`;
      if (s < 31536000) return `${(s / 86400).toFixed(0)} days`;
      if (s < 3.154e10) return `${(s / 31536000).toFixed(0)} yrs`;
      if (s < 3.154e13) return `${(s / 3.154e10).toFixed(0)}K yrs`;
      return `${(s / 3.154e13).toFixed(1)}M yrs`;
    };

    const formatAttempts = (n: number): string => {
      if (n < 1e3) return n.toFixed(0);
      if (n < 1e6) return `${(n / 1e3).toFixed(1)}K`;
      if (n < 1e9) return `${(n / 1e6).toFixed(1)}M`;
      if (n < 1e12) return `${(n / 1e9).toFixed(1)}B`;
      return `${(n / 1e12).toFixed(1)}T+`;
    };

    const theoreticalCombinations = Math.pow(result.charset_size, pwd.length);
    const theoreticalSeconds = theoreticalCombinations / 1e10 / 2;

    return {
      strength: result.strength as "weak" | "medium" | "strong",
      entropy: result.entropy,
      charset: result.charset_size,
      crackTimeSeconds: theoreticalSeconds,
      crackTimeLabel: formatTime(theoreticalSeconds),
      attempts: result.attempts,
      attemptsLabel: formatAttempts(result.attempts),
      found: result.strength === "weak",
    };
  } catch (error) {
    console.error('Error analyzing password with Python:', error);
    
    const len = pwd.length;
    let charset = 0;
    if (/[a-z]/.test(pwd)) charset += 26;
    if (/[A-Z]/.test(pwd)) charset += 26;
    if (/[0-9]/.test(pwd)) charset += 10;
    if (/[^a-zA-Z0-9]/.test(pwd)) charset += 33;
    if (charset === 0) charset = 26;

    const entropy = len * Math.log2(charset);
    const combinations = Math.pow(charset, len);
    const attemptsPerSec = 1e10;
    const seconds = combinations / attemptsPerSec / 2;

    let strength: "weak" | "medium" | "strong" = "weak";
    if (entropy >= 60) strength = "strong";
    else if (entropy >= 36) strength = "medium";

    const formatTime = (s: number): string => {
      if (s < 0.001) return "< 1 ms";
      if (s < 1) return `${(s * 1000).toFixed(0)} ms`;
      if (s < 60) return `${s.toFixed(1)} sec`;
      if (s < 3600) return `${(s / 60).toFixed(1)} min`;
      if (s < 86400) return `${(s / 3600).toFixed(1)} hrs`;
      if (s < 31536000) return `${(s / 86400).toFixed(0)} days`;
      if (s < 3.154e10) return `${(s / 31536000).toFixed(0)} yrs`;
      if (s < 3.154e13) return `${(s / 3.154e10).toFixed(0)}K yrs`;
      return `${(s / 3.154e13).toFixed(1)}M yrs`;
    };

    const formatAttempts = (n: number): string => {
      if (n < 1e3) return n.toFixed(0);
      if (n < 1e6) return `${(n / 1e3).toFixed(1)}K`;
      if (n < 1e9) return `${(n / 1e6).toFixed(1)}M`;
      if (n < 1e12) return `${(n / 1e9).toFixed(1)}B`;
      return `${(n / 1e12).toFixed(1)}T+`;
    };

    return {
      strength,
      entropy: Math.round(entropy),
      charset,
      crackTimeSeconds: seconds,
      crackTimeLabel: formatTime(seconds),
      attempts: combinations / 2,
      attemptsLabel: formatAttempts(combinations / 2),
      found: strength === "weak",
    };
  }
}

export function HomeScreen({ lang, dark, onSimulationDone }: Props) {
  const c = content[lang];
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisReady, setAnalysisReady] = useState(false);
  type AnalysisData = {
    strength: "weak" | "medium" | "strong";
    entropy: number;
    charset: number;
    crackTimeSeconds: number;
    crackTimeLabel: string;
    attempts: number;
    attemptsLabel: string;
    found: boolean;
  };
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } }, []);

  useEffect(() => {
    const analyze = async () => {
      if (password.length > 0) {
        try {
          const result = await analyzePassword(password);
          setAnalysis(result);
          setAnalysisReady(true);
        } catch (error) {
          console.error('Error analyzing password:', error);
          setAnalysis(null);
          setAnalysisReady(false);
        }
      } else {
        setAnalysis(null);
        setAnalysisReady(false);
      }
    };
    
    analyze();
  }, [password]);

  const startSim = async () => {
    if (!password || running) return;
    setRunning(true);
    setProgress(0);
    
    try {
      const a = await analyzePassword(password);
      const duration = a.strength === "weak" ? 2000 : a.strength === "medium" ? 3500 : 4500;
      const start = Date.now();
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - start;
        const p = Math.min(elapsed / duration, 1);
        setProgress(p);
        if (p >= 1) {
          if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
          setRunning(false);
          onSimulationDone({
            password,
            strength: a.strength,
            crackTimeLabel: a.crackTimeLabel,
            crackTimeSeconds: a.crackTimeSeconds,
            attempts: a.attempts,
            charset: a.charset,
            entropy: a.entropy,
            found: a.found,
            weakComparison: "abc123",
            strongComparison: "Tr0ub4dor&3!xY#9",
          });
        }
      }, 30);
    } catch (error) {
      console.error('Error analyzing password:', error);
      setRunning(false);
    }
  };

  const strengthColor = analysis
    ? analysis.strength === "weak" ? "var(--cyber-red)"
    : analysis.strength === "medium" ? "var(--cyber-amber)"
    : "var(--cyber-green)"
    : "var(--muted-foreground)";

  const strengthPct = analysis
    ? analysis.strength === "weak" ? 25
    : analysis.strength === "medium" ? 60
    : 92
    : 0;

  const strengthLabel = analysis
    ? analysis.strength === "weak" ? c.weak
    : analysis.strength === "medium" ? c.medium
    : c.strong
    : "";

  const cardBg = dark
    ? "rgba(15,26,46,0.9)"
    : "rgba(255,255,255,0.95)";
  const cardBorder = dark
    ? "rgba(59,130,246,0.2)"
    : "rgba(37,99,235,0.12)";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-2xl p-8 sm:p-12"
        style={{
          background: dark
            ? "linear-gradient(135deg, #0a0f1e 0%, #0f1a2e 40%, #1a103a 100%)"
            : "linear-gradient(135deg, #dbeafe 0%, #ede9fe 60%, #cffafe 100%)",
        }}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg," + (dark ? "#3b82f6" : "#2563eb") + " 0," + (dark ? "#3b82f6" : "#2563eb") + " 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg," + (dark ? "#3b82f6" : "#2563eb") + " 0," + (dark ? "#3b82f6" : "#2563eb") + " 1px,transparent 1px,transparent 40px)",
          }}
        />

        {/* Glow blobs */}
        <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: "var(--cyber-blue)" }} />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: "var(--cyber-purple)" }} />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, var(--cyber-blue), var(--cyber-purple))" }}
          >
            <Shield className="w-9 h-9 text-white" />
          </div>
          <div>
            <p
              className="text-sm tracking-[0.2em] uppercase mb-1"
              style={{ color: "var(--cyber-cyan)", fontFamily: "'JetBrains Mono', monospace" }}
            >
              {c.heroSub}
            </p>
            <h1
              className="mb-2"
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: "clamp(1.6rem, 4vw, 2.8rem)",
                color: dark ? "#e2e8f0" : "#0f172a",
                lineHeight: 1.2,
              }}
            >
              {c.heroTitle}
            </h1>
            <p style={{ color: dark ? "#94a3b8" : "#475569", maxWidth: "520px" }}>
              {c.heroDesc}
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div
          className="relative z-10 mt-6 flex items-start gap-2 rounded-xl px-4 py-3 text-sm"
          style={{
            background: dark ? "rgba(245,158,11,0.1)" : "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.3)",
            color: dark ? "#fbbf24" : "#92400e",
          }}
        >
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--cyber-amber)" }} />
          <span>{c.disclaimer}</span>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: simulator panel */}
        <div className="lg:col-span-2 space-y-5">
          {/* Input card */}
          <div
            className="rounded-2xl p-6 space-y-5"
            style={{ background: cardBg, border: "1px solid " + cardBorder, boxShadow: dark ? "0 4px 24px rgba(0,0,0,0.4)" : "0 4px 24px rgba(37,99,235,0.07)" }}
          >
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" style={{ color: "var(--cyber-blue)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--muted-foreground)", fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.05em" }}>
                {c.inputLabel}
              </span>
            </div>

            {/* Password field */}
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={c.inputPlaceholder}
                className="w-full rounded-xl px-4 py-3 pr-24 outline-none transition-all"
                style={{
                  background: dark ? "rgba(30,45,74,0.8)" : "#f1f5f9",
                  border: "1px solid " + (password ? "var(--cyber-blue)" : cardBorder),
                  color: "var(--foreground)",
                  fontFamily: "'JetBrains Mono', monospace",
                  boxShadow: password ? "0 0 0 3px " + (dark ? "rgba(59,130,246,0.15)" : "rgba(37,99,235,0.1)") : "none",
                }}
              />
              <button
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors hover:bg-muted"
                style={{ color: "var(--muted-foreground)" }}
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {showPwd ? c.hide : c.show}
                </span>
              </button>
            </div>

            {/* Strength indicator */}
            {analysisReady && analysis && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: "var(--muted-foreground)" }}>{c.strengthLabel}</span>
                  <span style={{ color: strengthColor, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>
                    {strengthLabel}
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: dark ? "rgba(30,45,74,0.8)" : "#e2e8f0" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${strengthPct}%`, background: strengthColor }}
                  />
                </div>
              </div>
            )}

            {/* Stats row */}
            {analysisReady && analysis && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: c.attemptsLabel, value: analysis.attemptsLabel, icon: Hash, color: "var(--cyber-blue)" },
                  { label: c.timeLabel, value: analysis.crackTimeLabel, icon: Clock, color: "var(--cyber-purple)" },
                  { label: c.charsetLabel, value: analysis.charset.toString(), icon: Zap, color: "var(--cyber-cyan)" },
                  { label: c.entropyLabel, value: `${analysis.entropy} bits`, icon: Shield, color: strengthColor },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div
                    key={label}
                    className="rounded-xl p-3 flex flex-col gap-1"
                    style={{
                      background: dark ? "rgba(30,45,74,0.5)" : "rgba(241,245,249,0.8)",
                      border: "1px solid " + cardBorder,
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                    <div
                      className="text-sm font-semibold truncate"
                      style={{ color, fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {value}
                    </div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Progress bar during simulation */}
            {running && (
              <div className="space-y-2">
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: dark ? "rgba(30,45,74,0.8)" : "#e2e8f0" }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${progress * 100}%`,
                      background: "linear-gradient(90deg, var(--cyber-blue), var(--cyber-cyan))",
                    }}
                  />
                </div>
                <p className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "'JetBrains Mono', monospace" }}>
                  {Math.round(progress * 100)}% — {c.simulating}
                </p>
              </div>
            )}

            {/* Start button */}
            <button
              onClick={startSim}
              disabled={!password || running}
              className="w-full py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-200"
              style={{
                background: !password || running
                  ? dark ? "rgba(30,45,74,0.5)" : "#e2e8f0"
                  : "linear-gradient(135deg, var(--cyber-blue), var(--cyber-purple))",
                color: !password || running ? "var(--muted-foreground)" : "#fff",
                cursor: !password || running ? "not-allowed" : "pointer",
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                letterSpacing: "0.05em",
                boxShadow: password && !running ? "0 4px 20px rgba(59,130,246,0.35)" : "none",
              }}
            >
              <Play className="w-4 h-4" />
              {running ? c.simulating : c.startBtn}
            </button>
          </div>

          {/* What is brute force */}
          <div
            className="rounded-2xl p-6"
            style={{ background: cardBg, border: "1px solid " + cardBorder, boxShadow: dark ? "0 4px 24px rgba(0,0,0,0.4)" : "0 4px 24px rgba(37,99,235,0.07)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4" style={{ color: "var(--cyber-cyan)" }} />
              <h3 style={{ color: dark ? "#e2e8f0" : "#0f172a", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>
                {c.whatIsBrute}
              </h3>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              {c.bruteDesc}
            </p>

            {/* Charset table */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {c.charsetInfo.map((ci) => (
                <div
                  key={ci.label}
                  className="rounded-lg px-3 py-2 flex items-center justify-between"
                  style={{ background: dark ? "rgba(30,45,74,0.5)" : "rgba(241,245,249,0.8)", border: "1px solid " + cardBorder }}
                >
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{ci.label}</span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "var(--cyber-cyan)", fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {ci.chars}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Tips sidebar */}
        <div>
          <div
            className="rounded-2xl p-6 sticky top-20"
            style={{ background: cardBg, border: "1px solid " + cardBorder, boxShadow: dark ? "0 4px 24px rgba(0,0,0,0.4)" : "0 4px 24px rgba(37,99,235,0.07)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4" style={{ color: "var(--cyber-green)" }} />
              <h3 style={{ color: dark ? "#e2e8f0" : "#0f172a", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>
                {c.tipsTitle}
              </h3>
            </div>
            <ul className="space-y-3">
              {c.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--cyber-green)" }} />
                  <span style={{ color: dark ? "#94a3b8" : "#475569" }}>{tip}</span>
                </li>
              ))}
            </ul>

            {/* Decorative security rings */}
            <div className="mt-6 flex items-center justify-center">
              <div className="relative w-24 h-24">
                <div
                  className="absolute inset-0 rounded-full opacity-20"
                  style={{ border: "2px solid var(--cyber-blue)" }}
                />
                <div
                  className="absolute inset-2 rounded-full opacity-30"
                  style={{ border: "2px solid var(--cyber-cyan)" }}
                />
                <div
                  className="absolute inset-4 rounded-full opacity-40"
                  style={{ border: "2px solid var(--cyber-purple)" }}
                />
                <div
                  className="absolute inset-6 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, var(--cyber-blue), var(--cyber-purple))" }}
                >
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
