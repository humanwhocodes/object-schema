/**
 * @filedescription Object Schema Tests
 */
/* global it, describe, beforeEach */

"use strict";

//-----------------------------------------------------------------------------
// Requirements
//-----------------------------------------------------------------------------

const assert = require("chai").assert;
const { ObjectSchema } = require("../src/");

//-----------------------------------------------------------------------------
// Class
//-----------------------------------------------------------------------------

describe("ObjectSchema", () => {

    let schema;

    beforeEach(() => {
        schema = new ObjectSchema();
    });

    describe("defineStrategy()", () => {

        it("should add a new key when a strategy is passed", () => {
            schema.defineStrategy({
                name: "foo",
                merge() {},
                validate() {}
            });

            assert.isTrue(schema.hasStrategyFor("foo"));
        });

        it("should throw an error when a strategy is missing a name", () => {
            assert.throws(() => {
                schema.defineStrategy({
                    merge() {},
                    validate() {}
                });
            }, /Strategy must have a "name" property/);
        });

        it("should throw an error when a strategy is missing a merge() method", () => {
            assert.throws(() => {
                schema.defineStrategy({
                    name: "foo",
                    validate() {}
                });
            }, /Strategy must have a merge\(\) method/);
        });

        it("should throw an error when a strategy is missing a validate() method", () => {
            assert.throws(() => {
                schema.defineStrategy({
                    name: "foo",
                    merge() {}
                });
            }, /Strategy must have a validate\(\) method/);
        });

    });

    describe("merge()", () => {

        it("should throw an error when an unexpected key is found", () => {
            assert.throws(() => {
                schema.merge({ foo: true }, { foo: true });
            }, /Unexpected key "foo"/);
        });

        it("should call the merge() strategy for one key when called", () => {
            schema.defineStrategy({
                name: "foo",
                merge() {
                    return "bar";
                },
                validate() {}
            });
            
            const result = schema.merge({ foo: true }, { foo: true });
            assert.propertyVal(result, "foo", "bar");
        });

        it("should call the merge() strategy for two keys when called", () => {
            schema.defineStrategy({
                name: "foo",
                merge() {
                    return "bar";
                },
                validate() {}
            });
            
            schema.defineStrategy({
                name: "bar",
                merge() {
                    return "baz";
                },
                validate() {}
            });
            
            const result = schema.merge({ foo: true, bar: 1 }, { foo: true, bar: 2 });
            assert.propertyVal(result, "foo", "bar");
            assert.propertyVal(result, "bar", "baz");
        });

    });

    describe("validate()", () => {

        it("should throw an error when an unexpected key is found", () => {
            assert.throws(() => {
                schema.validate({ foo: true });
            }, /Unexpected key "foo"/);
        });

        it("should not throw an error when an expected key is found", () => {
            schema.defineStrategy({
                name: "foo",
                merge() {},
                validate() {}
            });
            
            schema.validate({ foo: true });
        });

        it("should not throw an error when expected keys are found", () => {
            schema.defineStrategy({
                name: "foo",
                merge() {},
                validate() {}
            });

            schema.defineStrategy({
                name: "bar",
                merge() {},
                validate() {}
            });
            
            schema.validate({ foo: true, bar: true });
        });

        it("should throw an error when an expected key is found but is invalid", () => {
            schema.defineStrategy({
                name: "foo",
                merge() { },
                validate() {
                    throw new Error("Invalid key: " + this.name);
                }
            });

            assert.throws(() => {
                schema.validate({ foo: true });
            }, /Invalid key: foo/);
        });

        it("should throw an error when a required key is missing", () => {
            schema.defineStrategy({
                name: "foo",
                required: true,
                merge() { },
                validate() {
                    throw new Error("Invalid key: " + this.name);
                }
            });

            assert.throws(() => {
                schema.validate({});
            }, /Missing required key "foo"/);
        });

    });

});
