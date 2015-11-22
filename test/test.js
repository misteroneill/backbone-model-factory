/* global afterEach, beforeEach, describe, it */

var _ = require('underscore');
var assert = require('assert');
var cowsay = require('cowsay');
var sinon = require('sinon');
var Backbone = require('../backbone-model-factory');

console.log(cowsay.say({
  text: 'Testing with BackboOoOoOone ' + Backbone.VERSION
}));

describe('Backbone.ModelFactory', function () {
  'use strict';

  beforeEach(function () {
    this.sinon = sinon.sandbox.create();

    this.Test = Backbone.ModelFactory({
      defaults: {
        foo: 'bar'
      },
      methodOnTest: function () {
        return true;
      }
    });

    this.TestBare = Backbone.ModelFactory();

    this.TestCustomIdAttr = Backbone.ModelFactory({
      idAttribute: 'foo'
    });

    this.TestExtended = Backbone.ModelFactory(this.Test, {
      defaults: {
        foo: 'baz'
      }
    });

    this.TestCollection = Backbone.Collection.extend({
      model: this.Test,
      url: 'test-fetch',
      sync: function (method, collection, options) {
        options.success([
          {id: 1, foo: 'test1'},
          {id: 2, foo: 'test2'}
        ]);
      }
    });
  });

  afterEach(function () {
    this.sinon.restore();

    this.Test.off().wipe();
    this.TestBare.off().wipe();
    this.TestCustomIdAttr.off().wipe();
    this.TestExtended.off().wipe();
  });

  it('creates constructor functions', function () {

    assert.strictEqual(
      typeof this.Test,
      'function',
      'the Test constructor is a function'
    );

    assert.strictEqual(
      typeof this.TestCustomIdAttr,
      'function',
      'the TestCustomIdAttr constructor is a function'
    );

    assert.strictEqual(
      typeof this.TestExtended,
      'function',
      'the TestExtended constructor is a function'
    );
  });

  it('instantiate objects with or without an `id`', function () {
    var a = new this.Test({id: 1});
    var b = new this.Test();

    assert.strictEqual(
      a.get('foo'),
      'bar',
      'an instance gets defaults from its model'
    );

    assert.strictEqual(
      a.methodOnTest,
      this.Test.prototype.methodOnTest,
      'an instance gets methods from its model'
    );

    assert.strictEqual(
      b.get('foo'),
      'bar',
      'an instance with no `id` gets defaults from its model'
    );

    assert.strictEqual(
      b.methodOnTest,
      this.Test.prototype.methodOnTest,
      'an instance with no `id` gets methods from its model'
    );

    assert.notStrictEqual(a, b, 'instances are separate objects');
  });

  it('instantiate objects with a custom `idAttribute`', function () {
    var a = new this.TestCustomIdAttr({foo: 'x'});
    var b = new this.TestCustomIdAttr();

    assert.strictEqual(
      a.idAttribute,
      'foo',
      'an instance gets a custom `idAttribute` from its model'
    );

    assert.strictEqual(
      a.get('foo'),
      'x',
      'an instance gets custom attributes'
    );

    assert.strictEqual(
      b.idAttribute,
      'foo',
      'an instance gets a custom `idAttribute` from its model'
    );

    assert.strictEqual(
      typeof b.get('foo'),
      'undefined',
      'an instance gets custom attributes'
    );

    assert.notStrictEqual(a, b, 'instances are separate objects');
  });

  it('instantiate objects with proper inheritance', function () {
    var a = new this.TestExtended();

    assert.strictEqual(
      a.constructor,
      this.TestExtended,
      'an instance has the correct constructor'
    );

    assert.strictEqual(
      a.get('foo'),
      'baz',
      'an instance gets defaults from its model'
    );

    assert.strictEqual(
      a.methodOnTest,
      this.Test.prototype.methodOnTest,
      'an instance may get methods from its model\'s super-class'
    );
  });

  it('instantiate objects which pass `instanceof` checks against the constructor and the actual model', function () {
    var a = new this.Test({id: 1});

    assert(
      a instanceof this.Test,
      'an instance is an `instanceof` its constructor'
    );

    assert(
      a instanceof this.Test._Model,
      'an instance is also an `instanceof` its model'
    );
  });

  it('return an existing instance if a duplicate value for `id` is given', function () {
    var a = new this.Test({id: 1});

    assert.strictEqual(
      new this.Test({id: 1}),
      a,
      'constructors return existing instances for duplicate `id`s'
    );

    assert.notStrictEqual(
      new this.Test({id: 2}),
      a,
      'constructors return new instances for new `id`s'
    );
  });

  it('return an existing instance with custom `idAttribute` if a duplicate value for `idAttribute` attribute is given', function () {
    var a = new this.TestCustomIdAttr({foo: 'x'});

    assert.strictEqual(
      new this.TestCustomIdAttr({foo: 'x'}),
      a,
      'constructors return existing instances for duplicate `id`s'
    );

    assert.notStrictEqual(
      new this.TestCustomIdAttr({foo: 'y'}),
      a,
      'constructors return new instances for new `id`s'
    );
  });

  it('return an updated existing instance if a duplicate `id` and new attributes are given', function () {
    var a = new this.Test({id: 1});
    var b = new this.Test({id: 1, foo: 'bar'});

    assert.strictEqual(
      a,
      b,
      'constructors return existing instances for duplicate `id`s'
    );

    assert.strictEqual(
      a.get('foo'),
      'bar',
      'subsequent duplicate instances update all other instances'
    );
  });

  it('store an instance when a new instance gains an `id` that did not exist', function () {
    var a = new this.Test();

    a.set({id: 4});

    assert.strictEqual(
      this.Test._cache['4'],
      a,
      'an instance is cached when it gains an `id`'
    );
  });

  it('throw an error when an instance gains an `idAttribute` attribute value which already exists', function () {
    new this.Test({id: 5});
    var b = new this.Test();

    assert.throws(function () {
      b.set({id: 5});
    }, Error, 'an error is thrown when an instance gains a duplicate `id`');
  });

  it('store an instance when a new instance with a custom `idAttribute` gains an `idAttribute` attribute value that did not exist', function () {
    var a = new this.TestCustomIdAttr();

    a.set({foo: 'x'});

    assert.strictEqual(
      this.TestCustomIdAttr._cache.x,
      a,
      'an instance is cached when it gains a custom `idAttribute` value'
    );
  });

  it('throw an error when a new instance with a custom `idAttribute` to gain an `idAttribute` attribute value that already exists', function () {
    new this.TestCustomIdAttr({foo: 'x'});
    var b = new this.TestCustomIdAttr();

    assert.throws(
      function () {
        b.set({foo: 'x'});
      },
      Error,
      'an error is thrown when an instance gains a duplicate custom `idAttribute` value'
    );
  });

  it('work when used as the `model` for a `Backbone.Collection`', function () {
    var collection = new this.TestCollection([
      {foo: 'boo'}
    ]);

    var model = collection.first();

    assert.strictEqual(
      model.constructor,
      this.Test,
      'models constructed through a collection have the correct constructor'
    );

    assert.strictEqual(
      model.methodOnTest,
      this.Test.prototype.methodOnTest,
      'models constructed through a collection have inherited methods'
    );
  });

  it('are able to be fetched from the server (#5)', function () {
    var collection = new this.TestCollection();

    collection.fetch();

    assert.strictEqual(
      collection.length,
      2,
      'models were fetched from the server'
    );

    assert.strictEqual(
      collection.at(0).get('foo'),
      'test1',
      'the models look as expected'
    );
  });

  it('generate instances which can `wipe` themselves from cache', function () {
    var a = new this.Test({id: 1});

    assert.strictEqual(
      typeof a.wipe,
      'function',
      '`wipe` should be a method'
    );

    a.wipe();

    assert.notStrictEqual(
      new this.Test({id: 1}),
      a,
      'newly created instances with previously existing `id`s are not equal to previously cached instances'
    );
  });

  it('can `wipe` an instance or instances depending on arguments', function () {
    var a = new this.Test({id: 1});
    var b = new this.Test({id: 2});
    var c = new this.Test({id: 3});
    var d = new this.Test({id: 6});
    var e = new this.Test({id: 7});

    var x = new this.TestCollection([
      {id: 4},
      {id: 5}
    ]);

    var strOfKeys = _.bind(function () {
      return _.sortBy(_.keys(this.Test._cache), _.identity).join('');
    }, this);

    assert.strictEqual(typeof this.Test.wipe, 'function');
    assert.strictEqual(strOfKeys(), '1234567', 'should have all instances cached');

    this.Test.wipe(a);
    assert.strictEqual(strOfKeys(), '234567', '1 should have been wiped');

    this.Test.wipe([b, c]);
    assert.strictEqual(strOfKeys(), '4567', '2 and 3 should have been wiped');

    this.Test.wipe(x);
    assert.strictEqual(strOfKeys(), '67', '4 and 5 should have been wiped');

    this.Test.wipe();
    assert.strictEqual(strOfKeys(), '', 'cache should be empty');
  });

  it('triggers events on the instance and constructor when an instance `wipe`s itself', function () {
    var Test = this.Test;
    var a = new Test({id: 1});
    var aSpy = this.sinon.spy();
    var wipeSpy = this.sinon.spy();
    var someSpy = this.sinon.spy();
    var allSpy = this.sinon.spy();

    var spyArgsAssertions = function(args) {

      assert.strictEqual(
        args[0],
        Test,
        'the spy was called with the constructor first'
      );

      assert.strictEqual(
        args[1].length,
        1,
        'the spy was called with an array of wiped instances second'
      );

      assert.strictEqual(
        args[1][0],
        a,
        'the array contained only the instance wiped'
      );

      assert.strictEqual(
        args[2].length,
        0,
        'the spy was called with an array of remaining instances, which was empty'
      );
    };

    Test.on('wipe', wipeSpy);
    Test.on('wipe:some', someSpy);
    Test.on('wipe:all', allSpy);

    a.on('wipe', aSpy);
    a.wipe();

    assert.notStrictEqual(
      Test._cache['1'],
      a,
      'the wiped instance should no longer be in cache'
    );

    assert(
      aSpy.calledOnce,
      'the wiped instance triggered a "wipe" event'
    );

    assert(
      aSpy.getCall(0).calledWithExactly(a),
      'the callback was called with the instance'
    );

    assert(
      wipeSpy.calledOnce,
      'the "wipe" event was triggered once'
    );

    spyArgsAssertions(wipeSpy.getCall(0).args);

    assert(
      !someSpy.called,
      'the "wipe:some" spy was not called'
    );

    assert(
      allSpy.calledOnce,
      'the "wipe:all" spy was called once'
    );

    spyArgsAssertions(allSpy.getCall(0).args);
  });

  it('triggers events on the instance and constructor when the constructor `wipe`s itself', function () {
    var Test = this.Test;
    var a = new Test({id: 1});
    var b = new Test({id: 2});
    var aSpy = this.sinon.spy();
    var bSpy = this.sinon.spy();
    var wipeSpy = this.sinon.spy();
    var someSpy = this.sinon.spy();
    var allSpy = this.sinon.spy();

    var spyArgsAssertions = function(args) {

      assert.strictEqual(
        args[0],
        Test,
        'the spy was called with the constructor first'
      );

      assert.strictEqual(
        args[1].length,
        1,
        'the spy was called with an array of wiped instances second'
      );

      assert.strictEqual(
        args[1][0],
        b,
        'the array contained only the instance wiped'
      );

      assert.strictEqual(
        args[2].length,
        1,
        'the spy was called with an array of remaining instances'
      );

      assert.strictEqual(
        args[2][0],
        a,
        'the array contained only the instance NOT wiped'
      );
    };

    Test.on('wipe', wipeSpy);
    Test.on('wipe:some', someSpy);
    Test.on('wipe:all', allSpy);

    a.on('wipe', aSpy);
    b.on('wipe', bSpy);
    b.wipe();

    assert.notStrictEqual(
      Test._cache['2'],
      b,
      'the wiped instance should no longer be in cache'
    );

    assert(
      !aSpy.called,
      'the remaining instance triggered no event'
    );

    assert(
      bSpy.calledOnce,
      'the wiped instance triggered a "wipe" event'
    );

    assert(
      bSpy.getCall(0).calledWithExactly(b),
      'the callback was called with the instance'
    );

    assert(
      wipeSpy.calledOnce,
      'the "wipe" event was triggered once'
    );

    spyArgsAssertions(wipeSpy.getCall(0).args);

    assert(
      !allSpy.called,
      'the "wipe:all" spy was not called'
    );

    assert(
      someSpy.calledOnce,
      'the "wipe:some" spy was called once'
    );

    spyArgsAssertions(someSpy.getCall(0).args);
  });
});
