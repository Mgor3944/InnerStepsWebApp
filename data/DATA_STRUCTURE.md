# InnerSteps Data Structure and Tracking

This document explains how data is stored, tracked, and managed in the InnerSteps application.

## Overview

InnerSteps maintains several key data structures to track user progress, story completion, and practice activity results. All data is stored in the browser's localStorage and loaded when needed.

## Main Data Structure

The primary data structure is stored in localStorage under the key `user_data` and contains:

```javascript
{
    // Basic user info
    name: "...",                  // User's name (same as characterName)
    gender: "boy" | "girl" | "other",
    character: "pip" | "...",     // Selected character
    characterName: "...",         // Name given to the character
    hobbies: ["...", "..."],      // Array of selected hobbies/interests
    mood: "happy" | "worried" | "...", // User's mood from onboarding
    
    // Progress tracking
    progress: {
        selectedCharacter: "pip", // Character selection
        selectedStoryline: "umbrella_racing", // Storyline selection
        current_story: "story1",  // Current story ID
        chapter1_progress: 0      // Progress within the chapter (percentage)
    },
    
    // Story completion tracking
    stories: {
        story1: { 
            completed: false,     // Whether the story has been completed
            practice_completed: false, // Whether the practice activity has been completed
            // When loaded, also contains story content and practice data
            title: "...",
            description: "...",
            pages: [...],         // Array of story pages
            practice: {...}       // Practice activity data
        },
        story2: { completed: false },
        // Additional stories
    },
    
    // Analytics and user activity
    analytics: {
        worry_ratings: [          // Stores responses from practice activities
            {
                story: "story1",
                scenario: "trying_new_things",
                rating: 7,
                timestamp: "2023-06-15T12:34:56.789Z"
            }
        ],
        last_session: "2023-06-15T12:34:56.789Z" // Timestamp of last session
    }
}
```

## Story Structure Data

Story structure is loaded from `data/stories/structure.json` and defines:

- Chapters
- Storylines within each chapter
- Stories within each storyline
- Practice activities for each story

Example structure:

```javascript
{
    "chapter_1": {
        "storylines": {
            "umbrella_racing": {
                "title": "The Flying Umbrella Racing League",
                "description": "...",
                "stories": {
                    "story1": {
                        "title": "Pip's Big Discovery",
                        "description": "...",
                        "cover_image": "...",
                        "badge_image": "...",
                        "key_message": "...",
                        "practice": {
                            "title": "Understanding Our Worries",
                            "type": "worry_meter",
                            "description": "...",
                            "scenarios": [
                                {
                                    "text": "How worried do you feel about trying something new?",
                                    "type": "worry_rating"
                                },
                                // More scenarios...
                            ]
                        }
                    },
                    // More stories...
                }
            },
            // More storylines...
        }
    }
}
```

## Story Content Data

The actual story content is loaded from character and storyline-specific JSON files:
- `data/stories/[character]_[storyline].json` (e.g., `pip_umbrella_racing.json`)

This contains the actual story text, pages, and any character-specific content.

## Data Flow and Management

### 1. Initial Data Collection

During onboarding (`handleFormSubmit()` function):
- User information is collected from the form
- Initial data structure is created with default values
- Data is saved to localStorage

### 2. Loading Story Structure and Content

When a character and storyline are selected (`loadStoriesForSelection()` method):
- Story structure is loaded from `structure.json`
- Story content is loaded from `[character]_[storyline].json`
- Structure data (with practice activities) is merged with content data
- User's `stories` object is updated with the merged data
- Completion status is preserved from existing localStorage data

### 3. Tracking Current Story and Progress

The `getCurrentStory()` method:
- Gets the current story ID from `userData.progress.current_story`
- Retrieves the story data from `userData.stories[currentStoryId]`
- Merges in practice data from the structure data
- Returns the complete story object with content and practice activities

### 4. Saving User Progress

The `saveUserData()` method ensures all user data is properly saved:
- Ensures required objects exist (stories, progress, analytics)
- Creates a deep copy to avoid reference issues
- Ensures all stories have a `completed` property
- Validates required fields and sets defaults if missing
- Saves everything to localStorage

### 5. Practice Activity Data

Practice activities (worry meter ratings, reflection questions, etc.) are defined in the story structure.
When a user completes these activities, their responses are stored in `userData.analytics.worry_ratings`.

## Practice Activities Handling

Practice activities are managed in `scripts/practice.js` and follow this flow:

1. **Initialization**:
   - The `initPracticePage()` function loads the current story and its practice data
   - Practice data is retrieved from the current story using `userManager.getCurrentStory()`

2. **User Interaction**:
   - Users progress through scenarios defined in the story's practice data
   - For worry meter activities, users set ratings on a scale of 1-10
   - For reflection activities, users provide text responses

3. **Saving Results**:
   - When a practice activity is completed, the `completePractice()` function:
     - Marks the story as completed (`completed: true`)
     - Marks the practice as completed (`practice_completed: true`)
     - Calculates overall chapter progress based on completed stories
     - Updates `userData.progress.chapter1_progress` with the percentage
     - Saves all ratings to `userData.analytics.worry_ratings`
     - Calls `userManager.saveUserData()` to persist all changes

4. **Progress Calculation**:
   - Chapter progress is calculated as: `(completedStories / totalStories) * 100`
   - This percentage is stored in `userData.progress.chapter1_progress`

## How to Access and Update Data

### Get the current story
```javascript
const currentStory = userManager.getCurrentStory();
```

### Update story completion status
```javascript
const currentStoryId = userManager.userData.progress.current_story;
userManager.userData.stories[currentStoryId].completed = true;
userManager.saveUserData();
```

### Move to the next story
```javascript
// Assuming you know the next story ID
userManager.userData.progress.current_story = "story2";
userManager.saveUserData();
```

### Save practice activity results
```javascript
userManager.userData.analytics.worry_ratings.push({
  story: currentStoryId,
  scenario: "trying_new_things",
  rating: 7,
  timestamp: new Date().toISOString()
});
userManager.saveUserData();
```

## Important Methods in UserManager

- `initialize()`: Sets up the UserManager and loads initial data
- `loadStoryStructure()`: Loads the story structure from JSON
- `loadUserData()`: Loads user data from localStorage
- `loadStoriesForSelection()`: Loads stories based on character and storyline
- `setCharacterAndStoryline()`: Updates character and storyline selection
- `getCurrentStory()`: Gets the current story with all its data
- `updateUserProfile()`: Updates the user profile with new data
- `saveUserData()`: Saves all user data to localStorage

## Practice Activities

Practice activities are defined in the story structure and can include:
- Worry meter ratings (`worry_rating` type)
- Reflection questions (`reflection` type)
- Self-assessments (`self_assessment` type)

The practice data is loaded from the structure and merged with the story content when `getCurrentStory()` is called. 