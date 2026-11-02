/* PSYWORLD physical module: Psy Idle */
window.PSY.registerModePackage("idleworld", {
  icon:"🌲",
  name:"PSY IDLE",
  desc:"Hunts top-down individuais com tileset original, colisão em grade, IA, habilidades e combate automático visível.",
  entry:["openIdleRealisticV2"],
  deps:["modes/idle-raid-rules-v1.js","modes/idle-realistic-v1.js","modes/idle-social-v1.js","modes/idle-trade-zone-v1.js","modes/idle-commerce-v1.js"]
});
