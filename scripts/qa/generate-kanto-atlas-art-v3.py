#!/usr/bin/env python3
"""Create crisp, original pixel-art ornaments for the Kanto atlas UI."""
from pathlib import Path
from PIL import Image, ImageDraw
import random

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets' / 'ui'
OUT.mkdir(parents=True, exist_ok=True)

INK=(18,25,43,255); DEEP=(27,39,56,255); MID=(48,68,79,255)
GOLD=(239,194,104,255); LIGHT=(255,232,165,255); TEAL=(79,199,193,255)
WOOD=(116,70,50,255); ROOF=(160,74,51,255); ROOF_HI=(217,130,75,255)
GREEN=(40,105,77,255); LEAF=(82,157,99,255); STONE=(99,112,125,255)
PURPLE=(105,73,150,255); CRYSTAL=(167,140,255,255); WATER=(49,142,177,255)

# Four detailed 64px location sigils, arranged for CSS background-position.
sheet=Image.new('RGBA',(256,64),(0,0,0,0))

def px(draw, box, color): draw.rectangle(box, fill=color)
def line(draw, pts, color, width=1): draw.line(pts, fill=color, width=width)

def city_icon(im, ox):
    d=ImageDraw.Draw(im)
    # ground shadow and tiled path
    px(d,(ox+8,53,ox+55,58),(8,13,24,110)); px(d,(ox+23,50,ox+40,57),(178,130,74,255))
    for x in (ox+10, ox+51):
        px(d,(x,25,x+5,48),INK); px(d,(x+1,27,x+4,46),WOOD); px(d,(x+1,27,x+4,30),ROOF_HI)
    # left house, stone lower walls, red tiled roof
    px(d,(ox+10,31,ox+29,49),INK); px(d,(ox+12,34,ox+27,48),WOOD)
    for y in (35,39,43): line(d,[(ox+12,y),(ox+27,y)],(143,92,59,255))
    px(d,(ox+8,25,ox+31,33),INK); px(d,(ox+11,24,ox+29,30),ROOF)
    line(d,[(ox+10,28),(ox+30,28)],ROOF_HI); line(d,[(ox+14,25),(ox+14,30)],(196,103,60,255)); line(d,[(ox+21,25),(ox+21,30)],(196,103,60,255)); line(d,[(ox+27,25),(ox+27,30)],(196,103,60,255))
    px(d,(ox+17,40,ox+21,48),INK); px(d,(ox+18,41,ox+20,48),WOOD); px(d,(ox+18,44,ox+18,45),LIGHT)
    # right civic tower / pokecenter sign
    px(d,(ox+34,30,ox+53,49),INK); px(d,(ox+36,33,ox+51,48),DEEP)
    px(d,(ox+34,25,ox+53,32),INK); px(d,(ox+36,26,ox+51,30),TEAL); px(d,(ox+38,27,ox+49,29),(164,238,223,255))
    px(d,(ox+39,36,ox+44,41),GOLD); px(d,(ox+46,36,ox+49,41),ROOF_HI)
    px(d,(ox+27,48,ox+34,50),GOLD)
    # trees and sparkle
    px(d,(ox+5,41,ox+8,52),INK); px(d,(ox+2,34,ox+11,43),INK); px(d,(ox+3,35,ox+10,41),GREEN); px(d,(ox+4,35,ox+7,37),LEAF)
    px(d,(ox+57,37,ox+59,45),INK); px(d,(ox+54,31,ox+61,39),INK); px(d,(ox+55,32,ox+60,37),GREEN); px(d,(ox+56,32,ox+57,34),LEAF)
    px(d,(ox+31,15,ox+32,19),LIGHT); px(d,(ox+29,17,ox+34,18),LIGHT)

def route_icon(im, ox):
    d=ImageDraw.Draw(im)
    px(d,(ox+8,53,ox+56,58),(8,13,24,110))
    # meandering golden footpath between grassy rises
    px(d,(ox+11,47,ox+23,52),(188,142,82,255)); px(d,(ox+16,42,ox+36,49),(205,163,98,255)); px(d,(ox+29,36,ox+49,44),(205,163,98,255)); px(d,(ox+42,30,ox+52,39),(205,163,98,255))
    line(d,[(ox+14,48),(ox+23,48),(ox+25,45),(ox+36,45),(ox+39,41),(ox+49,41),(ox+50,35)],(255,220,144,255))
    # route signpost with layered arrow board
    px(d,(ox+12,22,ox+16,49),INK); px(d,(ox+13,24,ox+14,47),WOOD); px(d,(ox+8,22,ox+34,31),INK); px(d,(ox+10,23,ox+32,28),GOLD); px(d,(ox+11,24,ox+30,26),LIGHT)
    px(d,(ox+27,31,ox+48,38),INK); px(d,(ox+29,32,ox+46,36),ROOF_HI); px(d,(ox+42,33,ox+46,35),LIGHT)
    # foliage and stones
    for x,y in [(5,44),(3,39),(53,47),(57,42),(21,34)]:
        px(d,(ox+x,y+4,ox+x+2,y+8),INK); px(d,(ox+x-2,y,ox+x+4,y+4),INK); px(d,(ox+x-1,y+1,ox+x+3,y+3),GREEN); px(d,(ox+x,y+1,ox+x+1,y+2),LEAF)
    px(d,(ox+37,50,ox+43,52),STONE); px(d,(ox+38,49,ox+42,50),(158,164,165,255))
    px(d,(ox+50,17,ox+51,21),LIGHT); px(d,(ox+48,19,ox+53,20),LIGHT)

def dungeon_icon(im, ox):
    d=ImageDraw.Draw(im)
    px(d,(ox+7,53,ox+57,58),(8,13,24,120))
    # rocky shoulders and cave arch
    px(d,(ox+9,34,ox+16,51),INK); px(d,(ox+12,27,ox+22,51),INK); px(d,(ox+18,22,ox+27,51),INK)
    px(d,(ox+37,24,ox+47,51),INK); px(d,(ox+44,29,ox+53,51),INK); px(d,(ox+50,37,ox+56,51),INK)
    for b,c in [((ox+11,36,ox+15,48),STONE),((ox+14,30,ox+21,48),MID),((ox+20,25,ox+26,48),STONE),((ox+39,27,ox+45,48),MID),((ox+46,32,ox+51,48),STONE),((ox+51,39,ox+54,49),MID)]: px(d,b,c)
    px(d,(ox+22,34,ox+39,52),INK); px(d,(ox+25,37,ox+36,51),(9,12,23,255)); px(d,(ox+27,42,ox+34,51),(14,23,40,255))
    # crystalline spikes and lit edge
    px(d,(ox+28,31,ox+31,42),INK); px(d,(ox+29,26,ox+31,38),PURPLE); px(d,(ox+30,23,ox+31,34),CRYSTAL); px(d,(ox+29,30,ox+30,36),LIGHT)
    px(d,(ox+35,39,ox+37,47),INK); px(d,(ox+35,35,ox+36,43),TEAL); px(d,(ox+36,37,ox+36,42),LIGHT)
    # cave glint
    px(d,(ox+8,18,ox+9,22),LIGHT); px(d,(ox+6,20,ox+11,21),LIGHT)

def landmark_icon(im, ox):
    d=ImageDraw.Draw(im)
    px(d,(ox+8,53,ox+56,58),(8,13,24,120)); px(d,(ox+18,50,ox+47,54),(150,111,69,255))
    # high league observatory tower
    px(d,(ox+22,19,ox+43,51),INK); px(d,(ox+25,24,ox+40,49),STONE); px(d,(ox+27,27,ox+38,49),MID)
    for y in (29,35,41):
        px(d,(ox+27,y,ox+38,y+1),INK); px(d,(ox+28,y,ox+37,y),STONE)
    px(d,(ox+18,19,ox+47,25),INK); px(d,(ox+21,20,ox+44,23),GOLD); px(d,(ox+23,21,ox+42,22),LIGHT)
    px(d,(ox+29,13,ox+36,19),INK); px(d,(ox+30,14,ox+35,18),ROOF_HI); px(d,(ox+32,10,ox+33,14),LIGHT)
    px(d,(ox+30,43,ox+35,50),INK); px(d,(ox+31,44,ox+34,49),DEEP); px(d,(ox+32,46,ox+33,47),GOLD)
    # flanking miniature banners and stone steps
    for x in (12,49):
        px(d,(ox+x,28,ox+x+2,49),INK); px(d,(ox+x+1,30,ox+x+1,47),WOOD); px(d,(ox+x-2,31,ox+x+5,39),ROOF); px(d,(ox+x-1,32,ox+x+3,36),GOLD)
    px(d,(ox+21,49,ox+44,51),GOLD); px(d,(ox+6,43,ox+10,46),LEAF); px(d,(ox+53,42,ox+58,45),LEAF)
    px(d,(ox+49,13,ox+50,17),LIGHT); px(d,(ox+47,15,ox+52,16),LIGHT)

for i,fn in enumerate((city_icon,route_icon,dungeon_icon,landmark_icon)):
    fn(sheet,i*64)
sheet.save(OUT/'kanto-atlas-markers-v3.png',optimize=True)

# A compact pixel-art compass rose, with transparent background.
compass=Image.new('RGBA',(96,96),(0,0,0,0)); d=ImageDraw.Draw(compass)
d.ellipse((9,9,86,86),fill=(9,17,31,210),outline=INK,width=5)
d.ellipse((14,14,81,81),outline=GOLD,width=2)
d.ellipse((18,18,77,77),outline=(101,171,174,255),width=1)
# eight-point north rose
for points,color in [([(48,18),(52,43),(48,48),(44,43)],LIGHT), ([(48,78),(52,53),(48,48),(44,53)],(76,117,146,255)), ([(18,48),(43,44),(48,48),(43,52)],TEAL), ([(78,48),(53,44),(48,48),(53,52)],GOLD), ([(29,29),(46,43),(48,48),(43,46)],(255,225,159,255)), ([(67,29),(50,43),(48,48),(53,46)],(148,119,205,255)), ([(29,67),(46,53),(48,48),(43,50)],(80,144,148,255)), ([(67,67),(50,53),(48,48),(53,50)],(204,147,75,255))]:
    d.polygon(points,fill=color,outline=INK)
d.rectangle((46,46,50,50),fill=LIGHT)
# cardinal ticks and north star
for x,y in [(47,5),(47,87),(5,47),(87,47)]: d.rectangle((x,y,x+2,y+3),fill=GOLD)
compass.save(OUT/'kanto-atlas-compass-v3.png',optimize=True)

# Repeating deep-blue vellum texture for the detail cards; no interpolation.
rng=random.Random(3207)
tex=Image.new('RGBA',(128,128)); p=tex.load()
for y in range(128):
    for x in range(128):
        grain=rng.randrange(-5,6)
        vein=3 if (x+y*3)%41<2 else 0
        p[x,y]=(max(0,min(255,23+grain+vein)),max(0,min(255,37+grain+vein)),max(0,min(255,56+grain+vein)),255)
d=ImageDraw.Draw(tex)
for x in range(8,128,32): d.line((x,0,x,127),fill=(107,136,140,14),width=1)
for y in range(16,128,32): d.line((0,y,127,y),fill=(107,136,140,12),width=1)
tex.save(OUT/'kanto-atlas-vellum-v3.png',optimize=True)

# 9-slice border ornament. The clear center keeps it reusable over any panel.
frame=Image.new('RGBA',(96,96),(0,0,0,0)); fd=ImageDraw.Draw(frame)
for off,color,w in [(0,INK,2),(3,GOLD,1),(6,(87,153,160,255),1),(9,(23,39,56,230),1)]:
    fd.rectangle((off,off,95-off,95-off),outline=color,width=w)
# Corner brackets, leaf tips, and tiny brass rivets.
for fx,fy,sx,sy in [(0,0,1,1),(95,0,-1,1),(0,95,1,-1),(95,95,-1,-1)]:
    def rect_local(x1,y1,x2,y2,color):
        ax=fx+sx*x1; bx=fx+sx*x2; ay=fy+sy*y1; by=fy+sy*y2
        fd.rectangle((min(ax,bx),min(ay,by),max(ax,bx),max(ay,by)),fill=color)
    rect_local(0,0,2,31,INK); rect_local(0,0,31,2,INK)
    rect_local(3,3,4,26,GOLD); rect_local(3,3,26,4,GOLD)
    rect_local(7,7,8,20,TEAL); rect_local(7,7,20,8,TEAL)
    # compass-leaf motif, kept inside the nine-slice corner
    for k in range(4):
        rect_local(12+k*3,12+k*3,16+k*3,13+k*3,(30,77,78,255))
        rect_local(13+k*3,11+k*3,14+k*3,14+k*3,(117,180,139,255))
    rect_local(24,8,26,10,LIGHT); rect_local(8,24,10,26,LIGHT)
    rect_local(4,4,6,6,GOLD)
frame.save(OUT/'kanto-atlas-frame-v3.png',optimize=True)

print('created', *(str(p.name) for p in OUT.glob('kanto-atlas-*-v3.png')))
