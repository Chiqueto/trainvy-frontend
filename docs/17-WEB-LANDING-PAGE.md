# Landing page web — 27/10/2026

## Entrada

- `/` sem cookie de sessão: landing pública, sem chamada à API de autenticação.
- `/` com sessão válida: Home e guardas de cadastro/onboarding existentes.
- Cookie de sessão expirado: landing pública após consulta à autenticação.
- PWA standalone, minimal-ui ou iOS (`navigator.standalone`):
  visitante é encaminhado a `/auth`; a landing é ocultada por media query antes
  da hidratação nos modos de display instalados. Manifesto e atalhos preservados.
  Fullscreen do navegador/visualizador 3D não é tratado como instalação.
- CTA de atleta: `/auth/signup`. CTA de personal:
  `/auth/signup?accountType=COACH`, que seleciona apenas o tipo inicial do
  formulário; validação comercial e autorização continuam no backend.

## Experiência

Identidade escura com azul da marca, prévia de registro de séries interativa,
planejamento, gráfico ilustrativo, Coach AI, demonstração 3D real, alternância
atleta/personal e FAQ. Dados das prévias são explicitamente ilustrativos.
Não há preços fixos, depoimentos inventados ou promessas de IA ilimitada.

Animações CSS incluem flutuação, órbitas, faixa contínua, traçado de gráfico e
entradas vinculadas ao scroll em navegadores compatíveis. Respeita
`prefers-reduced-motion`; o rodapé permite pausar animações decorativas.
Menu mobile com Escape, skip link, foco visível, controles semânticos e zoom
disponível na entrada pública.

Refinamento visual: chegada sequencial do conteúdo do hero, profundidade suave
com ponteiro de mouse, trilhas orbitais animadas, halo ambiente, brilho nos CTAs
e iluminação dos cards seguindo o cursor. O ponteiro usa um único
`requestAnimationFrame` por quadro e só atua em dispositivos com mouse; a pausa
da página e `prefers-reduced-motion` também interrompem esses efeitos.

## Login e cadastro

As rotas `/auth`, `/auth/signup`, `/auth/complete` e `/auth/welcome` compartilham
um layout escuro com a identidade da landing. No desktop, o painel visual fica
ao lado do formulário; no mobile, o conteúdo de acesso recebe prioridade.

- Login Google com estado ocupado, erro acessível e recuperação.
- Cadastro com escolha de atleta/personal e planos publicados vindos da API.
- Catálogo vazio, erro e carregamento bloqueiam o envio de cadastro de personal.
- Confirmação e boas-vindas seguem a mesma identidade. Assinatura pendente não
  é apresentada como ativa.
- Links preservam o convite sanitizado. OAuth, SignupIntent, preços e
  autorização mantêm os contratos existentes.
- Entradas públicas de login/cadastro sem cookie não consultam a API de sessão.
- Fontes de marca e imagens existentes; nenhum pacote novo foi adicionado.

O motor e o modelo 3D só carregam ao abrir a demo ou selecionar um exercício.
O canvas é desmontado ao sair da região da seção para liberar recursos.
São reutilizados visualizador, modelos, movimentos, cores e legendas do app.
Não foram criados ou modificados exercícios 3D. Créditos e licença do modelo e
da prévia estão em `public/landing/ATTRIBUTION.md` e na própria página.

## Validação

```sh
npm test -- --maxWorkers=1 tests/landing-entry.test.tsx tests/pwa.test.tsx tests/nextjs-cookie-runtime-invariants.test.tsx tests/commercial-ui.test.tsx tests/exercise-3d-viewer.test.tsx
# Com npm run dev -- --port 3100 em execução:
node scripts/landing-qa.mjs
# Incluir a revisão das telas de acesso:
node scripts/landing-qa.mjs --auth
```

O script de navegador usa perfil temporário isolado. Verifica larguras de
1440, 820, 390 e 320 px; registro interativo; navegação mobile; FAQ;
CTA de personal; carregamento sob demanda e troca de exercício 3D;
desmontagem fora da tela; entrada iOS/standalone. Capturas e relatório ficam
em `.tmp/landing-qa/`, ignorado pelo Git.
