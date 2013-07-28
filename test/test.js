/*global Backbone:false, describe:false, it:false, expect:false */
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
    model: Test
  });

  it('creates constructor functions', function () {
    expect(typeof Test).toBe('function');
    expect(typeof TestCustomIdAttr).toBe('function');
    expect(typeof TestExtended).toBe('function');
  });

  describe('factory-generated constructors', function () {

    it('instantiate models with or without an id', function () {
      var test1 = new Test({id: 1});
      var test2 = new Test();

      expect(test1.get('foo')).toBe('bar');
      expect(test1.methodOnTest).toBe(Test.Model.prototype.methodOnTest);

      expect(test2.get('foo')).toBe('bar');
      expect(test2.methodOnTest).toBe(Test.Model.prototype.methodOnTest);

      expect(test1).not.toBe(test2);
    });

    it('instantiate models with a custom idAttribute', function () {
      var test1 = new TestCustomIdAttr({foo: 'test1'});
      var test2 = new TestCustomIdAttr();

      expect(test1.idAttribute).toBe('foo');
      expect(test1.get('foo')).toBe('test1');
      expect(test2.idAttribute).toBe('foo');
      expect(typeof test2.get('foo')).toBe('undefined');

      expect(test1).not.toBe(test2);
    });

    it('instantiate models with proper inheritance', function () {
      var test1 = new TestExtended();

      expect(test1.get('foo')).toBe('baz');
      expect(test1.methodOnTest).toBe(Test.Model.prototype.methodOnTest);
    });

    it('return an existing model if a duplicate value for id is given', function () {
      var test1 = new Test({id: 2});
      var test2 = new Test({id: 2});
      var test3 = new Test({id: 3});

      expect(test1).toBe(test2);
      expect(test1).not.toBe(test3);
    });

    it('return an existing model with custom idAttribute if a duplicate value for idAttribute attribute is given', function () {
      var test1 = new TestCustomIdAttr({foo: 'test2'});
      var test2 = new TestCustomIdAttr({foo: 'test2'});
      var test3 = new TestCustomIdAttr({foo: 'test3'});

      expect(test1).toBe(test2);
      expect(test1).not.toBe(test3);
    });

    it('return an updated existing model if a duplicate id and new attributes are given', function () {
      var test1 = new Test({id: 2});
      var test2 = new Test({id: 2, foo: null});

      expect(test1).toBe(test2);
      expect(test1.get('foo')).toBe(null);
    });

    it('store a model when a new model gains an id that did not exist', function () {
      var test = new Test();

      test.set('id', 4);
      expect(Test.Model.cache['4']).toBe(test);
    });

    it('throw an error when a model gains an idAttribute attribute value which already exists', function () {
      var test1 = new Test({id: 5});
      var test2 = new Test();

      expect(function () {
        test2.set('id', 5);
      }).toThrow();
    });

    it('store a model when a new model with a custom idAttribute gains an idAttribute attribute value that did not exist', function () {
      var test = new TestCustomIdAttr();

      test.set('foo', 'test4');
      expect(TestCustomIdAttr.Model.cache.test4).toBe(test);
    });

    it('do not allow a new model to gain an id that already exists', function () {
      var test = new Test();

      expect(function () {
        test.set('id', 1);
      }).toThrow();
    });

    it('do not allow a new model with a custom idAttribute to gain an idAttribute attribute value that already exists', function () {
      var test = new TestCustomIdAttr();

      expect(function () {
        test.set('foo', 'test1');
      }).toThrow();
    });

    it('work when used as the model for a collection', function () {
      var collection = new TestCollection([
        {foo: 'boo'}
      ]);

      var model = collection.first();

      expect(model.constructor).toBe(Test.Model);
      expect(model.methodOnTest).toBe(Test.Model.prototype.methodOnTest);
    });
  });
});
