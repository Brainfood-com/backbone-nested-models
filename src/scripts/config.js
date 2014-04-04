/* global require:true */
var require;
require = (function() {
    'use strict';

    var require = {
        baseUrl: 'scripts',
        shim: {
    
        },
        paths: {
            'backbone-validation': '../lib/backbone-validation/dist/backbone-validation-amd',
            backbone: '../lib/backbone/backbone',
            underscore: '../lib/underscore/underscore'
        }
    };

    return require;
})();
