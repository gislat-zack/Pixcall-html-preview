export interface HtmlDocument {
  source: string
  baseHref: string
  byteSize: number
}

export async function fetchHtmlDocument(url: string): Promise<HtmlDocument> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`)
  }
  const source = await response.text()
  return {
    source,
    baseHref: resolveBaseHref(url),
    byteSize: new TextEncoder().encode(source).byteLength,
  }
}

export function buildPreviewDocument(doc: HtmlDocument): string {
  const baseTag = /<base[\s>]/i.test(doc.source)
    ? ''
    : `<base href="${doc.baseHref.replace(/"/g, '%22')}">`
  const bridge = buildBridgeScript(doc.baseHref)
  const combined = `${baseTag}${bridge}`
  if (/<head[^>]*>/i.test(doc.source)) {
    return doc.source.replace(/<head[^>]*>/i, (match) => `${match}${combined}`)
  }
  if (/<html[^>]*>/i.test(doc.source)) {
    return doc.source.replace(/<html[^>]*>/i, (match) => `${match}<head>${combined}</head>`)
  }
  return `<head>${combined}</head>${doc.source}`
}

function buildBridgeScript(baseHref: string): string {
  return `<script>(function(){
  var base = ${JSON.stringify(baseHref)};
  var baseUrl = new URL(base);
  var baseOrigin = baseUrl.origin;

  function isBlockedUrl(u) {
    try {
      var parsed = new URL(u, base);
      // Only block http(s) requests to the same Pixcall server
      if (!/^https?:$/.test(parsed.protocol)) return false;
      if (parsed.origin !== baseOrigin) return false;
      // Allow requests to the same path (page reloads)
      // Block requests to any other path on Pixcall server
      return parsed.pathname !== baseUrl.pathname.replace(/\\/$/, '');
    } catch(e) {
      return false;
    }
  }

  var origFetch = window.fetch;
  if (origFetch) {
    window.fetch = function(input, init) {
      var url = typeof input === 'string' ? input : input && input.url || '';
      if (isBlockedUrl(url)) {
        console.warn('fetch blocked:', url);
        var err = new Error('Preview sandbox: blocked fetch to Pixcall server');
        err.code = 'PREVIEW_BLOCKED';
        return Promise.reject(err);
      }
      return origFetch.apply(this, arguments);
    };
  }

  var origXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    if (isBlockedUrl(url)) {
      console.warn('XHR blocked:', url);
      return origXHROpen.apply(this, [method + '_blocked', 'about:blank']);
    }
    return origXHROpen.apply(this, arguments);
  };

  // Intercept <a> clicks — only block http(s) same-origin links
  // Allow pixcall://, external http(s), #anchors, mailto/tel/javascript
  document.addEventListener('click', function(e) {
    var a = e.target && e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href.startsWith('#')) return;
    try {
      var parsed = new URL(href, base);
      // Non-http(s) protocols (pixcall://, mailto:, tel:, javascript:) — let browser handle
      if (!/^https?:$/.test(parsed.protocol)) return;
      // External http(s) — let browser handle
      if (parsed.origin !== baseOrigin) return;
      // Same Pixcall server, different path — block
      if (parsed.pathname !== baseUrl.pathname.replace(/\\/$/, '')) {
        e.preventDefault();
        e.stopPropagation();
        console.warn('Navigation blocked:', href);
      }
    } catch(ex) {}
  }, true);

  document.addEventListener('submit', function(e) {
    var form = e.target;
    if (!form || form.tagName !== 'FORM') return;
    var action = form.getAttribute('action') || '';
    if (!action || /^(mailto|javascript):/i.test(action)) return;
    if (isBlockedUrl(action)) {
      e.preventDefault();
      console.warn('Form blocked:', action);
    }
  }, true);
})();<\/script>`
}

function resolveBaseHref(url: string): string {
  const cutoff = [url.indexOf('?'), url.indexOf('#')]
    .filter((index) => index >= 0)
    .reduce((min, index) => Math.min(min, index), url.length)
  const slashIndex = url.lastIndexOf('/', cutoff)
  return slashIndex >= 0 ? url.slice(0, slashIndex + 1) : url
}

function insertBaseTag(html: string, baseTag: string): string {
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, (match) => `${match}${baseTag}`)
  }
  if (/<html[^>]*>/i.test(html)) {
    return html.replace(/<html[^>]*>/i, (match) => `${match}<head>${baseTag}</head>`)
  }
  return `${baseTag}${html}`
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
