"use client";
import { useEffect, useState, FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  LockKeyhole,
  Download,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/client";
import { CONSENT, Snapshot, statusLabels } from "@/lib/domain";
import { BrandPair, ContractReader } from "@/components/Experience";
type View = {
  snapshot: Snapshot;
  hash: string;
  version: number;
  versionId: string;
  name: string;
  role: string;
  email: string;
  signatures: { id: string; name: string; email: string; signed_at: string }[];
  status: string;
  fileReady: boolean;
};
export default function Signing() {
  const [invite, setInvite] = useState("");
  const [view, setView] = useState<View | null>(null);
  const [requested, setRequested] = useState(false);
  const [code, setCode] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function refresh() {
    setView(await api("sign/session"));
  }
  useEffect(() => {
    const params = new URLSearchParams(location.hash.slice(1));
    const token = params.get("convite");
    if (token) {
      setInvite(token);
      history.replaceState(null, "", location.pathname);
      setLoading(false);
    } else
      refresh()
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
  const mine = view?.signatures.find((s) => s.email === view.email);
  useEffect(() => {
    if (!view || !mine || view.fileReady) return;
    const timer = setInterval(() => {
      refresh().catch(() => {});
    }, 15000);
    return () => clearInterval(timer);
  }, [view, mine]);
  function verify(e: FormEvent) {
    e.preventDefault();
    void action(async () => {
      await api("sign/verify", { token: invite, code });
      setCode("");
      setInvite("");
      await refresh();
    });
  }
  return (
    <main className="sign-layout">
      <div className="app-top">
        <a href="/" className="wordmark">
          <ArrowLeft size={16} /> Contratos <span>·</span> Jeremias Thomaz
        </a>
        <span className="secure-label">
          <LockKeyhole size={14} /> Ambiente de assinatura
        </span>
      </div>
      {loading ? (
        <p className="loading">Verificando seu acesso…</p>
      ) : !view ? (
        <section className="verification-panel">
          <LockKeyhole size={30} className="accent" />
          <h1>
            Um compromisso.
            <br />
            <em>A sua identidade.</em>
          </h1>
          {invite ? (
            <>
              <p>
                O código será enviado exclusivamente ao e-mail associado a este
                convite. Ele expira em 10 minutos e permite até cinco
                tentativas.
              </p>
              {!requested ? (
                <button
                  className="button primary"
                  disabled={busy}
                  onClick={() =>
                    action(async () => {
                      const r = await api("sign/challenge", { token: invite });
                      setRequested(true);
                      setMessage(r.message);
                    })
                  }
                >
                  {busy ? "Solicitando…" : "Receber código por e-mail"}
                  <ArrowRight size={17} />
                </button>
              ) : (
                <form onSubmit={verify}>
                  <label className="field">
                    Código de oito dígitos
                    <input
                      className="code-input"
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      pattern="[0-9]{8}"
                      minLength={8}
                      maxLength={8}
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, ""))
                      }
                      required
                    />
                  </label>
                  <button
                    className="button primary"
                    disabled={busy || code.length !== 8}
                  >
                    {busy ? "Verificando…" : "Confirmar identidade"}
                    <ArrowRight size={17} />
                  </button>
                  <button
                    type="button"
                    className="button outline"
                    disabled={busy}
                    onClick={() =>
                      action(async () =>
                        setMessage(
                          (await api("sign/challenge", { token: invite }))
                            .message,
                        ),
                      )
                    }
                  >
                    Solicitar outro código
                  </button>
                </form>
              )}
            </>
          ) : (
            <>
              <p>
                Abra o convite individual recebido por e-mail para revisar e
                assinar. Se o acesso expirou, solicite um novo convite ao
                administrador.
              </p>
              <a href="/" className="button outline">
                Conhecer a parceria <ArrowRight size={17} />
              </a>
            </>
          )}
        </section>
      ) : (
        <>
          <BrandPair
            logos={view.snapshot.logos}
            clientName={view.snapshot.clientName}
          />
          <div className="page-intro">
            <span className="eyebrow">
              {view.snapshot.code || "SCALUP-JT-001"} / VERSÃO {view.version}
            </span>
            <h1>
              {mine ? "Compromisso registrado." : "Revise. Confira."}
              <br />
              <em>{mine ? "O próximo capítulo." : "Vamos oficializar."}</em>
            </h1>
            <p>
              Identidade verificada: {view.name}
              <br />
              {view.email} · {view.role}
            </p>
            <p className="hash" style={{ marginTop: 16 }}>
              SHA-256 da versão: {view.hash}
            </p>
          </div>
          {mine && (
            <section className="signed-panel">
              <Check size={32} className="accent" />
              <h2>
                {view.status === "signed"
                  ? "Tudo oficializado. Nossa parceria começa aqui."
                  : "Assinatura concluída."}
              </h2>
              <p>
                Sua assinatura foi registrada com sucesso em{" "}
                {new Date(mine.signed_at).toLocaleString("pt-BR")}.
              </p>
              <p>
                {view.status === "signed"
                  ? "Ambas as partes assinaram esta versão."
                  : "Aguardando assinatura da outra parte."}
              </p>
              <p>Estado: {statusLabels[view.status]}</p>
              <BrandPair logos={view.snapshot.logos} />
              <div className="actions">
                {view.fileReady ? (
                  <a className="button primary" href="/api/document">
                    Baixar PDF assinado <Download size={16} />
                  </a>
                ) : (
                  <span className="muted small">
                    {view.status === "signed"
                      ? "O PDF está sendo preparado. Esta página verificará a disponibilidade."
                      : "O PDF final estará disponível após a segunda assinatura."}
                  </span>
                )}
                <a
                  className="button outline"
                  href="/api/document?format=evidence"
                  target="_blank"
                  rel="noreferrer"
                >
                  Ver comprovante de assinaturas
                </a>
                <button
                  className="button outline"
                  disabled={busy}
                  onClick={() => action(refresh)}
                >
                  Atualizar <RefreshCw size={14} />
                </button>
              </div>
            </section>
          )}
          <div className="actions">
            <a className="button outline" href="/api/document?draft=1">
              Baixar versão para revisão <Download size={15} />
            </a>
          </div>
          <ContractReader
            text={view.snapshot.text}
            version={`Versão ${view.version} · ${statusLabels[view.status]}`}
          />
          {!mine && (
            <section className="panel">
              <h2>Seu aceite, de forma expressa.</h2>
              <p>
                A verificação por e-mail confirma o acesso à caixa cadastrada.
                Este processo registra uma assinatura eletrônica, sem
                certificação digital ICP-Brasil. O nome, e-mail, consentimento,
                versão, horário UTC e dados técnicos disponíveis ficam
                vinculados ao registro.
              </p>
              <label className="consent">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  disabled={busy}
                />
                <span>{CONSENT}</span>
              </label>
              <button
                className="button primary"
                style={{ marginTop: 25 }}
                disabled={!consent || busy}
                onClick={() =>
                  action(async () => {
                    await api("sign/confirm", { consent, hash: view.hash });
                    await refresh();
                    setConsent(false);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  })
                }
              >
                {busy
                  ? "Registrando assinatura…"
                  : "Confirmar e assinar contrato"}
                <Check size={17} />
              </button>
            </section>
          )}
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
