/* global define */
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

  /**
   * Gets the model's `idAttribute` value as a string.
   *
   * @private
   * @param  {Object} model
   * @return {String}
   */
  function getId(model) {
    return String(model.get(model.idAttribute));
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
    var cache = {};

    /**
     * Fires an appropriate constructor wipe event given a constructor
     * and an array of models.
     *
     * @private
     * @param  {Array} models
     */
    var constructorWipeEvent = function (models) {
      var remainder = _.values(cache);
      var events = 'wipe wipe:' + (remainder.length ? 'some' : 'all');
      Constructor.trigger(events, Constructor, models, remainder);
    };

    /**
     * A factory function which is treated like a constructor, but really
     * defers back to Model and creates instances only as needed.
     *
     * @param {Object} attrs
     * @param {Object} options
     */
    var Constructor = function (attrs, options) {
      attrs = _.isObject(attrs) ? attrs : null;

      var idAttribute = Model.prototype.idAttribute;
      var hasId = attrs !== null && attrs.hasOwnProperty(idAttribute);
      var key = hasId && String(attrs[idAttribute]);
      var exists = key && cache.hasOwnProperty(key);

      // Use any cached model or instantiate a new one.
      var model = exists ? cache[key] : new Model(attrs, options);

      model.constructor = Constructor;

      // If there is no match in the cache, store the new model.
      if (key && !exists) {
        cache[key] = model;

      // If there is a match in the cache, update its attributes based on the
      // passed-in attributes.
      } else {
        if (options && options.parse) {
          attrs = model.parse(attrs, options);
        }
        model.set(attrs, options);
      }

      // If no value for the idAttribute was supplied, add a check for when the
      // model gets one.
      if (!hasId) {
        model.once('change:' + idAttribute, function (model, value) {
          var key = getId(model);

          if (cache.hasOwnProperty(key)) {

            // This should not happen unless you're doing something really strange
            // with your `idAttribute` attribute values!
            throw new Error('model idAttribute attribute value already exists in cache');
          } else {
            cache[key] = model;
          }
        });
      }

      // This is the magic part - if a constructor returns an object, a new
      // object is NOT generated (though we may generate one internally).
      return model;
    };

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
    var Model = Constructor._Model = (function (B, p) {
      var baseIsFunc = typeof B === 'function';

      p = _.extend({

        /**
         * Removes a model instance from its constructor's cache. Will exist on
         * the `prototype` chain of all model instances generated from
         * `Backbone.ModelFactory` constructors.
         *
         * @method wipe
         * @param  {Object} [options]
         * @param  {Boolean} [options.silent=false]
         *         If `true`, suppresses triggering of all event(s).
         * @param  {Boolean} [options._suppress=false]
         *         Intended to be for internal use, if `true`, suppresses
         *         triggering of constructor-level event(s). `silent` takes
         *         precedence over this option.
         */
        wipe: function (options) {
          options = options || {};
          delete cache[getId(this)];
          if (!options.silent) {
            this.trigger('wipe', this);
            if (!options._suppress) {
              constructorWipeEvent([this]);
            }
          }
        }
      }, baseIsFunc ? p : B);

      // Support both models generated with ModelFactory or via normal means.
      B = baseIsFunc ? (B._Model || B) : Backbone.Model;
      return B.extend(p);
    })(Base, prototype);

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
    Constructor._cache = cache;

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
     *         Pass a single model instance (of this constructor only!), an
     *         array of instances, or a collection to wipe only those
     *         instances from the cache.
     *
     *         Pass nothing (or any `falsy` value) to wipe _all_ models
     *         from the cache.
     *
     * @param  {Object} [options]
     * @param  {Boolean} [options.silent=false]
     */
    Constructor.wipe = function (models, options) {
      options = options || {};

      // Handle case of a collection.
      if (models instanceof Backbone.Collection) {
        models = [].concat(models.models);

      // Handle case of a full wipe.
      } else if (!models) {
        models = _.values(this._cache);

      // Handle case of an arbitrary value (presumably a model instance, but
      // the filter will take care of it if not).
      } else if (!_.isArray(models)) {
        models = [models];
      }

      // At this point, if we have an empty array, it likely means either the
      // collection or array was empty. No action is taken.
      if (!models.length) {
        return;
      }

      // Filter down to model instances of this specific model only!
      models = _.filter(models, function (model) {
        return model instanceof this;
      }, this);

      // Finally, wipe all models still in the array - triggering a single
      // event for each - and trigger the appropriate event on the constructor.
      if (models.length) {
        _.invoke(models, 'wipe', _.extend({_suppress: true}, options));
        constructorWipeEvent(models);
      } else {
        throw new Error('invalid argument');
      }
    };

    // Make the constructor into an event bus.
    _.extend(Constructor, Backbone.Events);

    return Constructor;
  };

  return Backbone;
});
