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

        function validateNestedValue(attrValue, attrName) {
            attrValue.validate();
            var isValid = attrValue.isValid();
            return isValid ? null : (attrName + ' is invalid');
        }

        function updateValidation(model) {
            var oldValidation = model.validation;
            var allKeys = _.uniq(model.keys().concat(_.keys(oldValidation)));
            var validation = _.extend({}, oldValidation);
            var found;
            var f = function(value) {
                if (value === validateNestedValue) {
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
                        validators.push(validateNestedValue);
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
                    if (originalMethod) {
                        return originalMethod.apply(this, arguments);
                    } else {
                        return modelClass.__super__[methodName].apply(this, arguments);
                    }
                } finally {
                    this.validation = oldValidation;
                }
            };
        }

        function wrapSetFunction(modelClass) {
            var originalMethod = modelClass.prototype.set;
            modelClass.prototype.set = function(key, val, options) {
                var attr, attrs, curVal, nestedOptions, newVal;
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
                if (originalMethod) {
                    return originalMethod.call(this, attrs, options);
                } else {
                    return modelClass.__super__.set.call(this, attrs, options);
                }
            };
        }

        function wrapToJSONFunction(modelClass) {
            var originalMethod = modelClass.prototype.toJSON;
            modelClass.prototype.toJSON = function(options) {
                var result;
                if (originalMethod) {
                    result = originalMethod.apply(this, arguments);
                } else {
                    result = modelClass.__super__.toJSON.apply(this, arguments);
                }
                if (options && options.deep) {
                    _.each(result, function(value, key) {
                        if (value instanceof Backbone.Model) {
                            result[key] = value.toJSON(options);
                        }
                    });
                }
                return result;
            };
        }

        var NestedModels = {
            validateNestedValue: validateNestedValue,

            wrapSetFunction: wrapSetFunction,
            wrapToJSONFunction: wrapToJSONFunction,
            wrapValidationFunction: wrapValidationFunction,

            mixin: function(modelClass) {
                wrapSetFunction(modelClass);
                wrapToJSONFunction(modelClass);
                wrapValidationFunction(modelClass, 'isValid');
                wrapValidationFunction(modelClass, 'validate');
                wrapValidationFunction(modelClass, 'preValidate');
                return modelClass;
            },
        };

        return NestedModels;

    }
);
