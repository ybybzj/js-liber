var type = require('../type');
var assert = require('../assert');
var mapObject = require('./mapObject');
var curry = require('../fn/curry');

function reduceBy(keyFn, reducer, arr) {
  assert(type.isArray(arr), '[reduceBy]invalid argument type!');
  var grouped = arr.reduce(function (m, item) {
    var key = keyFn(item);
    m[key] = (m[key] || []);
    m[key].push(item);
    return m;
  }, {});
  return mapObject(function (val) {
    return val.reduce(reducer);
  }, grouped);
}

module.exports = curry(3, reduceBy);