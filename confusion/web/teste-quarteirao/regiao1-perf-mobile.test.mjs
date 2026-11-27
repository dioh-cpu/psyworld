import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LIMITE_VIDEOS_MOBILE,
  LIMITE_VIDEOS_DESKTOP,
  coletarClipesBatalha,
  criarPoolVideos,
} from './regiao1-perf-mobile.js';

function fakeVideoFactory() {
  const criados = [];
  const criar = (url) => {
    const v = {
      url,
      src: url,
      paused: false,
      loaded: 0,
      removedSrc: false,
      pause() { this.paused = true; },
      removeAttribute(attr) { if (attr === 'src') { this.src = ''; this.removedSrc = true; } },
      load() { this.loaded += 1; },
    };
    criados.push(v);
    return v;
  };
  return { criar, criados };
}

test('coletarClipesBatalha seleciona somente os clipes do time e dos inimigos atuais, sem duplicatas', () => {
  const b = {
    aliados: [
      { especie: 'Ignavor', kit: [{ id: 'brasa_imperial', tipo: 'dano', elemento: 'fogo' }, { id: 'juba_flamejante', tipo: 'dano', elemento: 'fogo' }] },
      { especie: 'Vaelith', kit: [{ id: 'pulso_astral', tipo: 'dano', elemento: 'agua' }] },
    ],
    inimigos: [
      { especie: 'Fanalino', kit: [{ id: 'ferrao_fanalino', tipo: 'dano', elemento: 'inseto' }] },
      { especie: 'Ignavor', kit: [{ id: 'brasa_imperial', tipo: 'dano', elemento: 'fogo' }] },
    ],
    esperaI: [
      { especie: 'Cervomusgo', kit: [{ id: 'espinho_cervo', tipo: 'apoio', elemento: 'planta', cura: 0.2 }] },
    ],
  };

  const urls = coletarClipesBatalha(b);
  assert.ok(urls.length >= 3, 'Deve coletar clipes para o time e inimigos da batalha');
  assert.equal(new Set(urls).size, urls.length, 'URLs devem ser únicas');
  assert.ok(urls.every((u) => u.endsWith('.mp4')), 'Todos os clipes coletados devem apontar para .mp4');
});

test('criarPoolVideos aplica limite LRU de vídeos em memória e libera buffers ao evictar e encerrar batalha', () => {
  const { criar, criados } = fakeVideoFactory();
  const pool = criarPoolVideos({ maxMemoria: 3, mobile: true, criarElemento: criar });

  const inseridas1 = pool.precarregarUrls(['a.mp4', 'b.mp4', 'c.mp4', 'd.mp4']);
  assert.deepEqual(inseridas1, ['a.mp4', 'b.mp4', 'c.mp4']);
  assert.equal(pool.estatisticas().ativos, 3);
  assert.equal(pool.estatisticas().totalEvictados, 0);

  // Tocar 'a.mp4' renova LRU; inserir 'd.mp4' evicta 'b.mp4' e libera src/decoder
  pool.precarregarUrls(['a.mp4']);
  pool.precarregarUrls(['d.mp4']);
  const st = pool.estatisticas();
  assert.equal(st.ativos, 3);
  assert.deepEqual(st.urls, ['c.mp4', 'a.mp4', 'd.mp4']);
  assert.equal(st.totalEvictados, 1);

  const evictado = criados.find((v) => v.url === 'b.mp4');
  assert.equal(evictado.paused, true);
  assert.equal(evictado.removedSrc, true);
  assert.ok(evictado.loaded >= 1);

  // Ao sair da batalha no celular, libera todos os decoders
  pool.liberarTodos(0);
  assert.equal(pool.estatisticas().ativos, 0);
  assert.equal(LIMITE_VIDEOS_MOBILE, 6);
  assert.equal(LIMITE_VIDEOS_DESKTOP, 10);
});
