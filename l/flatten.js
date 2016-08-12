var type = require('../type');
function flatten(a, isRecursive){
  if(!type.isArray(a)){
    return a;
  }
  return a.reduce(function(m, item){
    return m.concat(isRecursive ? flatten(item, true) : item);
  }, []);
}

module.exports = flatten;
