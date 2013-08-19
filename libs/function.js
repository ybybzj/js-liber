define(['./array','./object','./lang'],function(ArrUtil, ObjUtil,L){
    var bind = function(fn,context){
        var partialParams = Array.prototype.slice.call(arguments,2);
        return function(){
            return fn.apply(context,partialParams.concat(ArrUtil.toArray(arguments)));
        }
    };
    
    var curry = function(fn/*,args*/){
        var partialArgs = Array.prototype.slice.call(arguments,1);
        //console.log(partialArgs);
        return function(){
            var args = ArrUtil.toArray(partialArgs);
            //the argmuments will fill in the 'undefined' placeholder in order,
            //and the extras will append to the tail.
            ArrUtil.fillInOrder(args,ArrUtil.toArray(arguments),undefined,true);
           // console.log(args);
            return fn.apply(this,args);
        
        }
    };
    var compose = function(fn/*,...*/) {
        if(!Arr.every(arguments,L.isFunction)) {
            throw new TypeError("arguments should all be functions!");
        }
        return function(result){
            return ArrUtil.reduce(fns,function(memo,fn){
                return fn(memo);
            },result);
        }
    };
    var multinvoke = function(fn,nt) {
        return function(){
            var result,i;
            for(i = 0; i < nt; i++){
                result = fn.apply(this,arguments);
            }
            return result;
        }
    };
    var inherits = function(ctor,superCtor) {
        ctor._super_ = superCtor.prototype;// use ctor._super_[fn] to use parent's fn
        var _proto_ = ctor.prototype;
        ctor.prototype = ObjUtil.create(superCtor.prototype,{
            constructor : {
                value : ctor,
                enumerable : false
            }
        });
        L.extend(ctor.prototype,_proto_);
        
        return ctor;
    };
    
    return {
        bind : bind,
        curry : curry,
        _inherits : inherits,
        compose : compose,
        multinvoke : multinvoke
    }
});
