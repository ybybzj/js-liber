// @ifdef DEBUG
var patternCheck = require('./_patternCheck');
// @endif

var t = require('../type');
var slice = require('../slice');

var each = require('../l/each');

var assert = require('../assert');
var map = require('../l/map');
var mapObject = require('../l/mapObject');

function makeType(typeName, typeDescriptions) {

  // @ifdef DEBUG
  assert(t.isString(typeName) && !!typeName.trim(), '[makeType]valid type name is required! given: ' + typeName);
  // @endif

  var typeProto = Object.create({
    __$typeName$__: typeName,
    _dataTypeName: function(){
      return this.__$typeName$__ + '.' + this.__$ctorName$__;
    },
    toString: function(){
      var s = this.toJSON ? JSON.stringify(this) : Object.prototype.toString.call(this);

      if(this.__$ctorType$__ === 'const'){
        s = 'const';
      }
      return this._dataTypeName() + '(' + s + ')';
    }
  });
  var dataCtors = mapObject(makeDataConstructor.bind(null, typeProto), typeDescriptions);

  var type = function _type(data){
    // @ifdef DEBUG
    assert(isUnionData(data), '['+typeName+'.case] data should be constructed by data constructor! given: ' + data);
    // @endif

    return map(function(v){return v;}, dataCtors).indexOf(data.__$ctor$__) !== -1;
  };

  typeProto.__$type$__ = type;
  type.prototype = typeProto;

  each(function(v, k){
    type[k] = v;
  }, dataCtors);

  type.case = function _case(cases, data) {
    if (arguments.length < 2) {
      return function(_data) {
        return _case(cases, _data);
      };
    }

    // @ifdef DEBUG
    assert(isUnionData(data), '['+typeName+'.case] data should be constructed by data constructor! given: ' + data);

    assert(t.isObject(cases), '['+typeName+'.case] cases should be an object! given: ' + cases);
    // @endif


    var caseKeys = Object.keys(cases);

    // @ifdef DEBUG
    assert(caseKeys.length > 0, '['+typeName+'.case] cases is empty!');

    each(function(k) {
      if (k !== '_' && !typeDescriptions.hasOwnProperty(k)) {
        throw new Error('['+typeName+'.case]cases "' + k + '" is not in the type description!');
      }
    }, caseKeys);
    // @endif

    var l = caseKeys.length,
      i, typeCase, mapper, isMapperFn, result, mapped = false;
    for (i = 0; i < l; i++) {
      typeCase = caseKeys[i];
      mapper = cases[typeCase];
      isMapperFn = t.isFunction(mapper);

      if (typeCase === '_') {
        result = isMapperFn ? mapper(data.toJSON()) : mapper;
        mapped = true;
        break;
      }

      if (data.__$ctor$__ === type[typeCase]) {
        if(!isMapperFn){
          result = mapper;
          mapped = true;
          break;
        }

        result = data.__$ctorType$__ === 'array' ?
          mapper.apply(null, data.toJSON()) :
          mapper(data.toJSON());

        mapped = true;
        break;
      }
    }

    return mapped ? result : data;

  };

  type.update = function _update(unionData, input){
    // @ifdef DEBUG
    assert(isUnionData(unionData), '['+typeName+'.update]first parameter should be constructed by data constructor! given: ' + unionData);
    validateArgs(typeProto, unionData.__$checkers$__, input, unionData.__$ctorName$__, true);
    // @endif

    each(function(v, k){
      unionData[k] = v;
    }, input);

    return unionData;
  };

  return type;
}

function makeDataConstructor(typeProto, checkPatterns, ctorName) {
  var isEmpty = isEmptyDescription(checkPatterns);

  if (!isEmpty && t.isArray(checkPatterns)) {
    return makeArrayDataCtor(typeProto, checkPatterns, ctorName);
  }

  if (!isEmpty && t.isObject(checkPatterns)) {
    return makeObjectDataCtor(typeProto, checkPatterns, ctorName);
  }

  return makeConstDataCtor(typeProto, ctorName);
}

function makeArrayDataCtor(typeProto, checkPatterns, ctorName) {
  var proto = makeCtorProto(_ArrayCtor, 'array', typeProto, checkPatterns, ctorName);

  function _ArrayCtor() {
    var args = slice(arguments);
    // @ifdef DEBUG
    validateArgs(typeProto, checkPatterns, args, ctorName);
    // @endif

    var o = Object.create(proto);

    o.length = 0;

    args.forEach(function(input, i) {
      o[i] = input;
      o.length += 1;
    });

    return o;
  }

  _ArrayCtor.prototype = proto;
  return _ArrayCtor;
}

function makeObjectDataCtor(typeProto, checkPatterns, ctorName) {
  var proto = makeCtorProto(_ObjectCtor, 'object', typeProto, checkPatterns, ctorName);

  function _ObjectCtor(input) {
    // @ifdef DEBUG
    validateArgs(typeProto, checkPatterns, input, ctorName);
    // @endif

    var o = Object.create(proto);

    each(function(v, k) {
      o[k] = v;
    }, input);

    return o;
  }

  _ObjectCtor.prototype = proto;
  return _ObjectCtor;
}

function makeConstDataCtor(typeProto, ctorName) {
  var proto = makeCtorProto(_ConstCtor, 'const', typeProto, null ,ctorName);
  var o = Object.create(proto);
  function _ConstCtor() {
    return o;
  }

  _ConstCtor.prototype = proto;

  return _ConstCtor;
}

//helpers

function isUnionData(data) {
  return !!(data && data.__$ctor$__ && data.__$ctorType$__);
}

function isEmptyDescription(desc) {
  var isArray = t.isArray(desc);
  var isObject = t.isObject(desc);
  if (!isArray && !isObject) {
    return true;
  }

  if (isArray && desc.length === 0) {
    return true;
  }

  if (isObject && Object.keys(desc).length === 0) {
    return true;
  }

  return false;
}

// @ifdef DEBUG
function validateArgs(typeProto, checkPatterns, input, ctorName, ignoreLenCheck) {
  var dtName = typeProto.__$typeName$__ + '.' + ctorName;

  if(ignoreLenCheck !== true && !isLenEqual(checkPatterns, input)){
    throw new Error('['+dtName+']length of input data\'s keys doesn\'t match with the type description!');
  }
  each(function(v, k) {

    if (!checkPatterns.hasOwnProperty(k)) {
      throw new Error('['+dtName+']input data at "' + k + '" is not in the type decription!');
    }

    var checkPattern = checkPatterns[k];
    if(checkPattern === undefined){
      checkPattern = typeProto.__$type$__;
    }
    if (!patternCheck(checkPattern, v)) {
      throw new Error('['+dtName+']input data at "' + k + '" is invalid! given: ' + v);
    }
  }, input);
}
// @endif

function isLenEqual(o1, o2){
  var t_o1 = t(o1);
  var t_o2 = t(o2);
  if(t_o1 !== t_o2){
    return false;
  }

  return t_o1 === 'array' ? o1.length === o2.length : Object.keys(o1).length === Object.keys(o2).length;
}

function makeCtorProto(ctor, ctype, typeProto, checkPatterns, ctorName){
  var o = Object.create(typeProto);
  o.__$ctor$__ = ctor;
  o.__$ctorType$__ = ctype;
  o.__$ctorName$__ = ctorName;
  o.__$checkers$__ = checkPatterns;

  switch(ctype){
    case 'array':
      o.toJSON = function(){
        var self = this;
        return map(function(_, k){
          return self[k];
        }, checkPatterns);
      };
      break;
    case 'object':
      o.toJSON = function(){
        var self = this;
        return mapObject(function(_, k){
          return self[k];
        }, checkPatterns);
      };
      break;
    default:
      o.toJSON = function(){
        return this._dataTypeName();
      };
  }

  return o;
}

module.exports = makeType;
// @ifdef TEST
//test
if(require.main === module){
  // var LinkList_t = function(t){
  //   var LinkList = makeType({
  //     Nil: [],
  //     Item: {
  //       value: t,
  //       next: LinkList
  //     }
  //   });

  //   LinkList.prototype.isEmpty = function(){
  //     return LinkList.case({
  //       Nil: true,
  //       _: false
  //     }, this);
  //   };

  //   LinkList.prototype.head = function(){
  //     return LinkList.case({
  //       Nil: undefined,
  //       _: function(listItem){
  //         return listItem.value;
  //       }
  //     }, this);
  //   };

  //   LinkList.prototype.tail = function(){
  //     return LinkList.case({
  //       Nil: LinkList.Nil(),
  //       _: function(listItem){
  //         return listItem.next;
  //       }
  //     }, this);
  //   };

  //   return LinkList;
  // };
  var Action = makeType('Action', {
    T1: [t.isNumber, t.isString],
    T2: {
      name: t.isString,
      friends: [t.isString]
    },
    C: [],
    A: [Action]
  });

  Action.prototype.toStr = function(){
    return this.toString();
  };

  console.log(Action.T1(1, 'one').toStr());
  console.log(Action.T2({
    name: 'zj',
    friends: ['f1', 'f2']
  }).toStr());
  console.log(Action.C().toStr());
  console.log(Action.A(Action.T1(2, 'two')).toJSON());
  var a = Action.A(Action.T2({
    name: 'ybyb',
    friends: ['y1', 'y2']
  }));

  console.log(JSON.stringify(a));

  Action.update(a, {
    0: Action.C()
  });

  console.log(JSON.stringify(a));
}

// @endif
