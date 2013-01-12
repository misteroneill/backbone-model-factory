# Backbone.ModelFactory

Provides a factory for generating model constructors which will never produce multiple instances of a model with the same unique identifier.

When you create a new instance of a model created with `Backbone.ModelFactory` and give it an `id` it will never create duplicate instances of the same model with a given `id`.

    var user1 = new User({id: 1});
    var user2 = new User({id: 1});
    var user3 = new User({id: 2});

    console.log(user1 === user2); // true
    console.log(user3 === user1); // false

## Benefits

When architecting loosely-coupled web applications, it is generally considered a good practice for modules which control separate pieces of functionality to not rely on each other. `Backbone.ModelFactory` helps with that!

Views or modules can generate instances of any given object and those instances will always refer to the same object in memory. Using `Backbone.ModelFactory` models, you can eliminate the need to pass instances around manually - worse - maintain a manual cache of model instances.

Additionally, collections that `fetch` data will always be populated by existing model instances if they exist. This prevents creating multiple model instances which represent the same resource.

`Backbone.ModelFactory` makes sharing models between collections, views, or any other script/module almost completely hands-off.

## Inclusion

`Backbone.ModelFactory` supports three methods of inclusion.

1. Node:

        var Backbone = require('backbone-model-factory');

2. AMD/[RequireJS](http://requirejs.org):

        require(['backbone-model-factory'], function (Backbone) {
            // Do stuff...
        });

3. Browser Globals:

        <script src="path/to/backbone.js"></script>
        <script src="path/to/backbone-model-factory.js"></script>

## Usage

Rather than extending `Backbone.Model`, constructors are created by a call to `Backbone.ModelFactory`. Instead of this:

    var User = Backbone.Model.extend({
      defaults: {
        firstName: 'John',
        lastName: 'Doe'
      }
    });

...do this:

    var User = Backbone.ModelFactory({
        defaults: {
            firstName: 'John',
            lastName: 'Doe'
        }
    });

`Backbone.ModelFactory` also supports inheritance, so model constructors can extend each other by providing a model constructor as the first argument:

    var Admin = Backbone.ModelFactory(User, {
        defaults: {
            isAdmin: true
        }
    });

### Consequences of Extending Models

Models created with `Backbone.ModelFactory` will *not* share their unique-enforcement capabilities with models which they extend or which extend them. For example, using the `User` and `Admin` models above giving each the same ID would *not* result in the same object:

    var user = new User({id: 1});
    var admin = new Admin({id: 1});

    console.log(user === admin); // false

The ability to share instances between models in an inheritance chain is a feature which is actively being considered, but it leaves a lot of open questions.

## Tests

### Inclusion

There are 3 files in `/test/inclusion` and they account for the 3 supported methods of including this module. To execute these tests, simply open the HTML files in a browser or install the npm module `backbone` and run `node node-module.js`.

### Unit

[Mocha](http://visionmedia.github.com/mocha/) unit tests exist in `test/test.js`. To run, simply do `mocha` from the project root.

## Inspriation

This is inspired by SoundCloud's approach detailed in [Building the Next SoundCloud](http://backstage.soundcloud.com/2012/06/building-the-next-soundcloud/) under "Sharing Models between Views."
