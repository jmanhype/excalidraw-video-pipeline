# Contributing to Excalidraw Video Pipeline

Thank you for your interest in contributing! This guide will help you get started.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/excalidraw-video-pipeline.git`
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feature/your-feature-name`

## Development Workflow

### Running the Project

```bash
# Start the pipeline
npm start

# Development mode with auto-reload
npm run dev

# Run tests
npm test
```

### Code Quality Standards

1. **Input Validation**: All public methods must validate inputs
2. **JSDoc Documentation**: All classes and public methods must have JSDoc comments
3. **Error Handling**: Use descriptive error messages
4. **Testing**: Add tests for new features

### JSDoc Example

```javascript
/**
 * Brief description of what the method does
 * @param {string} paramName - Description of parameter
 * @returns {Promise<Object>} Description of return value
 * @throws {Error} When something goes wrong
 */
async myMethod(paramName) {
    // Implementation
}
```

### Input Validation Pattern

```javascript
// Validate required parameters
if (!param) {
    throw new Error('Parameter is required');
}

// Validate type
if (typeof param !== 'string') {
    throw new Error(`Parameter must be a string, got ${typeof param}`);
}

// Validate file existence
if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
}
```

## Testing

### Writing Tests

Tests use Node.js's built-in test runner:

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('MyClass', () => {
    it('should validate input correctly', async () => {
        await assert.rejects(
            async () => await myFunction(null),
            { message: 'Parameter is required' }
        );
    });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
node --test tests/parser.test.js
```

## Pull Request Process

1. **Update Tests**: Ensure your changes are covered by tests
2. **Run Tests**: Make sure all tests pass with `npm test`
3. **Update Documentation**: Update README.md if you changed functionality
4. **Write Clear Commits**: Use descriptive commit messages
5. **Create PR**: Submit a pull request with a clear description

### Commit Message Format

```
type: brief description

Longer explanation if needed.

- Bullet points for details
- Multiple changes if needed
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`

Examples:
- `feat: add input validation to parser`
- `fix: handle missing file paths in exporter`
- `docs: add JSDoc to animator class`
- `test: add unit tests for parser`

## Project Structure

```
excalidraw-video-pipeline/
├── src/
│   ├── animation/      # Animation generation
│   ├── processing/     # Excalidraw file parsing
│   ├── export/         # Video export
│   ├── upload/         # YouTube upload
│   └── voice/          # Voice narration
├── tests/              # Unit tests
├── examples/           # Sample Excalidraw files
├── output/             # Generated videos
└── docs/               # Documentation
```

## Common Issues

### FFmpeg Not Found

Install FFmpeg on your system:
- macOS: `brew install ffmpeg`
- Ubuntu: `apt-get install ffmpeg`
- Windows: Download from https://ffmpeg.org/

### Tests Failing

1. Ensure Node.js >= 18.0.0: `node --version`
2. Clean install: `rm -rf node_modules && npm install`
3. Check test output for specific errors

## Questions?

- Open an issue for bugs
- Start a discussion for feature requests
- Check existing issues before creating new ones

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow

Thank you for contributing! 🎉
