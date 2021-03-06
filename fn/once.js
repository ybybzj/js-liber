module.exports = function once(fn){
  var called = false;
  return function(){
    if(called){
      return;
    }
    called = true;
    return fn.apply(this, arguments);
  };
};
