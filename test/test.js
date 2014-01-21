var root = this;

describe('Backbone.ModelFactory', function () {
  'use strict';

  var Test = root.Test = Backbone.ModelFactory({
    defaults: {
      foo: 'bar'
    },
    methodOnTest: function () {
      return true;
    }
  });

  var TestBare = root.TestBare = Backbone.ModelFactory();

  var TestCustomIdAttr = root.TestCustomIdAttr = Backbone.ModelFactory({
    idAttribute: 'foo'
  });

  var TestExtended = root.TestExtended = Backbone.ModelFactory(Test, {
    defaults: {
      foo: 'baz'
    }
  });

  var TestCollection = root.TestCollection = Backbone.Collection.extend({
    model: Test,
    url: 'test-fetch'
  });

  it('creates constructor functions', function () {
    expect(typeof Test).toBe('function');
    expect(typeof TestCustomIdAttr).toBe('function');
    expect(typeof TestExtended).toBe('function');
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

      expect(a.get('foo')).toBe('bar');
      expect(a.methodOnTest).toBe(Test.prototype.methodOnTest);

      expect(b.get('foo')).toBe('bar');
      expect(b.methodOnTest).toBe(Test.prototype.methodOnTest);

      expect(a).not.toBe(b);
    });

    it('instantiate objects with a custom `idAttribute`', function () {
      var a = new TestCustomIdAttr({foo: 'x'});
      var b = new TestCustomIdAttr();

      expect(a.idAttribute).toBe('foo');
      expect(a.get('foo')).toBe('x');
      expect(b.idAttribute).toBe('foo');
      expect(typeof b.get('foo')).toBe('undefined');

      expect(a).not.toBe(b);
    });

    it('instantiate objects with proper inheritance', function () {
      var a = new TestExtended();

      expect(a.constructor).toBe(TestExtended);
      expect(a.get('foo')).toBe('baz');
      expect(a.methodOnTest).toBe(Test.prototype.methodOnTest);
    });

    it('instantiate objects which pass `instanceof` checks against the constructor and the actual model', function () {
      var a = new Test({id: 1});
      expect(a instanceof Test).toBe(true);
      expect(a instanceof Test._Model).toBe(true);
    });

    it('return an existing instance if a duplicate value for `id` is given', function () {
      var a = new Test({id: 1});
      expect(new Test({id: 1})).toBe(a);
      expect(new Test({id: 2})).not.toBe(a);
    });

    it('return an existing instance with custom `idAttribute` if a duplicate value for `idAttribute` attribute is given', function () {
      var a = new TestCustomIdAttr({foo: 'x'});

      expect(new TestCustomIdAttr({foo: 'x'})).toBe(a);
      expect(new TestCustomIdAttr({foo: 'y'})).not.toBe(a);
    });

    it('return an updated existing instance if a duplicate `id` and new attributes are given', function () {
      var a = new Test({id: 1});
      var b = new Test({id: 1, foo: 'bar'});

      expect(a).toBe(b);
      expect(a.get('foo')).toBe('bar');
    });

    it('store an instance when a new instance gains an `id` that did not exist', function () {
      var a = new Test();

      a.set({id: 4});
      expect(Test._cache['4']).toBe(a);
    });

    it('throw an error when an instance gains an `idAttribute` attribute value which already exists', function () {
      var a = new Test({id: 5});
      var b = new Test();

      expect(function () {
        b.set({id: 5});
      }).toThrow();
    });

    it('store an instance when a new instance with a custom `idAttribute` gains an `idAttribute` attribute value that did not exist', function () {
      var a = new TestCustomIdAttr();

      a.set({foo: 'x'});
      expect(TestCustomIdAttr._cache.x).toBe(a);
    });

    it('throw an error when a new instance with a custom `idAttribute` to gain an `idAttribute` attribute value that already exists', function () {
      var a = new TestCustomIdAttr({foo: 'x'});
      var b = new TestCustomIdAttr();

      expect(function () {
        b.set({foo: 'x'});
      }).toThrow();
    });

    it('work when used as the `model` for a `Backbone.Collection`', function () {
      var collection = new TestCollection([
        {foo: 'boo'}
      ]);

      var model = collection.first();

      expect(model.constructor).toBe(Test);
      expect(model.methodOnTest).toBe(Test.prototype.methodOnTest);
    });

    it('are able to be fetched from the server (#5)', function () {
      var server = sinon.fakeServer.create();

      server.autoRespond = true;
      server.autoRespondAfter = 50;

      server.respondWith(/test-fetch/, function (xhr) {
        var results = [];

        xhr.respond(
          200,
          {'Content-Type': 'application/json'},
          JSON.stringify([
            {id: 1, foo: 'test1'},
            {id: 2, foo: 'test2'}
          ])
        );
      });

      var collection = new TestCollection();
      var request = collection.fetch();

      waitsFor(function () {
        return request.status === 200;
      }, 'the request to return', 200);

      runs(function () {
        expect(collection.length).toBe(2);
        expect(collection.at(0).get('foo')).toBe('test1');
      });
    });

    it('generate instances which can `wipe` themselves from cache', function () {
      var a = new Test({id: 1});

      expect(_.isFunction(a.wipe)).toBe(true);
      a.wipe();
      expect(new Test({id: 1})).not.toBe(a);
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

      expect(_.isFunction(Test.wipe)).toBe(true);
      expect(strOfKeys()).toBe('1234567');

      Test.wipe(a);
      expect(strOfKeys()).toBe('234567');

      Test.wipe([b, c]);
      expect(strOfKeys()).toBe('4567');

      Test.wipe(x);
      expect(strOfKeys()).toBe('67');

      Test.wipe();
      expect(strOfKeys()).toBe('');
    });
  });
});
