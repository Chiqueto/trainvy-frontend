# Remadas com barra — regiões anatômicas e variantes

Revisão de 16/11/2026. Substitui as decisões de trajetória/nomes das remadas com
barra da [revisão escapular anterior](EXERCISE-3D-SCAPULAR-ROWS-REVIEW.md).
As correções escapulares de cabo, máquina, unilateral e puxadas permanecem.

## Problema corrigido

Os destinos antigos usavam coordenadas do cenário. Conferidos no referencial do
tronco, o ponto da remada baixa correspondia à base do peito e o da alta ficava
acima do peitoral. Testes de distância/colisão sem identificar a região do corpo
não detectavam essa diferença. Agora os destinos são marcos do atlas, transformados
junto com o tronco; os testes conferem a região contra a geometria de origem.

## Cadastros e identidades

| UUID | Nome atual | Execução |
| --- | --- | --- |
| `00000000-0000-4000-8000-000000000121` | Remada Curvada (Baixa) — Pronada | Cotovelos próximos; umbigo/baixo abdômen; barra suspensa. |
| `1444333f-9fb0-4d74-843a-42b9480e5cfc` | Remada Curvada (Baixa) — Supinada | Mesmo tronco e destino; antebraço/mão em supinação. |
| `7f249b6a-85ad-45ca-9147-6cfa712547c7` | Remada Curvada (Alta) — Pronada | Cotovelos mais abertos; costelas baixas/base do peito. |
| `92a8b19e-86b5-47ea-91d1-529fab4ab05c` | Remada Curvada (Alta) — Supinada | Mesmo destino alto, abertura confortável e pegada supinada. |
| `bb4607b8-c89b-4d22-bf59-1edf55c2ee77` | Remada Yates — Pronada | Tronco mais ereto; cotovelos próximos; baixo abdômen. |
| `824b6099-a3d9-41f9-bf52-d29587393c85` | Remada Yates — Supinada | Postura Yates, supinada clássica; baixo abdômen. |
| `1eef7876-e093-42af-8374-00d3b105c47a` | Remada Pendlay (Pronada) | Tronco quase horizontal; puxada ao abdômen superior; repouso completo no chão. |
| `00000000-0000-4000-8000-000000000122` | Remada Curvada (legado) | Continua fora de novas escolhas; mesma execução baixa corrigida, sem excluir históricos. |

IDs existentes preservados. A Pendlay reutiliza seu cadastro anterior. Somente
alta supinada e as duas Yates recebem novos UUIDs. Nomes anteriores permanecem
aliases da busca/resolução de globais; exercícios personalizados mantêm prioridade.
Renomear o catálogo não reescreve nomes registrados nas sessões ou seus vínculos.

## Pesquisa e limites

Consulta anterior à implementação em 16/11/2026:

- [Vasconcelos et al., 2023](https://doi.org/10.47206/ijsc.v3i1.190): 21 participantes
  recreacionalmente treinados; remada sentada no cabo, pegadas e abdução do ombro.
  Abdução maior favoreceu registros de trapézio/deltoide posterior; menor, dorsal.
  Transferência para barra livre é inferência anatômica, não medição destas sete
  variantes nem previsão de hipertrofia. O texto havia sido consultado na revisão
  anterior; nesta sessão o site/PDF retornaram timeout.
- [Kanno et al., 2025; online 2026](https://doi.org/10.32171/jscicoachingtraining.8.1_23):
  nove jogadores de rugby, remada curvada a 40°/65° de flexão. Diferenças individuais;
  não define ângulo ótimo universal nem mede Yates/Pendlay.
- [Padovan et al., 2026](https://doi.org/10.3390/jfmk11010006): 14 homens treinados,
  remada sentada, escápulas livres/fixas, 8RM e HD-sEMG por fase. Fundamenta distinguir
  condições escapulares; não prova que mais amplitude escapular seja sempre melhor.
- [Bret Contreras — How to Bent Over Row](https://bretcontreras.com/how-to-bent-over-row/):
  referência técnica primária do treinador para diferenças entre tradicional,
  Yates e Pendlay; não é ensaio comparativo EMG. As descrições de ângulo variam entre
  referências: o modelo usa a distinção solicitada pelo usuário, sem universalizar.
- [Dorian Yates — Row Like The Shadow](https://www.muscleandfitness.com/flexonline/training/row-shadow/):
  orientação técnica em primeira pessoa sobre sua remada; não estabelece superioridade
  da pegada ou participação regional medida.
- [Catalyst Athletics — Pendlay Row](https://www.catalystathletics.com/exercise/867/Pendlay-Row/):
  biblioteca de Greg Everett, barra ao abdômen e retorno ao chão; também descreve
  uma variante com movimento torácico. Aqui foi adotada a versão de tronco estável
  descrita pelo usuário. Não simular flexão lombar ou impulso para alcançar a barra.

O [vídeo do Glenn Pendlay](https://www.youtube.com/watch?v=ZlRrIsoDpKg) não pôde ser
aberto pela ferramenta; o resumo fornecido pelo usuário foi utilizado como referência
de execução, sem alegar inspeção do vídeo. O PDF da NSCA informado retornou 404.
Anatomia funcional segue OpenStax e as fontes já vinculadas aos participantes de
cada revisão estruturada. Não se inferem isolamento, vantagem universal de pegada,
ativação em tempo real ou recomendações clínicas.

## Marcos e movimento

Atlas de origem: raiz em `y=1,142 m`; limite inferior do peitoral esternocostal
aproximadamente `y=1,191 m`. Os destinos na pose de repouso são:

- Baixa: `y=1,065 m`, no abdômen, abaixo da base do peitoral.
- Alta: `y=1,205 m`, junto à base do peitoral/costelas baixas.
- Yates: `y=1,040 m`, no baixo abdômen.
- Pendlay: `y=1,180 m`, no abdômen superior/costelas baixas.

Esses pontos são referências gráficas deste atlas. Não constituem uma antropometria
individual nem alturas da barra no chão. O centro do eixo fica ligeiramente à frente
da superfície para acomodar o raio da barra, sem atravessar o corpo.

As quatro tradicionais compartilham inclinação de cerca de 27° acima da horizontal;
Yates, cerca de 50°; Pendlay, cerca de 5°. São escolhas editoriais representativas.
Comprimentos ósseos, apoios e pegadas são resolvidos por IK, com retorno dos braços
próximo da extensão. Escápulas continuam independentes e coordenadas com os braços.

Na Pendlay, o eixo da barra para a `0,20 m`, igual ao raio das anilhas. O ciclo tem
pausa com anilhas assentadas, puxada curta/mais rápida, pausa alta e descida mais
longa; não usa a fase de uma remada suspensa nem rebote entre repetições.

## Participantes, máscaras e apresentação

Baixas e Yates: dorsal/redondo maior principais; retratores escapulares secundários
na representação do movimento de extensão do ombro. Altas: retratores e deltoide
posterior principais; dorsal/redondo maior continuam participantes secundários.
Pendlay: dorsal/redondo maior e retratores principais, com deltoide posterior
secundário. São classificações editoriais por ação articular, não percentuais EMG.

Flexores do cotovelo, pegada, manguito, serrátil, eretores/abdômen e sustentação das
pernas permanecem descritos e destacados conforme a revisão individual. Diminuir
destaque não significa inatividade. Mapas baixo/alto/Pendlay foram comparados por
identidade anatômica, preservando os canais de outros exercícios no shader.

## Entrega e validação

Branch: `exercise-3d/row-landmarks-a104`, frontend/API. Bases: frontend `d1a1052`,
API `4f52b88`. Continuação no par isolado deste chat em
`.tmp/exercise-worktrees/scapular-z937/{frontend,api}`, com reservas próprias
`row-landmarks-a104`. Sem alterações nas pastas de outros chats.

Revisões atuais em `*-landmark-anatomy.json`, indexadas no manifesto
`barbell-row-variants.json`. Migrations `20261116182000` a `20261116182700`, uma por
UUID, preservam mídia, ownership, revisão profissional, histórico e ajustes manuais.
Atualizam apenas o nome/classificação/payload anterior conhecidos. A aplicação ao
banco configurado segue a autorização já dada pelo usuário para estas correções.

O banco de testes possui schema sem histórico Prisma compatível com `migrate deploy`
(P3005). Nenhum baseline ou reset foi executado. Cada migration foi exercitada em
transação isolada com rollback, preparando seu baseline por UUID; o banco da aplicação
fica separado e só recebe os arquivos finais após a validação.

Conferências: destinos contra a geometria real do peitoral, apoios/contatos ao longo
de 201 poses, comprimentos ósseos, chão/anilhas, cadência da Pendlay, tecido deformado,
papéis musculares distintos, busca/aliases e idempotência/preservação das migrations.
Revisão visual das sete variantes em desktop/celular, múltiplas vistas e fases, sem
erros no navegador ou assets 3D remotos. Artefatos ficam na pasta temporária do chat.
Suíte completa frontend: 105 arquivos, 905 testes aprovados. API: 62 testes
direcionados aprovados em 11 arquivos. Builds frontend/API e TypeScript aprovados;
ESLint sem erros (aviso anterior de `initialData` no dialog de execução preservado).
Estado final da persistência é conferido por payload/nome e hash dos registros de
planos, sessões e séries, e informado na entrega.
