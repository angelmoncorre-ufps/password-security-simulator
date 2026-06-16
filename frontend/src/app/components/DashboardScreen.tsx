import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, ShieldX, ShieldCheck, Shield, AlertTriangle,
  Clock, Hash, Zap, CheckCircle, XCircle, AlertCircle, Play,
  RotateCcw, TrendingUp, Info,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";

type Lang = "en" | "es";
interface Props { lang: Lang; dark: boolean; }

const t = {
  en: {
    title: "Comparison Dashboard",
    sub: "See how brute-force affects accounts with different password strengths",
    runAll: "Run All Simulations",
    resetAll: "Reset All",
    accounts: [
      {
        id: "w1", email: "student.weak@demo.edu", password: "abc123",
        label: "Weak Password", tag: "Cracked in < 1s",
        verdict: "CRACKED", story: "This account used a 6-char lowercase+digit password with zero complexity. Cracked instantly.",
        storyEs: "Esta cuenta usó una contraseña de 6 caracteres con cero complejidad. Crackeada al instante.",
        labelEs: "Contraseña Débil", tagEs: "Crackeada en < 1s",
        verdictEs: "CRACKEADA",
        duration: 1800, foundAt: 0.2,
      },
      {
        id: "m1", email: "user.medium@demo.edu", password: "P@ssw0rd",
        label: "Medium Password", tag: "Cracked in ~30s",
        verdict: "CRACKED", story: "Common substitution pattern (a→@, o→0). Cracked by a dictionary+rules attack within seconds.",
        storyEs: "Patrón de sustitución común (a→@, o→0). Crackeada por un ataque de diccionario+reglas en segundos.",
        labelEs: "Contraseña Media", tagEs: "Crackeada en ~30s",
        verdictEs: "CRACKEADA",
        duration: 3200, foundAt: 0.72,
      },
      {
        id: "s1", email: "admin.strong@demo.edu", password: "Tr0ub4dor&3!x",
        label: "Strong Password", tag: "Survived simulation",
        verdict: "SURVIVED", story: "High entropy passphrase-style password. Brute-force would take billions of years on current hardware.",
        storyEs: "Contraseña de alta entropía estilo frase. La fuerza bruta tomaría miles de millones de años.",
        labelEs: "Contraseña Fuerte", tagEs: "Sobrevivió la simulación",
        verdictEs: "SOBREVIVIÓ",
        duration: 4000, foundAt: 9999,
      },
      {
        id: "r1", email: "reused.risky@demo.edu", password: "sunshine",
        label: "Reused / Risky", tag: "Found in breach list",
        verdict: "EXPOSED", story: "This password appears in 1.3M known breach databases. Instantly matched — no brute force needed.",
        storyEs: "Esta contraseña aparece en 1.3M de bases de datos de brechas conocidas. Coincidencia instantánea.",
        labelEs: "Reutilizada / Arriesgada", tagEs: "Encontrada en lista de brechas",
        verdictEs: "EXPUESTA",
        duration: 900, foundAt: 0.05,
      },
    ],
    whyTitle: "Why Does Strength Matter So Much?",
    whyText: "Each extra character — especially from a larger charset — multiplies the total search space exponentially. A 10-character password drawn from 95 ASCII characters has 10^19 combinations; increasing to 16 characters gives 10^31. At 10B guesses/sec, the first takes ~30 years; the second would take longer than the age of the universe.",
    radarTitle: "Security Profile Comparison",
    barTitle: "Entropy (bits) by Account",
    statsTitle: "Attack Statistics",
    attempts: "Attempts", time: "Sim Time", entropy: "Entropy", crackTime: "Crack Time",
    explanationTitle: "Understanding the Results",
    explanations: [
      { icon: ShieldX, color: "var(--cyber-red)", label: "Weak (abc123)", text: "6 chars, 36-char charset → 2 billion combinations. Cracked in milliseconds by modern GPU." },
      { icon: AlertCircle, color: "var(--cyber-amber)", label: "Medium (P@ssw0rd)", text: "8 chars, ~70-char charset → 576 billion combinations. Cracked in seconds with dictionary+rules." },
      { icon: Shield, color: "var(--cyber-blue)", label: "Strong (Tr0ub4dor&3!x)", text: "13 chars, 95-char charset → 10^25 combinations. Would take billions of years." },
      { icon: AlertTriangle, color: "var(--cyber-purple)", label: "Reused (sunshine)", text: "Even strong-looking passwords reused across sites are immediately exposed via breach databases." },
    ],
    explanationsEs: [
      { icon: ShieldX, color: "var(--cyber-red)", label: "Débil (abc123)", text: "6 chars, charset 36 → 2 mil millones de combinaciones. Crackeada en milisegundos con GPU moderno." },
      { icon: AlertCircle, color: "var(--cyber-amber)", label: "Media (P@ssw0rd)", text: "8 chars, charset ~70 → 576 mil millones de combinaciones. Crackeada en segundos con diccionario+reglas." },
      { icon: Shield, color: "var(--cyber-blue)", label: "Fuerte (Tr0ub4dor&3!x)", text: "13 chars, charset 95 → 10^25 combinaciones. Tomaría miles de millones de años." },
      { icon: AlertTriangle, color: "var(--cyber-purple)", label: "Reutilizada (sunshine)", text: "Incluso contraseñas reutilizadas en varios sitios quedan expuestas inmediatamente por bases de brechas." },
    ],
  },
  es: {
    title: "Panel de Comparación",
    sub: "Observa cómo la fuerza bruta afecta cuentas con diferentes fortalezas de contraseña",
    runAll: "Ejecutar Todas las Simulaciones",
    resetAll: "Reiniciar Todo",
    accounts: [], // filled below
    whyTitle: "¿Por Qué Importa Tanto la Fortaleza?",
    whyText: "Cada carácter adicional — especialmente de un charset más grande — multiplica el espacio de búsqueda total exponencialmente. Una contraseña de 10 caracteres con 95 caracteres ASCII tiene 10^19 combinaciones; aumentar a 16 da 10^31. A 10B intentos/seg, el primero toma ~30 años; el segundo tomaría más que la edad del universo.",
    radarTitle: "Comparación de Perfil de Seguridad",
    barTitle: "Entropía (bits) por Cuenta",
    statsTitle: "Estadísticas de Ataque",
    attempts: "Intentos", time: "Tiempo Sim.", entropy: "Entropía", crackTime: "Tiempo de Crackeo",
    explanationTitle: "Entendiendo los Resultados",
    explanations: [], explanationsEs: [],
  },
};

function computeEntropy(pwd: string) {
  let cs = 0;
  if (/[a-z]/.test(pwd)) cs += 26;
  if (/[A-Z]/.test(pwd)) cs += 26;
  if (/[0-9]/.test(pwd)) cs += 10;
  if (/[^a-zA-Z0-9]/.test(pwd)) cs += 33;
  if (cs === 0) cs = 26;
  return Math.round(pwd.length * Math.log2(cs));
}

function computeCrackTime(pwd: string): string {
  let cs = 0;
  if (/[a-z]/.test(pwd)) cs += 26;
  if (/[A-Z]/.test(pwd)) cs += 26;
  if (/[0-9]/.test(pwd)) cs += 10;
  if (/[^a-zA-Z0-9]/.test(pwd)) cs += 33;
  if (cs === 0) cs = 26;
  const secs = Math.pow(cs, pwd.length) / 1e10 / 2;
  if (secs < 0.001) return "< 1 ms";
  if (secs < 1) return `${(secs * 1000).toFixed(0)} ms`;
  if (secs < 60) return `${secs.toFixed(1)} sec`;
  if (secs < 3600) return `${(secs / 60).toFixed(1)} min`;
  if (secs < 86400) return `${(secs / 3600).toFixed(1)} hrs`;
  if (secs < 31536000) return `${(secs / 86400).toFixed(0)} days`;
  if (secs < 3.154e9) return `${(secs / 31536000).toFixed(0)} yrs`;
  return `${(secs / 3.154e13).toFixed(0)}M yrs`;
}

type AccountSim = {
  id: string; email: string; password: string;
  label: string; labelEs: string; tag: string; tagEs: string;
  verdict: string; verdictEs: string; story: string; storyEs: string;
  duration: number; foundAt: number;
};

type SimResult = { progress: number; done: boolean; cracked: boolean; attempts: number; elapsedMs: number; };

const ACCOUNTS: AccountSim[] = t.en.accounts as AccountSim[];
const COLORS = {
  "w1": "var(--cyber-red)",
  "m1": "var(--cyber-amber)",
  "s1": "var(--cyber-blue)",
  "r1": "var(--cyber-purple)",
};
const VERDICT_COLORS = {
  "CRACKED": "var(--cyber-red)", "EXPOSED": "var(--cyber-purple)",
  "SURVIVED": "var(--cyber-green)", "CRACKEADA": "var(--cyber-red)",
  "EXPUESTA": "var(--cyber-purple)", "SOBREVIVIÓ": "var(--cyber-green)",
};

export function DashboardScreen({ lang, dark }: Props) {
  const c = lang === "en" ? t.en : t.es;
  const [sims, setSims] = useState<Record<string, SimResult>>({});
  const [running, setRunning] = useState(false);
  const intervalsRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});
  const startTimesRef = useRef<Record<string, number>>({});

  const cardBg = dark ? "rgba(15,26,46,0.9)" : "rgba(255,255,255,0.95)";
  const cardBorder = dark ? "rgba(59,130,246,0.2)" : "rgba(37,99,235,0.12)";

  const clearAll = () => {
    Object.values(intervalsRef.current).forEach(clearInterval);
    intervalsRef.current = {};
  };

  useEffect(() => () => clearAll(), []);

  const runAll = () => {
    clearAll();
    setSims({});
    setRunning(true);

    ACCOUNTS.forEach(acc => {
      const startTime = Date.now();
      startTimesRef.current[acc.id] = startTime;
      let localProgress = 0;
      let localAttempts = 0;

      intervalsRef.current[acc.id] = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const rawProgress = Math.min(elapsed / acc.duration, 1);
        const foundFraction = acc.foundAt;
        const found = rawProgress >= foundFraction && foundFraction <= 1;
        const finalProgress = found ? foundFraction : rawProgress;
        localAttempts = Math.floor(finalProgress * 500);
        localProgress = finalProgress;

        const cracked = foundFraction <= 1 && rawProgress >= foundFraction;

        setSims(prev => ({
          ...prev,
          [acc.id]: {
            progress: finalProgress * 100,
            done: rawProgress >= 1 || cracked,
            cracked: cracked || (rawProgress >= 1 && foundFraction <= 1),
            attempts: Math.floor(finalProgress * 500),
            elapsedMs: elapsed,
          },
        }));

        if (rawProgress >= 1 || cracked) {
          clearInterval(intervalsRef.current[acc.id]);
        }
      }, 50);
    });

    setTimeout(() => setRunning(false), Math.max(...ACCOUNTS.map(a => a.duration)) + 500);
  };

  const resetAll = () => {
    clearAll();
    setSims({});
    setRunning(false);
  };

  const barData = ACCOUNTS.map(a => ({
    name: lang === "en" ? a.label.split(" ")[0] : a.labelEs.split(" ")[0],
    entropy: computeEntropy(a.password),
    color: COLORS[a.id as keyof typeof COLORS],
  }));

  const radarData = [
    { subject: lang === "en" ? "Entropy" : "Entropía",   w1: 15, m1: 38, s1: 85, r1: 18 },
    { subject: lang === "en" ? "Length" : "Longitud",     w1: 20, m1: 45, s1: 80, r1: 35 },
    { subject: lang === "en" ? "Charset" : "Charset",     w1: 30, m1: 60, s1: 90, r1: 25 },
    { subject: lang === "en" ? "Uniqueness" : "Unicidad", w1: 10, m1: 30, s1: 95, r1: 5 },
    { subject: lang === "en" ? "Symbols" : "Símbolos",    w1: 0,  m1: 50, s1: 85, r1: 0 },
  ];

  const explainList = lang === "en" ? t.en.explanations : t.en.explanationsEs;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: dark ? "#e2e8f0" : "#0f172a", fontSize: "1.5rem" }}>
            <LayoutDashboard className="inline w-5 h-5 mr-2 mb-0.5" style={{ color: "var(--cyber-cyan)" }} />
            {c.title}
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>{c.sub}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetAll}
            className="px-3.5 py-2 rounded-xl border border-border text-sm flex items-center gap-1.5 transition-colors hover:bg-muted"
            style={{ color: "var(--muted-foreground)", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600 }}
          >
            <RotateCcw className="w-3.5 h-3.5" /> {c.resetAll}
          </button>
          <button
            onClick={runAll}
            disabled={running}
            className="px-4 py-2 rounded-xl text-sm flex items-center gap-1.5 transition-all"
            style={{
              background: running ? "var(--muted)" : "linear-gradient(135deg, var(--cyber-blue), var(--cyber-purple))",
              color: running ? "var(--muted-foreground)" : "#fff",
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: "0.04em",
              boxShadow: running ? "none" : "0 4px 16px rgba(59,130,246,0.3)",
            }}
          >
            <Play className="w-3.5 h-3.5" />
            {c.runAll}
          </button>
        </div>
      </div>

      {/* Account cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {ACCOUNTS.map(acc => {
          const sim = sims[acc.id];
          const color = COLORS[acc.id as keyof typeof COLORS];
          const entropy = computeEntropy(acc.password);
          const crackTime = computeCrackTime(acc.password);
          const label = lang === "en" ? acc.label : acc.labelEs;
          const tag = lang === "en" ? acc.tag : acc.tagEs;
          const verdict = lang === "en" ? acc.verdict : acc.verdictEs;
          const story = lang === "en" ? acc.story : acc.storyEs;
          const isFound = acc.foundAt <= 1;
          const verdictColor = VERDICT_COLORS[verdict] ?? color;

          return (
            <div
              key={acc.id}
              className="rounded-2xl overflow-hidden flex flex-col"
              style={{
                background: cardBg,
                border: `1px solid ${sim?.done ? `${verdictColor}50` : cardBorder}`,
                boxShadow: sim?.done ? `0 4px 24px ${verdictColor}20` : dark ? "0 4px 24px rgba(0,0,0,0.4)" : "0 4px 24px rgba(37,99,235,0.07)",
                transition: "box-shadow 0.5s, border-color 0.5s",
              }}
            >
              {/* Card header color strip */}
              <div className="h-1" style={{ background: color }} />

              <div className="p-4 flex-1 space-y-3">
                {/* Label + tag */}
                <div>
                  <div
                    className="text-sm font-semibold"
                    style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: dark ? "#e2e8f0" : "#0f172a" }}
                  >
                    {label}
                  </div>
                  <div
                    className="text-xs mt-0.5"
                    style={{ color, fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {tag}
                  </div>
                </div>

                {/* Email */}
                <div
                  className="text-xs break-all rounded-lg px-2 py-1.5"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    background: dark ? "rgba(30,45,74,0.5)" : "#f8fafc",
                    color: dark ? "#64748b" : "#94a3b8",
                    border: `1px solid ${cardBorder}`,
                  }}
                >
                  {acc.email}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg p-2" style={{ background: dark ? "rgba(30,45,74,0.4)" : "#f1f5f9" }}>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>Entropy</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem", fontWeight: 700, color }}>{entropy}b</div>
                  </div>
                  <div className="rounded-lg p-2" style={{ background: dark ? "rgba(30,45,74,0.4)" : "#f1f5f9" }}>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>Crack</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem", fontWeight: 700, color }}>{crackTime}</div>
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: dark ? "rgba(30,45,74,0.8)" : "#e2e8f0" }}>
                    <div
                      className="h-full rounded-full transition-all duration-100"
                      style={{
                        width: `${sim?.progress ?? 0}%`,
                        background: sim?.done
                          ? (isFound ? "var(--cyber-red)" : "var(--cyber-green)")
                          : color,
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "'JetBrains Mono', monospace" }}>
                    <span>{Math.round(sim?.progress ?? 0)}%</span>
                    {sim?.attempts != null && <span>{sim.attempts} att.</span>}
                  </div>
                </div>

                {/* Story */}
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{story}</p>
              </div>

              {/* Verdict footer */}
              <div
                className="px-4 py-2.5 flex items-center gap-2"
                style={{
                  background: sim?.done
                    ? `${verdictColor}15`
                    : dark ? "rgba(30,45,74,0.3)" : "rgba(241,245,249,0.8)",
                  borderTop: `1px solid ${cardBorder}`,
                  transition: "background 0.5s",
                }}
              >
                {sim?.done ? (
                  <>
                    {isFound
                      ? <ShieldX className="w-4 h-4 shrink-0" style={{ color: verdictColor }} />
                      : <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: verdictColor }} />}
                    <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: verdictColor, fontSize: "0.85rem" }}>
                      {verdict}
                    </span>
                  </>
                ) : running ? (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: color }} />
                    <span className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "'JetBrains Mono', monospace" }}>
                      testing…
                    </span>
                  </>
                ) : (
                  <span className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "'JetBrains Mono', monospace" }}>
                    [ ready ]
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart */}
        <div className="rounded-2xl p-5" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
          <h3 className="mb-4" style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: dark ? "#e2e8f0" : "#0f172a" }}>
            {c.barTitle}
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: dark ? "#475569" : "#94a3b8", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: dark ? "#475569" : "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: dark ? "#0f1a2e" : "#fff", border: `1px solid ${cardBorder}`, borderRadius: "10px", color: dark ? "#e2e8f0" : "#0f172a", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}
                cursor={{ fill: dark ? "rgba(59,130,246,0.05)" : "rgba(37,99,235,0.04)" }}
              />
              <Bar dataKey="entropy" radius={[6, 6, 0, 0]}>
                {barData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar chart */}
        <div className="rounded-2xl p-5" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
          <h3 className="mb-4" style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: dark ? "#e2e8f0" : "#0f172a" }}>
            {c.radarTitle}
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={dark ? "rgba(59,130,246,0.15)" : "rgba(37,99,235,0.1)"} />
              <PolarAngleAxis dataKey="subject" tick={{ fill: dark ? "#475569" : "#94a3b8", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} />
              <Radar key="w1" name="Weak" dataKey="w1" stroke="var(--cyber-red)" fill="var(--cyber-red)" fillOpacity={0.1} />
              <Radar key="m1" name="Medium" dataKey="m1" stroke="var(--cyber-amber)" fill="var(--cyber-amber)" fillOpacity={0.1} />
              <Radar key="s1" name="Strong" dataKey="s1" stroke="var(--cyber-blue)" fill="var(--cyber-blue)" fillOpacity={0.1} />
              <Radar key="r1" name="Reused" dataKey="r1" stroke="var(--cyber-purple)" fill="var(--cyber-purple)" fillOpacity={0.1} />
            </RadarChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {[
              { label: "Weak", color: "var(--cyber-red)" },
              { label: "Medium", color: "var(--cyber-amber)" },
              { label: "Strong", color: "var(--cyber-blue)" },
              { label: "Reused", color: "var(--cyber-purple)" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Why strength matters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl p-6" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4" style={{ color: "var(--cyber-cyan)" }} />
            <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: dark ? "#e2e8f0" : "#0f172a" }}>
              {c.whyTitle}
            </h3>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{c.whyText}</p>
        </div>

        <div className="rounded-2xl p-6" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4" style={{ color: "var(--cyber-blue)" }} />
            <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: dark ? "#e2e8f0" : "#0f172a" }}>
              {c.explanationTitle}
            </h3>
          </div>
          <div className="space-y-3">
            {explainList.map((e, i) => {
              const Icon = e.icon;
              return (
                <div key={i} className="flex items-start gap-2.5">
                  <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: e.color }} />
                  <div>
                    <div className="text-xs font-semibold mb-0.5" style={{ color: e.color, fontFamily: "'Rajdhani', sans-serif" }}>{e.label}</div>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{e.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
