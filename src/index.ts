// @ts-ignore
import visit from './vender/walk-tree'
import Clr from 'color'
import { PSD, Tree as _Tree, PSDImage, BoxShadow, PSDParse } from './type'
import npm from './cdnNpm'

function val(data: { value?: any }) {
    if (data && data.hasOwnProperty('value')) {
        return data.value
    }
    return data
}

// http://www.melanieceraso.com/psd-to-css3/
// https://github.com/finanzcheck/drop-shadow-converter/blob/master/less/drop-shadow-converter.less
function dropShadowToStyle(item: any = {}) {
    let { dist, color, spread /* ckmt */, size /*blur*/, angle, opct } = item

    angle = val(angle)
    dist = val(dist)
    spread = val(spread)
    size = val(size)
    opct = val(opct)

    angle = ((180 - angle) * Math.PI) / 180
    let offsetY = Math.round(Math.sin(angle) * dist)
    let offsetX = Math.round(Math.cos(angle) * dist)

    let spreadRadius = (size * spread) / 100
    let blurRadius = size - spreadRadius

    return {
        offsetX,
        offsetY,
        blurRadius,
        spreadRadius,
        color: clr(color, opct),
    }
}

export function clr(color: any, opacity: number) {
    let c: Clr
    if (color && color.class && typeof color.class.id === 'string') {
        switch (color.class.id.toLowerCase()) {
            case 'rgbc':
                // @ts-ignore
                c = Clr({
                    r: color['Rd  '],
                    g: color['Grn '],
                    b: color['Bl  '],
                })
                break
            case 'hsbc':
                c = Clr.hsl([color['H   '], color['Strt'], color['Brgh']])
                break
            case 'cmyc': // cmyk
                c = Clr.cmyk([
                    color['Cyn '],
                    color['Mgnt'],
                    color['Ylw '],
                    color['Blck'],
                ])
                break
            default:
                // @ts-ignore
                c = Clr(color)
        }
    } else {
        // console.log(color)
        if (Array.isArray(color)) {
            if (color.length === 1 && color[0].length === 4) {
                return `rgba(${color[0].join(', ')})`
            }
        }

        // @ts-ignore
        c = Clr(color)
    }

    if (opacity != null) {
        c = c.alpha(opacity / 100)
    }

    return c.string()
}

function parseTree(psd: PSD) {
    const tree: Tree[] = []
    const psdTree = psd.tree()

    // @ts-ignore
    visit(
        psdTree,
        // @ts-ignore
        (node, ctx) => {
            if (node === psdTree) {
                return
            }
            if (!node.visible()) {
                return ctx.skip()
            }

            const exported = node.export()
            if (exported.type === 'group') {
                return
            }
            const image = node.layer.image as PSDImage
            const text = exported.text
            const isText = text && text.font ? true : false

            const title = String(exported.name).trim()
            let boxShadow: BoxShadow | undefined
            if (isText) {
                const objectEffects = node.get('objectEffects')
                if (
                    objectEffects &&
                    objectEffects.data &&
                    objectEffects.data.DrSh &&
                    objectEffects.data.DrSh.enab
                ) {
                    const DrSh = objectEffects.data.DrSh

                    boxShadow = dropShadowToStyle({
                        dist: DrSh['Dstn'],
                        color: DrSh['Clr'] || DrSh['Clr '],
                        spread: DrSh['Ckmt'],
                        size: DrSh['blur'],
                        angle: DrSh['lagl'],
                        opct: DrSh['Opct'],
                    })
                }
            }

            tree.unshift({
                index: tree.length,
                width: exported.width,
                height: exported.height,
                left: exported.left,
                top: exported.top,
                right: exported.right,
                bottom: exported.bottom,
                isText,
                title,
                image,
                boxShadow,
                opacity: exported.opacity,
                content: text ? text.value : '',
                leading: isText ? text.font.leading : [],
                fontColors: isText ? text.font.colors : [],
                fonts: isText ? text.font.names : [],
                fontSizes: isText ? text.font.sizes : [],
                fontWeights: isText ? text.font.weights : [],
                textAlign: isText ? text.font.alignment : [],
            })
        },
        // @ts-ignore
        {
            path: '_children',
            order: 'pre',
            skipVisited: false,
        }
    )

    return tree.sort((a, b) => {
        return b.width + b.height - (a.width + a.height)
    })
}

export interface Tree extends _Tree {}

export default async function psdParse(file: File | Blob | Buffer)  {
    const PSDJS = await npm('psd.js')
    let psd: PSD

    if (file instanceof Uint8Array) {
        psd = new PSDJS(file)
        psd.parse()
    } else {
        psd = await PSDJS.fromDroppedFile(file)
    }

    return {
        PSDJS,
        Color: Clr,
        psd,
        tree: parseTree(psd)
    } as PSDParse
}
