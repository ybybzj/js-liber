var findIndx = require('./findIndex');
module.exports = function find(pred, arr) {
  var idx = findIndx(pred, arr);
  return idx !== -1 ? arr[idx] : undefined;
};