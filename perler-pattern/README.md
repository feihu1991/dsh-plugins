# 照片转拼豆图纸生成器

把一张照片自动转换成拼豆图纸：预览 + 编号网格 + 用料清单。

## 效果

输入一张照片 → 输出一张包含以下内容的图纸：

- **预览图**：像素画效果预览（无网格线）
- **网格图纸**：每个格子标注 MARD 色号，带行/列编号（可直接对着拼）
- **用料清单**：用了哪些色、每色多少颗、总计多少

## 用法

```bash
python perler_pattern.py 输入照片.jpg
python perler_pattern.py 输入照片.jpg -o 输出.png --size 52
```

### 参数

| 参数 | 默认值 | 说明 |
|---|---|---|
| `input` | （必填） | 输入图片路径 (PNG/JPG) |
| `-o / --output` | `<input>_perler.png` | 输出图片路径 |
| `-s / --size` | 52 | 网格尺寸（29 / 50 / 52 常用） |
| `-p / --palette` | 同目录 `mard-221.json` | 色卡 JSON 路径 |
| `--cell` | 30 | 网格单元格像素大小 |

## 依赖

```bash
pip install Pillow
```

## 色卡

默认使用 [MARD 221色](https://github.com/HansBug/pindou-color-data)（国内最主流），JSON 文件已随附。

可替换为其他色卡 JSON（Artkal / COCO / 漫漫家等），格式保持一致即可：
```json
{
  "colors": [
    {"code": "A1", "hex": "#FAF5CD", "rgb": [250, 245, 205], "group": "A"},
    ...
  ]
}
```

色卡数据来源：[HansBug/pindou-color-data](https://github.com/HansBug/pindou-color-data)（MIT 协议）。
