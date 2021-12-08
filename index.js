/*
 * @Description: promise模拟实现
 * @Author: astar
 * @Date: 2021-12-07 17:08:44
 * @LastEditTime: 2021-12-08 17:09:50
 * @LastEditors: astar
 */
// promise的三种状态
const STATUS = {
  PENDING: 'pending',
  FULFILLED: 'fulfilled',
  REJECTED: 'rejected'
}
/**
* 2.3 处理then函数返回值
* romise2: then函数返回的全新promise
* x: then回调函数调用时的返回值
* resolve: promise2的resolve参数
* reject: promise2的reject参数
* @author astar
* @date 2021-12-08 16:32
*/
function resolvePromise (promise2, x, resolve, reject) {
  if (promise2 === x) { // 2.3.1 If promise and x refer to the same object, reject promise with a TypeError as the reason.
    reject(new TypeError('promise2 and x refer to the same object'))
    return
  }
  if (x instanceof MyPromise) { // 2.3.2 if x is a promise
    if (x.status === STATUS.PENDING) {
      // 2.3.2.1 If x is pending, promise must remain pending until x is fulfilled or rejected.
      x.then(y => {
        resolvePromise(promise2, y, resolve, reject) // 递归执行到非pending状态
      }, reject)
    } else { // fulfilled或rejected了，可直接resolve或reject
      x.then(resolve, reject)
    }
  } else if (x && (typeof x === 'object' || typeof x === 'function')) { // 2.3.3 Otherwise, if x is an object or function,
    let then
    // 2.3.3.3.3 resolve和reject只能被调用一次，利用firstRun标识
    let firstRun = false
    try {
      then = x.then
      if (typeof then === 'function') {
        then.call(x, y => {
          if (firstRun) return
          firstRun = true
          resolvePromise(promise2, y, resolve, reject)
        }, r => {
          if (firstRun) return
          firstRun = true
          reject(r)
        })
      } else {
        resolve(x)
      }
    } catch (e) {
      if (firstRun) return
      reject(e)
    }
  } else { // 2.3.4 If x is not an object or function, fulfill promise with x.
    resolve(x)
  }
}


class MyPromise {
  constructor (fn) {
    const self = this
    this.status = STATUS.PENDING // 状态
    this.value = undefined // 终值
    this.reason = undefined // 拒因
    // 2.2.6 then may be called multiple times on the same promise
    // then可以多次调用，fulfilled或rejected时按注册顺序依次调用回调队列的函数
    this.onFulfilledCallbacks = [] // 成功时回调队列
    this.onRejectedCallbacks = [] // 拒绝时回调队列
    // 2.1 A promise must be in one of three states: pending, fulfilled, or rejected.
    // promise有且只有一个状态（pending或fulfilled或rejected），只有pending状态可以变为其它状态
    var resolve = function (value) {
      if (self.status === STATUS.PENDING) {
        // 使用异步编程，即使遇到同步任务也会先调用then函数注册回调队列
        setTimeout(() => {
          self.status = STATUS.FULFILLED
          self.value = value
          self.onFulfilledCallbacks.forEach(fn => fn(value))
        }, 0)
      }
    }
    var reject = function (reason) {
      if (self.status === STATUS.PENDING) {
        setTimeout(() => {
          self.status = STATUS.REJECTED
          self.reason = reason
          self.onRejectedCallbacks.forEach(fn => fn(reason))
        }, 0)
      }
    }

    try {
      fn(resolve, reject)
    } catch (e) {
      reject(e)
    }
  }

  /**
  * promise.then(onFulfilled, onRejected)注册回调函数，返回值是一个新的promise
  * @author astar
  * @date 2021-12-08 16:51
  */
  then (onFulfilled, onRejected) {
    // 2.2.5 onFulfilled and onRejected must be called as functions
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : function (value) { return value }
    onRejected = typeof onRejected === 'function' ? onRejected : function (reason) { throw reason }
    let self = this
    let promise2 = new MyPromise((resolve, reject) => {
      function success (value) {
        try {
          let x = onFulfilled(value)
          resolvePromise(promise2, x, resolve, reject)
        } catch (e) {
          reject(e)
        }
      }
      function fail (reason) {
        try {
          let x = onRejected(reason)
          resolvePromise(promise2, x, resolve, reject)
        } catch (e) {
          reject(e)
        }
      }
      if (self.status === STATUS.PENDING) {
        // 存起来，等状态修改后执行
        self.onFulfilledCallbacks.push(success)
        self.onRejectedCallbacks.push(fail)
      } else if (self.status === STATUS.FULFILLED) {
        // 2.2.6 then may be called multiple times on the same promise
        // 状态变为fulfilled或rejected后还调用then注册函数，直接执行。
        // 前面constructor中看出onFulfilled和onRejected都在宏任务队列中，所以这些也要放入队列，才能按顺序执行。
        setTimeout(function () {
          success(self.value)
        }, 0)
      } else if (self.status === STATUS.REJECTED) {
        setTimeout(function () {
          fail(self.reason)
        }, 0)
      }
    })
    return promise2
  }
}

module.exports = MyPromise