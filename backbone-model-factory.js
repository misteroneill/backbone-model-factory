/*global exports module require define*/
(function (root, factory) {
  'use strict';

  // CommonJS/NodeJS
  if (typeof exports !== 'undefined' && typeof module !== 'undefined' && module.exports) {
    exports = module.exports = require('backbone');
    factory(exports);

  // AMD/RequireJS
  } else if (typeof define === 'function' && define.amd) {
    define(['backbone'], factory);

  // Browser global object
  } else {
    factory(root.Backbone);
  }

})(this, function (Backbone) {
  'use strict';

  /**
    Adds the "ModelFactory" method to the Backbone object.

    @author Pat O'Neill <pgoneill@gmail.com>
  */
  Backbone.ModelFactory = function () {

  };

  return Backbone;

});
