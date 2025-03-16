# InnerSteps Data Structure and Management

This document outlines how data is stored and managed in the InnerSteps application.

## Core Data Storage

All application data is stored in the browser's localStorage under the key `user_data`. The data structure is organized as follows:

```typescript
{
    // User Profile
    name: string,                 // User's name
    gender: "boy" | "girl" | "other",
    character: string,            // Selected character ID
    characterName: string,        // Character's given name
    hobbies: string[],           // Selected interests
    mood: string,                // Current mood state
    
    // Navigation & Progress
    progress: {
        selectedCharacter: string,
        selectedStoryline: string,
        current_story: string,    // Current story ID
        chapter1_progress: number // Progress percentage
    },
    
    // Story Data
    stories: {
        [storyId: string]: {
            completed: boolean,
            practice_completed: boolean,
            title: string,
            description: string,
            pages: StoryPage[],
            practice: PracticeActivity
        }
    },
    
    // User Activity Tracking
    analytics: {
        worry_ratings: Array<{
            story: string,
            scenario: string,
            rating: number,
            timestamp: string
        }>,
        last_session: string      // ISO timestamp
    }
}
```

## Story Content Structure

Story content is defined in JSON files:

1. `data/stories/structure.json`: Defines the overall story structure
2. `data/stories/[character]_[storyline].json`: Contains story content

### Structure Example:
```typescript
{
    "chapter_1": {
        "storylines": {
            [storylineId: string]: {
                title: string,
                description: string,
                stories: {
                    [storyId: string]: {
                        title: string,
                        description: string,
                        cover_image: string,
                        badge_image: string,
                        key_message: string,
                        practice: PracticeActivity
                    }
                }
            }
        }
    }
}
```

## Key Operations

### Data Management
- Data is loaded on application start
- All changes are immediately persisted to localStorage
- Story content is loaded dynamically based on user selections

### Progress Tracking
- Story completion is tracked per story
- Practice activity completion is tracked separately
- Chapter progress is calculated as percentage of completed stories

### Practice Activities
- Activities are defined per story
- Results are stored in analytics.worry_ratings
- Each rating includes story context and timestamp

## Common Data Operations

```typescript
// Get current story data
const story = getCurrentStory();

// Update story completion
markStoryComplete(storyId);

// Save practice results
savePracticeRating({
    story: storyId,
    scenario: scenarioId,
    rating: userRating
});

// Update progress
updateProgress(chapterProgress);
```

For detailed implementation, refer to the source code in the app directory. 