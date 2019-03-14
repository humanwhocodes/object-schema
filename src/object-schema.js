/**
 * @filedescription Object Schema
 */

"use strict";

//-----------------------------------------------------------------------------
// Private
//-----------------------------------------------------------------------------

const strategies = Symbol("strategies");
const requiredKeys = Symbol("requiredKeys");

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
    constructor() {

        /**
         * Track all strategies in the schema by key.
         * @type {Map}
         * @property strategies
         */
        this[strategies] = new Map();

        /**
         * Separately track any keys that are required for faster validation.
         * @type {Array}
         * @property requiredKeys
         */
        this[requiredKeys] = [];
    }

    /**
     * Defines a new strategy for an object key.
     * @param {Object} strategy The strategy for the object key.
     * @param {string} strategy.name The name of the key the strategy applies to.
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
    defineStrategy(strategy) {

        if (typeof strategy.name !== "string") {
            throw new Error("Strategy must have a \"name\" property.");
        }

        if (typeof strategy.merge !== "function") {
            throw new Error("Strategy must have a merge() method.");
        }

        if (typeof strategy.validate !== "function") {
            throw new Error("Strategy must have a validate() method.");
        }

        this[strategies].set(strategy.name, strategy);

        if (strategy.required) {
            this[requiredKeys].push(strategy);
        }
    }

    /**
     * Determines if a strategy has been registered for the given object key.
     * @param {string} key The object key to find a strategy for.
     * @returns {boolean} True if the key has a strategy registered, false if not. 
     */
    hasStrategyFor(key) {
        return this[strategies].has(key);
    }

    /**
     * Merges two objects together to create a new object comprised of the keys
     * of the both objects. Keys are merged based on the each key's merge
     * strategy.
     * @param {Object} object1 The first object.
     * @param {Object} object2 The second object.
     * @returns {Object} A new object with a mix of both objects' keys.
     * @throws {Error} If either object is invalid.
     */
    merge(object1, object2) {

        // ensure the objects are valid before merging
        this.validate(object1);
        this.validate(object2);

        const result = {};

        for (const [key, strategy] of this[strategies]) {
            result[key] = strategy.merge.call(this, object1[key], object2[key]);
        }

        return result;
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
            if (!this.hasStrategyFor(key)) {
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
            strategy.validate.call(strategy, object);
        }

        // ensure required keys aren't missing
        for (const strategy of this[requiredKeys]) {
            if (!(strategy.name in object)) {
                throw new Error(`Missing required key "${strategy.name}".`);
            }
        }

    }
}

exports.ObjectSchema = ObjectSchema;