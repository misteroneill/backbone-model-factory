var assert = require('assert');
var Backbone = require('../backbone-model-factory');

describe('Backbone.ModelFactory', function () {

  var Test = Backbone.ModelFactory({
    defaults: {
      foo: 'bar'
    },
    methodOnTest: function () {
      return true;
    }
  });

  var TestCustomIdAttr = Backbone.ModelFactory({
    idAttribute: 'foo'
  });

  var TestExtended = Backbone.ModelFactory(Test, {
    defaults: {
      foo: 'baz'
    }
  });

  var TestCollection = Backbone.Collection.extend({
    model: Test
  });

  it('creates constructor functions', function () {
    assert.strictEqual(typeof Test, 'function');
    assert.strictEqual(typeof TestCustomIdAttr, 'function');
    assert.strictEqual(typeof TestExtended, 'function');
  });

  describe('factory-generated constructors', function () {

    it('instantiate models with or without an id', function () {
      var test1 = new Test({id: 1});
      var test2 = new Test();

      assert.strictEqual(test1.get('foo'), 'bar');
      assert.strictEqual(test1.methodOnTest, Test.Model.prototype.methodOnTest);

      assert.strictEqual(test2.get('foo'), 'bar');
      assert.strictEqual(test2.methodOnTest, Test.Model.prototype.methodOnTest);

      assert.notStrictEqual(test1, test2);
    });

    it('instantiate models with a custom idAttribute', function () {
      var test1 = new TestCustomIdAttr({foo: 'test1'});
      var test2 = new TestCustomIdAttr();

      assert.strictEqual(test1.idAttribute, 'foo');
      assert.strictEqual(test1.get('foo'), 'test1');
      assert.strictEqual(test2.idAttribute, 'foo');
      assert.strictEqual(typeof test2.get('foo'), 'undefined');

      assert.notStrictEqual(test1, test2);
    });

    it('instantiate models with proper inheritance', function () {
      var test1 = new TestExtended();

      assert.strictEqual(test1.get('foo'), 'baz');
      assert.strictEqual(test1.methodOnTest, Test.Model.prototype.methodOnTest);
    });

    it('return an existing model if a duplicate value for id is given', function () {
      var test1 = new Test({id: 2});
      var test2 = new Test({id: 2});
      var test3 = new Test({id: 3});

      assert.strictEqual(test1, test2);
      assert.notStrictEqual(test1, test3);
    });

    it('return an existing model with custom idAttribute if a duplicate value for idAttribute attribute is given', function () {
      var test1 = new TestCustomIdAttr({foo: 'test2'});
      var test2 = new TestCustomIdAttr({foo: 'test2'});
      var test3 = new TestCustomIdAttr({foo: 'test3'});

      assert.strictEqual(test1, test2);
      assert.notStrictEqual(test1, test3);
    });

    it('return an updated existing model if a duplicate id and new attributes are given', function () {
      var test1 = new Test({id: 2});
      var test2 = new Test({id: 2, foo: null});

      assert.strictEqual(test1, test2);
      assert.strictEqual(test1.get('foo'), null);
    });

    it('store a model when a new model gains an id that did not exist', function () {
      var test = new Test();

      test.set('id', 4);
      assert.strictEqual(Test.Model.cache['4'], test);
    });

    it('store a model when a new model with a custom idAttribute gains an idAttribute attribute value that did not exist', function () {
      var test = new TestCustomIdAttr();

      test.set('foo', 'test4');
      assert.strictEqual(TestCustomIdAttr.Model.cache.test4, test);
    });

    it('do not allow a new model to gain an id that already exists', function () {
      var test = new Test();

      assert.throws(function () {
        test.set('id', 1);
      }, Error);
    });

    it('do not allow a new model with a custom idAttribute to gain an idAttribute attribute value that already exists', function () {
      var test = new TestCustomIdAttr();

      assert.throws(function () {
        test.set('foo', 'test1');
      }, Error);
    });

    it('work when used as the model for a collection', function () {
      var collection = new TestCollection([
        {foo: 'boo'}
      ]);

      var model = collection.first();

      assert.strictEqual(model.constructor, Test.Model);
      assert.strictEqual(model.methodOnTest, Test.Model.prototype.methodOnTest);
    });
  });
});
