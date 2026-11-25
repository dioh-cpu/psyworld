// Gera a lista de artes dos 50 sistemas (Markdown) a partir do catálogo confusion/web/mundo/artes.js.
// Uso: node tools/gerar_lista_artes.mjs [saida.md]
import { writeFileSync, existsSync } from 'node:fs';
import { ARTES, TIPOS_ARTE, ARTE_BASE, SISTEMAS_NO_MAPA } from '../confusion/web/mundo/artes.js';
import { SISTEMAS } from '../confusion/web/mundo/index.js';

const raiz = new URL('..', import.meta.url).pathname;
const nomes = Object.fromEntries(SISTEMAS.map((s) => [s.id, s.nome]));
const cont = {};
let total = 0, existentes = 0;
const L = [];
L.push('# Artes dos 50 sistemas do mundo', '');
L.push('Cada sistema tem um menu próprio no jogo (Menu → Mundo). Cada vaga abaixo já existe no menu como um polígono; **para colocar a arte, salve o arquivo com o nome exato na pasta indicada, em WebP**, e ela aparece sozinha, sem mexer em código.', '');
L.push('## Onde aparece', `- **No mapa (protótipo de polígono hoje):** ${SISTEMAS_NO_MAPA.join(', ')}. As vagas de sprite e marcador desses sistemas aparecem no mundo, nos mapas indicados no jogo, no tamanho do mapa; troque o polígono só salvando o arquivo.`, '- **Só no menu:** os outros 33 sistemas. As artes deles aparecem nas vagas do menu do sistema.', '');
L.push('## Conferir as entregas', '`python3 tools/validar_artes_mundo.py` confere nome, formato WebP, tamanho, proporção, fundo transparente e peso de cada arquivo em `assets/confusion/interface/mundo/`, avisa o nome certo quando o arquivo foi salvo errado e mostra o que falta. `--folha arquivo.png` gera uma folha de contato; `--sistema 05` confere só um sistema.', '');
L.push('## Estilo para todas', '- Tema Halloween do jogo: roxo escuro, laranja de abóbora, dourado, contorno forte e pintura digital limpa.', '- Mesmo estilo dos NPCs e retratos já feitos. Nada de texto dentro da imagem.', '- Fundo transparente onde a tabela diz "transparente"; senão a cena inteira.', '- Retratos: três versões por personagem (`-neutro`, `-serio`, `-sorriso`) só se a tabela pedir; por padrão, um único retrato neutro.', '');
L.push('## Formatos', '', '| Tipo | Tamanho | Fundo | Observação |', '|---|---|---|---|');
for (const [k, t] of Object.entries(TIPOS_ARTE)) L.push(`| ${k} | ${t.tam} | ${t.fundo} | ${t.nota} |`);
L.push('');
for (const s of ARTES) {
  L.push(`## ${s.id} · ${nomes[s.id]} ${s.emoji}`, `Pasta: \`${ARTE_BASE}${s.id}/\``, '', '| Arquivo | Tipo | Tamanho | O que desenhar | Já existe |', '|---|---|---|---|---|');
  for (const v of s.artes) {
    const ok = existsSync(`${raiz}${ARTE_BASE}${s.id}/${v.id}.webp`);
    total++; if (ok) existentes++; cont[v.tipo] = (cont[v.tipo] || 0) + 1;
    L.push(`| \`${v.id}.webp\` | ${v.tipo} | ${TIPOS_ARTE[v.tipo].tam} | ${v.nome}: ${v.desc} | ${ok ? 'sim' : 'não'} |`);
  }
  L.push('');
}
L.splice(2, 0, `**Total: ${total} artes** (${Object.entries(cont).map(([k, n]) => `${n} ${k}`).join(', ')}). Prontas: ${existentes}.`, '');
const saida = process.argv[2] || `${raiz}confusion/ARTES_MUNDO_50_SISTEMAS.md`;
writeFileSync(saida, L.join('\n'));
console.log(saida, total, JSON.stringify(cont));
