/**
 * @filedescription Object Schema
 */

"use strict";

//-----------------------------------------------------------------------------
// Requirements
//-----------------------------------------------------------------------------

const { MergeStrategy } = require("./merge-strategy");

//-----------------------------------------------------------------------------
// Private
//-----------------------------------------------------------------------------

const strategies = Symbol("strategies");
const requiredKeys = Symbol("requiredKeys");

/**
 * Validates a schema strategy.
 * @param {string} name The name of the key this strategy is for.
 * @param {Object} strategy The strategy for the object key.
 * @param {boolean} [strategy.required=true] Whether the key is required.
 * @param {string[]} [strategy.requires] Other keys that are required when
 *      this key is present.
 * @param {Function} strategy.merge A method to call when merging two objects
 *      with the same key.
 * @param {Function} strategy.validate A method to call when validating an
 *      object with the key.
 * @returns {void}
 * @throws {Error} When the strategy is missing a name.
 * @throws {Error} When the strategy is missing a merge() method.
 * @throws {Error} When the strategy is missing a validate() method.
 */
function validateDefinition(name, strategy) {

    if (typeof strategy.merge === "string") {
        if (!(strategy.merge in MergeStrategy)) {
            throw new TypeError(`Definition for key "${name}" missing valid merge strategy.`);
        }

        return;
    }

    if (typeof strategy.merge !== "function") {
        throw new TypeError(`Definition for key "${name}" must have a merge property.`);
    }

    if (typeof strategy.validate !== "function") {
        throw new TypeError(`Definition for key "${name}" must have a validate() method.`);
    }
}


//-----------------------------------------------------------------------------
// Class
//-----------------------------------------------------------------------------

/**
 * Represents an object validation/merging schema.
 */
class ObjectSchema {

    /**
     * Creates a new instance.
     */
    constructor(definitions) {

        if (!definitions) {
            throw new Error("Schema definitions missing.");
        }

        /**
         * Track all strategies in the schema by key.
         * @type {Map}
         * @property strategies
         */
        this[strategies] = new Map();

        /**
         * Separately track any keys that are required for faster validation.
         * @type {Map}
         * @property requiredKeys
         */
        this[requiredKeys] = new Map();

        // add in all strategies
        for (const key of Object.keys(definitions)) {
            validateDefinition(key, definitions[key]);

            // normalize the merge method in case there's a string
            if (typeof definitions[key].merge === "string") {
                definitions[key] = {
                    ...definitions[key],
                    merge: MergeStrategy[definitions[key].merge]
                };
            };

            this[strategies].set(key, definitions[key]);

            if (definitions[key].required) {
                this[requiredKeys].set(key, definitions[key]);
            }
        }
    }

    /**
     * Determines if a strategy has been registered for the given object key.
     * @param {string} key The object key to find a strategy for.
     * @returns {boolean} True if the key has a strategy registered, false if not. 
     */
    hasKey(key) {
        return this[strategies].has(key);
    }

    /**
     * Merges objects together to create a new object comprised of the keys
     * of the all objects. Keys are merged based on the each key's merge
     * strategy.
     * @param {...Object} objects The objects to merge.
     * @returns {Object} A new object with a mix of all objects' keys.
     * @throws {Error} If any object is invalid.
     */
    merge(...objects) {

        // double check arguments
        if (objects.length < 2) {
            throw new Error("merge() requires at least two arguments.");
        }

        if (objects.some(object => (object == null || typeof object !== "object"))) {
            throw new Error("All arguments must be objects.");
        }

        return objects.reduce((result, object) => {
            
            this.validate(object);
            
            for (const [key, strategy] of this[strategies]) {
                try {
                    if (key in result || key in object) {
                        const value = strategy.merge.call(this, result[key], object[key]);
                        if (value !== undefined) {
                            result[key] = value;
                        }
                    }
                } catch (ex) {
                    ex.message = `Key "${key}": ` + ex.message;
                    throw ex;
                }
            }
            return result;
        }, {});
    }

    /**
     * Validates an object's keys based on the validate strategy for each key.
     * @param {Object} object The object to validate.
     * @returns {void}
     * @throws {Error} When the object is invalid. 
     */
    validate(object) {

        // check existing keys first
        for (const key of Object.keys(object)) {

            // check to see if the key is defined
            if (!this.hasKey(key)) {
                throw new Error(`Unexpected key "${key}" found.`);
            }

            // validate existing keys
            const strategy = this[strategies].get(key);

            // first check to see if any other keys are required
            if (Array.isArray(strategy.requires)) {
                if (!strategy.requires.every(otherKey => otherKey in object)) {
                    throw new Error(`Key "${key}" requires keys "${strategy.requires.join("\", \"")}".`);
                }
            }

            // now apply remaining validation strategy
            try {
                strategy.validate.call(strategy, object[key]);
            } catch (ex) {
                ex.message = `Key "${key}": ` + ex.message;
                throw ex;
            }
        }

        // ensure required keys aren't missing
        for (const [key] of this[requiredKeys]) {
            if (!(key in object)) {
                throw new Error(`Missing required key "${key}".`);
            }
        }

    }
}

exports.ObjectSchema = ObjectSchema;
