/*!
    Backbone Model Factory 1.1.0

    (c) 2012 Patrick G. O'Neill
    Backbone Model Factory may be freely distributed under the MIT license
    https://github.com/misteroneill/backbone-model-factory
*/
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
    A function which is bound to the first change of a model's idAttribute
    attribute value. Note that this function is optimistic and will allow
    _any_ value to be set - it does not want to assume anything about what sort
    of value to store as the idAttribute attribute.

    The only limitation is that this method will throw an error if you are
    supplying an ID which already exists, for example:

      var Model = Backbone.ModelFactory();
      var a = new Model({id: 1});
      var b = new Model(); // (a === b) === false

      b.set('id', 1); // throws error

    The reason for this behavior is that there is no way to change the object
    referenced by `b` from a change listener!

    @author Pat O'Neill <pgoneill@gmail.com>
    @private
    @memberof Backbone.ModelFactory
    @param {Object} model
      The model that changed.
    @param {Mixed} value
      The new value of the idAttribute attribute.
  */
  function checkId(model, value) {
    var key = ''+value;
    var cache = model.constructor.cache;

    // Backward-compatibility with Backbone pre-0.9.9
    if (!model.once) {
      model.off('change:' + model.idAttribute, checkId);
    }

    if (cache.hasOwnProperty(key)) {

      // This should not happen unless you're doing something really strange
      // with your idAttribute attribute values!
      throw new Error('model idAttribute attribute value already exists in cache');
    } else {
      cache[key] = model;
    }
  }

  /**
    This method on the `Backbone` object is used to generate model constructors
    which will enforce the existence of only a single object with any given
    value for the `idAttribute` attribute.

    @author Pat O'Neill <pgoneill@gmail.com>
    @example
        var Foo = Backbone.ModelFactory();
        var foo1 = new Foo({id: 1});
        var foo2 = new Foo({id: 1});
        var foo3 = new Foo({id: 2});

        console.log(foo1 === foo2); // true
        console.log(foo1 === foo3); // false

    @param {Function|Object} [Base]
        The model constructor which the new model constructor should extend. If
        a non-function object is given here, the new model constructor will
        extend a  and this argument will be applied as the
        `prototype` instead.

    @param {Object} [prototype]
        If a `Base` model constructor is given, this argument should be the
        prototype object of the new model constructor.

    @return {Function}
        A model constructor.
  */
  Backbone.ModelFactory = function (Base, prototype) {
    prototype = typeof Base === 'object' ? Base : (typeof prototype === 'object' ? prototype : null);

    var BaseConstructor = typeof Base === 'function' ?
      // Support both models generated with ModelFactory or via normal means.
      (Base.hasOwnProperty('Model') ? Base.Model : Base) :
      Backbone.Model;

    var Model = BaseConstructor.extend(prototype);
    var cache = {};

    /**
      Return a factory function which is treated like a constructor, but
      really defers back to Model and creates instances only as needed.

      @author Pat O'Neill <pgoneill@gmail.com>
      @param {Object} [attrs]
    */
    function Constructor(attrs, options) {
      attrs = typeof attrs === 'object' ? attrs : null;

      var idAttribute = Model.prototype.idAttribute;
      var hasId = attrs !== null && attrs.hasOwnProperty(idAttribute);
      var key = hasId && ''+attrs[idAttribute];
      var exists = key && cache.hasOwnProperty(key);

          // Use any cached model or instantiate a new one.
      var model = exists ? cache[key] : new Model(attrs, options);

      // If there is no match in the cache, store the new model.
      if (!exists) {
        cache[key] = model;

      // If there is a match in the cache, update its attributes based on the
      // passed-in attributes.
      } else {
        model.set(attrs, options);
      }

      // If no value for the idAttribute attribute was supplied, add a check
      // for when the model gets one.
      if (!hasId) {

        // Backward-compatibility with Backbone pre-0.9.9
        model[model.once ? 'once' : 'on']('change:' + idAttribute, checkId);
      }

      // This is the magic part - if a constructor returns an object, a new
      // object is NOT generated (though we may generate one internally).
      return model;
    }

    /**
      A public reference to the actual model on the constructor. Use this for
      instanceof checks.

      @author Pat O'Neill <patricko@kindlingapp.com>
      @example
        var Foo = Backbone.ModelFactory();
        var foo = new Foo();

        console.log(foo instanceof Foo.Model); // true
    */
    Constructor.Model = Model;

    /**
      A public reference to the cache of models generated by this constructor.
      Since garbage collection will NOT clear model instances created by model
      factory constructors, it may be useful to delete unneeded models from this
      object directly.

      Model instances are stored under the value of their `idAttribute` - for
      example, by default they will be stored using the value of their `id`
      attribute. Models without an `idAttribute` value will (i.e. newly created
      models) will not be stored in cache until they gain a value!

      @author Pat O'Neill <patricko@kindlingapp.com>
      @example
        var Foo = Backbone.ModelFactory();
        var foo = new Foo({id: 1});

        delete Foo.Model.cache['1'];
    */
    Constructor.Model.cache = cache;

    return Constructor;
  };

  return Backbone;

});
