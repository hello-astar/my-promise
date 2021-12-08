# 符合Promises/A+ 规范的promise实现
## Promises/A+规范
[【原文】Promises/A+](https://promisesaplus.com/)

[【译】 Promises/A+ 规范](https://juejin.cn/post/6844903767654023182)

## 测试
### 代码入口文件
index.js

### 运行测试用例
使用插件`promises-aplus-tests`进行测试，通过所有872个测试用例。
1. 拉取代码
```
git clone git@github.com:hello-astar/my-promise.git
```
2. 安装依赖
```
npm install
```
3. 运行测试用例
```
npm run test
```

## 实现Promise的更多功能
1. promise.catch(onRejected)

promise.catch其实就是promise.then的语法糖
```
...
catch (onRejected) {
  return this.then(null, onRejected)
}
...
```
2. Promise.race([promise1, promise2, ...])

Promise.race接收以多个Promise实例组成的数组为参数，返回值是一个新的promise
只要其中一个实例fulfilled或者rejected，Promise.race 直接resolve实例的终值或者reject实例的拒因
```
let a = new Promise(resolve => { resolve(1) })
let b = new Promise(resolve => { resolve(2) })
let c = new Promise((resolve, reject) => { reject(3) })

Promise.race([a, b]).then(res => {
  console.log(res) // 1
}, e => {
  cosole.log(e)
})
Promise.race([c, a, b]).then(res => {
  console.log(res)
}, e => {
  console.log(e) // 3
})
```
实现：
```
MyPromise.race = function (promises) {
  const P = this
  return new P((resolve, reject) => {
    for (let i = 0, len = promises.length; i < len; i++) {
      let promise = promises[i]
      if (promise instanceof P) {
        promise.then(resolve, reject)
      } else { // 参数不一定是promise // 转换为Promise实例
        new P(resolve => {
          resolve(promise)
        }).then(resolve, reject)
      }
    }
  })
}
```
应用：
超时处理
```
Promise.race([promise1,timeOutPromise(5000)]).then(res=>{})
```

3. Promise.all([promise1, promise2, ...])

Promise.all接收以多个Promise实例组成的数组为参数，当所有promise fulfilled后，Promise.all resolve所有promise实例的终值组成的数组，若其中有实例rejected了，则Promise.all reject该值，例子如下：
```
let a = new Promise(resolve => { resolve(1) })
let b = new Promise(resolve => { resolve(2) })
let c = new Promise((resolve, reject) => { reject(3) })

Promise.all([a, b]).then(res => {
  console.log(res) // [1,2]
}, e => {
  cosole.log(e)
})
Promise.all([a, b, c]).then(res => {
  console.log(res)
}, e => {
  console.log(e) // 3
})
```
实现：
```
MyPromise.all = function (promises) {
  const P = this
  return new P((resolve, reject) => {
    let result = new Array(promises.length)
    let count = 0
    function noticeResolve (i, res) { // 全都resolve了才能resolve
      result[i] = res
      if (++count === promises.length) resolve(result)
    }
    for (let i = 0, len = promises.length; i < len; i++) {
      let promise = promises[i]
      if (promise instanceof P) {
        promise.then(res => noticeResolve(i, res), reject)
      } else { // 参数不一定是promise
        new P(resolve => {
          resolve(promise)
        }).then(res => noticeResolve(i, res), reject)
      }
    }
  })
}
```
应用：
并发请求

4. Promise.resolve和Promise.reject
```
MyPromise.resolve = function (x) {
  const P = this
  return new P(resolve => {
    resolve(x)
  })
}

MyPromise.reject = function (x) {
  const P = this
  return new P((resolve, reject) => {
    reject(x)
  })
}
```
5. promise.finally(fn)
finally方法用于指定不管 Promise 对象最后状态如何，都会执行的操作
```
...
finally (fn) {
  let P = this.constructor
  return this.then(
    data => P.resolve(callback()).then(() => data),
    err => P.resolve(callback()).then(() => { throw err })
  )
  /**
  * 为什么不是下面这种形式呢
  * 考虑callback函数返回一个promise，需等该promise执行完毕才能执行下一步。
  * promise.finally(() => return new Promise(resolve => {
  *    setTimeout(() => { resolve(100) }, 10000)
  *  })
  * ).then(data => { console.log(data) }) // 至少10000ms之后才会打印data
  */
  // return this.then(data => {
  //   callback()
  //   return data
  // }, err => {
  //   callback()
  //   throw err
  // })
}
...

```