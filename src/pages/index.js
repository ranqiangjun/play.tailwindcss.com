import { useState, useRef, useEffect, useCallback } from 'react'
import Worker from 'worker-loader?filename=static/[name].[hash].js!../workers/postcss.worker.js'
import CompressWorker from 'worker-loader?filename=static/[name].[hash].js!../workers/compress.worker.js'
import dynamic from 'next/dynamic'
import LZString from 'lz-string'
import { createWorkerQueue } from '../utils/createWorkerQueue'
import { debounce } from 'debounce'

const Editor = dynamic(import('../components/Editor'), { ssr: false })

const defaultContent = {
  html: `<div class="md:flex">
  <div class="md:flex-shrink-0">
    <img class="rounded-lg md:w-56" src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=448&q=80" alt="Woman paying for a purchase">
  </div>
  <div class="mt-4 md:mt-0 md:ml-6">
    <div class="uppercase tracking-wide text-sm text-indigo-600 font-bold">Marketing</div>
    <a href="#" class="block mt-1 text-lg leading-tight font-semibold text-gray-900 hover:underline">Finding customers for your new business</a>
    <p class="mt-2 text-gray-600">Getting a new business off the ground is a lot of hard work. Here are five ideas you can use to find your first customers.</p>
  </div>
</div>\n`,
  css: '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n',
  config: 'module.exports = {\n  theme: {\n    //\n  }\n}\n',
}

export default function App() {
  const previewRef = useRef()
  const worker = useRef()
  const compressWorker = useRef()
  const [initialContent, setInitialContent] = useState()

  const injectHtml = useCallback((html) => {
    previewRef.current.contentWindow.postMessage({
      html,
    })
  }, [])

  const compileNow = useCallback(async (content) => {
    const { css, canceled, error } = await worker.current.emit({
      config: content.config,
      css: content.css,
    })
    if (canceled || error) {
      return
    }
    if (css) {
      previewRef.current.contentWindow.postMessage({ css })
    }
  }, [])

  const compile = useCallback(debounce(compileNow, 200), [])

  const updateUrl = useCallback(async (content) => {
    let { compressed, canceled, error } = await compressWorker.current.emit({
      string: JSON.stringify(content),
    })
    if (canceled || error) {
      return
    }
    if (compressed) {
      window.history.replaceState({}, '', `#${compressed}`)
    }
  }, [])

  const onChange = useCallback(
    (document, content) => {
      if (document === 'html') {
        injectHtml(content.html)
      } else {
        compile({ css: content.css, config: content.config })
      }
      updateUrl(content)
    },
    [injectHtml, compile, updateUrl]
  )

  useEffect(() => {
    worker.current = createWorkerQueue(Worker)
    compressWorker.current = createWorkerQueue(CompressWorker)

    const content = defaultContent

    if (window.location.hash) {
      try {
        Object.assign(
          content,
          JSON.parse(
            LZString.decompressFromEncodedURIComponent(
              window.location.hash.substr(1)
            )
          )
        )
      } catch (_) {}
    }

    setInitialContent({
      html: content.html,
      css: content.css,
      config: content.config,
    })

    injectHtml(content.html)
    compileNow(content)

    return () => {
      worker.current.terminate()
      compressWorker.current.terminate()
    }
  }, [compileNow, injectHtml])

  return (
    <>
      <div className="relative flex h-full">
        <div className="w-1/2 flex-none flex">
          <div className="flex flex-col w-full">
            {initialContent && (
              <Editor initialContent={initialContent} onChange={onChange} />
            )}
          </div>
        </div>
        <div className="relative w-1/2 flex-none">
          <iframe
            ref={previewRef}
            title="Preview"
            className="absolute inset-0 w-full h-full"
            srcDoc={`<!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style id="_style"></style>
                <script>
                window.addEventListener('message', (e) => {
                  if ('css' in e.data) {
                    const style = document.getElementById('_style')
                    const newStyle = document.createElement('style')
                    newStyle.id = '_style'
                    newStyle.innerHTML = e.data.css
                    style.parentNode.replaceChild(newStyle, style)
                  }
                  if ('html' in e.data) {
                    document.body.innerHTML = e.data.html
                  }
                })
                </script>
              </head>
              <body>
              </body>
            </html>`}
          />
        </div>
      </div>
    </>
  )
}