/**
 * mod-validator
 *
 * @author  Joy <anzhengchao@gmail.com>
 * @link    https://github.com/joychao/mod-validator
 * @version 0.0.6
 * @license MIT
 */

/**
 * mod-validator
 *
 * @param {Object} data          
 * @param {Object} validateRules
 * @param {Object} messages
 *
 * @return {Void}
 */
(function(data, validateRules, messages){

  /**
   * numeric rules  
   *
   * @type {Array}
   */
  var numericRules = ['Numeric', 'Integer'];

  /**
   * messages
   */
  var messages = {
        accepted         : "The :attribute must be accepted.",
        alpha            : "The :attribute may only contain letters.",
        alpha_dash       : "The :attribute may only contain letters, numbers, and dashes.",
        alpha_num        : "The :attribute may only contain letters and numbers.",
        array            : "The :attribute must be an array.",
        between          : {
           numeric : "The :attribute must be between :min and :max.",
           string  : "The :attribute must be between :min and :max characters.",
           array   : "The :attribute must have between :min and :max items.",
        },
        confirmed        : "The :attribute confirmation does not match.",
        different        : "The :attribute and :other must be different.",
        digits           : "The :attribute must be :digits digits.",
        digits_between   : "The :attribute must be between :min and :max digits.",
        email           : "The :attribute format is invalid.",
        "in"               : "The selected :attribute is invalid.",
        integer          : "The :attribute must be an integer.",
        ip               : "The :attribute must be a valid IP address.",
        max              : {
          numeric : "The :attribute may not be greater than :max.",
          string  : "The :attribute may not be greater than :max characters.",
          array   : "The :attribute may not have more than :max items.",
        },
        mimes            : "The :attribute must be a file of type: :values.",
        min              : {
          numeric : "The :attribute must be at least :min.",
          string  : "The :attribute must be at least :min characters.",
          array   : "The :attribute must have at least :min items.",
        },
        not_in           : "The selected :attribute is invalid.",
        numeric          : "The :attribute must be a number.",
        regex            : "The :attribute format is invalid.",
        required         : "The :attribute field is required.",
        required_if      : "The :attribute field is required when :other is :value.",
        required_with    : "The :attribute field is required when :values is present.",
        required_without : "The :attribute field is required when :values is not present.",
        same             : "The :attribute and :other must match.",
        size             : {
          numeric : "The :attribute must be :size.",
          string  : "The :attribute must be :size characters.",
          array   : "The :attribute must contain :size items.",
        },
        url              : "The :attribute format is invalid.",
        def              : 'The :attribute attribute has errors.',

      // attribute alias 
      attributes : {},
        
      // attribute value alias
      values : {},

  };

  // Based on jquery's extend function
  function extend() {
    var src, copy, name, options, clone;
    var target = arguments[0] || {};
    var i = 1;
    var length = arguments.length;

    for ( ; i < length; i++ ) {
      // Only deal with non-null/undefined values
      if ( (options = arguments[ i ]) != null ) {
        // Extend the base object
        for ( name in options ) {
          src = target[ name ];
          copy = options[ name ];

          // Prevent never-ending loop
          if ( target === copy ) {
            continue;
          }

          // Recurse if we're merging plain objects or arrays
          if ( copy && typeof copy === "object" ) {
            clone = src && typeof src === "object" ? src : {};

            // Never move original objects, clone them
            target[ name ] = extend( clone, copy );

          // Don't bring in undefined values
          } else if ( copy !== undefined ) {
            target[ name ] = copy;
          }
        }
      }
    }

    // Return the modified object
    return target;
  }

  //php function:in_array
  function in_array(needle, haystack, argStrict) {
    var key = '',
        strict = !! argStrict;

      for (key in haystack) {
        if (strict ? (haystack[key] === needle) : haystack[key] == needle) {
          return true;
        }
      }

      return false;
  }

  var Validator = function(data, rules, customMessages) {
    this.data       = data;
    this.rules      = rules;
    this.messages   = extend({}, messages, customMessages || {});
    this.errors     = {};
    this.attributes = {};
    this.values     = {};
    this.replacers  = {};
    this.translator = {
      trans: function(key){
        return key;
      }
    };
  };

  Validator.prototype = {
    constructor: Validator,

    /**
     * exec validate
     *
     * @return {Boolean} 
     */
    passes: function() {
      rulesArray = this._explodeRules(this.rules);

      for (var attribute in rulesArray) {
         var rules = rulesArray[attribute];
        for (var i in rules) {
          var rule        = rules[i];
          var parsedRule  = this._parseRule(rule);
          var resover     = parsedRule.rule;
          var parameters  = parsedRule.parameters;
          var value       = this.data[attribute] || null;
          var validatable = this.resolvers[resover] == 'function';

          if (validatable && !this.resolvers[resover].call(this, attribute, value, parameters)) {
            this._addFailure(attribute, rule, parameters);
          }
        }
      }

      return !this.errors.length;
    },

    /**
     * return the validate value
     *
     * @return {Boolean} 
     */
    fails: function() {
      return !this.passes();
    },

    /**
     * add custom messages
     *
     * @param {String/Object} rule
     * @param {String}        message
     *
     * @return {Void}
     */
    mergeMessage: function(rule, message) {
      if (typeof rule === 'object') {
        this.messages = extend({}, this.messages, rule);
      } else if (typeof rule === 'string') {
        this.messages[rule] = message;
      } 
    },

    /**
     * add attributes alias
     *
     * @param {String/Object} attribute
     * @param {String}        alias 
     *
     * @return {Void}
     */
    mergeAttributes: function(attribute, alias) {
      if (typeof attribute === 'object') {
        this.attributes = extend({}, this.attributes, attribute);
      } else if (typeof rule === 'string') {
        this.attributes[attribute] = alias;
      } 
    },

    /**
     * add values alias
     *
     * @param {String/Object} attribute
     * @param {String}        alias 
     *
     * @return {Void}
     */
    mergeValues: function(value, alias) {
      if (typeof value === 'object') {
        this.values = extend({}, this.values, value);
      } else if (typeof rule === 'string') {
        this.values[value] = alias;
      } 
    },

    /**
     * add message replacers
     *
     * @param {String/Object} rule
     * @param {Function}      fn
     * 
     * @return {Void} 
     */
    mergeReplacers: function(rule, fn) {
      if (typeof rule === 'object') {
        this.replacers = extend({}, this.replacers, rule);
      } else if (typeof rule === 'string') {
        this.replacers[rule] = fn;
      } 
    },

    /**
     * explode the rules into an array of rules.
     *
     * @return {Void} 
     */
    _explodeRules: function(rules) {
      for (var i in rules) {
        if (typeof rules[i] == 'string') {
          rules[i] = rules[i].split('|');
        }
      }

      return rules;
    },

    /**
     * parse the rule
     *
     * @param {Array} rule 
     *
     * @return {Object} 
     */
    _parseRule: function (rule) {
      var parameters = [];

      // The format for specifying validation rules and parameters follows an
      // easy {rule}:{parameters} formatting convention. For instance the
      // rule "Max:3" states that the value may only be three letters.
      if (rule.indexOf(':')) {
        ruleInfo  = rule.split(':');
        rule      = ruleInfo[0];
        parameter = ruleInfo[1];

        parameters = this._parseParameters(rule, parameter);
      }

      return { parameters: parameters, rule: rule};
    },

    /**
     * parse parameters of rule
     *
     * @param {String} rule      
     * @param {String} parameter
     *
     * @return {Array} 
     */
    _parseParameters: function(rule, parameter) {
      if (rule.toLowerCase() == 'regex') return [parameter];
      if (typeof parameter === 'string') {
        return parameter.split(',');
      };

      return [];
    },

    /**
     * add a failure rule
     *
     * @param {String} attribute  
     * @param {String} rule       
     * @param {Array}  parameters 
     *
     * @return {Void}
     */
    _addFailure: function(attribute, rule, parameters) {
      _addError(attribute, rule, parameters);
      result.failedRules[attribute] || (result.failedRules[attribute] = {});
      result.failedRules[attribute][rule] = parameters;
    },

    /**
     * add a error message
     *
     * @param {String} attribute  
     * @param {String} rule       
     * @param {Array}  parameters 
     *
     * @return {Void}
     */
    _addError: function(attribute, rule, parameters) {
      message = this._getMessage(attribute, rule);

      message = this._doReplacements(message, attribute, rule, parameters);
      //message = attribute + ' error';
      var msg = {};
          msg[attribute] = message;

      result.messages.push(msg);
    },

    /**
     * get value of arrtibute
     *
     * @param {String} attribute 
     *
     * @return {Mixed} 
     */
    _getValue: function(attribute) {
      return this.data[attribute];
    },

    /**
     * get attribute message
     *
     * @param {String} attribute 
     * @param {String} rule      
     *
     * @return {String} 
     */
    _getMessage: function(attribute, rule) {
      return this.messages[rule];
    },

    /**
     * replace attributes in mesage 
     *
     * @param {String} message    
     * @param {String} attribute  
     * @param {String} rule       
     * @param {Array}  parameters 
     *
     * @return {String}
     */
    _doReplacements: function(message, attribute, rule, parameters) {
      message = message.replace(':attribute', this._getAttribute(attribute))
      if (typeof this.replacers[rule] === 'function') {
        message = this.replacers[rule](message, attribute, rule, parameters);
      } 

      return message;
    },

    _getAttribute: function(attribute) {
      if (typeof attributes[attribute] == 'string') {
        return attributes[attribute];
      }

      if ((line = this.translator.trans(attribute)) !== attribute) {
        return line;
      } else {
        return attribute.replace('_', ' ');
      }
    },


    resolvers : {

      /**
       * determine if the given attribute has a rule in the given set.
       *
       * @param {String}       attribute
       * @param {String|array} rules
       * 
       * @return {Boolean}
       */
      _hasRule: function(attribute, rules) {
        return ! this._getRule(attribute, rules) == null;
      },

      /**
       * get rule and parameters of a rules
       *
       * @param {String}       attribute
       * @param {String|array} rules
       * 
       * @return {Array|null}
       */
      _getRule: function(attribute, rules) {
        rules = rules || [];

        if ( ! rules[attribute]) {
          return;
        }

        for(var i in rules[attribute]) {
          var value = rules[attribute][i];
          parsedRule = this._parseRule(rule);

          if (in_array(parsedRule.rule, rules)) 
            return [parsedRule.rule, parsedRule.parameters];
        }
      },

      /**
       * get attribute size
       *
       * @param {String}  attribute
       * @param {Mixed}   value
       * 
       * @return {Number}
       */
      _getSize: function(attribute, value) {
        hasNumeric = this._hasRule(attribute, numericRules);

        // This method will determine if the attribute is a number, string, or file and
        // return the proper size accordingly. If it is a number, then number itself
        // is the size. If it is a file, we take kilobytes, and for a string the
        // entire length of the string will be considered the attribute size.
        if (/^[0-9]+$/.test(value) && hasNumeric) {
          return this.getValue(attribute);
        } else if (typeof value === 'array' || typeof value === 'string') {
          return value.length;
        } 

        return 0;
      },

      /**
       * check parameters count 
       *
       * @param {Number} count      
       * @param {Array}  parameters 
       * @param {String} rule
       *
       * @return {Void}
       */
      _requireParameterCount: function(count, parameters, rule) {
        if (parameters.length < count) {
          throw Error('Validation rule"' + rule + '" requires at least ' + count + ' parameters.');
        }
      },

      /**
       * all failing check
       *
       * @param {Array} attributes
       * 
       * @return {Boolean}
       */
      _allFailingRequired: function(attributes) {
        for (var i in attributes) {
          var akey = attributes[i];

          if (this.validateRequired(key, this._getValue(key))) {
            return false;
          }
        }

        return true;
      },

      /**
       * determine if any of the given attributes fail the required test.
       *
       * @param  array  $attributes
       * @return bool
       */
      _anyFailingRequired: function(attributes) {
        for (var i in attributes) {
          var key = attributes[i];
          if ( ! this.validateRequired(key, this.date[key])) {
            return true;
          }
        }

        return false;
      },

      accepted: function(attribute, value) {
        var acceptable = ['yes', 'on', '1', 1, true, 'true'];

        return (validateRequired(attribute, value) && in_array(value, acceptable, true));
      },

      alpha: function(attribute, value) {
        return ((new RegExp('^[a-z]+$', 'i')).test(value));
      },
      
      alpha_dash: function(attribute, value) {
        return ((new RegExp('^[a-z0-9\-_]+$', 'i')).test(value));
      },
      
      alpha_num: function(attribute, value) {
        return ((new RegExp('^[a-z0-9]+$', 'i')).test(value));
      },
      
      array: function(attribute, value) {
        return typeof value === 'array';
      },
      
      between: function(attribute, value, parameters) {
        this._requireParameterCount(2, parameters, 'between');

        var size = this._getSize(attribute, value);

        return size >= parameters[0] && size <= parameters[1];
      },
      
      confirmed: function(attribute, value, parameters) {
        return validateSame(attribute, value, [attribute + '_confirmation']);
      },

      same: function(attribute, value, parameters) {
        this._requireParameterCount(1, parameters, 'same');

        var other = this.getValue(parameters[0]);

        return (other && value == other);
      },

      different: function(attribute, value, parameters) {
        return ! validateSame(attribute, value, parameters);
      },
      
      digits: function(attribute, value, parameters) {
        this._requireParameterCount(1, parameters, 'digits');

        return (new RegExp('^\d{' + Math.abs(parameters[0]) + '}$')).test(value);
      },
      
      digits_between: function(attribute, value, parameters) {
        this._requireParameterCount(2, parameters, 'digits_between');
        
        return ((new RegExp('^\d{' + Math.abs(parameters[0]) + '}$')).test(value) 
                  && value > parameters[0] 
                  && value < parameters[1]);
      },
      
      email: function(attribute, value) {
        var regex = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i;

        return regex.test(value);
      },

      "in": function(attribute, value, parameters) {
        return in_array(value || '', parameters);
      },

      not_in: function(attribute, value, parameters) {
        return !in_array(value || '', parameters);
      },

      integer: function(attribute, value) {
        return /^(?:-?(?:0|[1-9][0-9]*))$/.test(value);
      },
    
      ip: function(attribute, value) {
        var ipv4Maybe = /^(\d?\d?\d)\.(\d?\d?\d)\.(\d?\d?\d)\.(\d?\d?\d)$/
            , ipv6 = /^::|^::1|^([a-fA-F0-9]{1,4}::?){1,7}([a-fA-F0-9]{1,4})$/;
        return ipv4Maybe.test(value) || ipv6.test(value);
      },

      max: function(attribute, value, parameters) {
        this._requireParameterCount(1, parameters, 'max');

        return this._getSize(attribute, value) <= parameters[0];
      },

      min: function(attribute, value, parameters) {
        this._requireParameterCount(1, parameters, 'min');

        return this._getSize(attribute, value) >= parameters[0];
      },
     
      numeric: function(attribute, value) {
        return /^[0-9]+$/.test(value);
      },
     
      regex: function(attribute, value, parameters) {
        this._requireParameterCount(1, parameters, 'regex');

        return (new RegExp(parameters[0])).test(value);
      },
      
      required: function(attribute, value) {
        if (typeof value == undefined) {
          return false;
        } else if ((typeof value == 'string' || typeof value == 'array' || typeof value == 'object') && !value.length) {
          return false;
        } 

        return true;
      },

      required_if: function(attribute, value, parameters) {
        this._requireParameterCount(2, parameters, 'required_if');

        var data = this.getValue(parameters[0]);

        var values = parameters.splice(1);

        if (in_array(data, values)) {
          return this.validateRequired(attribute, value);
        }

        return true;
      },
      
      required_with: function(attribute, value, parameters) {
        if ( ! this._allFailingRequired(parameters)) {
          return this.validateRequired(attribute, value);
        }

        return true;
      },
     
      required_without: function(attribute, value, parameters) {
        if (anyFailingRequired(parameters)) {
          return this.validateRequired(attribute, value);
        }

        return true;
      },
      
      size: function(attribute, value, parameters) {
        this._requireParameterCount(1, parameters, 'size');

        return this._getSize(attribute, value) == parameters[0];
      },
      
      url: function(attribute, value) {
        var strRegex = "^((https|http|ftp|rtsp|mms)?://)" 
                + "?(([0-9a-z_!~*'().&=+$%-]+: )?[0-9a-z_!~*'().&=+$%-]+@)?" //ftp user@
                + "(([0-9]{1,3}/.){3}[0-9]{1,3}" // IP- 199.194.52.184 
                + "|" // ip or domain
                + "([0-9a-z_!~*'()-]+/.)*" // domain- www. 
                + "([0-9a-z][0-9a-z-]{0,61})?[0-9a-z]/." // sub domain 
                + "[a-z]{2,6})" // first level domain- .com or .museum 
                + "(:[0-9]{1,4})?" // port- :80 
                + "((/?)|" // a slash isn't required if there is no file name 
                + "(/[0-9a-z_!~*'().;?:@&=+$,%#-]+)+/?)$"; 
                var regex = new RegExp(strRegex); 
        
                return regex.test(str_url);
      }
    }
  };

  // register new resolver
  Validator.register = function(rule, fn, errMsg) {
    this.prototype.resolvers[rule] = fn;
    messages[rule] = (typeof errMsg === 'string') ? errMsg : messages['def'];
  };
  // validator.make(data,rules,messages);
  Validator.make = Validator.constructor;

  if (typeof module !== 'undefined' && typeof require !== 'undefined') {
    module.exports = Validator;
  } else {
    window.validator = Validator;
  }

}());