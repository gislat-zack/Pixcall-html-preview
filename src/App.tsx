import pixcall from 'pixcall'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePluginContext } from './hooks/usePluginContext'
import { buildPreviewDocument, fetchHtmlDocument, formatBytes } from './lib/html'
import { resolveMessages } from './lib/l10n'
import './styles/global.css'

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
function CodeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  )
}
function ScriptIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  )
}
function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
      <polyline points="21 3 21 8 16 8" />
    </svg>
  )
}
function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

type ViewState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; doc: Awaited<ReturnType<typeof fetchHtmlDocument>> }

export default function App() {
  const viewerContext = usePluginContext()
  const fileUrl = viewerContext?.masterUrl
  const locale = viewerContext?.locale
  const colorMode = viewerContext?.colorMode ?? 'light'
  const messages = useMemo(() => resolveMessages(locale), [locale])
  const title = useMemo(
    () => viewerContext?.fileName || messages['viewer.fallback_title'],
    [viewerContext?.fileName, messages]
  )
  const [view, setView] = useState<ViewState>({ status: 'loading' })
  const [tab, setTab] = useState<'preview' | 'source'>('preview')
  const [allowScripts, setAllowScripts] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => {
      const selection = window.getSelection()?.toString().trim() ?? ''
      event.preventDefault()
      if (selection.length > 0) {
        pixcall.menu.openTextAt({ x: event.clientX, y: event.clientY })
        return
      }
      pixcall.menu.openDefaultAt({ x: event.clientX, y: event.clientY })
    }
    document.body.addEventListener('contextmenu', handleContextMenu)
    return () => {
      document.body.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [])

  useEffect(() => {
    if (!fileUrl) {
      return
    }
    let cancelled = false
    setView({ status: 'loading' })
    fetchHtmlDocument(fileUrl)
      .then((doc) => {
        if (!cancelled) {
          setView({ status: 'ready', doc })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setView({ status: 'error' })
        }
      })
    return () => {
      cancelled = true
    }
  }, [fileUrl, reloadKey])

  const reload = useCallback(() => {
    setReloadKey((key) => key + 1)
  }, [])

  const handleClose = useCallback(async () => {
    const attempts: Array<() => Promise<void>> = [
      () => (pixcall.window as unknown as { close: () => Promise<void> }).close(),
      () => pixcall.plugin.unload(),
      () => pixcall.request('plugin.unload'),
    ]
    for (const attempt of attempts) {
      try {
        await attempt()
        return
      } catch {
        // try next
      }
    }
    // Fallback: at least clear the content
    setView({ status: 'error' })
  }, [])

  if (!viewerContext) {
    return <div className="state">{messages['viewer.waiting_context']}</div>
  }
  if (!fileUrl) {
    return <div className="state">{messages['viewer.missing_html_url']}</div>
  }
  return (
    <main className="viewer" data-color-mode={colorMode}>
      <header className="toolbar">
        <strong className="title">{title}</strong>
        {view.status === 'ready' && (
          <>
            <span className="size">{formatBytes(view.doc.byteSize)}</span>
            <div className="spacer" />
            <div className="tabs">
              <button
                type="button"
                className={tab === 'preview' ? 'active' : undefined}
                onClick={() => setTab('preview')}
                title={messages['viewer.tab_preview']}
              >
                <EyeIcon />
              </button>
              <button
                type="button"
                className={tab === 'source' ? 'active' : undefined}
                onClick={() => setTab('source')}
                title={messages['viewer.tab_source']}
              >
                <CodeIcon />
              </button>
            </div>
            {tab === 'preview' && (
              <button
                type="button"
                className={`action icon-btn${allowScripts ? ' active' : ''}`}
                onClick={() => setAllowScripts((enabled) => !enabled)}
                title={allowScripts ? messages['viewer.scripts_on'] : messages['viewer.scripts_off']}
              >
                <ScriptIcon />
              </button>
            )}
          </>
        )}
        {view.status !== 'ready' && <div className="spacer" />}
        <button
          type="button"
          className="action icon-btn"
          onClick={reload}
          disabled={view.status === 'loading'}
          title={messages['viewer.reload']}
        >
          <RefreshIcon />
        </button>
        <button
          type="button"
          className="action icon-btn close-btn"
          onClick={handleClose}
          title={messages['viewer.close']}
        >
          <CloseIcon />
        </button>
      </header>
      <section className="document">
        {view.status === 'loading' && (
          <div className="state">{messages['viewer.loading']}</div>
        )}
        {view.status === 'error' && (
          <div className="state">
            <span>{messages['viewer.failed_to_load']}</span>
            <button type="button" className="action" onClick={reload}>
              {messages['viewer.retry']}
            </button>
          </div>
        )}
        {view.status === 'ready' &&
          (tab === 'preview' ? (
            <iframe
              key={reloadKey}
              className="preview-frame"
              title={title}
              srcDoc={buildPreviewDocument(view.doc)}
              sandbox={allowScripts ? 'allow-scripts allow-forms allow-popups allow-modals' : ''}
            />
          ) : (
            <pre className="source-view">
              <code>{view.doc.source}</code>
            </pre>
          ))}
      </section>
    </main>
  )
}
