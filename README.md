# JavaScript ObjectSchema Package

by [Nicholas C. Zakas](https://humanwhocodes.com)

If you find this useful, please consider supporting my work with a [donation](https://humanwhocodes.com/donate).

## Overview

A JavaScript object merge/validation utility where you can define a different merge and validation strategy for each key. This is helpful when you need to validate complex data structures and then merge them in a way that is more complex than `Object.assign()`.

## Installation

You can install using either npm:

```
npm install @humanwhocodes/object-schema
```

Or Yarn:

```
yarn add @humanwhocodes/object-schema
```

## Usage

Use CommonJS to get access to the `ObjectSchema` constructor:

```js
const { ObjectSchema } = require("@humanwhocodes/object-schema");

const schema = new ObjectSchema();

// there is also schema.defineStrategy() to just define one at a time

schema.defineStrategies([

    // define a strategy for the "downloads" key
    {
        name: "downloads",
        required: true,
        merge(value1, value2) {
            return value1 + value2;
        },
        validate(value) {
            if (typeof value !== "number") {
                throw new Error("Expected downloads to be a number.");
            }
        }
    },

    // define a strategy for the "versions" key
    {
        name: "versions",
        required: true,
        merge(value1, value2) {
            return value1.concat(value2);
        },
        validate(value) {
            if (!Array.isArray(value)) {
                throw new Error("Expected versions to be an array.");
            }
        }
    }
]);

const record1 = {
    downloads: 25,
    versions: [
        "v1.0.0",
        "v1.1.0",
        "v1.2.0"
    ]
};

const record2 = {
    downloads: 125,
    versions: [
        "v2.0.0",
        "v2.1.0",
        "v3.0.0"
    ]
};

// make sure the records are valid
schema.validate(record1);
schema.validate(record2);

// merge together (schema.merge() accepts any number of objects)
const result = schema.merge(record1, record2);

// result looks like this:

const result = {
    downloads: 75,
    versions: [
        "v1.0.0",
        "v1.1.0",
        "v1.2.0",
        "v2.0.0",
        "v2.1.0",
        "v3.0.0"
    ]
};
```

## Tips and Tricks

### Remove Keys During Merge

If the merge strategy for a key returns `undefined`, then the key will not appear in the final object. For example:

```js
const schema = new ObjectSchema();

schema.defineStrategy({
    name: "date",
    merge() {
        return undefined;
    },
    validate(value) {
        Date.parse(value);  // throws an error when invalid
    }
})

const object1 = { date: "5/5/2005" };
const object2 = { date: "6/6/2006" };

const result = schema.merge(object1, object2);

console.log("date" in result);  // false
```

### Requiring Another Key Be Present

If you'd like the presence of one key to require the presence of another key, you can use the `requires` property to specify an array of other properties that any key requires. For example:

```js
const schema = new ObjectSchema();

schema.defineStrategies([
    {
        name: "date",
        merge() {
            return undefined;
        },
        validate(value) {
            Date.parse(value);  // throws an error when invalid
        }
    },

    // the key "time" requires that "date" be present
    {
        name: "time",
        requires: ["date"],
        merge(first, second) {
            return second;
        },
        validate(value) {
            // ...
        }
    }

]);

// throws error: Key "time" requires keys "date"
schema.validate({
    time: "13:45"
});
```

In this example, even though `date` is an optional key, it is required to be present whenever `time` is present.

## License

BSD 3-Clause