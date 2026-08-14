#!/usr/bin/env python3
"""
perler_pattern.py — 照片转拼豆图纸生成器

输入: 一张照片 (PNG/JPG)
输出: 拼豆图纸 (预览 + 网格图 + 用料清单)

Usage:
  python perler_pattern.py input.jpg
  python perler_pattern.py input.jpg -o output.png --size 52
"""

import argparse
import json
import math
import os
import sys
from collections import Counter

from PIL import Image, ImageDraw, ImageFont


# ── 色卡 ──────────────────────────────────────────────────────────────

def load_palette(path):
    """从 JSON 加载拼豆色卡，返回 [(code, (r,g,b)), ...]。"""
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return [(c['code'], tuple(c['rgb'])) for c in data['colors']]


# ── 量化 ──────────────────────────────────────────────────────────────

def nearest_color(rgb, palette):
    """在色卡中找最接近的颜色，返回 (code, palette_rgb)。"""
    best_code, best_rgb = palette[0]
    best_dist = float('inf')
    for code, prgb in palette:
        dist = (rgb[0] - prgb[0]) ** 2 + (rgb[1] - prgb[1]) ** 2 + (rgb[2] - prgb[2]) ** 2
        if dist < best_dist:
            best_dist = dist
            best_code, best_rgb = code, prgb
    return best_code, best_rgb


def quantize(img, palette, grid_size):
    """
    缩放 + 颜色量化。
    返回 (grid, used_colors, total_beads)
    grid[y][x] = (code, (r,g,b))
    """
    img = img.convert('RGB').resize((grid_size, grid_size), Image.LANCZOS)
    px = img.load()

    grid = []
    used = Counter()
    for y in range(grid_size):
        row = []
        for x in range(grid_size):
            rgb = px[x, y][:3]
            code, prgb = nearest_color(rgb, palette)
            row.append((code, prgb))
            used[code] += 1
        grid.append(row)

    return grid, used, sum(used.values())


# ── 字体 ──────────────────────────────────────────────────────────────

def _font(size):
    """尝试加载等宽字体，失败则用默认。"""
    for p in [
        'C:/Windows/Fonts/consola.ttf',
        'C:/Windows/Fonts/cour.ttf',
        'C:/Windows/Fonts/arial.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/noto/NotoSansMono-Regular.ttf',
    ]:
        try:
            return ImageFont.truetype(p, size)
        except (OSError, IOError):
            pass
    return ImageFont.load_default()


# ── 渲染：预览 ────────────────────────────────────────────────────────

def render_preview(grid, cell=10):
    """像素画预览（无网格线，无标签）。"""
    n = len(grid)
    img = Image.new('RGB', (n * cell, n * cell))
    d = ImageDraw.Draw(img)
    for y, row in enumerate(grid):
        for x, (_, rgb) in enumerate(row):
            x0, y0 = x * cell, y * cell
            d.rectangle([x0, y0, x0 + cell - 1, y0 + cell - 1], fill=rgb)
    return img


# ── 渲染：网格图纸 ────────────────────────────────────────────────────

def render_grid(grid, palette_dict, cell=30, margin=48):
    """带编号的网格图纸。"""
    n = len(grid)
    w = margin + n * cell + 1
    h = margin + n * cell + 1

    img = Image.new('RGB', (w, h), 'white')
    d = ImageDraw.Draw(img)

    font = _font(max(8, cell // 4))
    num_font = _font(10)

    # 列号（顶部）
    for x in range(n):
        cx = margin + x * cell + cell // 2
        d.text((cx, 4), str(x + 1), fill='#888888', font=num_font, anchor='mt')

    # 行号（左侧）
    for y in range(n):
        cy = margin + y * cell + cell // 2
        d.text((margin - 6, cy), str(y + 1), fill='#888888', font=num_font, anchor='rm')

    # 单元格
    for y, row in enumerate(grid):
        for x, (code, rgb) in enumerate(row):
            x0 = margin + x * cell
            y0 = margin + y * cell
            x1, y1 = x0 + cell - 1, y0 + cell - 1

            # 填色
            d.rectangle([x0, y0, x1, y1], fill=rgb)
            # 网格线
            d.rectangle([x0, y0, x1, y1], outline='#cccccc')

            # 标签（深色背景用白字，浅色用黑字）
            lum = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]
            txt_color = 'white' if lum < 140 else 'black'
            d.text((x0 + cell // 2, y0 + cell // 2), code,
                   fill=txt_color, font=font, anchor='mm')

    return img


# ── 渲染：用料清单 ────────────────────────────────────────────────────

def render_chart(used, palette_dict, cols=8, swatch=18):
    """用料清单（色块 + 色号 + 数量）。"""
    sorted_colors = sorted(used.items(), key=lambda x: -x[1])
    total = sum(used.values())
    rows_needed = math.ceil(len(sorted_colors) / cols)

    row_h = swatch + 18
    w = cols * (swatch + 70) + 20
    h = rows_needed * row_h + 30

    img = Image.new('RGB', (w, h), 'white')
    d = ImageDraw.Draw(img)

    title_font = _font(13)
    font = _font(11)
    small = _font(9)

    # 标题
    d.text((10, 6), f'用料清单  共{len(sorted_colors)}色  总计{total}颗',
           fill='black', font=title_font)

    for i, (code, count) in enumerate(sorted_colors):
        col = i % cols
        row = i // cols
        x0 = 10 + col * (swatch + 70)
        y0 = 26 + row * row_h

        rgb = palette_dict.get(code, (200, 200, 200))
        d.rectangle([x0, y0, x0 + swatch, y0 + swatch], fill=rgb, outline='#aaaaaa')
        d.text((x0 + swatch + 4, y0 + 1), code, fill='black', font=font)
        d.text((x0 + swatch + 4, y0 + 13), f'{count}颗', fill='#888888', font=small)

    return img


# ── 渲染：头部 ────────────────────────────────────────────────────────

def render_header(grid_size, palette_name, n_colors, total_beads):
    """图纸头部信息条。"""
    font = _font(14)
    text = f'色卡：{palette_name}    {grid_size}×{grid_size}格    共{n_colors}色  总计{total_beads}颗'
    img = Image.new('RGB', (600, 30), 'white')
    d = ImageDraw.Draw(img)
    d.text((10, 8), text, fill='#333333', font=font)
    # 取实际文字宽度裁剪
    bbox = d.textbbox((0, 0), text, font=font)
    w = bbox[2] - bbox[0] + 30
    return img.crop((0, 0, w, 30))


# ── 主流程 ────────────────────────────────────────────────────────────

def generate(input_path, output_path, grid_size, palette_path, cell_size):
    """完整生成流程。"""
    # 加载色卡
    palette = load_palette(palette_path)
    palette_dict = {code: rgb for code, rgb in palette}
    palette_name = 'MARD'

    # 读取 + 量化
    img = Image.open(input_path)
    grid, used, total_beads = quantize(img, palette, grid_size)
    n_colors = len(used)

    # 各部分
    header = render_header(grid_size, palette_name, n_colors, total_beads)
    preview = render_preview(grid, cell=10)
    grid_img = render_grid(grid, palette_dict, cell=cell_size)
    chart = render_chart(used, palette_dict)

    # 纵向拼接
    gap = 15
    width = max(preview.width, grid_img.width, chart.width, header.width)
    height = header.height + gap + preview.height + gap + grid_img.height + gap + chart.height

    final = Image.new('RGB', (width, height), 'white')
    y = 0
    final.paste(header, (0, y)); y += header.height + gap
    final.paste(preview, (0, y)); y += preview.height + gap
    final.paste(grid_img, (0, y)); y += grid_img.height + gap
    final.paste(chart, (0, y))

    final.save(output_path, 'PNG')
    print(f'[OK] 拼豆图纸已生成: {output_path}')
    print(f'     网格: {grid_size}x{grid_size}')
    print(f'     用色: {n_colors}色 / {total_beads}颗')
    print(f'     色卡: {palette_name} ({len(palette)}色)')
    return output_path


def main():
    ap = argparse.ArgumentParser(description='照片转拼豆图纸生成器')
    ap.add_argument('input', help='输入图片路径 (PNG/JPG)')
    ap.add_argument('-o', '--output', help='输出路径 (默认: <input>_perler.png)')
    ap.add_argument('-s', '--size', type=int, default=52, help='网格尺寸 (默认: 52)')
    ap.add_argument('-p', '--palette', default=None, help='色卡 JSON 路径 (默认: mard-221.json)')
    ap.add_argument('--cell', type=int, default=30, help='网格单元格像素 (默认: 30)')
    args = ap.parse_args()

    if not os.path.isfile(args.input):
        print(f'[ERROR] 文件不存在: {args.input}', file=sys.stderr)
        sys.exit(1)

    # 默认色卡：脚本同目录下的 mard-221.json
    palette = args.palette or os.path.join(os.path.dirname(os.path.abspath(__file__)), 'mard-221.json')
    if not os.path.isfile(palette):
        print(f'[ERROR] 色卡文件不存在: {palette}', file=sys.stderr)
        print(f'   下载: https://github.com/HansBug/pindou-color-data', file=sys.stderr)
        sys.exit(1)

    output = args.output or os.path.splitext(args.input)[0] + '_perler.png'
    generate(args.input, output, args.size, palette, args.cell)


if __name__ == '__main__':
    main()
