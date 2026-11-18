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
OUT_DIR = ROOT / "assets/characters/walk-video-v1"

# Inclusive 0-based 24fps source frame intervals + centered 640px crop left X + periodic-closure
# horizontal drift (pixels between frame [end+1] and frame [start] in 1080p) verified visually and
# by stabilized frame-wrap MSE for seamless stepping. Retimed 1:1 to 30fps (exact 2-vsync divisor
# on 60Hz displays) and repeated 6 cycles per MP4 (~5.8-6.4s continuous playback) so normal walks
# avoid frequent EOF <video loop> stalls without duplicating decoders or downloading extra streams.
CLIPS = {
    "front": {"frames": (11, 41), "crop_x": 610.2, "drift_1080": -0.47, "reps": 18, "anchor_baseline": 532, "cape_closure": False},
    "left":  {"frames": (69, 100), "crop_x": 616.5, "drift_1080": -1.67, "reps": 30, "anchor_baseline": 531, "cape_closure": True},
    "back":  {"frames": (130, 158), "crop_x": 612.0, "drift_1080": 6.46, "reps": 18, "anchor_baseline": 536, "cape_closure": False},
}

TARGET_FPS = 30
CRF = 25


def _alpha_mask(arr: np.ndarray) -> np.ndarray:
    kr, kg, kb = arr[0, 0]
    excess = max(1.0, float(kg) - max(float(kr), float(kb)) - 4.0)
    al = np.clip(1.0 - (arr[:, :, 1] - np.maximum(arr[:, :, 0], arr[:, :, 2]) - 4.0) / excess, 0.0, 1.0)
    al[al < 0.08] = 0.0
    return al


def _apply_periodic_cape_closure(raw_frames: list[Path], crop_x: float, n: int) -> list[np.ndarray]:
    """Build a 32-frame profile walk cycle from the steady-state straight-white-line frames
    (source frames 85..100 = indices 16..31 of raw_frames[69..101]), eliminating the post-turn
    crooked white coat line in frames 69..84 so Frame 31 -> Frame 0 has a 100% straight white line
    and sub-median transition error across head, waist_cape, back_cape, and legs.
    """
    steady_raw = raw_frames[16:32]  # 16 frames: source 85..100 (steady-state straight white line)
    m = len(steady_raw)  # 16

    def crop_at(path: Path, cl: float) -> np.ndarray:
        with Image.open(path) as im:
            resized = im.convert("RGB").resize(
                (320, 540),
                resample=Image.Resampling.LANCZOS,
                box=(cl, 0.0, cl + 640.0, 1080.0),
            )
            return np.asarray(resized, dtype=np.float32)

    init = [crop_at(p, crop_x) for p in steady_raw]
    head_x = [float(np.mean(np.where(_alpha_mask(a)[45:165, :] > 0.5)[1])) for a in init]
    mean_hx = float(np.mean(head_x))
    base = [crop_at(steady_raw[k], crop_x + (head_x[k] - mean_hx) * 2.0) for k in range(m)]

    # Stabilize the slight cuff/glove twist at boundaries k=0 (src 85) and k=15 (src 100)
    # without touching the front thigh (x < 116) or lower boots (y > 345).
    yy, xx = np.mgrid[0:540, 0:320].astype(np.float32)
    wy_c = np.clip((yy - 145.0) / 20.0, 0.0, 1.0) * np.clip((345.0 - yy) / 25.0, 0.0, 1.0)
    wx_c = np.clip((xx - 116.0) / 10.0, 0.0, 1.0) * np.clip((255.0 - xx) / 15.0, 0.0, 1.0)
    mask_cuff = (wy_c * wx_c)[:, :, None]
    base[0] = base[0] * (1.0 - mask_cuff) + base[1] * mask_cuff
    base[m - 1] = base[m - 1] * (1.0 - mask_cuff) + base[m - 2] * mask_cuff

    # 1D periodic harmonic stabilization of the back-cape trailing edge across the 16-frame step
    als = [_alpha_mask(a) for a in base]
    R = np.zeros((m, 540), dtype=np.float32)
    for k in range(m):
        for y in range(540):
            w = np.where(als[k][y] > 0.25)[0]
            R[k, y] = w.max() if len(w) else 160.0

    shift_ky = np.zeros((m, 540), dtype=np.float32)
    for y in range(145, 450):
        wy = 1.0
        if y < 180:
            wy = (y - 145) / 35.0
        elif y > 415:
            wy = (450 - y) / 35.0
        fft = np.fft.rfft(R[:, y])
        fft_tgt = np.zeros_like(fft)
        fft_tgt[0] = fft[0]
        fft_tgt[1] = fft[1] * 0.65
        tgt = np.fft.irfft(fft_tgt, n=m)
        shift_ky[:, y] = wy * (tgt - R[:, y])

    kernel = np.exp(-0.5 * (np.arange(-16, 17) / 6.0) ** 2)
    kernel /= kernel.sum()
    for k in range(m):
        shift_ky[k] = np.convolve(shift_ky[k], kernel, mode="same")

    xs = np.arange(320, dtype=np.float32)
    wx_edge = np.clip((xs - 142.0) / 48.0, 0.0, 1.0)

    def warp1d(img: np.ndarray, k: int) -> np.ndarray:
        out = np.empty_like(img)
        for y in range(540):
            dxy = shift_ky[k, y]
            if abs(dxy) < 1e-3:
                out[y] = img[y]
                continue
            src_x = np.clip(xs - dxy * wx_edge, 0.0, 319.0)
            x0 = np.floor(src_x).astype(np.int32)
            x1 = np.minimum(319, x0 + 1)
            f = (src_x - x0)[:, None]
            out[y] = img[y, x0] * (1.0 - f) + img[y, x1] * f
        return out

    w1 = [warp1d(base[k], k) for k in range(m)]

    # 2D periodic optical-flow closure between frame m-1 (k=15) and frame 0 (k=0)
    f0 = w1[0] * _alpha_mask(w1[0])[:, :, None]
    fm = w1[m - 1] * _alpha_mask(w1[m - 1])[:, :, None]
    step, rad, max_d, reg = 8, 10, 5, 4.0
    gy = np.arange(56, 456, step)
    gx = np.arange(60, 260, step)
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
                    p1 = fm[yc + dy - rad : yc + dy + rad, xc + dx - rad : xc + dx + rad]
                    err = float(np.mean((p0 - p1) ** 2)) + (dx * dx + dy * dy) * reg
                    if err < best:
                        best, bdx, bdy = err, dx, dy
            fdx[iy, ix] = bdx
            fdy[iy, ix] = bdy

    def upsample_flow(grid: np.ndarray) -> np.ndarray:
        im = Image.fromarray(grid).resize((200, 400), resample=Image.Resampling.BICUBIC)
        full = np.zeros((540, 320), dtype=np.float32)
        full[56:456, 60:260] = np.asarray(im, dtype=np.float32)
        taper = np.ones(540, dtype=np.float32)
        for y in range(540):
            if y > 425 or y < 45:
                taper[y] = 0.0
            elif y > 385:
                taper[y] = (425 - y) / 40.0
        return full * taper[:, None]

    up_dx = upsample_flow(fdx)
    up_dy = upsample_flow(fdy)

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

    step16 = [
        bilinear2d(
            w1[k],
            xx + ((k / float(m - 1)) - 0.5) * up_dx * 0.85,
            yy + ((k / float(m - 1)) - 0.5) * up_dy * 0.85,
        )
        for k in range(m)
    ]
    return step16 + step16


def encode_clip(
    source: Path,
    start_frame: int,
    end_frame: int,
    crop_x: float,
    drift_1080: float,
    reps: int,
    dest: Path,
    cape_closure: bool = False,
) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    n = end_frame - start_frame + 1
    extract_end = end_frame + (1 if cape_closure else 0)
    expected_raw = extract_end - start_frame + 1
    gop = n * 2

    with tempfile.TemporaryDirectory(prefix="gothic-walk-build-") as temp:
        tmp = Path(temp)
        raw_dir = tmp / "raw"
        stab_dir = tmp / "stab"
        raw_dir.mkdir()
        stab_dir.mkdir()

        # 1. Extract exact 1080p source frames for the chosen gait cycle (+1 continuation frame if closing cape seam).
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

        # 2. Single-pass fractional Lanczos crop+downscale (640x1080 -> 320x540) centered on the
        # head midline with periodic camera-drift closure (+ 2D waist/cape seam closure for profile view).
        if cape_closure:
            stabilized = _apply_periodic_cape_closure(raw_frames, crop_x, n)
            for k, arr in enumerate(stabilized):
                Image.fromarray(np.clip(arr + 0.5, 0, 255).astype(np.uint8)).save(stab_dir / f"s_{k:03d}.png")
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

    source = args.source.resolve()
    out_dir = args.out_dir.resolve()
    if not source.exists():
        raise FileNotFoundError(source)

    summary = {}
    total_bytes = 0
    for name, spec in CLIPS.items():
        start_frame, end_frame = spec["frames"]
        crop_x = spec["crop_x"]
        drift_1080 = spec["drift_1080"]
        reps = spec["reps"]
        cycle_len = end_frame - start_frame + 1
        dest = out_dir / f"gothic-boy-walk-{name}.mp4"
        encode_clip(
            source,
            start_frame,
            end_frame,
            crop_x,
            drift_1080,
            reps,
            dest,
            cape_closure=bool(spec.get("cape_closure", False)),
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
