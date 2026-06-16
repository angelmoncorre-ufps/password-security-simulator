export type StrengthLevel = "weak" | "medium" | "strong" | "very-strong";
export type AccountStatus = "active" | "compromised" | "risky" | "secure";

export interface DemoAccount {
  id: string;
  email: string;
  password: string;
  strength: StrengthLevel;
  status: AccountStatus;
  note?: string;
}

export interface PythonSimulationResult {
  password: string;
  strength: "weak" | "medium" | "strong";
  attempts: number;
  elapsed_time: number;
  found_at_attempt: number | null;
  charset_size: number;
  entropy: number;
  mode: string;
  log_entries: Array<Record<string, any>>;
  timestamp: string;
}

export function deriveStrength(password: string): StrengthLevel {
  const len = password.length;
  let charset = 0;
  if (/[a-z]/.test(password)) charset += 26;
  if (/[A-Z]/.test(password)) charset += 26;
  if (/[0-9]/.test(password)) charset += 10;
  if (/[^a-zA-Z0-9]/.test(password)) charset += 33;
  if (charset === 0) charset = 26;
  const entropy = len * Math.log2(charset);
  if (entropy >= 80) return "very-strong";
  if (entropy >= 55) return "strong";
  if (entropy >= 35) return "medium";
  return "weak";
}

export function formatTime(s: number): string {
  if (s < 0.001) return "< 1 ms";
  if (s < 1) return `${(s * 1000).toFixed(0)} ms`;
  if (s < 60) return `${s.toFixed(2)} sec`;
  if (s < 3600) return `${(s / 60).toFixed(1)} min`;
  if (s < 86400) return `${(s / 3600).toFixed(1)} hrs`;
  if (s < 31536000) return `${(s / 86400).toFixed(0)} days`;
  if (s < 3.154e9) return `${(s / 31536000).toFixed(0)} yrs`;
  return `${(s / 3.154e13).toFixed(0)}M yrs`;
}

export function computeStats(password: string) {
  const len = password.length;
  let charset = 0;
  if (/[a-z]/.test(password)) charset += 26;
  if (/[A-Z]/.test(password)) charset += 26;
  if (/[0-9]/.test(password)) charset += 10;
  if (/[^a-zA-Z0-9]/.test(password)) charset += 33;
  if (charset === 0) charset = 26;
  const entropy = Math.round(len * Math.log2(charset));
  const combinations = Math.pow(charset, len);
  const seconds = combinations / 1e10 / 2;
  return { entropy, charset, combinations, seconds, crackTime: formatTime(seconds), strength: deriveStrength(password) };
}

export const DEFAULT_ACCOUNTS: DemoAccount[] = [
  // ── Dictionary-crackable (found in phase 1) ──
  { id: "1", email: "carlos.lopez@demo.edu", password: "123456", strength: "weak", status: "compromised", note: "Common numeric password" },
  { id: "2", email: "ana.martinez@demo.edu", password: "ana2024", strength: "weak", status: "risky", note: "Name + year pattern" },
  { id: "6", email: "admin@demo.edu", password: "admin", strength: "weak", status: "compromised", note: "Default credential — never use!" },
  { id: "8", email: "student01@demo.edu", password: "qwerty123", strength: "weak", status: "risky", note: "Keyboard pattern" },

  // ── Rules-crackable (found in phase 2) ──
  { id: "3", email: "test.user@demo.edu", password: "P@ssw0rd", strength: "medium", status: "active", note: "Common leet substitution" },
  { id: "4", email: "juan.garcia@demo.edu", password: "Secur3!ty", strength: "medium", status: "active", note: "Rules-based mutation" },

  // ── Brute-force only (not in dict/rules, random short) ──
  // These are mathematically weak/medium but SURVIVE dictionary + rules
  { id: "9", email: "random.user1@demo.edu", password: "x7k9m2", strength: "weak", status: "risky", note: "Random short — survives dict, falls to brute force" },
  { id: "10", email: "random.user2@demo.edu", password: "m3n8p2q5", strength: "medium", status: "active", note: "Random 8-char — survives dict, falls to brute force" },
  { id: "11", email: "random.user3@demo.edu", password: "t2r8w5n1", strength: "medium", status: "active", note: "Random 8-char — survives dict and rules" },
  { id: "12", email: "random.user4@demo.edu", password: "k9d2p3", strength: "weak", status: "risky", note: "Random short — not in any wordlist" },

  // ── Strong / very-strong ──
  { id: "5", email: "maria.perez@demo.edu", password: "Tr0ub4dor&3!x", strength: "strong", status: "secure", note: "Passphrase-style" },
  { id: "7", email: "prof.torres@demo.edu", password: "X#9kL!mQp@2vN7*Z", strength: "very-strong", status: "secure", note: "Random high-entropy" },
];

const WORDS = ["cyber", "matrix", "ghost", "fire", "nova", "echo", "delta", "alpha", "storm", "blade"];
const DOMAINS = ["demo.edu", "uni.ac", "lab.io", "cyber.test"];
const NAMES = ["alex", "sofia", "diego", "lucia", "ivan", "mia", "leo", "emma"];

export function generateRandomAccount(): Omit<DemoAccount, "id"> {
  const name = NAMES[Math.floor(Math.random() * NAMES.length)];
  const num = Math.floor(Math.random() * 999);
  const domain = DOMAINS[Math.floor(Math.random() * DOMAINS.length)];
  const email = `${name}.${num}@${domain}`;

  const type = Math.floor(Math.random() * 4);
  let password = "";
  if (type === 0) {
    password = Math.random().toString(36).slice(2, 8);
  } else if (type === 1) {
    const w = WORDS[Math.floor(Math.random() * WORDS.length)];
    password = `${w}${Math.floor(Math.random() * 9999)}`;
  } else if (type === 2) {
    const w = WORDS[Math.floor(Math.random() * WORDS.length)];
    password = `${w.charAt(0).toUpperCase()}${w.slice(1)}!${Math.floor(Math.random() * 999)}`;
  } else {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*";
    password = Array.from({ length: 14 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  }

  const strength = deriveStrength(password);
  const status: AccountStatus = strength === "weak" ? (Math.random() > 0.5 ? "compromised" : "risky") : strength === "very-strong" ? "secure" : "active";

  return { email, password, strength, status };
}
