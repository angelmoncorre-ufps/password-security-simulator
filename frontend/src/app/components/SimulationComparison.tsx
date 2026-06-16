import { useState, useEffect, useRef } from "react";
import {
  Zap, Clock, Hash, Activity, Play, Pause, Square,
  RotateCcw, Shield, ShieldCheck, ShieldX, Target, Lock,
  CheckCircle, XCircle, AlertTriangle, Info, Gauge, TrendingUp,
  Code, FastForward, Book, Shuffle, Cpu,
} from "lucide-react";
import type { DemoAccount } from "./types";
import { computeStats, formatTime } from "./types";

type Lang = "en" | "es";
type AttackPhase = "dictionary" | "rules" | "bruteforce";
type AttackMode = "all" | "dictionary" | "rules" | "bruteforce";
type RtState = "idle" | "running" | "paused" | "found" | "exhausted";
type LogEntry = { attempt: number; candidate: string; isMatch: boolean; phase: AttackPhase };

interface Props {
  lang: Lang;
  dark: boolean;
  selectedAcc: DemoAccount;
}

/* ───────── Dictionary (top 200 common passwords) ───────── */
const DICTIONARY = [
  "123456", "password", "12345678", "qwerty", "123456789",
  "12345", "1234", "111111", "1234567", "sunshine",
  "qwerty123", "iloveyou", "princess", "admin", "welcome",
  "666666", "abc123", "football", "123123", "monkey",
  "654321", "!@#$%^&*", "charlie", "aa123456", "donald",
  "password1", "qwerty12345", "1234567890", "letmein", "password123",
  "dragon", "baseball", "adobe123", "admin123", "master",
  "photoshop", "1234", "ashley", "batman", "trustno1",
  "hottie", "flower", "qwerty123456", "lovely", "starwars",
  "passw0rd", "shadow", "michael", "superman", "654321",
  "jennifer", "purple", "qazwsx", "freedom", "hello",
  "jackson", "andrew", "thomas", "joshua", "charlie",
  "matrix", "internet", "robert", "william", "richard",
  "george", "steven", "miller", "wilson", "martin",
  "anderson", "thompson", "garcia", "rodriguez", "martinez",
  "hunter", "ranger", "sniper", "killer", "assassin",
  "nothing", "whatever", "something", "password!", "Password",
  "P@ssword", "p@ssword", "p@ssw0rd", "P@ssw0rd", "pass123",
  "test123", "test", "guest", "temp123", "default",
  "123qwe", "qwe123", "1q2w3e", "12qwaszx", "zxcvbnm",
  "qwertyuiop", "asdfghjkl", "zxcvbnm123", "1qaz2wsx", "3edc4rfv",
  "summer", "winter", "spring", "autumn", "october",
  "november", "december", "september", "august", "july",
  "june", "may", "april", "march", "february",
  "january", "1980", "1981", "1982", "1983",
  "1984", "1985", "1986", "1987", "1988",
  "1989", "1990", "1991", "1992", "1993",
  "1994", "1995", "1996", "1997", "1998",
  "1999", "2000", "2001", "2002", "2003",
  "2004", "2005", "2006", "2007", "2008",
  "2009", "2010", "2011", "2012", "2013",
  "2014", "2015", "2016", "2017", "2018",
  "2019", "2020", "2021", "2022", "2023",
  "2024", "2025", "2026", "abc", "abcd",
  "abcde", "abcdef", "abcdefg", "a1b2c3", "pass",
  "pass1234", "admin2024", "root", "toor", "system",
  "manager", "server", "backup", "secure", "s3cur3",
  "changeme", "pa\$\$word", "letmein123", "welcome1", "hello123",
  "blahblah", "testtest", "1234test", "test4321", "passw0rd!",
  "qwerty!@#", "abc!@#", "123!@#", "p@ss!", "hello!",
  "admin!", "root123", "toor123", "system123", "default123",
  "guest123", "temp!", "testing", "testing123", "test1234",
  "passwd", "pass123!", "P@\$\$w0rd", "passw0rd123", "P@ss1234",
  "letmein!", "welcome!", "Welcome1", "Password1", "Password123",
];

/* ───────── Rules engine ───────── */
const CHARSETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  special: "!@#$%^&*",
};

function getCharset(pwd: string): string {
  let cs = "";
  if (/[a-z]/.test(pwd)) cs += CHARSETS.lower;
  if (/[A-Z]/.test(pwd)) cs += CHARSETS.upper;
  if (/[0-9]/.test(pwd)) cs += CHARSETS.digits;
  if (/[^a-zA-Z0-9]/.test(pwd)) cs += CHARSETS.special;
  return cs || CHARSETS.lower;
}

const LEET: Record<string, string> = {
  a: "@", A: "4", e: "3", E: "3", i: "1", I: "1",
  o: "0", O: "0", s: "$", S: "$", t: "7", T: "7",
  l: "1", L: "1", b: "8", B: "8", g: "9", G: "9",
};

function toLeet(w: string): string {
  return w.split("").map((c) => LEET[c] || c).join("");
}

const SUFFIXES = ["123", "2024", "!", "@", "#", "1", "123!", "!@#"];
const PREFIXES = ["@", "!"];

function applyRules(word: string): string[] {
  const r: string[] = [];
  const cap = word.charAt(0).toUpperCase() + word.slice(1);
  const upper = word.toUpperCase();

  r.push(cap);
  r.push(upper);
  for (const s of SUFFIXES) r.push(word + s);
  for (const s of SUFFIXES) r.push(cap + s);
  for (const p of PREFIXES) r.push(p + word);
  for (const p of PREFIXES) r.push(p + cap);

  const leet = toLeet(word);
  if (leet !== word) {
    r.push(leet);
    r.push(cap.charAt(0).toUpperCase() + leet.slice(1));
    for (const s of SUFFIXES.slice(0, 3)) r.push(leet + s);
  }

  r.push(word.split("").reverse().join(""));
  r.push(word + word);
  return r;
}

/* ───────── Phase detection ───────── */
interface PhasePlan {
  found: boolean;
  foundPhase: AttackPhase | null;
  foundAttempt: number;
  phaseBreaks: { dictionary: number; rules: number };
}

function planPhaseFind(password: string, mode: AttackMode = "all"): PhasePlan {
  let attempt = 0;

  if (mode === "all" || mode === "dictionary") {
    const dictIdx = DICTIONARY.indexOf(password);
    if (dictIdx >= 0) {
      return { found: true, foundPhase: "dictionary", foundAttempt: dictIdx + 1, phaseBreaks: { dictionary: DICTIONARY.length, rules: 0 } };
    }
    attempt += DICTIONARY.length;
    if (mode === "dictionary") {
      return { found: false, foundPhase: null, foundAttempt: Infinity, phaseBreaks: { dictionary: DICTIONARY.length, rules: 0 } };
    }
  }

  if (mode === "all" || mode === "rules") {
    for (const word of DICTIONARY) {
      const mutations = applyRules(word);
      for (const m of mutations) {
        attempt++;
        if (m === password) {
          return { found: true, foundPhase: "rules", foundAttempt: attempt, phaseBreaks: { dictionary: DICTIONARY.length, rules: attempt } };
        }
      }
    }
    if (mode === "rules") {
      const rulesTotal = DICTIONARY.reduce((s, w) => s + applyRules(w).length, 0);
      return { found: false, foundPhase: null, foundAttempt: Infinity, phaseBreaks: { dictionary: 0, rules: rulesTotal } };
    }
  }

  // Phase 3: brute force — never found in demo
  return { found: false, foundPhase: null, foundAttempt: Infinity, phaseBreaks: { dictionary: DICTIONARY.length, rules: attempt } };
}

/* ───────── Brute-force systematic generator ───────── */
function bruteForceCandidate(cs: string, len: number, idx: number): string {
  const n = cs.length;
  let result = "";
  let remaining = idx;
  for (let i = 0; i < len; i++) {
    result = cs[remaining % n] + result;
    remaining = Math.floor(remaining / n);
  }
  return result;
}

/* ───────── Hardware profiles ───────── */
interface HardwareProfile {
  label: string;
  labelEs: string;
  icon: string;
  attemptsPerSecond: number; // SHA-256 attempts/sec
  desc: string;
  descEs: string;
}

const HARDWARE: HardwareProfile[] = [
  { label: "Basic PC", labelEs: "PC Básica", icon: "💻", attemptsPerSecond: 500_000, desc: "1GHz dual-core, HDD, 2GB RAM", descEs: "1GHz dual-core, HDD, 2GB RAM" },
  { label: "Gaming PC", labelEs: "PC Gamer", icon: "🖥️", attemptsPerSecond: 5_000_000, desc: "4GHz 8-core, SSD, 16GB RAM", descEs: "4GHz 8-core, SSD, 16GB RAM" },
  { label: "GPU (RTX 4090)", labelEs: "GPU (RTX 4090)", icon: "🚀", attemptsPerSecond: 800_000_000, desc: "16000 CUDA cores, 24GB VRAM", descEs: "16000 núcleos CUDA, 24GB VRAM" },
  { label: "Botnet", labelEs: "Botnet", icon: "🌐", attemptsPerSecond: 5_000_000_000, desc: "1000 infected PCs", descEs: "1000 PCs infectadas" },
];

function formatAttempts(n: number): string {
  if (n < 1000) return n.toString();
  if (n < 1e6) return (n / 1e3).toFixed(1) + "K";
  if (n < 1e9) return (n / 1e6).toFixed(1) + "M";
  if (n < 1e12) return (n / 1e9).toFixed(1) + "B";
  return (n / 1e12).toFixed(1) + "T";
}

function formatSimTime(simSec: number): string {
  if (simSec < 1) return (simSec * 1000).toFixed(0) + "ms";
  if (simSec < 60) return simSec.toFixed(1) + "s";
  if (simSec < 3600) return (simSec / 60).toFixed(1) + "min";
  if (simSec < 86400) return (simSec / 3600).toFixed(1) + "hrs";
  return (simSec / 86400).toFixed(1) + " days";
}

/* ───────── Bilingual text ───────── */
const t = {
  en: {
    title: "Real-Time vs Fast Simulation",
    desc: "See the difference between theoretical math and how a real cracking tool actually works.",
    fastCol: "⚡ Fast Simulation (Theoretical)",
    fastDesc: "Calculates the result instantly using password entropy math.",
    rtCol: "🕐 Real-Time Attack Simulation",
    rtDesc: "Simulates a real cracking tool (Hashcat-style) with 3 attack phases.",
    startFast: "Run Fast Analysis",
    startRt: "Start Attack",
    stop: "Stop", pause: "Pause", resume: "Resume", reset: "Reset",
    attempts: "Attempts", elapsed: "Wall Clock", simTime: "Sim. Time",
    speed: "Speed", current: "Current Attempt", explored: "Searched",
    totalCombos: "Total Combinations", strength: "Strength",
    entropy: "Entropy", charset: "Charset", length: "Length",
    crackTime: "Theoretical Crack Time",
    liveLog: "Live Attempt Log",
    hardware: "Hardware Profile",
    attackMode: "Attack Mode",
    modeAll: "All Phases (Smart)",
    modeDict: "Dictionary Only",
    modeRules: "Rules Only",
    modeBrute: "Brute Force Only",
    phaseLabel: "Current Phase",
    phaseDict: "Dictionary Attack",
    phaseDictDesc: "Trying common passwords from a wordlist of 200 entries",
    phaseRules: "Rules-Based Attack",
    phaseRulesDesc: "Mutating dictionary words (leet, suffixes, capitalization)",
    phaseBrute: "Brute Force",
    phaseBruteDesc: "Systematically trying all character combinations",
    phaseDictSpeed: "~10M/s",
    phaseRulesSpeed: "~500K/s",
    phaseBruteSpeed: "variable",
    foundPhase1: "Password found in Dictionary phase! A weak password that appears in common wordlists.",
    foundPhase2: "Password found in Rules phase! Not in dictionary, but a mutation of a common word matched it.",
    runningPhase1: "Scanning dictionary: checking common passwords first...",
    runningPhase2: "Dictionary failed. Applying mutation rules to wordlist...",
    runningPhase3: "Rules exhausted. Switching to brute force — this could take a very long time.",
    pausedMsg: "Attack paused.",
    idleMsg: "Press 'Start Attack' to begin.",
    vs: "VS",
    explanation: "How the simulation works",
    explanationDesc: "Real cracking tools (Hashcat, John the Ripper) use multiple strategies in sequence. First they try common passwords (dictionary), then mutate them with rules, and finally resort to brute force. This simulation follows the same approach so you can see exactly which technique would crack each password.",
    speedControl: "Display Speed",
    slow: "Slow",
    fast: "Fast",
    perSecond: "/s",
    phase: "Phase",
    of3: "of 3",
    attemptsMade: "attempts made",
    found: "PASSWORD CRACKED!",
    notFound: "Not found yet",
    note: "Note",
    noteText: "Generation speed is limited for display. Real tools process at full hardware speed — shown in the Sim. Time counter.",
    weakPwdFound: "This weak password was found at attempt {{n}} — in the dictionary phase. It would take seconds on any hardware.",
    medPwdFound: "This medium password was found at attempt {{n}} — in the rules phase. It would take minutes on a basic PC.",
    resultSection: "Attack Result Summary",
    resultFound: "Password Cracked",
    resultPhase: "Cracked in phase",
    resultTech: "Technique",
    resultDict: "Dictionary wordlist match",
    resultRules: "Rules-based mutation of a dictionary word",
    resultRealTime: "Smart attack time",
    resultDisplayTime: "Display time (wall clock)",
    resultBruteForceTime: "Brute-force theoretical time",
    resultBruteForceNote: "This is how long brute force would take — but it was NOT needed because the password was found earlier using a smarter technique.",
    resultSummaryFound: "The password was found using a targeted attack, not brute force. Real attackers always try the fastest methods first.",
    resultSummaryNotFound: "The password survived all 3 attack phases. Brute force would require {{t}} — effectively uncrackable.",
    resultWhatDoesItMean: "What this means",
    resultHardware: "Hardware used",
    resultAttempts: "Total attempts",
  },
  es: {
    title: "Comparación: Tiempo Real vs Rápida",
    desc: "Observa la diferencia entre la matemática teórica y cómo funciona una herramienta de cracking real.",
    fastCol: "⚡ Simulación Rápida (Teórica)",
    fastDesc: "Calcula el resultado al instante usando la entropía de la contraseña.",
    rtCol: "🕐 Simulación de Ataque en Tiempo Real",
    rtDesc: "Simula una herramienta de cracking real (estilo Hashcat) con 3 fases de ataque.",
    startFast: "Ejecutar Análisis Rápido",
    startRt: "Iniciar Ataque",
    stop: "Detener", pause: "Pausar", resume: "Reanudar", reset: "Reiniciar",
    attempts: "Intentos", elapsed: "Tiempo Real", simTime: "Tiempo Sim.",
    speed: "Velocidad", current: "Intento Actual", explored: "Explorado",
    totalCombos: "Combinaciones Totales", strength: "Fortaleza",
    entropy: "Entropía", charset: "Charset", length: "Longitud",
    crackTime: "Tiempo Teórico de Crackeo",
    liveLog: "Registro de Intentos en Vivo",
    hardware: "Perfil de Hardware",
    attackMode: "Modo de Ataque",
    modeAll: "Todas las Fases (Inteligente)",
    modeDict: "Solo Diccionario",
    modeRules: "Solo Reglas",
    modeBrute: "Solo Fuerza Bruta",
    phaseLabel: "Fase Actual",
    phaseDict: "Ataque de Diccionario",
    phaseDictDesc: "Probando contraseñas comunes de un wordlist de 200 entradas",
    phaseRules: "Ataque por Reglas",
    phaseRulesDesc: "Mutando palabras del diccionario (leet, sufijos, capitalización)",
    phaseBrute: "Fuerza Bruta",
    phaseBruteDesc: "Probando sistemáticamente todas las combinaciones de caracteres",
    phaseDictSpeed: "~10M/s",
    phaseRulesSpeed: "~500K/s",
    phaseBruteSpeed: "variable",
    foundPhase1: "¡Contraseña encontrada en fase de Diccionario! Una contraseña débil que aparece en wordlists comunes.",
    foundPhase2: "¡Contraseña encontrada en fase de Reglas! No está en el diccionario, pero una mutación de una palabra común coincidió.",
    runningPhase1: "Escaneando diccionario: probando contraseñas comunes primero...",
    runningPhase2: "Diccionario falló. Aplicando reglas de mutación al wordlist...",
    runningPhase3: "Reglas agotadas. Cambiando a fuerza bruta — esto podría tomar mucho tiempo.",
    pausedMsg: "Ataque pausado.",
    idleMsg: "Presiona 'Iniciar Ataque' para comenzar.",
    vs: "VS",
    explanation: "Cómo funciona la simulación",
    explanationDesc: "Las herramientas de cracking reales (Hashcat, John the Ripper) usan múltiples estrategias en secuencia. Primero prueban contraseñas comunes (diccionario), luego las mutan con reglas, y finalmente recurren a fuerza bruta. Esta simulación sigue el mismo enfoque para que puedas ver exactamente qué técnica crackearía cada contraseña.",
    speedControl: "Velocidad de Visualización",
    slow: "Lento",
    fast: "Rápido",
    perSecond: "/s",
    phase: "Fase",
    of3: "de 3",
    attemptsMade: "intentos realizados",
    found: "¡CONTRASEÑA ENCONTRADA!",
    notFound: "Aún no encontrada",
    note: "Nota",
    noteText: "La velocidad de generación está limitada para visualización. Las herramientas reales procesan a máxima velocidad del hardware — indicada en el contador de Tiempo Sim.",
    weakPwdFound: "Esta contraseña débil fue encontrada en el intento {{n}} — en la fase de diccionario. Tomaría segundos en cualquier hardware.",
    medPwdFound: "Esta contraseña media fue encontrada en el intento {{n}} — en la fase de reglas. Tomaría minutos en una PC básica.",
    resultSection: "Resumen del Resultado del Ataque",
    resultFound: "Contraseña Crackeada",
    resultPhase: "Crackeada en fase",
    resultTech: "Técnica",
    resultDict: "Coincidencia en wordlist de diccionario",
    resultRules: "Mutación por reglas de una palabra del diccionario",
    resultRealTime: "Tiempo de ataque dirigido",
    resultDisplayTime: "Tiempo de visualización",
    resultBruteForceTime: "Tiempo teórico de fuerza bruta",
    resultBruteForceNote: "Este es el tiempo que tomaría la fuerza bruta — pero NO fue necesario porque la contraseña se encontró antes usando una técnica más inteligente.",
    resultSummaryFound: "La contraseña fue encontrada usando un ataque dirigido, no fuerza bruta. Los atacantes reales siempre prueban los métodos más rápidos primero.",
    resultSummaryNotFound: "La contraseña sobrevivió las 3 fases de ataque. La fuerza bruta requeriría {{t}} — efectivamente incrackeable.",
    resultWhatDoesItMean: "Qué significa esto",
    resultHardware: "Hardware usado",
    resultAttempts: "Intentos totales",
  },
};

/* ───────── Component ───────── */
export function SimulationComparison({ lang, dark, selectedAcc }: Props) {
  const c = t[lang];
  const stats = computeStats(selectedAcc.password);
  const totalCombos = Math.min(Math.pow(stats.charset, selectedAcc.password.length), Number.MAX_SAFE_INTEGER);

  // Hardware selection
  const [hwIdx, setHwIdx] = useState(0);
  const hw = HARDWARE[hwIdx];

  // Attack mode
  const [attackMode, setAttackMode] = useState<AttackMode>("all");
  const rtModeRef = useRef<AttackMode>("all");

  // Phase plan (recalculated when attack mode changes)
  const planRef = useRef(planPhaseFind(selectedAcc.password, attackMode));

  // Fast sim state
  const [fastDone, setFastDone] = useState(false);

  // RT sim state
  const [rtState, setRtState] = useState<RtState>("idle");
  const [rtAttempts, setRtAttempts] = useState(0);
  const [rtElapsed, setRtElapsed] = useState(0); // wall clock ms
  const [rtSimSec, setRtSimSec] = useState(0); // simulated seconds
  const [rtSpeed, setRtSpeed] = useState(0);
  const [rtPhase, setRtPhase] = useState<AttackPhase>("dictionary");
  const [rtCurrentCandidate, setRtCurrentCandidate] = useState("");
  const [rtLog, setRtLog] = useState<LogEntry[]>([]);
  const [rtSpeedMs, setRtSpeedMs] = useState(30);
  const [rtFoundAt, setRtFoundAt] = useState<number | null>(null);
  const [rtPhaseProgress, setRtPhaseProgress] = useState(0); // 0-100

  // Refs for mutable sim state
  const rtIntRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rtTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rtDictIdxRef = useRef(0);
  const rtRuleWordIdxRef = useRef(0);
  const rtRuleMutatIdxRef = useRef(0);
  const rtRuleMutationsRef = useRef<string[]>([]);
  const rtBruteIdxRef = useRef(0);
  const rtAttemptRef = useRef(0);
  const rtFoundRef = useRef(false);
  const rtPhaseRef = useRef<AttackPhase>("dictionary");
  const rtStartTimeRef = useRef(0);
  const rtLastSpeedRef = useRef({ count: 0, time: 0 });
  const rtLogRef = useRef<HTMLDivElement>(null);
  const rtPwdRef = useRef(selectedAcc.password);
  const rtCsRef = useRef(getCharset(selectedAcc.password));
  const rtLenRef = useRef(selectedAcc.password.length);
  const rtHwSpeedRef = useRef(hw.attemptsPerSecond);
  const rtSpeedMsRef = useRef(rtSpeedMs);
  const rtTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rtSimSecRef = useRef(0);

  // Keep refs in sync
  useEffect(() => { rtHwSpeedRef.current = hw.attemptsPerSecond; }, [hw]);
  useEffect(() => { rtSpeedMsRef.current = rtSpeedMs; }, [rtSpeedMs]);
  useEffect(() => { rtModeRef.current = attackMode; }, [attackMode]);

  // Recalculate plan when attack mode changes
  useEffect(() => {
    planRef.current = planPhaseFind(selectedAcc.password, attackMode);
  }, [attackMode, selectedAcc.password]);

  const strengthColors: Record<string, string> = {
    weak: "var(--cyber-red)", medium: "var(--cyber-amber)",
    strong: "var(--cyber-blue)", "very-strong": "var(--cyber-green)",
  };
  const sc = strengthColors[selectedAcc.strength] ?? "var(--cyber-blue)";
  const cardBg = dark ? "rgba(15,26,46,0.9)" : "rgba(255,255,255,0.95)";
  const cardBorder = dark ? "rgba(59,130,246,0.2)" : "rgba(37,99,235,0.12)";

  const phaseLabels = { dictionary: c.phaseDict, rules: c.phaseRules, bruteforce: c.phaseBrute };
  const phaseDescs = { dictionary: c.phaseDictDesc, rules: c.phaseRulesDesc, bruteforce: c.phaseBruteDesc };
  const phaseSpeeds = { dictionary: c.phaseDictSpeed, rules: c.phaseRulesSpeed, bruteforce: c.phaseBruteSpeed };
  const phaseColors: Record<AttackPhase, string> = {
    dictionary: "var(--cyber-blue)", rules: "var(--cyber-purple)", bruteforce: "var(--cyber-red)",
  };

  useEffect(() => {
    if (rtLogRef.current) rtLogRef.current.scrollTop = rtLogRef.current.scrollHeight;
  }, [rtLog]);

  const stopRt = () => {
    if (rtIntRef.current) { clearInterval(rtIntRef.current); rtIntRef.current = null; }
    if (rtTimerRef.current) { clearInterval(rtTimerRef.current); rtTimerRef.current = null; }
    if (rtTimeoutRef.current) { clearTimeout(rtTimeoutRef.current); rtTimeoutRef.current = null; }
  };

  // Generation by phase
  const generateNext = (): string | null => {
    const pwd = rtPwdRef.current;
    const mode = rtModeRef.current;
    let candidate: string | null = null;

    if (rtPhaseRef.current === "dictionary") {
      if (rtDictIdxRef.current < DICTIONARY.length) {
        candidate = DICTIONARY[rtDictIdxRef.current];
        rtDictIdxRef.current++;
        setRtPhaseProgress((rtDictIdxRef.current / DICTIONARY.length) * 100);
      } else {
        // Dictionary exhausted
        if (mode === "dictionary") return null; // Don't fall through to other phases
        rtPhaseRef.current = "rules";
        setRtPhase("rules");
        setRtPhaseProgress(0);
        rtRuleWordIdxRef.current = 0;
        rtRuleMutationsRef.current = applyRules(DICTIONARY[0]);
        rtRuleMutatIdxRef.current = 0;
      }
    }

    if (candidate === null && rtPhaseRef.current === "rules") {
      while (rtRuleWordIdxRef.current < DICTIONARY.length) {
        if (rtRuleMutatIdxRef.current < rtRuleMutationsRef.current.length) {
          candidate = rtRuleMutationsRef.current[rtRuleMutatIdxRef.current];
          rtRuleMutatIdxRef.current++;
          const rulesTotal = DICTIONARY.reduce((s, w) => s + applyRules(w).length, 0);
          const doneBefore = DICTIONARY.slice(0, rtRuleWordIdxRef.current).reduce((s, w) => s + applyRules(w).length, 0);
          const done = doneBefore + rtRuleMutatIdxRef.current;
          setRtPhaseProgress(Math.min((done / Math.max(rulesTotal, 1)) * 100, 99));
          break;
        }
        rtRuleWordIdxRef.current++;
        if (rtRuleWordIdxRef.current < DICTIONARY.length) {
          rtRuleMutationsRef.current = applyRules(DICTIONARY[rtRuleWordIdxRef.current]);
          rtRuleMutatIdxRef.current = 0;
        } else {
          // Rules exhausted
          if (mode === "rules") return null; // Don't fall through to brute force
          rtPhaseRef.current = "bruteforce";
          setRtPhase("bruteforce");
          setRtPhaseProgress(0);
          break;
        }
      }
    }

    if (candidate === null && rtPhaseRef.current === "bruteforce") {
      if (mode === "bruteforce" || mode === "all") {
        const idx = rtBruteIdxRef.current;
        rtBruteIdxRef.current++;
        const cs = rtCsRef.current;
        const len = rtLenRef.current;
        candidate = bruteForceCandidate(cs, len, idx);
        setRtPhaseProgress(Math.min((idx / Math.min(Math.pow(cs.length, len), Number.MAX_SAFE_INTEGER)) * 100, 0.001));
      }
    }

    return candidate;
  };

  const tick = () => {
    if (rtFoundRef.current) return;

    const candidate = generateNext();
    if (candidate === null) {
      stopRt();
      setRtState("exhausted");
      return;
    }

    rtAttemptRef.current++;
    const att = rtAttemptRef.current;
    const isMatch = candidate === rtPwdRef.current;

    // Check if found according to plan
    const plan = planRef.current;
    if (plan.found && att >= plan.foundAttempt && !rtFoundRef.current) {
      rtFoundRef.current = true;
      setRtFoundAt(att);
      setRtState("found");
      stopRt();
      setRtLog(prev => [...prev.slice(-59), { attempt: att, candidate, isMatch: true, phase: rtPhaseRef.current }]);
      setRtCurrentCandidate(candidate);
      setRtAttempts(att);
      return;
    }

    setRtCurrentCandidate(candidate);
    setRtAttempts(att);
    setRtLog(prev => [...prev.slice(-59), { attempt: att, candidate, isMatch, phase: rtPhaseRef.current }]);

    // If found naturally (shouldn't happen with plan, but just in case)
    if (isMatch) {
      rtFoundRef.current = true;
      setRtFoundAt(att);
      setRtState("found");
      stopRt();
      return;
    }

    // Update speed every 500ms
    const now = Date.now();
    const elapsed = now - rtLastSpeedRef.current.time;
    if (elapsed > 500) {
      const spd = Math.round(((att - rtLastSpeedRef.current.count) / elapsed) * 1000);
      setRtSpeed(spd);
      rtLastSpeedRef.current = { count: att, time: now };
    }
  };

  const startRtSim = () => {
    const mode = attackMode;
    const initialPhase: AttackPhase = mode === "dictionary" ? "dictionary" : mode === "rules" ? "rules" : mode === "bruteforce" ? "bruteforce" : "dictionary";

    rtPwdRef.current = selectedAcc.password;
    rtCsRef.current = getCharset(selectedAcc.password);
    rtLenRef.current = selectedAcc.password.length;
    rtAttemptRef.current = 0;
    rtDictIdxRef.current = 0;
    rtRuleWordIdxRef.current = 0;
    rtRuleMutatIdxRef.current = 0;
    rtRuleMutationsRef.current = [];
    rtBruteIdxRef.current = 0;
    rtFoundRef.current = false;
    rtPhaseRef.current = initialPhase;
    rtSimSecRef.current = 0;

    // Recompute plan
    planRef.current = planPhaseFind(selectedAcc.password, mode);

    setRtAttempts(0);
    setRtElapsed(0);
    setRtSimSec(0);
    setRtSpeed(0);
    setRtPhase(initialPhase);
    setRtCurrentCandidate("");
    setRtLog([]);
    setRtFoundAt(null);
    setRtPhaseProgress(0);
    setRtState("running");

    rtStartTimeRef.current = Date.now();
    rtLastSpeedRef.current = { count: 0, time: Date.now() };

    // Wall clock timer
    rtTimerRef.current = setInterval(() => {
      const wall = Date.now() - rtStartTimeRef.current;
      setRtElapsed(wall);
      // Simulated time: wall * (hw_speed / display_speed_approx)
      // Each tick processes 1 candidate. display_speed = 1000/rtSpeedMs candidates/sec
      const displayCps = 1000 / Math.max(rtSpeedMs, 1);
      const ratio = rtHwSpeedRef.current / Math.max(displayCps, 1);
      setRtSimSec(rtAttemptRef.current / Math.max(rtHwSpeedRef.current, 1));
    }, 100);

    rtTimeoutRef.current = setTimeout(() => {
      tick();
      rtIntRef.current = setInterval(tick, rtSpeedMs);
    }, 50);
  };

  const pauseRt = () => {
    if (rtState === "running") {
      stopRt();
      setRtState("paused");
    } else if (rtState === "paused") {
      rtStartTimeRef.current = Date.now() - rtElapsed;
      rtTimerRef.current = setInterval(() => {
        setRtElapsed(Date.now() - rtStartTimeRef.current);
        setRtSimSec(rtAttemptRef.current / Math.max(rtHwSpeedRef.current, 1));
      }, 100);
      rtIntRef.current = setInterval(tick, rtSpeedMs);
      setRtState("running");
    }
  };

  const stopRtSim = () => { stopRt(); setRtState("idle"); };
  const resetRt = () => {
    stopRt();
    rtAttemptRef.current = 0;
    rtFoundRef.current = false;
    setRtAttempts(0); setRtElapsed(0); setRtSimSec(0);
    setRtSpeed(0); setRtCurrentCandidate(""); setRtLog([]);
    setRtFoundAt(null); setRtState("idle"); setRtPhaseProgress(0);
  };

  useEffect(() => () => stopRt(), []);

  const isRtRunning = rtState === "running";
  const isRtFound = rtState === "found";
  const isRtExhausted = rtState === "exhausted";
  const isRtActive = rtState !== "idle";

  const plan = planRef.current;
  const hwCrackTime = plan.found
    ? formatSimTime(plan.foundAttempt / hw.attemptsPerSecond)
    : formatSimTime(totalCombos / 2 / hw.attemptsPerSecond);
  const refSpeed = 1_000_000_000; // 1 billion/s reference speed
  const refCrackTime = formatSimTime(totalCombos / 2 / refSpeed);
  const phaseColor = phaseColors[rtState === "idle" ? "dictionary" : rtPhase];
  const phaseLabel = phaseLabels[rtState === "idle" ? "dictionary" : rtPhase];
  const phaseDesc = phaseDescs[rtState === "idle" ? "dictionary" : rtPhase];
  const phaseSpeedLabel = phaseSpeeds[rtState === "idle" ? "dictionary" : rtPhase];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="rounded-2xl p-6 relative overflow-hidden" style={{
        background: dark ? "linear-gradient(135deg, #0a0f1e 0%, #0f1a2e 40%, #1a103a 100%)" : "linear-gradient(135deg, #dbeafe 0%, #ede9fe 60%, #cffafe 100%)",
      }}>
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: "repeating-linear-gradient(0deg, " + (dark ? "#3b82f6" : "#2563eb") + " 0, " + (dark ? "#3b82f6" : "#2563eb") + " 1px, transparent 1px, transparent 32px),repeating-linear-gradient(90deg, " + (dark ? "#3b82f6" : "#2563eb") + " 0, " + (dark ? "#3b82f6" : "#2563eb") + " 1px, transparent 1px, transparent 32px)",
        }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, var(--cyber-blue), var(--cyber-purple))" }}>
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1.2rem", color: dark ? "#e2e8f0" : "#0f172a" }}>
                {c.title}
              </h3>
              <p className="text-sm" style={{ color: dark ? "#94a3b8" : "#475569" }}>{c.desc}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Target info ── */}
      <div className="rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap" style={{ background: cardBg, border: "1px solid " + cardBorder }}>
        <Lock className="w-4 h-4" style={{ color: sc }} />
        <span className="text-xs font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace", color: dark ? "#e2e8f0" : "#0f172a" }}>
          {selectedAcc.email}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: sc + "20", color: sc, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>
          {selectedAcc.strength.replace("-", " ")}
        </span>
        {/* Phase indicator when running */}
        {isRtActive && (
          <span className="ml-auto flex items-center gap-1.5 text-xs" style={{ color: phaseColor, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>
            {c.phase} {rtPhase === "dictionary" ? "1" : rtPhase === "rules" ? "2" : "3"} {c.of3}
          </span>
        )}
      </div>

      {/* ── Two columns ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ═══ LEFT: Fast column ═══ */}
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={{ background: cardBg, border: "1px solid " + cardBorder }}>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4" style={{ color: "var(--cyber-amber)" }} />
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: dark ? "#e2e8f0" : "#0f172a", fontSize: "0.95rem" }}>
                {c.fastCol}
              </span>
            </div>
            <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>{c.fastDesc}</p>

            {!fastDone ? (
              <button onClick={() => setFastDone(true)} className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-all" style={{
                background: "linear-gradient(135deg, var(--cyber-blue), var(--cyber-purple))", color: "#fff",
                fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: "0.05em", boxShadow: "0 4px 16px rgba(59,130,246,0.3)",
              }}>
                <FastForward className="w-3.5 h-3.5" /> {c.startFast}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl p-4" style={{ background: dark ? "rgba(30,45,74,0.5)" : "rgba(241,245,249,0.8)", border: "1px solid " + sc + "40" }}>
                  <div className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: sc, fontFamily: "'Rajdhani', sans-serif" }}>
                    {plan.found ? <ShieldX className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                    {c.strength}: {selectedAcc.strength.replace("-", " ")}
                  </div>
                  {plan.found && (
                    <div className="rounded-lg px-3 py-2 mb-3" style={{ background: dark ? "rgba(30,45,74,0.5)" : "rgba(255,255,255,0.7)" }}>
                      <div className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>{c.resultPhase}</div>
                      <div className="flex items-center gap-1.5 text-sm font-semibold" style={{
                        color: plan.foundPhase === "dictionary" ? "var(--cyber-blue)" : "var(--cyber-purple)",
                        fontFamily: "'Rajdhani', sans-serif",
                      }}>
                        {plan.foundPhase === "dictionary" ? <Book className="w-3.5 h-3.5" /> : <Shuffle className="w-3.5 h-3.5" />}
                        {plan.foundPhase === "dictionary" ? "1 — " + c.phaseDict : "2 — " + c.phaseRules}
                        <span className="ml-auto" style={{ color: "var(--cyber-amber)", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem" }}>
                          {hwCrackTime}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: c.entropy, value: stats.entropy + " bits", color: "var(--cyber-blue)" },
                      { label: c.charset, value: stats.charset.toString(), color: "var(--cyber-purple)" },
                      { label: c.length, value: selectedAcc.password.length.toString(), color: "var(--cyber-cyan)" },
                      { label: lang === "en" ? "With " + hw.label : "Con " + hw.labelEs, value: hwCrackTime, color: plan.found ? "var(--cyber-amber)" : sc },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="rounded-lg px-3 py-2" style={{ background: dark ? "rgba(15,26,46,0.5)" : "rgba(255,255,255,0.7)" }}>
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{label}</div>
                        <div className="text-sm font-semibold" style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
                      </div>
                    ))}
                  </div>
                  {!plan.found && (
                    <div className="mt-2 rounded-lg px-3 py-2" style={{ background: dark ? "rgba(30,45,74,0.5)" : "rgba(255,255,255,0.7)" }}>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {lang === "en" ? "Brute force reference (1B/s):" : "Referencia fuerza bruta (1B/s):"}
                      </div>
                      <div className="text-sm font-semibold" style={{ color: "var(--cyber-amber)", fontFamily: "'JetBrains Mono', monospace" }}>
                        {refCrackTime}
                      </div>
                    </div>
                  )}
                </div>
                <div className="rounded-xl p-3 text-xs leading-relaxed" style={{
                  background: dark ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.06)",
                  border: "1px solid rgba(245,158,11,0.2)", color: dark ? "#fbbf24" : "#92400e",
                }}>
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  {plan.found
                    ? (lang === "en"
                        ? hw.label + ": " + hwCrackTime + " via Phase " + (plan.foundPhase === "dictionary" ? "1 (Dictionary)" : "2 (Rules)") + ". Brute force at 1B/s: " + refCrackTime + "."
                        : hw.labelEs + ": " + hwCrackTime + " vía Fase " + (plan.foundPhase === "dictionary" ? "1 (Diccionario)" : "2 (Reglas)") + ". Fuerza bruta a 1B/s: " + refCrackTime + ".")
                    : (lang === "en"
                        ? hw.label + " would take " + hwCrackTime + ". Reference (1B/s): " + refCrackTime + "."
                        : hw.labelEs + " tomaría " + hwCrackTime + ". Referencia (1B/s): " + refCrackTime + ".")}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══ RIGHT: Real-time column ═══ */}
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={{
            background: cardBg,
            border: "1px solid " + cardBorder,
            boxShadow: isRtRunning ? "0 0 30px rgba(59,130,246,0.15), 0 0 60px rgba(59,130,246,0.05)" : "none",
            transition: "box-shadow 0.5s",
          }}>
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4" style={{ color: "var(--cyber-cyan)" }} />
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: dark ? "#e2e8f0" : "#0f172a", fontSize: "0.95rem" }}>
                {c.rtCol}
              </span>
              {isRtRunning && (
                <span className="ml-auto flex items-center gap-1.5 text-xs" style={{ color: "var(--cyber-green)", fontFamily: "'JetBrains Mono', monospace" }}>
                  <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--cyber-green)" }} />
                  CRACKING
                </span>
              )}
              {isRtFound && (
                <span className="ml-auto flex items-center gap-1.5 text-xs" style={{ color: "var(--cyber-green)", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>
                  <CheckCircle className="w-3.5 h-3.5" /> {c.found}
                </span>
              )}
              {isRtExhausted && (
                <span className="ml-auto flex items-center gap-1.5 text-xs" style={{ color: "var(--cyber-red)", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>
                  <XCircle className="w-3.5 h-3.5" /> {lang === "en" ? "NOT FOUND" : "NO ENCONTRADA"}
                </span>
              )}
            </div>
            <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>{c.rtDesc}</p>

            {/* ── Hardware selector (always visible before start) ── */}
            {rtState === "idle" && (
              <div className="mb-4 space-y-2">
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
                  <Cpu className="w-3 h-3" /> {c.hardware}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {HARDWARE.map((h, i) => (
                    <button key={i} onClick={() => setHwIdx(i)}
                      className="text-left rounded-lg px-3 py-2 text-xs transition-all"
                      style={{
                        background: hwIdx === i ? "rgba(59,130,246,0.12)" : dark ? "rgba(30,45,74,0.3)" : "#f8fafc",
                        border: "1px solid " + (hwIdx === i ? "rgba(59,130,246,0.4)" : cardBorder),
                      }}>
                      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: dark ? "#e2e8f0" : "#0f172a" }}>
                        {h.icon} {lang === "en" ? h.label : h.labelEs}
                      </div>
                      <div className="mt-0.5" style={{ color: "var(--muted-foreground)" }}>{lang === "en" ? h.desc : h.descEs}</div>
                      <div style={{ color: "var(--cyber-cyan)", fontFamily: "'JetBrains Mono', monospace", marginTop: "2px" }}>
                        {formatAttempts(h.attemptsPerSecond)}{c.perSecond}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Attack mode selector ── */}
            {rtState === "idle" && (
              <div className="mb-4 space-y-2">
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
                  <Gauge className="w-3 h-3" /> {c.attackMode}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {([
                    { id: "all" as AttackMode, label: c.modeAll },
                    { id: "dictionary" as AttackMode, label: c.modeDict },
                    { id: "rules" as AttackMode, label: c.modeRules },
                    { id: "bruteforce" as AttackMode, label: c.modeBrute },
                  ]).map(m => (
                    <button key={m.id} onClick={() => setAttackMode(m.id)}
                      className="text-left rounded-lg px-3 py-2 text-xs transition-all"
                      style={{
                        background: attackMode === m.id ? "rgba(59,130,246,0.12)" : dark ? "rgba(30,45,74,0.3)" : "#f8fafc",
                        border: "1px solid " + (attackMode === m.id ? "rgba(59,130,246,0.4)" : cardBorder),
                      }}>
                      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: dark ? "#e2e8f0" : "#0f172a" }}>
                        {m.id === "all" ? "🧠" : m.id === "dictionary" ? "📖" : m.id === "rules" ? "🔧" : "⚡"} {m.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {rtState === "idle" && (
              <>
                {/* Speed slider */}
                <div className="mb-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: "var(--muted-foreground)" }}>{c.speedControl}</span>
                    <span style={{ color: "var(--cyber-cyan)", fontFamily: "'JetBrains Mono', monospace" }}>
                      {rtSpeedMs}ms/{c.attempts.toLowerCase().slice(0, -1)}
                    </span>
                  </div>
                  <input type="range" min="5" max="200" value={rtSpeedMs}
                    onChange={(e) => setRtSpeedMs(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{ background: "linear-gradient(90deg, var(--cyber-blue), var(--cyber-cyan))", accentColor: "var(--cyber-blue)" }}
                  />
                  <div className="flex justify-between text-xs" style={{ color: "var(--muted-foreground)" }}>
                    <span>{c.fast} (5ms)</span>
                    <span>{c.slow} (200ms)</span>
                  </div>
                </div>

                <button onClick={startRtSim} className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-all" style={{
                  background: "linear-gradient(135deg, var(--cyber-red), var(--cyber-purple))", color: "#fff",
                  fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: "0.05em", boxShadow: "0 4px 16px rgba(239,68,68,0.3)",
                }}>
                  <Play className="w-3.5 h-3.5" /> {c.startRt}
                </button>
              </>
            )}

            {isRtActive && (
              <div className="space-y-4">
                {/* ── Phase indicator bar ── */}
                <div className="rounded-xl p-3" style={{ background: dark ? "rgba(30,45,74,0.5)" : "rgba(241,245,249,0.8)", border: "1px solid " + cardBorder }}>
                  <div className="flex items-center gap-2 mb-2">
                    {rtPhase === "dictionary" ? <Book className="w-3.5 h-3.5" style={{ color: phaseColor }} />
                      : rtPhase === "rules" ? <Shuffle className="w-3.5 h-3.5" style={{ color: phaseColor }} />
                      : <Code className="w-3.5 h-3.5" style={{ color: phaseColor }} />}
                    <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.85rem", color: phaseColor }}>
                      {phaseLabel}
                    </span>
                    <span className="ml-auto text-xs" style={{ color: phaseColor, fontFamily: "'JetBrains Mono', monospace" }}>
                      {phaseSpeedLabel}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{phaseDesc}</p>
                  {/* Phase progress */}
                  {rtPhase !== "bruteforce" && (
                    <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: dark ? "rgba(30,45,74,0.8)" : "#e2e8f0" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: rtPhaseProgress + "%", background: phaseColor }} />
                    </div>
                  )}
                </div>

                {/* ── Stats grid ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { icon: Hash, label: c.attempts, value: formatAttempts(rtAttempts), color: "var(--cyber-blue)" },
                    { icon: Clock, label: c.elapsed, value: formatTime(rtElapsed / 1000), color: "var(--muted-foreground)" },
                    { icon: TrendingUp, label: c.simTime, value: formatSimTime(rtSimSec), color: "var(--cyber-amber)" },
                    { icon: Activity, label: c.speed, value: formatAttempts(rtSpeed) + c.perSecond, color: "var(--cyber-cyan)" },
                  ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="rounded-lg p-2.5 text-center" style={{ background: dark ? "rgba(30,45,74,0.5)" : "rgba(241,245,249,0.8)" }}>
                      <Icon className="w-3 h-3 mx-auto mb-0.5" style={{ color }} />
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: "0.8rem", color }}>{value}</div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* ── Current attempt ── */}
                <div className="rounded-xl p-3" style={{ background: dark ? "rgba(30,45,74,0.5)" : "rgba(241,245,249,0.8)", border: "1px solid " + cardBorder }}>
                  <div className="flex items-center justify-between text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
                    <span>{c.current}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--cyber-cyan)" }}>#{formatAttempts(rtAttempts)}</span>
                  </div>
                  <div className="rounded-lg px-3 py-2 text-sm break-all text-center" style={{
                    fontFamily: "'JetBrains Mono', monospace", background: dark ? "#070d1a" : "#f1f5f9",
                    color: isRtFound ? "var(--cyber-green)" : dark ? "#e2e8f0" : "#0f172a",
                    border: isRtFound ? "1px solid rgba(16,185,129,0.5)" : "none",
                  }}>
                    {rtCurrentCandidate || "—"}
                  </div>
                  {/* Explored bar */}
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs" style={{ color: "var(--muted-foreground)" }}>
                      <span>{c.explored}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--cyber-amber)" }}>
                        {totalCombos > 0 ? ((rtAttempts / totalCombos) * 100).toExponential(3) + "%" : "0%"}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: dark ? "rgba(30,45,74,0.8)" : "#e2e8f0" }}>
                      <div className="h-full rounded-full transition-all" style={{
                        width: Math.min((rtAttempts / Math.max(totalCombos, 1)) * 100, 100) + "%",
                        background: isRtFound ? "linear-gradient(90deg, var(--cyber-green), #34d399)" : "linear-gradient(90deg, var(--cyber-blue), var(--cyber-cyan))",
                      }} />
                    </div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{c.totalCombos}: {formatAttempts(totalCombos)}</div>
                  </div>
                </div>

                {/* ── Status banner ── */}
                {isRtFound ? (
                  <div className="rounded-xl overflow-hidden" style={{
                    border: "1px solid rgba(16,185,129,0.3)",
                    background: dark ? "rgba(16,185,129,0.08)" : "rgba(209,250,229,0.7)",
                  }}>
                    {/* Header */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "rgba(16,185,129,0.2)" }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(16,185,129,0.2)" }}>
                        <CheckCircle className="w-5 h-5" style={{ color: "var(--cyber-green)" }} />
                      </div>
                      <div>
                        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "var(--cyber-green)" }}>
                          ✅ {c.resultFound}
                        </div>
                        <div className="text-xs" style={{ color: dark ? "#94a3b8" : "#475569" }}>
                          {c.resultSection}
                        </div>
                      </div>
                    </div>

                    {/* Content grid */}
                    <div className="p-4 space-y-3">
                      {/* Phase + Technique */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg px-3 py-2" style={{ background: dark ? "rgba(15,26,46,0.5)" : "rgba(255,255,255,0.7)" }}>
                          <div className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>{c.resultPhase}</div>
                          <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: plan.foundPhase === "dictionary" ? "var(--cyber-blue)" : "var(--cyber-purple)", fontFamily: "'Rajdhani', sans-serif" }}>
                            {plan.foundPhase === "dictionary" ? <Book className="w-3.5 h-3.5" /> : <Shuffle className="w-3.5 h-3.5" />}
                            {plan.foundPhase === "dictionary" ? "1 — " + c.phaseDict : "2 — " + c.phaseRules}
                          </div>
                        </div>
                        <div className="rounded-lg px-3 py-2" style={{ background: dark ? "rgba(15,26,46,0.5)" : "rgba(255,255,255,0.7)" }}>
                          <div className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>{c.resultTech}</div>
                          <div className="text-sm font-semibold" style={{ color: dark ? "#e2e8f0" : "#0f172a" }}>
                            {plan.foundPhase === "dictionary" ? c.resultDict : c.resultRules}
                          </div>
                        </div>
                      </div>

                      {/* Time comparison */}
                      <div className="rounded-lg px-3 py-2" style={{ background: dark ? "rgba(15,26,46,0.5)" : "rgba(255,255,255,0.7)" }}>
                        <div className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>{c.resultWhatDoesItMean}</div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span style={{ color: dark ? "#94a3b8" : "#475569" }}>
                              {c.resultRealTime} ({hw.label}) — {plan.foundPhase === "dictionary" ? "1 — " + c.phaseDict : plan.foundPhase === "rules" ? "2 — " + c.phaseRules : c.phaseBrute}
                            </span>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "var(--cyber-green)" }}>
                              {formatSimTime(rtAttempts / hw.attemptsPerSecond)}
                            </span>
                          </div>
                          <div className="h-px" style={{ background: dark ? "rgba(59,130,246,0.1)" : "rgba(37,99,235,0.06)" }} />
                          <div className="flex items-center justify-between text-xs">
                            <span style={{ color: dark ? "#94a3b8" : "#475569" }}>{c.resultDisplayTime}</span>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--muted-foreground)" }}>
                              {formatTime(rtElapsed / 1000)}
                            </span>
                          </div>
                          <div className="h-px" style={{ background: dark ? "rgba(59,130,246,0.1)" : "rgba(37,99,235,0.06)" }} />
                          <div className="flex items-center justify-between text-xs">
                            <span style={{ color: dark ? "#94a3b8" : "#475569" }}>{c.resultBruteForceTime}</span>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--cyber-amber)" }}>
                              {refCrackTime}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Explanation */}
                      <div className="rounded-lg px-3 py-2 text-xs leading-relaxed" style={{
                        background: dark ? "rgba(245,158,11,0.06)" : "rgba(255,251,235,0.8)",
                        border: "1px solid rgba(245,158,11,0.2)",
                      }}>
                        <div className="flex items-start gap-1.5">
                          <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" style={{ color: "var(--cyber-amber)" }} />
                          <span style={{ color: dark ? "#fbbf24" : "#92400e" }}>
                            {c.resultBruteForceNote}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs leading-relaxed" style={{ color: "var(--cyber-green)" }}>
                        <div className="flex items-start gap-1.5">
                          <Info className="w-3 h-3 mt-0.5 shrink-0" />
                          <span>{c.resultSummaryFound}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : isRtExhausted ? (
                  <div className="rounded-xl p-3 text-xs leading-relaxed" style={{
                    background: dark ? "rgba(239,68,68,0.08)" : "rgba(254,226,226,0.7)",
                    border: "1px solid rgba(239,68,68,0.3)",
                  }}>
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 shrink-0" style={{ color: "var(--cyber-red)" }} />
                      <span style={{ color: "var(--cyber-red)" }}>
                        {lang === "en" ? "Password not found with selected attack mode. Try a different mode." : "Contraseña no encontrada con el modo de ataque seleccionado. Prueba otro modo."}
                      </span>
                    </div>
                  </div>
                ) : rtState === "paused" ? (
                  <div className="rounded-xl p-3 text-xs leading-relaxed" style={{
                    background: dark ? "rgba(245,158,11,0.08)" : "rgba(254,243,199,0.7)",
                    border: "1px solid rgba(245,158,11,0.3)",
                  }}>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: "var(--cyber-amber)" }} />
                      <span style={{ color: dark ? "#fbbf24" : "#92400e" }}>{c.pausedMsg}</span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl p-3 text-xs leading-relaxed" style={{
                    background: rtPhase === "dictionary" ? (dark ? "rgba(59,130,246,0.08)" : "rgba(219,234,254,0.7)")
                      : rtPhase === "rules" ? (dark ? "rgba(139,92,246,0.08)" : "rgba(237,233,254,0.7)")
                      : (dark ? "rgba(239,68,68,0.08)" : "rgba(254,226,226,0.7)"),
                    border: "1px solid " + (rtPhase === "dictionary" ? "rgba(59,130,246,0.3)" : rtPhase === "rules" ? "rgba(139,92,246,0.3)" : "rgba(239,68,68,0.3)"),
                  }}>
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: phaseColor }} />
                      <span style={{ color: dark ? "#94a3b8" : "#475569" }}>
                        {rtPhase === "dictionary" ? c.runningPhase1 : rtPhase === "rules" ? c.runningPhase2 : c.runningPhase3}
                      </span>
                    </div>
                  </div>
                )}

                {/* ── Live log ── */}
                <div className="rounded-xl overflow-hidden" style={{ background: dark ? "#070d1a" : "#f8fafc", border: "1px solid " + cardBorder }}>
                  <div className="flex items-center justify-between px-3 py-2 border-b text-xs" style={{
                    borderColor: cardBorder, background: dark ? "rgba(15,26,46,0.9)" : "rgba(226,232,240,0.7)",
                  }}>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: isRtRunning ? "#ef4444" : "#6b7280" }} />
                        <div className="w-2 h-2 rounded-full" style={{ background: isRtRunning ? "#f59e0b" : "#6b7280" }} />
                        <div className="w-2 h-2 rounded-full" style={{ background: isRtRunning ? "#22c55e" : "#6b7280" }} />
                      </div>
                      <span style={{ color: "var(--muted-foreground)", fontFamily: "'JetBrains Mono', monospace" }}>{c.liveLog}</span>
                    </div>
                    {isRtRunning && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--cyber-green)", fontFamily: "'JetBrains Mono', monospace" }}>
                        <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--cyber-green)" }} />
                        #{formatAttempts(rtAttempts)}
                      </span>
                    )}
                  </div>
                  <div ref={rtLogRef} className="overflow-y-auto" style={{ height: "200px", scrollbarWidth: "thin" }}>
                    {rtLog.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "'JetBrains Mono', monospace" }}>
                          {rtState === "running" ? "[ initializing… ]" : "[ waiting… ]"}
                        </p>
                      </div>
                    ) : (
                      <div className="p-2 space-y-0.5">
                        {rtLog.map((entry, i) => (
                          <div key={i} className="flex items-center gap-2 rounded px-2 py-0.5 text-xs" style={{
                            background: entry.isMatch ? "rgba(16,185,129,0.15)" : "transparent",
                            border: entry.isMatch ? "1px solid rgba(16,185,129,0.4)" : "1px solid transparent",
                          }}>
                            <span style={{ color: "var(--muted-foreground)", fontFamily: "'JetBrains Mono', monospace", minWidth: "2.8rem" }}>
                              {entry.attempt.toString().padStart(4, "0")}
                            </span>
                            <span className="w-3 h-3 rounded-full inline-block shrink-0" style={{ background: phaseColors[entry.phase] + "60" }} />
                            <span style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              color: entry.isMatch ? "var(--cyber-green)" : dark ? "#475569" : "#94a3b8",
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px",
                            }}>
                              {entry.candidate}
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

                {/* ── Controls ── */}
                <div className="flex gap-2">
                  {(rtState === "running" || rtState === "paused") && (
                    <button onClick={pauseRt} className="flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-all" style={{
                      background: rtState === "paused" ? "linear-gradient(135deg, var(--cyber-blue), var(--cyber-cyan))" : "transparent",
                      color: rtState === "paused" ? "#fff" : "var(--foreground)",
                      border: "1px solid " + (rtState === "paused" ? "transparent" : cardBorder),
                      fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
                    }}>
                      {rtState === "paused" ? <><Play className="w-3 h-3" /> {c.resume}</> : <><Pause className="w-3 h-3" /> {c.pause}</>}
                    </button>
                  )}
                  {(rtState === "running" || rtState === "paused") && (
                    <button onClick={stopRtSim} className="flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs" style={{
                      background: "rgba(239,68,68,0.15)", color: "var(--cyber-red)",
                      border: "1px solid rgba(239,68,68,0.3)", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
                    }}>
                      <Square className="w-3 h-3" /> {c.stop}
                    </button>
                  )}
                  {(isRtFound || isRtExhausted) && (
                    <button onClick={resetRt} className="flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs border border-border transition-colors hover:bg-muted"
                      style={{ color: "var(--foreground)", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>
                      <RotateCcw className="w-3 h-3" /> {c.reset}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Note ── */}
      <div className="rounded-xl p-3 text-xs flex items-start gap-2" style={{
        background: dark ? "rgba(59,130,246,0.08)" : "rgba(219,234,254,0.6)",
        border: "1px solid rgba(59,130,246,0.2)",
      }}>
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "var(--cyber-blue)" }} />
        <span style={{ color: dark ? "#94a3b8" : "#475569" }}>{c.noteText}</span>
      </div>

      {/* ── Explanation ── */}
      <div className="rounded-2xl p-5" style={{ background: cardBg, border: "1px solid " + cardBorder }}>
        <div className="flex items-center gap-2 mb-3">
          <Code className="w-4 h-4" style={{ color: "var(--cyber-cyan)" }} />
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: dark ? "#e2e8f0" : "#0f172a" }}>
            {c.explanation}
          </span>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{c.explanationDesc}</p>
      </div>
    </div>
  );
}


