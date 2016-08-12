var clone = require('../l/clone');
module.exports = function tap(fn){
  return function(input){
    fn(clone(input));
    return input;
  };
};
