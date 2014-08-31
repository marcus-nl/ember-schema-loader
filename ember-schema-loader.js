var SchemaLoader;

(function() {
  var STATE_NEW =      'new';
  var STATE_CREATING = 'creating';
  var STATE_DONE =     'done';

  SchemaLoader = Ember.Object.extend({
  
    target: null,
    
    container: null,
    
    index: Ember.Map.create(),
    
    init: function() {
      this._super();
      this.target = this.target || this;
    },
  
    load: function(schema) {
      var loader = this;
      
      var classes = schema.EmberSchema.classes;
      classes.forEach(function(def) {
        def.state = STATE_NEW;
        loader.index.set(def.name, def);
      });
      
      this.index.forEach(function(name, def) {
        loader.registerClass(def);
      });
    },
    
    getClass: function(name) {
      if (!this.target[name]) {
        var def = this.index.get(name); 
        Ember.assert("Class not found: " + name, def);
        
        this.registerClass(def);
      }
      
      var result = this.target[name];
      Ember.assert("Class not found: " + name, result);
      return result;
    },
  
    registerClass: function(def) {
      Ember.assert("Circular dependency: " + name, def.state != STATE_CREATING);
      if (def.state == STATE_DONE) return;

      def.state = STATE_CREATING;

      var cls = this.createClass(def); 
      this.target[def.name] = cls;
      
      if (this.container) {
        var alias = def.alias || def.name;
        this.container.register('model:' + alias, cls);
      }
  
//      printClass(cls);
      def.state = STATE_DONE;
    },
    
    createClass: function(def) {
      var loader = this;
      var props = {
          '$type': DS.attr('string'),
      };
      def.props.forEach(function(prop) {
        if (loader.includeProperty(def, prop)) {
          props[prop.name] = loader.createProperty(prop.type);
        }
      });
  
      var baseType = loader.getBaseClass(def);
      return baseType.extend(props);
    },
    
    getBaseClass: function(def) {
      var loader = this;

      if (def.name == 'Spec') {
        return DS.Model;
      }
      if (def.superType) {
        var superType = loader.getClass(def.superType);
        Ember.assert('Super type "' + def.superType + '" does not exist', superType);
        
        return superType;
      }
      return DS.ModelFragment;
    },
    
    includeProperty: function(def, prop) {
      return prop.name != 'id';
    },
  
    createProperty: function(type) {
      var opts = { polymorphic: true, typeKey: '$type' };
      switch (type.kind) {
        case 'attr': return DS.attr(type.name);
        case 'one':  return DS.hasOneFragment(type.name, opts);
        case 'many': return DS.hasManyFragments(type.name, opts);
        default:     throw 'unsupported: ' + type.kind;
      }
    },
  });
  
  function printClass(c) {
    console.log(Ember.inspect(c));
    c.eachAttribute(function(n,a) {
      console.log('\t' + n + ':\t' + Ember.inspect(a));
    });
  }
})();
