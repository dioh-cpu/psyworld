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

# Inclusive 0-based 24fps source frame intervals + centered crop X offsets + linear camera-drift
# compensation (dx over clip cycle) verified visually and by frame-wrap MSE for seamless stepping.
# Retimed 1:1 to 30fps (exact 2-vsync divisor on 60Hz displays) with zero synthetic blended frames.
CLIPS = {
    "front": {"frames": (11, 41), "crop_x": 609, "dx": 0, "anchor_baseline": 532},   # 31f (1.0333s @30fps)
    "left":  {"frames": (70, 101), "crop_x": 611, "dx": -6, "anchor_baseline": 530}, # 32f (1.0667s @30fps)
    "back":  {"frames": (130, 158), "crop_x": 617, "dx": 8, "anchor_baseline": 536}, # 29f (0.9667s @30fps)
}

TARGET_FPS = 30


def encode_clip(source: Path, start_frame: int, end_frame: int, crop_x: int, dx: int, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    n = end_frame - start_frame + 1
    x_expr = f"{crop_x}+({dx})*(n/{n}-0.5)" if dx else str(crop_x)
    vf = (
        f"select=between(n\\,{start_frame}\\,{end_frame}),"
        f"format=rgb24,"
        f"crop=640:1080:'{x_expr}':0:exact=1,"
        f"scale=320:540:flags=lanczos,"
        f"format=yuv420p,"
        f"setpts=N/({TARGET_FPS}*TB)"
    )
    subprocess.run(
        [
            "ffmpeg", "-y", "-v", "error",
            "-i", str(source),
            "-vf", vf,
            "-an",
            "-r", str(TARGET_FPS),
            "-c:v", "libx264",
            "-profile:v", "main",
            "-level:v", "3.1",
            "-pix_fmt", "yuv420p",
            "-crf", "16",
            "-preset", "slow",
            "-g", "5",
            "-keyint_min", "5",
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


def measure_baselines(clip_path: Path) -> list[int]:
    """Compute exact 540p foot baseline matching core/gothic-walk-video-v1.js."""
    with tempfile.TemporaryDirectory(prefix="gothic-walk-base-") as temp:
        out_pat = str(Path(temp) / "f_%03d.png")
        subprocess.run(
            ["ffmpeg", "-v", "error", "-i", str(clip_path), out_pat],
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
        dx = spec.get("dx", 0)
        dest = out_dir / f"gothic-boy-walk-{name}.mp4"
        encode_clip(source, start_frame, end_frame, crop_x, dx, dest)
        info = inspect_clip(dest)
        info["source_frames"] = [start_frame, end_frame]
        info["crop_x"] = crop_x
        info["dx"] = dx
        info["anchor_baseline"] = spec["anchor_baseline"]
        info["baselines"] = measure_baselines(dest)
        expected_frames = end_frame - start_frame + 1
        if info["frames"] != expected_frames:
            raise RuntimeError(f"{dest.name}: expected {expected_frames} frames, got {info['frames']}")
        total_bytes += info["bytes"]
        summary[name] = info
        print(
            f"{name}: {dest.relative_to(ROOT)} | {info['width']}x{info['height']} | "
            f"{info['frames']}f @{TARGET_FPS}fps ({info['duration']}s) | {info['bytes']} B | "
            f"crop_x={crop_x} dx={dx} anchor={spec['anchor_baseline']} keyframes={info['keyframes']}"
        )
        print(f"  measured_soles={info['baselines']}")
    print(f"Total derived MP4 size: {total_bytes} bytes ({total_bytes / 1024:.1f} KiB)")


if __name__ == "__main__":
    main()
