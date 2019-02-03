/**
 * @filedescription Merge Strategy Tests
 */
/* global it, describe, beforeEach */

"use strict";

//-----------------------------------------------------------------------------
// Requirements
//-----------------------------------------------------------------------------

const assert = require("chai").assert;
const { MergeStrategy } = require("../src/");

//-----------------------------------------------------------------------------
// Class
//-----------------------------------------------------------------------------

describe("MergeStrategy", () => {


    describe("overwrite()", () => {

        it("should overwrite the first value with the second when called", () => {
            const result = MergeStrategy.overwrite(1, 2);
            assert.strictEqual(result, 2);
        });

    });

    describe("assign()", () => {

        it("should merge properties from two objects when called", () => {

            const object1 = { foo: 1, bar: 3 };
            const object2 = { foo: 2 };            
            
            const result = MergeStrategy.assign(object1, object2);
            assert.deepStrictEqual(result, {
                foo: 2,
                bar: 3
            });
        });

    });

});
