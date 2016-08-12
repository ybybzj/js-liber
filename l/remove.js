var findIndex = require('./findIndex');
module.exports = function remove(pred, arr){
  var idx = findIndex(pred, arr);
  if(idx !== -1){
    arr.splice(idx, 1);
  }
  return arr;
};