var type = require('../type');
var valByKeypath = require('./valByKeypath');
var curry = require('../fn/curry');
function values(keys, o){
  if(type(keys) === 'array'){
    return keys.map(valByKeypath(curry.$, o));
  }else{
    return valByKeypath(keys, o);
  }
}
module.exports = curry(2, values);
