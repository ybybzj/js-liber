var curry = require('../fn/curry');
var each = require('./each');

function map(fn, o) {
  var result = [];
  each(function(v, i, o){
    result.push(fn(v, i, o));
  }, o);
  return result;
}
module.exports = curry(2, map);
