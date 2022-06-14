const { build } = require('esbuild')
const path = require('path')
const fs = require('fs').promises
const { PLUGINS, PLUGIN_BUILDER_VERSION } = require('../constants')

const versions = {
  1: {
    tailwindcss: 'tailwindcss-v1',
    plugins: PLUGINS[1],
  },
  2: {
    tailwindcss: 'tailwindcss-v2',
    plugins: PLUGINS[2],
  },
  3: {
    tailwindcss: 'tailwindcss',
    plugins: PLUGINS[3],
  },
  insiders: {
    tailwindcss: 'tailwindcss-insiders',
    plugins: PLUGINS[3],
  },
}

Object.keys(versions).forEach((tailwindVersion) => {
  const tailwindModule = versions[tailwindVersion].tailwindcss

  Object.entries(versions[tailwindVersion].plugins).forEach(
    async ([pluginName, { version: pluginVersion, main: pluginMain }]) => {
      const output = await build({
        entryPoints: [path.resolve('./node_modules', pluginMain)],
        write: false,
        minify: true,
        bundle: true,
        external: ['fs', 'path', 'util'],
        format: 'esm',
        plugins: [
          {
            name: tailwindVersion,
            setup(build) {
              if (tailwindModule !== 'tailwindcss') {
                build.onResolve({ filter: /^tailwindcss(\/|$)/ }, (args) => ({
                  path:
                    args.path.replace(
                      /^tailwindcss/,
                      path.resolve('./node_modules', tailwindModule)
                    ) + '.js',
                }))
              }
            },
          },
        ],
      })

      await fs.mkdir(
        path.join('./public/plugins', PLUGIN_BUILDER_VERSION, tailwindVersion),
        {
          recursive: true,
        }
      )

      if (pluginName.includes('/')) {
        const parts = pluginName.split('/')
        await fs.mkdir(
          path.join(
            './public/plugins',
            PLUGIN_BUILDER_VERSION,
            tailwindVersion,
            ...parts.slice(0, parts.length - 1)
          ),
          {
            recursive: true,
          }
        )
      }

      const code = new TextDecoder('utf-8').decode(
        output.outputFiles[0].contents
      )

      await fs.writeFile(
        path.join(
          './public/plugins',
          PLUGIN_BUILDER_VERSION,
          tailwindVersion,
          `${pluginName}@${pluginVersion}.js`
        ),
        'var require = () => ({ deprecate: _ => _ });' + code,
        'utf8'
      )
    }
  )
})
