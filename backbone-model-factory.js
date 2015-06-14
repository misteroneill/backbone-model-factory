/*!
 * Backbone Model Factory 1.2.0
 *
 * Depends on: Backbone 0.9.9 - 1.2.1, Underscore
 *
 * (c) 2015 Patrick G. O'Neill
 * Backbone Model Factory may be freely distributed under the MIT license
 * https://github.com/misteroneill/backbone-model-factory
 */
(function (root, factory) {
  'use strict';

  // CommonJS/NodeJS
  if (typeof exports !== 'undefined' && typeof module !== 'undefined' && module.exports) {
    exports = module.exports = require('backbone');
    factory(require('underscore'), exports);

  // AMD/RequireJS
  } else if (typeof define === 'function' && define.amd) {
    define(['underscore', 'backbone'], factory);

  // Browser global object
  } else {
    factory(root._, root.Backbone);
  }

})(this, function (_, Backbone) {
  'use strict';

  var methods = {

    /**
     * Removes a model instance from its constructor's cache. Will exist on
     * the `prototype` chain of all model instances generated from
     * `Backbone.ModelFactory` constructors.
     *
     * @method wipe
     */
    wipe: function () {
      if (_.isObject(this.constructor._cache)) {
        delete this.constructor._cache[''+this.get(this.idAttribute)];
      }
    }
  };

  /**
   * A function which is bound to the first change of a model's idAttribute
   * attribute value. Note that this function is optimistic and will allow
   * _any_ value to be set - it does not want to assume anything about what
   * sort of value to store as the idAttribute attribute.
   *
   * The only limitation is that this method will throw an error if you are
   * supplying an ID which already exists, for example:
   *
   *   var Model = Backbone.ModelFactory();
   *   var a = new Model({id: 1});
   *   var b = new Model(); // (a === b) === false
   *
   *   b.set('id', 1); // throws error
   *
   * The reason for this behavior is that there is no way to change the object
   * referenced by `b` from a change listener!
   *
   * @private
   * @param {Object} model
   *        The model that changed.
   *
   * @param {Mixed} value
   *        The new value of the idAttribute attribute.
   */
  function checkId(model, value) {
    var key = ''+model.get(model.idAttribute);
    var cache = model.constructor._cache;

    if (_.has(cache, key)) {

      // This should not happen unless you're doing something really strange
      // with your `idAttribute` attribute values!
      throw new Error('model idAttribute attribute value already exists in cache');
    } else {
      cache[key] = model;
    }
  }

  /**
   * This method on the `Backbone` object is used to generate model
   * constructors which will enforce the existence of only a single object
   * with any given value for the `idAttribute` attribute.
   *
   * @example
   *     var Foo = Backbone.ModelFactory();
   *     var foo1 = new Foo({id: 1});
   *     var foo2 = new Foo({id: 1});
   *     var foo3 = new Foo({id: 2});
   *
   *     console.log(foo1 === foo2); // true
   *     console.log(foo1 === foo3); // false
   *
   * @param {Function|Object} Base
   *        The model constructor which the new model constructor should
   *        extend. If a non-function object is given here, the new model
   *        constructor will extend a  and this argument will be applied
   *        as the `prototype` instead.
   *
   * @param {Object} prototype
   *        If a `Base` model constructor is given, this argument should be
   *        the prototype object of the new model constructor.
   *
   * @return {Function} A model constructor.
   */
  Backbone.ModelFactory = function (Base, prototype) {
    var Model, cache;

    prototype = _.extend(
      {},
      methods,

      // Support prototype object passed as first or second argument (or not
      // at all).
      _.isObject(Base) && !_.isFunction(Base) ? Base : (_.isObject(prototype) ? prototype : null)
    );

    Base = _.isFunction(Base) ?

      // Support both models generated with ModelFactory or via normal means.
      (_.has(Base, '_Model') ? Base._Model : Base) :
      Backbone.Model;

    Model = Base.extend(prototype);

    /**
     * A factory function which is treated like a constructor, but really
     * defers back to Model and creates instances only as needed.
     *
     * @param {Object} attrs
     * @param {Object} options
     */
    function Constructor(attrs, options) {
      attrs = _.isObject(attrs) ? attrs : null;

      var idAttribute = Model.prototype.idAttribute;
      var hasId = attrs !== null && _.has(attrs, idAttribute);
      var key = hasId && ''+attrs[idAttribute];
      var exists = key && _.has(cache, key);

      // Use any cached model or instantiate a new one.
      var model = exists ? cache[key] : new Model(attrs, options);

      model.constructor = Constructor;

      // If there is no match in the cache, store the new model.
      if (key && !exists) {
        cache[key] = model;

      // If there is a match in the cache, update its attributes based on the
      // passed-in attributes.
      } else {
        model.set(options && options.parse ? model.parse(attrs, options) : attrs, options);
      }

      // If no value for the idAttribute was supplied, add a check for when the
      // model gets one.
      if (!hasId) {
        model.once('change:' + idAttribute, checkId);
      }

      // This is the magic part - if a constructor returns an object, a new
      // object is NOT generated (though we may generate one internally).
      return model;
    }

    /**
     * A reference to the actual model on the constructor.
     *
     * @property {Function} _Model
     * @example
     *   var Foo = Backbone.ModelFactory();
     *   var foo = new Foo();
     *
     *   console.log(foo instanceof Foo.Model); // true
     */
    Constructor._Model = Model;

    /**
     * Since garbage collection will _not_ clear model instances created by
     * model factory constructors, it may be useful to uncache model
     * instances which are no longer needed from this object directly - or
     * use the `wipe` method on the constructor or the model itself.
     *
     * Model instances are stored under the value of their `idAttribute` -
     * for example, by default they will be stored using the value of their
     * `id` attribute. Models without an `idAttribute` value (i.e. newly
     * created models) will not be stored in cache until they gain an
     * `idAttribute` value.
     *
     * @property {Object} _cache
     * @example
     *   var Foo = Backbone.ModelFactory();
     *   var foo = new Foo({id: 1});
     *
     *   Foo.wipe(foo);
     *
     *   var bar = new Foo({id: 1});
     *   console.log(bar === foo); // false
     *   bar.wipe();
     *
     *   var baz = new Foo();
     *   baz.set({id: 2});
     *   console.log(new Foo({id: 2}) === baz); // true
     */
    cache = Constructor._cache = {};

    /**
     * The `Constructor` and `Constructor.Model` share `prototype`s so that
     * `instanceof` checks can support either function.
     *
     * @property {Object} prototype
     * @example
     *   var Foo = Backbone.ModelFactory();
     *   var foo = new Foo();
     *
     *   console.log(foo instanceof Foo.Model); // true
     *   console.log(foo instanceof Foo); // true
     */
    Constructor.prototype = Model.prototype;

    /**
     * Remove a model instance, a subset of instances, or _all_ instances from
     * this constructor's cache.
     *
     * @method wipe
     * @param  {Object|Backbone.Collection|Array|undefined} models
     *         Pass a single model instance, an array of instances, or a
     *         collection to wipe only those instances from the cache.
     *
     *         Pass nothing (or any `falsy` value) to wipe _all_ models
     *         from the cache.
     */
    Constructor.wipe = function (models) {
      models = models instanceof Backbone.Collection ? models.models : models;
      if (!models || _.isArray(models)) {
        _.invoke(models || _.values(this._cache), 'wipe');
      } else if (_.isObject(models)) {
        models.wipe();
      } else {
        throw new Error('invalid argument');
      }
    };

    return Constructor;
  };

  return Backbone;

});
