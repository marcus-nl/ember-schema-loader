var SchemaLoader;

(function() {
  var STATE_NEW =      'new';
  var STATE_CREATING = 'creating';
  var STATE_DONE =     'done';
  
  var KIND_ONE =       'one';
  var KIND_MANY =      'many';

  var MODE_NORMAL =    'normal';
  var MODE_FRAGMENT =  'fragment';

  SchemaLoader = Ember.Object.extend({
  
    target: null,
    
    container: null,
    
    index: Ember.Map.create(),
    
    /**
     * @method init
     */
    init: function() {
      this._super();
      this.target = this.target || this;
    },
  
    /**
     * @method load
     */
    load: function(schema) {
      var loader = this;
      
      var classes = schema.EmberSchema.classes;
      classes.forEach(function(def) {
        def.state = STATE_NEW;
        def.mode = loader.getClassMode(def);
        loader.index.set(def.name, def);
      });
      
      this.index.forEach(function(name, def) {
        loader.registerClass(def);
      });
    },
    
    /** 
     * @private
     * @method getClass 
     **/
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
  
    /** 
     * @private
     * @method registerClass 
     **/
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
  
      printClass(cls);
      def.state = STATE_DONE;
    },
    
    /** 
     * @private
     * @method createClass 
     **/
    createClass: function(def) {
      var loader = this;
      var props = {
        '$type': DS.attr('string'),
      };
      def.props.forEach(function(prop) {
        if (loader.includeProperty(def, prop)) {
          props[prop.name] = loader.createProperty(def, prop);
        }
      });
  
      var baseType = loader.getBaseClass(def);
      return baseType.extend(props);
    },
    
    /** 
     * @private
     * @method getBaseClass 
     **/
    getBaseClass: function(def) {
      var loader = this;

      if (def.superType) {
        var superType = loader.getClass(def.superType);
        Ember.assert('Super type "' + def.superType + '" does not exist', superType);
        
        return superType;
      }
      
      if (def.mode == 'fragment') {
        return DS.ModelFragment;
      }
      else {
        return DS.Model;
      }
    },
    
    /** 
     * @protected
     * @method includeProperty 
     **/
    getClassMode: function(def) {
      return MODE_NORMAL;
    },
    
    /** 
     * @protected
     * @method includeProperty 
     **/
    includeProperty: function(owner, prop) {
      return prop.name != 'id';
    },
  
    /** 
     * @private
     * @method createProperty 
     **/
    createProperty: function(owner, prop) {
      if (prop.type.kind == 'attr') {
        return this.createAttributeProperty(owner, prop);
      }
      var typeDef = this.index.get(prop.type.name);
      if (typeDef.mode == MODE_FRAGMENT) {
        return this.createFragmentProperty(owner, prop);
      }
      else if (typeDef.mode == MODE_NORMAL) {
        return this.createDefaultProperty(owner, prop);
      }
      else {
        throw 'unsupported: ' + typeDef.mode;
      }
    },
    
    createAttributeProperty: function(owner, prop) {
      return DS.attr(prop.type.name);
    },
    
    createDefaultProperty: function(owner, prop) {
      var opts = {}; // polymorphic: true, typeKey: '$type' };
      switch (prop.type.kind) {
        case KIND_ONE:  return DS.belongsTo(prop.type.name, opts);
        case KIND_MANY: return DS.hasMany(prop.type.name, opts);
        default:        throw 'unsupported: ' + prop.type.kind;
      }
    },
    
    createFragmentProperty: function(owner, prop) {
      var opts = { polymorphic: true, typeKey: '$type' };
      switch (prop.type.kind) {
        case KIND_ONE:  return DS.hasOneFragment(prop.type.name, opts);
        case KIND_MANY: return DS.hasManyFragments(prop.type.name, opts);
        default:        throw 'unsupported: ' + prop.type.kind;
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
