var map = require('./map');
var mapObject = require('./mapObject');
var type = require('../type');
var assert = require('../assert');
var curry = require('../fn/curry');

/**
 * deep clone an vanilla object(that can be JSON.stringified)
 * @param {Any} obj
 */
function mapRecursive(fn, obj) {
  assert(type.isFunction(fn), '[mapRecursive] first param need to be function');
  var objType = type(obj),
    mapFn;
  if (objType !== 'object' && objType !== 'array') {
    return fn(obj);
  }

  mapFn = objType === 'array' ? map : mapObject;

  return mapFn(function(v){
    return mapRecursive(fn, v);
  }, obj);
}

module.exports = curry(2, mapRecursive);
