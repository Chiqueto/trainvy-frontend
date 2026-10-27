# Fila de implementa??o 3D

Plano editorial versionado para os 266 exerc?cios cadastrados. A prioridade considera cobertura dos b?sicos, reaproveitamento de bases aprovadas e complexidade de anima??o; n?o representa estat?stica de uso nem prescri??o de treino.

O manifesto can?nico ? `trainvy-api/src/domain/exercise-3d-priority.json`, indexado pelo ID de cada exerc?cio. O admin l? esse plano pela API. N?o exige migra??o de banco. Novos IDs sem planejamento aparecem como ?Sem prioridade definida?.

A fila exibida no admin exclui exerc?cios cujo 3D j? ? suportado pelo registro real do visualizador. As posi??es s?o calculadas no cat?logo inteiro antes dos filtros; filtros n?o renumeram a fila. A ordem planejada abaixo ? est?vel, inclusive para itens j? dispon?veis. IDs equivalentes n?o criam trabalho duplicado: validar aliases antes de produzir nova anima??o.

## P1 ? B?sicos essenciais (44 cadastros)

### Base j? dispon?vel

Manter a anima??o existente; validar as variantes e os m?sculos sem criar outra anima??o equivalente.

| Ordem planejada | Exerc?cio | ID |
| --- | --- | --- |
| 1 | Supino Reto com Barra | 00000000-0000-4000-8000-000000000101 |
| 2 | Supino Reto | 00000000-0000-4000-8000-000000000102 |
| 3 | Agachamento Livre | 00000000-0000-4000-8000-000000000105 |
| 4 | Agachamento | 00000000-0000-4000-8000-000000000106 |

### Supinos e crucifixos essenciais

Completar os b?sicos de peito aproveitando banco, barra e pose do supino; revisar trajet?ria, pegada e equipamento por variante.

| Ordem planejada | Exerc?cio | ID |
| --- | --- | --- |
| 5 | Supino Inclinado com Halteres | 00000000-0000-4000-8000-000000000103 |
| 6 | Supino Inclinado | 00000000-0000-4000-8000-000000000104 |
| 7 | Supino Declinado com Barra | eb910207-283c-414d-8d37-7c6b6d7de0d8 |
| 8 | Supino Reto com Halteres | 6ef90b25-cd99-4860-8933-ae29e4d1f3d8 |
| 9 | Crucifixo na Máquina — aliases: peck deck, pec deck, voador | b9859cd9-6ed6-4e63-8fd0-500e8cf8d553 |
| 10 | Crucifixo Reto com Halteres | d555deb1-6eef-436d-8377-9427ac267697 |
| 11 | Supino Reto na Máquina | f3e5e1cf-d232-4a80-87b3-9f35650a1b5e |
| 12 | Supino Reto no Smith | f5a99b5a-74d1-4622-880e-bcf24758dc31 |

### Pernas essenciais

Cobrir os equipamentos e padr?es b?sicos de pernas; criar apoios e trajet?rias pr?prios antes das varia??es.

| Ordem planejada | Exerc?cio | ID |
| --- | --- | --- |
| 13 | Cadeira Extensora | 00000000-0000-4000-8000-000000000110 |
| 14 | Cadeira Flexora | 00000000-0000-4000-8000-000000000111 |
| 15 | Mesa Flexora | 00000000-0000-4000-8000-000000000112 |
| 16 | Agachamento no Smith | d3b3f492-65fa-4038-851f-6f46b69e9fb4 |
| 17 | Agachamento Hack na Máquina | 7bd5b49f-252c-43a2-83a8-816d6401f6cb |
| 18 | Leg Press 45 | 00000000-0000-4000-8000-000000000108 |
| 19 | Leg Press Horizontal | 00000000-0000-4000-8000-000000000109 |
| 20 | Stiff | 00000000-0000-4000-8000-000000000113 |
| 21 | Elevação Pélvica | 00000000-0000-4000-8000-000000000114 |
| 22 | Agachamento Goblet | 9e9f7973-098d-432d-8745-ee8c126fe576 |
| 23 | Agachamento Sumô com Halter | 67ed4623-adca-4008-8ecb-ccf19808a5f4 |
| 24 | Levantamento Terra | 00000000-0000-4000-8000-000000000140 |
| 25 | Levantamento Terra Sumô | 00000000-0000-4000-8000-000000000141 |
| 26 | Panturrilha em Pé | 00000000-0000-4000-8000-000000000117 |
| 27 | Panturrilha Sentado | 00000000-0000-4000-8000-000000000118 |

### Puxar e empurrar essenciais

Criar bases de puxada, remada e desenvolvimento com apoios est?veis e m?os alinhadas ao implemento.

| Ordem planejada | Exerc?cio | ID |
| --- | --- | --- |
| 28 | Puxada Frontal na Máquina | 00000000-0000-4000-8000-000000000119 |
| 29 | Puxada Frontal | 00000000-0000-4000-8000-000000000120 |
| 30 | Remada Baixa no Cabo com Triângulo | 120f29ac-733c-478b-8aa9-a3f4c22f5e70 |
| 31 | Remada Sentada na Máquina | 43025392-0466-46e7-82ab-27888d53f929 |
| 32 | Remada Curvada com Barra | 00000000-0000-4000-8000-000000000121 |
| 33 | Remada Curvada | 00000000-0000-4000-8000-000000000122 |
| 34 | Remada Unilateral com Halteres | 00000000-0000-4000-8000-000000000138 |
| 35 | Desenvolvimento Militar | 00000000-0000-4000-8000-000000000123 |
| 36 | Desenvolvimento com Halteres | 00000000-0000-4000-8000-000000000124 |
| 37 | Elevação Lateral | 00000000-0000-4000-8000-000000000125 |

### Bra?os essenciais

Ampliar a cobertura b?sica com trajet?rias simples de cotovelo; evitar tor??o do antebra?o e do punho.

| Ordem planejada | Exerc?cio | ID |
| --- | --- | --- |
| 38 | Rosca Direta com Barra | 00000000-0000-4000-8000-000000000127 |
| 39 | Rosca Direta | 00000000-0000-4000-8000-000000000128 |
| 40 | Rosca Martelo | 00000000-0000-4000-8000-000000000129 |
| 41 | Rosca Scott | 00000000-0000-4000-8000-000000000130 |
| 42 | Tríceps Corda | 00000000-0000-4000-8000-000000000131 |
| 43 | Tríceps Testa | 00000000-0000-4000-8000-000000000132 |
| 44 | Tríceps no Cabo com Barra Reta | 044421ae-d368-47a5-83e0-2af37dc61131 |

## P2 ? Completar muscula??o e core (105 cadastros)

### Varia??es de supino e peito

Derivar das bases de peito ap?s aprova??o, com ajuste de banco, polia, amplitude e pegada por exerc?cio.

| Ordem planejada | Exerc?cio | ID |
| --- | --- | --- |
| 45 | Supino Declinado com Halteres | d8e07a71-16ec-4ed8-8236-861a26c869e8 |
| 46 | Supino Inclinado no Smith | cf30614a-819d-42ee-8dfd-5564f9ea9da2 |
| 47 | Supino Declinado no Smith | d0a2d0cf-c6b3-4bfb-889e-82ccd3701ede |
| 48 | Supino Inclinado na Máquina | acfb67be-5a99-4243-8e26-2a489031d177 |
| 49 | Crucifixo no Cabo na Altura do Peito | 46e31e5f-585b-4a3b-8b06-f6bed13440b5 |
| 50 | Crossover no Cabo Alto | daf02b04-9308-4b8f-8047-d4a5bb86d079 |
| 51 | Crucifixo no Cabo Baixo | dd8854e2-5652-4ffb-86bc-dbf61b42bd04 |
| 52 | Flexão de Braços | 38c1d513-124b-4952-8187-003f50f8c7c1 |
| 53 | Flexão de Braços com Joelhos Apoiados | 9a83be35-3b36-4f1a-8bd3-cfc7cb78f772 |
| 54 | Flexão de Braços com Mãos Elevadas | 64c13c24-240c-44d8-88db-d52af9063792 |
| 55 | Flexão de Braços com Pés Elevados | f4b8fc60-0e9a-4fb6-8e1b-f40d56f442c0 |
| 56 | Pullover com Halter | 36ed79fa-48ce-40f9-8f78-7e84aa9db1e7 |

### Varia??es de remada e puxada

Reaproveitar os padr?es de puxar ap?s aprova??o, preservando apoio do tronco e diferen?as de pegada.

| Ordem planejada | Exerc?cio | ID |
| --- | --- | --- |
| 57 | Barra Fixa | 00000000-0000-4000-8000-000000000136 |
| 58 | Remada Cavalinho | 00000000-0000-4000-8000-000000000137 |
| 59 | Remada Baixa no Cabo com Barra Aberta | 98a489f1-67d6-4c87-8189-d83515ccf603 |
| 60 | Remada com Halteres e Peito Apoiado | 617b5657-d614-4b67-8e2d-6a21f36bd87a |
| 61 | Remada Unilateral na Máquina | 98109c9e-b7c6-44f3-8f36-7ffade02de5d |
| 62 | Puxada Frontal com Pegada Neutra | 21ed0c47-601a-408b-882f-8428fb62a1a2 |
| 63 | Puxada Frontal com Pegada Supinada | d8ce4a79-d54b-40bc-878c-85f013b32d14 |
| 64 | Puxada Unilateral no Cabo | 4825e2e4-b78b-4454-804a-1aab1e660040 |
| 65 | Pulldown com Braços Estendidos no Cabo | 3a5808f6-f68c-4484-8531-27875ae9ad1a |
| 66 | Barra Fixa com Pegada Supinada — alias: chin-up | d2786802-f941-4c55-8ee2-9a0135943722 |
| 67 | Barra Fixa com Pegada Neutra | 30f83a25-de8c-45a5-859a-52f44e803cd3 |
| 68 | Barra Fixa Assistida na Máquina | 4424e219-f3ac-4da1-86d4-20da69609ce4 |
| 69 | Remada Invertida na Barra | 8453d0f7-44fd-4468-8c87-6015fce80862 |
| 70 | Remada Pendlay | 1eef7876-e093-42af-8374-00d3b105c47a |

### Unilaterais e acess?rios de pernas

Expandir as bases de pernas com deslocamento, equil?brio unilateral e equipamentos espec?ficos.

| Ordem planejada | Exerc?cio | ID |
| --- | --- | --- |
| 71 | Agachamento Búlgaro | 00000000-0000-4000-8000-000000000107 |
| 72 | Cadeira Abdutora | 00000000-0000-4000-8000-000000000115 |
| 73 | Cadeira Adutora | 00000000-0000-4000-8000-000000000116 |
| 74 | Agachamento Frontal | 00000000-0000-4000-8000-000000000142 |
| 75 | Leg Press Unilateral | 00000000-0000-4000-8000-000000000145 |
| 76 | Avanço com Halteres | 00000000-0000-4000-8000-000000000152 |
| 77 | Agachamento com Peso Corporal — alias: air squat | 2209d4ec-7807-4bd1-8e37-d622b4a5c15c |
| 78 | Agachamento no Banco — alias: box squat | 3c7f1815-4037-4186-8781-24c5762bcc6f |
| 79 | Agachamento Zercher | 44bb63b7-0071-4a2f-8db8-a8dfa60ff41d |
| 80 | Agachamento no Belt Squat | 17e716eb-2e73-478a-8322-d255b6b4430e |
| 81 | Agachamento no Pêndulo | 641ee20a-34bc-4a42-8b68-6fe359486362 |
| 82 | Afundo Estático com Halteres | 440bc1d0-d61c-40e8-875f-7c394b2c5709 |
| 83 | Afundo Reverso com Halteres | dbeed6b0-ebce-4e76-81e5-c037bda6d3ce |
| 84 | Afundo Lateral com Halter | 31804968-a951-475a-8aa1-83570459c21b |
| 85 | Step-up com Halteres | a32fd931-69aa-4dbb-8d3d-d39cdc500b64 |
| 86 | Levantamento Terra com Trap Bar | 0d8f6761-8c33-4f1e-8431-cce66916b538 |
| 87 | Levantamento Terra Romeno com Barra | 42f92003-f632-49aa-8835-19cc8bfac9f5 |
| 88 | Levantamento Terra Romeno Unilateral com Halter | cd5fd328-8e17-47d9-86de-b758e45093cc |
| 89 | Good Morning com Barra | c16917f8-68a4-40c1-82c7-e2d759e91d32 |
| 90 | Flexão de Joelhos em Pé na Máquina | 3ba6f7c5-b215-4a21-88e8-02720b9d037f |
| 91 | Flexão de Joelhos Unilateral na Máquina | c2d006d8-760c-41a0-841d-e7a5cc1662c4 |
| 92 | Flexão Nórdica de Posteriores — alias: Nordic curl | 05bf3c93-d537-4db2-8fc1-055532d7cee8 |
| 93 | Flexão de Joelhos com Bola Suíça | dbe65f9f-d436-4213-87b5-dc9a6b11bc18 |
| 94 | Ponte de Glúteos no Solo | bc663624-eab4-43ab-80eb-7c530a941263 |
| 95 | Elevação Pélvica Unilateral | 5822bf41-eb84-4302-8060-55a5795976de |
| 96 | Extensão de Quadril no Cabo | 7ed07fa5-1795-4f7a-82d0-c9a6527664c7 |
| 97 | Abdução de Quadril no Cabo | 4df4c443-be27-4ea3-8eee-37c5f8cd0f2f |
| 98 | Adução de Quadril no Cabo | 95f4fdc6-a175-4cc3-87af-30bf83da5b4e |
| 99 | Caminhada Lateral com Miniband | 6804cb1a-45c0-4c06-8f30-bbd80035f358 |
| 100 | Panturrilha no Leg Press | bd5ec77b-1186-4044-8cfe-26b8d1fe22fa |
| 101 | Panturrilha Unilateral em Pé | b7340583-e68f-4bdd-82cf-9230e6e9c50e |
| 102 | Elevação de Tibial Anterior | 397bacc0-d167-4382-883b-71fe6a9b5c56 |

### Ombros e bra?os complementares

Completar a muscula??o tradicional com ajustes espec?ficos de polia, banco e alinhamento articular.

| Ordem planejada | Exerc?cio | ID |
| --- | --- | --- |
| 103 | Crucifixo Inverso na Máquina | 00000000-0000-4000-8000-000000000126 |
| 104 | Tríceps Francês Unilateral | 00000000-0000-4000-8000-000000000133 |
| 105 | Paralelas | 00000000-0000-4000-8000-000000000134 |
| 106 | Crucifixo Inclinado | 00000000-0000-4000-8000-000000000135 |
| 107 | Rosca Concentrada | 00000000-0000-4000-8000-000000000139 |
| 108 | Remada Alta com Barra | 00000000-0000-4000-8000-000000000143 |
| 109 | Desenvolvimento Arnold | 00000000-0000-4000-8000-000000000146 |
| 110 | Face Pull no Cabo | 00000000-0000-4000-8000-000000000147 |
| 111 | Elevação Lateral no Cabo | 00000000-0000-4000-8000-000000000148 |
| 112 | Encolhimento com Halteres | 00000000-0000-4000-8000-000000000149 |
| 113 | Rosca Spider | 00000000-0000-4000-8000-000000000153 |
| 114 | Desenvolvimento de Ombros na Máquina | 41023d42-af49-48cf-878e-d08d0d3b771c |
| 115 | Desenvolvimento de Ombros no Smith | 675d2496-c092-4329-8340-29d95f83219f |
| 116 | Elevação Frontal com Halteres | 3882a123-5b3b-42e4-8ea5-3aff3f92b04a |
| 117 | Elevação Lateral na Máquina | 4e2154e2-910d-41ba-8038-b383bf329bc1 |
| 118 | Crucifixo Inverso com Halteres | a76c891b-132d-4cf5-8a58-9da775363a78 |
| 119 | Crucifixo Inverso no Cabo | daa5b03b-a7dc-4842-8747-534265fce3f2 |
| 120 | Encolhimento com Barra | cd312278-5101-4faa-8c74-99f2209ebdca |
| 121 | Rosca Alternada com Halteres | e3cfb752-222b-4b62-8062-003e7083abf2 |
| 122 | Rosca Inclinada com Halteres | 8124966b-3c55-4b28-8388-06e0bbaeb282 |
| 123 | Rosca Direta no Cabo | 77e16d7c-c515-4066-88f0-93db502b89f2 |
| 124 | Rosca Scott na Máquina | 16d9c6f7-ebb7-41d1-8743-ff22fdd72748 |
| 125 | Rosca Inversa com Barra | c82dab5c-092b-4b44-8cca-6c680ef85f92 |
| 126 | Rosca de Punho com Barra | 9576aba7-3aff-4186-81e0-162e76d4be50 |
| 127 | Extensão de Punho com Barra | 1ce3e560-1665-4bd5-8998-aa8f4f50011c |
| 128 | Tríceps Unilateral no Cabo | 89f594ac-082e-4ff9-8d6b-c1cb58c9717e |
| 129 | Tríceps Acima da Cabeça no Cabo | 19f34820-3730-4fde-8c3e-07b2545995cf |
| 130 | Tríceps Coice com Halter | 6426af45-7406-4592-86c5-4ac86b2a29aa |
| 131 | Supino com Pegada Fechada | c24102f2-9302-4083-851f-bf5c69c4dff8 |
| 132 | Paralelas Assistidas na Máquina | 17fc44bd-4fbf-4655-82ad-07edff42c306 |

### Core e estabilidade

Criar posi??es no solo e padr?es de estabilidade antes de movimentos suspensos ou din?micos complexos.

| Ordem planejada | Exerc?cio | ID |
| --- | --- | --- |
| 133 | Prancha Ventral | 4f96bada-30e1-4260-8512-5b6de0e44704 |
| 134 | Prancha Lateral | f8d7befb-6c87-4b40-8acb-c5801f3bad63 |
| 135 | Dead Bug | 8dcbf19a-e30c-4f40-8c2a-7b7d7cbb73dd |
| 136 | Bird Dog | 7617482f-8291-4235-86bf-3aef1ef1f49a |
| 137 | Abdominal Crunch no Solo | d1bdfecd-0952-479c-87d5-9e50b8399d0f |
| 138 | Abdominal na Máquina | 35b154dd-b2de-4c9f-8994-f1177b052a40 |
| 139 | Abdominal com AbMat | c7a96602-149a-47de-843c-a0fe26c3583e |
| 140 | Abdominal Reverso | b42bbf72-2c53-418f-8541-3e278cf25146 |
| 141 | Pallof Press no Cabo | 4483cd2d-568f-4587-81b9-56ab954e8905 |
| 142 | Woodchop no Cabo Alto | d78e99b1-81df-4d20-8812-b7e15ebb199f |
| 143 | Hollow Hold | c96a2d1f-20c0-4beb-8e24-089758f2c9bf |
| 144 | Arch Hold — alias: Superman hold | 7e47d431-f834-461d-85f7-bbae415c34f9 |
| 145 | Roda Abdominal — alias: ab wheel rollout | ec214a71-5095-4781-8cc9-77313dfee7a5 |
| 146 | Elevação de Joelhos Suspenso | 62c994f3-0f6c-4d72-8dde-8c0ad09da90c |
| 147 | Hiperextensão Lombar | 00000000-0000-4000-8000-000000000144 |
| 148 | Abdominal no Cabo | 00000000-0000-4000-8000-000000000150 |
| 149 | Elevação de Pernas Suspenso | 00000000-0000-4000-8000-000000000151 |

## P3 ? Funcional e landmine: bases (29 cadastros)

### Landmine: fundamentos

Introduzir piv? da barra e trajet?rias do landmine antes de rota??es explosivas e movimentos combinados.

| Ordem planejada | Exerc?cio | ID |
| --- | --- | --- |
| 150 | Desenvolvimento Unilateral no Landmine — alias: single-arm landmine press | c9bbf500-c289-441e-8162-afef74d25237 |
| 151 | Desenvolvimento Bilateral no Landmine | ef1e3395-5f08-4c95-82ac-1a2bc5e099d1 |
| 152 | Desenvolvimento Unilateral Meio-Ajoelhado no Landmine | 26e45901-2ccc-46df-8188-cd3503830860 |
| 153 | Agachamento no Landmine | 566f3759-b346-4a4e-80b2-29618cda6dd1 |
| 154 | Remada Unilateral no Landmine | 3e962d98-1b67-4280-899f-d965e3c1e257 |
| 155 | Remada Meadows | 6f49e547-9500-4888-8b46-09736d07a169 |
| 156 | Levantamento Terra no Landmine | efa5ed74-0b27-4f99-89db-0546048b6b62 |
| 157 | Anti-Rotação no Landmine | 52b75b53-d5d9-4c4c-8929-aa6dece24b0d |

### Transportes e condicionamento

Criar marcha, ciclos cont?nuos e contato com implementos; ampliar cobertura funcional sem come?ar por acrobacias.

| Ordem planejada | Exerc?cio | ID |
| --- | --- | --- |
| 158 | Farmer Carry com Halteres | e3f4caca-9f77-4e1b-8388-a84e51e96474 |
| 159 | Suitcase Carry com Halter | 85c4058a-918d-4934-8c31-5383ac68b765 |
| 160 | Front Rack Carry com Kettlebells | b36d7169-2020-46fb-8394-b1b8db2a5b86 |
| 161 | Overhead Carry Unilateral | fe2d1f67-ec85-46bc-8d0b-0c3611adefca |
| 162 | Empurrar Trenó | cbc95d73-bdd6-4573-8d90-65c9dd256f62 |
| 163 | Puxar Trenó Caminhando para Trás | 28086afd-b431-453b-80f3-cca10db500a9 |
| 164 | Remo no Ergômetro | 22de6ad2-4b31-4de1-8bc1-e3591b4af04c |
| 165 | Bicicleta de Ar — alias: air bike | 5a6c9f8a-7c11-40cf-80de-c6cd688bce32 |
| 166 | SkiErg | ad10fe8f-b3c9-4b0a-83e5-d8aa6d82073f |
| 167 | Corrida | 86df7d73-c743-476e-8d46-719b916e17a9 |
| 168 | Sprint | 347a52f4-0233-4073-8d79-d01cfd6616d0 |
| 169 | Corrida de Ida e Volta — alias: shuttle run | ea1f87ba-f5c3-4c14-8ca3-670d4fb32c9b |
| 170 | Pular Corda com Giro Simples — alias: single-under | d5231b45-3579-4418-85dd-dc44d8b9d2a9 |
| 171 | Battle Rope com Ondas Alternadas | d8d95580-5871-4fa7-83b2-f85d353e1f4c |

### Kettlebell e halteres: bases

Criar balan?o, transfer?ncia de carga e movimentos din?micos b?sicos antes de snatches e transi??es complexas.

| Ordem planejada | Exerc?cio | ID |
| --- | --- | --- |
| 172 | Kettlebell Swing até a Altura dos Ombros — alias: Russian swing | 4a26d043-9e3e-4e16-891f-3e291bfed19e |
| 173 | Kettlebell Swing Unilateral | 4cca654e-e0cd-4d90-84be-053cab9e661b |
| 174 | Kettlebell Push Press Unilateral | 83b94d1b-77c7-4b0c-8881-7dc9974770b2 |
| 175 | Push Press com Halteres | 726bc1a0-a83d-4262-8898-791709f8c01f |
| 176 | Thruster com Barra | 5d74502e-8955-44ec-8e58-455dc39c8b1b |
| 177 | Thruster com Halteres | f88b41e8-2d6e-4042-895a-e57c803401d2 |
| 178 | Remada Renegade com Halteres | 42e439e0-6eca-416c-8d33-4bfa8d48ac36 |

## P4 ? Pot?ncia, saltos e LPO principal (56 cadastros)

### Saltos: apoios e aterrissagem

Validar sa?da do solo, fase a?rea e aterrissagem primeiro; somente depois derivar saltos reativos e unilaterais.

| Ordem planejada | Exerc?cio | ID |
| --- | --- | --- |
| 179 | Pogo Jump Bilateral | 2c1657df-13fa-4644-82e3-11a17bc6cb9d |
| 180 | Salto Vertical com Contramovimento | 5ec972bc-f8a0-47fd-8789-b9363ea28b84 |
| 181 | Salto Vertical Partindo de Agachamento — alias: squat jump | 28893c38-900f-4518-844f-93471a3e0f0c |
| 182 | Salto Horizontal Parado — alias: standing broad jump | 9d2667b4-14cc-4e63-8d4f-5a4757aaad74 |
| 183 | Drop Landing — queda da caixa com estabilização | c4ad50ca-6df3-4b61-83f0-02538c1507df |
| 184 | Salto na Caixa — alias: box jump | 87ef0649-841a-42c5-88c5-ae9447173c43 |
| 185 | Pogo Jump Unilateral | fc13b372-4454-459c-8cef-8e2242a23ebd |
| 186 | Salto Lateral Alternado — alias: skater jump | 78501398-5301-4325-8b2a-085c035b870e |
| 187 | Salto Unilateral para Frente | 67b27d44-92d8-4c58-8533-98967f89c92b |
| 188 | Saltos Alternados em Afundo — alias: split squat jump | 1aad0068-09c5-4f78-8e4d-38343326fa91 |

### Bolas e pot?ncia

Implementar soltura e trajet?ria da bola, alvo e retorno; cada lan?amento recebe coordena??o pr?pria.

| Ordem planejada | Exerc?cio | ID |
| --- | --- | --- |
| 189 | Arremesso de Peito com Medicine Ball na Parede | b79bd93b-72a4-443f-8c56-ebeee69d9d04 |
| 190 | Arremesso de Peito Sentado com Medicine Ball | 2d1fa957-9027-436f-8910-3c6f947a4fc1 |
| 191 | Slam Ball no Solo | 5b198859-1552-48f7-81d5-ad176ffbb367 |
| 192 | Wall Ball — agachamento com lançamento da bola ao alvo | cabc544c-fd0e-41f2-83b0-168605cd36b8 |
| 193 | Clean com Medicine Ball | 1d432b5a-29b4-4d71-847a-2608f6650fda |
| 194 | Arremesso Rotacional de Medicine Ball na Parede | da6137b3-c773-43f7-8b7c-fb0fbf2609b3 |
| 195 | Arremesso de Medicine Ball Acima da Cabeça para Frente | bda3b4e0-4244-4010-83e6-ac5841b228d2 |
| 196 | Arremesso de Medicine Ball para Trás Acima da Cabeça | 1b833278-06be-4ad0-831a-e87c85564521 |
| 197 | Slam Ball Rotacional | 0d3c8197-f719-4a93-8545-f00c52cec1a6 |

### Landmine: movimentos combinados

Combinar as bases aprovadas de landmine com impulso, rota??o e afundo sem reutilizar poses incompat?veis.

| Ordem planejada | Exerc?cio | ID |
| --- | --- | --- |
| 198 | Push Press Unilateral no Landmine | 8bdde5b9-d201-40ab-8198-3ac1fe77d63c |
| 199 | Press Rotacional Unilateral no Landmine | 37d17ee5-4fcd-45a0-8bd9-037a2c5f97bd |
| 200 | Agachamento com Press no Landmine | 45f82445-d2c4-4a74-858e-1b00f0fa178f |
| 201 | Afundo Reverso com Press Unilateral no Landmine | eef396ad-8271-463d-844a-a7023f64bd8e |

### LPO: prepara??o e movimentos principais

Construir posi??es e puxadas antes de recep??es, giros da barra e encaixes; power clean e clean completo t?m recep??es distintas.

| Ordem planejada | Exerc?cio | ID |
| --- | --- | --- |
| 202 | Overhead Squat | 8a0fa5b8-e102-4a6c-85c5-7a666d027296 |
| 203 | Clean Deadlift | 8b10ad1c-4bb1-44ed-8d89-b916185451a3 |
| 204 | Clean Pull | 4fb4e4e6-e685-4a72-8da4-9af02ce80afd |
| 205 | Clean High Pull | e94df5cc-688c-4894-8651-26bd0b7cd729 |
| 206 | Muscle Clean | f3f156f0-523e-45d9-83e8-026e8299292e |
| 207 | Hang Power Clean | 1b7764ca-1826-488e-8734-fc88117ed9dd |
| 208 | Power Clean | 828d2135-37b8-4e03-8936-1554e4b3e99f |
| 209 | Clean — aliases: squat clean, full clean | ee45732c-628c-4cb9-8386-b0a58b682fb1 |
| 210 | Hang Clean | c7b1bd07-08d9-4794-8588-0534a607ae50 |
| 211 | Push Press com Barra | 3f008308-7990-4c42-8008-56916d3be09e |
| 212 | Jerk Dip | ac8f7416-2631-427d-8368-d974889c1d14 |
| 213 | Jerk Drive | 1ad5f03c-0d81-4d28-8d0c-060726c06fb6 |
| 214 | Push Jerk | e5c85899-146d-49f8-8673-5c1c4e04eace |
| 215 | Split Jerk | a1a03a80-fdfe-4d0d-87ca-7b7a3d1b0a60 |
| 216 | Snatch Deadlift | c5443faf-a2b5-4ec7-8879-c6b1d38136e5 |
| 217 | Snatch Pull | 0dd16782-2671-4d6e-8cc8-7fa516b7a4c8 |
| 218 | Snatch High Pull | 30dc93d6-27a3-4a69-81e4-c936412ce6a0 |
| 219 | Muscle Snatch | 67697db2-773d-4120-8305-ffc5c2179f31 |
| 220 | Hang Power Snatch | 839f3abf-c126-4b5d-82f2-bcd3f5eea73c |
| 221 | Power Snatch | 4b5a6860-b5e5-4a5f-81db-ed2ffa42b8d0 |
| 222 | Snatch — aliases: squat snatch, full snatch | 1c9d749e-bcdc-46ef-8c61-8f6c62495ad3 |

### Funcional: transi??es e implementos

Expandir bases din?micas aprovadas com transi??es no solo e coordena??o com halteres e kettlebells.

| Ordem planejada | Exerc?cio | ID |
| --- | --- | --- |
| 223 | Kettlebell Swing Acima da Cabeça — alias: American swing | 1fd318ce-de48-455a-8e0a-e2ab9c45681e |
| 224 | Kettlebell Clean Unilateral | 7a2d55db-be0a-4318-8978-92d32d01c1e7 |
| 225 | Power Clean com Halteres | e70bbf0e-80d4-40ea-888c-8e0358c927ef |
| 226 | Hang Power Clean com Halteres | 1c57981e-05f6-498b-8975-2679a3c85d35 |
| 227 | Snatch Unilateral com Halter | 4291abd4-8b68-4b19-8223-27b5e9f2b4e8 |
| 228 | Burpee | 59be040d-c5ed-45bb-82c0-b8369829e019 |
| 229 | Burpee sobre a Barra | cfd75a15-4513-4f01-89a6-5fbd8ecd1574 |
| 230 | Remada nas Argolas | e63a558c-89d0-44ba-80ab-fdd2f3459092 |
| 231 | Paralelas nas Argolas | 9800a359-b8c3-4b4a-86d2-2e62a20b1d50 |
| 232 | Flexão de Braços nas Argolas | 270f8e74-11d1-4cfd-8219-98dbd47ff372 |
| 233 | Pistol Squat | 8d74b7a0-243a-42fd-8755-e984a7c62b22 |
| 234 | L-Sit nas Paralelas | 216cde22-ddf3-4f36-88ae-6ee918e2d221 |

## P5 ? Varia??es e habilidades avan?adas (32 cadastros)

### Saltos reativos e sequ?ncias

Exigem revis?o adicional de contatos sucessivos, obst?culos e aterrissagens; dependem das bases de salto.

| Ordem planejada | Exerc?cio | ID |
| --- | --- | --- |
| 235 | Saltos Horizontais Consecutivos | 90c19acb-1cfd-4da3-8a68-ac452ba58e5a |
| 236 | Salto por Cima da Caixa — alias: box jump-over | 97da65a9-0008-45a9-8779-865ae03c2a33 |
| 237 | Salto Lateral sobre Obstáculo | f2d4ada3-9397-4a5e-8939-9573a52e2961 |
| 238 | Saltos sobre Barreiras | a4cefb4f-37cf-4489-8343-c56af23bbfa8 |
| 239 | Depth Jump — queda da caixa seguida de salto | a1df9269-072d-411b-81b8-4197aa4a84c8 |
| 240 | Flexão Pliométrica | 5e4d8fc5-7566-41da-8589-7c4d90076292 |

### LPO: varia??es t?cnicas e complexos

Adicionar varia??es t?cnicas ap?s validar movimentos principais e suas recep??es; coordenar m?ltiplas fases sem deformar anatomia.

| Ordem planejada | Exerc?cio | ID |
| --- | --- | --- |
| 241 | Clean a Partir de Blocos | 625a2d84-4a60-4342-848a-bb176c4370df |
| 242 | Tall Clean | 214278a7-0fb9-4657-8774-73203eb7a0ab |
| 243 | Hang Snatch | d8ccf56a-3e42-4deb-8744-61a7bdba6a7a |
| 244 | Snatch a Partir de Blocos | e0f5d67f-493e-4352-834a-456560ecca2b |
| 245 | Tall Snatch | 88bd42c5-11d8-41cd-87e3-409c005751e4 |
| 246 | Snatch Balance | 708862bf-1e56-437b-8ef8-fff5c581fdde |
| 247 | Squat Jerk | 82e5d50e-7651-4f1c-88a4-424ad0354896 |
| 248 | Clean and Jerk | 8b4a7da1-fc99-46b6-82ce-22b7f575d709 |

### Kettlebell: coordena??o avan?ada

Revisar recep??o no antebra?o, passagem do implemento e transi??es antes de aprovar movimentos compostos.

| Ordem planejada | Exerc?cio | ID |
| --- | --- | --- |
| 249 | Kettlebell Snatch Unilateral | 319d60a2-9774-4b56-85e7-4649cf2d23d7 |
| 250 | Kettlebell Jerk Unilateral | 2451bd48-05fb-473e-80cb-b0479bee48f5 |
| 251 | Turkish Get-up | defa9909-90f4-4278-8351-8bdab5f6b7d4 |
| 252 | Devil Press com Halteres | f0eeccc0-954b-454d-8aaa-c272830213e8 |

### Gin?stica din?mica e habilidades

Exigem suspens?o, balan?o, invers?o ou transi??o de apoio; validar m?os, contato e trajet?ria em todas as fases.

| Ordem planejada | Exerc?cio | ID |
| --- | --- | --- |
| 253 | Burpee com Salto por Cima da Caixa | 84d0c069-21f2-4660-8ba1-b47bb09b3e81 |
| 254 | Kipping Pull-up | 5c64df12-58dd-4840-8494-54b6fe10b54b |
| 255 | Butterfly Pull-up | 2ec2e5b6-c015-4d08-8d4d-9577c410f143 |
| 256 | Chest-to-Bar Pull-up | 3f882b66-3ba6-430c-8996-32179546dacd |
| 257 | Toes-to-Bar | a9c79cda-74c6-4fff-8b2a-01f3a0e4c91c |
| 258 | Knees-to-Elbows | eee0b56d-e70a-4c5f-8e33-32032f8b6c2f |
| 259 | Muscle-up na Barra | b034a035-e699-4b70-858f-9f131820545e |
| 260 | Muscle-up nas Argolas | 66f7980f-4e11-4bd7-8a38-c45d5fe23e29 |
| 261 | Handstand Push-up Estrito | 067c23df-07bc-4110-8022-e026d6697199 |
| 262 | Kipping Handstand Push-up | 87bb8075-09af-43d8-813d-19b257bb67eb |
| 263 | Wall Walk | df51e789-ae36-4ffc-8636-72e0d458ca4d |
| 264 | Handstand Walk | c9e30495-151c-4a1f-8e64-b5ea8ce767bb |
| 265 | Subida na Corda | eab742e2-9380-4dfa-86fc-459d84157b6c |

### Corda: giro duplo

Sincronizar dois giros da corda por salto ap?s validar o giro simples e o ciclo de aterrissagem.

| Ordem planejada | Exerc?cio | ID |
| --- | --- | --- |
| 266 | Pular Corda com Giro Duplo — alias: double-under | 3d8e35e1-3414-49c4-8100-923294135403 |

## Crit?rio de conclus?o

Prioridade n?o libera uma anima??o. Cada exerc?cio exige m?sculos principais e secund?rios expl?citos, equipamento correspondente, anatomia preservada e revis?o de todas as fases e ?ngulos. Cad?ncia controlada para movimentos de for?a; movimentos explosivos exigem trajet?ria e contatos espec?ficos. N?o usar automaticamente a anima??o de um exerc?cio para outra variante.
