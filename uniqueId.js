var idCounter = 0;
var uniqueId = function uniqueId(prefix) {
  var _prefix = '';
  if (prefix) {
    _prefix = prefix + '_';
  }
  return _prefix + (idCounter++);
};
module.exports = uniqueId;
