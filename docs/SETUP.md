# InnerSteps Development Setup Guide

## Quick Start Guide

### 1. Development Environment Setup
- Install [Node.js](https://nodejs.org/) (LTS version)
- Install a code editor (we recommend [Cursor](https://www.cursor.com/))
- Clone this repository:
  ```bash
  git clone [repository-url]
  cd InnerStepsWebApp
  ```

### 2. Running the Project
```bash
# Start the local server
node server.js

# The app will be available at:
# http://localhost:3000
```

### 3. Project Structure
```
InnerStepsWebApp/
├── assets/        # Images and media files
├── data/         # Local data storage
├── scripts/      # JavaScript files
├── styles.css    # Main stylesheet
├── *.html        # Main application pages
└── server.js     # Local development server
```

### 4. Key Files
- `index.html` - Main entry point
- `server.js` - Development server
- `style.css` - Global styles
- `scripts/` - Core application logic

### 5. Development Workflow
1. Create a new branch for your feature
2. Make your changes
3. Test locally
4. Submit a pull request