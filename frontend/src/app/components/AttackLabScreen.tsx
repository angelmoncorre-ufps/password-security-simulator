import { useState, useEffect, useRef, useCallback } from "react";
import {
  Target, Play, Pause, Square, RotateCcw, Zap, Clock,
  Hash, Shield, ShieldX, ShieldCheck, CheckCircle, XCircle,
  AlertTriangle, ChevronRight, Mail, Lock, TrendingUp,
  Download, Share2, Gauge, Activity,
} from "lucide-react";
import { DemoAccount, computeStats, deriveStrength, formatTime } from "./types";
import { SimulationComparison } from "./SimulationComparison";

type Lang = "en" | "es";
type SimMode = "step" | "normal" | "fast";
type SimState = "idle" | "running" | "paused" | "found" | "exhausted" | "stopped";

interface Props { lang: Lang; dark: boolean; accounts: DemoAccount[]; preSelected?: DemoAccount | null; onClearPreSelected: () => void; }

const t = {
  en: {
    title: "Attack Lab — Live Simulation",
    sub: "Select a target account and watch the brute-force search in real time",
    step1: "1. Select Target",
    step2: "2. Configure Attack",
    step3: "3. Live Attack",
    step4: "4. Result & Share",
    noAccounts: "No demo accounts yet. Add some in the Lab tab first.",
    selectPrompt: "Choose a target account:",
    modeLabel: "Simulation Mode",
    modeStep: "Step-by-step", modeStepDesc: "Advance manually",
    modeNormal: "Normal", modeNormalDesc: "Realistic speed",
    modeFast: "Fast", modeFastDesc: "Compressed time",
    startBtn: "Launch Attack",
    nextStepBtn: "Next Attempt →",
    pauseBtn: "Pause", resumeBtn: "Resume", stopBtn: "Stop", resetBtn: "Reset",
    attemptsLabel: "Attempts", elapsedLabel: "Elapsed", speedLabel: "Speed", progressLabel: "Progress",
    logTitle: "Live Attempt Log",
    resultFound: "PASSWORD FOUND", resultExhausted: "NOT CRACKED", resultStopped: "SIMULATION STOPPED",
    foundDesc: "The password was discovered during the simulation.",
    exhaustedDesc: "The simulation reached its limit without finding the password.",
    stoppedDesc: "You stopped the simulation manually.",
    shareTitle: "Presentation Card",
    shareAccount: "Target Account", shareResult: "Result", shareAttempts: "Attempts Made",
    shareTime: "Time Elapsed", shareEntropy: "Entropy", shareConclusion: "Conclusion",
    conclusionWeak: "This weak password was cracked almost instantly. Even basic security measures would prevent this.",
    conclusionMedium: "This medium-strength password took some time but is still vulnerable to dedicated hardware.",
    conclusionStrong: "This strong password resisted the simulation. Brute-force would take millions of years.",
    downloadCard: "Save Card", shareCard: "Share",
    disclaimer: "Educational simulation only. No real systems were accessed.",
    strengthNote: "Password Strength Analysis",
    charset: "Charset Size", entropy: "Entropy", theoCrack: "Theoretical Crack Time",
    warningLabel: "Attack in progress — educational simulation only",
    modeInfo: "Speed",
    attemptsPerSec: "attempts/sec",
  },
  es: {
    title: "Lab de Ataque — Simulación en Vivo",
    sub: "Selecciona una cuenta objetivo y observa la búsqueda de fuerza bruta en tiempo real",
    step1: "1. Elegir Objetivo",
    step2: "2. Configurar Ataque",
    step3: "3. Ataque en Vivo",
    step4: "4. Resultado y Compartir",
    noAccounts: "Sin cuentas demo. Agrega algunas en la pestaña Lab primero.",
    selectPrompt: "Elige una cuenta objetivo:",
    modeLabel: "Modo de Simulación",
    modeStep: "Paso a paso", modeStepDesc: "Avanza manualmente",
    modeNormal: "Normal", modeNormalDesc: "Velocidad realista",
    modeFast: "Rápido", modeFastDesc: "Tiempo comprimido",
    startBtn: "Lanzar Ataque",
    nextStepBtn: "Siguiente Intento →",
    pauseBtn: "Pausar", resumeBtn: "Reanudar", stopBtn: "Detener", resetBtn: "Reiniciar",
    attemptsLabel: "Intentos", elapsedLabel: "Transcurrido", speedLabel: "Velocidad", progressLabel: "Progreso",
    logTitle: "Registro de Intentos en Vivo",
    resultFound: "CONTRASEÑA ENCONTRADA", resultExhausted: "NO CRACKEADA", resultStopped: "SIMULACIÓN DETENIDA",
    foundDesc: "La contraseña fue descubierta durante la simulación.",
    exhaustedDesc: "La simulación alcanzó su límite sin encontrar la contraseña.",
    stoppedDesc: "Detuviste la simulación manualmente.",
    shareTitle: "Tarjeta de Presentación",
    shareAccount: "Cuenta Objetivo", shareResult: "Resultado", shareAttempts: "Intentos Realizados",
    shareTime: "Tiempo Transcurrido", shareEntropy: "Entropía", shareConclusion: "Conclusión",
    conclusionWeak: "Esta contraseña débil fue crackeada casi instantáneamente. Incluso medidas básicas de seguridad lo prevendrían.",
    conclusionMedium: "Esta contraseña de fortaleza media tomó algo de tiempo, pero sigue siendo vulnerable para hardware dedicado.",
    conclusionStrong: "Esta contraseña fuerte resistió la simulación. La fuerza bruta tomaría millones de años.",
    downloadCard: "Guardar Tarjeta", shareCard: "Compartir",
    disclaimer: "Solo simulación educativa. No se accedió a ningún sistema real.",
    strengthNote: "Análisis de Fortaleza de Contraseña",
    charset: "Tamaño Charset", entropy: "Entropía", theoCrack: "Tiempo Teórico de Crackeo",
    warningLabel: "Ataque en curso — solo simulación educativa",
    modeInfo: "Velocidad",
    attemptsPerSec: "intentos/seg",
  },
};

const COMMON_WEAK = ["123456", "password", "abc123", "qwerty", "admin", "letmein", "monkey", "1234567890", "pass", "123"];
const CHARSETS = { lower: "abcdefghijklmnopqrstuvwxyz", upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", digits: "0123456789", special: "!@#$%^&*" };

function getCharset(pwd: string): string {
  let cs = "";
  if (/[a-z]/.test(pwd)) cs += CHARSETS.lower;
  if (/[A-Z]/.test(pwd)) cs += CHARSETS.upper;
  if (/[0-9]/.test(pwd)) cs += CHARSETS.digits;
  if (/[^a-zA-Z0-9]/.test(pwd)) cs += CHARSETS.special;
  return cs || CHARSETS.lower;
}

function randomCandidate(cs: string, len: number): string {
  return Array.from({ length: len }, () => cs[Math.floor(Math.random() * cs.length)]).join("");
}

function generateCandidateBatch(pwd: string, n: number, foundAt: number, total: number, batchIdx: number): string[] {
  const cs = getCharset(pwd);
  const len = pwd.length;
  return Array.from({ length: n }, (_, i) => {
    const absIdx = batchIdx * n + i;
    if (absIdx === foundAt) return pwd;
    if (absIdx < 8 && COMMON_WEAK[absIdx]) return COMMON_WEAK[absIdx].slice(0, Math.max(len - 2, 3));
    return randomCandidate(cs, Math.max(Math.floor(len * 0.6 + Math.random() * len * 0.8), 3));
  });
}

const SPEED_MAP: Record<SimMode, number> = { step: 0, normal: 100, fast: 20 };
const BATCH_SIZE: Record<SimMode, number> = { step: 1, normal: 3, fast: 15 };
const MAX_DISPLAY_ENTRIES = 40;

const MAX_SIM_ATTEMPTS: Record<string, number> = {
  "weak": 100, "medium": 500, "very-strong": 300, "strong": 400,
};
const FIND_AT_FRACTION: Record<string, number> = {
  "weak": 0.3, "medium": 0.75, "strong": 2, "very-strong": 3,
};

function formatAttempts(n: number): string {
  if (n < 1000) return n.toString();
  if (n < 1e6) return `${(n / 1000).toFixed(1)}K`;
  if (n < 1e9) return `${(n / 1e6).toFixed(1)}M`;
  return `${(n / 1e9).toFixed(1)}B`;
}

export function AttackLabScreen({ lang, dark, accounts, preSelected, onClearPreSelected }: Props) {
  const c = t[lang];
  const [selectedAcc, setSelectedAcc] = useState<DemoAccount | null>(null);
  const [mode, setMode] = useState<SimMode>("normal");
  const [simState, setSimState] = useState<SimState>("idle");
  const [logEntries, setLogEntries] = useState<{ text: string; isMatch: boolean }[]>([]);
  const [attemptCount, setAttemptCount] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);

  const logRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const batchIdxRef = useRef(0);
  const maxAttemptsRef = useRef(100);
  const findAtRef = useRef(30);
  const startTimeRef = useRef(0);
  const lastSpeedRef = useRef({ count: 0, time: 0 });

  // Handle preSelected from Lab tab
  useEffect(() => {
    if (preSelected) {
      setSelectedAcc(preSelected);
      setActiveStep(2);
      setSimState("idle");
      resetState();
      onClearPreSelected();
    }
  }, [preSelected]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logEntries]);

  const resetState = () => {
    setLogEntries([]);
    setAttemptCount(0);
    setElapsedMs(0);
    setSpeed(0);
    batchIdxRef.current = 0;
  };

  const stopIntervals = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const runBatch = useCallback(async (acc: DemoAccount) => {
    const max = maxAttemptsRef.current;
    const findAt = findAtRef.current;
    const batchSize = BATCH_SIZE[mode];

    setAttemptCount(prev => {
      const next = prev + batchSize;

      const candidates = generateCandidateBatch(acc.password, batchSize, findAt, max, batchIdxRef.current);
      batchIdxRef.current += 1;

      setLogEntries(prevLog => {
        const newEntries = candidates.map(c => ({ text: c, isMatch: c === acc.password }));
        const combined = [...prevLog, ...newEntries];
        return combined.slice(-MAX_DISPLAY_ENTRIES);
      });

      const found = candidates.includes(acc.password);

      if (found || next >= findAt) {
        stopIntervals();
        setSimState("found");
        setActiveStep(4);
        return Math.min(next, findAt);
      }

      if (next >= max) {
        stopIntervals();
        const willFind = FIND_AT_FRACTION[acc.strength] <= 1;
        setSimState(willFind ? "found" : "exhausted");
        setActiveStep(4);
        return next;
      }

      // Update speed
      const now = Date.now();
      const elapsed = now - lastSpeedRef.current.time;
      if (elapsed > 500) {
        const spd = Math.round(((next - lastSpeedRef.current.count) / elapsed) * 1000);
        setSpeed(spd);
        lastSpeedRef.current = { count: next, time: now };
      }

      return next;
    });
  }, [mode]);

  const startSim = async () => {
    if (!selectedAcc) return;
    resetState();

    const max = MAX_SIM_ATTEMPTS[selectedAcc.strength] ?? 200;
    const fraction = FIND_AT_FRACTION[selectedAcc.strength] ?? 0.5;
    maxAttemptsRef.current = max;
    findAtRef.current = fraction <= 1 ? Math.floor(max * fraction) : max + 1;
    startTimeRef.current = Date.now();
    lastSpeedRef.current = { count: 0, time: Date.now() };

    setSimState("running");
    setActiveStep(3);

    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 100);

    if (mode !== "step") {
      intervalRef.current = setInterval(() => runBatch(selectedAcc), SPEED_MAP[mode]);
    }
  };

  const handleNextStep = async () => {
    if (selectedAcc && simState === "running" && mode === "step") {
      await runBatch(selectedAcc);
    }
  };

  const handlePause = async () => {
    if (simState === "running") {
      stopIntervals();
      if (timerRef.current) clearInterval(timerRef.current);
      setSimState("paused");
    } else if (simState === "paused" && selectedAcc) {
      startTimeRef.current = Date.now() - elapsedMs;
      timerRef.current = setInterval(() => setElapsedMs(Date.now() - startTimeRef.current), 100);
      if (mode !== "step") {
        intervalRef.current = setInterval(() => runBatch(selectedAcc), SPEED_MAP[mode]);
      }
      setSimState("running");
    }
  };

  const handleStop = async () => {
    stopIntervals();
    setSimState("stopped");
    setActiveStep(4);
  };

  const handleReset = async () => {
    stopIntervals();
    resetState();
    setSimState("idle");
    setActiveStep(selectedAcc ? 2 : 1);
  };

  useEffect(() => () => stopIntervals(), []);

  const stats = selectedAcc ? computeStats(selectedAcc.password) : null;
  const progress = maxAttemptsRef.current > 0
    ? Math.min((attemptCount / maxAttemptsRef.current) * 100, 100)
    : 0;

  const cardBg = dark ? "rgba(15,26,46,0.9)" : "rgba(255,255,255,0.95)";
  const cardBorder = dark ? "rgba(59,130,246,0.2)" : "rgba(37,99,235,0.12)";

  const isRunning = simState === "running";
  const isDone = simState === "found" || simState === "exhausted" || simState === "stopped";
  const isFound = simState === "found";
  const resultColor = isFound ? "var(--cyber-green)" : simState === "exhausted" ? "var(--cyber-red)" : "var(--cyber-amber)";

  const strengthColors = {
    "weak": "var(--cyber-red)", "medium": "var(--cyber-amber)",
    "strong": "var(--cyber-blue)", "very-strong": "var(--cyber-green)",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div>
        <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: dark ? "#e2e8f0" : "#0f172a", fontSize: "1.5rem" }}>
          ⚡ {c.title}
        </h2>
        <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>{c.sub}</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {([c.step1, c.step2, c.step3, c.step4] as const).map((label, i) => {
          const step = (i + 1) as 1 | 2 | 3 | 4;
          const isActive = activeStep === step;
          const isDoneStep = activeStep > step;
          return (
            <div key={i} className="flex items-center gap-2 shrink-0">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all"
                style={{
                  background: isActive ? "linear-gradient(135deg, var(--cyber-blue), var(--cyber-purple))" : isDoneStep ? "rgba(16,185,129,0.15)" : dark ? "rgba(30,45,74,0.5)" : "#f1f5f9",
                  border: "1px solid " + (isActive ? "transparent" : isDoneStep ? "rgba(16,185,129,0.3)" : cardBorder),
                  color: isActive ? "#fff" : isDoneStep ? "var(--cyber-green)" : "var(--muted-foreground)",
                  fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
                }}
              >
                {isDoneStep && <CheckCircle className="w-3 h-3" />}
                {label}
              </div>
              {i < 3 && <ChevronRight className="w-3 h-3 shrink-0" style={{ color: "var(--muted-foreground)" }} />}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left panel: target + config */}
        <div className="lg:col-span-2 space-y-4">
          {/* Target selection */}
          <div className="rounded-2xl p-5" style={{ background: cardBg, border: "1px solid " + cardBorder }}>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4" style={{ color: "var(--cyber-blue)" }} />
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: dark ? "#e2e8f0" : "#0f172a" }}>{c.step1}</span>
            </div>
            {accounts.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{c.noAccounts}</p>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {accounts.map(acc => {
                  const isSelected = selectedAcc?.id === acc.id;
                  const sc = strengthColors[acc.strength] ?? "var(--cyber-blue)";
                  return (
                    <button
                      key={acc.id}
                      onClick={() => { setSelectedAcc(acc); setActiveStep(2); handleReset(); }}
                      className="w-full text-left rounded-xl px-3 py-2.5 transition-all"
                      style={{
                        background: isSelected ? `${sc}18` : dark ? "rgba(30,45,74,0.3)" : "#f8fafc",
                        border: "1px solid " + (isSelected ? sc : cardBorder),
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3 shrink-0" style={{ color: sc }} />
                        <span className="text-xs truncate flex-1" style={{ fontFamily: "'JetBrains Mono', monospace", color: dark ? "#e2e8f0" : "#0f172a" }}>
                          {acc.email}
                        </span>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full shrink-0"
                          style={{ background: `${sc}20`, color: sc, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}
                        >
                          {acc.strength.replace("-", " ")}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mode selection */}
          <div className="rounded-2xl p-5" style={{ background: cardBg, border: "1px solid " + cardBorder }}>
            <div className="flex items-center gap-2 mb-3">
              <Gauge className="w-4 h-4" style={{ color: "var(--cyber-purple)" }} />
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: dark ? "#e2e8f0" : "#0f172a" }}>{c.modeLabel}</span>
            </div>
            <div className="space-y-2">
              {([
                { id: "step" as SimMode, label: c.modeStep, desc: c.modeStepDesc },
                { id: "normal" as SimMode, label: c.modeNormal, desc: c.modeNormalDesc },
                { id: "fast" as SimMode, label: c.modeFast, desc: c.modeFastDesc },
              ]).map(m => (
                <button
                  key={m.id}
                  onClick={() => !isRunning && setMode(m.id)}
                  disabled={isRunning}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
                  style={{
                    background: mode === m.id ? "rgba(59,130,246,0.12)" : dark ? "rgba(30,45,74,0.3)" : "#f8fafc",
                    border: "1px solid " + (mode === m.id ? "rgba(59,130,246,0.4)" : cardBorder),
                    opacity: isRunning ? 0.6 : 1,
                  }}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0"
                    style={{ borderColor: mode === m.id ? "var(--cyber-blue)" : "var(--muted-foreground)" }}
                  >
                    {mode === m.id && <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--cyber-blue)" }} />}
                  </div>
                  <div>
                    <div className="text-sm" style={{ color: dark ? "#e2e8f0" : "#0f172a", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>{m.label}</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{m.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Password analysis */}
          {selectedAcc && stats && (
            <div className="rounded-2xl p-5 space-y-3" style={{ background: cardBg, border: "1px solid " + cardBorder }}>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" style={{ color: "var(--cyber-cyan)" }} />
                <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: dark ? "#e2e8f0" : "#0f172a" }}>{c.strengthNote}</span>
              </div>
              {[
                { label: c.charset, value: stats.charset.toString(), color: "var(--cyber-blue)" },
                { label: c.entropy, value: `${stats.entropy} bits`, color: "var(--cyber-purple)" },
                { label: c.theoCrack, value: stats.crackTime, color: strengthColors[stats.strength] ?? "var(--cyber-green)" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{label}</span>
                  <span className="text-xs font-semibold" style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Start / controls */}
          <div className="space-y-2">
            {simState === "idle" && (
              <button
                onClick={startSim}
                disabled={!selectedAcc}
                className="w-full py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                style={{
                  background: selectedAcc ? "linear-gradient(135deg, var(--cyber-red), var(--cyber-purple))" : "var(--muted)",
                  color: selectedAcc ? "#fff" : "var(--muted-foreground)",
                  fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: "0.05em",
                  boxShadow: selectedAcc ? "0 4px 20px rgba(239,68,68,0.35)" : "none",
                }}
              >
                <Zap className="w-4 h-4" />
                {c.startBtn}
              </button>
            )}

            {(isRunning || simState === "paused") && (
              <div className="flex gap-2">
                {mode === "step" && isRunning && (
                  <button
                    onClick={handleNextStep}
                    className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-sm transition-all"
                    style={{
                      background: "linear-gradient(135deg, var(--cyber-blue), var(--cyber-cyan))",
                      color: "#fff", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
                    }}
                  >
                    <Play className="w-3.5 h-3.5" /> {c.nextStepBtn}
                  </button>
                )}
                {mode !== "step" && (
                  <button
                    onClick={handlePause}
                    className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-sm border border-border transition-colors hover:bg-muted"
                    style={{ color: "var(--foreground)", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}
                  >
                    {simState === "paused" ? <><Play className="w-3.5 h-3.5" /> {c.resumeBtn}</> : <><Pause className="w-3.5 h-3.5" /> {c.pauseBtn}</>}
                  </button>
                )}
                <button
                  onClick={handleStop}
                  className="py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 text-sm transition-all"
                  style={{ background: "rgba(239,68,68,0.15)", color: "var(--cyber-red)", border: "1px solid rgba(239,68,68,0.3)", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}
                >
                  <Square className="w-3.5 h-3.5" /> {c.stopBtn}
                </button>
              </div>
            )}

            {isDone && (
              <button
                onClick={handleReset}
                className="w-full py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-sm border border-border transition-colors hover:bg-muted"
                style={{ color: "var(--foreground)", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}
              >
                <RotateCcw className="w-3.5 h-3.5" /> {c.resetBtn}
              </button>
            )}
          </div>
        </div>

        {/* Right panel: live attack + stats */}
        <div className="lg:col-span-3 space-y-4">
          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Hash, label: c.attemptsLabel, value: formatAttempts(attemptCount), color: "var(--cyber-blue)" },
              { icon: Clock, label: c.elapsedLabel, value: formatTime(elapsedMs / 1000), color: "var(--cyber-purple)" },
              { icon: Activity, label: c.speedLabel, value: `${formatAttempts(speed)}/s`, color: "var(--cyber-cyan)" },
              { icon: TrendingUp, label: c.progressLabel, value: `${Math.round(progress)}%`, color: "var(--cyber-amber)" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="rounded-xl p-3" style={{ background: cardBg, border: "1px solid " + cardBorder }}>
                <Icon className="w-3.5 h-3.5 mb-1" style={{ color }} />
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: "1rem", color }}>{value}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="rounded-xl p-4" style={{ background: cardBg, border: "1px solid " + cardBorder }}>
            <div className="flex justify-between items-center mb-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>{c.progressLabel}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{Math.round(progress)}%</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: dark ? "rgba(30,45,74,0.8)" : "#e2e8f0" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${progress}%`,
                  background: isDone && isFound
                    ? "linear-gradient(90deg, var(--cyber-green), #34d399)"
                    : isDone && !isFound
                    ? "linear-gradient(90deg, var(--cyber-red), var(--cyber-amber))"
                    : isRunning
                    ? "linear-gradient(90deg, var(--cyber-blue), var(--cyber-cyan))"
                    : "var(--muted)",
                }}
              />
            </div>
            {isRunning && (
              <div
                className="mt-1.5 text-xs flex items-center gap-1.5"
                style={{ color: "var(--cyber-amber)", fontFamily: "'JetBrains Mono', monospace" }}
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--cyber-amber)" }} />
                {c.warningLabel}
              </div>
            )}
          </div>

          {/* Live log */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: dark ? "#070d1a" : "#f8fafc", border: "1px solid " + cardBorder }}
          >
            <div
              className="flex items-center justify-between px-4 py-2.5 border-b"
              style={{ borderColor: cardBorder, background: dark ? "rgba(15,26,46,0.9)" : "rgba(226,232,240,0.7)" }}
            >
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: isRunning ? "#ef4444" : "#6b7280" }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: isRunning ? "#f59e0b" : "#6b7280" }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: isRunning ? "#22c55e" : "#6b7280" }} />
                </div>
                <span className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "'JetBrains Mono', monospace" }}>
                  {c.logTitle}
                </span>
              </div>
              {isRunning && (
                <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--cyber-green)", fontFamily: "'JetBrains Mono', monospace" }}>
                  <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--cyber-green)" }} />
                  LIVE
                </div>
              )}
            </div>

            <div
              ref={logRef}
              className="overflow-y-auto"
              style={{ height: "280px", scrollbarWidth: "thin" }}
            >
              {logEntries.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "'JetBrains Mono', monospace" }}>
                    {simState === "idle" ? "[ waiting for attack ]" : "[ initializing… ]"}
                  </p>
                </div>
              ) : (
                <div className="p-3 space-y-0.5">
                  {logEntries.map((entry, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg px-2 py-0.5 text-xs transition-all"
                      style={{
                        background: entry.isMatch
                          ? "rgba(16,185,129,0.15)"
                          : "transparent",
                        border: entry.isMatch ? "1px solid rgba(16,185,129,0.4)" : "1px solid transparent",
                      }}
                    >
                      <span style={{ color: "var(--muted-foreground)", fontFamily: "'JetBrains Mono', monospace", minWidth: "3rem" }}>
                        {(logEntries.indexOf(entry) + Math.max(0, attemptCount - MAX_DISPLAY_ENTRIES) + 1).toString().padStart(4, "0")}
                      </span>
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          color: entry.isMatch ? "var(--cyber-green)" : dark ? "#475569" : "#94a3b8",
                        }}
                      >
                        {entry.text}
                      </span>
                      {entry.isMatch && (
                        <span className="ml-auto flex items-center gap-1 text-xs" style={{ color: "var(--cyber-green)" }}>
                          <CheckCircle className="w-3 h-3" /> MATCH
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Result section */}
          {isDone && selectedAcc && (
            <div
              className="rounded-2xl p-5"
              style={{
                background: isFound
                  ? dark ? "rgba(16,185,129,0.08)" : "rgba(209,250,229,0.7)"
                  : dark ? "rgba(239,68,68,0.08)" : "rgba(254,226,226,0.7)",
                border: "1px solid " + (isFound ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"),
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                {isFound
                  ? <ShieldX className="w-8 h-8" style={{ color: "var(--cyber-green)" }} />
                  : <ShieldCheck className="w-8 h-8" style={{ color: "var(--cyber-red)" }} />}
                <div>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1.1rem", color: resultColor }}>
                    {isFound ? c.resultFound : simState === "exhausted" ? c.resultExhausted : c.resultStopped}
                  </div>
                  <div className="text-sm mt-0.5" style={{ color: dark ? "#94a3b8" : "#475569" }}>
                    {isFound ? c.foundDesc : simState === "exhausted" ? c.exhaustedDesc : c.stoppedDesc}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share / Presentation Card */}
      {isDone && selectedAcc && stats && (
        <div
          id="share-card"
          className="rounded-2xl overflow-hidden"
          style={{ background: cardBg, border: "1px solid " + cardBorder }}
        >
          <div
            className="px-6 py-3 flex items-center gap-2 border-b border-border"
            style={{ background: dark ? "rgba(30,45,74,0.5)" : "rgba(241,245,249,0.8)" }}
          >
            <Share2 className="w-4 h-4" style={{ color: "var(--cyber-cyan)" }} />
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: dark ? "#e2e8f0" : "#0f172a" }}>
              {c.shareTitle}
            </span>
            <span className="ml-auto text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "'JetBrains Mono', monospace" }}>
              {c.disclaimer}
            </span>
          </div>

          <div
            className="relative p-6 sm:p-8 overflow-hidden"
            style={{
              background: dark
                ? "linear-gradient(135deg, #0a0f1e 0%, #0f1a2e 50%, #1a103a 100%)"
                : "linear-gradient(135deg, #dbeafe 0%, #ede9fe 60%, #cffafe 100%)",
            }}
          >
            {/* Grid bg */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: "repeating-linear-gradient(0deg," + (dark ? "#3b82f6" : "#2563eb") + " 0," + (dark ? "#3b82f6" : "#2563eb") + " 1px,transparent 1px,transparent 32px),repeating-linear-gradient(90deg," + (dark ? "#3b82f6" : "#2563eb") + " 0," + (dark ? "#3b82f6" : "#2563eb") + " 1px,transparent 1px,transparent 32px)",
              }}
            />

            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Left: account info + result */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, var(--cyber-blue), var(--cyber-purple))" }}
                  >
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1.2rem",
                        color: dark ? "#e2e8f0" : "#0f172a",
                      }}
                    >
                      BruteForce Lab
                    </div>
                    <div className="text-xs" style={{ color: "var(--cyber-cyan)", fontFamily: "'JetBrains Mono', monospace" }}>
                      Educational Security Demo
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{c.shareAccount}</div>
                  <div
                    className="text-sm break-all"
                    style={{ fontFamily: "'JetBrains Mono', monospace", color: dark ? "#e2e8f0" : "#0f172a" }}
                  >
                    {selectedAcc.email}
                  </div>
                </div>

                <div
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{
                    background: isFound ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                    border: "1px solid " + (isFound ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"),
                  }}
                >
                  {isFound
                    ? <XCircle className="w-4 h-4" style={{ color: "var(--cyber-red)" }} />
                    : <ShieldCheck className="w-4 h-4" style={{ color: "var(--cyber-green)" }} />}
                  <span
                    style={{
                      fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
                      color: isFound ? "var(--cyber-red)" : "var(--cyber-green)",
                    }}
                  >
                    {isFound ? c.resultFound : c.resultExhausted}
                  </span>
                </div>
              </div>

              {/* Right: stats grid + conclusion */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: c.shareAttempts, value: formatAttempts(attemptCount), color: "var(--cyber-blue)" },
                    { label: c.shareTime, value: formatTime(elapsedMs / 1000), color: "var(--cyber-purple)" },
                    { label: c.shareEntropy, value: `${stats.entropy} bits`, color: "var(--cyber-cyan)" },
                    { label: c.theoCrack, value: stats.crackTime, color: strengthColors[stats.strength] ?? "var(--cyber-green)" },
                  ].map(({ label, value, color }) => (
                    <div
                      key={label}
                      className="rounded-xl p-3"
                      style={{ background: dark ? "rgba(15,26,46,0.7)" : "rgba(255,255,255,0.8)", border: "1px solid " + (dark ? "rgba(59,130,246,0.2)" : "rgba(37,99,235,0.1)") }}
                    >
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: "0.9rem", color }}>{value}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Conclusion box */}
                <div
                  className="rounded-xl p-3"
                  style={{
                    background: dark ? "rgba(15,26,46,0.7)" : "rgba(255,255,255,0.8)",
                    border: "1px solid " + resultColor + "40",
                  }}
                >
                  <div className="text-xs mb-1 font-semibold" style={{ color: resultColor, fontFamily: "'Rajdhani', sans-serif" }}>
                    {c.shareConclusion}
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: dark ? "#94a3b8" : "#475569" }}>
                    {selectedAcc.strength === "weak" ? c.conclusionWeak
                      : selectedAcc.strength === "medium" ? c.conclusionMedium
                      : c.conclusionStrong}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-Time vs Fast Comparison */}
      {selectedAcc && (
        <SimulationComparison lang={lang} dark={dark} selectedAcc={selectedAcc} />
      )}
    </div>
  );
}
