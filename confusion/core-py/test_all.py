import unittest
from datetime import datetime, timezone
from rules import Monster
import sanity, chronology as ch, eggs, campaign, battle, rewards, economy, parts, cooking, alchemy, vinculo, farm, clock, gacha, collection, gathering, speedrun
from chronology import Chronology, WorldEvent
from cooking import Ingredient

class TestSanity(unittest.TestCase):
    def test_repeatable_diminishing(self):
        self.assertEqual(sanity.apply_change(50,"descanso",uses=0), 55)
        self.assertEqual(sanity.apply_change(50,"descanso",uses=1), 53)  # 2,5 arredondado para cima
        self.assertEqual(sanity.apply_change(50,"descanso",uses=4), 51)
    def test_non_repeatable_full(self):
        self.assertEqual(sanity.apply_change(50,"crueldade"), 40)
        self.assertEqual(sanity.apply_change(50,"ritual",uses=9), 35)
    def test_mental_resist_caps_at_half(self):
        self.assertEqual(sanity.apply_change(50,"ritual",mental_resist=0.9), 43)  # -15 x 0,5 = -7,5 -> 42,5 -> 43
    def test_clamp(self):
        self.assertEqual(sanity.apply_change(98,"purificacao"), 100)
        self.assertEqual(sanity.apply_change(3,"ritual"), 0)
    def test_failure_never_blocks(self):
        for roll in [0.0,0.1,0.2,0.5,0.99]:
            r=sanity.common_action_failure(10, roll)
            self.assertFalse(r["bloqueia"])
    def test_no_failure_when_lucid(self):
        self.assertFalse(sanity.common_action_failure(90,0.0)["falhou"])
    def test_critical_event_requires_confirmation_and_is_idempotent(self):
        log=sanity.CriticalEventLog()
        with self.assertRaises(ValueError): log.resolve("viajante",False,"morte")
        a=log.resolve("viajante",True,"morte"); b=log.resolve("viajante",True,"outro")
        self.assertEqual(a,b)

class TestChronology(unittest.TestCase):
    def setUp(self):
        self.c=Chronology(defaults={"regiao":{"ponte":"aberta"}})
        self.c.add(WorldEvent("derrubar","regiao",origin_day=4,sets={"ponte":"fechada"}))
        self.c.add(WorldEvent("reabrir","regiao",origin_day=8,sets={"ponte":"aberta"}))
    def test_bridge_timeline(self):
        self.assertEqual(self.c.state("regiao",3)["ponte"],"aberta")
        self.assertEqual(self.c.state("regiao",4)["ponte"],"fechada")
        self.assertEqual(self.c.state("regiao",7)["ponte"],"fechada")
        self.assertEqual(self.c.state("regiao",8)["ponte"],"aberta")
    def test_effect_scheduled_by_activation_day(self):
        self.c.add(WorldEvent("aviso","regiao",origin_day=5,activates_day=8,sets={"aviso":"sim"}))
        self.assertNotIn("aviso", self.c.state("regiao",7))
        self.assertEqual(self.c.state("regiao",8)["aviso"],"sim")
    def test_protection_two_hours(self):
        self.c.notify_protection("regiao", 1000)
        self.assertFalse(self.c.can_act_again("regiao",1119))
        self.assertTrue(self.c.can_act_again("regiao",1120))
    def test_add_idempotent(self):
        n=len(self.c.events); self.c.add(WorldEvent("reabrir","regiao",8,{"ponte":"aberta"})); self.assertEqual(len(self.c.events),n)

class TestEggs(unittest.TestCase):
    def test_eligible_forms(self):
        self.assertEqual(eggs.eligible_forms(0),["natural","mutante"])
        self.assertEqual(eggs.eligible_forms(49),["natural","mutante"])
        self.assertEqual(eggs.eligible_forms(50),["natural"])
        self.assertEqual(eggs.eligible_forms(51),["natural","abencoada"])
        self.assertEqual(eggs.eligible_forms(100),["natural","abencoada"])
    def test_extreme_favours_rare(self):
        self.assertEqual(eggs.pick_form(5,0.1),"mutante")       # extremo, rolagem baixa: rara
        self.assertEqual(eggs.pick_form(5,0.9),"mutante")       # extremo, rolagem alta: fallback 50/50 (cai na rara)
        self.assertEqual(eggs.pick_form(30,0.1),"natural")      # faixa comum: sem viés
        self.assertEqual(eggs.pick_form(30,0.9),"mutante")
    def test_compatibility_table(self):
        self.assertEqual(eggs.compatibility("heroi","mutante"),0.5)
        self.assertEqual(eggs.compatibility("vilao","mutante"),1.0)
        self.assertEqual(eggs.compatibility("vilao","abencoada"),0.5)
        self.assertEqual(eggs.compatibility("heroi","abencoada"),1.0)
    def test_hatch_once_and_fixed(self):
        e=eggs.Egg("ovo1","Ignavor",seed=7)
        r1=eggs.hatch(e,sanity=50,roll=0.0)
        r2=eggs.hatch(e,sanity=5,roll=0.9)  # reabrir não muda nada
        self.assertIs(r1,r2)
        self.assertEqual(r1["sanity_fixed"],50); self.assertEqual(r1["form"],"natural")

class TestCampaign(unittest.TestCase):
    def test_costume_follows_path(self):
        c=campaign.Campaign("c1","Azazel")
        self.assertEqual(c.costume,"base")
        c.choose_path("heroi"); self.assertEqual(c.costume,"luz")
    def test_villain_is_dark_gothic(self):
        c=campaign.Campaign("c1","Azazel"); c.choose_path("vilao"); self.assertEqual(c.costume,"trevas")
    def test_switch_once_only(self):
        c=campaign.Campaign("c1","Azazel"); c.choose_path("heroi"); c.switch_side("vilao")
        self.assertEqual(c.costume,"trevas")
        with self.assertRaises(ValueError): c.switch_side("heroi")
    def test_difficulty_snapshot_and_battle_lock(self):
        c=campaign.Campaign("c1","Azazel"); c.set_difficulty("dificil",False)
        self.assertEqual(c.enter_challenge(),"dificil")
        with self.assertRaises(ValueError): c.set_difficulty("facil",True)
    def test_completion_once(self):
        c=campaign.Campaign("c1","Azazel")
        self.assertTrue(c.complete(3600)); self.assertFalse(c.complete(100)); self.assertEqual(c.completion_seconds,3600)

class TestBattleRewards(unittest.TestCase):
    def test_no_draw(self):
        m=Monster("A",2,xp=10)
        with self.assertRaises(ValueError): battle.final_battle("empate",m,0)
    def test_defeat_floor_and_bot_grows(self):
        m=Monster("A",2,xp=10)
        r=battle.final_battle("derrota",m,0,xp_loss=25)
        self.assertEqual(m.xp,0); self.assertEqual(r["bot_strength"],1)
        self.assertEqual(battle.final_battle("derrota",m,r["bot_strength"])["bot_strength"],2)
    def test_reward_idempotent_and_monster_once(self):
        reg=rewards.RewardRegistry()
        reg.claim("c1","campanha")
        self.assertEqual(reg.pick_monster("c1","campanha","Ignavor"),"Ignavor")
        self.assertEqual(reg.pick_monster("c1","campanha","Vaelith"),"Ignavor")
        self.assertEqual(reg.repertoire,[("Ignavor",0)])
    def test_monthly_registry_separate(self):
        reg=rewards.RewardRegistry()
        a=reg.monthly("p1","2026-11","top10"); b=reg.monthly("p1","2026-11","top10")
        self.assertIs(a,b)

class TestEconomy(unittest.TestCase):
    def test_reputation_bands(self):
        self.assertEqual(economy.reputation_multiplier(60),0.85)
        self.assertEqual(economy.reputation_multiplier(20),0.95)
        self.assertEqual(economy.reputation_multiplier(0),1.00)
        self.assertEqual(economy.reputation_multiplier(-20),1.20)
        self.assertEqual(economy.reputation_multiplier(-60),1.50)
    def test_merchant_rarity_cap_and_refusal(self):
        m=economy.Merchant("ferreiro","rara",confidence=60)
        self.assertTrue(m.sells("comum")); self.assertFalse(m.sells("epica"))
        with self.assertRaises(ValueError): economy.buy(m,100,"epica",0)
        low=economy.Merchant("x","lendaria",confidence=5)
        self.assertTrue(low.refuses())
        self.assertTrue(economy.essential_available([low,economy.Merchant("y","comum",50)],"comum"))
    def test_npc_buy_half(self):
        self.assertEqual(economy.npc_buy_price(100),50)

class TestParts(unittest.TestCase):
    def test_craft_consumes_inputs(self):
        g=parts.PartGraph([("espada",{"ferro":2,"pele":1})])
        inv={"ferro":2,"pele":1}
        g.craft(inv,"espada"); self.assertEqual(inv["espada"],1); self.assertEqual(inv["ferro"],0)
    def test_missing_input(self):
        g=parts.PartGraph([("espada",{"ferro":2})])
        with self.assertRaises(ValueError): g.craft({"ferro":1},"espada")
    def test_cycle_rejected(self):
        with self.assertRaises(ValueError): parts.PartGraph([("a",{"b":1}),("b",{"a":1})])
    def test_depth_limit(self):
        with self.assertRaises(ValueError):
            parts.PartGraph([("d1",{"x":1}),("d2",{"d1":1}),("d3",{"d2":1}),("d4",{"d3":1})])
        parts.PartGraph([("d1",{"x":1}),("d2",{"d1":1}),("d3",{"d2":1})])  # 3 níveis é permitido

def ing(name,pur,fresh=1.0,rar="comum",cat="vegetal"):
    return Ingredient(name,cat,pur,fresh,rar)

class TestCooking(unittest.TestCase):
    def test_needs_charcoal_and_pot(self):
        with self.assertRaises(ValueError): cooking.cook(ing("a","neutra"),None,None,pot="comum",charcoal=0,skill=0,roll=0.9)
        with self.assertRaises(ValueError): cooking.cook(ing("a","neutra"),None,None,pot="ouro",charcoal=1,skill=0,roll=0.9)
    def test_pot_caps_rarity(self):
        r=cooking.cook(ing("a","neutra",rar="lendaria"),None,None,pot="comum",charcoal=1,skill=99,roll=0.9)
        self.assertEqual(r["raridade"],"rara")
        r=cooking.cook(ing("a","neutra",rar="lendaria"),None,None,pot="lendaria",charcoal=1,skill=99,roll=0.9)
        self.assertEqual(r["raridade"],"mitica")
    def test_purity_variant_and_name(self):
        r=cooking.cook(ing("Sopa de Raiz","luz"),None,None,pot="rara",charcoal=1,skill=0,roll=0.9)
        self.assertEqual(r["efeito"],"cura"); self.assertEqual(r["nome"],"Sopa de Raiz Luminosa")
        r=cooking.cook(ing("Sopa de Raiz","trevas"),None,None,pot="rara",charcoal=1,skill=0,roll=0.9)
        self.assertEqual(r["efeito"],"confusao")
    def test_decomposed_is_not_food_but_alchemy_ok(self):
        r=cooking.cook(ing("Fungo","trevas",fresh=0.1),None,None,pot="rara",charcoal=1,skill=0,roll=0.9)
        self.assertEqual(r["penalidade"],"estragado"); self.assertIsNone(r["efeito"]); self.assertEqual(r["vinculo_delta"],-5)
    def test_burnt_penalty(self):
        r=cooking.cook(ing("a","neutra"),None,None,pot="rara",charcoal=1,skill=0,roll=0.05)
        self.assertEqual(r["penalidade"],"queimado")
    def test_stack_takes_lowest_freshness(self):
        self.assertEqual(cooking.stack_freshness(0.9,0.3),0.3)

class TestAlchemy(unittest.TestCase):
    def test_tie_is_deterministic(self):
        for _ in range(20):
            self.assertEqual(alchemy.brew([("comum","luz"),("comum","trevas")])["pocao"],"pocao_comum")
    def test_needs_two_seeds(self):
        with self.assertRaises(ValueError): alchemy.brew([("comum","luz")])
    def test_potion_by_purity(self):
        self.assertEqual(alchemy.brew([("comum","luz"),("comum","luz")])["pocao"],"pocao_de_cura")
    def test_research_and_mutant_seeds(self):
        r=alchemy.brew([("corrompida","trevas"),("corrompida","trevas"),("comum","neutra")],decomposed=True)
        self.assertIn("pesquisa",r["sementes"]); self.assertIn("mutante",r["sementes"]); self.assertIn("corrompida",r["sementes"])

class TestVinculo(unittest.TestCase):
    def test_food_clamps(self):
        m=Monster("Ignavor",2,vinculo=95); self.assertEqual(vinculo.apply_food(m,20),100)
        m.vinculo=3; self.assertEqual(vinculo.apply_food(m,-20),0)
    def test_evolution_threshold(self):
        m=Monster("Ignavor",2,vinculo=69); self.assertIsNone(vinculo.try_evolve(m))
        m.vinculo=70; self.assertEqual(vinculo.try_evolve(m),"Ignavor II (provisório)")

class TestFarm(unittest.TestCase):
    def test_assign_by_aptitude_and_level(self):
        ws=[farm.Worker("A",3,{"plantar"}),farm.Worker("B",5,{"plantar","colher"})]
        m,u=farm.assign(["plantar","colher","minerar"],ws)
        self.assertEqual(m["plantar"],"B")
        self.assertIn("minerar",u)
    def test_unknown_task(self):
        with self.assertRaises(ValueError): farm.assign(["voar"],[])

class TestClock(unittest.TestCase):
    def test_brasilia_phase(self):
        self.assertEqual(clock.phase(datetime(2026,11,19,12,0,tzinfo=timezone.utc)),"dia")  # 09h BRT
        self.assertEqual(clock.phase(datetime(2026,11,19,2,0,tzinfo=timezone.utc)),"noite")  # 23h BRT
    def test_spawn_windows(self):
        self.assertTrue(clock.can_spawn("dia","dia")); self.assertFalse(clock.can_spawn("dia","noite"))
        self.assertTrue(clock.can_spawn("ambos","noite"))

class TestGacha(unittest.TestCase):
    def test_published_odds_sum_100(self):
        b=gacha.Banner("b",[("a","comum",70),("b","rara",25),("c","mitica",5)])
        self.assertAlmostEqual(sum(b.published.values()),100.0,places=2)
    def test_pity_at_50(self):
        b=gacha.Banner("b",[("a","comum",1),("c","mitica",0)])
        g=gacha.Gacha(b)
        results=[g.pull(0.5) for _ in range(49)]
        self.assertEqual(results[-1],"a")
        self.assertEqual(g.pull(0.5),"c")  # 50ª invocação garante o topo

class TestCollection(unittest.TestCase):
    def test_first_capture_and_region_reward_once(self):
        col=collection.Collection({"norte":{"A","B"}})
        self.assertTrue(col.capture("A","norte")); self.assertFalse(col.capture("A","norte"))
        col.capture("B","norte"); col.capture("B","norte")
        self.assertEqual(col.rewards.count(("regiao_completa","norte")),1)
        self.assertEqual(col.progress("norte"),(2,2))

class TestGathering(unittest.TestCase):
    def test_tool_required(self):
        n=gathering.Node("madeira","machado",4)
        with self.assertRaises(ValueError): gathering.harvest(n,"picareta",0,False)
    def test_cooldown_then_diminishing_then_window_reset(self):
        n=gathering.Node("pedra","picareta",4)
        self.assertEqual(gathering.harvest(n,"picareta",0,False)["qty"],4)
        cedo=gathering.harvest(n,"picareta",5,False)
        self.assertTrue(cedo["emCooldown"]); self.assertEqual(cedo["qty"],0)
        self.assertEqual(gathering.harvest(n,"picareta",10,False)["qty"],2)   # dentro da janela
        self.assertEqual(gathering.harvest(n,"picareta",300,False)["qty"],4)  # janela passou
    def test_no_daily_cap(self):
        n=gathering.Node("madeira","machado",4)
        total=sum(gathering.harvest(n,"machado",k*10,False)["qty"] for k in range(20))
        self.assertGreater(total,0)
    def test_sanity_fail_reduces_not_blocks(self):
        n=gathering.Node("cristal","picareta",4)
        r=gathering.harvest(n,"picareta",0,True)
        self.assertEqual(r["qty"],2); self.assertTrue(r["ferimento"]); self.assertEqual(r["vida"],95)

class TestSpeedrun(unittest.TestCase):
    def test_only_first_completion_counts(self):
        rk=speedrun.Ranking()
        r1=speedrun.Run("c1","p1",0)
        self.assertEqual(rk.complete(r1,600,"2026-11"),600)
        self.assertIsNone(rk.complete(speedrun.Run("c1","p1",1000),1200,"2026-11"))
    def test_monthly_sorted(self):
        rk=speedrun.Ranking()
        rk.complete(speedrun.Run("c1","a",0),900,"2026-11")
        rk.complete(speedrun.Run("c2","b",0),500,"2026-11")
        rk.complete(speedrun.Run("c3","c",0),100,"2026-10")
        self.assertEqual(rk.monthly("2026-11"),[(500,"b"),(900,"a")])

if __name__=="__main__":
    unittest.main(verbosity=1)
