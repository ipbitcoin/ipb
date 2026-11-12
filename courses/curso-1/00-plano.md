# Curso 1 · A Génese (versão online, sem PowerPoint)

**Estado:** as 20 lições estão escritas em HTML, em `html/`. O Markdown antigo ficou em `rascunhos-md/` (já não é a versão de referência).

**Promessa do curso:** no fim, a pessoa percebe porque é que o dinheiro perde valor, o que a Bitcoin propõe como alternativa, e sabe o que lhe podem pedir quando decidir comprar. O curso **não guia a compra**.

**Formato:** autoestudo, ~3 h, 20 lições em páginas web (5–12 min cada), com reflexão, ideia-chave, quizzes e fontes.

**Convenção de escrita:** tratamento por «tu»; «a Bitcoin» para a rede e o protocolo, «o Bitcoin» para o ativo.

## Lições

| # | Ficheiro | Min |
|---|---|---|
| 0.1 | `0.1-antes-de-comecar.html` | 5 |
| 0.2 | `0.2-ponto-de-partida.html` | 5 |
| 1.1 | `1.1-porque-precisamos-de-dinheiro.html` | 8 |
| 1.2 | `1.2-evolucao-do-dinheiro.html` | 10 |
| 1.3 | `1.3-quem-controla-a-moeda.html` | 10 |
| 1.4 | `1.4-dinheiro-e-tempo.html` | 7 |
| 2.1 | `2.1-o-euro-fisicamente.html` | 8 |
| 2.2 | `2.2-inflacao.html` (calculadora) | 12 |
| 2.3 | `2.3-o-que-mudou-em-1971.html` (gráficos com dados FRED) | 10 |
| 2.4 | `2.4-de-onde-vem-o-dinheiro-novo.html` | 10 |
| 2.5 | `2.5-quem-recebe-primeiro.html` | 10 |
| 3.1 | `3.1-o-que-e-a-bitcoin.html` (conversor de sats) | 10 |
| 3.2 | `3.2-antes-de-satoshi.html` | 10 |
| 3.3 | `3.3-escassez-digital.html` (simulador de gasto duplo) | 10 |
| 3.4 | `3.4-o-que-da-valor-ao-bitcoin.html` | 12 |
| 3.5 | `3.5-riscos-e-criticas.html` | 12 |
| 4.1 | `4.1-onde-se-compra.html` | 10 |
| 4.2 | `4.2-o-que-te-podem-pedir.html` | 10 |
| 4.3 | `4.3-golpes-e-seguranca.html` | 10 |
| 5.1 | `5.1-revisao-e-proximos-passos.html` (revê as respostas da 0.2) | 10 |

## Ficheiros partilhados

- `html/lesson.css`: estilo, na identidade do site do IPB.
- `html/lesson.js`: reflexões, quizzes, listas de verificação, conversor de sats, calculadora, simulador, lição concluída. O estado fica só no browser (localStorage).

## Para rever à mão

- Procurar `CONFIRMAR` nos ficheiros: factos a validar numa fonte antes de publicar (`grep -rn CONFIRMAR html/`).
- Procurar `LIGAÇÃO` e `DECIDIR`: ligações em falta (Curso 2, Curso 3, recursos, feedback) e a decisão de onde fica guardado o progresso.
- Números que mudam com o tempo (BCE, FRED, preço do Bitcoin, registo da ESMA) têm a data da consulta na secção de fontes.

## Decisões em aberto

1. **Acesso:** pago, gratuito ou misto? Há login de alunos?
2. **Progresso:** guardar no browser (como agora) ou na conta da pessoa?
3. **Onde vive o conteúdo:** ficheiros no repositório ou base de dados (Convex)?
4. **Idiomas:** só português, ou também inglês?
5. **Certificado:** automático ao completar o quiz final, ou à parte?
6. **Página do curso e ligações:** o índice das lições, e as ligações para os cursos 2 e 3.
