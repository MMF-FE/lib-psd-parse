import * as fs from 'fs'
import * as path from 'path'

if (!global.fetch) {
    global.fetch = require('node-fetch')
}

import psdParse from '../src'

const psdFile = path.join(__dirname, './t.psd')

const psdBlob = fs.readFileSync(psdFile)

psdParse(psdBlob).then(res => {
    console.log(res.tree)
})