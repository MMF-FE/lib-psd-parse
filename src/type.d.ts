import type Color from 'color'
export interface PSDChildren {
    type: string
    blendingMode: string
    visible: boolean
    image: object
    top: number
    bottom: number
    left: number
    right: number
    height: number
    width: number
    name: string
    opacity: number
    mask: object
    text?: {
        value: string
        font: {
            alignment: string[]
            colors: string[][]
            leading: number[]
            lengthArray: number[]
            names: string
            sizes: number[]
            styles: string[]
            textDescoration: string[]
            weights: string[]
        }
        transform: {
            tx: number
            ty: number
            xx: number
            xy: number
            yx: number
            yy: number
        }
        bottom: number
        left: number
        top: number
        right: number
    }
}

export interface PSDDocument {
    height: number
    width: number
}

export interface PSDJson {
    children: PSDChildren[]
    document: PSDDocument
}

export interface PSDNode {
    get: (name: string) => PSDNode
    export: () => PSDChildren
}

export interface PSD {
    tree: () => {
        export: () => PSDJson
        descendants: () => PSDNode[]
        childrenAtPath: (path: string | string[]) => PSDNode[]
    }
    parse: () => void
    image: PSDImage
    layers: PSDLayer[]
}

export interface PSDImage {
    width: () => number
    height: () => number
    toPng: () => HTMLImageElement
    toBase64: () => string
}
export interface PSDLayer {
    legacyName: string
    image?: PSDImage
    width: number
    height: number
    left: number
    top: number
    visible: number
    node: {
        name: string
    }
}

export interface Tree {
    index: number
    width: number
    height: number
    left: number
    top: number
    right: number
    bottom: number
    leading: number[]
    opacity: number
    title: string
    image: PSDImage
    content: string
    fontColors: string[]
    fonts: string[]
    fontSizes: string[]
    fontWeights: string[]
    textAlign: string[]
    isText: boolean
    boxShadow?: BoxShadow
}

export interface BoxShadow {
    offsetX: number
    offsetY: number
    blurRadius: number
    spreadRadius: number
    color: string
}

export interface PSDParse {
    psd: PSD
    Color: typeof Color
    tree: Tree[]
}
