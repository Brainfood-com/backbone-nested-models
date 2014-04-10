define(
    [
        'underscore',
        'backbone',
        'backbone-validation',
    ],
    function(
        _,
        Backbone
    ) {
        'use strict';

        function extractNestedErrors(errors) {
            var result = {};
            for (var key in errors) {
                var value = errors[key];
                if (value.errors) {
                    value = extractNestedErrors(value.errors);
                }
                result[key] = value;
            }
            return result;
        }

        function validateNestedValue(attrValue, attrName) {
            var errors = attrValue.validate();
            var isValid = attrValue.isValid();
            if (isValid) {
                return null;
            }
            var r = {};
            r.toString = function() {
                return attrName + ' is invalid';
            };
            r.errors = errors;
            return r;
        }

        function updateValidation(model) {
            var oldValidation = model.validation;
            var allKeys = _.uniq(model.keys().concat(_.keys(oldValidation)));
            var validation = _.extend({}, oldValidation);
            var found;
            var f = function(value) {
                if (typeof value === 'object' && value.fn === validateNestedValue) {
                    found = true;
                }
            };
            for (var i = 0; i < allKeys.length; i++) {
                var key = allKeys[i];
                var value = model.get(key);
                var validators = validation[key];
                if (validators) {
                    if(_.isArray(validators)) {
                        validators = validators.concat();
                    } else {
                        validators = [validators];
                    }
                } else {
                    validators = [];
                }
                validation[key] = validators;
                if (value instanceof Backbone.Model) {
                    found = false;
                    _.each(validators, f);
                    if (!found) {
                        validators.push({fn: validateNestedValue});
                    }
                }
            }
            model.validation = validation;
            return oldValidation;
        }

        function wrapValidationFunction(modelClass, methodName) {
            var originalMethod = modelClass.prototype[methodName];
            modelClass.prototype[methodName] = function() {
                var oldValidation = updateValidation(this);
                try {
                    return originalMethod.apply(this, arguments);
                } finally {
                    this.validation = oldValidation;
                }
            };
            return modelClass;
        }

        function wrapSetFunction(modelClass) {
            var originalMethod = modelClass.prototype.set;
            modelClass.prototype.set = function(key, val, options) {
                var attr, attrs, curVal, nestedOptions, newVal;
                if (typeof(key) === 'undefined') {
                    return this;
                }
                if (key === null) {
                    return this;
                }

                if (typeof key === 'object') {
                    attrs = key;
                    options = val;
                } else {
                    (attrs = {})[key] = val;
                }
                if (options && options.merge) {
                    nestedOptions = {silent: false, merge: true};
                    for (attr in attrs) {
                        curVal = this.get(attr);
                        newVal = attrs[attr];
                        if (curVal instanceof Backbone.Model && newVal instanceof Backbone.Model)  {
                            delete attrs[attr];
                            curVal.set(newVal.attributes, nestedOptions);
                        }
                    }
                }
                return originalMethod.call(this, attrs, options);
            };
            return modelClass;
        }

        function wrapToJSONFunction(modelClass) {
            var originalMethod = modelClass.prototype.toJSON;
            modelClass.prototype.toJSON = function(options) {
                var result = originalMethod.apply(this, arguments);
                if (options && options.deep) {
                    _.each(result, function(value, key) {
                        if (value instanceof Backbone.Model) {
                            result[key] = value.toJSON(options);
                        }
                    });
                }
                return result;
            };
            return modelClass;
        }

        var NestedModels = {
            extractNestedErrors: extractNestedErrors,
            validateNestedValue: validateNestedValue,

            wrapSetFunction: wrapSetFunction,
            wrapToJSONFunction: wrapToJSONFunction,
            wrapValidationFunction: wrapValidationFunction,

            wrapValidationFunctions: function(modelClass) {
                modelClass = wrapValidationFunction(modelClass, 'isValid');
                modelClass = wrapValidationFunction(modelClass, 'validate');
                modelClass = wrapValidationFunction(modelClass, 'preValidate');
                return modelClass;
            },

            mixin: function(modelClass) {
                modelClass = NestedModels.wrapSetFunction(modelClass);
                modelClass = NestedModels.wrapToJSONFunction(modelClass);
                modelClass = NestedModels.wrapValidationFunctions(modelClass);
                return modelClass;
            },
        };

        return NestedModels;

    }
);
