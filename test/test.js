var assert = require('assert');
var _ = require('underscore');
var Backbone = require('../backbone-model-factory');

var symbol = '+';
var indent = '\n  ';
var notice = symbol + ' Testing with Backbone ' + Backbone.VERSION + ' ' + symbol;
var border = notice.split('').map(function () {
  return symbol;
}).join('');

console.log([
  indent, border,
  indent, notice,
  indent, border
].join(''));

describe('Backbone.ModelFactory', function () {
  'use strict';

  var Test = Backbone.ModelFactory({
    defaults: {
      foo: 'bar'
    },
    methodOnTest: function () {
      return true;
    }
  });

  var TestBare = Backbone.ModelFactory();

  var TestCustomIdAttr = Backbone.ModelFactory({
    idAttribute: 'foo'
  });

  var TestExtended = Backbone.ModelFactory(Test, {
    defaults: {
      foo: 'baz'
    }
  });

  var TestCollection = Backbone.Collection.extend({
    model: Test,
    url: 'test-fetch',
    sync: function (method, collection, options) {
      options.success([
        {id: 1, foo: 'test1'},
        {id: 2, foo: 'test2'}
      ]);
    }
  });

  it('creates constructor functions', function () {
    assert.ok(_.isFunction(Test));
    assert.ok(_.isFunction(TestCustomIdAttr));
    assert.ok(_.isFunction(TestExtended));
  });

  describe('factory-generated constructors', function () {

    afterEach(function () {
      Test.wipe();
      TestBare.wipe();
      TestCustomIdAttr.wipe();
      TestExtended.wipe();
    });

    it('instantiate objects with or without an `id`', function () {
      var a = new Test({id: 1});
      var b = new Test();

      assert.strictEqual(a.get('foo'), 'bar');
      assert.strictEqual(a.methodOnTest, Test.prototype.methodOnTest);

      assert.strictEqual(b.get('foo'), 'bar');
      assert.strictEqual(b.methodOnTest, Test.prototype.methodOnTest);

      assert.notStrictEqual(a, b);
    });

    it('instantiate objects with a custom `idAttribute`', function () {
      var a = new TestCustomIdAttr({foo: 'x'});
      var b = new TestCustomIdAttr();

      assert.strictEqual(a.idAttribute, 'foo');
      assert.strictEqual(a.get('foo'), 'x');
      assert.strictEqual(b.idAttribute, 'foo');
      assert.ok(_.isUndefined(b.get('foo')));

      assert.notStrictEqual(a, b);
    });

    it('instantiate objects with proper inheritance', function () {
      var a = new TestExtended();

      assert.strictEqual(a.constructor, TestExtended);
      assert.strictEqual(a.get('foo'), 'baz');
      assert.strictEqual(a.methodOnTest, Test.prototype.methodOnTest);
    });

    it('instantiate objects which pass `instanceof` checks against the constructor and the actual model', function () {
      var a = new Test({id: 1});
      assert.ok(a instanceof Test);
      assert.ok(a instanceof Test._Model);
    });

    it('return an existing instance if a duplicate value for `id` is given', function () {
      var a = new Test({id: 1});
      assert.strictEqual(new Test({id: 1}), a);
      assert.notStrictEqual(new Test({id: 2}), a);
    });

    it('return an existing instance with custom `idAttribute` if a duplicate value for `idAttribute` attribute is given', function () {
      var a = new TestCustomIdAttr({foo: 'x'});

      assert.strictEqual(new TestCustomIdAttr({foo: 'x'}), a);
      assert.notStrictEqual(new TestCustomIdAttr({foo: 'y'}), a);
    });

    it('return an updated existing instance if a duplicate `id` and new attributes are given', function () {
      var a = new Test({id: 1});
      var b = new Test({id: 1, foo: 'bar'});

      assert.strictEqual(a, b);
      assert.strictEqual(a.get('foo'), 'bar');
    });

    it('store an instance when a new instance gains an `id` that did not exist', function () {
      var a = new Test();

      a.set({id: 4});
      assert.strictEqual(Test._cache['4'], a);
    });

    it('throw an error when an instance gains an `idAttribute` attribute value which already exists', function () {
      var a = new Test({id: 5});
      var b = new Test();

      assert.throws(function () {
        b.set({id: 5});
      });
    });

    it('store an instance when a new instance with a custom `idAttribute` gains an `idAttribute` attribute value that did not exist', function () {
      var a = new TestCustomIdAttr();

      a.set({foo: 'x'});
      assert.strictEqual(TestCustomIdAttr._cache.x, a);
    });

    it('throw an error when a new instance with a custom `idAttribute` to gain an `idAttribute` attribute value that already exists', function () {
      var a = new TestCustomIdAttr({foo: 'x'});
      var b = new TestCustomIdAttr();

      assert.throws(function () {
        b.set({foo: 'x'});
      });
    });

    it('work when used as the `model` for a `Backbone.Collection`', function () {
      var collection = new TestCollection([
        {foo: 'boo'}
      ]);

      var model = collection.first();

      assert.strictEqual(model.constructor, Test);
      assert.strictEqual(model.methodOnTest, Test.prototype.methodOnTest);
    });

    it('are able to be fetched from the server (#5)', function () {
      var collection = new TestCollection();

      collection.fetch();

      assert.strictEqual(collection.length, 2);
      assert.strictEqual(collection.at(0).get('foo'), 'test1');
    });

    it('generate instances which can `wipe` themselves from cache', function () {
      var a = new Test({id: 1});

      assert.ok(_.isFunction(a.wipe));
      a.wipe();
      assert.notStrictEqual(new Test({id: 1}), a);
    });

    it('can `wipe` an instance or instances depending on arguments', function () {
      var a = new Test({id: 1});
      var b = new Test({id: 2});
      var c = new Test({id: 3});
      var d = new Test({id: 6});
      var e = new Test({id: 7});

      var x = new TestCollection([
        {id: 4},
        {id: 5}
      ]);

      var strOfKeys = function () {
        return _.sortBy(_.keys(Test._cache), _.identity).join('');
      };

      assert.ok(_.isFunction(Test.wipe), true);
      assert.strictEqual(strOfKeys(), '1234567');

      Test.wipe(a);
      assert.strictEqual(strOfKeys(), '234567');

      Test.wipe([b, c]);
      assert.strictEqual(strOfKeys(), '4567');

      Test.wipe(x);
      assert.strictEqual(strOfKeys(), '67');

      Test.wipe();
      assert.strictEqual(strOfKeys(), '');
    });
  });
});
