-- PSYWORLD V25 — Poké Shop server catalog
-- Only items actually sold by the ordinary Poké Shop belong here.

delete from public.shop_catalog;
insert into public.shop_catalog(item_key,buy_gold,sell_gold,sellable,category) values
('Pokéball',20,null,false,'ball'),
('Great Ball',50,null,false,'ball'),
('Super Ball',100,null,false,'ball'),
('Ultra Ball',200,null,false,'ball'),
('Premier Ball',500,null,false,'ball'),
('Poção 50',30,null,false,'potion'),
('Poção 100',50,null,false,'potion'),
('Poção 200',100,null,false,'potion'),
('Poção 30%',1000,null,false,'potion'),
('Poção 50% HP',3000,null,false,'potion'),
('Poção 100% HP',10000,null,false,'potion'),
('Revive',800,null,false,'potion'),
('Fire Stone',20000,10000,true,'stone'),
('Water Stone',20000,10000,true,'stone'),
('Leaf Stone',20000,10000,true,'stone'),
('Thunder Stone',20000,10000,true,'stone'),
('Ice Stone',20000,10000,true,'stone'),
('Punch Stone',20000,10000,true,'stone'),
('Venom Stone',20000,10000,true,'stone'),
('Earth Stone',20000,10000,true,'stone'),
('Feather Stone',20000,10000,true,'stone'),
('Enigma Stone',20000,10000,true,'stone'),
('Cocoon Stone',20000,10000,true,'stone'),
('Rock Stone',20000,10000,true,'stone'),
('Darkness Stone',20000,10000,true,'stone'),
('Crystal Stone',20000,10000,true,'stone'),
('Metal Stone',20000,10000,true,'stone'),
('Heart Stone',20000,10000,true,'stone');
