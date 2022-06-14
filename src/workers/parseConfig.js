import { PLUGINS, PLUGIN_BUILDER_VERSION } from '../constants'
import colors2 from 'tailwindcss-v2/colors'
import colors3 from 'tailwindcss/colors'

let colors = {
  2: colors2,
  3: colors3,
  insiders: colors3,
}

export async function parseConfig(configStr, tailwindVersion) {
  let mod = {}

  try {
    await (0, eval)('import("")')
  } catch (error) {
    if (error instanceof TypeError) {
      self.importShim = (0, eval)('u=>import(u)')
    } else {
      importScripts('https://unpkg.com/shimport@2.0.4/index.js')
      self.importShim = __shimport__.load
    }
  }

  class RequireError extends Error {
    constructor(message, line) {
      super(message)
      this.name = 'RequireError'
      this.line = line
    }
  }

  const builtinPlugins = {
    _builderVersion: PLUGIN_BUILDER_VERSION,
    _tailwindVersion: tailwindVersion,
    ...PLUGINS[tailwindVersion],
  }

  const before = `(async function(module){
    const require = async (m, line, builtinPlugins) => {
      if (typeof m !== 'string') {
        throw new RequireError('The "id" argument must be of type string. Received ' + typeof m, line)
      }
      if (m === '') {
        throw new RequireError("The argument 'id' must be a non-empty string. Received ''", line)
      }
      if (/^tailwindcss\\/colors(\\.js)?$/.test(m)) {
        ${
          colors[tailwindVersion]
            ? `return ${JSON.stringify(colors[tailwindVersion])}`
            : `throw new RequireError("Cannot find module '" + m + "'", line)`
        }
      }
      let result
      try {
        const href = builtinPlugins[m]
          ? '/plugins/' + builtinPlugins._builderVersion + '/' + builtinPlugins._tailwindVersion + '/' + m + '@' + builtinPlugins[m].version + '.js'
          : 'https://cdn.skypack.dev/' + m + '?min'
        result = await self.importShim(href)
      } catch (error) {
        throw new RequireError("Cannot find module '" + m + "'", line)
      }
      return result.default || result
    }`
  const after = `})(mod)`

  try {
    await eval(
      before +
        '\n' +
        configStr
          .split('\n')
          .map((line, i) =>
            line.replace(
              /\brequire\(([^(]*)\)/g,
              (_m, id) =>
                `(await require(${id.trim() === '' ? 'undefined' : id}, ${
                  i + 1
                }, ${JSON.stringify(builtinPlugins)}))`
            )
          )
          .join('\n') +
        '\n' +
        after
    )
  } catch (error) {
    let line

    if (error instanceof RequireError) {
      line = error.line
    } else if (typeof error.line !== 'undefined') {
      line = error.line - 1 - before.split('\n').length
    } else {
      const lines = error.stack.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const re = /:([0-9]+):([0-9]+)/g
        const matches = []
        let match
        while ((match = re.exec(lines[i])) !== null) {
          matches.push(match)
        }
        if (matches.length > 0) {
          line =
            parseInt(matches[matches.length - 1][1], 10) -
            before.split('\n').length
          break
        }
      }
    }

    return {
      _error: {
        message: error.message,
        line: typeof line === 'undefined' ? undefined : line,
      },
    }
  }

  return mod.exports || {}
}
