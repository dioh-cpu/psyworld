// Wildlands V154 — CC0 asset manifest.
// Models are loaded at runtime from Poly Pizza's static CDN.
// In-game names remain PSYWORLD's original fiction; these are visual source assets.

const quaternius = {
  author: 'Quaternius',
  license: 'CC0 1.0',
  licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
  catalog: 'Poly Pizza',
  catalogUrl: 'https://poly.pizza/'
};

const model = (modelUrl, sourceUrl, targetHeight) => ({ modelUrl, sourceUrl, targetHeight, author: quaternius.author, license: quaternius.license });

export const WILDLANDS_ASSETS = Object.freeze({
  attribution: quaternius,
  environment: {
    oak: model('https://static.poly.pizza/53a83125-e16a-4024-b8f6-1e72679c7ddf.glb', 'https://poly.pizza/m/etFGNvsiFv', 6.4),
    birch: model('https://static.poly.pizza/457b2397-4bfb-41c4-862d-82d1592b2a5f.glb', 'https://poly.pizza/m/R7qMWzb7nk', 7.2),
    maple: model('https://static.poly.pizza/cdfcf39f-f8c7-44a6-bb3f-82afe42fc141.glb', 'https://poly.pizza/m/iGFtQd0PJO', 6.2),
    pine: model('https://static.poly.pizza/42a2a958-040d-4ce3-bae5-2332c1282cb5.glb', 'https://poly.pizza/m/w8ZaiYjK8C', 7.4),
    rock: model('https://static.poly.pizza/01671e28-0504-4db1-a5d5-af71ce0a6a1e.glb', 'https://poly.pizza/m/gYhoEOKItJ', 3.0),
    bush: model('https://static.poly.pizza/11bcb3a1-5901-402c-9863-75988b9e21d8.glb', 'https://poly.pizza/m/J2h3HrO356', 1.7),
    flowers: model('https://static.poly.pizza/c25cb5dc-3cd3-470c-a08c-045af0c0fe3d.glb', 'https://poly.pizza/m/NBUxHir6FJ', 1.5),
    house: model('https://static.poly.pizza/c08c3ac7-e65c-41f5-b200-b00c12103e57.glb', 'https://poly.pizza/m/he3p42mUTH', 5.8),
    sawmill: model('https://static.poly.pizza/4019f937-c8c6-4cf3-84c1-4dcc21d4a9cb.glb', 'https://poly.pizza/m/alxTTFjKDM', 5.1),
    inn: model('https://static.poly.pizza/270a08b6-87e1-47eb-ad1c-5fd7be321bcd.glb', 'https://poly.pizza/m/x3ZcGn3jr4', 6.2),
    well: model('https://static.poly.pizza/0e044203-f62e-4dad-ad3e-c3cb6cb393ac.glb', 'https://poly.pizza/m/QlqncKYxXb', 2.0),
    bonfire: model('https://static.poly.pizza/e96d5573-fa3a-47ad-bae0-0ef9640026fa.glb', 'https://poly.pizza/m/Azj9hJwwwG', 1.8),
    market: model('https://static.poly.pizza/8927a168-7f28-4f44-8a8e-e951aeffdf89.glb', 'https://poly.pizza/m/hts7l0NZxW', 2.8),
    fence: model('https://static.poly.pizza/713fa0e6-a648-4896-817d-64b68ed0dac8.glb', 'https://poly.pizza/m/UXmKfG81fG', 1.7)
  },
  creatures: {
    lumion: model('https://static.poly.pizza/27590c4e-41ee-41b5-aaaa-581de0031605.glb', 'https://poly.pizza/m/Z9lddNpM1M', 2.65),
    oriel: model('https://static.poly.pizza/e88090e2-46af-430b-91e5-ad5520de4939.glb', 'https://poly.pizza/m/IGn9lhdama', 2.7),
    embermite: model('https://static.poly.pizza/de63aaf6-9170-47f7-933d-439af68826a6.glb', 'https://poly.pizza/m/42djT5zJnx', 2.25),
    mossclaw: model('https://static.poly.pizza/51bf31d7-1aee-4a51-acb1-d667843af205.glb', 'https://poly.pizza/m/71gomWolax', 2.6),
    gloomfin: model('https://static.poly.pizza/810f60a2-6e45-4c4e-a0d5-da91cd7288bd.glb', 'https://poly.pizza/m/Iip30bDHmu', 2.35),
    glintling: model('https://static.poly.pizza/3ddbff73-430c-4ca0-bb25-11211683fbb9.glb', 'https://poly.pizza/m/AyP8sQmDLh', 1.9),
    ironroot: model('https://static.poly.pizza/ae5b8510-1fa5-4d53-b943-a4f3b88fb629.glb', 'https://poly.pizza/m/3rUm1cN3yp', 5.2)
  }
});
