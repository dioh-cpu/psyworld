import unittest
from rules import *

class Sanity(unittest.TestCase):
    def test_bands_edges(self):
        for s,name in [(100,"Lúcido"),(80,"Lúcido"),(79,"Estável"),(60,"Estável"),(59,"Perturbado"),(40,"Perturbado"),(39,"Instável"),(20,"Instável"),(19,"Insano"),(0,"Insano")]:
            self.assertEqual(sanity_band(s)[0], name, s)
    def test_failure_rates(self):
        self.assertEqual(sanity_band(70)[1], 0.0)
        self.assertEqual(sanity_band(50)[1], 0.05)
        self.assertEqual(sanity_band(30)[1], 0.15)
        self.assertEqual(sanity_band(5)[1], 0.30)
    def test_affinity_clamp_and_inverse(self):
        self.assertAlmostEqual(affinity_modifier(100,"heroi"), 0.20)
        self.assertAlmostEqual(affinity_modifier(0,"heroi"), -0.20)
        self.assertAlmostEqual(affinity_modifier(100,"vilao"), -0.20)
        self.assertAlmostEqual(affinity_modifier(0,"vilao"), 0.20)
        self.assertAlmostEqual(affinity_modifier(50,"heroi"), 0.0)

class Fusion(unittest.TestCase):
    def test_base_by_star(self):
        self.assertAlmostEqual(fusion_success_chance(1,0,0), 0.80)
        self.assertAlmostEqual(fusion_success_chance(5,0,0), 0.40)
    def test_success_drops_with_floor(self):
        self.assertAlmostEqual(fusion_success_chance(3,1,0), 0.55)
        self.assertAlmostEqual(fusion_success_chance(1,20,0), 0.20)  # piso
    def test_pity_caps_at_25(self):
        self.assertAlmostEqual(fusion_success_chance(5,0,3), 0.40+0.15)
        self.assertAlmostEqual(fusion_success_chance(5,0,99), 0.40+0.25)
    def test_ore_caps_at_30(self):
        self.assertAlmostEqual(fusion_success_chance(5,0,0,ore_bonus=0.9), 0.40+0.30)
    def test_chance_never_exceeds_95(self):
        self.assertLessEqual(fusion_success_chance(1,0,99,ore_bonus=1.0), 0.95)
    def test_mutation_cap(self):
        self.assertAlmostEqual(mutation_chance([0.10,0.12,0.15,0.20]), 0.50)
        self.assertAlmostEqual(mutation_chance([0.10]), 0.10)

class Hybrid(unittest.TestCase):
    def test_slots(self):
        self.assertEqual(Monster("A",2).active_slots(), 4)
        h=Monster("A",2,hybrid=True); self.assertEqual(h.active_slots(), 5)
    def test_replace_or_keep(self):
        m=Monster("A",2)
        m.absorb("Chama", keep_new=True); self.assertEqual(m.extra_ability,"Chama")
        m.absorb("Gelo", keep_new=False); self.assertEqual(m.extra_ability,"Chama")
        m.absorb("Gelo", keep_new=True); self.assertEqual(m.extra_ability,"Gelo")
    def test_duplicate_levels_up_capped(self):
        m=Monster("A",2); m.absorb("Gelo", True)
        for _ in range(10): m.absorb("Gelo", True)
        self.assertEqual(m.abilities["Gelo"], 5)
        self.assertAlmostEqual(ability_efficiency(5), 1.40)
        self.assertAlmostEqual(ability_efficiency(1), 1.00)

class Defeat(unittest.TestCase):
    def test_xp_loss_and_bot_persists(self):
        m=Monster("A",2,level=3,xp=40)
        bot=apply_defeat(m, 25, 0)
        self.assertEqual(m.xp, 15); self.assertEqual(m.level, 3); self.assertEqual(bot,1)
        bot=apply_defeat(m, 999, bot)
        self.assertEqual(m.xp, 0); self.assertEqual(bot,2)

class Fuse(unittest.TestCase):
    def test_failure_loses_only_ingredient(self):
        p=Monster("Ignavor",3,level=20); i=Monster("Umbrax",2,level=5)
        r=fuse(p,i,rolled=0.9,chance=0.6,keep_new=True,pick="Sombra")
        self.assertFalse(r["ok"]); self.assertEqual(r["principal"].species,"Ignavor"); self.assertEqual(r["lost"],"Umbrax")
    def test_success_keeps_species_and_level(self):
        p=Monster("Ignavor",3,level=20); i=Monster("Umbrax",2,level=5)
        r=fuse(p,i,rolled=0.1,chance=0.6,keep_new=True,pick="Sombra")
        self.assertTrue(r["ok"]); self.assertEqual(p.species,"Ignavor"); self.assertEqual(p.level,20); self.assertTrue(p.hybrid)

if __name__=="__main__":
    unittest.main(verbosity=1)
