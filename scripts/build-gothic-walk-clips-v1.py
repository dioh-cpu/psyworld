#!/usr/bin/env python3
"""Build directional MP4 walk clips for the basic Gothic Boy from the source video.

Requires ffmpeg, ffprobe, Pillow, and NumPy. Preserves the source MP4 unchanged in
assets/characters/source-video/ and writes three cropped, keyframe-aligned H.264
MP4 clips (front, left, back) into assets/characters/walk-video-v1/.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/characters/source-video/gothic-boy-walk-turn-v2.mp4"
SOURCE_LEFT = ROOT / "assets/characters/source-video/gothic-boy-walk-left-v3.mp4"
OUT_DIR = ROOT / "assets/characters/walk-video-v1"
GREEN_KEY = np.array([20.0, 188.0, 61.0], dtype=np.float32)

# Inclusive 0-based 24fps source frame intervals + centered crop/scale + periodic-closure
# verified visually and by stabilized frame-wrap MSE for seamless stepping. Retimed 1:1 to 30fps
# (exact 2-vsync divisor on 60Hz displays) and repeated 18-30 cycles per MP4 (~17.4-33.0s continuous
# playback) so normal walks avoid EOF <video loop> stalls without duplicating decoders.
CLIPS = {
    "front": {"source": SOURCE, "frames": (11, 41), "crop_x": 610.2, "drift_1080": -0.47, "reps": 18, "anchor_baseline": 532, "cape_closure": False},
    "left":  {"source": SOURCE_LEFT, "frames": (106, 138), "crop_x": 0.0, "drift_1080": 0.0, "reps": 30, "anchor_baseline": 531, "cape_closure": False, "gray_bg_closure": True},
    "back":  {"source": SOURCE, "frames": (130, 158), "crop_x": 612.0, "drift_1080": 6.46, "reps": 18, "anchor_baseline": 536, "cape_closure": False},
}

TARGET_FPS = 30
CRF = 25


def _alpha_mask(arr: np.ndarray) -> np.ndarray:
    kr, kg, kb = arr[0, 0]
    excess = max(1.0, float(kg) - max(float(kr), float(kb)) - 4.0)
    al = np.clip(1.0 - (arr[:, :, 1] - np.maximum(arr[:, :, 0], arr[:, :, 2]) - 4.0) / excess, 0.0, 1.0)
    al[al < 0.08] = 0.0
    return al


def _extract_1080x1920_gray_to_320x540_green(path: Path) -> np.ndarray:
    """Convert a 1080x1920 vertical profile frame on uniform light-gray background (#E4E4E4)
    to a 320x540 chroma-green (20, 188, 61) frame matched in height, baseline (531), and midline
    to the front/back clips, using border+gap flood-fill and 7px premultiplied edge unmixing.
    """
    im1080 = np.asarray(Image.open(path).convert("RGB"), dtype=np.float32)
    h, w, _ = im1080.shape
    bg = np.median(im1080[:40, :40].reshape(-1, 3), axis=0)
    dist = np.sqrt(np.sum((im1080 - bg[None, None, :]) ** 2, axis=2))

    cand_full = dist < 38.0
    cand_half = cand_full[::2, ::2]
    dist_half = dist[::2, ::2]
    mh, mw = cand_half.shape
    mask_h = np.zeros((mh, mw), dtype=bool)
    mask_h[0, :] = cand_half[0, :]
    mask_h[-1, :] = cand_half[-1, :]
    mask_h[:, 0] = cand_half[:, 0]
    mask_h[:, -1] = cand_half[:, -1]

    # Seed flat uniform background patches in the enclosed lower-leg triangle between front/back boots
    flat_bg = dist_half < 8.0
    for _ in range(4):
        p = np.pad(flat_bg, 1, mode="constant", constant_values=False)
        flat_bg = (
            p[:-2, 1:-1] & p[2:, 1:-1] & p[1:-1, :-2] & p[1:-1, 2:]
            & p[:-2, :-2] & p[:-2, 2:] & p[2:, :-2] & p[2:, 2:]
        )
    gap_seed = np.zeros_like(flat_bg)
    gap_seed[710:925, 200:365] = flat_bg[710:925, 200:365]
    mask_h |= gap_seed

    while True:
        prev = mask_h.copy()
        p = np.pad(mask_h, 1, mode="constant", constant_values=False)
        dil = (
            p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:]
            | p[:-2, :-2] | p[:-2, 2:] | p[2:, :-2] | p[2:, 2:]
        )
        mask_h = (mask_h | dil) & cand_half
        if np.array_equal(mask_h, prev):
            break

    bg_mask = np.repeat(np.repeat(mask_h, 2, axis=0), 2, axis=1)[:h, :w] & cand_full
    for _ in range(2):
        p = np.pad(bg_mask, 1, mode="constant", constant_values=False)
        dil = (
            p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:]
            | p[:-2, :-2] | p[:-2, 2:] | p[2:, :-2] | p[2:, 2:]
        )
        bg_mask = (bg_mask | dil) & cand_full

    edge_band = bg_mask.copy()
    for step_i in range(7):
        p = np.pad(edge_band, 1, mode="constant", constant_values=False)
        nxt = (
            p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:]
            | p[:-2, :-2] | p[:-2, 2:] | p[2:, :-2] | p[2:, 2:]
        )
        if step_i < 5:
            edge_band = nxt
        else:
            edge_band[:1680, :] = nxt[:1680, :]

    raw_alpha = np.clip((dist - 150.0) / 140.0, 0.0, 1.0)
    alpha1080 = np.where(bg_mask, 0.0, np.where(edge_band, raw_alpha, 1.0)).astype(np.float32)
    safe_a = np.maximum(alpha1080, 0.08)[:, :, None]
    fg1080 = np.clip((im1080 - bg[None, None, :] * (1.0 - alpha1080[:, :, None])) / safe_a, 0.0, 255.0)
    fg1080 = np.where(edge_band[:, :, None] & (alpha1080[:, :, None] < 0.98), np.minimum(fg1080, 34.0), fg1080)

    pre1080 = fg1080 * alpha1080[:, :, None]
    pil_pre = Image.fromarray(np.clip(pre1080 + 0.5, 0, 255).astype(np.uint8))
    pil_al = Image.fromarray(np.clip(alpha1080 * 255.0 + 0.5, 0, 255).astype(np.uint8))

    pre_sub = np.asarray(pil_pre.resize((288, 512), Image.Resampling.LANCZOS), dtype=np.float32)
    al_sub = np.asarray(pil_al.resize((288, 512), Image.Resampling.LANCZOS), dtype=np.float32) / 255.0
    al_sub = np.clip(al_sub, 0.0, 1.0)

    canvas = np.broadcast_to(GREEN_KEY, (540, 320, 3)).copy()
    canvas[20:532, 16:304] = pre_sub + GREEN_KEY[None, None, :] * (1.0 - al_sub[:, :, None])
    return canvas


def _apply_gray_bg_periodic_closure(raw_frames: list[Path], n: int) -> list[np.ndarray]:
    """Extract n+1 frames (0..n) from the 1080x1920 walk-in-place profile clip onto 320x540 chroma
    green and apply gentle 2D periodic optical-flow closure between frame[0] and frame[n].
    """
    w1 = [_extract_1080x1920_gray_to_320x540_green(raw_frames[k]) for k in range(n + 1)]
    f0 = w1[0] * _alpha_mask(w1[0])[:, :, None]
    fn = w1[n] * _alpha_mask(w1[n])[:, :, None]
    step, rad, max_d, reg = 8, 10, 5, 5.0
    gy = np.arange(40, 520, step)
    gx = np.arange(40, 260, step)
    fdx = np.zeros((len(gy), len(gx)), dtype=np.float32)
    fdy = np.zeros((len(gy), len(gx)), dtype=np.float32)
    for iy, yc in enumerate(gy):
        for ix, xc in enumerate(gx):
            p0 = f0[yc - rad : yc + rad, xc - rad : xc + rad]
            if np.mean(p0) < 8.0:
                continue
            best, bdx, bdy = 1e18, 0, 0
            for dy in range(-max_d, max_d + 1):
                for dx in range(-max_d, max_d + 1):
                    p1 = fn[yc + dy - rad : yc + dy + rad, xc + dx - rad : xc + dx + rad]
                    err = float(np.mean((p0 - p1) ** 2)) + (dx * dx + dy * dy) * reg
                    if err < best:
                        best, bdx, bdy = err, dx, dy
            fdx[iy, ix] = bdx
            fdy[iy, ix] = bdy

    def upsample_flow(grid: np.ndarray) -> np.ndarray:
        im = Image.fromarray(grid).resize((220, 480), resample=Image.Resampling.BICUBIC)
        full = np.zeros((540, 320), dtype=np.float32)
        full[40:520, 40:260] = np.asarray(im, dtype=np.float32)
        return full

    up_dx = upsample_flow(fdx)
    up_dy = upsample_flow(fdy)
    yy, xx = np.mgrid[0:540, 0:320].astype(np.float32)

    def bilinear2d(img: np.ndarray, sx: np.ndarray, sy: np.ndarray) -> np.ndarray:
        sx = np.clip(sx, 0.0, 319.0)
        sy = np.clip(sy, 0.0, 539.0)
        x0 = np.floor(sx).astype(np.int32)
        x1 = np.minimum(319, x0 + 1)
        y0 = np.floor(sy).astype(np.int32)
        y1 = np.minimum(539, y0 + 1)
        fx = (sx - x0)[:, :, None]
        fy = (sy - y0)[:, :, None]
        top = img[y0, x0] * (1.0 - fx) + img[y0, x1] * fx
        bot = img[y1, x0] * (1.0 - fx) + img[y1, x1] * fx
        return top * (1.0 - fy) + bot * fy

    return [
        bilinear2d(w1[k], xx + ((k / float(n)) - 0.5) * up_dx, yy + ((k / float(n)) - 0.5) * up_dy)
        for k in range(n)
    ]


def encode_clip(
    source: Path,
    start_frame: int,
    end_frame: int,
    crop_x: float,
    drift_1080: float,
    reps: int,
    dest: Path,
    cape_closure: bool = False,
    gray_bg_closure: bool = False,
) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    n = end_frame - start_frame + 1
    extract_end = end_frame + (1 if (cape_closure or gray_bg_closure) else 0)
    expected_raw = extract_end - start_frame + 1
    gop = n * 2

    with tempfile.TemporaryDirectory(prefix="gothic-walk-build-") as temp:
        tmp = Path(temp)
        raw_dir = tmp / "raw"
        stab_dir = tmp / "stab"
        raw_dir.mkdir()
        stab_dir.mkdir()

        # 1. Extract exact 1080p source frames for the chosen gait cycle (+1 continuation frame if closing seam).
        subprocess.run(
            [
                "ffmpeg", "-y", "-v", "error",
                "-i", str(source),
                "-vf", f"select=between(n\\,{start_frame}\\,{extract_end}),format=rgb24",
                "-vsync", "0",
                str(raw_dir / "r_%03d.png"),
            ],
            check=True,
        )
        raw_frames = sorted(raw_dir.glob("r_*.png"))
        if len(raw_frames) != expected_raw:
            raise RuntimeError(f"Expected {expected_raw} raw frames for [{start_frame}..{extract_end}], got {len(raw_frames)}")

        # 2. Convert / crop+downscale to 320x540 with periodic closure.
        if gray_bg_closure:
            stabilized = _apply_gray_bg_periodic_closure(raw_frames, n)
            for k, arr in enumerate(stabilized):
                Image.fromarray(np.clip(arr + 0.5, 0, 255).astype(np.uint8)).save(stab_dir / f"s_{k:03d}.png")
        elif cape_closure:
            raise RuntimeError("Legacy cape_closure replaced by gray_bg_closure on gothic-boy-walk-left-v3.mp4")
        else:
            for k, raw_path in enumerate(raw_frames):
                crop_left = crop_x + (k / n - 0.5) * drift_1080
                with Image.open(raw_path) as im:
                    rgb = im.convert("RGB")
                    resized = rgb.resize(
                        (320, 540),
                        resample=Image.Resampling.LANCZOS,
                        box=(crop_left, 0.0, crop_left + 640.0, 1080.0),
                    )
                    resized.save(stab_dir / f"s_{k:03d}.png")

        # 3. Encode multi-cycle H.264 MP4 with aligned 2-cycle IDRs, zero B-frames, faststart.
        subprocess.run(
            [
                "ffmpeg", "-y", "-v", "error",
                "-stream_loop", str(reps - 1),
                "-framerate", str(TARGET_FPS),
                "-i", str(stab_dir / "s_%03d.png"),
                "-an",
                "-r", str(TARGET_FPS),
                "-c:v", "libx264",
                "-profile:v", "main",
                "-level:v", "3.1",
                "-pix_fmt", "yuv420p",
                "-crf", str(CRF),
                "-preset", "slow",
                "-g", str(gop),
                "-keyint_min", str(gop),
                "-sc_threshold", "0",
                "-bf", "0",
                "-refs", "1",
                "-movflags", "+faststart",
                str(dest),
            ],
            check=True,
        )


def inspect_clip(clip_path: Path) -> dict:
    stream_info = subprocess.check_output(
        [
            "ffprobe", "-v", "error",
            "-show_streams", "-show_format",
            "-of", "json", str(clip_path),
        ],
        text=True,
    )
    meta = json.loads(stream_info)
    packets_raw = subprocess.check_output(
        [
            "ffprobe", "-v", "error",
            "-select_streams", "v:0",
            "-show_packets", "-show_entries", "packet=pts_time,flags",
            "-of", "csv=p=0", str(clip_path),
        ],
        text=True,
    )
    lines = [ln.strip() for ln in packets_raw.splitlines() if ln.strip()]
    keyframes = [i for i, ln in enumerate(lines) if ",K" in ln]
    if 0 not in keyframes:
        raise RuntimeError(f"{clip_path.name}: frame 0 is not a keyframe")
    if len(meta.get("streams", [])) != 1:
        raise RuntimeError(f"{clip_path.name}: expected 1 video stream, got {len(meta.get('streams', []))}")
    v = meta["streams"][0]
    if int(v.get("has_b_frames", 0)) != 0:
        raise RuntimeError(f"{clip_path.name}: expected has_b_frames=0")
    return {
        "file": clip_path.name,
        "bytes": clip_path.stat().st_size,
        "width": int(v["width"]),
        "height": int(v["height"]),
        "frames": len(lines),
        "duration": round(float(meta["format"]["duration"]), 4),
        "keyframes": keyframes,
        "refs": int(v.get("refs", 0)),
    }


def measure_baselines(clip_path: Path, max_frames: int = 36) -> list[int]:
    """Compute exact 540p foot baseline matching core/gothic-walk-video-v1.js."""
    with tempfile.TemporaryDirectory(prefix="gothic-walk-base-") as temp:
        out_pat = str(Path(temp) / "f_%03d.png")
        subprocess.run(
            ["ffmpeg", "-v", "error", "-i", str(clip_path), "-vframes", str(max_frames), out_pat],
            check=True,
        )
        baselines: list[int] = []
        for frame_path in sorted(Path(temp).glob("f_*.png")):
            arr = np.asarray(Image.open(frame_path).convert("RGB"), dtype=np.float32)
            kr, kg, kb = arr[0, 0]
            excess = max(1.0, float(kg) - max(float(kr), float(kb)) - 4.0)
            ge = arr[:, :, 1] - np.maximum(arr[:, :, 0], arr[:, :, 2])
            alpha = 1.0 - np.clip((ge - 4.0) / excess, 0.0, 1.0)
            alpha[alpha < 0.05] = 0.0
            ys, _ = np.where(alpha > 0.12)
            baselines.append(int(ys.max()) + 1 if len(ys) else 525)
        return baselines


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=SOURCE)
    parser.add_argument("--out-dir", type=Path, default=OUT_DIR)
    args = parser.parse_args()

    out_dir = args.out_dir.resolve()

    summary = {}
    total_bytes = 0
    for name, spec in CLIPS.items():
        clip_source = Path(spec.get("source", args.source)).resolve()
        if not clip_source.exists():
            raise FileNotFoundError(clip_source)
        start_frame, end_frame = spec["frames"]
        crop_x = spec["crop_x"]
        drift_1080 = spec["drift_1080"]
        reps = spec["reps"]
        cycle_len = end_frame - start_frame + 1
        dest = out_dir / f"gothic-boy-walk-{name}.mp4"
        encode_clip(
            clip_source,
            start_frame,
            end_frame,
            crop_x,
            drift_1080,
            reps,
            dest,
            cape_closure=bool(spec.get("cape_closure", False)),
            gray_bg_closure=bool(spec.get("gray_bg_closure", False)),
        )
        info = inspect_clip(dest)
        info["source_frames"] = [start_frame, end_frame]
        info["cycle_frames"] = cycle_len
        info["reps"] = reps
        info["crop_x"] = crop_x
        info["drift_1080"] = drift_1080
        info["anchor_baseline"] = spec["anchor_baseline"]
        info["baselines"] = measure_baselines(dest, cycle_len)
        expected_frames = cycle_len * reps
        if info["frames"] != expected_frames:
            raise RuntimeError(f"{dest.name}: expected {expected_frames} frames, got {info['frames']}")
        total_bytes += info["bytes"]
        summary[name] = info
        print(
            f"{name}: {dest.relative_to(ROOT)} | {info['width']}x{info['height']} | "
            f"{info['frames']}f ({cycle_len}x{reps}) @{TARGET_FPS}fps ({info['duration']}s) | {info['bytes']} B | "
            f"crop_x={crop_x} drift_1080={drift_1080} anchor={spec['anchor_baseline']} keyframes={info['keyframes']}"
        )
        print(f"  cycle_soles={info['baselines']}")
    print(f"Total derived MP4 size: {total_bytes} bytes ({total_bytes / 1024:.1f} KiB)")


if __name__ == "__main__":
    main()
