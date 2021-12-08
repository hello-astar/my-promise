/*
 * @Description: 
 * @Author: astar
 * @Date: 2021-12-07 17:13:11
 * @LastEditTime: 2021-12-08 15:24:48
 * @LastEditors: astar
 */
let MyPromise = require('../index')
MyPromise.deferred = function() {
  var result = {};
  result.promise = new MyPromise(function(resolve, reject) {
    result.resolve = resolve;
    result.reject = reject;
  });

  return result;
};

module.exports = MyPromise;