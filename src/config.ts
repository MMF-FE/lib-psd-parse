/**
 * npm 动态加载的配置
 * @author vfasky<vfasky@gmail.com>
 */
export const npmHosts = ['https://js.meimeifa.com/', 'https://na.meimeifa.com/', 'https://cdn.jsdelivr.net/']

export const npmConfig = {
    'psd.js': {
        export: 'commomjs',
        version: '3.4.1-bata.3',
        uri: 'npm/psd.js@{version}/dist/psd.min.js',
    }
}
