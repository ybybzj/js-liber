var curry = require('../fn/curry');
var type = require('../type');
var valByKeypath = require('./valByKeypath');

function pick(properties, o) {
  if (Object(o) !== o) {
    return o;
  }
  if (type(properties) === 'string') {
    return valByKeypath(properties, o);
  }
  if (type(properties) === 'array') {
    return pickArray(properties, o);
  }

  if(type(properties) === 'function'){
    return properties(o);
  }
  
  if (type(properties) === 'object') {
    return Object.keys(properties).reduce(function(m, k) {
      var pick_k = properties[k];
      m[k] = pick(pick_k, o);     
      return m;
    }, {});
  }
}
module.exports = curry(2, pick);

//helpers
function pickArray(arr, o){
  var l = arr.length,
    isLastFn = type(arr[l - 1]) === 'function',
    fn, pickedVals; 
  if(!isLastFn){
    return arr.reduce(function(m, key){
      var v = o[key];
      if(v !== undefined){
        m[key] = v;
      }
      return m;
    }, {});
  }else{
    fn = arr[l - 1];
    pickedVals = arr.slice(0, l - 1).map(function(kpath){
      return valByKeypath(kpath, o);
    });
    return fn.apply(null, pickedVals);
  }
}
