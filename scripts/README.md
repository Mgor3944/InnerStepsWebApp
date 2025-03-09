# InnerSteps Scripts

This directory contains the JavaScript files for the InnerSteps web app. Each file focuses on a specific feature or page functionality, making the codebase more maintainable and easier to understand.

## Files

- `practice.js`: Contains all functionality related to the practice activities page, including:
  - Worry meter functionality
  - Scenario navigation
  - Summary generation
  - User progress tracking for practice activities

## Usage

These script files are loaded after the main `script.js` file, which contains core functionality like the UserManager class. Each module exports its functions to the global scope to be accessible from HTML files.

Example:

```html
<!-- Load main script first for core functionality -->
<script src="scripts/script.js"></script>
<!-- Load feature-specific scripts -->
<script src="scripts/practice.js"></script>
```

## Benefits of Modular Approach

1. **Improved maintainability**: Each file focuses on a specific feature
2. **Better organization**: Related code is grouped together
3. **Easier debugging**: Issues can be isolated to specific modules
4. **Reduced cognitive load**: Smaller files are easier to understand
5. **Better collaboration**: Team members can work on different modules simultaneously

## Future Improvements

As the application grows, consider:

1. Implementing a proper module bundler like Webpack or Rollup
2. Using ES6 modules with import/export syntax
3. Adding unit tests for each module
4. Creating a build process to optimize for production 