# Scalup × Jeremias Thomaz

Aplicação Next.js para apresentação, preparação e aceite eletrônico do contrato de design e edição de vídeos. Interface e mensagens em português brasileiro.

## Estado da entrega

O código inclui as telas responsivas, contrato integral, administração por Supabase Auth, convite individual, verificação por código de e-mail, aceite transacional, PDF com evidências, armazenamento privado e fila de notificações Resend. Os testes locais usam PostgreSQL embutido (PGlite) e navegador Edge isolado. Não foram feitas assinaturas ou notificações reais.

Projeto Supabase criado com autorização: `scalup-contratos`, referência `pkvuwokriunsfsivhqok`, região `sa-east-1`, organização `vox`. A cotação aprovada na criação foi US$ 0/mês. O esquema e o bucket privado `contracts` já foram criados. A cotação não substitui o acompanhamento de limites e cobrança futura no provedor.

**Ainda não está liberado para assinatura real nem publicado.** Os logos oficiais e o CNPJ da Scalup (60.444.212/0001-90) foram adicionados. Faltam os demais dados jurídicos, conta administrativa, segredo de Storage e credenciais Resend. A tentativa inicial de provisionar uma credencial de banco foi rejeitada pela revisão automática de segurança. Após autorização explícita, a proposta restrita de `supabase/runtime-role.sql` foi aplicada com senha protegida por SCRAM. A conexão `ctr_runtime` foi validada com TLS e a CA oficial; sem edição de assinaturas, exclusão de versões ou criação de tabelas. Não execute `db:setup` novamente neste projeto já provisionado.

## Executar localmente

Requer Node.js 20.9+ (testado com Node 24).

```powershell
npm ci
npm run dev
```

Abra http://localhost:3000. Administração: http://localhost:3000/admin. Convites: `/assinar#convite=...`.

A apresentação pública funciona sem credenciais. O contrato público é uma prévia do texto fornecido; os dados preenchidos e as assinaturas só aparecem em sessões autenticadas. Sem configuração, as operações protegidas falham explicitamente e não exibem sucesso fictício.

## Configuração

Use `.env.example` como referência. `.env.local` está ignorado pelo Git. No ambiente desta entrega já estão preenchidos a URL pública do projeto, a chave publicável, a conexão restrita de banco e segredos gerados localmente. Nunca compartilhe esse arquivo.

| Variável | Uso |
| --- | --- |
| `APP_URL` | Origem exata acessada pelo usuário, sem barra final. HTTPS em produção. Localmente `http://localhost:3000`. |
| `SUPABASE_URL` | URL do projeto dedicado. |
| `SUPABASE_PUBLISHABLE_KEY` | Chave pública para login e validação de usuários. |
| `SUPABASE_SERVICE_ROLE_KEY` | Segredo somente no servidor para o bucket privado. Nunca usar prefixo `NEXT_PUBLIC_`. |
| `DATABASE_URL` | Conexão PostgreSQL do servidor com credencial restrita; em produção usar TLS com verificação de certificado. A conexão local usa `sslmode=verify-full&sslrootcert=certificates%2Fsupabase-ca.crt`. |
| `ADMIN_EMAILS` | Lista explícita de administradores, separada por vírgulas. Não usa `user_metadata` para autorização. |
| `TOKEN_SECRET` | Segredo HMAC de pelo menos 32 caracteres, protege convites, códigos e sessões armazenados. |
| `OUTBOX_ENCRYPTION_KEY` | Exatamente 32 bytes em hexadecimal (64 caracteres), protege o conteúdo da fila com AES-256-GCM. |
| `CRON_SECRET` | Segredo Bearer para processar a fila via agendador. |
| `RESEND_API_KEY` | Chave do serviço de e-mail transacional. |
| `RESEND_FROM` | Remetente de um domínio verificado no Resend. |
| `RESEND_WEBHOOK_SECRET` | Segredo de verificação dos eventos de entrega. |
| `TRUSTED_IP_HEADER` | Opcional: nome de cabeçalho sobrescrito por proxy confiável. Vazio por padrão; não confiar livremente em X-Forwarded-For. |

No Supabase, crie a conta administrativa em Authentication e use seu e-mail em `ADMIN_EMAILS`. O aplicativo não oferece cadastro público de administradores. O login usa cookie HttpOnly com uma hora de duração; em produção também Secure. Não é necessário expor tabelas à Data API para autenticar.

Para instalar em outro projeto dedicado, execute `npm run db:setup` apenas uma vez depois de configurar uma conexão de migração com privilégios apropriados. O runtime deve usar um usuário de permissões limitadas. `supabase/runtime-role.sql` documenta os privilégios mínimos propostos e precisa ser parametrizado antes de execução. O script não inclui uma senha real.

## Logos e dados pendentes

Os logos enviados estão em `public/brand/scalup.png` e `public/brand/jeremias.webp`, sem alterações de marca. Para substituições futuras, adicione os logos oficiais em `public/brand/scalup.svg` e `public/brand/jeremias.svg`, ou os respectivos `.png`. Os espaços pendentes foram substituídos pelos arquivos oficiais. SVG tem preferência. Forneça uma variação autorizada com contraste adequado ou uma versão dentro de uma superfície apropriada.

Na área administrativa, preencha razão social, CNPJ, endereço, representante e poderes da Scalup; endereço completo do contratado; início da vigência; local e data; foro sujeito a revisão jurídica; limites de revisões; quantidade e formatos de desdobramentos. Nenhum desses dados foi inventado. Os alinhamentos adicionais são anexados ao texto sem reescrever as onze cláusulas.

A liberação exige todos os campos válidos, ambos os logos e as configurações de serviços. Depois de conferir a prévia, libere a versão e envie os dois convites. Criar nova versão revoga convites anteriores e exige novo aceite das duas partes. Salvar rascunho não altera a versão já liberada.

## Assinaturas e privacidade

- Convite de 256 bits, armazenado como HMAC, expira em sete dias e é consumido na verificação. O token fica no fragmento do link e é removido da barra ao abrir; não há analytics nem scripts de terceiros.
- Código aleatório de oito dígitos, válido por dez minutos, no máximo cinco tentativas, com limite de reenvio. Nunca armazenado em texto aberto na tabela de desafios.
- A verificação gera sessão HttpOnly de uma hora, vinculada ao signatário e à versão. O endpoint não aceita escolher outro e-mail ou identidade.
- Consentimento começa desmarcado. Nome, e-mail, declaração, horário UTC, versão, SHA-256 canônico e evidência técnica disponível são registrados em transação.
- A linha do acordo é bloqueada durante a assinatura. Uma restrição única por signatário torna repetições idempotentes. A última assinatura cria um único trabalho de PDF na mesma transação.
- Versões, identidades autorizadas, assinaturas, eventos e registros de PDF não podem ser alterados ou excluídos pelo fluxo normal. Triggers protegem esses registros, mas administradores do banco com privilégios de DDL continuam tecnicamente capazes de alterar o esquema: isto não é armazenamento WORM ou carimbo de tempo independente.
- O hash usa JSON canônico recursivo (`canonical` em `src/lib/crypto.ts`), incluindo texto, dados, logos e data de liberação. A evidência exportada contém o snapshot para recalcular o hash. O hash do arquivo final é separado e conferido no download.
- PDF e comprovante exigem sessão de parte autorizada ou administração. O bucket é privado. Não há URL pública permanente.
- A modalidade implementada é **assinatura eletrônica por aceite e código de e-mail**, não assinatura digital qualificada ICP-Brasil. Não há integração com Clicksign/Autentique/ZapSign nesta versão.

## E-mails, PDF e reprocessamento

Configure SPF, DKIM e DMARC conforme os registros apresentados pelo Resend e seu provedor DNS. Verifique o domínio e o remetente antes de enviar convites. Configure o webhook em `https://SEU_DOMINIO/api/webhook` para `email.delivered`, `email.bounced`, `email.complained` e `email.failed`. O corpo bruto é autenticado pelo SDK Resend; IDs de webhook são deduplicados.

Uma resposta de envio só registra “Enviado ao provedor”. Apenas o evento autenticado `email.delivered` registra entrega confirmada. A fila guarda payload criptografado, chave de idempotência, tentativas e estado de falha. Retentativas automáticas param após cinco falhas ou 23 horas, antes de expirar a janela de idempotência do Resend. Não reenvie itens de estado “Requer revisão” sem consultar o histórico do provedor. Códigos vencidos são descartados da fila.

O servidor tenta processar a fila após ações relevantes. Para recuperar falhas e reinícios, configure um agendador externo a cada minuto:

```text
POST https://SEU_DOMINIO/api/cron
Authorization: Bearer <CRON_SECRET>
```

O processamento também está disponível na administração. Cada lote processa até cinco PDFs e dez e-mails; usa bloqueios `FOR UPDATE SKIP LOCKED`. Falha de PDF não desfaz assinaturas. O trabalho é retomável e reaproveita o arquivo já armazenado, sem sobrescrever o conteúdo. As notificações finais só entram na fila após o PDF ficar disponível. Links finais exigem novo código de e-mail e vencem em sete dias; o administrador pode gerar novos acessos.

## Publicação

A escolha técnica explícita deste projeto é Next.js com runtime Node e PostgreSQL. Não foi convertido para o runtime de Sites nem publicado um front-end estático desconectado do backend.

1. Escolha uma hospedagem que execute Next.js/Node com saída HTTPS e conexão PostgreSQL; configure os segredos no ambiente de execução.
2. Use `npm ci`, `npm run build` e `npm start`. Ajuste o bind (`next start --hostname 0.0.0.0`) quando o host exigir acesso externo. Preserve `content/contract.md`, `public/brand` e os arquivos de fontes necessários à geração do PDF.
3. Defina `APP_URL` com a URL final exata. Instale os logos antes do build para atualizar a página pública.
4. Configure webhook e agendador. Habilite backups e teste restauração. Defina política de retenção e revogação com o responsável pelo tratamento de dados; não mantenha IPs e conteúdo da fila indefinidamente sem necessidade.
5. Execute a lista de aceitação abaixo em homologação antes de convidar as partes reais.

## Validação

```powershell
npm run typecheck
npm test
npm run build
npm run dev
# Em outro terminal:
node scripts/check-browser.mjs
node scripts/render-pdf.mjs
```

O teste de navegador usa Edge instalado. Os arquivos em `test-results/` são artefatos locais ignorados pelo Git. O PDF de teste contém dados deliberadamente identificados como teste e não é um contrato assinado real.

Coberto automaticamente: integridade do texto original e onze cláusulas, valores, campos ausentes, CNPJ e datas; hash canônico e criptografia; falha de autenticação, consentimento ausente, hash divergente, replay de código, limite de reenvio, persistência de tentativas inválidas, duplicidade e chamadas concorrentes, imutabilidade, geração e extração do PDF, falha de e-mail e armazenamento; navegação desktop/mobile, larguras de 320 e 390px, acesso privado, CSRF, movimento reduzido e acessibilidade automatizada.

Ainda exige homologação com credenciais: entrega real de convites e OTP, conta administrativa, webhooks assinados pelo Resend, upload/download no bucket, concorrência em múltiplas conexões PostgreSQL hospedadas, recuperação após reinício do worker e publicação HTTPS. Os testes PGlite executam SQL PostgreSQL e os serviços reais, mas não substituem uma validação de concorrência entre múltiplos processos contra o banco hospedado.

Referências consultadas: Next.js (documentação instalada), [Supabase Auth](https://supabase.com/docs/reference/javascript/auth-signinwithpassword), [Storage privado](https://supabase.com/docs/guides/storage/serving/downloads), [Resend](https://resend.com/docs/api-reference/emails/send-email), [webhooks](https://resend.com/docs/webhooks/verify-webhooks-requests). Direção visual inspirada em [Veltrix](https://veltrix.framer.ai/), sem reutilizar seus assets.

Verificação adicional executada no projeto hospedado: conexão TLS, permissões da credencial restrita, trigger de assinatura e restrição de unicidade, em uma transação integralmente revertida. O banco permaneceu com um rascunho e zero versões liberadas, assinaturas e e-mails.


## Painel de múltiplos contratos

Em `/admin`, a lista oferece busca por cliente, título, código ou e-mail e filtros de situação. “Novo contrato” cria somente um rascunho: informe título, nome da marca, e-mail do cliente e opcionalmente seu logo. O editor permite preencher os dados legais, ajustar o texto e conferir a prévia antes de liberar uma versão e enviar convites.

O logo J e o e-mail do contratado são definidos no servidor. Logos de clientes aceitam PNG, JPG ou WebP de até 1 MB, são validados pelo decodificador e normalizados para PNG. Nome da marca, destinatário, texto e logo ficam em `draft._contract`, no JSONB privado existente. Não há migração de esquema nem mudança de permissões. As versões liberadas preservam os dados e logos usados naquela liberação; editar o rascunho não altera documentos ou assinaturas anteriores.

A listagem, logos dos clientes, edição e histórico exigem autenticação administrativa. Os endpoints de detalhe recebem `agreement` (código do contrato). O status público da página SCALUP continua limitado ao contrato original. Novos contratos são acessados pelas partes por convite individual.

Verificações adicionais: `tests/multi-contract.test.ts` testa criação, liberação, isolamento de destinatários, marca J fixa e preservação de snapshots em PostgreSQL embutido. `node scripts/check-dashboard.mjs` testa a interface com respostas simuladas e verifica os bloqueios reais sem sessão; execute com o servidor local aberto. Nenhum convite é enviado por esses testes.
