/* PSYWORLD — temporary wild-hunt rifts shared by the existing Kanto maps. */
(function (W) {
  'use strict';
  if (W.PsyKantoHuntRiftV1) return;

  const RULES = Object.freeze({
    chance: 0.08,
    offerLifetimeMs: 90_000,
    offerCooldownMs: 180_000,
    durationMs: 180_000,
    freezeMs: 700,
    spotRespawnMinMs: 3_500,
    spotRespawnMaxMs: 5_500
  });
  const memory = { offer: null, session: null, nextId: 0, lastOfferAt: -Infinity };
  const validRegion = value => value === 'route' || value === 'dungeon';

  function copyOffer(value) {
    return value ? { id:value.id, owner:value.owner, expiresAt:value.expiresAt, context:{...value.context} } : null;
  }

  function tryOffer(owner, context, now = Date.now(), roll = Math.random()) {
    if (!context || context.won !== true || context.trainer === true || !validRegion(context.kind)) return null;
    if (memory.session || memory.offer || now - memory.lastOfferAt < RULES.offerCooldownMs || roll >= RULES.chance) return null;
    const offer = {
      id: 'kanto-rift-' + (++memory.nextId),
      owner,
      expiresAt: now + RULES.offerLifetimeMs,
      context: {
        world: String(context.world || ''),
        kind: context.kind,
        x: Number(context.x) || 0,
        y: Number(context.y) || 0,
        direction: String(context.direction || 'down'),
        autoHunt: context.autoHunt === true
      }
    };
    memory.offer = offer;
    memory.lastOfferAt = now;
    return copyOffer(offer);
  }

  function getOffer(owner, now = Date.now()) {
    if (memory.offer && now >= memory.offer.expiresAt) memory.offer = null;
    return memory.offer?.owner === owner ? copyOffer(memory.offer) : null;
  }

  function enter(owner, id, origin, now = Date.now()) {
    const offer = getOffer(owner, now);
    if (!offer || offer.id !== id || memory.session) return null;
    memory.offer = null;
    memory.session = {
      id: offer.id,
      owner,
      origin,
      enteredAt: now,
      deadline: now + RULES.durationMs,
      phase: 'active',
      closeAt: 0
    };
    return memory.session;
  }

  function status(session, now = Date.now()) {
    if (!session || memory.session !== session) return { phase:'inactive', remainingMs:0 };
    if (session.phase === 'active' && now >= session.deadline) {
      session.phase = 'closing';
      session.closeAt = now + RULES.freezeMs;
    }
    if (session.phase === 'closing' && now >= session.closeAt) {
      return { phase:'return', remainingMs:0, origin:session.origin };
    }
    return {
      phase: session.phase,
      remainingMs: Math.max(0, session.deadline - now),
      origin: session.origin
    };
  }

  function finish(session) {
    if (!session || memory.session !== session) return null;
    memory.session = null;
    return session.origin;
  }

  function leave(session) { return finish(session); }

  function clearOffer(owner, id) {
    if (memory.offer && memory.offer.owner === owner && (!id || memory.offer.id === id)) {
      memory.offer = null;
      return true;
    }
    return false;
  }

  W.PsyKantoHuntRiftV1 = {
    version: 1,
    rules: RULES,
    tryOffer,
    getOffer,
    enter,
    status,
    finish,
    leave,
    clearOffer,
    _resetForTests() { memory.offer = null; memory.session = null; memory.lastOfferAt = -Infinity; memory.nextId = 0; }
  };
})(window);
