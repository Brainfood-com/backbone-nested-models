define(function(require) {
    'use strict';

    var NestedModels = require('backbone-nested-models');
    var _ = require('underscore');
    var Backbone = require('backbone');
    require('backbone-validation');

    describe('NestedModels', function() {
        it('exists', function() {
            expect(NestedModels).toBeTruthy();
        });
    });
    describe('NestedModels', function() {
        var Top, TopWithMethods, Nested;
        beforeEach(function() {
            Nested = Backbone.Model.extend({
                defaults: {
                    address1: null,
                    countryGeoId: null,
                },
                validation: {
                    address1: [
                        {msg: 'ADDRESS1 is REQUIRED', required: true},
                    ],
                    countryGeoId: [
                        {msg: 'countryGeoId is not in the given set', oneOf: ['USA', 'CAN', 'RUS']},
                    ],
                },
            });
            Top = Backbone.Model.extend({
                defaults: function() {
                    return {
                        nested: new Nested(),
                        name: null,
                    };
                },
                validation: {
                    name: [
                        {msg: 'name IS required', required: true},
                    ],
                },
            });
            _.extend(Backbone.Model.prototype, Backbone.Validation.mixin);
            function incrCount(self, name) {
                if (!self.counts) {
                    self.counts = {};
                }
                if (!self.counts[name]) {
                    self.counts[name] = 0;
                }
                self.counts[name]++;
            }
            TopWithMethods = Backbone.Model.extend({
                defaults: function() {
                    return {
                        nested: new Nested(),
                        name: null,
                    };
                },
                validation: {
                    name: [
                        {msg: 'name IS required', required: true},
                    ],
                },
                set: function() {
                    incrCount(this, 'set');
                    return TopWithMethods.__super__.set.apply(this, arguments);
                },
                toJSON: function() {
                    incrCount(this, 'toJSON');
                    return TopWithMethods.__super__.toJSON.apply(this, arguments);
                },
                validate: function() {
                    incrCount(this, 'validate');
                    return TopWithMethods.__super__.validate.apply(this, arguments);
                },
                preValidate: function() {
                    incrCount(this, 'preValidate');
                    return TopWithMethods.__super__.preValidate.apply(this, arguments);
                },
                isValid: function() {
                    incrCount(this, 'isValid');
                    return TopWithMethods.__super__.isValid.apply(this, arguments);
                },
            });
        });
        function testSet(Top, checkCounts) {
            function extractCids(top) {
                return {
                    top: top.cid,
                    nested: top.get('nested').cid,
                };
            }

            var result, top;
            top = new Top();
            var cidsOriginal = extractCids(top);
            expect(cidsOriginal.top).not.toEqual(cidsOriginal.nested);
            if (checkCounts) {
                expect(top.counts).toEqual({set: 1});
            } else {
                expect(top.counts).toBeUndefined();
            }

            result = top.set();
            expect(result).toBe(top);
            var cidsNoargs = extractCids(top);
            expect(cidsOriginal.top).toEqual(cidsNoargs.top);
            expect(cidsOriginal.nested).toEqual(cidsNoargs.nested);
            if (checkCounts) {
                expect(top.counts).toEqual({set: 1});
            } else {
                expect(top.counts).toBeUndefined();
            }

            result = top.set(null);
            expect(result).toBe(top);
            var cidsNullkey = extractCids(top);
            expect(cidsOriginal.top).toEqual(cidsNullkey.top);
            expect(cidsOriginal.nested).toEqual(cidsNullkey.nested);
            if (checkCounts) {
                expect(top.counts).toEqual({set: 1});
            } else {
                expect(top.counts).toBeUndefined();
            }

            result = top.set({name: 'Name', nested: new Nested({address1: '1234 Main St.'})});
            expect(result).toBe(top);
            var cidsNomerge = extractCids(top);
            expect(cidsOriginal.top).toEqual(cidsNomerge.top);
            expect(cidsOriginal.nested).not.toEqual(cidsNomerge.nested);
            expect(top.get('name')).toEqual('Name');
            expect(top.get('nested').get('address1')).toEqual('1234 Main St.');
            if (checkCounts) {
                expect(top.counts).toEqual({set: 2});
            } else {
                expect(top.counts).toBeUndefined();
            }

            result = top.set({name: 'NAME', nested: new Nested({address1: '4321 Main St.'})}, {merge: true});
            expect(result).toBe(top);
            var cidsMerge = extractCids(top);
            expect(cidsNomerge.top).toEqual(cidsMerge.top);
            expect(cidsNomerge.nested).toEqual(cidsMerge.nested);
            expect(top.get('name')).toEqual('NAME');
            expect(top.get('nested').get('address1')).toEqual('4321 Main St.');
            if (checkCounts) {
                expect(top.counts).toEqual({set: 3});
            } else {
                expect(top.counts).toBeUndefined();
            }

            result = top.set('name', 'value');
            expect(result).toBe(top);
            var cidsSetname = extractCids(top);
            expect(cidsNomerge.top).toEqual(cidsSetname.top);
            expect(cidsNomerge.nested).toEqual(cidsSetname.nested);
            expect(top.get('name')).toEqual('value');
            expect(top.get('nested').get('address1')).toEqual('4321 Main St.');
            if (checkCounts) {
                expect(top.counts).toEqual({set: 4});
            } else {
                expect(top.counts).toBeUndefined();
            }

            result = top.set('nested', new Nested({address1: '1234 Main St.'}));
            expect(result).toBe(top);
            var cidsSetnested = extractCids(top);
            expect(cidsSetname.top).toEqual(cidsSetnested.top);
            expect(cidsSetname.nested).not.toEqual(cidsSetnested.nested);
            expect(top.get('name')).toEqual('value');
            expect(top.get('nested').get('address1')).toEqual('1234 Main St.');
            if (checkCounts) {
                expect(top.counts).toEqual({set: 5});
            } else {
                expect(top.counts).toBeUndefined();
            }

            result = top.set('nested', new Nested({address1: '4321 Main St.'}), {merge: true});
            expect(result).toBe(top);
            var cidsSetnestedmerge = extractCids(top);
            expect(cidsSetnested.top).toEqual(cidsSetnestedmerge.top);
            expect(cidsSetnested.nested).toEqual(cidsSetnestedmerge.nested);
            expect(top.get('name')).toEqual('value');
            expect(top.get('nested').get('address1')).toEqual('4321 Main St.');
            if (checkCounts) {
                expect(top.counts).toEqual({set: 6});
            } else {
                expect(top.counts).toBeUndefined();
            }

            result = top.set('nested', {address1: '1234 Main St.'}, {merge: true, parse: true});
            expect(result).toBe(top);
            var cidsSetnestedpojoparse = extractCids(top);
            expect(cidsSetnestedmerge.top).toEqual(cidsSetnestedpojoparse.top);
            expect(cidsSetnestedmerge.nested).toEqual(cidsSetnestedpojoparse.nested);
            expect(top.get('name')).toEqual('value');
            expect(top.get('nested').get('address1')).toEqual('1234 Main St.');
            if (checkCounts) {
                expect(top.counts).toEqual({set: 7});
            } else {
                expect(top.counts).toBeUndefined();
            }

            result = top.set('nested', {address1: '4321 Main St.'}, {merge: true});
            expect(result).toBe(top);
            var cidsSetnestedpojo = extractCids(top);
            expect(cidsSetnestedpojoparse.top).toEqual(cidsSetnestedpojo.top);
            expect(cidsSetnestedpojo.nested).toBeUndefined();
            expect(top.get('name')).toEqual('value');
            expect(top.get('nested')).not.toEqual(jasmine.any(Backbone.Model));
            expect(top.get('nested').address1).toEqual('4321 Main St.');
            if (checkCounts) {
                expect(top.counts).toEqual({set: 8});
            } else {
                expect(top.counts).toBeUndefined();
            }
        }
        it('set-mixin-plain', function() {
            testSet.call(this, NestedModels.mixin(Top), false);
        });
        it('set-mixin-methods', function() {
            testSet.call(this, NestedModels.mixin(TopWithMethods), true);
        });
        it('set-wrap-plain', function() {
            expect(NestedModels.wrapSetFunction(Top)).toBe(Top);
            testSet.call(this, Top, false);
        });
        it('set-wrap-methods', function() {
            expect(NestedModels.wrapSetFunction(TopWithMethods)).toBe(TopWithMethods);
            testSet.call(this, TopWithMethods, true);
        });
        function testToJSON(Top, checkCounts) {
            var result, top, rKeys;
            top = new Top();
            if (checkCounts) {
                expect(top.counts).toEqual({set: 1});
            } else {
                expect(top.counts).toBeUndefined();
            }

            result = top.toJSON();
            rKeys = _.keys(result).sort();
            expect(rKeys).toEqual(['name', 'nested']);
            expect(result.name).toBeNull();
            expect(result.nested).not.toBeNull();
            expect(result.nested).toEqual(jasmine.any(Backbone.Model));
            if (checkCounts) {
                expect(top.counts).toEqual({set: 1, toJSON: 1});
            } else {
                expect(top.counts).toBeUndefined();
            }

            result = top.toJSON({deep: true});
            rKeys = _.keys(result).sort();
            expect(rKeys).toEqual(['name', 'nested']);
            expect(result.name).toBeNull();
            expect(result.nested).not.toBeNull();
            expect(result.nested).not.toEqual(jasmine.any(Backbone.Model));
            if (checkCounts) {
                expect(top.counts).toEqual({set: 1, toJSON: 2});
            } else {
                expect(top.counts).toBeUndefined();
            }
        }
        it('toJSON-mixin-plain', function() {
            testToJSON.call(this, NestedModels.mixin(Top), false);
        });
        it('toJSON-mixin-methods', function() {
            testToJSON.call(this, NestedModels.mixin(TopWithMethods), true);
        });
        it('toJSON-wrap-plain', function() {
            expect(NestedModels.wrapToJSONFunction(Top)).toBe(Top);
            testToJSON.call(this, Top, false);
        });
        it('toJSON-wrap-methods', function() {
            expect(NestedModels.wrapToJSONFunction(TopWithMethods)).toBe(TopWithMethods);
            testToJSON.call(this, TopWithMethods, true);
        });
        function testValidation(Top, checkCounts) {
            var result, top, rKeys;
            top = new Top();
            if (checkCounts) {
                expect(top.counts).toEqual({set: 1});
            } else {
                expect(top.counts).toBeUndefined();
            }

            expect(top.isValid()).toBeUndefined();
            result = top.validate();
            expect(result).not.toBeNull();
            rKeys = _.keys(result).sort();
            expect(rKeys).toEqual(['name', 'nested']);
            expect(result.name).toEqual(jasmine.any(String));
            expect(result.nested).toEqual(jasmine.any(String));
            expect(top.isValid()).toBe(false);
            if (checkCounts) {
                expect(top.counts).toEqual({set: 1, isValid: 2, validate: 1});
            } else {
                expect(top.counts).toBeUndefined();
            }

            top.validation.nested = [
                {fn: function() { return true; }, msg: 'return-true'},
            ];
            result = top.validate();
            expect(result).not.toBeNull();
            rKeys = _.keys(result).sort();
            expect(rKeys).toEqual(['name', 'nested']);
            expect(result.name).toEqual('name IS required');
            expect(result.nested).toEqual('return-true');
            if (checkCounts) {
                expect(top.counts).toEqual({set: 1, isValid: 2, validate: 2});
            } else {
                expect(top.counts).toBeUndefined();
            }

            top.validation.nested = [
                {fn: function() { return false; }, msg: 'return-false'},
            ];
            result = top.validate();
            expect(result).not.toBeNull();
            rKeys = _.keys(result).sort();
            expect(rKeys).toEqual(['name']);
            expect(result.name).toEqual('name IS required');
            if (checkCounts) {
                expect(top.counts).toEqual({set: 1, isValid: 2, validate: 3});
            } else {
                expect(top.counts).toBeUndefined();
            }

            top.validation.nested = [
                {fn: function() { return null; }, msg: 'return-null'},
            ];
            result = top.validate();
            expect(result).not.toBeNull();
            rKeys = _.keys(result).sort();
            expect(rKeys).toEqual(['name', 'nested']);
            expect(result.name).toEqual('name IS required');
            expect(result.nested).toEqual(jasmine.any(String));
            if (checkCounts) {
                expect(top.counts).toEqual({set: 1, isValid: 2, validate: 4});
            } else {
                expect(top.counts).toBeUndefined();
            }

            top.get('nested').set('address1', '1234 Main St.');
            result = top.validate();
            expect(result).not.toBeNull();
            rKeys = _.keys(result).sort();
            expect(rKeys).toEqual(['name', 'nested']);
            expect(result.name).toEqual('name IS required');
            expect(result.nested).toEqual(jasmine.any(String));
            if (checkCounts) {
                expect(top.counts).toEqual({set: 1, isValid: 2, validate: 5});
            } else {
                expect(top.counts).toBeUndefined();
            }

            top.get('nested').set('countryGeoId', 'foobar');
            result = top.validate();
            expect(result).not.toBeNull();
            rKeys = _.keys(result).sort();
            expect(rKeys).toEqual(['name', 'nested']);
            expect(result.name).toEqual('name IS required');
            expect(result.nested).toEqual(jasmine.any(String));
            if (checkCounts) {
                expect(top.counts).toEqual({set: 1, isValid: 2, validate: 6});
            } else {
                expect(top.counts).toBeUndefined();
            }

            top.get('nested').set('countryGeoId', 'USA');
            result = top.validate();
            expect(result).not.toBeNull();
            rKeys = _.keys(result).sort();
            expect(rKeys).toEqual(['name']);
            expect(result.name).toEqual('name IS required');
            if (checkCounts) {
                expect(top.counts).toEqual({set: 1, isValid: 2, validate: 7});
            } else {
                expect(top.counts).toBeUndefined();
            }

            top.get('nested').clear();
            top.validation.nested = {fn: NestedModels.validateNestedValue, msg: 'installed-directly'};
            result = top.validate();
            expect(result).not.toBeNull();
            rKeys = _.keys(result).sort();
            expect(rKeys).toEqual(['name', 'nested']);
            expect(result.name).toEqual('name IS required');
            expect(result.nested).toEqual('installed-directly');
            if (checkCounts) {
                expect(top.counts).toEqual({set: 1, isValid: 2, validate: 8});
            } else {
                expect(top.counts).toBeUndefined();
            }

            result = top.preValidate('name', null);
            expect(result).toEqual(jasmine.any(String));
            expect(top.get('name')).toBeNull();
            if (checkCounts) {
                expect(top.counts).toEqual({set: 1, isValid: 2, validate: 8, preValidate: 1});
            } else {
                expect(top.counts).toBeUndefined();
            }

            result = top.preValidate('name', 'NAME');
            expect(result).toEqual('');
            expect(top.get('name')).toBeNull();
            if (checkCounts) {
                expect(top.counts).toEqual({set: 1, isValid: 2, validate: 8, preValidate: 2});
            } else {
                expect(top.counts).toBeUndefined();
            }
        }
        it('validation-mixin-plain', function() {
            testValidation.call(this, NestedModels.mixin(Top), false);
        });
        it('validation-mixin-methods', function() {
            testValidation.call(this, NestedModels.mixin(TopWithMethods), true);
        });
        it('validation-wrap-plain', function() {
            expect(NestedModels.wrapValidationFunctions(Top)).toBe(Top);
            testValidation.call(this, Top, false);
        });
        it('validation-mixin-methods', function() {
            expect(NestedModels.wrapValidationFunctions(TopWithMethods)).toBe(TopWithMethods);
            testValidation.call(this, TopWithMethods, true);
        });
    });
});
