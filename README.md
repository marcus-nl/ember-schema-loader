# ember-schema-loader

Loader for an Ember Schema generated by https://github.com/marcus-nl/ember-schema-generator.

## License

Apache 2.0: http://www.apache.org/licenses/LICENSE-2.0

## Usage

In your application's init function:
```js
var app = this;
app.deferReadiness();

$.ajax({ 
  url: 'http://localhost:8080/ember-schema'
}).then(function(schema) {
  var schemaLoader = SchemaLoader.create({ target: app, container: app });
  schemaLoader.load(schema);
  app.advanceReadiness();
});
this._super();
```
