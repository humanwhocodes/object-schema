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

    describe("new ObjectSchema()", () => {

        it("should add a new key when a strategy is passed", () => {
            schema = new ObjectSchema({
                foo: {
                    merge() {},
                    validate() {}
                }
            });

            assert.isTrue(schema.hasKey("foo"));
        });

        it("should throw an error when a strategy is missing a merge() method", () => {
            assert.throws(() => {
                schema = new ObjectSchema({
                    foo: {
                        validate() { }
                    }
                });
            }, /Definition for key "foo" must have a merge\(\) method/);
        });

        it("should throw an error when a strategy is missing a merge() method", () => {
            assert.throws(() => {
                schema = new ObjectSchema();
            }, /Schema definitions missing/);
        });

        it("should throw an error when a strategy is missing a validate() method", () => {
            assert.throws(() => {
                schema = new ObjectSchema({
                    foo: {
                        merge() { },
                    }
                });
            }, /Definition for key "foo" must have a validate\(\) method/);
        });

    });


    describe("merge()", () => {

        it("should throw an error when an unexpected key is found", () => {
            let schema = new ObjectSchema({});

            assert.throws(() => {
                schema.merge({ foo: true }, { foo: true });
            }, /Unexpected key "foo"/);
        });

        it("should throw an error when merge() throws an error", () => {
            let schema = new ObjectSchema({
                foo: {
                    merge() {
                        throw new Error("Boom!");
                    },
                    validate() {}
                }
            });

            assert.throws(() => {
                schema.merge({ foo: true }, { foo: true });
            }, /Key "foo": Boom!/);
        });

        it("should call the merge() strategy for one key when called", () => {
            
            schema = new ObjectSchema({
                foo: {
                    merge() {
                        return "bar";
                    },
                    validate() {}
                }
            });

            const result = schema.merge({ foo: true }, { foo: false });
            assert.propertyVal(result, "foo", "bar");
        });

        it("should omit returning the key when the merge() strategy returns undefined", () => {
            schema = new ObjectSchema({
                foo: {
                    merge() {
                        return undefined;
                    },
                    validate() { }
                }
            });
            
            const result = schema.merge({ foo: true }, { foo: false });
            assert.notProperty(result, "foo");
        });

        it("should call the merge() strategy for two keys when called", () => {
            schema = new ObjectSchema({
                foo: {
                    merge() {
                        return "bar";
                    },
                    validate() { }
                },
                bar: {
                    merge() {
                        return "baz";
                    },
                    validate() {}
                }
            });
            
            const result = schema.merge({ foo: true, bar: 1 }, { foo: true, bar: 2 });
            assert.propertyVal(result, "foo", "bar");
            assert.propertyVal(result, "bar", "baz");
        });

        it("should call the merge() strategy for two keys when called on three objects", () => {
            schema = new ObjectSchema({
                foo: {
                    merge() {
                        return "bar";
                    },
                    validate() { }
                },
                bar: {
                    merge() {
                        return "baz";
                    },
                    validate() { }
                }
            });
            
            const result = schema.merge(
                { foo: true, bar: 1 },
                { foo: true, bar: 3 },
                { foo: false, bar: 2 }
            );
            assert.propertyVal(result, "foo", "bar");
            assert.propertyVal(result, "bar", "baz");
        });

    });

    describe("validate()", () => {

        it("should throw an error when an unexpected key is found", () => {
            let schema = new ObjectSchema({});
            assert.throws(() => {
                schema.validate({ foo: true });
            }, /Unexpected key "foo"/);
        });

        it("should not throw an error when an expected key is found", () => {
            schema = new ObjectSchema({
                foo: {
                    merge() {
                        return "bar";
                    },
                    validate() {}
                }
            });
            
            schema.validate({ foo: true });
        });

        it("should not throw an error when expected keys are found", () => {
            schema = new ObjectSchema({
                foo: {
                    merge() {
                        return "bar";
                    },
                    validate() {}
                },
                bar: {
                    merge() {
                        return "baz";
                    },
                    validate() {}
                }
            });
            
            schema.validate({ foo: true, bar: true });
        });

        it("should not throw an error when expected keys are found with required keys", () => {
            schema = new ObjectSchema({
                foo: {
                    merge() {
                        return "bar";
                    },
                    validate() { }
                },
                bar: {
                    requires: ["foo"],
                    merge() {
                        return "baz";
                    },
                    validate() { }
                }
            });
            
            schema.validate({ foo: true, bar: true });
        });

        it("should throw an error when expected keys are found without required keys", () => {
            schema = new ObjectSchema({
                foo: {
                    merge() {
                        return "bar";
                    },
                    validate() { }
                },
                baz: {
                    merge() {
                        return "baz";
                    },
                    validate() { }
                },
                bar: {
                    name: "bar",
                    requires: ["foo", "baz"],
                    merge() { },
                    validate() { }
                }
            });

            assert.throws(() => {
                schema.validate({ bar: true });
            }, /Key "bar" requires keys "foo", "baz"./);
        });


        it("should throw an error when an expected key is found but is invalid", () => {

            schema = new ObjectSchema({
                foo: {
                    merge() {
                        return "bar";
                    },
                    validate() {
                        throw new Error("Invalid key.");
                    }
                }
            });

            assert.throws(() => {
                schema.validate({ foo: true });
            }, /Key "foo": Invalid key/);
        });

        it("should throw an error when a required key is missing", () => {

            schema = new ObjectSchema({
                foo: {
                    required: true,
                    merge() {
                        return "bar";
                    },
                    validate() {}
                }
            });

            assert.throws(() => {
                schema.validate({});
            }, /Missing required key "foo"/);
        });

    });

});
