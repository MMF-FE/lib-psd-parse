import { npmConfig, npmHosts } from './config'

export type moduleName = keyof typeof npmConfig

/**
 * 加载的模块缓存
 */
const _cache: {
    [module: string]: any
} = {}

/**
 * 加载中的队列
 */
const _onLoadQueue: {
    [module: string]: {
        resolve: Function
        reject: Function
    }[]
} = {}

let _npmHost = npmHosts[0]

const context = typeof window !== 'undefined' ? window : global

function getEsModule(module: any) {
    if (module && module.__esModule === true && module.default) {
        return module.default
    }
    return module
}

function hashExport(name: string, exportNames: string | string[]) {
    if (!_cache[name]) {
        if (Array.isArray(exportNames)) {
            const res: any = {}
            exportNames.forEach((key) => {
                // @ts-ignore
                res[key] = getEsModule(context[key])
            })
            _cache[name] = res
        } else {
            // @ts-ignore
            _cache[name] = getEsModule(context[exportNames])
        }
    }
    return _cache[name]
}

function loopGetExport(
    name: string,
    exportNames: string | string[],
    exports: Object,
    callback: Function,
    tryTotal = 0
) {
    if (tryTotal > 100) {
        throw new Error(`${exportNames} load error`)
    }
    if (exports && Object.keys(exports).length) {
        _cache[name] = exports
        return callback(exports)
    }
    const res = hashExport(name, exportNames)
    if (res !== undefined) {
        return callback(res)
    }
    return setTimeout(() => {
        loopGetExport(name, exportNames, exports, callback, tryTotal + 1)
    }, 60)
}

function getModuleUrlAndVersion(name: moduleName, ix = 0) {
    const cfg = npmConfig[name]
    let url = npmHosts[ix] + cfg.uri
    if (ix < 0) {
        ix = 0
    }
    const version: string = cfg.version || ''
    // npm 加载处理
    if (version && url.includes('{version}')) {
        url = url.replace(/\{version\}/g, version)
    }

    return {
        url,
        version,
    }
}

async function asyncImport(url: string) {
    const jsCode = await fetch(url).then((r) => r.text())

    const exports = {}
    const module = {
        exports,
    }
    try {
        
        // eslint-disable-next-line no-new-func
        const code = new Function(
            'exports',
            'module',
            `(() => {
            ${jsCode}
        })()`
        )

        code(exports, module)

    } catch (error) {
        console.log('error url:', url)
        throw error
    }
    return module.exports || exports
}

async function loadModule(
    name: moduleName,
    resolve: Function,
    reject: Function,
    tryTotal = 0
): Promise<any> {
    const hosts = npmHosts
    const hostLen = hosts.length
    let hostIx = hosts.indexOf(_npmHost)
    if (hostIx === -1) {
        console.warn(`host ix error`)
        hostIx = 0
    }

    const { url } = getModuleUrlAndVersion(name, hostIx)
    try {
        const res = await asyncImport(url)
        resolve(res)
    } catch (err) {
        console.log('err: ', err)

        tryTotal++
        if (tryTotal >= hostLen) {
            return reject(err)
        }
        console.log(`host: ${hosts[hostIx]} load error`)
        let ix = hostIx + 1
        if (hostIx >= hostLen) {
            ix = 0
        }
        _npmHost = hosts[ix]

        return loadModule(name, resolve, reject, tryTotal)
    }
}

export default function load<T = any>(name: moduleName): Promise<T> {
    return new Promise(async (resolve, reject) => {
        const cfg = npmConfig[name]
        if (!cfg) {
            return reject(new Error(`Module: ${name} not found`))
        }

        // 是否在缓存中
        const cache = _cache[name]
        if (cache) {
            return resolve(cache)
        }

        // 加载中, 放入队列
        if (Array.isArray(_onLoadQueue[name])) {
            _onLoadQueue[name].push({
                reject,
                resolve,
            })
            return
        }

        // 创建队列
        _onLoadQueue[name] = [
            {
                reject,
                resolve,
            },
        ]

        await loadModule(
            name,
            (exports: any) => {
                loopGetExport(name, cfg.export, exports, (res: any) => {
                    const queue = _onLoadQueue[name]
                    for (const promise of queue) {
                        promise.resolve(res)
                    }
                    delete _onLoadQueue[name]
                })
            },
            // @ts-ignore
            (error) => {
                for (const promise of _onLoadQueue[name]) {
                    promise.reject(error)
                }
                delete _onLoadQueue[name]
            }
        )
    })
}
