# Tests

This directory contains unit tests for the Excalidraw Video Pipeline project.

## Running Tests

Run all tests:
```bash
npm test
```

Run tests in watch mode during development:
```bash
npm run dev
```

## Test Structure

- `parser.test.js` - Tests for ExcalidrawParser class
- `videoExporter.test.js` - Tests for VideoExporter class
- `fixtures/` - Test data files (created automatically during tests)

## Writing Tests

Tests use Node.js's built-in test runner (requires Node.js 18+).

Example:
```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('MyClass', () => {
    it('should do something', () => {
        assert.strictEqual(1 + 1, 2);
    });
});
```

## Test Coverage

Current test coverage includes:
- ✅ Input validation for file paths
- ✅ Error handling for invalid data
- ✅ Core parsing functionality
- ✅ Animation duration calculations
- ✅ Video export configuration

## CI/CD

Tests are automatically run in GitHub Actions on every push and pull request.
