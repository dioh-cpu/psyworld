/* PSYWORLD physical module: world */
window.PSY.registerModePackage("world", {
  icon:"🌍",
  name:"WORLD",
  desc:"Exploração em primeira pessoa, Pokémon no mapa e combate World.",
  entry:["enterWorldMode"],
  deps:["bundles/v15-album-gym.js", "bundles/v19-consolidated.js", "bundles/v20-systems.js", "bundles/v47-survivor-hunts.js", "bundles/v50-compat.js"]
});
