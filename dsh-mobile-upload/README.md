# dsh-mobile-upload

手机 UI 输入框「附件」上传插件：在加号旁放一个回形针图标，点击选择文件，
把文件上传到沙箱工作区目录（`sandboxPolicy.workspaceRoot`，本机为 `/root/money`），
随后 agent 可用自己的工具（read / read_image / bash）读取并处理。

## 安装（本地路径）

```bash
dsh plugin --profile web add /root/dsh-mobile-upload
# 然后重启 dsh web
```

## 说明

- 宿主端注册 `POST /dsh-mobile-upload/upload`，接收 `{ name, base64 }`，
  解码后写入工作区根目录，返回 `{ ok, path, size }`。
- 客户端在 `conversation.input.left` 插槽（加号旁、额度圆环之前）注册回形针按钮。
- 图片也会上传到工作区（agent 用 read_image 读取）。

## 限制

- 单文件约 15MB（base64 上限 20MB）。
- 文件名做安全化处理。
