var map = require('./map');
var mapObject = require('./mapObject');
var type = require('../type');
/**
 * deep clone an vanilla object(that can be JSON.stringified)
 * @param {Any} obj
 */
module.exports = function deepClone(obj) {
  var objType = type(obj),
    mapFn;
  if (objType !== 'object' && objType !== 'array') {
    return obj;
  }

  if (type(obj.toJSON) === 'function') {
    obj = obj.toJSON();
  }

  mapFn = objType === 'array' ? map : mapObject;

  return mapFn(deepClone, obj);
};
