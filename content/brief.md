# MASTER DEVELOPMENT PROMPT
## PREMIUM INTERACTIVE CONTRACT & ELECTRONIC SIGNATURE PLATFORM
### SCALUP × JEREMIAS THOMAZ

---

# 1. PROJECT VISION

Build a fully functional, premium, visually sophisticated, and responsive web application for presenting, reviewing, and electronically signing a professional design and video editing services agreement.

The agreement is between:

**CONTRATANTE:** SCALUP

**CONTRATADO:** 50.118.963 JEREMIAS VITOR DOS ANJOS THOMAZ

This project must combine three essential qualities:

1. The visual sophistication of a premium creative agency website.
2. The clarity, professionalism, and readability of a legal agreement.
3. The reliability, security, and functionality of an electronic signature platform.

The final result should feel like a carefully art-directed digital experience, not a generic legal document website.

The first thing visitors see should be a striking, animated welcome screen featuring the headline:

**"Vamos começar?"**

From there, users should move through a beautifully designed journey that introduces the partnership, explains the agreement, presents the complete contract, and allows each authorized party to electronically sign.

Once both signatures are completed, the system must automatically generate the finalized agreement, preserve the signature evidence, and send confirmation emails to both parties.

This must be a **real working application**, not a visual prototype.

**Language requirement:** All visible interface content, legal clauses, system messages, notifications, and emails must be written in Brazilian Portuguese (pt-BR).

The development instructions are written in English for technical clarity.

---

# 2. PRIMARY VISUAL REFERENCE

## Reference website

https://veltrix.framer.ai/

This website is the primary design and motion reference.

Before implementing the interface, carefully analyze its:

- Art direction and visual identity.
- Typography and font pairing.
- Headline proportions.
- Editorial layout.
- Spacing and composition.
- Hero section design.
- Background gradients.
- Light and blur effects.
- Scroll-based animations.
- Section transitions.
- Hover interactions.
- Button styling.
- Motion timing and easing.
- Navigation design.
- Micro-interactions.
- Visual hierarchy.
- Responsive behavior.

Reinterpret these characteristics for a premium electronic contract experience.

Do not replicate the source website's exact design, logos, illustrations, copyrighted assets, or page composition.

Create an original visual experience with a comparable level of sophistication and attention to detail.

## Desired aesthetic

The design should feel:

- Premium.
- Modern.
- Editorial.
- Creative.
- Minimal.
- High contrast.
- Cinematic.
- Professional.
- Confident.
- Visually memorable.

Imagine a sophisticated creative studio presenting an exclusive partnership through a beautifully designed interactive website.

Avoid traditional document-management interfaces, generic business dashboards, excessive icons, and standard form-heavy layouts.

The application should look custom-built for this specific partnership.

---

# 3. MANDATORY BRAND COLOR SYSTEM

The entire project must follow this exact official palette.

### COLOR 01 — BLACK

`#000000`

Primary use:

- Main background.
- Hero section.
- Navigation.
- Dark cards.
- Premium content sections.
- Signature interface.
- Footer.
- Visual depth.

### COLOR 02 — RED

`#FE0000`

Primary use:

- Main CTA buttons.
- Interactive elements.
- Typography highlights.
- Animated light effects.
- Gradients.
- Hover effects.
- Progress indicators.
- Selected states.
- Important visual accents.

### COLOR 03 — WHITE

`#FFFFFF`

Primary use:

- Primary typography.
- Important information.
- Contract text.
- Minimal decorative elements.
- High-contrast surfaces.
- Selected buttons and icons.

## Strict color rules

These three colors are mandatory.

Do not introduce the original orange accents from the Veltrix reference.

All previously suggested colors must be overridden.

Avoid unrelated accent colors such as blue, purple, orange, green, or gold.

Use transparency, opacity, overlays, and tonal variations derived from black, red, and white when necessary for hierarchy.

Semantic statuses must remain understandable through clear text and icons rather than relying on color alone.

### CSS design tokens

Implement reusable theme variables:

```css
:root {
  --background: #000000;
  --foreground: #FFFFFF;
  --accent: #FE0000;

  --surface: rgba(255, 255, 255, 0.035);
  --surface-hover: rgba(255, 255, 255, 0.065);

  --border: rgba(255, 255, 255, 0.12);
  --border-strong: rgba(255, 255, 255, 0.24);

  --text-muted: rgba(255, 255, 255, 0.58);

  --red-glow: rgba(254, 0, 0, 0.24);
  --red-glow-soft: rgba(254, 0, 0, 0.10);
}
```

The result should have a predominantly black visual foundation, strong white typography, and strategic red accents.

Do not overuse the red color.

Red should guide attention and create a distinctive visual identity without overwhelming the legal document.

---

# 4. OFFICIAL LOGOS — IMPORTANT

I will upload **two official logo files** along with this prompt.

### Logo 01

**SCALUP**

This logo represents the contracting company (CONTRATANTE).

### Logo 02

**JEREMIAS THOMAZ**

This logo represents the service provider (CONTRATADO).

## Logo integration requirements

Use the actual attached logo assets throughout the application.

The logos must appear in:

1. The welcome hero section.
2. The partnership overview.
3. The contract identification/header.
4. The relevant signature cards.
5. The signature confirmation screen.
6. The completed contract PDF.

### Hero composition

Create an elegant horizontal arrangement:

**[SCALUP LOGO] × [JEREMIAS THOMAZ LOGO]**

The multiplication symbol should represent the partnership between the two brands.

Position this composition above the main welcome headline.

Apply a subtle staggered entrance animation.

### Logo preservation rules

- Never recreate the official logos using AI.
- Never modify their symbols.
- Never change their original typography.
- Preserve original proportions.
- Preserve brand recognition.
- Avoid distortion, stretching, or cropping.
- Maintain clear spacing around each logo.
- Use transparent assets when available.
- Support SVG and high-resolution PNG.
- Use the uploaded logo variations best suited to the background.
- Do not recolor official logos unless an authorized monochrome version is supplied.
- Balance their optical sizes even if the assets have different dimensions.

If an uploaded logo does not contrast properly with a dark background, use a suitable white or black container rather than modifying the logo itself.

If the logos are not yet uploaded, create the necessary asset placeholders in the project structure but do not invent replacement brands or graphics.

The implementation should automatically use the official uploaded assets once provided.

The visual identity of the interface must not compete with either brand.

---

# 5. TYPOGRAPHY AND EDITORIAL DIRECTION

Typography is one of the most important aspects of this project.

Use the reference website as inspiration for oversized, expressive, and editorial typography.

## Recommended font combination

**Display typography:**

- Inter Tight.
- Geist.
- Or an equivalent contemporary grotesk.

**Editorial accents:**

- Instrument Serif Italic.
- Or an equivalent expressive italic serif.

**Body typography:**

- Inter.
- Geist.

**Legal contract typography:**

Use a highly readable sans-serif font with comfortable line height and excellent rendering on mobile devices.

## Typographic hierarchy

Hero headings should be extremely prominent.

Recommended desktop heading range:

72px–144px, depending on viewport width.

Use responsive sizing through `clamp()`.

Supporting descriptions should be considerably smaller.

Use expressive contrast between:

- Oversized bold headlines.
- Delicate italic accents.
- Small uppercase labels.
- Regular paragraph typography.
- Minimal numerical indicators.

Use generous whitespace.

Maintain proper text flow and avoid arbitrary word wrapping.

Important: typographic experimentation must never compromise the readability of contractual clauses.

---

# 6. OVERALL EXPERIENCE ARCHITECTURE

Organize the application into six main stages.

### Stage 01 — Welcome

A cinematic introduction to the partnership.

### Stage 02 — Partnership overview

A visual summary of the agreement's commercial terms.

### Stage 03 — Contract reading

The full legally relevant document, professionally formatted and navigable.

### Stage 04 — Electronic signatures

Independent and secure signing flows for both parties.

### Stage 05 — Signature confirmation

Immediate feedback after an authorized signature.

### Stage 06 — Completed partnership

Final confirmation, access to the signed PDF, and verification evidence.

The user journey should feel cohesive.

Use premium transitions between stages.

Do not force users to wait through long animations.

The application must support direct secure links that open the relevant signing experience.

---

# 7. STAGE 01 — PREMIUM WELCOME EXPERIENCE

## Hero concept

Build a visually striking full-viewport introductory section.

The background should be predominantly pure black with carefully controlled animated red ambient lighting.

Create a refined cinematic atmosphere.

## Hero content

At the top of the content:

**[SCALUP LOGO] × [JEREMIAS THOMAZ LOGO]**

Small editorial label:

"UMA NOVA PARCERIA CRIATIVA"

Main headline:

**Vamos começar?**

Create a large two-line composition when appropriate:

**Vamos**

*começar?*

Use bold sans-serif typography for the first line and an elegant italic or editorial treatment for the second.

The red accent may appear as a gradient highlight, underline, or restrained lighting effect.

Do not sacrifice legibility.

### Supporting description

"Uma parceria criativa merece um começo à altura."

Additional copy:

"Preparamos este espaço para formalizar nossa colaboração de maneira simples, transparente e segura."

### Primary CTA

**Explorar contrato**

Use:

- Red background (#FE0000).
- White typography (#FFFFFF).
- Refined rounded geometry.
- Animated directional arrow.
- Sophisticated hover transition.
- Subtle magnetic interaction on desktop if performance allows.

### Secondary label

"DESIGN • EDIÇÃO DE VÍDEOS • PARCERIA"

### Background effects

Create:

- Soft animated red radial gradients.
- Large blurred glow effects.
- Subtle ambient light movement.
- Very fine monochromatic noise texture.
- Minimal cursor-responsive movement.
- Carefully controlled vignette.
- Subtle depth between text and background.

The lighting should feel sophisticated and restrained.

Avoid exaggerated neon styling.

### Entrance sequence

On initial load:

1. Background lighting fades in.
2. The two logos reveal smoothly.
3. The editorial label appears.
4. The main headline reveals line by line.
5. Supporting copy enters.
6. The CTA becomes visible.

Use natural easing.

Suggested motion durations:

- Basic interface transitions: 200–350ms.
- Text reveal: 500–800ms.
- Hero entrance: approximately 900–1400ms total.
- Slow ambient movement: several seconds per loop.

Honor `prefers-reduced-motion`.

---

# 8. STAGE 02 — PARTNERSHIP OVERVIEW

After clicking "Explorar contrato", smoothly introduce the commercial agreement.

## Heading

**Uma parceria.**

*Grandes ideias.*

Supporting description:

"Antes de começarmos, confira os principais pontos do nosso acordo."

## Information cards

Design four premium summary cards.

### CARD 01

Small label:

"CLIENTES ATENDIDOS"

Main number:

**02**

Description:

"Clientes da Scalup contemplados na parceria."

### CARD 02

Small label:

"PRODUÇÕES MENSAIS"

Main number:

**Até 08**

Description:

"04 peças estáticas e até 04 vídeos, com seus respectivos desdobramentos."

### CARD 03

Small label:

"INVESTIMENTO MENSAL"

Main value:

**R$ 400,00**

Description:

"Valor fixo mensal referente ao atendimento dos dois clientes."

### CARD 04

Small label:

"CONDIÇÃO DE PAGAMENTO"

Main value:

**5º dia útil**

Description:

"Pagamento mensal referente aos serviços prestados no mês anterior."

## Card design

Use:

- Black background.
- Subtle white borders.
- Large bold white numbers.
- Small red details.
- Controlled red lighting on hover.
- Smooth reveal animations.
- Minimal visual decoration.

Cards should not look like a conventional analytics dashboard.

They should feel like editorial design elements.

## Transition to contract

Below the cards, display:

**Tudo certo até aqui?**

Description:

"Agora, conheça os termos que vão orientar nossa parceria."

CTA:

**Ler contrato completo**

---

# 9. STAGE 03 — COMPLETE CONTRACT READING EXPERIENCE

This is the most important content section.

The complete agreement must be displayed, not summarized.

Do not remove or alter legal clauses.

The original contract text is provided in Section 20 of this prompt.

## Desktop layout

Create a two-column structure.

### Left column — Sticky navigation

Include:

- Agreement name.
- Partnership identification.
- Agreement ID.
- Current signature status.
- Clause navigation.
- Reading progress.

Clause navigation:

01 — Do objeto

02 — Dos serviços contratados

03 — Do valor e pagamento

04 — Dos prazos e entregas

05 — Das alterações e revisões

06 — Das responsabilidades

07 — Dos direitos de uso

08 — Da autonomia profissional

09 — Da confidencialidade

10 — Da vigência e rescisão

11 — Das disposições gerais

The current section should be highlighted with an elegant red accent.

Clicking a section should smoothly navigate to it.

### Right column — Contract content

Create a premium, readable contract area.

Use:

- Pure black or a very subtle dark surface.
- Large white section titles.
- Comfortable legal body typography.
- Thin white separators.
- Small red numerical details.
- Generous vertical spacing.
- Precise paragraph alignment.

Each clause should be clearly separated.

Preserve all original clause numbering.

### Important commercial values

Strategically highlight:

- R$ 400,00 per month.
- Two clients.
- Four static pieces.
- Up to four edited videos.
- Associated paid-media adaptations.
- Payment by the fifth business day.
- Thirty-day termination notice.
- Indefinite duration.

Use typographic hierarchy rather than excessive decorative styling.

## Reading progress

Implement a real progress indicator based on the document's scroll position.

Example:

"Leitura do contrato — 65%"

The progress bar should use the official red accent.

Reading progress must not be treated as automatic acceptance or legally sufficient proof of understanding.

## Mobile version

Replace the desktop sidebar with a compact accessible clause navigator.

Maintain readability and comfortable margins.

The entire legal document must remain available without horizontal scrolling.

---

# 10. AGREEMENT PREPARATION AND REQUIRED FIELDS

Some of the legal information is not yet available.

Create an administrator-controlled agreement preparation step.

The missing fields must be completed before the document can be released for signature.

## Required contracting company information

SCALUP:

- Full registered legal business name.
- CNPJ.
- Complete registered address.
- Authorized legal representative.
- Representative's role or authority.

## Required contractor information

Business name:

50.118.963 JEREMIAS VITOR DOS ANJOS THOMAZ

CNPJ:

50.118.963/0001-62

Municipality:

Jundiaí

State:

São Paulo

Legal representative:

Jeremias Vitor dos Anjos Thomaz

Still required:

- Complete registered business address.

## Agreement details

Require:

- Effective start date.
- Execution place and date.
- Contractual venue/jurisdiction, subject to legal review.

## Pending scope details

Flag the following for confirmation:

- Included revision limits.
- Number and formats of included adaptations.

Do not invent missing information.

Do not silently replace incomplete fields with fictional values.

The application may display draft placeholders, but it must block final signing until all required contractual information is complete.

## Agreement versioning

Store an immutable agreement snapshot when the agreement is released for signature.

Bind all signature events to the exact version being signed.

If the text or legal data changes after the first signature, create a new version and require both parties to sign that new version.

Never modify an already signed version.

---

# 11. STAGE 04 — ELECTRONIC SIGNATURE INTERFACE

Create a sophisticated, secure signature section.

## Main heading

**Prontos para oficializar?**

Supporting text:

"Revise os dados, confirme sua identidade e formalize esta parceria com segurança."

Display two distinct signature cards.

## CARD 01 — CONTRATANTE

Display the official SCALUP logo.

Label:

**CONTRATANTE**

Name:

SCALUP

Authorized signer:

The legal representative entered during agreement preparation.

Confirmation email:

**contato@scalupagencia.com**

Initial status:

"Aguardando assinatura"

Primary CTA:

**Assinar como contratante**

## CARD 02 — CONTRATADO

Display the official Jeremias Thomaz logo.

Label:

**CONTRATADO**

Legal business name:

50.118.963 JEREMIAS VITOR DOS ANJOS THOMAZ

CNPJ:

50.118.963/0001-62

Authorized signer:

Jeremias Vitor dos Anjos Thomaz

Confirmation email:

**jeremiasthomaz8@gmail.com**

Initial status:

"Aguardando assinatura"

Primary CTA:

**Assinar como contratado**

## Signature card design

Use:

- Black premium surfaces.
- Fine white borders.
- Official logos.
- Clear information hierarchy.
- Red interactive details.
- Smooth hover animations.
- Elegant signing status indicators.

## Signature states

Each party must have an independent state:

- Aguardando assinatura.
- Verificação pendente.
- Assinado.
- Erro na assinatura.

After a valid signature, the corresponding card should display:

- Signer's verified name.
- Signature completion timestamp.
- Clear signed status.
- A disabled or replaced signature button.

Do not allow a visitor to choose an arbitrary party and sign without verifying the corresponding identity.

---

# 12. ELECTRONIC SIGNATURE FUNCTIONALITY

**CRITICAL: This workflow must be operational, secure, auditable, and supported by a real backend.**

A button that merely changes a status in the interface does not satisfy the requirements.

## Signature flow

### STEP 1 — Identify the signer

Each party should receive an individual secure signing invitation.

Bind each invitation to:

- Agreement ID.
- Agreement version.
- Authorized signer.
- Signer role.
- Registered email.

Use cryptographically secure, expiring, single-use tokens.

### STEP 2 — Verify identity

Use a trusted electronic signature provider or an email-based verification process.

For an email verification flow:

1. Send a one-time code to the signer's registered email.
2. Require the signer to enter the code.
3. Validate the code on the server.
4. Enforce expiration and attempt limits.
5. Prevent code replay.
6. Continue only after successful verification.

Do not consider a manually entered email address sufficient identity verification.

### STEP 3 — Review the final document

Display the complete agreement being signed.

The signer must be able to:

- Review the contract.
- See the parties and agreed values.
- Check the agreement version.
- Download the unsigned agreement if desired.

### STEP 4 — Express explicit consent

Show a checkbox, initially unchecked:

"Declaro que li, compreendi e concordo com os termos deste contrato e autorizo a utilização da assinatura eletrônica para sua formalização."

Require the user to actively select it.

### STEP 5 — Confirm signature

Display:

**Confirmar e assinar contrato**

The button must remain disabled until all required identity and consent conditions are met.

### STEP 6 — Register signature

When the signer confirms:

- Validate the entire request server-side.
- Confirm the authenticated signer.
- Confirm that the agreement version is valid.
- Confirm that the signer has not already signed.
- Record the verified identity.
- Record the email.
- Record the exact consent event.
- Record the signature timestamp.
- Record the verification method.
- Record the document hash.
- Record available technical audit evidence.
- Save the signature transaction securely.

The process must be idempotent and resistant to duplicate requests.

### Optional signature appearance

Allow the signer to:

- Type their full name.
- Draw a signature on a signature canvas.

This visual representation is optional and must not replace authentication, explicit consent, or the technical evidence of signing.

## Legal and technical distinction

Use the term "assinatura eletrônica" unless a genuine qualified digital-signature process is implemented.

Do not claim that an ordinary click or typed signature is an ICP-Brasil-certified digital signature.

For production deployment, prioritize integration with a reputable electronic signature service supporting Brazilian legal agreements.

Potential providers include:

- Clicksign.
- Autentique.
- ZapSign.

Choose based on current API support, legal evidence, authentication options, PDF handling, and integration requirements.

If a provider is selected, integrate its real signing workflow and verification evidence.

Never simulate a completed signature.

---

# 13. DATABASE AND AUDIT TRAIL

Use a real database.

Recommended architecture:

**Supabase PostgreSQL**

Create secure entities for:

- Agreements.
- Agreement versions.
- Parties.
- Authorized signers.
- Signing invitations.
- Identity verification challenges.
- Electronic signature records.
- Audit events.
- Generated PDF files.
- Email notification events.

## Required audit evidence

Store, where supported and legally appropriate:

- Unique agreement identification.
- Agreement version.
- SHA-256 document hash.
- Signer's verified name.
- Registered email.
- Authentication method.
- Consent event.
- Signature date.
- Signature time.
- UTC timestamp.
- IP address.
- User-agent details.
- Event identifiers.
- Signature status.

Preserve records against unauthorized alteration.

Use access controls and secure storage.

Apply LGPD data minimization and appropriate retention policies.

Never expose sensitive audit details publicly.

---

# 14. AUTOMATIC SIGNATURE CONFIRMATION EMAILS

After a successful signature, automatically notify the corresponding party.

Use a reliable transactional email provider.

Recommended:

**Resend**

The email service must be implemented server-side.

Do not expose private API keys in frontend code.

## EMAIL 01 — SCALUP

Recipient:

**contato@scalupagencia.com**

Trigger:

The authorized SCALUP representative successfully completes their electronic signature.

Subject:

**Assinatura registrada — Contrato Scalup × Jeremias**

Email message:

"Olá!

A assinatura eletrônica da SCALUP foi registrada com sucesso.

Contrato: Prestação de Serviços de Design e Edição de Vídeos.

Status: Assinatura do contratante concluída.

Assim que ambas as partes finalizarem a assinatura, o contrato completo estará disponível para consulta e download.

Atenciosamente,  
Sistema de Contratos"

## EMAIL 02 — JEREMIAS THOMAZ

Recipient:

**jeremiasthomaz8@gmail.com**

Trigger:

Jeremias Vitor dos Anjos Thomaz successfully completes his electronic signature.

Subject:

**Assinatura registrada — Contrato Scalup × Jeremias**

Email message:

"Olá, Jeremias!

Sua assinatura eletrônica foi registrada com sucesso.

Contrato: Prestação de Serviços de Design e Edição de Vídeos.

Status: Assinatura do contratado concluída.

Assim que ambas as partes finalizarem a assinatura, o contrato completo estará disponível para consulta e download.

Atenciosamente,  
Sistema de Contratos"

## FINAL CONFIRMATION — BOTH PARTIES

When both signatures are successfully recorded:

1. Mark the agreement as fully signed.
2. Generate or retrieve the completed signed document.
3. Preserve the verification and signature evidence.
4. Make the final PDF securely available.
5. Send the completed-agreement notification to both parties.

Recipients:

**contato@scalupagencia.com**

**jeremiasthomaz8@gmail.com**

Subject:

**Contrato finalizado — Scalup × Jeremias Thomaz**

Email message:

"Olá!

Nosso contrato de prestação de serviços de design e edição de vídeos foi oficialmente assinado por ambas as partes.

As assinaturas eletrônicas foram registradas com sucesso.

O contrato finalizado está disponível para consulta e download por meio do link seguro abaixo.

[ACESSAR CONTRATO ASSINADO]

Agradecemos pela parceria!

Atenciosamente,  
Sistema de Contratos"

The access link must be generated dynamically and securely.

Never use a fake document URL.

## Email reliability

Implement:

- Verified sending domain.
- SPF, DKIM, and DMARC configuration guidance.
- Delivery event logging.
- Failed-delivery detection.
- Safe retry logic.
- Duplicate-email prevention.
- Clear notification status.

Do not claim that an email was delivered unless supported by provider delivery evidence.

---

# 15. STAGE 05 — SIGNATURE CONFIRMATION

After a valid electronic signature, show a premium confirmation screen.

## Visual design

Create a sophisticated full-screen confirmation section.

Use:

- Black background.
- Large white typography.
- Subtle red ambient lighting.
- Refined checkmark or signature icon.
- Controlled entrance animation.
- Minimal visual elements.

## Headline

**Assinatura concluída.**

Supporting description:

"Sua assinatura foi registrada com sucesso."

Display:

- Signer's name.
- Agreement ID.
- Signature date.
- Signature time.
- Current agreement status.

If only one party has signed:

**Aguardando assinatura da outra parte.**

If both parties have signed:

**Tudo oficializado. Nossa parceria começa aqui.**

Show both official logos in an elegant partnership composition.

## Buttons

Where applicable:

- Visualizar contrato.
- Baixar PDF assinado.
- Ver comprovante de assinaturas.

Only enable options corresponding to files and functions that genuinely exist.

---

# 16. STAGE 06 — FINAL SIGNED CONTRACT

When both authorized signers complete the agreement, generate the finalized contract document.

## PDF requirements

Generate a professionally formatted A4 PDF.

Include:

- Both official logos.
- Contract title.
- Full identification of both parties.
- Every contractual clause.
- All original numbered subclauses.
- All completed agreement information.
- Contract identification number.
- Signature information.
- Signature completion timestamps.
- Appropriate verification information.

The PDF must preserve the legal document's readability.

Use a clean professional layout.

Avoid applying large website-style motion graphics or excessive decorative effects to the PDF.

## PDF document styling

Recommended:

- White pages.
- Black legal text.
- Very restrained red details.
- Official logos.
- Professional margins.
- Clear clause headings.
- Legible body text.
- Proper page numbering.

## Signature evidence

Provide a separate audit report or verification appendix documenting the signature process.

If the chosen e-signature provider generates its own authoritative signed PDF and certificate, preserve those documents without altering their verification properties.

Do not regenerate a provider-signed PDF in a way that invalidates its cryptographic integrity.

## Final document protection

After both signatures:

- Lock the final agreement.
- Preserve the exact signed version.
- Prevent unauthorized edits.
- Store it in private storage.
- Allow access through secure authenticated links.
- Maintain a verifiable audit history.

---

# 17. PRIVATE ADMINISTRATIVE INTERFACE

Create a minimal administrative interface for managing this agreement.

It must be private and protected by authentication.

The administrator should be able to:

- Review agreement information.
- Complete required fields.
- View the full agreement preview.
- Verify the uploaded logos.
- Check required details.
- Release the contract for signature.
- Generate secure invitation links.
- Send invitations to authorized signers.
- View signature statuses.
- Check email delivery statuses.
- Download the completed signed PDF.
- Review audit evidence.

## Agreement statuses

Support:

- Rascunho.
- Aguardando informações.
- Pronto para assinatura.
- Aguardando assinaturas.
- Parcialmente assinado.
- Totalmente assinado.
- Cancelado.
- Substituído por nova versão.

The administrative interface should use the same design system but prioritize clarity and efficient management.

The public-facing contract must remain elegant and distraction-free.

---

# 18. TECHNICAL STACK AND IMPLEMENTATION

Use a modern, reliable technical stack.

## Frontend

- Next.js.
- React.
- TypeScript.
- Tailwind CSS.
- Motion for React / Framer Motion.
- Lucide icons.

## Backend

- Secure Next.js server routes or server functions.
- Supabase PostgreSQL.
- Supabase Auth for administrator access.
- Private Supabase Storage.
- Row Level Security.

## Emails

- Resend or equivalent transactional email provider.

## Electronic signatures

- Real integration with a trusted electronic signature provider, preferably.
- Or a rigorously implemented electronic acceptance system with identity verification, consent records, immutable document versions, and auditable evidence.

## PDF

- Reliable server-side PDF generation.
- Or the authoritative PDF returned by the electronic signature provider.

## Performance

The experience must:

- Load efficiently.
- Animate smoothly.
- Avoid excessive client-side dependencies.
- Optimize uploaded logos.
- Use accessible semantic elements.
- Work on modern browsers.
- Respect reduced-motion preferences.

## Security

Implement:

- HTTPS.
- Server-side identity verification.
- Secure single-use signing tokens.
- Rate limiting.
- Input validation.
- Restricted document access.
- Protection against token replay.
- Appropriate audit logging.
- Least-privilege permissions.
- Safe environment variable handling.
- No sensitive credentials in frontend code.

Never represent unconfigured external services as operational.

---

# 19. RESPONSIVE DESIGN AND MICRO-INTERACTIONS

The experience must be fully responsive.

Supported devices:

- Desktop.
- Laptop.
- Tablet.
- Mobile.

Mobile signing is particularly important.

## Mobile requirements

- Responsive oversized typography.
- Compact contract navigation.
- Comfortable reading widths.
- Accessible buttons.
- Touch-friendly interactions.
- Secure email verification.
- Functional signature drawing where supported.
- Readable status messages.
- No horizontal overflow.

## Motion requirements

### Hero

- Staggered logo reveal.
- Editorial headline animation.
- Red gradient movement.
- Smooth CTA entrance.

### Navigation

- Smooth section transitions.
- Subtle hover effects.
- Active-state animation.

### Information cards

- Gentle hover lift.
- Refined border transitions.
- Controlled red ambient glow.

### Legal document

- Restrained entrance effects.
- Smooth anchor navigation.
- Active clause tracking.
- Animated reading progress.

### Signature

- Clear loading feedback.
- Secure verification steps.
- Elegant success animation.
- No misleading confirmation states.

### Reduced motion

Provide a functional experience without decorative animation when the user requests reduced motion.

---

# 20. COMPLETE OFFICIAL CONTRACT CONTENT

**IMPORTANT: The following legal text is the authoritative source content for this project. Preserve all clauses, numbering, obligations, and commercial terms. Do not shorten, summarize, or silently rewrite it.**

Use the preparation workflow to replace blank fields only after the administrator provides the corresponding information.

# CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE DESIGN E EDIÇÃO DE VÍDEOS

**CONTRATANTE:** SCALUP, pessoa jurídica inscrita no CNPJ sob nº ____________________, com sede em ____________________, neste ato representada por ____________________, doravante denominada **CONTRATANTE**.

**CONTRATADO:** **50.118.963 JEREMIAS VITOR DOS ANJOS THOMAZ**, pessoa jurídica inscrita no **CNPJ sob nº 50.118.963/0001-62**, com sede no município de **Jundiaí, Estado de São Paulo**, endereço completo ____________________, neste ato representada por **Jeremias Vitor dos Anjos Thomaz**, doravante denominada **CONTRATADO**.

As partes acima identificadas celebram o presente Contrato de Prestação de Serviços de Design e Edição de Vídeos, mediante as seguintes cláusulas e condições.

## CLÁUSULA 1 — DO OBJETO

**1.1.** O presente contrato tem como objeto a prestação de serviços de design gráfico e edição de vídeos pelo CONTRATADO, destinados à produção de materiais publicitários e conteúdos digitais para clientes atendidos pela CONTRATANTE.

**1.2.** Os serviços serão realizados conforme os briefings, orientações e materiais fornecidos pela CONTRATANTE, respeitando o escopo estabelecido neste contrato.

## CLÁUSULA 2 — DOS SERVIÇOS CONTRATADOS

**2.1.** O CONTRATADO será responsável pela produção mensal dos seguintes materiais:

- **04 (quatro) peças visuais estáticas**, incluindo seus respectivos desdobramentos para campanhas de tráfego pago.
- **Até 04 (quatro) vídeos editados**, incluindo seus respectivos desdobramentos para campanhas de tráfego pago.

**2.2.** O escopo contempla o atendimento de **02 (dois) clientes da CONTRATANTE**, totalizando até **08 (oito) produções originais por mês**, além dos desdobramentos correspondentes.

**2.3.** Entende-se por desdobramento a adaptação de uma peça já desenvolvida para diferentes formatos, dimensões ou proporções, preservando seu conceito criativo original.

**2.4.** A quantidade e os formatos dos desdobramentos serão definidos previamente entre as partes, conforme as necessidades das campanhas.

**2.5.** Os serviços que ultrapassarem o volume mensal contratado, exigirem novas criações ou envolverem demandas não previstas neste contrato deverão ser negociados e orçados separadamente.

## CLÁUSULA 3 — DO VALOR E DAS CONDIÇÕES DE PAGAMENTO

**3.1.** Pela execução dos serviços descritos, a CONTRATANTE pagará ao CONTRATADO o valor mensal fixo de **R$ 400,00 (quatrocentos reais)**.

**3.2.** O valor corresponde à totalidade dos serviços prestados aos dois clientes contemplados neste contrato, não sendo cobrado individualmente por cliente.

**3.3.** O pagamento deverá ser efetuado até o **5º (quinto) dia útil de cada mês**, referente aos serviços prestados no mês anterior.

**3.4.** O pagamento será realizado por PIX ou transferência bancária, conforme os dados informados pelo CONTRATADO.

**3.5.** Qualquer alteração no valor mensal ou ampliação do escopo deverá ser previamente acordada entre as partes, preferencialmente por escrito.

## CLÁUSULA 4 — DOS PRAZOS E DAS ENTREGAS

**4.1.** As demandas deverão ser encaminhadas pela CONTRATANTE com briefing, textos, referências e demais materiais necessários para sua execução.

**4.2.** Os prazos de entrega serão definidos de comum acordo, considerando a complexidade das peças e o cronograma de produção.

**4.3.** A ausência de informações, atrasos no envio de materiais ou alterações significativas no briefing poderão ocasionar a revisão dos prazos previamente estabelecidos.

**4.4.** O CONTRATADO compromete-se a manter comunicação profissional com a CONTRATANTE, informando eventuais dificuldades que possam comprometer as entregas.

## CLÁUSULA 5 — DAS ALTERAÇÕES E REVISÕES

**5.1.** As peças desenvolvidas poderão passar por ajustes para atender às orientações e necessidades dos clientes finais.

**5.2.** As revisões deverão respeitar o briefing originalmente aprovado e o conceito criativo desenvolvido.

**5.3.** Solicitações que caracterizem uma nova peça, mudança completa de conceito ou alterações substanciais após a aprovação poderão ser consideradas demandas adicionais, sujeitas a novo orçamento.

**5.4.** As partes deverão alinhar previamente a quantidade de revisões incluídas em cada demanda.

## CLÁUSULA 6 — DAS RESPONSABILIDADES

**6.1.** Compete ao CONTRATADO:

- Desenvolver os materiais com qualidade técnica e atenção aos briefings recebidos.
- Cumprir os prazos previamente acordados.
- Preservar o sigilo das informações e dos materiais dos clientes.
- Realizar os ajustes previstos no escopo contratado.

**6.2.** Compete à CONTRATANTE:

- Fornecer briefings claros e todas as informações necessárias.
- Disponibilizar materiais, arquivos, logotipos e demais elementos necessários às produções.
- Centralizar e encaminhar os feedbacks dos clientes finais.
- Efetuar os pagamentos nas condições estabelecidas.
- Comunicar com antecedência eventuais mudanças de prioridade ou cronograma.

## CLÁUSULA 7 — DOS DIREITOS DE USO DOS MATERIAIS

**7.1.** Após a quitação dos valores correspondentes, a CONTRATANTE poderá utilizar os materiais finais aprovados em suas campanhas, redes sociais e demais canais de comunicação de seus clientes.

**7.2.** A disponibilização de arquivos editáveis, projetos abertos e materiais de trabalho não está automaticamente incluída neste contrato, devendo ser negociada separadamente.

**7.3.** A utilização de fontes, imagens, músicas, vídeos ou outros recursos de terceiros deverá respeitar as respectivas licenças de uso.

## CLÁUSULA 8 — DA AUTONOMIA PROFISSIONAL

**8.1.** A presente contratação possui natureza de prestação de serviços autônomos, não estabelecendo, por si só, vínculo empregatício, sociedade ou relação de exclusividade entre as partes.

**8.2.** O CONTRATADO terá autonomia na organização e execução dos serviços, comprometendo-se com os prazos e entregas acordados.

**8.3.** O CONTRATADO poderá prestar serviços a outros clientes e empresas, desde que respeite as obrigações de confidencialidade assumidas neste contrato.

## CLÁUSULA 9 — DA CONFIDENCIALIDADE

**9.1.** Ambas as partes comprometem-se a manter sigilo sobre informações comerciais, estratégias, documentos, dados e materiais confidenciais aos quais tenham acesso em decorrência desta parceria.

**9.2.** A obrigação de confidencialidade permanecerá válida mesmo após o encerramento da relação contratual.

## CLÁUSULA 10 — DA VIGÊNCIA E RESCISÃO

**10.1.** O presente contrato terá início em **__/__/________**, com vigência por prazo indeterminado.

**10.2.** Qualquer uma das partes poderá solicitar o encerramento da parceria mediante comunicação por escrito com antecedência mínima de **30 (trinta) dias**.

**10.3.** Em caso de encerramento, deverão ser quitados os valores referentes aos serviços efetivamente prestados até a data de término da parceria.

**10.4.** O descumprimento relevante das obrigações contratuais poderá justificar a rescisão antecipada, mediante comunicação à outra parte.

## CLÁUSULA 11 — DAS DISPOSIÇÕES GERAIS

**11.1.** Qualquer alteração das condições deste contrato deverá ser acordada entre as partes por escrito.

**11.2.** A inclusão de novos clientes, o aumento do volume de produções ou a ampliação das responsabilidades do CONTRATADO dependerão de negociação prévia.

**11.3.** As partes reconhecem a validade de assinaturas eletrônicas para a formalização deste instrumento, observada a legislação aplicável.

**11.4.** Fica eleito o foro da comarca de ____________________ para dirimir eventuais controvérsias decorrentes deste contrato, desde que legalmente admissível.

E, por estarem de acordo, as partes firmam o presente instrumento.

**Local e data:** ____________________________________

---

**CONTRATANTE**

SCALUP

CNPJ: ____________________________________

Representante: ____________________________________

Assinatura: ____________________________________

**CONTRATADO**

50.118.963 JEREMIAS VITOR DOS ANJOS THOMAZ

CNPJ: 50.118.963/0001-62

Sede: Jundiaí — SP

Representante: Jeremias Vitor dos Anjos Thomaz

Assinatura: ____________________________________

---

# 21. REQUIRED TESTING AND ACCEPTANCE CRITERIA

The application must not be considered finished until all of the following are functional.

## Visual implementation

- The first screen displays "Vamos começar?".
- The design uses only the official black, red, and white color system.
- Both uploaded logos appear correctly throughout the experience.
- Animations are smooth and refined.
- The website is visually inspired by the Veltrix reference.
- All sections work correctly on desktop and mobile.

## Contract functionality

- All eleven legal clauses are present.
- No original contractual obligations have been omitted.
- The payment amount is correct.
- The monthly production scope is correct.
- The contract identifies the correct parties.
- Missing information is handled through an administrative preparation process.
- Signing is blocked until required information is complete.
- Contract versions are preserved correctly.

## Electronic signatures

- Both parties can sign independently.
- Both signers must verify their identities.
- Explicit consent is required.
- Signatures are saved securely.
- The system records signing timestamps.
- Signature records are tied to an immutable contract version.
- Duplicate signatures are prevented.
- Unauthorized users cannot impersonate another signer.

## Email functionality

- A successful SCALUP signature sends a confirmation to contato@scalupagencia.com.
- A successful Jeremias signature sends a confirmation to jeremiasthomaz8@gmail.com.
- Both parties receive final notifications after both signatures are complete.
- Delivery failures are handled gracefully.
- Notification events are logged.
- Duplicate emails are prevented.

## Final PDF

- A real finalized document is produced.
- The document includes all legal clauses.
- Both parties are correctly identified.
- Both signatures are represented according to the selected signing method.
- Supporting audit evidence is preserved.
- The document is protected from unauthorized changes.
- Both parties can securely access the final document.

## Failure scenarios

Test:

- Unauthorized signature attempts.
- Expired signing links.
- Invalid verification codes.
- Missing agreement information.
- Duplicate signature submissions.
- Signing requests received simultaneously.
- Email delivery failures.
- PDF generation failures.
- Database errors.
- Attempts to edit a signed contract.
- Unauthorized document access.

No simulated success messages should remain in production.

---

# 22. FINAL IMPLEMENTATION REQUIREMENTS

Deliver the complete application including:

- Production-quality frontend.
- Responsive design.
- Official logo integration.
- Smooth animations.
- Complete legal contract.
- Functional navigation.
- Secure agreement preparation.
- Backend and database.
- Electronic signature workflow.
- Email verification.
- Automatic confirmation emails.
- Contract status tracking.
- PDF generation and storage.
- Signature evidence.
- Private administration.
- Error handling.
- Deployment instructions.
- Environment variable documentation.
- Testing instructions.

Clearly distinguish between implemented features and features requiring configuration.

Do not pretend that external integrations are active if provider credentials have not been supplied.

Do not use hardcoded signature results, fake email confirmations, or nonfunctional buttons.

---

# 23. FINAL ART DIRECTION

The final experience should feel like an exclusive collaboration between two creative businesses.

It should combine the atmosphere of a premium creative agency with the trustworthiness of a professional legal platform.

### Visual identity

**Black #000000**

**Red #FE0000**

**White #FFFFFF**

### Main visual elements

- Oversized modern typography.
- Elegant italic accents.
- Cinematic red ambient lighting.
- Sophisticated black backgrounds.
- Smooth motion and transitions.
- Subtle grain and blur.
- Official partner logos.
- Minimal layouts.
- Strong editorial hierarchy.

### Desired emotional journey

**Welcome → Discover → Understand → Agree → Sign → Celebrate.**

The experience must begin with:

# "Vamos começar?"

And conclude with:

# "Tudo oficializado. Nossa parceria começa aqui."

The result must be more than an ordinary contract website.

It should feel like a beautifully crafted digital experience created specifically to formalize this partnership.

**Prioritize exceptional design, complete functionality, secure electronic signatures, professional readability, and attention to every visual and technical detail.**

**Build the actual application. Do not stop at a mockup or static demonstration.**