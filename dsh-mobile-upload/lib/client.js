// dsh-mobile-upload — Client half (web bundle).
// A paperclip button in the composer tool row (input.left, before the quota
// ring) that opens a file picker and uploads the chosen file into the sandbox
// workspace via the host route POST /dsh-mobile-upload/upload.
window.__ModuleLoader__.load({
  id: 'dsh-mobile-upload',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    const React = require('react')

    const TAG_ID = 'dsh-mobile-upload/upload.css'
    const CSS = [
      '.dsh-upld-wrap { position: relative; display: inline-flex; align-items: center; }',
      '.dsh-upld-btn { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; cursor: pointer; border: none; background: transparent; color: var(--dsw-alias-label-secondary); border-radius: 8px; flex: none; }',
      '.dsh-upld-btn:hover { background: var(--dsw-alias-interactive-bg-hover); }',
      '.dsh-upld-btn:disabled { opacity: .5; cursor: default; }',
      '.dsh-upld-toast { position: fixed; left: 50%; bottom: calc(env(safe-area-inset-bottom, 0px) + 72px); transform: translateX(-50%); background: var(--dsw-specific-menu, var(--dsw-alias-bg-overlay)); color: var(--dsw-alias-label-primary); border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px; padding: 6px 12px; font-size: 12px; line-height: 18px; box-shadow: var(--dsw-shadow-lv3); z-index: 9999; max-width: 90vw; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
      '.dsh-upld-toast.err { color: var(--dsw-alias-state-error-primary); }',
    ].join('\n')
    if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css=' + JSON.stringify(TAG_ID) + ']') === null) {
      const tag = document.createElement('style')
      tag.dataset.plugin = 'dsh-mobile-upload'
      tag.dataset.pluginCss = TAG_ID
      tag.textContent = CSS
      document.head.appendChild(tag)
    }

    function PaperclipIcon() {
      return React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
        React.createElement('path', {
          d: 'M9.5 4.5l-4 4a1.77 1.77 0 002.5 2.5l4.5-4.5a3.5 3.5 0 00-5-5l-4 4a5.3 5.3 0 007.5 7.5l4-4',
          stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round'
        })
      )
    }

    function uploadToWorkspace(file) {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result
          if (typeof result !== 'string') { resolve({ ok: false, error: 'read failed' }); return }
          const comma = result.indexOf(',')
          const b64 = comma >= 0 ? result.slice(comma + 1) : result
          fetch('/dsh-mobile-upload/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: file.name, base64: b64 })
          }).then((r) => r.json()).then((json) => resolve(json)).catch((e) => resolve({ ok: false, error: String((e && e.message) || e) }))
        }
        reader.onerror = () => resolve({ ok: false, error: 'read failed' })
        reader.readAsDataURL(file)
      })
    }

    function AttachmentButton() {
      const [toast, setToast] = React.useState(null)
      const fileRef = React.useRef(null)
      const timerRef = React.useRef(null)

      const openPicker = () => {
        if (fileRef.current) fileRef.current.click()
      }

      const onFiles = async (e) => {
        const input = e.target
        const files = input && input.files ? Array.from(input.files) : []
        if (input) input.value = ''
        if (files.length === 0) return
        let msg = null
        let isErr = false
        for (const file of files) {
          const res = await uploadToWorkspace(file)
          if (res && res.ok === true) {
            msg = '已上传到工作区: ' + String(res.path)
          } else {
            msg = '上传失败: ' + ((res && res.error) || 'unknown')
            isErr = true
            break
          }
        }
        if (timerRef.current) clearTimeout(timerRef.current)
        setToast({ text: msg, err: isErr })
        timerRef.current = setTimeout(() => setToast(null), 4500)
      }

      return React.createElement('div', { className: 'dsh-upld-wrap' },
        React.createElement('input', {
          ref: fileRef,
          type: 'file',
          multiple: true,
          style: { display: 'none' },
          onChange: onFiles,
          'aria-hidden': true,
          tabIndex: -1
        }),
        React.createElement('button', {
          type: 'button',
          className: 'dsh-upld-btn',
          'aria-label': '上传文件到工作区',
          title: '上传文件到工作区，供 agent 处理',
          onClick: openPicker
        }, React.createElement(PaperclipIcon)),
        toast ? React.createElement('div', { className: 'dsh-upld-toast' + (toast.err ? ' err' : '') }, toast.text) : null
      )
    }

    const inject = ['slots']

    function apply(ctx) {
      ctx.effect(() => ctx.slots.inject('conversation.input.left', () => ctx.slots.register(
        { name: 'conversation.input.left', id: 'dsh-mobile-upload-attach', order: -10, label: '上传文件' },
        () => React.createElement(AttachmentButton)
      )), 'dsh-mobile-upload: attach button')
    }

    exports.apply = apply
    exports.inject = inject
    return module.exports
  },
})
