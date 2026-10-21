#!/usr/bin/env python3
"""Regenerate the macOS application icon assets for dsh-theme-admech.

Sources:  assets/gear-skull-gold-512.png  (the provided brass gear-skull)
Outputs:  assets/app-icon/icon-1024.png
          assets/app-icon/icon-512.png
          assets/app-icon/icon-256.png
          assets/app-icon/AppIcon.icns

Requires Pillow (python3 -m pip install pillow) and macOS' iconutil.
Run from anywhere: python3 tools/build-macos-app-icon.py
"""

from PIL import Image, ImageDraw, ImageFilter
import math, os, subprocess, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, 'assets', 'gear-skull-gold-512.png')
OUT = os.path.join(ROOT, 'assets', 'app-icon')
os.makedirs(OUT, exist_ok=True)

S = 2048
MARGIN = int(100 / 1024 * S)
SIZE = S - MARGIN * 2
RADIUS = int(185 / 824 * SIZE)
CX = CY = S // 2

BRASS = (201, 161, 90)
BRASS_BRIGHT = (227, 193, 132)
BRASS_DIM = (110, 85, 48)
IRON_TOP = (30, 22, 13)
IRON_BOTTOM = (7, 5, 3)
MARS = (194, 55, 43)

# ---------- rounded-square background with vertical iron gradient ----------
bg = Image.new('RGBA', (S, S), (0, 0, 0, 0))
grad = Image.new('RGB', (S, S), IRON_BOTTOM)
gp = grad.load()
for y in range(S):
    t = (y / (S - 1)) ** 1.15
    col = tuple(int(IRON_TOP[i] * (1 - t) + IRON_BOTTOM[i] * t) for i in range(3))
    for x in range(S):
        gp[x, y] = col
bg.paste(grad, (0, 0))

# forge glow behind the emblem (soft, no rings)
glow = Image.new('RGBA', (S, S), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
for radius, alpha in [(int(SIZE*0.46), 30), (int(SIZE*0.34), 36), (int(SIZE*0.22), 30)]:
    gd.ellipse((CX-radius, CY-radius, CX+radius, CY+radius), fill=(201, 161, 90, alpha))
glow = glow.filter(ImageFilter.GaussianBlur(S * 0.06))
bg = Image.alpha_composite(bg, glow)

mask = Image.new('L', (S, S), 0)
md = ImageDraw.Draw(mask)
md.rounded_rectangle((MARGIN, MARGIN, MARGIN + SIZE, MARGIN + SIZE), radius=RADIUS, fill=255)

# ---------- cathedral tracery: recessed portal + ribs (low alpha) ----------
line = Image.new('RGBA', (S, S), (0, 0, 0, 0))
ld = ImageDraw.Draw(line)
L = MARGIN
W = SIZE
def arch_points(scale, top):
    return [
        (CX, L + W * top),
        (L + W * (0.5 + 0.28 * scale), L + W * 0.34),
        (L + W * (0.5 + 0.28 * scale), L + W * 0.78),
        (CX, L + W * (0.90 - 0.02 * (1 - scale))),
        (L + W * (0.5 - 0.28 * scale), L + W * 0.78),
        (L + W * (0.5 - 0.28 * scale), L + W * 0.34),
    ]
ld.line(arch_points(1.0, 0.16), fill=BRASS + (40,), width=6, joint='curve')
for k in (0.62, 0.46, 0.30):
    ld.line(arch_points(k, 0.16 + 0.015 * (1 - k)), fill=BRASS + (28,), width=3, joint='curve')
ld.line([(CX, L + W * 0.17), (CX, L + W * 0.90)], fill=BRASS + (18,), width=3)
for x in (0.20, 0.80):
    ld.line([(L + W * x, L + W * 0.34), (L + W * x, L + W * 0.80)], fill=BRASS + (22,), width=4)
bg = Image.alpha_composite(bg, line)

# ---------- double brass frame + corner diamonds + top mars seal ----------
frame = Image.new('RGBA', (S, S), (0, 0, 0, 0))
fd = ImageDraw.Draw(frame)
fd.rounded_rectangle((MARGIN+3, MARGIN+3, MARGIN+SIZE-3, MARGIN+SIZE-3), radius=RADIUS-2,
                     outline=BRASS + (238,), width=14)
fd.rounded_rectangle((MARGIN+34, MARGIN+34, MARGIN+SIZE-34, MARGIN+SIZE-34), radius=RADIUS-30,
                     outline=BRASS_DIM + (150,), width=4)
def diamond(d, x, y, r, fill, outline=None, ow=2):
    d.polygon([(x, y-r), (x+r, y), (x, y+r), (x-r, y)], fill=fill, outline=outline, width=ow)
inset = MARGIN + 92
for (x, y) in [(inset, inset), (S-inset, inset), (inset, S-inset), (S-inset, S-inset)]:
    diamond(fd, x, y, 14, BRASS_BRIGHT + (200,))
seal_y = MARGIN + 118
diamond(fd, CX, seal_y, 15, MARS + (255,), outline=BRASS_BRIGHT + (170,), ow=3)
fd.line([(CX - 128, seal_y), (CX - 48, seal_y)], fill=BRASS + (190,), width=5)
fd.line([(CX + 48, seal_y), (CX + 128, seal_y)], fill=BRASS + (190,), width=5)
bg = Image.alpha_composite(bg, frame)

# ---------- gear-skull emblem with soft brass halo ----------
emblem = Image.open(SRC).convert('RGBA')
emblem_size = int(SIZE * 0.60)
emblem = emblem.resize((emblem_size, emblem_size), Image.LANCZOS)
emb_y = CY - int(SIZE * 0.015)
halo = Image.new('RGBA', (S, S), (0, 0, 0, 0))
halo.paste(emblem, (CX - emblem_size//2, emb_y - emblem_size//2), emblem)
halo = halo.filter(ImageFilter.GaussianBlur(int(S*0.018)))
tint = Image.new('RGBA', (S, S), (227, 193, 132, 120))
halo = Image.composite(tint, Image.new('RGBA', (S, S), (0,0,0,0)), halo.split()[3])
bg = Image.alpha_composite(bg, halo)
# crisp emblem with a hairline dark keyline behind for definition
keyline = Image.new('RGBA', (S, S), (0, 0, 0, 0))
keyline.paste(emblem, (CX - emblem_size//2, emb_y - emblem_size//2), emblem)
keyline = keyline.filter(ImageFilter.GaussianBlur(3))
bg = Image.alpha_composite(bg, keyline)
bg.paste(emblem, (CX - emblem_size//2, emb_y - emblem_size//2), emblem)

# orbital rings
rings = Image.new('RGBA', (S, S), (0, 0, 0, 0))
rd = ImageDraw.Draw(rings)
for r, a, wdt, dash in [(int(emblem_size*0.635), 115, 5, 0), (int(emblem_size*0.695), 55, 3, 1)]:
    if dash:
        for i in range(48):
            ang0 = i * (360/48)
            rd.arc((CX-r, CY-r, CX+r, CY+r), ang0, ang0+4.5, fill=BRASS + (a,), width=wdt)
    else:
        rd.arc((CX-r, CY-r, CX+r, CY+r), 0, 360, fill=BRASS + (a,), width=wdt)
for ang in (32, 148, 212, 328):
    rad = math.radians(ang)
    x0 = CX + math.cos(rad) * (emblem_size*0.635 - 6)
    y0 = CY + math.sin(rad) * (emblem_size*0.635 - 6)
    x1 = CX + math.cos(rad) * (emblem_size*0.635 + 10)
    y1 = CY + math.sin(rad) * (emblem_size*0.635 + 10)
    rd.line([(x0, y0), (x1, y1)], fill=MARS + (220,), width=6)
bg = Image.alpha_composite(bg, rings)

# ---------- edge vignette only (radial, smooth) ----------
radial = Image.radial_gradient('L').resize((S, S), Image.LANCZOS)  # 0 center -> 255 edge
vig = Image.new('RGBA', (S, S), (0, 0, 0, 0))
vig.putalpha(radial.point(lambda v: int(max(0, (v/255 - 0.42)) / 0.58 * 115)))
bg = Image.alpha_composite(bg, vig)

# ---------- clip everything to the macOS rounded-square silhouette ----------
bg.putalpha(mask)

# ---------- export ----------
master = bg.resize((1024, 1024), Image.LANCZOS)
master.save(os.path.join(OUT, 'icon-1024.png'))
iconset = os.path.join(tempfile.mkdtemp(prefix='admech-icon-'), 'AppIcon.iconset')
os.makedirs(iconset, exist_ok=True)
for name, sz in [('icon_16x16.png',16),('icon_16x16@2x.png',32),('icon_32x32.png',32),('icon_32x32@2x.png',64),
                 ('icon_128x128.png',128),('icon_128x128@2x.png',256),('icon_256x256.png',256),('icon_256x256@2x.png',512),
                 ('icon_512x512.png',512),('icon_512x512@2x.png',1024)]:
    bg.resize((sz, sz), Image.LANCZOS).save(os.path.join(iconset, name))

# extra flat PNGs for the About panel and package previews
master.resize((512, 512), Image.LANCZOS).save(os.path.join(OUT, 'icon-512.png'))
master.resize((256, 256), Image.LANCZOS).save(os.path.join(OUT, 'icon-256.png'))
# build the macOS .icns (iconutil is part of macOS)
subprocess.run(['iconutil', '-c', 'icns', iconset, '-o', os.path.join(OUT, 'AppIcon.icns')], check=True)
print('generated', OUT)

