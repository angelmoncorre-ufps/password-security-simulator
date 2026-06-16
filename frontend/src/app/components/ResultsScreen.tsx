import { CheckCircle, XCircle, Shield, ShieldX, AlertTriangle, TrendingUp, Download, Share2, Copy, CheckCheck } from "lucide-react";
import { RadialBarChart, RadialBar, PolarAngleAxis, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { SimResult } from "./HomeScreen";
import { useState } from "react";

type Lang = "en" | "es";

interface Props {
  lang: Lang;
  dark: boolean;
  result: SimResult | null;
  onGoSim: () => void;
}

const content = {
  en: {
    noResult: "Run a simulation first",
    noResultSub: "Go to the Simulator tab and analyze a password to see results here.",
    goBtn: "Go to Simulator",
    title: "Simulation Results",
    outcome: "Outcome",
    found: "Password Cracked",
    notFound: "Withstood Attack",
    foundDesc: "This password was categorized as weak. A real attacker with modern hardware could crack it almost instantly.",
    notFoundDesc: "This password has enough complexity that a brute-force attack would take an impractically long time.",
    yourPassword: "Your Password",
    weakExample: "Weak Example",
    strongExample: "Strong Example",
    summary: "Why Strong Passwords Matter",
    summaryText: "Each additional character multiplies the number of possible combinations exponentially. A password of 8 lowercase letters has about 200 billion combinations, but adding uppercase letters, numbers, and symbols — and increasing length to 16 — creates combinations in the quintillions.",
    recommendation: "Security Recommendations",
    recs: [
      "Use a passphrase (e.g. 'correct-horse-battery-staple') for memorable strength",
      "Enable two-factor authentication (2FA) everywhere possible",
      "Use a reputable password manager like Bitwarden or 1Password",
      "Check if your email was in a data breach at haveibeenpwned.com",
      "Never share passwords or write them down in plain text",
    ],
    entropyChart: "Entropy Comparison (bits)",
    crackChart: "Estimated Crack Time",
    entropy: "Entropy",
    charsetSize: "Charset Size",
    length: "Length",
    presentationCard: "Presentation Card",
    downloadCard: "Download Card",
    shareCard: "Share",
    cardAccount: "Target Account",
    cardResult: "Result",
    cardAttempts: "Attempts Made",
    cardTime: "Time Elapsed",
    cardEntropy: "Entropy",
    cardConclusion: "Conclusion",
    conclusionWeak: "This weak password was cracked almost instantly. Even basic security measures would prevent this.",
    conclusionMedium: "This medium-strength password took some time but is still vulnerable to dedicated hardware.",
    conclusionStrong: "This strong password resisted the simulation. Brute-force would take millions of years.",
    disclaimer: "Educational simulation only. No real systems were accessed.",
    copySuccess: "Copied!",
    copyToClipboard: "Copy to Clipboard",
  },
  es: {
    noResult: "Ejecuta una simulación primero",
    noResultSub: "Ve a la pestaña Simulador y analiza una contraseña para ver los resultados aquí.",
    goBtn: "Ir al Simulador",
    title: "Resultados de la Simulación",
    outcome: "Resultado",
    found: "Contraseña Crackeada",
    notFound: "Resistió el Ataque",
    foundDesc: "Esta contraseña fue categorizada como débil. Un atacante real con hardware moderno podría crackearla casi instantáneamente.",
    notFoundDesc: "Esta contraseña tiene suficiente complejidad para que un ataque de fuerza bruta tome un tiempo imprácticamente largo.",
    yourPassword: "Tu Contraseña",
    weakExample: "Ejemplo Débil",
    strongExample: "Ejemplo Fuerte",
    summary: "Por Qué Importan las Contraseñas Fuertes",
    summaryText: "Cada carácter adicional multiplica el número de combinaciones posibles exponencialmente. Una contraseña de 8 letras minúsculas tiene unos 200 mil millones de combinaciones, pero agregar mayúsculas, números y símbolos — y aumentar la longitud a 16 — crea combinaciones en los quintillones.",
    recommendation: "Recomendaciones de Seguridad",
    recs: [
      "Usa una frase de contraseña (ej: 'caballo-correcto-batería-grapa') para fortaleza memorable",
      "Activa la autenticación de dos factores (2FA) donde sea posible",
      "Usa un gestor de contraseñas confiable como Bitwarden o 1Password",
      "Verifica si tu correo estuvo en una filtración en haveibeenpwned.com",
      "Nunca compartas contraseñas ni las escribas en texto plano",
    ],
    entropyChart: "Comparación de Entropía (bits)",
    crackChart: "Tiempo Estimado de Crackeo",
    entropy: "Entropía",
    charsetSize: "Tamaño del Conjunto",
    length: "Longitud",
    presentationCard: "Tarjeta de Presentación",
    downloadCard: "Guardar Tarjeta",
    shareCard: "Compartir",
    cardAccount: "Cuenta Objetivo",
    cardResult: "Resultado",
    cardAttempts: "Intentos Realizados",
    cardTime: "Tiempo Transcurrido",
    cardEntropy: "Entropía",
    cardConclusion: "Conclusión",
    conclusionWeak: "Esta contraseña débil fue crackeada casi instantáneamente. Incluso medidas básicas de seguridad lo prevendrían.",
    conclusionMedium: "Esta contraseña de fortaleza media tomó algo de tiempo, pero sigue siendo vulnerable para hardware dedicado.",
    conclusionStrong: "Esta contraseña fuerte resistió la simulación. La fuerza bruta tomaría millones de años.",
    disclaimer: "Solo simulación educativa. No se accedió a ningún sistema real.",
    copySuccess: "¡Copiado!",
    copyToClipboard: "Copiar al Portapapeles",
  },
};

function analyzeStatic(pwd: string) {
  const len = pwd.length;
  let charset = 0;
  if (/[a-z]/.test(pwd)) charset += 26;
  if (/[A-Z]/.test(pwd)) charset += 26;
  if (/[0-9]/.test(pwd)) charset += 10;
  if (/[^a-zA-Z0-9]/.test(pwd)) charset += 33;
  if (charset === 0) charset = 26;
  return { entropy: Math.round(len * Math.log2(charset)), charset, length: len };
}

function generatePresentationCardContent(result: SimResult, lang: Lang, dark: boolean) {
  const c = content[lang];
  const isFound = result.strength === "weak";
  const resultColor = isFound ? "var(--cyber-red)" : "var(--cyber-green)";
  const strengthColors = {
    "weak": "var(--cyber-red)", "medium": "var(--cyber-amber)",
    "strong": "var(--cyber-blue)", "very-strong": "var(--cyber-green)",
  };
  
  const cardData = {
    account: {
      email: result.password.includes('@') ? result.password : "demo@university.edu",
      strength: result.strength,
    },
    result: isFound ? c.found : c.notFound,
    attempts: result.attempts,
    time: result.crackTimeLabel,
    entropy: result.entropy,
    conclusion: isFound ? c.conclusionWeak : c.conclusionStrong,
    timestamp: new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  };
  
  return cardData;
}

export function ResultsScreen({ lang, dark, result, onGoSim }: Props) {
  const c = content[lang];
  const [showPresentationCard, setShowPresentationCard] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const cardBg = dark ? "rgba(15,26,46,0.9)" : "rgba(255,255,255,0.95)";
  const cardBorder = dark ? "rgba(59,130,246,0.2)" : "rgba(37,99,235,0.12)";
  const cardShadow = dark ? "0 4px 24px rgba(0,0,0,0.4)" : "0 4px 24px rgba(37,99,235,0.07)";
  
  if (!result) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 flex flex-col items-center justify-center gap-4 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: dark ? "rgba(30,45,74,0.8)" : "#e0e7ff", border: '1px solid ' + cardBorder }}
        >
          <Shield className="w-8 h-8" style={{ color: "var(--cyber-blue)" }} />
        </div>
        <h2 style={{ color: dark ? "#e2e8f0" : "#0f172a", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>
          {c.noResult}
        </h2>
        <p style={{ color: "var(--muted-foreground)" }}>{c.noResultSub}</p>
        <button
          onClick={onGoSim}
          className="mt-2 px-6 py-2.5 rounded-xl text-white transition-all"
          style={{
            background: "linear-gradient(135deg, var(--cyber-blue), var(--cyber-purple))",
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            letterSpacing: "0.05em",
            boxShadow: "0 4px 16px rgba(59,130,246,0.3)",
          }}
        >
          {c.goBtn}
        </button>
      </div>
    );
  }

  const isFound = result.strength === "weak";
  const weakData = analyzeStatic("abc123");
  const strongData = analyzeStatic("Tr0ub4dor&3!xY#9");
  const yourData = analyzeStatic(result.password);

  const barData = [
    { name: c.weakExample, entropy: weakData.entropy, length: weakData.length, charset: weakData.charset },
    { name: c.yourPassword, entropy: yourData.entropy, length: yourData.length, charset: yourData.charset },
    { name: c.strongExample, entropy: strongData.entropy, length: strongData.length, charset: strongData.charset },
  ];

  const strengthPct = result.strength === "weak" ? 18 : result.strength === "medium" ? 55 : 90;
  const radialData = [{ value: strengthPct }];
  const strengthColor = result.strength === "weak" ? "var(--cyber-red)" : result.strength === "medium" ? "var(--cyber-amber)" : "var(--cyber-green)";

  const barColors = ["var(--cyber-red)", "var(--cyber-blue)", "var(--cyber-green)"];

  const handleCopyToClipboard = async () => {
    const cardContent = document.getElementById('presentation-card');
    if (cardContent) {
      try {
        await navigator.clipboard.writeText(cardContent.textContent || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const handleDownloadCard = () => {
    const cardElement = document.getElementById('presentation-card');
    if (!cardElement) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>BruteForce Lab - Presentation Card</title>
        <style>
          :root {
            --cyber-blue: #3b82f6;
            --cyber-purple: #a78bfa;
            --cyber-cyan: #22d3ee;
            --cyber-green: #10b981;
            --cyber-amber: #f59e0b;
            --cyber-red: #ef4444;
            --muted-foreground: #64748b;
            --foreground: ${dark ? '#e2e8f0' : '#0f172a'};
          }
          body {
            font-family: 'Rajdhani', sans-serif;
            background: ${dark ? '#0a0f1e' : '#ffffff'};
            color: var(--foreground);
            padding: 20px;
            margin: 0;
          }
          .card {
            max-width: 600px;
            margin: 0 auto;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            background: ${dark ? 'linear-gradient(135deg, #0a0f1e 0%, #0f1a2e 50%, #1a103a 100%)' : 'linear-gradient(135deg, #dbeafe 0%, #ede9fe 60%, #cffafe 100%)'};
          }
          .card-header {
            padding: 20px;
            background: ${dark ? 'rgba(15,26,46,0.8)' : 'rgba(241,245,249,0.8)'};
            border-bottom: 1px solid ${cardBorder};
          }
          .card-content {
            padding: 30px;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-top: 20px;
          }
          .stat-box {
            padding: 15px;
            border-radius: 12px;
            background: ${dark ? 'rgba(15,26,46,0.7)' : 'rgba(255,255,255,0.8)'};
            border: 1px solid ${dark ? 'rgba(59,130,246,0.2)' : 'rgba(37,99,235,0.1)'};
          }
          .stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--cyber-blue);
            font-family: 'JetBrains Mono', monospace;
          }
          .stat-label {
            font-size: 0.875rem;
            color: var(--muted-foreground);
            margin-top: 4px;
          }
          @media print {
            body { background: white; }
            .card { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        ${cardElement.outerHTML}
      </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Title */}
      <h2
        className="flex items-center gap-2"
        style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: dark ? "#e2e8f0" : "#0f172a", fontSize: "1.5rem" }}
      >
        <TrendingUp className="w-5 h-5" style={{ color: "var(--cyber-cyan)" }} />
        {c.title}
      </h2>

      {/* Presentation Card Toggle */}
      <div
        className="rounded-2xl p-4"
        style={{ background: cardBg, border: '1px solid ' + cardBorder, boxShadow: cardShadow }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, var(--cyber-blue), var(--cyber-purple))" }}
            >
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: dark ? "#e2e8f0" : "#0f172a" }}>
                {c.presentationCard}
              </h3>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                Generate a shareable presentation card for your cybersecurity demonstration
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPresentationCard(!showPresentationCard)}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: showPresentationCard
                ? "linear-gradient(135deg, var(--cyber-blue), var(--cyber-purple))"
                : "transparent",
              color: showPresentationCard ? "#fff" : "var(--muted-foreground)",
              border: '1px solid ' + (showPresentationCard ? "transparent" : cardBorder),
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
            }}
          >
            {showPresentationCard ? c.shareCard : c.shareCard}
          </button>
        </div>

        {/* Presentation Card */}
        {showPresentationCard && (
          <div
            id="presentation-card"
            className="mt-6 rounded-2xl overflow-hidden"
            style={{ background: cardBg, border: '1px solid ' + cardBorder }}
          >
            <div
              className="px-6 py-3 flex items-center gap-2 border-b border-border"
              style={{ background: dark ? "rgba(30,45,74,0.5)" : "rgba(241,245,249,0.8)" }}
            >
              <Share2 className="w-4 h-4" style={{ color: "var(--cyber-cyan)" }} />
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: dark ? "#e2e8f0" : "#0f172a" }}>
                {c.presentationCard}
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
                style={{ backgroundImage: 'repeating-linear-gradient(0deg,' + (dark ? "#3b82f6" : "#2563eb") + ' 0,' + (dark ? "#3b82f6" : "#2563eb") + ' 1px,transparent 1px,transparent 32px),repeating-linear-gradient(90deg,' + (dark ? "#3b82f6" : "#2563eb") + ' 0,' + (dark ? "#3b82f6" : "#2563eb") + ' 1px,transparent 1px,transparent 32px)' }}
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
                        style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "1.2rem", color: dark ? "#e2e8f0" : "#0f172a" }}
                      >
                        BruteForce Lab
                      </div>
                      <div className="text-xs" style={{ color: "var(--cyber-cyan)", fontFamily: "'JetBrains Mono', monospace" }}>
                        Educational Security Demo
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{c.cardAccount}</div>
                    <div
                      className="text-sm break-all"
                      style={{ fontFamily: "'JetBrains Mono', monospace", color: dark ? "#e2e8f0" : "#0f172a" }}
                    >
                      {result.password.includes('@') ? result.password : "demo@university.edu"}
                    </div>
                  </div>

                  <div
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: isFound ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)", border: '1px solid ' + (isFound ? "rgba(239,68,68,0.4)" : "rgba(16,185,129,0.4)") }}
                  >
                    {isFound
                      ? <XCircle className="w-4 h-4" style={{ color: "var(--cyber-red)" }} />
                      : <ShieldCheck className="w-4 h-4" style={{ color: "var(--cyber-green)" }} />}
                    <span
                      style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: isFound ? "var(--cyber-red)" : "var(--cyber-green)" }}
                    >
                      {isFound ? c.found : c.notFound}
                    </span>
                  </div>
                </div>

                {/* Right: stats grid + conclusion */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: c.cardAttempts, value: result.attempts.toLocaleString(), color: "var(--cyber-blue)" },
                      { label: c.cardTime, value: result.crackTimeLabel, color: "var(--cyber-purple)" },
                      { label: c.cardEntropy, value: `${result.entropy} bits`, color: "var(--cyber-cyan)" },
                      { label: c.charsetSize, value: result.charset.toString(), color: strengthColors[result.strength] ?? "var(--cyber-green)" },
                    ].map(({ label, value, color }) => (
                      <div
                        key={label}
                        className="rounded-xl p-3"
                        style={{ background: dark ? "rgba(15,26,46,0.7)" : "rgba(255,255,255,0.8)", border: '1px solid ' + (dark ? "rgba(59,130,246,0.2)" : "rgba(37,99,235,0.1)") }}
                      >
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: "0.9rem", color }}>{value}</div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Conclusion box */}
                  <div
                    className="rounded-xl p-3"
                    style={{ background: dark ? "rgba(15,26,46,0.7)" : "rgba(255,255,255,0.8)", border: '1px solid ' + strengthColor + '40' }}
                  >
                    <div className="text-xs mb-1 font-semibold" style={{ color: strengthColor, fontFamily: "'Rajdhani', sans-serif" }}>
                      {c.cardConclusion}
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: dark ? "#94a3b8" : "#475569" }}>
                      {isFound ? c.conclusionWeak : c.conclusionStrong}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 flex items-center justify-between border-t border-border" style={{ background: dark ? "rgba(15,26,46,0.5)" : "rgba(241,245,249,0.8)" }}>
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "'JetBrains Mono', monospace" }}>
                Generated on {new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyToClipboard}
                  className="p-2 rounded-lg transition-colors hover:bg-muted"
                  style={{ color: "var(--muted-foreground)" }}
                  title={c.copyToClipboard}
                >
                  {copied ? <CheckCheck className="w-4 h-4" style={{ color: "var(--cyber-green)" }} /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDownloadCard()}
                  className="p-2 rounded-lg transition-colors hover:bg-muted"
                  style={{ color: "var(--muted-foreground)" }}
                  title={c.downloadCard}
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Original Results Content */}
      <div className="space-y-6">
        {/* Outcome banner */}
        <div
          className="rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4"
          style={{
            background: isFound
              ? dark ? "rgba(239,68,68,0.1)" : "rgba(254,226,226,0.8)"
              : dark ? "rgba(16,185,129,0.1)" : "rgba(209,250,229,0.8)",
            border: '1px solid ' + (isFound ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"),
          }}
        >
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: isFound ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)" }}
          >
            {isFound
              ? <ShieldX className="w-8 h-8" style={{ color: "var(--cyber-red)" }} />
              : <Shield className="w-8 h-8" style={{ color: "var(--cyber-green)" }} />}
          </div>
          <div>
            <h3
              style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: isFound ? "var(--cyber-red)" : "var(--cyber-green)", fontSize: "1.25rem" }}
            >
              {isFound ? c.found : c.notFound}
            </h3>
            <p className="text-sm mt-1" style={{ color: dark ? "#94a3b8" : "#475569" }}>
              {isFound ? c.foundDesc : c.notFoundDesc}
            </p>
          </div>
          <div className="sm:ml-auto text-right shrink-0">
            <div
              className="text-xs mb-1"
              style={{ color: "var(--muted-foreground)", fontFamily: "'JetBrains Mono', monospace" }}
            >
              {c.crackChart}
            </div>
            <div
              style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: "1.1rem", color: strengthColor }}
            >
              {result.crackTimeLabel}
            </div>
          </div>
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Entropy bar chart */}
          <div
            className="lg:col-span-2 rounded-2xl p-6"
            style={{ background: cardBg, border: '1px solid ' + cardBorder, boxShadow: cardShadow }}
          >
            <h3
              className="mb-4"
              style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: dark ? "#e2e8f0" : "#0f172a" }}
            >
              {c.entropyChart}
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: dark ? "#64748b" : "#94a3b8", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: dark ? "#64748b" : "#94a3b8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: dark ? "#0f1a2e" : "#fff",
                    border: '1px solid ' + cardBorder,
                    borderRadius: "10px",
                    color: dark ? "#e2e8f0" : "#0f172a",
                    fontSize: 12,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                  cursor={{ fill: dark ? "rgba(59,130,246,0.07)" : "rgba(37,99,235,0.05)" }}
                />
                <Bar dataKey="entropy" radius={[6, 6, 0, 0]}>
                  {barData.map((_, i) => (
                    <Cell key={i} fill={barColors[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Strength radial */}
          <div
            className="rounded-2xl p-6 flex flex-col items-center justify-center"
            style={{ background: cardBg, border: '1px solid ' + cardBorder, boxShadow: cardShadow }}
          >
            <h3
              className="mb-2 self-start"
              style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: dark ? "#e2e8f0" : "#0f172a" }}
            >
              {c.entropy}
            </h3>
            <div className="relative">
              <RadialBarChart
                width={160}
                height={160}
                innerRadius="60%"
                outerRadius="100%"
                data={radialData}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar dataKey="value" background={{ fill: dark ? "rgba(30,45,74,0.4)" : "#e2e8f0" }} fill={strengthColor} cornerRadius={8} />
              </RadialBarChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div
                  style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: "1.3rem", color: strengthColor }}
                >
                  {result.entropy}
                </div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>bits</div>
              </div>
            </div>
            <div className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
              {result.strength.charAt(0).toUpperCase() + result.strength.slice(1)}
            </div>
          </div>
        </div>

        {/* Comparison cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: c.weakExample, pwd: "abc123", color: "var(--cyber-red)", icon: XCircle },
            { label: c.yourPassword, pwd: result.password, color: strengthColor, icon: Shield },
            { label: c.strongExample, pwd: "Tr0ub4dor&3!xY#9", icon: CheckCircle, color: "var(--cyber-green)" },
          ].map(({ label, pwd, color, icon: Icon }) => {
            const a = analyzeStatic(pwd);
            return (
              <div
                key={label}
                className="rounded-2xl p-4"
                style={{ background: cardBg, border: '1px solid ' + color + '30', boxShadow: cardShadow }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-4 h-4" style={{ color }} />
                  <span className="text-sm font-semibold" style={{ color, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>
                    {label}
                  </span>
                </div>
                <div
                  className="rounded-lg px-3 py-2 mb-3 text-sm break-all"
                  style={{ fontFamily: "'JetBrains Mono', monospace", background: dark ? "rgba(30,45,74,0.5)" : "#f1f5f9", color: dark ? "#e2e8f0" : "#0f172a", border: '1px solid ' + cardBorder }}
                >
                  {label === c.yourPassword ? result.password : pwd}
                </div>
                <div className="flex flex-col gap-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>Entropy: <span style={{ color }}>{a.entropy} bits</span></span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>Charset: <span style={{ color }}>{a.charset}</span></span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>Length: <span style={{ color }}>{a.length}</span></span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary + recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div
            className="rounded-2xl p-6"
            style={{ background: cardBg, border: '1px solid ' + cardBorder, boxShadow: cardShadow }}
          >
            <h3
              className="mb-3"
              style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: dark ? "#e2e8f0" : "#0f172a" }}
            >
              {c.summary}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              {c.summaryText}
            </p>
          </div>
          <div
            className="rounded-2xl p-6"
            style={{ background: cardBg, border: '1px solid ' + cardBorder, boxShadow: cardShadow }}
          >
            <h3
              className="mb-3"
              style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: dark ? "#e2e8f0" : "#0f172a" }}
            >
              {c.recommendation}
            </h3>
            <ul className="space-y-2">
              {c.recs.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--cyber-green)" }} />
                  <span style={{ color: dark ? "#94a3b8" : "#475569" }}>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
