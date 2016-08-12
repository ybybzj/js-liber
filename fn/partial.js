var getHash = require('../getHash');
var slice = require('../slice');
var placeholder = getHash({
  placeholder: 'partial'
});

// (fn, [args ...])->fn
function partial(fn) {
  var partialArgs = slice(arguments, 1);
  return function _partial(){
    var restArgs = slice(arguments);
    var args = _mergeArgs(partialArgs, restArgs);
    return fn.apply(null, args);
  };
}
partial.$ = placeholder;
module.exports = partial;

function _mergeArgs(partialArgs, restArgs){
  var result = [];
  partialArgs.forEach(function(arg){
    if(arg !== placeholder){
      result.push(arg);
    }else{
      result.push(restArgs.shift());
    }
  });

  if(restArgs.length > 0){
    result.push.apply(result,restArgs);
  }
  return result;
}
