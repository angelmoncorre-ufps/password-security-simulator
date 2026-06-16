import { useState, useMemo, useEffect } from "react";
import {
  Plus, Trash2, Edit3, Search, RefreshCw, AlertTriangle,
  ShieldX, Shield, ShieldCheck, ShieldAlert, Eye, EyeOff,
  Mail, Lock, Filter, Zap, CheckCircle, XCircle, AlertCircle, Info,
  Database, Users, Clock, TrendingUp, BarChart3, Layers, Activity,
} from "lucide-react";
import { DemoAccount, StrengthLevel, AccountStatus, deriveStrength, generateRandomAccount } from "./types";

type Lang = "en" | "es";
interface Props { lang: Lang; dark: boolean; accounts: DemoAccount[]; setAccounts: (a: DemoAccount[]) => void; onSelectForAttack: (a: DemoAccount) => void; }

const t = {
  en: {
    title: "Laboratory — Demo Accounts",
    sub: "Manage fictional test accounts for the cybersecurity presentation",
    warning: "⚠️ All credentials are completely fictional. Created for educational purposes only. No real systems are targeted.",
    searchPlaceholder: "Search by email or strength…",
    filterAll: "All",
    addBtn: "Add Account",
    generateBtn: "Generate Random",
    colEmail: "Email", colPassword: "Password", colStrength: "Strength", colStatus: "Status", colActions: "Actions",
    weak: "Weak", medium: "Medium", strong: "Strong", veryStrong: "Very Strong",
    active: "Active", compromised: "Compromised", risky: "Risky", secure: "Secure",
    attackBtn: "Attack",
    editTitle: "Edit Account", addTitle: "New Account",
    emailLabel: "Email", passwordLabel: "Password", statusLabel: "Status", noteLabel: "Note (optional)",
    saveBtn: "Save", cancelBtn: "Cancel", deleteConfirm: "Delete this account?",
    noResults: "No accounts found", noResultsSub: "Try a different search or filter",
    totalLabel: "Total", weakLabel: "Weak", compromisedLabel: "Compromised", secureLabel: "Secure",
    showPwd: "Show", hidePwd: "Hide",
    entropyLabel: "Entropy", charsetLabel: "Charset",
  },
  es: {
    title: "Laboratorio — Cuentas Demo",
    sub: "Gestiona cuentas de prueba ficticias para la presentación de ciberseguridad",
    warning: "⚠️ Todas las credenciales son completamente ficticias. Creadas solo con fines educativos. No se ataca ningún sistema real.",
    searchPlaceholder: "Buscar por email o fortaleza…",
    filterAll: "Todos",
    addBtn: "Agregar Cuenta",
    generateBtn: "Generar Aleatoria",
    colEmail: "Email", colPassword: "Contraseña", colStrength: "Fortaleza", colStatus: "Estado", colActions: "Acciones",
    weak: "Débil", medium: "Media", strong: "Fuerte", veryStrong: "Muy Fuerte",
    active: "Activa", compromised: "Comprometida", risky: "En Riesgo", secure: "Segura",
    attackBtn: "Atacar",
    editTitle: "Editar Cuenta", addTitle: "Nueva Cuenta",
    emailLabel: "Email", passwordLabel: "Contraseña", statusLabel: "Estado", noteLabel: "Nota (opcional)",
    saveBtn: "Guardar", cancelBtn: "Cancelar", deleteConfirm: "¿Eliminar esta cuenta?",
    noResults: "No se encontraron cuentas", noResultsSub: "Prueba otra búsqueda o filtro",
    totalLabel: "Total", weakLabel: "Débiles", compromisedLabel: "Comprometidas", secureLabel: "Seguras",
    showPwd: "Ver", hidePwd: "Ocultar",
    entropyLabel: "Entropía", charsetLabel: "Charset",
  },
};

const strengthConfig = {
  "weak":        { color: "var(--cyber-red)",    icon: ShieldX,     bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)" },
  "medium":      { color: "var(--cyber-amber)",  icon: ShieldAlert, bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.3)" },
  "strong":      { color: "var(--cyber-blue)",   icon: Shield,      bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.3)" },
  "very-strong": { color: "var(--cyber-green)",  icon: ShieldCheck, bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.3)" },
};

const statusConfig = {
  "active":      { color: "var(--cyber-blue)",   icon: Info,         label: { en: "Active",       es: "Activa" } },
  "compromised": { color: "var(--cyber-red)",    icon: XCircle,      label: { en: "Compromised",  es: "Comprometida" } },
  "risky":       { color: "var(--cyber-amber)",  icon: AlertCircle,  label: { en: "Risky",        es: "En Riesgo" } },
  "secure":      { color: "var(--cyber-green)",  icon: CheckCircle,  label: { en: "Secure",       es: "Segura" } },
};

function StrengthBadge({ strength, lang }: { strength: StrengthLevel; lang: Lang }) {
  const cfg = strengthConfig[strength];
  const Icon = cfg.icon;
  const labels = { "weak": { en: "Weak", es: "Débil" }, "medium": { en: "Medium", es: "Media" }, "strong": { en: "Strong", es: "Fuerte" }, "very-strong": { en: "Very Strong", es: "Muy Fuerte" } };
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontFamily: "'Rajdhani', sans-serif" }}
    >
      <Icon className="w-3 h-3" />
      {labels[strength][lang]}
    </span>
  );
}

function StatusBadge({ status, lang }: { status: AccountStatus; lang: Lang }) {
  const cfg = statusConfig[status];
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ color: cfg.color, background: `${cfg.color}18`, border: `1px solid ${cfg.color}40`, fontFamily: "'Rajdhani', sans-serif" }}
    >
      <Icon className="w-3 h-3" />
      {cfg.label[lang]}
    </span>
  );
}

interface ModalProps {
  dark: boolean; lang: Lang;
  initial?: DemoAccount; mode: "add" | "edit";
  onSave: (d: Omit<DemoAccount, "id">) => void; onClose: () => void;
}

function AccountModal({ dark, lang, initial, mode, onSave, onClose }: ModalProps) {
  const c = t[lang];
  const [email, setEmail] = useState(initial?.email ?? "");
  const [password, setPassword] = useState(initial?.password ?? "");
  const [status, setStatus] = useState<AccountStatus>(initial?.status ?? "active");
  const [note, setNote] = useState(initial?.note ?? "");
  const [showPwd, setShowPwd] = useState(false);

  const strength = deriveStrength(password || "a");
  const cfg = strengthConfig[strength];

  const inputStyle = {
    background: dark ? "rgba(30,45,74,0.8)" : "#f1f5f9",
    border: `1px solid ${dark ? "rgba(59,130,246,0.2)" : "rgba(37,99,235,0.12)"}`,
    color: "var(--foreground)",
    borderRadius: "10px",
    padding: "8px 12px",
    width: "100%",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "13px",
    outline: "none",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div
        className="w-full max-w-md rounded-2xl p-6 space-y-4"
        style={{
          background: dark ? "#0f1a2e" : "#fff",
          border: `1px solid ${dark ? "rgba(59,130,246,0.25)" : "rgba(37,99,235,0.15)"}`,
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        }}
      >
        <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: dark ? "#e2e8f0" : "#0f172a", fontSize: "1.15rem" }}>
          {mode === "add" ? c.addTitle : c.editTitle}
        </h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>{c.emailLabel}</label>
            <input style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="user@demo.edu" />
          </div>

          <div>
            <label className="text-xs mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>{c.passwordLabel}</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                style={{ ...inputStyle, paddingRight: "70px" }}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="password123"
              />
              <button
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs flex items-center gap-1"
                style={{ color: "var(--muted-foreground)" }}
              >
                {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showPwd ? c.hidePwd : c.showPwd}
              </button>
            </div>
            {password && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: dark ? "rgba(30,45,74,0.8)" : "#e2e8f0" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: strength === "weak" ? "20%" : strength === "medium" ? "50%" : strength === "strong" ? "75%" : "100%",
                      background: cfg.color,
                    }}
                  />
                </div>
                <StrengthBadge strength={strength} lang={lang} />
              </div>
            )}
          </div>

          <div>
            <label className="text-xs mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>{c.statusLabel}</label>
            <select
              style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
              value={status}
              onChange={e => setStatus(e.target.value as AccountStatus)}
            >
              {(["active", "compromised", "risky", "secure"] as AccountStatus[]).map(s => (
                <option key={s} value={s}>{statusConfig[s].label[lang]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>{c.noteLabel}</label>
            <input style={inputStyle} value={note} onChange={e => setNote(e.target.value)} placeholder="…" />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onSave({ email, password, strength: deriveStrength(password || "a"), status, note })}
            disabled={!email || !password}
            className="flex-1 py-2.5 rounded-xl text-sm transition-all"
            style={{
              background: email && password ? "linear-gradient(135deg, var(--cyber-blue), var(--cyber-purple))" : "var(--muted)",
              color: email && password ? "#fff" : "var(--muted-foreground)",
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: "0.04em",
              boxShadow: email && password ? "0 4px 16px rgba(59,130,246,0.3)" : "none",
            }}
          >
            {c.saveBtn}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm border border-border transition-colors hover:bg-muted"
            style={{ color: "var(--muted-foreground)", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600 }}
          >
            {c.cancelBtn}
          </button>
        </div>
      </div>
    </div>
  );
}

export function LabScreen({ lang, dark, accounts, setAccounts, onSelectForAttack }: Props) {
  const c = t[lang];
  const [search, setSearch] = useState("");
  const [filterStrength, setFilterStrength] = useState<StrengthLevel | "all">("all");
  const [modal, setModal] = useState<{ mode: "add" | "edit"; account?: DemoAccount } | null>(null);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  const cardBg = dark ? "rgba(15,26,46,0.9)" : "rgba(255,255,255,0.95)";
  const cardBorder = dark ? "rgba(59,130,246,0.2)" : "rgba(37,99,235,0.12)";

  const filtered = useMemo(() => {
    return accounts.filter(a => {
      const matchSearch = !search || a.email.toLowerCase().includes(search.toLowerCase()) || a.strength.includes(search.toLowerCase());
      const matchFilter = filterStrength === "all" || a.strength === filterStrength;
      return matchSearch && matchFilter;
    });
  }, [accounts, search, filterStrength]);

  const stats = useMemo(() => ({
    total: accounts.length,
    weak: accounts.filter(a => a.strength === "weak").length,
    compromised: accounts.filter(a => a.status === "compromised" || a.status === "risky").length,
    secure: accounts.filter(a => a.status === "secure").length,
  }), [accounts]);

  const toggleReveal = (id: string) => {
    setRevealedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const handleSave = (data: Omit<DemoAccount, "id">) => {
    if (modal?.mode === "edit" && modal.account) {
      setAccounts(accounts.map(a => a.id === modal.account!.id ? { ...a, ...data } : a));
    } else {
      const id = Date.now().toString();
      setAccounts([...accounts, { id, ...data }]);
    }
    setModal(null);
  };

  const handleDelete = (id: string) => {
    if (confirm(c.deleteConfirm)) setAccounts(accounts.filter(a => a.id !== id));
  };

  const handleGenerate = () => {
    const gen = generateRandomAccount();
    const id = Date.now().toString();
    setAccounts([...accounts, { id, ...gen }]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: dark ? "#e2e8f0" : "#0f172a", fontSize: "1.5rem" }}>
            🧪 {c.title}
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>{c.sub}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGenerate}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm border border-border transition-colors hover:bg-muted"
            style={{ color: "var(--muted-foreground)", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600 }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {c.generateBtn}
          </button>
          <button
            onClick={() => setModal({ mode: "add" })}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm text-white transition-all"
            style={{
              background: "linear-gradient(135deg, var(--cyber-blue), var(--cyber-purple))",
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: "0.04em",
              boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            {c.addBtn}
          </button>
        </div>
      </div>

      {/* Warning banner */}
      <div
        className="rounded-xl px-4 py-3 flex items-start gap-2.5 text-sm"
        style={{ background: dark ? "rgba(245,158,11,0.1)" : "rgba(254,243,199,0.8)", border: "1px solid rgba(245,158,11,0.35)", color: dark ? "#fbbf24" : "#92400e" }}
      >
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--cyber-amber)" }} />
        <span>{c.warning}</span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: c.totalLabel, value: stats.total, color: "var(--cyber-blue)" },
          { label: c.weakLabel, value: stats.weak, color: "var(--cyber-red)" },
          { label: c.compromisedLabel, value: stats.compromised, color: "var(--cyber-amber)" },
          { label: c.secureLabel, value: stats.secure, color: "var(--cyber-green)" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl p-4 flex flex-col gap-1"
            style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
          >
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: "1.5rem", color }}>{value}</div>
            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={c.searchPlaceholder}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl outline-none text-sm"
            style={{
              background: dark ? "rgba(30,45,74,0.7)" : "#f1f5f9",
              border: `1px solid ${cardBorder}`,
              color: "var(--foreground)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          />
        </div>
        <div className="flex items-center gap-1.5 bg-muted rounded-xl p-1">
          <Filter className="w-3.5 h-3.5 ml-2 shrink-0" style={{ color: "var(--muted-foreground)" }} />
          {(["all", "weak", "medium", "strong", "very-strong"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterStrength(f)}
              className="px-2.5 py-1 rounded-lg text-xs transition-all"
              style={{
                background: filterStrength === f ? (f === "all" ? "var(--primary)" : strengthConfig[f as StrengthLevel]?.color ?? "var(--primary)") : "transparent",
                color: filterStrength === f ? "#fff" : "var(--muted-foreground)",
                fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
              }}
            >
              {f === "all" ? c.filterAll : f === "weak" ? c.weak : f === "medium" ? c.medium : f === "strong" ? c.strong : c.veryStrong}
            </button>
          ))}
        </div>
      </div>

      {/* Table — desktop */}
      <div
        className="hidden sm:block rounded-2xl overflow-hidden"
        style={{ background: cardBg, border: `1px solid ${cardBorder}`, boxShadow: dark ? "0 4px 24px rgba(0,0,0,0.4)" : "0 4px 24px rgba(37,99,235,0.07)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: `1px solid ${cardBorder}`, background: dark ? "rgba(30,45,74,0.5)" : "rgba(241,245,249,0.8)" }}>
              {[c.colEmail, c.colPassword, c.colStrength, c.colStatus, c.colActions].map(h => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-xs"
                  style={{ color: "var(--muted-foreground)", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12">
                  <div style={{ color: "var(--muted-foreground)" }}>
                    <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-medium">{c.noResults}</p>
                    <p className="text-xs mt-1">{c.noResultsSub}</p>
                  </div>
                </td>
              </tr>
            ) : filtered.map((acc, idx) => (
              <tr
                key={acc.id}
                style={{ borderBottom: idx < filtered.length - 1 ? `1px solid ${cardBorder}` : "none" }}
                className="transition-colors hover:bg-muted/30"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--cyber-blue)" }} />
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: dark ? "#e2e8f0" : "#0f172a" }}>{acc.email}</span>
                  </div>
                  {acc.note && <div className="text-xs mt-0.5 ml-5.5" style={{ color: "var(--muted-foreground)" }}>{acc.note}</div>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--muted-foreground)" }} />
                    <code
                      className="text-xs"
                      style={{ fontFamily: "'JetBrains Mono', monospace", color: dark ? "#94a3b8" : "#475569" }}
                    >
                      {revealedIds.has(acc.id) ? acc.password : "•".repeat(Math.min(acc.password.length, 12))}
                    </code>
                    <button
                      onClick={() => toggleReveal(acc.id)}
                      className="ml-1"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {revealedIds.has(acc.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StrengthBadge strength={acc.strength} lang={lang} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={acc.status} lang={lang} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onSelectForAttack(acc)}
                      className="px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 transition-all"
                      style={{
                        background: "linear-gradient(135deg, var(--cyber-red), var(--cyber-purple))",
                        color: "#fff", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
                      }}
                      title={c.attackBtn}
                    >
                      <Zap className="w-3 h-3" />
                      {c.attackBtn}
                    </button>
                    <button
                      onClick={() => setModal({ mode: "edit", account: acc })}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-muted"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(acc.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-muted"
                      style={{ color: "var(--cyber-red)" }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards — mobile */}
      <div className="sm:hidden space-y-3">
        {filtered.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
          >
            <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" style={{ color: "var(--cyber-blue)" }} />
            <p style={{ color: "var(--muted-foreground)" }}>{c.noResults}</p>
          </div>
        ) : filtered.map(acc => (
          <div
            key={acc.id}
            className="rounded-2xl p-4"
            style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <div
                  className="text-xs break-all"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: dark ? "#e2e8f0" : "#0f172a" }}
                >
                  {acc.email}
                </div>
                {acc.note && <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{acc.note}</div>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setModal({ mode: "edit", account: acc })} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted" style={{ color: "var(--muted-foreground)" }}>
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(acc.id)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted" style={{ color: "var(--cyber-red)" }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1 mb-3">
              <code className="text-xs flex-1" style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--muted-foreground)" }}>
                {revealedIds.has(acc.id) ? acc.password : "•".repeat(Math.min(acc.password.length, 12))}
              </code>
              <button onClick={() => toggleReveal(acc.id)} style={{ color: "var(--muted-foreground)" }}>
                {revealedIds.has(acc.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              <StrengthBadge strength={acc.strength} lang={lang} />
              <StatusBadge status={acc.status} lang={lang} />
            </div>
            <button
              onClick={() => onSelectForAttack(acc)}
              className="w-full py-2 rounded-xl text-sm flex items-center justify-center gap-1.5"
              style={{
                background: "linear-gradient(135deg, var(--cyber-red), var(--cyber-purple))",
                color: "#fff", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
              }}
            >
              <Zap className="w-3.5 h-3.5" />
              {c.attackBtn}
            </button>
          </div>
        ))}
      </div>

      {modal && (
        <AccountModal
          dark={dark}
          lang={lang}
          initial={modal.account}
          mode={modal.mode}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
