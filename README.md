## lib-psd-parse

解释 photoshop PSD 文件

## 安装

```sh
yarn add @yzfe/lib-psd-parse
```

## 使用

```ts
import psdParse from '@yzfe/lib-psd-parse'

// Nodejs
const psdFile = path.join(__dirname, './t.psd')
const psdBlob = fs.readFileSync(psdFile)
psdParse(psdBlob).then(res => {
    console.log(res.tree)
})


// 浏览器
fetch('http://xx.psd').then(res => res.blob())
.then(async psdBlob => {
    const { tree } = await psdParse(psdBlob)
    console.log(tree)
})
```
