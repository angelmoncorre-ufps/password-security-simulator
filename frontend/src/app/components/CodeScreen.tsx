import { Code2, ArrowRight, Cpu, Hash, CheckSquare, Terminal } from "lucide-react";

type Lang = "en" | "es";

interface Props {
  lang: Lang;
  dark: boolean;
}

const content = {
  en: {
    title: "How the Simulation Works",
    sub: "A beginner-friendly walkthrough of the brute-force algorithm",
    flowTitle: "Algorithm Flow",
    flowSteps: [
      {
        icon: Terminal,
        label: "1. Input",
        desc: "User provides a demo password. The system reads its length and character types.",
        color: "var(--cyber-blue)",
      },
      {
        icon: Cpu,
        label: "2. Generate Attempts",
        desc: "The algorithm calculates charset size and total combinations = charset^length.",
        color: "var(--cyber-purple)",
      },
      {
        icon: Hash,
        label: "3. Compare",
        desc: "In a real attack, each attempt is hashed and compared to the stored password hash.",
        color: "var(--cyber-cyan)",
      },
      {
        icon: CheckSquare,
        label: "4. Result",
        desc: "The estimated time to find a match is displayed based on 10 billion guesses/sec.",
        color: "var(--cyber-green)",
      },
    ],
    codeTitle: "Python Simulation (Educational)",
    codeNote: "This code demonstrates the mathematical principle only — it does NOT attempt to crack any real system.",
    explainTitle: "Code Explanation",
    explains: [
      { label: "charset_size", desc: "Total number of possible characters in the character set (e.g. 26 for lowercase, 62 for alphanumeric)." },
      { label: "combinations", desc: "Total possible passwords = charset_size raised to the power of password length." },
      { label: "guesses_per_sec", desc: "Simulated attacker speed: 10 billion guesses per second (modern GPU cluster)." },
      { label: "time_to_crack", desc: "Expected time in seconds = combinations / guesses_per_sec / 2 (on average, found halfway through)." },
      { label: "entropy_bits", desc: "Information-theoretic measure of password strength = length × log₂(charset_size). Higher is better." },
    ],
    keyConceptTitle: "Key Concepts",
    concepts: [
      { term: "Entropy", def: "A measure of unpredictability. More bits = harder to guess." },
      { term: "Hash Function", def: "One-way transformation. Passwords are stored as hashes, never in plain text." },
      { term: "Charset", def: "The set of characters allowed. Larger charset = exponentially more combinations." },
      { term: "Dictionary Attack", def: "Tries common words before brute-forcing. Avoided by avoiding real words." },
      { term: "Salt", def: "Random data added before hashing to prevent precomputed attacks (rainbow tables)." },
    ],
  },
  es: {
    title: "Cómo Funciona la Simulación",
    sub: "Un recorrido amigable para principiantes del algoritmo de fuerza bruta",
    flowTitle: "Flujo del Algoritmo",
    flowSteps: [
      {
        icon: Terminal,
        label: "1. Entrada",
        desc: "El usuario provee una contraseña de prueba. El sistema lee su longitud y tipos de caracteres.",
        color: "var(--cyber-blue)",
      },
      {
        icon: Cpu,
        label: "2. Generar Intentos",
        desc: "El algoritmo calcula el tamaño del conjunto de caracteres y las combinaciones totales = charset^longitud.",
        color: "var(--cyber-purple)",
      },
      {
        icon: Hash,
        label: "3. Comparar",
        desc: "En un ataque real, cada intento es hasheado y comparado con el hash de contraseña almacenado.",
        color: "var(--cyber-cyan)",
      },
      {
        icon: CheckSquare,
        label: "4. Resultado",
        desc: "El tiempo estimado para encontrar una coincidencia se muestra basado en 10 mil millones de intentos/seg.",
        color: "var(--cyber-green)",
      },
    ],
    codeTitle: "Simulación en Python (Educativa)",
    codeNote: "Este código demuestra solo el principio matemático — NO intenta crackear ningún sistema real.",
    explainTitle: "Explicación del Código",
    explains: [
      { label: "charset_size", desc: "Número total de caracteres posibles en el conjunto (ej: 26 para minúsculas, 62 para alfanumérico)." },
      { label: "combinations", desc: "Total de contraseñas posibles = charset_size elevado a la longitud de la contraseña." },
      { label: "guesses_per_sec", desc: "Velocidad simulada del atacante: 10 mil millones de intentos por segundo (clúster GPU moderno)." },
      { label: "time_to_crack", desc: "Tiempo esperado en segundos = combinaciones / intentos_por_seg / 2 (en promedio, encontrada a la mitad)." },
      { label: "entropy_bits", desc: "Medida teórica de la fortaleza = longitud × log₂(charset_size). Mayor es mejor." },
    ],
    keyConceptTitle: "Conceptos Clave",
    concepts: [
      { term: "Entropía", def: "Medida de impredecibilidad. Más bits = más difícil de adivinar." },
      { term: "Función Hash", def: "Transformación unidireccional. Las contraseñas se almacenan como hashes, nunca en texto plano." },
      { term: "Charset", def: "El conjunto de caracteres permitidos. Mayor charset = exponencialmente más combinaciones." },
      { term: "Ataque de Diccionario", def: "Prueba palabras comunes antes de fuerza bruta. Se evita usando palabras no reales." },
      { term: "Salt", def: "Datos aleatorios añadidos antes del hash para prevenir ataques precomputados (tablas arcoíris)." },
    ],
  },
};

const pythonCode = `import math
import string
import time

# ─────────────────────────────────────────────
#  Educational Brute-Force Complexity Estimator
#  University Cybersecurity Project
#  ⚠️  For learning purposes only
# ─────────────────────────────────────────────

def estimate_brute_force(password: str) -> dict:
    """
    Estimate the theoretical time to brute-force a password.
    No actual cracking occurs – this is a mathematical model.
    """
    # Step 1: Determine charset size
    charset_size = 0
    if any(c.islower() for c in password):
        charset_size += 26   # a-z
    if any(c.isupper() for c in password):
        charset_size += 26   # A-Z
    if any(c.isdigit() for c in password):
        charset_size += 10   # 0-9
    if any(c in string.punctuation for c in password):
        charset_size += 33   # !@#$%...

    if charset_size == 0:
        charset_size = 26   # fallback

    length = len(password)

    # Step 2: Calculate total combinations
    combinations = charset_size ** length

    # Step 3: Simulate attack speed (modern GPU cluster)
    guesses_per_sec = 10_000_000_000   # 10 billion/sec

    # Step 4: Estimate crack time (on average, found midway)
    time_to_crack = combinations / guesses_per_sec / 2

    # Step 5: Measure entropy (Shannon information theory)
    entropy_bits = length * math.log2(charset_size)

    # Classify strength
    if entropy_bits < 36:
        strength = "WEAK"
    elif entropy_bits < 60:
        strength = "MEDIUM"
    else:
        strength = "STRONG"

    return {
        "length":        length,
        "charset_size":  charset_size,
        "combinations":  combinations,
        "entropy_bits":  round(entropy_bits, 2),
        "time_seconds":  time_to_crack,
        "strength":      strength,
    }


# ── Demo ──────────────────────────────────────
passwords = ["abc123", "P@ssw0rd!", "Tr0ub4dor&3!xY#9"]

for pwd in passwords:
    result = estimate_brute_force(pwd)
    print(f"Password : {'*' * len(pwd)}")
    print(f"Strength : {result['strength']}")
    print(f"Entropy  : {result['entropy_bits']} bits")
    print(f"Est. Time: {result['time_seconds']:.2e} seconds")
    print("─" * 40)
`;

type Token = { type: string; text: string };
function tokenize(code: string): Token[][] {
  const lines = code.split("\n");
  const keywords = /^(import|from|def|return|if|elif|else|for|in|and|or|not|class|with|as|pass|None|True|False|any)$/;
  const builtins = /^(print|len|round|str|int|float|dict|list|range|any)$/;

  return lines.map((line) => {
    const tokens: Token[] = [];
    let remaining = line;

    const push = (type: string, text: string) => { tokens.push({ type, text }); remaining = remaining.slice(text.length); };

    while (remaining.length > 0) {
      // Comment
      if (remaining.startsWith("#")) { push("comment", remaining); break; }
      // String
      if (remaining.startsWith('"""') || remaining.startsWith("'''")) {
        const q = remaining.slice(0, 3);
        const end = remaining.indexOf(q, 3);
        const str = end === -1 ? remaining : remaining.slice(0, end + 3);
        push("string", str); continue;
      }
      if (remaining[0] === '"' || remaining[0] === "'") {
        const q = remaining[0];
        const end = remaining.indexOf(q, 1);
        const str = end === -1 ? remaining : remaining.slice(0, end + 1);
        push("string", str); continue;
      }
      // Number
      const numMatch = remaining.match(/^[\d_]+(?:\.\d+)?/);
      if (numMatch) { push("number", numMatch[0]); continue; }
      // Word
      const wordMatch = remaining.match(/^[A-Za-z_]\w*/);
      if (wordMatch) {
        const w = wordMatch[0];
        const type = keywords.test(w) ? "keyword" : builtins.test(w) ? "builtin" : "ident";
        push(type, w); continue;
      }
      // Punct / space
      push("punct", remaining[0]);
    }
    return tokens;
  });
}

const tokenColors: Record<string, { light: string; dark: string }> = {
  keyword: { dark: "#c084fc", light: "#7c3aed" },
  builtin: { dark: "#38bdf8", light: "#0369a1" },
  string:  { dark: "#34d399", light: "#059669" },
  number:  { dark: "#fbbf24", light: "#b45309" },
  comment: { dark: "#475569", light: "#6b7280" },
  ident:   { dark: "#e2e8f0", light: "#1e293b" },
  punct:   { dark: "#94a3b8", light: "#64748b" },
};

function SyntaxLine({ tokens, dark }: { tokens: Token[]; dark: boolean }) {
  return (
    <span>
      {tokens.map((t, i) => (
        <span key={i} style={{ color: (tokenColors[t.type] || tokenColors.punct)[dark ? "dark" : "light"] }}>
          {t.text}
        </span>
      ))}
    </span>
  );
}

export function CodeScreen({ lang, dark }: Props) {
  const c = content[lang];
  const tokenized = tokenize(pythonCode);

  const cardBg = dark ? "rgba(15,26,46,0.9)" : "rgba(255,255,255,0.95)";
  const cardBorder = dark ? "rgba(59,130,246,0.2)" : "rgba(37,99,235,0.12)";
  const cardShadow = dark ? "0 4px 24px rgba(0,0,0,0.4)" : "0 4px 24px rgba(37,99,235,0.07)";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div>
        <h2
          className="flex items-center gap-2"
          style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: dark ? "#e2e8f0" : "#0f172a", fontSize: "1.5rem" }}
        >
          <Code2 className="w-5 h-5" style={{ color: "var(--cyber-cyan)" }} />
          {c.title}
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>{c.sub}</p>
      </div>

      {/* Flow steps */}
      <div
        className="rounded-2xl p-6"
        style={{ background: cardBg, border: `1px solid ${cardBorder}`, boxShadow: cardShadow }}
      >
        <h3
          className="mb-5"
          style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: dark ? "#e2e8f0" : "#0f172a" }}
        >
          {c.flowTitle}
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          {c.flowSteps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="flex sm:flex-col items-start sm:items-center gap-3 flex-1">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${step.color}20`, border: `1px solid ${step.color}40` }}
                >
                  <Icon className="w-5 h-5" style={{ color: step.color }} />
                </div>
                <div className="sm:text-center flex-1">
                  <div
                    className="text-sm font-semibold mb-0.5"
                    style={{ color: step.color, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}
                  >
                    {step.label}
                  </div>
                  <div className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{step.desc}</div>
                </div>
                {i < c.flowSteps.length - 1 && (
                  <ArrowRight
                    className="hidden sm:block w-4 h-4 shrink-0 mt-3"
                    style={{ color: "var(--border)", marginLeft: "auto", marginRight: "auto" }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main layout: code + explanations */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Code block */}
        <div
          className="lg:col-span-3 rounded-2xl overflow-hidden"
          style={{ background: dark ? "#070d1a" : "#f8fafc", border: `1px solid ${cardBorder}`, boxShadow: cardShadow }}
        >
          {/* Code header */}
          <div
            className="flex items-center justify-between px-4 py-2.5 border-b"
            style={{
              borderColor: cardBorder,
              background: dark ? "rgba(15,26,46,0.9)" : "rgba(226,232,240,0.7)",
            }}
          >
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            </div>
            <div
              className="text-xs"
              style={{ color: "var(--muted-foreground)", fontFamily: "'JetBrains Mono', monospace" }}
            >
              brute_force_estimator.py
            </div>
            <div
              className="text-xs px-2 py-0.5 rounded"
              style={{
                background: dark ? "rgba(16,185,129,0.15)" : "rgba(16,185,129,0.1)",
                color: "var(--cyber-green)",
                fontFamily: "'JetBrains Mono', monospace",
                border: "1px solid rgba(16,185,129,0.2)",
              }}
            >
              Python 3
            </div>
          </div>
          {/* Note banner */}
          <div
            className="px-4 py-2 text-xs flex items-center gap-2"
            style={{
              background: dark ? "rgba(59,130,246,0.08)" : "rgba(37,99,235,0.05)",
              borderBottom: `1px solid ${cardBorder}`,
              color: dark ? "#60a5fa" : "#1d4ed8",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <span>ℹ</span>
            <span>{c.codeNote}</span>
          </div>
          {/* Code content */}
          <div className="overflow-x-auto">
            <pre
              className="p-4 text-xs leading-6"
              style={{ fontFamily: "'JetBrains Mono', monospace", minWidth: "400px" }}
            >
              {tokenized.map((line, li) => (
                <div key={li} className="flex">
                  <span
                    className="select-none mr-4 w-7 text-right shrink-0"
                    style={{ color: dark ? "#1e3a5f" : "#cbd5e1", userSelect: "none" }}
                  >
                    {li + 1}
                  </span>
                  <SyntaxLine tokens={line} dark={dark} />
                </div>
              ))}
            </pre>
          </div>
        </div>

        {/* Explanations + concepts */}
        <div className="lg:col-span-2 space-y-4">
          {/* Variable explanations */}
          <div
            className="rounded-2xl p-5"
            style={{ background: cardBg, border: `1px solid ${cardBorder}`, boxShadow: cardShadow }}
          >
            <h3
              className="mb-4"
              style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: dark ? "#e2e8f0" : "#0f172a" }}
            >
              {c.explainTitle}
            </h3>
            <div className="space-y-3">
              {c.explains.map((e) => (
                <div key={e.label}>
                  <div
                    className="text-xs mb-1 px-2 py-0.5 rounded inline-block"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      background: dark ? "rgba(59,130,246,0.15)" : "rgba(37,99,235,0.08)",
                      color: "var(--cyber-blue)",
                      border: `1px solid ${cardBorder}`,
                    }}
                  >
                    {e.label}
                  </div>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{e.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Key concepts */}
          <div
            className="rounded-2xl p-5"
            style={{ background: cardBg, border: `1px solid ${cardBorder}`, boxShadow: cardShadow }}
          >
            <h3
              className="mb-4"
              style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: dark ? "#e2e8f0" : "#0f172a" }}
            >
              {c.keyConceptTitle}
            </h3>
            <div className="space-y-3">
              {c.concepts.map((concept) => (
                <div
                  key={concept.term}
                  className="rounded-xl p-3"
                  style={{
                    background: dark ? "rgba(30,45,74,0.5)" : "rgba(241,245,249,0.8)",
                    border: `1px solid ${cardBorder}`,
                  }}
                >
                  <div
                    className="text-sm font-semibold mb-0.5"
                    style={{ color: "var(--cyber-cyan)", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}
                  >
                    {concept.term}
                  </div>
                  <div className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                    {concept.def}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
