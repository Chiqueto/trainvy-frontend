# Correção de postura do militar, lateral e roscas — 18/11/2026

Os detalhes da lateral e do controle cervical abaixo foram substituídos pela
[revisão com referência visual e cabeça rígida](EXERCISE-3D-LATERAL-HEAD-REFERENCE-REVIEW.md).

Branch: `exercise-3d/upper-form-n472`; base frontend `24f9974`, API `b221200`.
Complementa e substitui os detalhes de trajetória/postura correspondentes da
[revisão inicial dos cinco movimentos](EXERCISE-3D-UPPER-FIVE-REVIEW.md).

## Unidades conferidas

| UUID final | Correção |
| --- | --- |
| `000000000123` | Militar: trajetória contínua até acima da cabeça, com pequeno recuo cervical enquanto a barra passa à frente do rosto. |
| `000000000125` | Lateral: cotovelos com cerca de 20 graus de flexão constante; ombros sem a subida exagerada anterior; acompanhamento escapular angular mantido. |
| `000000000127` | Rosca com barra: úmero estabilizado, flexão do cotovelo no lado anatômico correto, pegada supinada contínua. |
| `000000000128` | Mesmo ajuste na rosca legada, sem trocar identidade/equipamento nem reintroduzir duplicata em novas escolhas. |
| `000000000129` | Martelo: úmero estabilizado, pegada neutra constante e antebraço flexionando sem giro indevido do braço. |
| `000000000124` | Desenvolvimento com halteres aprovado: trajetória, apoios e pegada preservados, com teste de regressão em 41 posições. |

Prefixo dos UUIDs completos: `00000000-0000-4000-8000-`.

## Pesquisa anterior à correção

- [NSCA, Progressive Strategies for Teaching Fundamental Resistance Training Movement Patterns, 2023](https://www.nsca.com/contentassets/3d09f06f0b4c4f6fbd8cc382ed1f3d4a/ptq-10.2.1-progressive-strategies-for-teaching-fundamental-resistance-training-movement-patterns.pdf):
  referência técnica de ensino. Descreve o erro de fazer a barra contornar a
  cabeça, em vez de liberar a passagem com recuo cervical. Informa a correção
  do militar; não fornece deslocamento individual ótimo nem promessa clínica.
- [ACE, Lateral Raise](https://www.acefitness.org/resources/everyone/exercise-library/26/lateral-raise/):
  referência técnica para cotovelos ligeiramente flexionados, tronco estável e
  ombros controlados. A pista de manter ombros baixos é usada para evitar um
  encolhimento voluntário, sem traduzir a orientação em imobilidade da escápula.
- [Ebaugh, McClure e Karduna, 2005](https://biomechanics.uoregon.edu/obl/articles/2005_ebaugh_clinbiomech.pdf),
  DOI 10.1016/j.clinbiomech.2005.03.008: cinemática e EMG em 20 participantes,
  elevação ativa/passiva. Fundamenta o acompanhamento escapular e a participação
  do trapézio/serrátil. Não é teste desta elevação carregada, nem prescreve um
  ritmo fixo ou a elevação grosseira do ombro apresentada anteriormente.
- [Coratella et al., 2020](https://doi.org/10.3390/ijerph17176015): estudo de
  variações da elevação lateral em dez fisiculturistas. Os participantes e papéis
  musculares da revisão inicial continuam coerentes; mudar a flexão ilustrativa
  para 20 graus não implica copiar resultados da variante experimental de
  cotovelo muito flexionado, nem eliminar o trapézio do cadastro.
- [ACE, Bicep Curl](https://www.acefitness.org/resources/everyone/exercise-library/70/bicep-curl/)
  e [ACE, Hammer Curl](https://www.acefitness.org/resources/everyone/exercise-library/10/hammer-curl/):
  referências técnicas para cotovelos próximos do corpo, tronco estável e punhos
  alinhados. O martelo mantém pegada neutra e evita elevar os ombros. As pistas
  orientam a demonstração estrita; não significam que qualquer pequena variação
  individual seja patológica.
- [Coratella et al., 2023](https://doi.org/10.3390/sports11030064) e
  [Uysal et al., 2026](https://doi.org/10.1186/s13102-026-01867-7): fontes
  primárias da classificação das roscas já consultadas na revisão inicial.
  A correção do eixo não muda participantes nem justifica ênfase entre cabeças
  do bíceps ou percentuais de ativação.

## Causa e implementação

Nas roscas, a posição do cotovelo já era estável, mas o giro axial do úmero era
calculado usando o produto vetorial dos dois segmentos do braço. Perto da
extensão, o antebraço cruzava o alinhamento do úmero e o referencial mudava de
lado. Isso girava visualmente bíceps e tríceps mesmo sem deslocar o cotovelo.
Testar somente posições e comprimentos não detectava o erro.

Agora o braço superior usa um referencial estável, independente da mão. O
antebraço permanece no lado de flexão do cotovelo durante toda a repetição.
Sua orientação de preensão continua distinta entre supinada e neutra. O pequeno
posicionamento anterior do braço preserva espaço à frente das coxas, sem giro
ou balanço do tronco. Amplitudes são escolhas editoriais do avatar.

Na lateral, a antiga rotação da escápula ao redor do meio do tórax, somada à
translação vertical, levantava o ponto do ombro aproximadamente 9 cm. Agora o
controle angular usa o ponto do ombro como pivô e não acrescenta elevação linear.
O cotovelo mantém cerca de 20 graus de flexão. O trapézio continua secundário no
mapa: evitar encolhimento não equivale a eliminar sua participação.

No militar, a barra termina acima da cabeça e segue uma linha contínua, sem a
mudança tardia para trás da trajetória anterior. Um controle cervical local ao
visualizador permite recuo máximo ilustrativo de 5,5 cm, com transições suaves
e retorno à posição neutra quando a barra ultrapassa a cabeça. Esse valor é uma
adaptação geométrica ao avatar, não uma instrução clínica individual.

O novo controle usa os mesmos vértices e canais de skinning do modelo; redistribui
somente parte do peso do tórax na cabeça/pescoço da cópia do visualizador. Não
altera topologia, UVs, cores, mapas musculares, arquivo GLB, checksum ou licença.
Nos outros exercícios, acompanha exatamente a transformação do tronco. Supino,
agachamento, remada unilateral e desenvolvimento sentado têm regressões desse
encaixe, inclusive quando o tronco se inclina.

## Cadastro e entrega

Os seis cadastros persistidos foram consultados e comparados com os JSONs e
classificações musculares vigentes. Todos coincidem. As instruções já descrevem
desenvolvimento acima dos ombros, leve flexão na lateral, cotovelos estáveis nas
roscas e respectivas pegadas. Nenhum participante, nome, papel, região ou ênfase
precisou mudar. Preservam-se esses cadastros e mapas explícitos. Esta correção é
de cinemática/rig; não exige migration nem mudança no contrato HTTP.

## Verificação

Quatro casos de regressão falharam na versão anterior: as três identidades de
rosca giravam o úmero; a lateral elevava exageradamente o ombro. Agora os testes
conferem a orientação real do osso, o lado de flexão do cotovelo e a posição do
ombro, em vez de apenas comprimentos e contato da mão.

O teste de passagem da barra usa a geometria efetivamente deformada do rosto,
em 101 posições, com folga positiva para o eixo/cilindro da barra. O militar
termina com cabeça neutra e barra próxima da linha dos apoios. Outro teste compara
o desenvolvimento sentado aprovado em 41 posições, sem alteração de trajetória.
Pescoço e cabeça preservam seu encaixe nos demais exercícios.

Conferência visual: militar, lateral, duas roscas, desenvolvimento sentado e
supino, desktop 1440px e celular 390px, várias vistas e fases. Nenhum erro de
navegador, asset remoto ou transbordamento horizontal.

Resultado final: 964 testes aprovados em 112 arquivos; ESLint dos arquivos
alterados e build de produção aprovados. Conferência de leitura no banco da
aplicação confirmou que os seis cadastros continuam equivalentes às revisões
vigentes, sem necessidade de alterar dados persistidos.
