var extend = require('./extend');
module.exports = function getHash(){
  var result = Object.create(null);
  if(arguments.length > 0){
    extend.apply(null, [result].concat([].slice.call(arguments, 0)));
  }
  return result;
};
