"use client";
import { useEffect, useState, FormEvent } from "react";
import {
  Plus,
  Search,
  ArrowUpRight,
  LogOut,
  ArrowLeft,
  RefreshCw,
  FileText,
} from "lucide-react";
import { api } from "@/lib/client";
import { statusLabels } from "@/lib/domain";
import type { ContractSettings } from "@/lib/contract-settings";
import { ContractIdentity } from "@/components/ContractIdentity";
import ContractEditor from "@/components/ContractEditor";
type Entry = {
  code: string;
  title: string;
  client_name: string;
  client_email: string;
  has_logo: boolean;
  status: string;
  signatures: number;
  created_at: string;
  current_version: string | null;
};
type Dashboard = { contracts: Entry[]; providerLogo: string | null };
const blank: ContractSettings = {
  title: "",
  clientName: "",
  clientEmail: "",
  clientLogo: null,
  source: null,
};
export default function Admin() {
  const [data, setData] = useState<Dashboard | null>(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<string | null>(null),
    [creating, setCreating] = useState(false),
    [newContract, setNewContract] = useState<ContractSettings>(blank);
  async function refresh() {
    setData(await api("admin/contracts"));
  }
  useEffect(() => {
    refresh()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  const authenticated = !!data;
  useEffect(() => {
    if (!authenticated || selected) return;
    let disposed = false,
      pending = false;
    async function update() {
      if (pending || document.visibilityState === "hidden") return;
      pending = true;
      try {
        const next = await api("admin/contracts");
        if (!disposed) setData(next);
      } catch {
        if (!disposed)
          setError(
            "Não foi possível atualizar a lista. Use Atualizar ou entre novamente.",
          );
      } finally {
        pending = false;
      }
    }
    const timer = window.setInterval(update, 15000);
    window.addEventListener("focus", update);
    return () => {
      disposed = true;
      clearInterval(timer);
      window.removeEventListener("focus", update);
    };
  }, [authenticated, selected]);
  async function action(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function login(e: FormEvent) {
    e.preventDefault();
    void action(async () => {
      await api("auth/login", { email, password });
      setPassword("");
      await refresh();
    });
  }
  function create(e: FormEvent) {
    e.preventDefault();
    void action(async () => {
      const result = await api("admin/contracts", newContract);
      setCreating(false);
      setNewContract(blank);
      setSelected(result.code);
    });
  }
  if (selected)
    return (
      <ContractEditor
        key={selected}
        code={selected}
        onBack={() => {
          setSelected(null);
          void refresh().catch(() => setData(null));
        }}
      />
    );
  const contracts = data?.contracts || [];
  const filtered = contracts.filter(
    (c) =>
      (filter === "all" ||
        (filter === "draft"
          ? ["draft", "missing", "ready"].includes(c.status)
          : filter === "pending"
            ? ["awaiting", "partial"].includes(c.status)
            : c.status === filter)) &&
      `${c.title} ${c.client_name} ${c.code} ${c.client_email}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <a href="/admin" className="dashboard-brand">
          <img src={data?.providerLogo || "/brand/jeremias.webp"} alt="J" />
          <span>
            Jeremias Thomaz<small>Gestão de contratos</small>
          </span>
        </a>
        {data && (
          <button
            className="dashboard-logout"
            disabled={busy}
            onClick={() =>
              void action(async () => {
                await api("auth/logout", {});
                setData(null);
                setCreating(false);
              })
            }
          >
            <LogOut size={16} /> Sair
          </button>
        )}
      </header>
      {loading ? (
        <p className="loading">Carregando contratos…</p>
      ) : !data ? (
        <section className="panel login-panel">
          <h1>
            Seus contratos,
            <br />
            em um só lugar.
          </h1>
          <p>Acesse para criar acordos e acompanhar cada assinatura.</p>
          <form onSubmit={login}>
            <label className="field">
              E-mail
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="field">
              Senha
              <input
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button className="button primary" disabled={busy}>
              {busy ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </section>
      ) : creating ? (
        <>
          <button
            className="dashboard-back"
            disabled={busy}
            onClick={() => setCreating(false)}
          >
            <ArrowLeft size={16} /> Voltar aos contratos
          </button>
          <div className="dashboard-intro">
            <div>
              <h1>Novo contrato</h1>
              <p>
                Comece pelo cliente. Na próxima etapa, ajuste os dados e os
                termos do acordo.
              </p>
            </div>
          </div>
          <form className="panel" onSubmit={create}>
            <ContractIdentity
              value={newContract}
              onChange={setNewContract}
              providerLogo={data.providerLogo}
              disabled={busy}
            />
            <div className="actions">
              <button className="button primary" disabled={busy}>
                {busy ? "Criando…" : "Criar rascunho"}
                <Plus size={18} />
              </button>
              <button
                type="button"
                className="button outline"
                disabled={busy}
                onClick={() => setCreating(false)}
              >
                Cancelar
              </button>
            </div>
            <p className="muted small">
              Criar um rascunho não envia convites. Você poderá revisar o
              contrato antes de liberá-lo.
            </p>
          </form>
        </>
      ) : (
        <>
          <div className="dashboard-intro">
            <div>
              <h1>Contratos</h1>
              <p>Do primeiro acordo à última assinatura.</p>
            </div>
            <button
              className="button primary"
              onClick={() => setCreating(true)}
            >
              <Plus size={18} /> Novo contrato
            </button>
          </div>
          <div className="dashboard-metrics" aria-label="Resumo dos contratos">
            <div>
              <span>Total de contratos</span>
              <strong>{contracts.length.toString().padStart(2, "0")}</strong>
            </div>
            <div>
              <span>Em preparação</span>
              <strong>
                {contracts
                  .filter((c) =>
                    ["draft", "missing", "ready"].includes(c.status),
                  )
                  .length.toString()
                  .padStart(2, "0")}
              </strong>
            </div>
            <div>
              <span>Aguardando assinaturas</span>
              <strong>
                {contracts
                  .filter((c) => ["awaiting", "partial"].includes(c.status))
                  .length.toString()
                  .padStart(2, "0")}
              </strong>
            </div>
            <div>
              <span>Concluídos</span>
              <strong>
                {contracts
                  .filter((c) => c.status === "signed")
                  .length.toString()
                  .padStart(2, "0")}
              </strong>
            </div>
          </div>
          <section className="contract-list">
            <div className="dashboard-toolbar">
              <label className="dashboard-search">
                <Search size={18} />
                <input
                  type="search"
                  aria-label="Buscar contratos"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por cliente, contrato ou e-mail"
                />
              </label>
              <label className="dashboard-filter">
                <span>Status</span>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">Todos</option>
                  <option value="draft">Em preparação</option>
                  <option value="pending">Aguardando assinaturas</option>
                  <option value="signed">Concluídos</option>
                  <option value="cancelled">Cancelados</option>
                </select>
              </label>
              <button
                className="dashboard-refresh"
                disabled={busy}
                onClick={() => void action(refresh)}
                aria-label="Atualizar contratos"
              >
                <RefreshCw size={18} />
              </button>
            </div>
            <div className="contract-list-heading" aria-hidden>
              <span>Cliente / contrato</span>
              <span>Situação</span>
              <span>Assinaturas</span>
              <span></span>
            </div>
            {!filtered.length ? (
              <div className="dashboard-empty">
                <FileText size={32} />
                <h2>
                  {contracts.length
                    ? "Nenhum contrato encontrado"
                    : "Seu próximo projeto começa aqui"}
                </h2>
                <p>
                  {contracts.length
                    ? "Tente outro nome ou ajuste o filtro."
                    : "Crie um contrato, adicione o logo do cliente e acompanhe as assinaturas."}
                </p>
              </div>
            ) : (
              filtered.map((c) => (
                <button
                  className="contract-row"
                  key={c.code}
                  onClick={() => {
                    setError("");
                    setSelected(c.code);
                  }}
                >
                  <span className="contract-row-identity">
                    <span className="contract-avatar">
                      {c.has_logo ? (
                        <img
                          loading="lazy"
                          src={`/api/admin/logo?agreement=${encodeURIComponent(c.code)}`}
                          alt=""
                        />
                      ) : (
                        <span>{c.client_name.slice(0, 2).toUpperCase()}</span>
                      )}
                    </span>
                    <span>
                      <strong>{c.client_name}</strong>
                      <span className="contract-row-title">{c.title}</span>
                      <small>{c.code}</small>
                    </span>
                  </span>
                  <span className={`contract-status status-${c.status}`}>
                    {statusLabels[c.status] || c.status}
                  </span>
                  <span className="contract-signatures">
                    <span>
                      <i className={c.signatures >= 1 ? "filled" : ""} />
                      <i className={c.signatures === 2 ? "filled" : ""} />
                    </span>
                    {c.current_version
                      ? `${c.signatures}/2 assinaturas`
                      : "Sem versão liberada"}
                  </span>
                  <ArrowUpRight size={20} />
                </button>
              ))
            )}
          </section>
          <p className="dashboard-footnote">
            Lista atualizada automaticamente. Seus documentos e os dados dos
            clientes ficam na área restrita.
          </p>
        </>
      )}
      {error && (
        <div className="notice" role="alert">
          {error}
        </div>
      )}
    </main>
  );
}
