var typeReg = /^\[object (\w+)\]$/;

function type(o) {
  if (o === null) {
    return 'null';
  }
  if (o === undefined) {
    return 'undefined';
  }
  if (o !== o) {
    return 'NaN';
  }
  /* jshint eqnull: true */
  var tm = Object.prototype.toString.call(o).match(typeReg);
  return tm == null ? 'unknown' : tm[1].toLowerCase();
}

['String', 'Function', 'Array', 'Undefined', 'Null', 'NaN', 'Object', 'RegExp', 'Arguments', 'Number'].forEach(function(name){
  type['is' + name] = function(o){
    return type(o) === name.toLowerCase();
  };
});

module.exports = type;
