// @ts-nocheck
/**
 * Enhanced and multifunctional tree walker
 * @author imcuttle
 */
// import * as crawl from 'tree-crawl'
import get from 'lodash.get'
import set from 'lodash.set'
import unset from 'lodash.unset'
const crawl = require('tree-crawl')

function toArray(data: any) {
    if (!Array.isArray(data)) {
        return [data]
    }
    return data
}

// @ts-ignore
function proxy(ctx, path, getNewDescriptor) {
    const old = ctx[path]

    const host = ctx // ctx.hasOwnProperty(path) ? ctx : Object.getPrototypeOf(ctx)

    Object.defineProperty(
        host,
        path,
        Object.assign(
            {},
            Object.getOwnPropertyDescriptor(host, path),
            getNewDescriptor(old)
        )
    )
    return ctx
}

const symbol =
    typeof Symbol === 'function' ? Symbol('override') : '__override__'

/**
 *
 * @public
 * @param tree {T} - Type `T` should extends Object
 * @param walker {(node, ctx: Context) => {}} - Iterator for each node by order
 * @param opts {object}
 * @param [opts.path='children'] {string} - The child's path on recursive struction
 * @param [opts.order='pre'] {'pre' | 'post' | 'bfs'}
 * <br/>
 *  `pre` means walking the node before walking it's children node by dfs <br/>
 *  `post` means walking the node after walking it's children node by dfs <br/>
 *  `bfs` means walking the node by bfs <br/>
 * @param [opts.skipVisited=true] {boolean}
 *  Should skip the node which has been visited.
 * @param [opts.uniquePath=node => node] {Function | string | null}
 *  The unique's path for determining the node has been visited (same node)
 * @param [opts.state] {any}
 *  Inject in `context.state` on customized way
 * @return walkedTree {T}
 */
function walk(
    tree,
    walker = (node, ctx) => {},
    {
        path = 'children',
        order = 'pre',
        skipVisited = true,
        uniquePath = (node) => node,
        state,
    } = {}
) {
    let getUniq
    if (typeof uniquePath === 'function') {
        getUniq = uniquePath
    } else {
        getUniq =
            typeof uniquePath === 'string'
                ? (node) => get(node, uniquePath)
                : (v) => v
    }

    crawl(
        tree,
        function (node, ctx) {
            if (!ctx[symbol]) {
                ctx.state = state
                proxy(ctx, 'track', () => {
                    return {
                        configurable: true,
                        enumerable: false,
                        value: new Map(),
                    }
                })
                proxy(ctx, 'remove', (oldRemove) => {
                    return {
                        enumerable: true,
                        value: function remove() {
                            const children = get(this.parent, path)
                            if (!Array.isArray(children)) {
                                unset(this.parent, path)
                            } else {
                                children.splice(this.index, 1)
                            }
                            return oldRemove.apply(this, arguments)
                        },
                    }
                })

                proxy(ctx, 'replace', (oldReplace) => {
                    return {
                        enumerable: true,
                        value: function replace(node) {
                            const children = get(this.parent, path)
                            if (!Array.isArray(children)) {
                                set(this.parent, path, node)
                            } else {
                                children[this.index] = node
                            }
                            return oldReplace.apply(this, arguments)
                        },
                    }
                })

                Object.defineProperty(ctx, symbol, {
                    configurable: true,
                    enumerable: false,
                    value: true,
                })
            }

            const { track } = ctx

            const uniqKey = getUniq(node)
            const visitedStatus = track.get(uniqKey)
            if (skipVisited && visitedStatus === 'visited') {
                ctx.skip()
                return
            }
            track.set(uniqKey, 'visiting')
            const rlt = walker(node, ctx)
            track.set(uniqKey, 'visited')
            return rlt
        },
        {
            getChildren: (node) => {
                const children = get(node, path)
                return children != null ? toArray(children) : children
            },
            order,
        }
    )

    return tree
}

export default walk
