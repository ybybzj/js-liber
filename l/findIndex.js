var type = require('../type');
var assert = require('../assert');

function findIndex(pred, arr){
  assert(type(pred) === 'function', '[findIndex]first param should be a function!');
  assert(type(arr) === 'array', '[findIndex]second param should be an array!');
  var i = 0, l = arr.length, result = -1;
  for(; i< l; i++){
    if(pred(arr[i], i, arr)){
      result = i;
      break;
    }
  }
  return result;
}

module.exports = findIndex;
