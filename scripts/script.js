// === USER AUTHENTICATION AND DATA MANAGEMENT ===
class UserManager {
    // Define character constants
    static CHARACTERS = {
        PIP: 'pip',
        KOA: 'koa',
        MILO: 'milo',
        ZURI: 'zuri'
    };

    // Define storyline constants
    static STORYLINES = {
        UMBRELLA_RACING: 'umbrella_racing',
        ALT_STORYLINE: 'alt_storyline'
    };

    // Utility function to capitalize the first letter of a string
    static capitalizeFirstLetter(string) {
        if (!string) return string;
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    constructor() {
        this.currentPin = null;
        this.userData = null;
        this.baseData = null;
        this.structureData = null;
    }

    async initialize() {
        // Load user data directly without PIN dependency
        await this.loadUserData();
        
        // Load story structure data
        await this.loadStoryStructure();
    }

    async loadStoryStructure() {
        try {
            const response = await fetch('data/stories/structure.json');
            this.structureData = await response.json();
            return this.structureData;
        } catch (error) {
            console.error('Error loading story structure:', error);
            return null;
        }
    }

    async loadUserData() {
        try {
            console.log('Loading user data from localStorage...');
            
            // Initialize minimal default values for new users
            const defaultProfile = {
                progress: {
                    current_story: 'story1',
                    chapter1_progress: 0
                    // Not setting selectedCharacter and selectedStoryline for new users
                    // They should go through onboarding first
                },
                stories: {},
                analytics: { worry_ratings: [] }
            };
            
            // Use a single consistent key for user data
            const storedData = localStorage.getItem('user_data');
            
            if (storedData) {
                console.log('Found user data in localStorage');
                
                // Parse the stored data
                const parsedData = JSON.parse(storedData);
                console.log('Parsed user data:', parsedData);
                
                // Check if we already have userData loaded
                if (this.userData) {
                    console.log('Merging with existing userData');
                    
                    // Save the current completion status
                    const currentStories = this.userData.stories || {};
                    
                    // Merge the data
                    this.userData = {
                        ...this.userData,
                        ...parsedData
                    };
                    
                    // Ensure progress object exists
                    if (!this.userData.progress) {
                        this.userData.progress = parsedData.progress || defaultProfile.progress;
                    } else {
                        this.userData.progress = {
                            ...this.userData.progress,
                            ...parsedData.progress
                        };
                    }
                    
                    // Ensure stories object exists
                    if (!this.userData.stories) {
                        this.userData.stories = parsedData.stories || {};
                    } else {
                        // Merge stories, preserving completion status
                        Object.keys(parsedData.stories || {}).forEach(storyId => {
                            if (!this.userData.stories[storyId]) {
                                this.userData.stories[storyId] = parsedData.stories[storyId];
                            } else {
                                // Preserve the completion status from localStorage
                                this.userData.stories[storyId].completed = parsedData.stories[storyId].completed || this.userData.stories[storyId].completed || false;
                                this.userData.stories[storyId].practice_completed = parsedData.stories[storyId].practice_completed || this.userData.stories[storyId].practice_completed || false;
                            }
                        });
                    }
                } else {
                    // Just use the parsed data
                    this.userData = parsedData;
                }
                
                // Ensure required objects exist
                if (!this.userData.stories) {
                    this.userData.stories = {};
                }
                
                if (!this.userData.progress) {
                    this.userData.progress = defaultProfile.progress;
                }
                
                if (!this.userData.analytics) {
                    this.userData.analytics = defaultProfile.analytics;
                }
                
                console.log('User data loaded:', this.userData);
                console.log('Stories:', this.userData.stories);
            } else {
                console.log('No user data found in localStorage, using default profile');
                this.userData = defaultProfile;
            }
            
            // If character and storyline are selected (meaning user completed onboarding),
            // load the appropriate stories
            if (this.userData.progress.selectedCharacter && this.userData.progress.selectedStoryline) {
                await this.loadStoriesForSelection();
            }
            
            return this.userData;
        } catch (error) {
            console.error('Error loading user data:', error);
            return null;
        }
    }

    async loadStoriesForSelection() {
        try {
            console.log('Loading stories for character:', this.userData.progress.selectedCharacter, 'storyline:', this.userData.progress.selectedStoryline);
            
            // Make sure structure data is loaded
            if (!this.structureData) {
                console.log('Structure data not loaded, loading now');
                await this.loadStoryStructure();
                console.log('Structure data loaded:', this.structureData ? 'Yes' : 'No');
            }
            
            // Get the character and storyline from user data
            const character = this.userData.progress.selectedCharacter;
            const storyline = this.userData.progress.selectedStoryline;
            
            // Validate character and storyline
            if (!this.isValidCharacter(character) || !this.isValidStoryline(storyline)) {
                console.error('Invalid character or storyline:', character, storyline);
                return { error: "Invalid character or storyline selection." };
            }
            
            try {
                // Check if the storyline exists in the structure data
                if (this.structureData.chapter_1.storylines[storyline]) {
                    console.log('Storyline found in structure data');
                    
                    // Get the stories for this character and storyline
                    const storiesPath = `data/stories/${character}_${storyline}.json`;
                    console.log('Fetching stories from:', storiesPath);
                    
                    // Check if the file exists
                    const fileCheckResponse = await fetch(storiesPath, { method: 'HEAD' });
                    console.log('File exists:', storiesPath, fileCheckResponse.ok);
                    
                    if (!fileCheckResponse.ok) {
                        console.error('Stories file not found:', storiesPath);
                        return { error: "Stories not found for this character and storyline." };
                    }
                    
                    // Fetch the stories
                    const response = await fetch(storiesPath);
                    console.log('Stories response OK:', response.ok);
                    
                    if (!response.ok) {
                        console.error('Failed to load stories:', response.status);
                        return { error: "Failed to load stories. Please try again." };
                    }
                    
                    // Parse the JSON
                    const storiesData = await response.json();
                    console.log('Stories data loaded successfully');
                    console.log('Number of stories:', Object.keys(storiesData).length);
                    
                    // Get the structure stories
                    const structureStories = this.structureData.chapter_1.storylines[storyline].stories;
                    console.log('Structure stories loaded successfully');
                    console.log('Number of structure stories:', Object.keys(structureStories).length);
                    
                    // Merge the stories with the structure data
                    const storyIds = Object.keys(structureStories);
                    console.log('Story IDs to process:', storyIds);
                    
                    // Save the current completion status before merging
                    const currentCompletionStatus = {};
                    if (this.userData.stories) {
                        Object.keys(this.userData.stories).forEach(storyId => {
                            if (this.userData.stories[storyId]) {
                                currentCompletionStatus[storyId] = {
                                    completed: this.userData.stories[storyId].completed || false,
                                    practice_completed: this.userData.stories[storyId].practice_completed || false
                                };
                            }
                        });
                    }
                    console.log('Current completion status before merging:', currentCompletionStatus);
                    
                    // Initialize stories object if it doesn't exist
                    if (!this.userData.stories) {
                        this.userData.stories = {};
                    }
                    
                    // Merge each story
                    storyIds.forEach(storyId => {
                        console.log('Merging story', storyId);
                        
                        // Get the story content from the stories file
                        // The structure is different than expected - stories are nested under a "stories" property
                        const storyContent = storiesData.stories ? storiesData.stories[storyId] : storiesData[storyId];
                        
                        if (!storyContent) {
                            console.error(`Story content not found for ${storyId}`);
                            return;
                        }
                        
                        console.log(`Story content for ${storyId}:`, storyContent);
                        
                        // Get the story structure
                        const storyStructure = structureStories[storyId];
                        
                        if (!storyStructure) {
                            console.error(`Story structure not found for ${storyId}`);
                            return;
                        }
                        
                        console.log(`Story structure for ${storyId}:`, storyStructure);
                        
                        // Check if the story has pages
                        if (!storyContent.pages || storyContent.pages.length === 0) {
                            console.warn(`No pages found for story ${storyId}`);
                        } else {
                            console.log(`Found ${storyContent.pages.length} pages for story ${storyId}`);
                        }
                        
                        // Merge them, being careful to preserve the pages property
                        this.userData.stories[storyId] = {
                            // Start with any existing data
                            ...(this.userData.stories[storyId] || {}),
                            // Add story content (including pages)
                            ...storyContent,
                            // Add structure data (but don't overwrite pages)
                            ...storyStructure,
                            // Make sure pages is preserved
                            pages: storyContent.pages || [],
                            // Preserve completion status if it exists
                            completed: currentCompletionStatus[storyId]?.completed || false,
                            practice_completed: currentCompletionStatus[storyId]?.practice_completed || false
                        };
                        
                        // Double-check that pages were preserved
                        if (!this.userData.stories[storyId].pages || this.userData.stories[storyId].pages.length === 0) {
                            console.error(`Pages were lost during merge for story ${storyId}`);
                        } else {
                            console.log(`Successfully preserved ${this.userData.stories[storyId].pages.length} pages for story ${storyId}`);
                        }
                    });
                    
                    console.log('Stories merged successfully');
                    console.log('Number of merged stories:', Object.keys(this.userData.stories).length);
                    
                    // Log the updated stories
                    console.log('Updated userData.stories:', this.userData.stories);
                    
                    // Save the updated user data
                    this.saveUserData();
                    console.log('Saved user data with stories');
                    
                    // Ensure story progress is maintained if there's local data
                    const storedData = localStorage.getItem('user_data');
                    const localData = storedData ? JSON.parse(storedData) : null;
                    
                    if (localData && localData.stories) {
                        console.log('Found existing stories in localStorage');
                        Object.keys(localData.stories).forEach(storyId => {
                            if (this.userData.stories[storyId]) {
                                console.log(`Preserving completion status for story ${storyId}`);
                                console.log(`Before: ${this.userData.stories[storyId].completed}, localStorage: ${localData.stories[storyId].completed}`);
                                this.userData.stories[storyId].completed = localData.stories[storyId].completed || false;
                                this.userData.stories[storyId].practice_completed = localData.stories[storyId].practice_completed || false;
                                console.log(`After: ${this.userData.stories[storyId].completed}`);
                            }
                        });
                    }
                    
                    console.log('Final stories in userData:', this.userData.stories);
                    
                    // Save again after preserving completion status
                    this.saveUserData();
                    console.log('Saved user data after preserving completion status');
                    
                    return true;
                } else {
                    console.error('Storyline not found in structure data:', storyline);
                    return { error: "Storyline not found in structure data." };
                }
            } catch (error) {
                console.error('Error loading story data:', error);
                return { error: "There was a problem loading the story content. Please try a different option." };
            }
        } catch (error) {
            console.error('Error in loadStoriesForSelection:', error);
            return { error: "An unexpected error occurred. Please try a different option." };
        }
    }

    // Helper method to validate character selection
    isValidCharacter(character) {
        return Object.values(UserManager.CHARACTERS).includes(character);
    }

    // Helper method to validate storyline selection
    isValidStoryline(storyline) {
        return Object.values(UserManager.STORYLINES).includes(storyline);
    }

    async setCharacterAndStoryline(character, storyline) {
        console.log('setCharacterAndStoryline called with:', { character, storyline });
        
        // Validate inputs
        if (!this.isValidCharacter(character)) {
            console.error('Invalid character selected:', character);
            return { error: "Invalid character selected. Please choose a valid character." };
        }
        if (!this.isValidStoryline(storyline)) {
            console.error('Invalid storyline selected:', storyline);
            return { error: "Invalid storyline selected. Please choose a valid storyline." };
        }

        console.log('Character and storyline are valid');
        this.userData.progress.selectedCharacter = character;
        this.userData.progress.selectedStoryline = storyline;
        
        // Load the appropriate stories
        console.log('Loading stories for selection');
        const result = await this.loadStoriesForSelection();
        console.log('Result from loadStoriesForSelection:', result);
        
        // Check if stories were loaded successfully
        if (result === true) {
            if (!this.userData.stories || Object.keys(this.userData.stories).length === 0) {
                console.error('No stories loaded despite successful result');
                return { error: "Failed to load stories. Please try again." };
            }
            console.log('Stories loaded successfully:', Object.keys(this.userData.stories));
        }
        
        // Save the updated user data
        console.log('Saving updated user data');
        this.saveUserData();
        console.log('User data after save:', this.userData);
        
        return result;
    }

    mergeUserData(baseProfile, localData) {
        // Deep merge the base profile with local modifications
        const merged = { ...baseProfile };
        
        // Merge top-level properties
        Object.keys(localData).forEach(key => {
            if (key !== 'stories') {
                merged[key] = localData[key];
            }
        });

        // Specially handle stories to preserve the base story content
        if (baseProfile.stories && localData.stories) {
            merged.stories = { ...baseProfile.stories };
            Object.keys(localData.stories).forEach(storyId => {
                if (merged.stories[storyId]) {
                    // Only merge the completion status and any user-specific data
                    merged.stories[storyId] = {
                        ...merged.stories[storyId],
                        completed: localData.stories[storyId].completed
                    };
                }
            });
        }

        return merged;
    }

    saveUserData() {
        if (this.userData) {
            console.log('Saving user data to localStorage...');
            
            // Ensure required objects exist
            if (!this.userData.stories) {
                console.log('No stories object found, creating default');
                this.userData.stories = {
                    story1: { completed: false }
                };
            }
            
            if (!this.userData.progress) {
                console.log('No progress object found, creating default');
                this.userData.progress = {
                    current_story: 'story1',
                    chapter1_progress: 0,
                    selectedCharacter: this.userData.character || 'pip',
                    selectedStoryline: 'umbrella_racing'
                };
            }
            
            if (!this.userData.analytics) {
                console.log('No analytics object found, creating default');
                this.userData.analytics = { 
                    worry_ratings: [],
                    last_session: new Date().toISOString()
                };
            }
            
            // Ensure pronouns are set
            if (!this.userData.pronouns && this.userData.gender) {
                console.log('Setting pronouns based on gender:', this.userData.gender);
                
                // Define pronoun sets
                const pronounSets = {
                    'boy': {
                        subject: 'he',
                        object: 'him',
                        possessive: 'his',
                        possessivePronoun: 'his',
                        reflexive: 'himself'
                    },
                    'girl': {
                        subject: 'she',
                        object: 'her',
                        possessive: 'her',
                        possessivePronoun: 'hers',
                        reflexive: 'herself'
                    },
                    'other': {
                        subject: 'they',
                        object: 'them',
                        possessive: 'their',
                        possessivePronoun: 'theirs',
                        reflexive: 'themself'
                    }
                };
                
                // Set pronouns based on gender
                this.userData.pronouns = pronounSets[this.userData.gender] || pronounSets['other'];
                console.log('Pronouns set successfully:', this.userData.pronouns);
            } else if (this.userData.pronouns) {
                // Ensure all required pronoun properties exist
                const requiredProps = ['subject', 'object', 'possessive', 'possessivePronoun', 'reflexive'];
                const missingProps = requiredProps.filter(prop => !this.userData.pronouns[prop]);
                
                if (missingProps.length > 0) {
                    console.log('Adding missing pronoun properties:', missingProps.join(', '));
                    
                    // Add missing properties with defaults based on existing pronouns
                    if (this.userData.pronouns.subject === 'he') {
                        if (!this.userData.pronouns.object) this.userData.pronouns.object = 'him';
                        if (!this.userData.pronouns.possessive) this.userData.pronouns.possessive = 'his';
                        if (!this.userData.pronouns.possessivePronoun) this.userData.pronouns.possessivePronoun = 'his';
                        if (!this.userData.pronouns.reflexive) this.userData.pronouns.reflexive = 'himself';
                    } else if (this.userData.pronouns.subject === 'she') {
                        if (!this.userData.pronouns.object) this.userData.pronouns.object = 'her';
                        if (!this.userData.pronouns.possessive) this.userData.pronouns.possessive = 'her';
                        if (!this.userData.pronouns.possessivePronoun) this.userData.pronouns.possessivePronoun = 'hers';
                        if (!this.userData.pronouns.reflexive) this.userData.pronouns.reflexive = 'herself';
                    } else {
                        if (!this.userData.pronouns.object) this.userData.pronouns.object = 'them';
                        if (!this.userData.pronouns.possessive) this.userData.pronouns.possessive = 'their';
                        if (!this.userData.pronouns.possessivePronoun) this.userData.pronouns.possessivePronoun = 'theirs';
                        if (!this.userData.pronouns.reflexive) this.userData.pronouns.reflexive = 'themself';
                    }
                }
            }
            
            // Log the completion status of all stories before saving
            console.log('Story completion status before saving:');
            Object.keys(this.userData.stories).forEach(storyId => {
                console.log(`${storyId}: ${this.userData.stories[storyId].completed}`);
            });
            
            // Create a deep copy of userData to avoid reference issues
            const dataToSave = JSON.parse(JSON.stringify(this.userData));
            
            // Ensure stories have the correct format
            if (dataToSave.stories) {
                Object.keys(dataToSave.stories || {}).forEach(storyId => {
                    if (!dataToSave.stories[storyId].hasOwnProperty('completed')) {
                        console.log(`Adding missing completed property to ${storyId}`);
                        dataToSave.stories[storyId].completed = false;
                    }
                });
            }
            
            // Ensure all required fields are present
            const requiredFields = ['name', 'gender', 'character', 'characterName', 'hobbies', 'mood'];
            requiredFields.forEach(field => {
                if (dataToSave[field] === undefined) {
                    console.warn(`Missing required field: ${field}`);
                    // Set default values for missing fields
                    switch (field) {
                        case 'hobbies':
                            dataToSave[field] = [];
                            break;
                        case 'mood':
                            dataToSave[field] = 'happy';
                            break;
                        default:
                            dataToSave[field] = '';
                    }
                }
            });
            
            // Save all user data to localStorage
            localStorage.setItem('user_data', JSON.stringify(dataToSave));
            console.log('Saved user data to localStorage:', dataToSave);
            
            // Verify the data was saved correctly
            const savedData = localStorage.getItem('user_data');
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                console.log('Story completion status after saving:');
                Object.keys(parsedData.stories).forEach(storyId => {
                    console.log(`${storyId}: ${parsedData.stories[storyId].completed}`);
                });
            }
        } else {
            console.error('Cannot save user data: userData is not defined');
        }
    }

    getCurrentStory() {
        console.log('getCurrentStory called');
        
        if (!this.userData) {
            console.error('Missing user data');
            return null;
        }
        
        if (!this.userData.progress) {
            console.error('Missing progress data');
            return null;
        }
        
        if (!this.userData.stories) {
            console.error('Missing stories data');
            return null;
        }
        
        const currentStoryId = this.userData.progress.current_story;
        console.log('Getting current story:', currentStoryId);
        
        // Get the story from user data
        const userStory = this.userData.stories[currentStoryId];
        
        if (!userStory) {
            console.error('Story not found in user data:', currentStoryId);
            console.log('Available stories:', Object.keys(this.userData.stories));
            return null;
        }
        
        console.log('Found story in user data:', userStory);
        
        // Check if the story has pages
        if (!userStory.pages || userStory.pages.length === 0) {
            console.warn(`No pages found for current story ${currentStoryId}`);
            
            // Try to load pages from the story file
            const character = this.userData.progress.selectedCharacter;
            const storyline = this.userData.progress.selectedStoryline;
            
            // We'll try to load the story data from the file
            console.log(`Attempting to load pages for ${currentStoryId} from story file...`);
            
            // This is an async function, but we're in a sync context, so we'll return the story as is
            // and let the calling code handle the missing pages
            this.loadStoriesForSelection().then(() => {
                console.log('Stories reloaded, check if pages are now available');
            });
        } else {
            console.log(`Story has ${userStory.pages.length} pages`);
        }
        
        // Get the story structure from the loaded structure
        const character = this.userData.progress.selectedCharacter;
        const storyline = this.userData.progress.selectedStoryline;
        
        try {
            // Make sure structure data is loaded
            if (!this.structureData) {
                console.error('Structure data not loaded');
                return userStory;
            }
            
            console.log('Structure data available');
            
            // Get the structure for this story
            if (this.structureData.chapter_1 && 
                this.structureData.chapter_1.storylines && 
                this.structureData.chapter_1.storylines[storyline] &&
                this.structureData.chapter_1.storylines[storyline].stories) {
                
                const storyStructure = this.structureData.chapter_1.storylines[storyline].stories[currentStoryId];
                
                if (storyStructure) {
                    console.log('Found story structure:', storyStructure);
                    
                    // Merge the structure with the user story, being careful not to overwrite pages
                    const mergedStory = {
                        ...userStory,
                        ...storyStructure,
                        // Ensure pages are preserved
                        pages: userStory.pages || []
                    };
                    
                    return mergedStory;
                }
            }
            
            // If we couldn't find the structure, just return the user story
            return userStory;
        } catch (error) {
            console.error('Error getting story structure:', error);
            return userStory;
        }
    }

    updateUserProfile(profileData) {
        console.log('Updating user profile...');
        
        // Check if pronouns are missing but gender is available
        if (!profileData.pronouns && profileData.gender) {
            console.log('Setting pronouns based on gender:', profileData.gender);
            
            // Define pronoun sets
            const pronounSets = {
                'boy': {
                    subject: 'he',
                    object: 'him',
                    possessive: 'his',
                    possessivePronoun: 'his',
                    reflexive: 'himself'
                },
                'girl': {
                    subject: 'she',
                    object: 'her',
                    possessive: 'her',
                    possessivePronoun: 'hers',
                    reflexive: 'herself'
                },
                'other': {
                    subject: 'they',
                    object: 'them',
                    possessive: 'their',
                    possessivePronoun: 'theirs',
                    reflexive: 'themself'
                }
            };
            
            // Set pronouns based on gender
            profileData.pronouns = pronounSets[profileData.gender] || pronounSets['other'];
        }
        
        if (!this.userData) {
            // Initialize userData if it doesn't exist
            this.userData = {
                ...profileData,
                stories: profileData.stories || {
                    story1: { completed: false }
                },
                progress: profileData.progress || {
                    current_story: 'story1',
                    chapter1_progress: 0
                },
                analytics: profileData.analytics || { 
                    worry_ratings: [],
                    last_session: new Date().toISOString()
                }
            };
            
            console.log('Initialized userData:', this.userData);
        } else {
            // Create a deep copy of the current userData
            const currentData = JSON.parse(JSON.stringify(this.userData));
            console.log('Current userData before update:', currentData);
            
            // Merge top-level properties
            this.userData = { 
                ...currentData,
                ...profileData
            };
            
            // Ensure nested objects are properly merged
            if (profileData.progress) {
                this.userData.progress = {
                    ...currentData.progress || {},
                    ...profileData.progress
                };
            }
            
            if (profileData.analytics) {
                this.userData.analytics = {
                    ...currentData.analytics || {},
                    ...profileData.analytics
                };
            }
            
            // Ensure pronouns are set
            if (!this.userData.pronouns && this.userData.gender) {
                console.log('Setting pronouns based on gender:', this.userData.gender);
                
                // Define pronoun sets
                const pronounSets = {
                    'boy': {
                        subject: 'he',
                        object: 'him',
                        possessive: 'his',
                        possessivePronoun: 'his',
                        reflexive: 'himself'
                    },
                    'girl': {
                        subject: 'she',
                        object: 'her',
                        possessive: 'her',
                        possessivePronoun: 'hers',
                        reflexive: 'herself'
                    },
                    'other': {
                        subject: 'they',
                        object: 'them',
                        possessive: 'their',
                        possessivePronoun: 'theirs',
                        reflexive: 'themself'
                    }
                };
                
                // Set pronouns based on gender
                this.userData.pronouns = pronounSets[this.userData.gender] || pronounSets['other'];
                console.log('Pronouns set successfully:', this.userData.pronouns);
            }
            
            // Ensure stories object exists and is properly merged
            if (profileData.stories) {
                this.userData.stories = {
                    ...currentData.stories || {},
                    ...profileData.stories
                };
            } else if (!this.userData.stories) {
                this.userData.stories = {
                    story1: { completed: false }
                };
            }
            
            console.log('User profile updated successfully');
        }
        
        // Ensure we have a valid stories object with at least story1
        if (!this.userData.stories || Object.keys(this.userData.stories).length === 0) {
            console.log('No stories found, adding default story1');
            this.userData.stories = {
                story1: { completed: false }
            };
        }
        
        // Save the updated user data
        this.saveUserData();
    }

    async validatePin(pin) {
        // PIN validation is no longer used, always return true
        return true;
    }
}

// Initialize user manager
const userManager = new UserManager();

// === PAGE INITIALIZATION ===
document.addEventListener('DOMContentLoaded', async function() {
    await userManager.initialize();

    // Handle different pages
    if (document.querySelector('.welcome-page')) {
        // Welcome page now uses welcome.js
        console.log('Welcome page loaded');
    } else if (document.getElementById('onboardingForm')) {
        // Onboarding now uses onboarding.js
        console.log('Onboarding form loaded');
    } else if (document.querySelector('.read-story-page')) {
        // Read story page now uses readstory.js
        console.log('Read story page loaded');
    } else {
        initializeAppropriateView();
    }
});

// === PAGE DETECTION AND INITIALIZATION ===
// Onboarding-related functions have been moved to scripts/onboarding.js

// === USER PROGRESS HANDLING ===
// User progress functions have been moved to scripts/onboarding.js

function updateUserProgress() {
    // Update user progress based on completed stories
    // This function will be implemented later
}

// === PAGE INITIALIZATION ===
function initializeAppropriateView() {
    // Check which page we're on and initialize accordingly
    if (document.querySelector('.read-story-page')) {
        // Story page now uses readstory.js
        console.log('Read story page loaded');
    } else if (document.querySelector('.journey-page')) {
        // Journey map page now uses journey-map.js
        console.log('Journey map page loaded');
    }
}

function updateThermometer(value) {
    const fillWidth = (value / 10) * 100;
    const thermometerFill = document.querySelector('.thermometer-fill');
    
    if (thermometerFill) {
        thermometerFill.style.width = `${fillWidth}%`;
        
        // Update color based on value
        if (value <= 3) {
            thermometerFill.style.backgroundColor = '#4CAF50'; // Green for little worries
        } else if (value <= 6) {
            thermometerFill.style.backgroundColor = '#FFC107'; // Yellow for medium worries
        } else if (value <= 8) {
            thermometerFill.style.backgroundColor = '#FF9800'; // Orange for bigger worries
        } else {
            thermometerFill.style.backgroundColor = '#f44336'; // Red for biggest worries
        }
    }
}

// Add event listeners for the worry slider
document.querySelectorAll('.worry-slider').forEach(slider => {
    slider.addEventListener('input', (e) => {
        updateThermometer(e.target.value);
    });
});

// === WELCOME ANIMATION HANDLING ===
// Welcome animation functions have been moved to scripts/onboarding.js

// === PRACTICE PAGE HANDLING ===
// Practice page functionality has been moved to scripts/practice.js

// === TEXT PERSONALIZATION ===
// Text personalization functions have been moved to scripts/onboarding.js

// Function to start a story
function startStory(storyId) {
    // Set the current story in user data
    userManager.userData.progress.current_story = storyId;
    userManager.saveUserData();
    
    // Navigate to the story page
    window.location.href = 'readstory.html';
}