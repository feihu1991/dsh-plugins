// dsh-mobile-upload — Host half.
// Exposes POST /dsh-mobile-upload/upload: receives { name, base64 } and writes
// the decoded bytes into the sandbox workspace root, so the agent can then
// read / process the file with its own tools. Mirrors the shell-seam pattern
// of dsh-opencode-go-quota (node - script on stdin) for quoting safety.

export const name = 'dsh-mobile-upload'
export const inject = ['webServer', 'shell', 'sandboxPolicy', 'systemPrompt']

/** Sanitize an upload filename to its basename with a safe charset. */
function safeName(name) {
  const base = String(name || 'upload.bin').split(/[\\/]/).pop() || 'upload.bin'
  const clean = base.replace(/[^\w.\-\u4e00-\u9fff ]/g, '_').slice(0, 120)
  return clean || 'upload.bin'
}

/** Read a bounded JSON request body. */
function readBody(req, cap = 64 * 1024 * 1024) {
  return new Promise((resolve) => {
    let size = 0
    const chunks = []
    req.on('data', (c) => {
      size += c.length
      if (size > cap) {
        req.resume()
        resolve(null)
        return
      }
      chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', () => resolve(null))
  })
}

export function apply(ctx) {
  const shell = ctx.shell
  const sandboxPolicy = ctx.sandboxPolicy
  // Uploads land in the agent's session workspace so its read/read_image/bash
  // tools find them naturally. sandboxPolicy.workspaceRoot points at the
  // harness home (/root), not the session cwd (/root/money), so prefer the
  // session workspace.
  const workspaceRoot = '/root/money'
  const MAX_B64 = 20 * 1024 * 1024

  // Recently uploaded files (in-memory, host process lifetime). Surfaced to the
  // agent via a dynamic systemPrompt section so the NEXT agent turn automatically
  // knows about files the user just uploaded — no manual hint required.
  const uploadedFiles = []

  async function writeFile(name, b64) {
    const targetPath = workspaceRoot + '/' + name
    const script = [
      "const fs = require('fs');",
      "const path = require('path');",
      'const target = ' + JSON.stringify(targetPath) + ';',
      'const b64 = ' + JSON.stringify(b64) + ';',
      'const buf = Buffer.from(b64, "base64");',
      'let err = null;',
      'try {',
      '  fs.mkdirSync(path.dirname(target), { recursive: true });',
      '  fs.writeFileSync(target, buf);',
      '} catch (e) {',
      '  err = String((e && e.message) || e);',
      '}',
      'if (err !== null) {',
      "  console.log(JSON.stringify({ ok: false, error: err }));",
      '} else {',
      "  console.log(JSON.stringify({ ok: true, path: target, size: buf.length }));",
      '}',
    ].join('\n')

    let spec
    try {
      spec = shell.resolve({ command: 'node -', stdin: script, timeoutMs: 20000, stdoutMaxBytes: 10000 })
    } catch (e) {
      return { ok: false, error: 'shell.resolve failed: ' + String((e && e.message) || e) }
    }
    let result
    try {
      result = await shell.run(spec)
    } catch (e) {
      return { ok: false, error: 'shell.run failed: ' + String((e && e.message) || e) }
    }
    if (result.exitCode !== 0) {
      const errText = result.stderr ? result.stderr.text : ''
      return { ok: false, error: 'node exited ' + result.exitCode + ': ' + (errText || 'no stderr') }
    }
    const text = result.stdout ? result.stdout.text : ''
    let parsed = null
    try { parsed = JSON.parse(text.trim()) } catch (e) {}
    if (!parsed) return { ok: false, error: 'unparseable child output' }
    return parsed
  }

  const handler = async (req, res) => {
    if (req.method !== 'POST') {
      res.writeHead(405, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ ok: false, error: 'method not allowed' }))
      return
    }
    let url
    try { url = new URL(req.url ?? '/', 'http://x') } catch (e) { url = null }
    if (!url || url.pathname !== '/dsh-mobile-upload/upload') {
      res.writeHead(404, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ ok: false, error: 'not found' }))
      return
    }
    const raw = await readBody(req)
    if (raw === null) {
      res.writeHead(400, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ ok: false, error: 'body too large or unreadable' }))
      return
    }
    let payload = null
    try { payload = JSON.parse(raw) } catch (e) { payload = null }
    if (!payload || typeof payload.base64 !== 'string') {
      res.writeHead(400, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ ok: false, error: 'missing base64' }))
      return
    }
    if (payload.base64.length > MAX_B64) {
      res.writeHead(413, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ ok: false, error: 'file too large' }))
      return
    }
    const name = safeName(payload.name)
    const outcome = await writeFile(name, payload.base64)
    if (outcome.ok === true) {
      uploadedFiles.push({ name, path: outcome.path, size: outcome.size, at: Date.now() })
      // Cap the running list so the prompt section never grows unbounded.
      while (uploadedFiles.length > 20) uploadedFiles.shift()
    }
    res.writeHead(outcome.ok === true ? 200 : 500, { 'content-type': 'application/json', 'cache-control': 'no-cache' })
    res.end(JSON.stringify(outcome))
  }

  ctx.effect(() => ctx.webServer.register({ kind: 'prefix', path: '/dsh-mobile-upload', handler }),
    'dsh-mobile-upload: /dsh-mobile-upload routes')

  // Surface recently uploaded files to the agent. The text provider is
  // re-evaluated on every prompt assembly, so an upload made just before the
  // next user message is included automatically.
  ctx.effect(() => ctx.systemPrompt.section({
    name: 'plugin:dsh-mobile-upload',
    order: 190,
    text: () => {
      if (uploadedFiles.length === 0) return ''
      const lines = uploadedFiles.map((f) => {
        const t = new Date(f.at).toLocaleTimeString('zh-CN', { hour12: false })
        return '- ' + f.path + ' (' + f.size + ' bytes, ' + t + ')'
      })
      return '用户最近通过界面上传了以下文件到工作区,如有需要请直接读取处理(用 read_image 看图、用 read 看文本):\n' + lines.join('\n')
    },
  }), 'dsh-mobile-upload: uploaded-files context section')
}
