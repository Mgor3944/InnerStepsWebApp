# InnerSteps Backend Implementation Plan

## Git Workflow Guide

### Using Git Branches for Safe Development

Git branches let you work on new features without affecting your main codebase. This guide will help you manage your project with branches.

#### Creating and Using Branches

1. **Check your current branch**:
   ```bash
   git branch
   ```
   The branch with * is your current branch.

2. **Create a new branch for backend work**:
   ```bash
   git checkout -b backend-implementation
   ```
   This creates and switches to a new branch called "backend-implementation".

3. **Switch between branches**:
   ```bash
   # Switch to main branch
   git checkout main
   
   # Switch back to backend branch
   git checkout backend-implementation
   ```

#### Working on Both Frontend and Backend

You can work on both simultaneously by switching branches:

1. **For frontend work (deploying to Netlify)**:
   ```bash
   git checkout main             # Switch to main branch
   # Make frontend changes
   git add .                     # Stage changes
   git commit -m "Frontend: description of changes" 
   git push origin main          # Push to GitHub (triggers Netlify)
   ```

2. **For backend work**:
   ```bash
   git checkout backend-implementation  # Switch to backend branch
   # Make backend changes
   git add .
   git commit -m "Backend: description of changes"
   git push origin backend-implementation  # Push to GitHub
   ```

#### Bringing Backend to Production

When your backend is ready for production:

```bash
git checkout main                # Switch to main
git merge backend-implementation # Bring in backend changes
git push origin main             # Push to GitHub/Netlify
```

#### Common Git Commands

- `git status`: See what files have changed
- `git diff`: See exact changes in files
- `git branch`: List all branches
- `git checkout -b [branch-name]`: Create and switch to new branch
- `git checkout [branch-name]`: Switch to existing branch
- `git pull origin [branch-name]`: Get latest changes from GitHub

#### Safety Tips

1. **Always commit before switching branches**
2. **If things go wrong**: `git checkout main` to return to stable code
3. **Nuclear option**: `git reset --hard origin/main` to completely reset to GitHub version
4. **Keep backend in separate folder** to avoid affecting frontend deployment

--

## Current Architecture Overview

### Stack & Structure
- **Frontend**: HTML, CSS, vanilla JavaScript (no framework)
- **Storage**: Browser localStorage for user data and progress
- **Auth**: Currently limited, with email verification via Postmark for insights feature
- **File Structure**:
  ```
  InnerStepsWebApp/
  ├── index.html, welcome.html, onboarding.html, etc.
  ├── scripts/
  │   ├── script.js           # Core functionality
  │   ├── journey-map.js      # Journey map visualization
  │   ├── onboarding.js       # User onboarding flow 
  │   ├── readstory.js        # Story display logic
  │   ├── practice.js         # Practice activities
  │   ├── insights.js         # Parent insights feature
  │   ├── welcome.js          # Welcome page animations
  │   └── mobile-redirect.js  # Mobile device detection
  ├── styles/
  │   ├── base.css            # Base styling
  │   ├── journeymap.css      # Journey map styling
  │   ├── onboarding.css      # Onboarding styling
  │   └── other style files
  ├── assets/
  │   ├── icons/
  │   └── images/
  └── data/
      ├── stories/            # Story content JSON files
      └── DATA_STRUCTURE.md   # Documentation
  ```

### Data Management
- User data, progress, and analytics stored in browser localStorage
- Story content defined in static JSON files
- Data structure as specified in `DATA_STRUCTURE.md`:
  ```json
  {
      "name": "...",
      "gender": "boy|girl|other",
      "character": "...",
      "characterName": "...",
      "hobbies": ["..."],
      "mood": "...",
      "progress": {
          "selectedCharacter": "...",
          "selectedStoryline": "...",
          "current_story": "...",
          "chapter1_progress": 0
      },
      "stories": {
          "storyId": {
              "completed": false,
              "practice_completed": false,
              "title": "...",
              "description": "...",
              "pages": [],
              "practice": {}
          }
      },
      "analytics": {
          "worry_ratings": [],
          "last_session": "..."
      }
  }
  ```

### Current Limitations
- All logic runs client-side, limiting security and performance
- Intellectual property (story content) exposed in client-accessible files
- User data at risk if user clears browser storage
- Limited ability to update content without deploying new frontend code
- No protection for API keys if external services (AI) were to be added

## Proposed Backend Architecture

### Overall Architecture

Frontend <------> REST API <------> Database
                    |                  ^
                    v                  |
           Media Storage/CDN           |
                    |                  |
                    v                  |
            External APIs              |
            (ChatGPT, etc.)           |
                    |                  |
                    v                  |
        Email Service (Postmark) ------+
```

### Technology Stack Recommendation

#### Primary Recommendation: Node.js Backend
- **Language**: JavaScript - maintain consistency with frontend
- **Framework**: Express.js - lightweight, easy to learn, widely adopted
- **Database**: MongoDB - flexible schema similar to existing JSON structure
- **Authentication**: JWT + bcrypt - secure token-based authentication
- **Email Service**: Continue with Postmark API
- **Media Storage**: AWS S3 or Cloudinary for optimized image delivery
- **Hosting**: Vercel, Render, or Railway for easy deployment

#### Alternative: Python Backend
- **Language**: Python
- **Framework**: Flask or FastAPI
- **Database**: MongoDB or PostgreSQL
- **Rest of stack similar to above**

### Backend Project Structure

```
innersteps-backend/
├── server.js                   # Main entry point
├── package.json                # Dependencies
├── config/                     # Configuration files
│   ├── database.js
│   ├── postmark.js
│   └── env.js                  # Environment variables
├── controllers/                # Business logic
│   ├── userController.js       # User management
│   ├── storyController.js      # Story content
│   ├── progressController.js   # Progress tracking
│   ├── analyticsController.js  # Analytics collection
│   └── insightsController.js   # Parent insights
├── models/                     # Database schemas
│   ├── userModel.js
│   ├── storyModel.js
│   └── analyticsModel.js
├── routes/                     # API endpoints
│   ├── api.js                  # Route aggregator
│   ├── userRoutes.js
│   └── storyRoutes.js
├── middleware/                 # Request processors
│   ├── auth.js                 # Authentication middleware
│   ├── errorHandler.js
│   └── rateLimit.js
├── services/                   # External services
│   ├── postmarkService.js      # Email functionality
│   ├── openaiService.js        # AI integration (future)
│   └── storageService.js       # S3/Cloudinary integration
└── utils/                      # Helper functions
    └── apiHelpers.js
```

## Implementation Steps

### 1. Setup Development Environment

```bash
# Create backend project
mkdir innersteps-backend
cd innersteps-backend

# Initialize Node.js project
npm init -y

# Install core dependencies
npm install express mongoose dotenv jsonwebtoken bcrypt cors helmet morgan

# Install development dependencies
npm install nodemon --save-dev

# Create basic directory structure
mkdir config controllers models routes middleware services utils
```

### 2. Database Schema Design

Convert the existing localStorage structure into MongoDB schemas:

```javascript
// models/userModel.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  gender: {
    type: String,
    enum: ['boy', 'girl', 'other']
  },
  character: String,
  characterName: String,
  hobbies: [String],
  mood: String,
  
  // Auth fields
  email: {
    type: String,
    unique: true,
    sparse: true
  },
  password: String,  // Optional - for future admin access
  parentEmail: String,
  emailVerified: {
    type: Boolean,
    default: false
  },
  
  // Preferences
  emailPreferences: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    },
    lastSent: Date
  }
}, { timestamps: true });

// models/progressModel.js
const ProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  selectedCharacter: String,
  selectedStoryline: String,
  current_story: String,
  chapter1_progress: Number,
  completedStories: [{
    storyId: String,
    completedAt: Date,
    practiceCompleted: Boolean
  }]
}, { timestamps: true });

// models/storyModel.js
const StorySchema = new mongoose.Schema({
  storyId: {
    type: String,
    required: true,
    unique: true
  },
  title: String,
  description: String,
  chapterId: String,
  storylineId: String,
  cover_image: String,
  badge_image: String,
  key_message: String,
  pages: [{
    pageId: Number,
    title: String,
    text: String,
    image: String
  }],
  practice: {
    type: Object  // Flexible structure for different practice types
  }
}, { timestamps: true });

// models/analyticsModel.js
const AnalyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  worry_ratings: [{
    story: String,
    scenario: String,
    rating: Number,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  sessions: [{
    startTime: Date,
    endTime: Date,
    activities: [String]  // Tracks what the user did in the session
  }],
  last_session: Date
}, { timestamps: true });
```

### 3. API Endpoint Implementation

#### Core API Routes

```javascript
// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected routes
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);

module.exports = router;

// routes/storyRoutes.js
const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');
const auth = require('../middleware/auth');

// Public routes - allow story browsing without auth
router.get('/', storyController.getAllStories);
router.get('/:storyId', storyController.getStoryById);

// Protected routes - require authentication
router.post('/:storyId/complete', auth, storyController.markStoryComplete);
router.post('/:storyId/practice/complete', auth, storyController.markPracticeComplete);

module.exports = router;

// routes/progressRoutes.js
const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const auth = require('../middleware/auth');

router.get('/', auth, progressController.getUserProgress);
router.post('/update', auth, progressController.updateProgress);

module.exports = router;

// routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const auth = require('../middleware/auth');

router.post('/worry-rating', auth, analyticsController.saveWorryRating);
router.post('/session', auth, analyticsController.logSession);

module.exports = router;

// routes/insightsRoutes.js
const express = require('express');
const router = express.Router();
const insightsController = require('../controllers/insightsController');
const auth = require('../middleware/auth');

router.post('/verify-email', insightsController.requestEmailVerification);
router.post('/confirm-email', insightsController.confirmEmailVerification);
router.put('/preferences', auth, insightsController.updateEmailPreferences);

module.exports = router;
```

### 4. Controller Implementation

Sample implementation for key controllers:

```javascript
// controllers/userController.js
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.register = async (req, res) => {
  try {
    const { name, gender, character, characterName, hobbies, mood } = req.body;
    
    // Create user without password initially
    const user = new User({
      name,
      gender,
      character,
      characterName,
      hobbies,
      mood
    });
    
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        character: user.character,
        characterName: user.characterName
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// controllers/storyController.js
const Story = require('../models/storyModel');
const Progress = require('../models/progressModel');

exports.getAllStories = async (req, res) => {
  try {
    const stories = await Story.find();
    res.json({
      success: true,
      data: stories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.markStoryComplete = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.id;
    
    // Find or create progress record for this user
    let progress = await Progress.findOne({ userId });
    if (!progress) {
      progress = new Progress({ userId });
    }
    
    // Check if story already completed
    const existingCompletion = progress.completedStories.find(
      s => s.storyId === storyId
    );
    
    if (existingCompletion) {
      existingCompletion.completedAt = new Date();
    } else {
      progress.completedStories.push({
        storyId,
        completedAt: new Date(),
        practiceCompleted: false
      });
    }
    
    // Update chapter progress
    const story = await Story.findOne({ storyId });
    if (story) {
      // Calculate new chapter progress based on completed stories
      const chapterStories = await Story.find({ chapterId: story.chapterId });
      const completedChapterStories = progress.completedStories.filter(s => 
        chapterStories.some(cs => cs.storyId === s.storyId)
      );
      
      const chapterProgress = (completedChapterStories.length / chapterStories.length) * 100;
      progress[`${story.chapterId}_progress`] = chapterProgress;
    }
    
    await progress.save();
    
    res.json({
      success: true,
      message: 'Story marked as complete',
      progress
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

### 5. Authentication Middleware

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

module.exports = async (req, res, next) => {
  try {
    let token;
    
    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by id
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Add user to request object
    req.user = {
      id: user._id
    };
    
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Not authorized to access this resource'
    });
  }
};
```

### 6. Email Service Integration

```javascript
// services/postmarkService.js
const postmark = require('postmark');

const client = new postmark.ServerClient(process.env.POSTMARK_API_KEY);

exports.sendVerificationEmail = async (email, verificationCode) => {
  try {
    const response = await client.sendEmailWithTemplate({
      From: 'hello@innersteps.app',
      To: email,
      TemplateAlias: 'verification',
      TemplateModel: {
        verification_code: verificationCode,
        product_name: 'InnerSteps',
        action_url: `https://innersteps.app/verify?code=${verificationCode}`,
        support_email: 'support@innersteps.app'
      }
    });
    
    return response;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send verification email');
  }
};

exports.sendInsightsReport = async (parentEmail, childName, progress, ratings) => {
  try {
    const response = await client.sendEmailWithTemplate({
      From: 'insights@innersteps.app',
      To: parentEmail,
      TemplateAlias: 'weekly-insights',
      TemplateModel: {
        child_name: childName,
        completed_stories: progress.completedStories.length,
        average_worry: calculateAverageWorry(ratings),
        key_insights: generateInsights(ratings),
        action_url: 'https://innersteps.app/insights',
        date: new Date().toLocaleDateString()
      }
    });
    
    return response;
  } catch (error) {
    console.error('Error sending insights email:', error);
    throw new Error('Failed to send insights report');
  }
};

// Helper function to calculate average worry
function calculateAverageWorry(ratings) {
  if (!ratings.length) return 0;
  return ratings.reduce((sum, item) => sum + item.rating, 0) / ratings.length;
}

// Helper function to generate insights from data
function generateInsights(ratings) {
  // Basic implementation - can be enhanced with AI later
  const insights = [];
  
  if (ratings.length > 0) {
    const avgRating = calculateAverageWorry(ratings);
    
    if (avgRating > 7) {
      insights.push('High worry levels detected. Consider scheduling time for relaxation practices.');
    } else if (avgRating > 4) {
      insights.push('Moderate worry levels. Regular practice is helping.');
    } else {
      insights.push('Low worry levels. Great progress!');
    }
  }
  
  return insights;
}
```

### 7. Server Setup

```javascript
// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const userRoutes = require('./routes/userRoutes');
const storyRoutes = require('./routes/storyRoutes');
const progressRoutes = require('./routes/progressRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const insightsRoutes = require('./routes/insightsRoutes');

// Initialize Express app
const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/insights', insightsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Frontend Modifications

### Update API Service

Create a unified API service for all frontend-backend communication:

```javascript
// scripts/api.js
class ApiService {
  constructor() {
    this.baseUrl = 'https://api.innersteps.app'; // Production URL
    // this.baseUrl = 'http://localhost:5000'; // Development URL
    this.token = localStorage.getItem('token');
  }

  // Private methods
  async _fetch(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Default headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    // Add auth token if available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    try {
      const response = await fetch(url, {
        ...options,
        headers
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'An error occurred');
      }
      
      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }
  
  // Auth methods
  async register(userData) {
    const data = await this._fetch('/api/users/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    if (data.token) {
      this.token = data.token;
      localStorage.setItem('token', data.token);
    }
    
    return data;
  }
  
  async login(credentials) {
    const data = await this._fetch('/api/users/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    if (data.token) {
      this.token = data.token;
      localStorage.setItem('token', data.token);
    }
    
    return data;
  }
  
  async logout() {
    this.token = null;
    localStorage.removeItem('token');
  }
  
  // User methods
  async getUserProfile() {
    return this._fetch('/api/users/profile');
  }
  
  async updateUserProfile(userData) {
    return this._fetch('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }
  
  // Story methods
  async getAllStories() {
    return this._fetch('/api/stories');
  }
  
  async getStoryById(storyId) {
    return this._fetch(`/api/stories/${storyId}`);
  }
  
  async markStoryComplete(storyId) {
    return this._fetch(`/api/stories/${storyId}/complete`, {
      method: 'POST'
    });
  }
  
  async markPracticeComplete(storyId) {
    return this._fetch(`/api/stories/${storyId}/practice/complete`, {
      method: 'POST'
    });
  }
  
  // Progress methods
  async getUserProgress() {
    return this._fetch('/api/progress');
  }
  
  async updateProgress(progressData) {
    return this._fetch('/api/progress/update', {
      method: 'POST',
      body: JSON.stringify(progressData)
    });
  }
  
  // Analytics methods
  async saveWorryRating(ratingData) {
    return this._fetch('/api/analytics/worry-rating', {
      method: 'POST',
      body: JSON.stringify(ratingData)
    });
  }
  
  // Insights methods
  async requestEmailVerification(email) {
    return this._fetch('/api/insights/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }
  
  async confirmEmailVerification(email, code) {
    return this._fetch('/api/insights/confirm-email', {
      method: 'POST',
      body: JSON.stringify({ email, code })
    });
  }
  
  async updateEmailPreferences(preferences) {
    return this._fetch('/api/insights/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences)
    });
  }
}

// Export a singleton instance
const API = new ApiService();
```

### Update User Manager

Modify the existing `script.js` to use the API service:

```javascript:scripts/script.js
// ... existing code ...

class UserManager {
  constructor() {
    this.userData = null;
    this.initialized = false;
    this.loading = false;
  }

  async init() {
    if (this.initialized || this.loading) return;
    
    this.loading = true;
    
    try {
      // Try to load from API first
      if (localStorage.getItem('token')) {
        try {
          const response = await API.getUserProfile();
          this.userData = response.user;
          this.initialized = true;
          this.loading = false;
          return;
        } catch (error) {
          console.warn('Failed to load user data from API, falling back to localStorage');
          // If API fails, fall back to localStorage (during migration period)
        }
      }
      
      // Fallback to localStorage
      const savedData = localStorage.getItem('user_data');
      if (savedData) {
        this.userData = JSON.parse(savedData);
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing UserManager:', error);
    } finally {
      this.loading = false;
    }
  }

  async saveUserData() {
    if (!this.userData) return;
    
    try {
      // Save to API if token exists
      if (localStorage.getItem('token')) {
        await API.updateUserProfile(this.userData);
      }
      
      // Still save to localStorage during migration
      localStorage.setItem('user_data', JSON.stringify(this.userData));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

  // ... other methods, updated to use API ...
}

// ... existing code ...
```

## Phased Migration Strategy

### Phase 1: Backend Setup & Core Authentication (2-3 weeks)
1. Set up development environment for backend
2. Implement database schema and basic API endpoints
3. Create authentication system and JWT integration
4. Implement user profile endpoints
5. Create the API service in the frontend
6. Test backend-frontend connection with a simple endpoint

### Phase 2: Story & Progress Management (3-4 weeks)
1. Create database seeders to import existing story content
2. Implement story retrieval endpoints
3. Build progress tracking and analytics endpoints
4. Modify frontend to use API for story content
5. Update frontend to send progress updates to backend
6. Implement basic error handling and fallbacks

### Phase 3: Insights & Parent Features (2-3 weeks)
1. Enhance Postmark integration
2. Implement email verification flow
3. Create insights report generation
4. Set up scheduled tasks for sending reports
5. Add admin features for content management

### Phase 4: Advanced Features & Optimization (3-4 weeks)
1. Implement AI integration (if desired)
2. Set up media optimization and CDN
3. Add caching for performance
4. Implement rate limiting and security measures
5. Create monitoring and analytics dashboards

## Deployment Options

### Development Environment
- **Backend**: Local Node.js server with MongoDB
- **Database**: Local MongoDB or MongoDB Atlas free tier
- **Frontend**: Continue using current setup

### Staging Environment
- **Backend**: Railway, Render, or Vercel
- **Database**: MongoDB Atlas M0 (free) or M2 ($9/month)
- **Frontend**: Same as current deployment

### Production Environment
- **Backend**: Railway Pro ($20/month), Render ($7/month), or AWS/GCP
- **Database**: MongoDB Atlas M2 ($9/month) or M5 ($29/month)
- **Media Storage**: AWS S3 (~$1-5/month based on usage)
- **CDN**: AWS CloudFront or Cloudflare
- **Email**: Postmark ($10/month minimum)

## Security Considerations

1. **API Key Storage**:
   - Store all API keys in environment variables
   - Never expose keys in frontend code
   - Use services like AWS Secrets Manager for production

2. **Authentication**:
   - Implement proper token-based authentication
   - Use JWT with appropriate expiration
   - Add refresh token functionality for prolonged sessions

3. **Data Protection**:
   - Implement HTTPS for all communications
   - Use CORS to restrict API access to known domains
   - Apply rate limiting to prevent abuse

4. **Database Security**:
   - Use strong authentication for database access
   - Implement proper network security (IP whitelisting)
   - Regular backups and monitoring

## Cost Estimates

| Service | Development | Staging | Production |
|---------|-------------|---------|------------|
| Backend | Free (local) | $0-7/month | $7-25/month |
| Database | Free | Free-$9/month | $9-29/month |
| Storage | Free | $1-3/month | $3-10/month |
| Email | Free (limited) | $10/month | $10-50/month |
| **Total** | **Free** | **$11-29/month** | **$29-114/month** |

*Note: Production costs will scale with user base and feature complexity*

## Next Steps

1. Set up the development environment
2. Create basic backend structure and core models
3. Implement initial API endpoints
4. Begin frontend integration with new API service
5. Set up CI/CD pipeline for easy deployment

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [JWT Authentication](https://jwt.io/)
- [Postmark API](https://postmarkapp.com/developer)
- [Railway Deployment](https://railway.app/)
- [MongoDB Schema Design Best Practices](https://www.mongodb.com/developer/products/mongodb/schema-design-anti-pattern-massive-arrays/)
``` 