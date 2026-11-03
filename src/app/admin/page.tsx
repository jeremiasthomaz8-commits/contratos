"use client";
import { useEffect, useState, FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  LockKeyhole,
  Check,
  RefreshCw,
  LogOut,
} from "lucide-react";
import Markdown from "react-markdown";
import { api } from "@/lib/client";
import {
  Details,
  defaultDetails,
  fields,
  parties,
  statusLabels,
} from "@/lib/domain";
import { BrandPair, Logos } from "@/components/Experience";
import SignatureProgress from "@/components/SignatureProgress";
type AdminData = {
  agreement: { draft: Details; status: string; current_version: string | null };
  versions: {
    id: string;
    number: number;
    created_at: string;
    document_hash: string;
    signatures: number;
  }[];
  signatures: {
    name: string;
    email: string;
    signed_at: string;
    version_id: string;
  }[];
  emails: {
    id: string;
    recipient: string;
    status: string;
    error: string | null;
    created_at: string;
  }[];
  jobs: { id: string; status: string; error: string | null }[];
  config: Record<string, boolean>;
  logos: Logos;
};
const configLabels: Record<string, string> = {
  database: "Banco de dados",
  auth: "Autenticação",
  storage: "Armazenamento",
  email: "E-mails",
  secrets: "Segredos de segurança",
  webhook: "Confirmação de entrega",
};
const mailLabels: Record<string, string> = {
  expired: "Código expirado",
  pending: "Na fila",
  retry: "Nova tentativa programada",
  sent: "Enviado ao provedor",
  delivered: "Entrega confirmada",
  failed: "Falha",
  review: "Requer revisão",
  bounced: "Devolvido",
  complained: "Marcado como indesejado",
  done: "Concluído",
};
export default function Admin() {
  const [data, setData] = useState<AdminData | null>(null);
  const [draft, setDraft] = useState<Details>(defaultDetails);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [preview, setPreview] = useState("");
  const [audit, setAudit] = useState<
    { id: string; event: string; actor: string; created_at: string }[] | null
  >(null);
  async function refresh(reset = false) {
    const d = await api("admin");
    setData(d);
    if (reset) setDraft({ ...defaultDetails, ...d.agreement.draft });
  }
  useEffect(() => {
    refresh(true)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  async function action(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    setMessage("");
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
      await refresh(true);
    });
  }
  async function save() {
    const r = await api("admin/draft", draft);
    setMessage(r.message);
    await refresh();
  }
  return (
    <main className="app-shell">
      <div className="app-top">
        <a href="/" className="wordmark">
          <ArrowLeft size={16} /> SCALUP <span>×</span> JT
        </a>
        {data ? (
          <button
            onClick={() =>
              action(async () => {
                await api("auth/logout", {});
                setData(null);
              })
            }
          >
            <LogOut size={15} /> Sair
          </button>
        ) : (
          <span className="secure-label">
            <LockKeyhole size={14} /> Acesso restrito
          </span>
        )}
      </div>
      {loading ? (
        <p className="loading">Verificando acesso…</p>
      ) : !data ? (
        <section className="panel login-panel">
          <LockKeyhole size={25} className="accent" />
          <div className="page-intro">
            <h1>
              Nos bastidores
              <br />
              <em>da parceria.</em>
            </h1>
            <p>
              Entre para preparar os dados, conferir os logos e acompanhar as
              assinaturas.
            </p>
          </div>
          <form onSubmit={login}>
            <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
              <label className="field">
                E-mail do administrador
                <input
                  autoComplete="username"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <label className="field">
                Senha
                <input
                  autoComplete="current-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </label>
            </div>
            <button
              className="button primary"
              style={{ width: "100%", marginTop: 25 }}
              disabled={busy}
            >
              {busy ? "Verificando…" : "Entrar com segurança"}
              <ArrowRight size={17} />
            </button>
          </form>
          <p style={{ marginTop: 20, marginBottom: 0 }}>
            O acesso depende de uma conta cadastrada no Supabase e autorizada
            para administrar este contrato.
          </p>
        </section>
      ) : (
        <>
          <div className="page-intro">
            <span className="eyebrow">ÁREA ADMINISTRATIVA / SCALUP-JT-001</span>
            <h1>
              Prepare o começo.
              <br />
              <em>Cuide dos detalhes.</em>
            </h1>
            <span className="status-chip">
              {statusLabels[data.agreement.status]}
            </span>
          </div>
          <section className="panel">
            <h2>Conexões e identidade visual</h2>
            <div className="config-list">
              {Object.entries(data.config).map(([key, ok]) => (
                <span key={key}>
                  {ok ? "✓" : "○"} {configLabels[key]} —{" "}
                  {ok ? "Configurado" : "Pendente"}
                </span>
              ))}
            </div>
            <div style={{ margin: "30px 0" }}>
              <BrandPair logos={data.logos} />
            </div>
            <p>
              Os logos oficiais são carregados de{" "}
              <code>public/brand/scalup.svg</code> e{" "}
              <code>public/brand/jeremias.svg</code> (ou PNG/WebP). Cada versão
              liberada preserva uma cópia dos arquivos.
            </p>
          </section>
          <form
            className="panel"
            onSubmit={(e) => {
              e.preventDefault();
              void action(save);
            }}
          >
            <h2>Dados do acordo</h2>
            <p>
              Salvar atualiza apenas o rascunho. Liberar cria uma nova versão
              imutável e exige novas assinaturas de ambas as partes.
            </p>
            <div className="form-grid">
              {fields.map(([key, label]) => (
                <label className="field" key={key}>
                  {label}
                  {["revisions", "adaptations"].includes(key) ? (
                    <textarea
                      value={draft[key]}
                      maxLength={1000}
                      onChange={(e) =>
                        setDraft({ ...draft, [key]: e.target.value })
                      }
                    />
                  ) : (
                    <input
                      type={key.endsWith("Date") ? "date" : "text"}
                      value={draft[key]}
                      maxLength={1000}
                      onChange={(e) =>
                        setDraft({ ...draft, [key]: e.target.value })
                      }
                    />
                  )}
                </label>
              ))}
            </div>
            <div className="actions">
              <button className="button primary" disabled={busy} type="submit">
                Salvar rascunho <Check size={16} />
              </button>
              <button
                className="button outline"
                type="button"
                disabled={busy}
                onClick={() =>
                  action(async () => {
                    await save();
                    setPreview((await api("admin/preview")).text);
                  })
                }
              >
                Conferir contrato completo
              </button>
            </div>
            {preview && (
              <div className="admin-preview">
                <div className="legal-text">
                  <Markdown>{preview}</Markdown>
                </div>
              </div>
            )}
          </form>
          <section className="panel">
            <h2>Liberação e convites</h2>
            <SignatureProgress />
            <p>
              Confira os dados e o foro com as partes. Os limites de revisões e
              desdobramentos serão incluídos como alinhamentos complementares,
              preservando as cláusulas originais.
            </p>
            <div className="actions">
              <button
                className="button primary"
                disabled={busy}
                onClick={() =>
                  action(async () => {
                    if (
                      !window.confirm(
                        "Liberar uma nova versão? Convites anteriores serão revogados e ambas as partes precisarão assinar novamente.",
                      )
                    )
                      return;
                    await save();
                    const r = await api("admin/release", {});
                    setMessage(r.message);
                    await refresh();
                  })
                }
              >
                Liberar nova versão <ArrowRight size={16} />
              </button>
              {parties.map((p) => (
                <button
                  className="button outline"
                  key={p.role}
                  disabled={busy || !data.agreement.current_version}
                  onClick={() =>
                    action(async () => {
                      const r = await api("admin/invite", { role: p.role });
                      setMessage(r.message);
                      await refresh();
                    })
                  }
                >
                  Enviar convite: {p.name}
                </button>
              ))}
            </div>
            <div className="actions">
              <button
                className="button outline"
                disabled={busy || data.agreement.status === "signed"}
                onClick={() =>
                  action(async () => {
                    if (
                      !window.confirm(
                        "Cancelar os convites ativos? O histórico será preservado.",
                      )
                    )
                      return;
                    const r = await api("admin/cancel", {});
                    setMessage(r.message);
                    await refresh();
                  })
                }
              >
                Cancelar convites ativos
              </button>
            </div>
          </section>
          <section className="panel">
            <h2>Versões e assinaturas</h2>
            {!data.versions.length ? (
              <p>Nenhuma versão liberada.</p>
            ) : (
              <ul className="data-list">
                {data.versions.map((v) => (
                  <li key={v.id}>
                    <div>
                      Versão {v.number} · {v.signatures}/2 assinaturas ·{" "}
                      {v.id === data.agreement.current_version
                        ? "Atual"
                        : "Substituída"}
                      <small>
                        {new Date(v.created_at).toLocaleString("pt-BR")}
                      </small>
                      <small className="hash">SHA-256: {v.document_hash}</small>
                    </div>
                    <div>
                      <a href={`/api/document?version=${v.id}&draft=1`}>
                        PDF para revisão
                      </a>
                      {v.signatures === 2 && (
                        <>
                          {" "}
                          ·{" "}
                          <a href={`/api/document?version=${v.id}`}>
                            PDF assinado
                          </a>
                        </>
                      )}{" "}
                      ·{" "}
                      <a
                        href={`/api/document?version=${v.id}&format=evidence`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Evidências
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <ul className="data-list">
              {data.signatures.map((s) => (
                <li key={s.version_id + s.email}>
                  <span>
                    ✓ {s.name}
                    <small>{s.email}</small>
                  </span>
                  <span>{new Date(s.signed_at).toLocaleString("pt-BR")}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="panel">
            <h2>Documentos e notificações</h2>
            <p>
              “Enviado ao provedor” não significa entregue. A entrega só é
              confirmada por evento autenticado do serviço de e-mail.
            </p>
            <ul className="data-list">
              {data.jobs.map((j) => (
                <li key={j.id}>
                  <span>
                    Geração do PDF · {mailLabels[j.status] || j.status}
                    <small>{j.error}</small>
                  </span>
                </li>
              ))}
              {data.emails.map((m) => (
                <li key={m.id}>
                  <span>
                    {m.recipient}
                    <small>
                      {m.error ||
                        new Date(m.created_at).toLocaleString("pt-BR")}
                    </small>
                  </span>
                  <span>{mailLabels[m.status] || m.status}</span>
                </li>
              ))}
            </ul>
            {!data.emails.length && <p>Nenhum e-mail solicitado.</p>}
            <div className="actions">
              <button
                className="button outline"
                disabled={busy}
                onClick={() =>
                  action(async () => {
                    setMessage((await api("admin/process", {})).message);
                    await refresh();
                  })
                }
              >
                Processar fila <RefreshCw size={15} />
              </button>
              <button
                className="button outline"
                disabled={busy}
                onClick={() =>
                  action(async () => {
                    await refresh();
                    setMessage("Estados atualizados.");
                  })
                }
              >
                Atualizar estados
              </button>
              <button
                className="button outline"
                disabled={busy}
                onClick={() =>
                  action(async () => setAudit(await api("admin/audit")))
                }
              >
                Consultar auditoria
              </button>
            </div>
            {audit && (
              <ul className="data-list">
                {audit.map((a) => (
                  <li key={a.id}>
                    <span>
                      {a.event.replaceAll("_", " ")}
                      <small>{a.actor}</small>
                    </span>
                    <span>
                      {new Date(a.created_at).toLocaleString("pt-BR")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
      {error && (
        <div className="notice" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="notice" role="status">
          {message}
        </div>
      )}
    </main>
  );
}
