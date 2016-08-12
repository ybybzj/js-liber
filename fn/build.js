var assert = require('../assert');
var type = require('../type');
var clone = require('../l/clone');
//fn only accept one object as its parameter
//paramsDescription's format:
// {
//  //checker is required, defaultValue is optional
//    'paramName': checker | [checker, defaultValue], //requried param
//    '?pName': checker | [checker, defaultValue], //optional param
//    ...
// }
function makeBuilder(fn, paramsDescription, fnName) {
  assert(type.isFunction(fn),
    '[makeBuilder]first argument should be a function! given ' + fn,
    TypeError);
  assert(type.isObject(paramsDescription),
    '[makeBuilder]second argument should be an object! given ' + paramsDescription,
    TypeError);


  var builderProto = {
    build: function() {
      var params = buildParams(this._paramsForBuild, paramsDescription, fnName);
      return fn(params);
    },
    clone: function() {
      var builderProto = this._builderProto;
      var builder = Object.create(builderProto);
      builder._paramsForBuild = clone(this._paramsForBuild);
      builder._builderProto = builderProto;
      return builder;
    }

  };

  Object.keys(paramsDescription).forEach(function(paramName) {
    var desc = paramsDescription[paramName];
    var defaultVal = type.isArray(desc) ? desc[1] : undefined; 
    var methodName;
    paramName = paramName.charAt(0) === '?' ? paramName.substr(1) : paramName;
    

    if(['build', 'clone'].indexOf(paramName) !== -1){
      methodName = '$'+paramName;
    } else {
      methodName = paramName;
    }

    builderProto[methodName] = function(val) {
      if (arguments.length > 0) {
        this._paramsForBuild[paramName] = val;
        return this;
      }
      
      var paramVal = this._paramsForBuild[paramName]; 
      return  paramVal === undefined ? defaultVal: paramVal; 
    };
  });

  var builder = Object.create(builderProto);
  builder._paramsForBuild = {};
  builder._builderProto = builderProto;

  return builder;
}

module.exports = makeBuilder;

function buildParams(paramsForBuild, descs, fnName){
  var label = fnName || 'makeBuilder';
  return Object.keys(descs).reduce(function(result, key){
    var isRequired = key.charAt(0) !== '?';
    var paramName = !isRequired ? key.substr(1) : key;
    var builtVal = paramsForBuild[paramName];
    var descEntry = descs[key];
    var checker = type.isArray(descEntry) ? descEntry[0] : descEntry;
    assert(type.isFunction(checker), '['+label+']param description for param "' + paramName + '": checker must be a function! given: ' + checker);

    var defaultVal = type.isArray(descEntry) ? descEntry[1] : undefined;

    var val = builtVal === undefined ? defaultVal : builtVal;

    assert(isRequired ? checker(val) : (val == null || checker(val)), '['+label+']param "' + paramName + '" is invalid for build! given: ' + val);
    
    result[paramName] = val;
    return result;
  }, {});
}


 // if(require.main === module){
 //   function print(options){
 //     console.dir(options, {depth: null});
 //   }

 //   var builder = makeBuilder(print, {
 //    'a': type.isNumber,
 //    'b': [type.isNumber, 4],
 //    'c': type.isString,
 //    '?d': type.isFunction,
 //    'build': type.isArray
 //   }, 'print');

 //   var clonedBuild = builder.a(1).c('sa').$build(['build']).clone();
 //   console.log(clonedBuild.$build());
 //   clonedBuild.b(2).build();
 //   clonedBuild.d('').build();
 // }

