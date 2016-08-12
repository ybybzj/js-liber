var curry = require('../fn/curry');
var each = require('./each');

function mapObject(fn, o){
  var result = {};
  each(function(v, k, o){
    result[k] = fn(v, k ,o);
  }, o);
  return result;
}

module.exports = curry(2, mapObject);
