import { readdirSync, statSync } from 'node:fs';

// 当前文件所在目录
const __dirname = '.';

// 合并路径
function join() {
  return Array.prototype.join.call(arguments, '/')
}

const handleData = async (rootDir) => {

  // 初始数据
  let data = {}

  // 当前路径
  const path = join(__dirname, rootDir)

  // 读取文件目录
  const dirs = readdirSync(path, { encoding: 'utf-8' })

  // 遍历文件目录
  for (const dir of dirs) {
    let dirPath = join(path, dir)
    // 判断当前路径是文件还是目录
    const stat = statSync(dirPath)
    if (stat.isFile()) {
      const obj = (await import(dirPath)).default
      Object.keys(obj).forEach(item => {
        for (const key in obj[item]) {
          !data[key] && (data[key] = {})
          // 拆解当前路径，当成属性写入 data, 并找到最深的层级
          const dt = dirPath.split('/').slice(2).reduce((prev, next) => {
            let temp = prev
            // 如果不为index则继续向下赋值，否则层级不变
            if(next.indexOf('index') === -1) {
              // 将变量命名变成小驼峰命名
              const str = next.replace(/(-[a-z])|(.js)/g, w => w === '.js' ? '' : w[1].toUpperCase())
              // 若str属性在prev上不存在，则给他赋值
              !prev[str] && (prev[str] = {})
              temp = prev[str]
            }
            return temp
          }, data[key])
          // 对最深的层级进行赋值
          dt[item] = obj[item][key]
        }
      })
    } else if (stat.isDirectory()) {
      // 若是目录，则递归遍历其子目录
      const temp = await handleData(`${rootDir}/${dir}`)
      // 将递归结果与当前 data 进行合并
      data = mergeObject(data, temp)
    }
  }

  return data
};

/**
 * 该函数是将多个对象中所有属性都合并在一起，而 Object.assign() 则是会覆盖相同属性
 * @param arguments 参数使用方式和 Object.assign() 一致
 * @returns 合并对象
 */
function mergeObject() {
  let value = {}
  for (let i = 0; i < arguments.length; i++) {
    const obj = arguments[i];
    for (const key in obj) {
      if (value[key] && typeof value[key] === 'object') {
        value[key] = mergeObject(value[key], obj[key])
      } else if(!value[key] || typeof value[key] !== 'object') {
        value[key] = obj[key]
      }
    }
  }
  return value
}

handleData('my-data').then(res => {
  console.log(JSON.stringify(res))
});
