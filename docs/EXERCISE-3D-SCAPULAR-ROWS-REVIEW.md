# Revisão de remadas, pegadas e movimento escapular — 16/11/2026

Pedido: retirar a duplicidade da remada curvada, incluir pegada supinada, diferenciar
trajetórias ao abdômen/peito e corrigir todas as remadas/puxadas com 3D existente.

## Identidades e entrega por exercício

| UUID | Exercício | Decisão |
| --- | --- | --- |
| `00000000-0000-4000-8000-000000000121` | Remada Curvada com Barra | Pronada, cotovelos próximos, barra ao abdômen; escápulas livres. |
| `00000000-0000-4000-8000-000000000122` | Remada Curvada (legado) | Manter ID, planos, mídia e histórico. Ocultar nas novas escolhas e no laboratório. Nome genérico resolve para 121; exercícios personalizados continuam com prioridade. Não converter históricos com barra em halteres. |
| `1444333f-9fb0-4d74-843a-42b9480e5cfc` | Remada Curvada com Barra e Pegada Supinada | Reutilizar cadastro próprio existente; orientar antebraço/mão em supinação, puxada ao abdômen. |
| `7f249b6a-85ad-45ca-9147-6cfa712547c7` | Remada Curvada com Barra ao Peito | Nova variante explícita: pronada aberta, cotovelos mais afastados, trajetória à parte inferior do peito. |
| `00000000-0000-4000-8000-000000000138` | Remada Unilateral com Halteres | Movimento escapular no lado do halter; mão, joelho e cintura escapular de apoio estáveis. |
| `120f29ac-733c-478b-8aa9-a3f4c22f5e70` | Remada Baixa no Cabo com Triângulo | Escápulas acompanham alcance e puxada, sem balanço do tronco. |
| `43025392-0466-46e7-82ab-27888d53f929` | Remada Sentada na Máquina | Mesma coordenação escapular, peito apoiado, trajetória dos pegadores definida pelas alavancas. |
| `00000000-0000-4000-8000-000000000119` | Puxada Frontal na Máquina | Escápulas acompanham braços: elevação/rotação superior na volta acima da cabeça e retorno na puxada. |
| `00000000-0000-4000-8000-000000000120` | Puxada Frontal | Mesma correção escapular na variante pronada já representada; manter sua identidade existente. |

Cada UUID tem revisão própria na API, fontes, participantes, instruções e migration
restrita. As sete revisões anteriores ficam preservadas como registros históricos;
as atuais usam o sufixo `-scapular-anatomy.json`. Supinada e ao peito têm arquivos
próprios `supinated-bent-row-anatomy.json` e `high-bent-row-anatomy.json`.

## Pesquisa anterior à implementação

Consulta em 16/11/2026. Fontes primárias, com limites de transferência registrados
também nas revisões estruturadas da API:

- [Vasconcelos et al., 2023](https://doi.org/10.47206/ijsc.v3i1.190): 11 homens e
  10 mulheres recreacionalmente treinados; remada sentada no cabo, pegadas
  pronada/supinada/neutra, abdução 30/60/90°, condições isométricas e dinâmicas.
  Maior abdução apresentou maior EMG de trapézio/deltoide posterior; menor abdução,
  de dorsal. A posição dos cotovelos importa; tocar um ponto do corpo, sozinho,
  não determina isolamento. Aplicação à barra livre é inferência anatômica.
- [Padovan et al., 2026; online 24/12/2025](https://doi.org/10.3390/jfmk11010006):
  14 homens treinados, 8RM, quatro repetições, HD-sEMG por fase, escápulas fixas
  versus livres. São execuções distintas; não justifica dizer que toda remada
  exige amplitude escapular máxima ou que mais movimento produz mais hipertrofia.
  Os modelos desta revisão representam a opção com movimento escapular livre.
- [Oyama et al., 2010](https://doi.org/10.2519/jospt.2010.3018): seis exercícios de
  retração, adultos jovens saudáveis; cinemática tridimensional escapular/clavicular
  e EMG. Retração envolve rotação externa, rotação superior e inclinação posterior
  escapular, com retração/depressão clavicular; magnitudes variam entre exercícios.
- [Buonsenso et al., 2025](https://doi.org/10.3390/jfmk10030345): 40 homens
  treinados, sete puxadas, cinco repetições a 70%1RM; diferenças de pegada não
  estabeleceram vantagem geral para o dorsal. Não converter supinação em promessa
  de ativação superior ou isolamento.
- [Kanno et al., 2025/online 2026](https://doi.org/10.32171/jscicoachingtraining.8.1_23):
  nove jogadores universitários de rugby, remada curvada com tronco a 40°/65°;
  diferenças individuais. O tronco a aproximadamente 52° no avatar é escolha
  editorial de representação, sem ângulo ideal universal.
- [OpenStax, anatomia funcional](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-5-muscles-of-the-pectoral-girdle-and-upper-limbs):
  ações da cintura escapular e participação de serrátil/trapézio, retratores,
  manguito e flexores do cotovelo. Controle durante elevação inclui rotação superior;
  não manter as escápulas permanentemente deprimidas nas puxadas.

## Cinemática e anatomia implementadas

Controles `scapula_L/R` independentes, adicionados à cópia local do esqueleto.
O GLB distribuído, topologia e índices dos atlas permanecem iguais. Pesos
torácicos redistribuídos por identidades anatômicas verificadas: trapézio,
romboides, infraespinal, redondo maior, deltoide, inserções de dorsal/peitoral e
serrátil anterior. Preservam-se origens mediais e os pesos articulados dos braços.
Não se trata apenas de deslocar o ponto do ombro: a superfície dorsal de fato
acompanha os controles. Fora destas puxadas, os controles seguem exatamente o
tórax, preservando a deformação anterior.

O pivô anterior torácico representa o deslocamento da cintura escapular ao redor
da caixa torácica. Retração/protração ilustrativas: aproximadamente -7°/+8°; nas
puxadas há também cerca de 3°–28° de rotação superior e até 2,5 cm de elevação.
São amplitudes editoriais suaves, não medições dos estudos ou prescrição individual.
Comprimentos ósseos, pega, apoios e trajetórias de equipamento continuam definidos
pela IK. Não há dedos articulados; a malha de mão fechada mantém a limitação do atlas.

Nas remadas ao abdômen, dorsal/redondo maior e retratores são principais. Na variante
ao peito, retratores e deltoide posterior recebem destaque principal, enquanto
dorsal/redondo maior permanecem secundários. Braços, manguito, tronco e sustentação
das pernas continuam representados conforme cada apoio. Serrátil recebe destaque
secundário de controle escapular em todos estes modelos. Mapa próprio da remada
alta é validado por identidades de origem; compartilhar infraestrutura não equivale
a presumir mapas idênticos para movimentos distintos.

Novo mapa do serrátil extraído do FBX licenciado, com consenso de componentes de
95%/97,5%, SHA-256 do GLB/FBX e licença CC-BY-SA-4.0. Cores categóricas preservadas:
`primaryTissue #bd5148`, `secondaryTissue #d97d75`, `neutralTissue #b5b3ac`.
Legenda/instruções tratam participação e ênfase ilustrativas, sem EMG em tempo real.

## Persistência e isolamento

Branch dos dois repositórios: `exercise-3d/scapular-rows-z937`.
Bases: frontend `3b929b2`, API `6bbccd5`. Worktrees próprios em
`.tmp/exercise-worktrees/scapular-z937/{frontend,api}`; token `scapula-z937`.

Migrations novas `20261116150000` a `20261116150800`, uma por UUID, preparadas e
testadas somente no banco isolado. As sete refinam apenas o payload anterior exato,
ownership global, nome e classificação esperados. Revisões manuais, inclusive com
a mesma versão, permanecem intactas. As duas variantes só preenchem classificação
vazia/baseline conhecida, sob bloqueio de linha. Não reescrever migrations antigas,
históricos, decisões profissionais, mídia válida ou exercícios personalizados.

A remoção da duplicidade é aplicada na seleção/resolução canônica, sem excluir ou
transferir sessões. Contrato HTTP permanece igual; não requer regeneração do Orval.
Sem reconciliação geral, push, deploy ou migração do banco da aplicação nesta tarefa.

## Validação

- Testes das nove animações ao longo de 201 poses: apoios, comprimentos e contatos.
- Testes de deslocamento da superfície dos romboides, controles independentes,
  lado de apoio estável, rotação superior e preservação fora das puxadas.
- Testes das novas pegadas, trajetórias, mapas e contato da barra com a malha real.
- API: schema, participantes, busca, identidade, idempotência, preservação de
  revisões manuais e acesso ao ID histórico; testes das migrations por UUID.
- Revisão visual desktop/celular, frente/lateral/costas/vistas elevadas e fases
  relevantes; sem assets 3D remotos. Artefatos ficam na pasta temporária da tarefa.
- Suíte completa frontend: 104 arquivos, 869 testes aprovados. API: 52 testes
  direcionados aprovados (10 arquivos). Builds frontend/API aprovados, TypeScript
  aprovado e `git diff --check` sem erros. ESLint sem erros; permanece o aviso
  anterior de dependência `initialData` no dialog de execução.
