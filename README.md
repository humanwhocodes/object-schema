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

// define a strategy for the "downloads" key
schema.defineStrategy({
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
});

// define strategy for "versions" key
schema.defineStrategy({
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
});

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

// merge together
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

## License

BSD 3-Clause