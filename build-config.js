({
  // all modules loaded are relative to this path
  // e.g. require(['grid/core']) would grab /lib/grid/core.js
  baseUrl: '.',

  // specify custom module name paths
  paths: {
    almond: 'node_modules/almond/almond.min'
  },

  // target amd loader shim as the main module, path is relative to baseUrl.
  name: 'almond',

  //optimize: 'none',

  // files to include along with almond. only lib/skeleton.js is defined, as
  // it pulls in the rest of the dependencies automatically.
  include: ['main'],

  // code to wrap around the start / end of the resulting build file
  // the global variable used to expose the API is defined here
  wrap: {
    start: "(function(global,libName) {"+
              // check for amd loader on global namespace
           " var globalDefine = global.define;",

    end: " var library = require('main');var orgLib = global[libName];"+
            "library.noConflict = function(){"+
            "   global[libName] = orgLib; return this;};"+
           " if(typeof module !== 'undefined' && module.exports) {"+
                // export library for node
           " module.exports = library;"+
           " } else if(typeof globalDefine === 'function' && globalDefine.amd) {"+
                // define library for global amd loader that is already present
           " (function (define) {"+
           " define(function () { return (global[libName] = library); });"+
           " }(globalDefine));"+
           " } else {"+
                // define library on global namespace for inline script loading
           " global[libName] = library;"+
           " }"+
           "}(this,'_'));"//second param stands libName exported
  },

  // don't include coffeescript compiler in optimized file
  //stubModules: ['cs'],

  // build file destination, relative to the build file itself
  out: './build/liber.js'
})
