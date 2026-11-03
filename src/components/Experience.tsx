"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  ArrowDown,
  ArrowRight,
  FileText,
  LockKeyhole,
  Check,
  Plus,
  Minus,
  Menu,
  X,
} from "lucide-react";
import Markdown from "react-markdown";
import { parties, defaultDetails } from "@/lib/domain";
import { SignatureSummary, useSignatureStatus } from "./SignatureProgress";
export type Logos = { scalup: string | null; jeremias: string | null };
export function Brand({
  name,
  src,
}: {
  name: "scalup" | "jeremias";
  src: string | null;
}) {
  return src ? (
    <img
      className={`brand-image brand-${name}`}
      src={src}
      alt={name === "scalup" ? "SCALUP" : "Jeremias Thomaz"}
    />
  ) : (
    <span className="brand-placeholder">
      <span>{name === "scalup" ? "SCALUP" : "JEREMIAS THOMAZ"}</span>
      <small>logo oficial pendente</small>
    </span>
  );
}
export function BrandPair({ logos }: { logos: Logos }) {
  return (
    <div className="brand-pair">
      <Brand name="scalup" src={logos.scalup} />
      <span className="brand-times" aria-hidden>
        ×
      </span>
      <Brand name="jeremias" src={logos.jeremias} />
    </div>
  );
}
const titles = [
  "Do objeto",
  "Dos serviços contratados",
  "Do valor e pagamento",
  "Dos prazos e entregas",
  "Das alterações e revisões",
  "Das responsabilidades",
  "Dos direitos de uso",
  "Da autonomia profissional",
  "Da confidencialidade",
  "Da vigência e rescisão",
  "Das disposições gerais",
];
export function ContractReader({
  text,
  version = "Prévia do contrato",
}: {
  text: string;
  version?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(1);
  const [size, setSize] = useState(17);
  const parts = text.split(/(?=^## CLÁUSULA )/m);
  const intro = parts.shift() || "";
  useEffect(() => {
    const update = () => {
      if (!root.current) return;
      const r = root.current.getBoundingClientRect();
      setProgress(
        Math.min(
          100,
          Math.max(
            0,
            Math.round(((window.innerHeight - r.top) / r.height) * 100),
          ),
        ),
      );
      const sections = root.current.querySelectorAll("[data-clause]");
      let current = 1;
      sections.forEach((el, i) => {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.4)
          current = i + 1;
      });
      setActive(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  return (
    <div className="reader-grid" ref={root}>
      <aside className="reader-aside">
        <span className="eyebrow">NOSSO ACORDO</span>
        <h3>
          Clareza em
          <br />
          cada detalhe.
        </h3>
        <p className="muted small">
          SCALUP-JT-001
          <br />
          {version}
        </p>
        <nav aria-label="Cláusulas do contrato">
          {titles.map((title, i) => (
            <a
              key={title}
              href={`#clausula-${i + 1}`}
              aria-current={active === i + 1 ? "location" : undefined}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              {title}
            </a>
          ))}
        </nav>
        <div className="reading-progress">
          <div>
            <span>Leitura do contrato</span>
            <span>{progress}%</span>
          </div>
          <progress
            max={100}
            value={progress}
            aria-label="Progresso de leitura"
          />
          <small>A leitura não implica aceite.</small>
        </div>
      </aside>
      <div className="contract-column">
        <div className="document-toolbar">
          <span>
            <FileText size={15} /> {version}
          </span>
          <div className="text-size">
            <button
              aria-label="Diminuir texto"
              onClick={() => setSize(Math.max(16, size - 1))}
              disabled={size === 16}
            >
              <Minus size={14} />
            </button>
            <span>Aa</span>
            <button
              aria-label="Aumentar texto"
              onClick={() => setSize(Math.min(22, size + 1))}
              disabled={size === 22}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
        <label className="mobile-clauses">
          Ir para a cláusula
          <select
            value={active}
            onChange={(e) =>
              document
                .getElementById(`clausula-${e.target.value}`)
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            {titles.map((t, i) => (
              <option value={i + 1} key={t}>
                {String(i + 1).padStart(2, "0")} — {t}
              </option>
            ))}
          </select>
        </label>
        <div className="legal-text" style={{ fontSize: size }}>
          <div className="contract-intro">
            <Markdown>{intro}</Markdown>
          </div>
          {parts.map((part, i) => (
            <section
              data-clause
              id={`clausula-${i + 1}`}
              key={i}
              className="clause"
            >
              <span className="clause-number">
                {String(i + 1).padStart(2, "0")}
              </span>
              <Markdown>{part}</Markdown>
            </section>
          ))}
        </div>
        <div className="document-end">
          <Check size={18} />
          <span>Fim do contrato. Revise todos os termos antes de assinar.</span>
        </div>
      </div>
    </div>
  );
}
export default function Experience({
  contract,
  logos,
}: {
  contract: string;
  logos: Logos;
}) {
  const signature = useSignatureStatus();
  const dialog = useRef<HTMLDialogElement>(null);
  const reduced = useReducedMotion();
  const [menu, setMenu] = useState(false);
  const [help, setHelp] = useState<string | null>(null);
  useEffect(() => {
    if (help) {
      dialog.current?.showModal();
    } else dialog.current?.close();
  }, [help]);
  const reveal = (delay: number) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: reduced ? 0 : 0.7,
      delay: reduced ? 0 : delay,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  });
  return (
    <>
      <a className="skip-link" href="#conteudo">
        Ir para o conteúdo
      </a>
      <header className="site-header">
        <a href="#inicio" className="wordmark" aria-label="Início">
          SCALUP <span>×</span> JT
          <span className="red-dot" />
        </a>
        <nav
          className={menu ? "top-nav open" : "top-nav"}
          aria-label="Navegação principal"
        >
          <a onClick={() => setMenu(false)} href="#parceria">
            A parceria
          </a>
          <a onClick={() => setMenu(false)} href="#contrato">
            O contrato
          </a>
          <a onClick={() => setMenu(false)} href="#assinaturas">
            Assinaturas <ArrowUpRight size={14} />
          </a>
        </nav>
        <span className="header-caption">
          CRIATIVIDADE ENCONTRA COMPROMISSO
        </span>
        <button
          className="menu-button"
          onClick={() => setMenu(!menu)}
          aria-label={menu ? "Fechar navegação" : "Abrir navegação"}
          aria-expanded={menu}
        >
          {menu ? <X /> : <Menu />}
        </button>
      </header>
      <main id="conteudo">
        <section id="inicio" className="hero">
          <div className="hero-light" aria-hidden />
          <div className="hero-orbit" aria-hidden />
          <div className="hero-inner">
            <motion.div {...reveal(0.05)}>
              <BrandPair logos={logos} />
            </motion.div>
            <motion.p className="eyebrow hero-eyebrow" {...reveal(0.15)}>
              <span className="red-dot" /> UMA NOVA PARCERIA CRIATIVA
            </motion.p>
            <h1>
              <motion.span {...reveal(0.22)}>Vamos</motion.span>
              <motion.em {...reveal(0.34)}>começar?</motion.em>
            </h1>
            <motion.div className="hero-copy" {...reveal(0.48)}>
              <p>
                Uma parceria criativa merece
                <br />
                um começo à altura.
              </p>
              <span>
                Preparamos este espaço para formalizar nossa colaboração de
                maneira simples, transparente e segura.
              </span>
            </motion.div>
            <motion.a
              href="#parceria"
              className="button primary hero-cta"
              {...reveal(0.58)}
            >
              Explorar contrato <ArrowUpRight size={19} />
            </motion.a>
          </div>
          <div className="hero-bottom">
            <span>
              DESIGN <i /> EDIÇÃO DE VÍDEOS <i /> PARCERIA
            </span>
            <a href="#parceria" aria-label="Conhecer a parceria">
              <span>UM NOVO CAPÍTULO</span>
              <ArrowDown size={18} />
            </a>
            <span>SCALUP × JEREMIAS THOMAZ</span>
          </div>
        </section>
        <section id="parceria" className="overview section-wrap">
          <div className="section-kicker">
            <span className="eyebrow">01 / A PARCERIA</span>
            <span className="muted small">
              Boas ideias começam com um bom acordo.
            </span>
          </div>
          <div className="overview-heading">
            <h2>
              Uma parceria.
              <br />
              <em>Grandes ideias.</em>
            </h2>
            <p>
              Antes de começarmos, confira os principais pontos do nosso acordo.
            </p>
          </div>
          <div className="terms-grid">
            {[
              [
                "CLIENTES ATENDIDOS",
                "02",
                "Clientes da Scalup contemplados na parceria.",
              ],
              [
                "PRODUÇÕES MENSAIS",
                "Até 08",
                "04 peças estáticas e até 04 vídeos, com seus respectivos desdobramentos.",
              ],
              [
                "INVESTIMENTO MENSAL",
                "R$ 400,00",
                "Valor fixo mensal referente ao atendimento dos dois clientes.",
              ],
              [
                "CONDIÇÃO DE PAGAMENTO",
                "5º dia útil",
                "Pagamento mensal referente aos serviços prestados no mês anterior.",
              ],
            ].map(([label, value, copy], i) => (
              <article className="term" key={label}>
                <div>
                  <span className="eyebrow">{label}</span>
                  <span className="term-mark">
                    {i === 0 ? "↗" : i === 1 ? "＋" : i === 2 ? "↗" : "↻"}
                  </span>
                </div>
                <strong>{value}</strong>
                <p>{copy}</p>
              </article>
            ))}
          </div>
          <div className="overview-foot">
            <div>
              <h3>Tudo certo até aqui?</h3>
              <p>Agora, conheça os termos que vão orientar nossa parceria.</p>
            </div>
            <a className="button outline" href="#contrato">
              Ler contrato completo <ArrowDown size={17} />
            </a>
          </div>
          <div className="partnership-strip">
            <BrandPair logos={logos} />
            <span>
              Do primeiro briefing à última entrega.
              <br />
              <strong>Juntos, com clareza.</strong>
            </span>
          </div>
        </section>
        <section id="contrato" className="contract-section section-wrap">
          <div className="section-kicker">
            <span className="eyebrow">02 / O CONTRATO</span>
            <span className="secure-label">
              <LockKeyhole size={13} /> Transparência em cada cláusula
            </span>
          </div>
          <div className="contract-heading">
            <h2>
              Alinhados
              <br />
              <em>desde o início.</em>
            </h2>
            <p>
              O espaço das boas ideias.
              <br />E dos compromissos bem definidos.
            </p>
          </div>
          <div className="draft-notice">
            <FileText size={18} />
            <p>
              <strong>Documento em preparação.</strong> Esta é a prévia
              integral. Os dados pendentes serão preenchidos antes da liberação.
              A versão para assinatura estará no seu convite individual.
            </p>
          </div>
          <BrandPair logos={logos} />
          <ContractReader text={contract} />
        </section>
        <section id="assinaturas" className="signature-section section-wrap">
          <div className="section-kicker">
            <span className="eyebrow">03 / O PRÓXIMO PASSO</span>
            <LockKeyhole size={17} />
          </div>
          <h2>
            Prontos para
            <br />
            <em>oficializar?</em>
          </h2>
          <p className="section-description">
            Revise os dados, confirme sua identidade e formalize
            <br className="desktop-break" /> esta parceria com segurança.
          </p>
          <SignatureSummary {...signature} />
          <div className="signer-grid">
            {parties.map((p, i) => (
              <article className="signer-card" key={p.role}>
                <div className="signer-top">
                  <span className="eyebrow">{p.role.toUpperCase()}</span>
                  <ArrowUpRight size={20} />
                </div>
                <Brand
                  name={i === 0 ? "scalup" : "jeremias"}
                  src={i === 0 ? logos.scalup : logos.jeremias}
                />
                <h3>{p.name}</h3>
                <p className="signer-description">
                  {i === 0
                    ? `${defaultDetails.companyName} · ${defaultDetails.representative}, titular.`
                    : "50.118.963 JEREMIAS VITOR DOS ANJOS THOMAZ"}
                </p>
                <p className="muted small">
                  CNPJ:{" "}
                  {i === 0 ? defaultDetails.companyCnpj : "50.118.963/0001-62"}
                </p>
                <span className="signer-email">{p.email}</span>
                <div
                  className={`signer-state ${signature.status?.[p.role] ? "is-signed" : ""}`}
                >
                  {signature.status?.[p.role] ? (
                    <>
                      <Check size={16} /> Assinatura registrada
                      {signature.unavailable
                        ? " · atualização indisponível"
                        : ""}
                    </>
                  ) : (
                    <>
                      <LockKeyhole size={14} />{" "}
                      {signature.unavailable
                        ? "Status temporariamente indisponível"
                        : !signature.status
                          ? "Consultando assinatura…"
                          : signature.status.status === "cancelled"
                            ? "Contrato cancelado"
                            : signature.status.released
                              ? "Aguardando assinatura"
                              : "Acesso por convite individual"}
                    </>
                  )}
                </div>
                <button
                  className={`button ${i === 0 ? "primary" : "outline"}`}
                  disabled={
                    Boolean(signature.status?.[p.role]) ||
                    signature.status?.status === "cancelled"
                  }
                  onClick={() => setHelp(p.role)}
                >
                  {signature.status?.[p.role] ? (
                    <>
                      Assinado <Check size={17} />
                    </>
                  ) : (
                    <>
                      Assinar como {p.role} <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </article>
            ))}
          </div>
          <p className="security-note">
            <LockKeyhole size={14} /> Cada assinatura exige verificação do
            e-mail cadastrado e concordância expressa.
          </p>
          <div className="closing-line">
            <span>O próximo capítulo</span>
            <em>é nosso.</em>
            <span className="closing-star" aria-hidden>
              ✳
            </span>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <a href="#inicio" className="wordmark">
          SCALUP <span>×</span> JT
        </a>
        <p>Design, confiança e uma parceria para criar.</p>
        <a href="/admin">
          Área administrativa <ArrowUpRight size={14} />
        </a>
      </footer>
      <dialog
        ref={dialog}
        aria-labelledby="invite-title"
        className="invite-dialog"
        onCancel={() => setHelp(null)}
        onClick={(e) => {
          if (e.target === dialog.current) setHelp(null);
        }}
      >
        <button
          autoFocus
          className="dialog-close"
          onClick={() => setHelp(null)}
          aria-label="Fechar"
        >
          <X />
        </button>
        <LockKeyhole className="accent" size={30} />
        <h3 id="invite-title">
          Seu convite.
          <br />
          Sua assinatura.
        </h3>
        <p>
          Para assinar como {help}, abra o convite individual enviado ao e-mail
          cadastrado após a liberação do contrato.
        </p>
        <p className="muted">
          O acesso exige um código de verificação. Se ainda não recebeu o
          convite, fale com o responsável pela preparação do contrato.
        </p>
        <button className="button primary" onClick={() => setHelp(null)}>
          Entendi <Check size={17} />
        </button>
      </dialog>
    </>
  );
}
