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
        console.log('updateUserProfile called with:', profileData);
        
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
            
            console.log('Updated userData:', this.userData);
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
    if (document.querySelector('.login-page')) {
        initLoginPage();
    } else if (document.querySelector('.welcome-page')) {
        // Welcome page now uses onboarding.js
        console.log('Welcome page loaded');
    } else if (document.getElementById('onboardingForm')) {
        // Onboarding now uses onboarding.js
        console.log('Onboarding form loaded');
    } else if (document.querySelector('.journey-page')) {
        initJourneyMap();
    } else {
        initializeAppropriateView();
    }
});

function initLoginPage() {
    // Login page now has inline script for simplicity
    console.log('Login page loaded');
}

// === PAGE DETECTION AND INITIALIZATION ===
// Onboarding-related functions have been moved to scripts/onboarding.js

// === USER PROGRESS HANDLING ===
// User progress functions have been moved to scripts/onboarding.js

function updateUserProgress() {
    // Update user progress based on completed stories
    // This function will be implemented later
}

// === JOURNEY MAP HANDLING ===
async function initJourneyMap() {
    if (!document.querySelector('.journey-page')) return;
    
    console.log('Initializing journey map...');
    
    // Ensure user data is loaded
    if (!userManager.userData) {
        console.log('User data not loaded, loading now...');
        await userManager.loadUserData();
    }
    
    // Check user data again after loading
    if (!userManager.userData || !userManager.userData.stories) {
        console.error('No user data or stories found');
        // Redirect to login if no valid user data
        window.location.href = 'login.html';
        return;
    }

    console.log('User data loaded:', userManager.userData);
    console.log('Stories:', userManager.userData.stories);
    
    // Check if user has completed onboarding by looking for required fields
    if (!userManager.userData.characterName) {
        console.log('User has not completed onboarding');
        window.location.href = 'login.html';
        return;
    }

    // Update character name in header
    updateCharacterNameInHeader();

    // Calculate chapter progress based on userData
    const completedStories = Object.values(userManager.userData.stories)
        .filter(story => story.completed).length;
    const totalStories = Object.keys(userManager.userData.stories).length;
    const progressPercentage = (completedStories / totalStories) * 100;
    
    console.log(`Progress: ${completedStories}/${totalStories} stories completed (${progressPercentage}%)`);
    
    // Update progress bar in header
    const progressBar = document.querySelector('.j-header-progress-bar');
    const stageName = document.querySelector('.j-header-stage-name');
    
    if (progressBar && stageName) {
        // Set up transition monitoring for the progress bar
        setupProgressBarTransitionMonitoring();
        
        // Set the progress bar width which will trigger the transition
        progressBar.style.width = `${progressPercentage}%`;
        console.log('Updated progress bar width to:', progressPercentage + '%');
        
        // Initial update of the text color
        updateStageNameColor();
        
        // Add a resize observer to handle window resizing
        if (!window.stageNameResizeObserver) {
            window.stageNameResizeObserver = new ResizeObserver(() => {
                updateStageNameColor();
            });
            window.stageNameResizeObserver.observe(document.querySelector('.j-header-progress-container'));
        }
    }
    
    // Get the container for journey stage nodes
    const journeyMapContainer = document.querySelector('.journey-map-container');
    if (!journeyMapContainer) {
        console.error('Journey map container not found');
        return;
    }

    // Clear existing content
    journeyMapContainer.innerHTML = '';
    
    // Get current character and storyline
    const character = userManager.userData.progress.selectedCharacter;
    const storyline = userManager.userData.progress.selectedStoryline;
    
    console.log('Selected character:', character);
    console.log('Selected storyline:', storyline);
    
    // Ensure story structure is loaded
    if (!userManager.structureData) {
        console.log('Story structure not loaded, loading now...');
        await userManager.loadStoryStructure();
    }
    
    // Get structure stories
    if (!userManager.structureData || 
        !userManager.structureData.chapter_1 || 
        !userManager.structureData.chapter_1.storylines || 
        !userManager.structureData.chapter_1.storylines[storyline]) {
        console.error('Missing storyline data:', storyline);
        return;
    }
    
    const structureStories = userManager.structureData.chapter_1.storylines[storyline].stories;
    console.log('Structure stories:', structureStories);
    
    // Create journey stage nodes
    let storyIndex = 1;
    Object.entries(structureStories).forEach(([storyId, storyData]) => {
        const userStory = userManager.userData.stories[storyId] || { completed: false };
        
        // Create the node
        const node = createJourneyStageNode(storyId, storyData, userStory, storyIndex, character);
        journeyMapContainer.appendChild(node);
        storyIndex++;
    });
    
    // Set up event listeners for the insights button
    const insightsBtn = document.getElementById('insightsBtn');
    if (insightsBtn) {
        insightsBtn.addEventListener('click', function() {
            window.location.href = 'insights.html';
        });
    }
}

// Set up monitoring of the progress bar transition to update text color
function setupProgressBarTransitionMonitoring() {
    const progressBar = document.querySelector('.j-header-progress-bar');
    if (!progressBar) return;
    
    // Remove any existing transition listeners
    if (window.progressBarTransitionInterval) {
        clearInterval(window.progressBarTransitionInterval);
    }
    
    // Add a listener for when the transition starts
    progressBar.addEventListener('transitionstart', () => {
        // Check every 30ms during the transition
        window.progressBarTransitionInterval = setInterval(() => {
            updateStageNameColor();
        }, 30);
    });
    
    // Add a listener for when the transition ends
    progressBar.addEventListener('transitionend', () => {
        if (window.progressBarTransitionInterval) {
            clearInterval(window.progressBarTransitionInterval);
            window.progressBarTransitionInterval = null;
        }
        // Final update after transition
        updateStageNameColor();
    });
}

// Helper function to update character name in header
function updateCharacterNameInHeader() {
    const characterNameElements = document.querySelectorAll('.character-name-placeholder');
    if (userManager.userData && userManager.userData.characterName) {
        characterNameElements.forEach(element => {
            if (element.dataset.possessive === 'true') {
                element.textContent = `${userManager.userData.characterName}'s`;
            } else {
                element.textContent = userManager.userData.characterName;
            }
        });
    }
}

// Helper function to create a journey stage node
function createJourneyStageNode(storyId, storyData, userStoryData, storyIndex, character) {
    console.log(`Creating journey stage node for story ${storyId}:`, userStoryData);
    
    // Create the main node container
    const nodeWrapper = document.createElement('div');
    nodeWrapper.className = 'journey-stage-node';

    // Create the node container
    const nodeContainer = document.createElement('div');
    nodeContainer.className = 'node-container';
    nodeContainer.id = `STAGE-1-${storyIndex}`;

    // Check if this node should have the unlocking animation
    const storyToAnimate = localStorage.getItem('story_to_animate');
    if (storyToAnimate === storyId) {
        console.log(`Applying unlocking animation to story ${storyId}`);
        nodeContainer.setAttribute('data-animation', 'unlocking');
        // Clear the animation flag after applying it
        localStorage.removeItem('story_to_animate');
    }

    // Determine completion status
    let completionStatus = 'locked';
    if (userStoryData.completed) {
        completionStatus = 'completed';
        console.log(`Story ${storyId} is completed`);
    } else if (isStoryUnlocked(storyId)) {
        completionStatus = 'unlocked';
        console.log(`Story ${storyId} is unlocked`);
        
        // Check if this is the next story to complete
        if (isNextStoryToComplete(storyId)) {
            console.log(`Story ${storyId} is the next to complete`);
            nodeContainer.classList.add('next-to-complete');
        }
    } else {
        console.log(`Story ${storyId} is locked`);
    }

    // Add completion status as a data attribute for easier debugging
    nodeContainer.setAttribute('data-status', completionStatus);

    // Create completion status icon
    const statusIcon = document.createElement('div');
    statusIcon.className = 'completion-status-icon';
    statusIcon.innerHTML = `
        <svg class="locked-lock-icon" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="display: ${completionStatus === 'locked' ? 'block' : 'none'}">
            <g id="Iconly/Bold/Lock" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                <g id="Lock" transform="translate(3.500000, 2.000000)" fill="#42535F" fill-rule="nonzero">
                    <path d="M8.48475792,0 C11.5534967,0 14.0227137,2.41478684 14.0227137,5.39600517 L14.0227137,5.39600517 L14.0227137,6.92934513 C15.7450687,7.46695816 17,9.02613535 17,10.8884031 L17,10.8884031 L17,15.8253006 C17,18.1307761 15.0886432,20 12.7322176,20 L12.7322176,20 L4.26879857,20 C1.91135684,20 0,18.1307761 0,15.8253006 L0,15.8253006 L0,10.8884031 C0,9.02613535 1.2559474,7.46695816 2.97728631,6.92934513 L2.97728631,6.92934513 L2.97728631,5.39600517 C2.9874477,2.41478684 5.45666467,0 8.48475792,0 Z M8.49491931,11.384279 C8.00717274,11.384279 7.61087866,11.7718374 7.61087866,12.2488324 L7.61087866,12.2488324 L7.61087866,14.4549339 C7.61087866,14.9418662 8.00717274,15.3294246 8.49491931,15.3294246 C8.99282726,15.3294246 9.38912134,14.9418662 9.38912134,14.4549339 L9.38912134,14.4549339 L9.38912134,12.2488324 C9.38912134,11.7718374 8.99282726,11.384279 8.49491931,11.384279 Z M8.50508069,1.73904402 C6.44231919,1.73904402 4.76569038,3.36877671 4.75552899,5.37613038 L4.75552899,5.37613038 L4.75552899,6.71370367 L12.244471,6.71370367 L12.244471,5.39600517 C12.244471,3.3787141 10.5678422,1.73904402 8.50508069,1.73904402 Z"></path>
                </g>
            </g>
        </svg>

        <svg class="unlocked-lock-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: ${completionStatus === 'unlocked' ? 'block' : 'none'}">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M19.9331 7.41602H19.9221L18.5521 7.43602C18.1381 7.44102 17.8071 7.78202 17.8131 8.19602C17.8191 8.60602 18.1531 8.93602 18.5631 8.93602H18.5741L19.9441 8.91602C20.3581 8.91002 20.6891 8.56902 20.6831 8.15502C20.6771 7.74502 20.3431 7.41602 19.9331 7.41602Z" fill="#42535F"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M17.7577 6.20598C17.9527 6.20598 18.1477 6.13098 18.2947 5.97898L19.2507 4.99998C19.5397 4.70398 19.5337 4.22898 19.2377 3.93898C18.9417 3.65198 18.4667 3.65498 18.1767 3.95298L17.2207 4.93298C16.9317 5.22798 16.9377 5.70298 17.2337 5.99298C17.3797 6.13498 17.5687 6.20598 17.7577 6.20598Z" fill="#42535F"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M11.9769 14.2715V16.4315C11.9769 16.8515 11.6369 17.1815 11.2269 17.1815C10.8169 17.1815 10.4769 16.8515 10.4769 16.4315V14.2715C10.4769 13.8615 10.8169 13.5215 11.2269 13.5215C11.6369 13.5215 11.9769 13.8615 11.9769 14.2715ZM17.1469 9.43147C16.4269 9.09147 15.5869 9.09147 13.9169 9.09147H8.52689C8.15689 9.09147 7.82689 9.09147 7.52689 9.10147V7.49847C7.56089 5.48147 9.16589 3.88047 11.1799 3.85547C12.4939 3.81947 13.7639 4.55047 14.4329 5.70947C14.6399 6.06847 15.0989 6.19247 15.4579 5.98547C15.8159 5.77947 15.9399 5.32047 15.7329 4.96147C14.8039 3.34947 13.0799 2.35547 11.2229 2.35547H11.1619C8.33089 2.39147 6.07489 4.63947 6.02689 7.48647V9.20147C5.75689 9.25147 5.52689 9.33147 5.30689 9.43147C4.57689 9.79147 4.00689 10.3615 3.66689 11.0815C3.31689 11.7915 3.31689 12.6315 3.31689 14.3015V16.4315C3.31689 18.1015 3.31689 18.9415 3.66689 19.6615C4.01689 20.3815 4.59689 20.9615 5.30689 21.2915C6.01689 21.6415 6.85689 21.6415 8.52689 21.6415H13.9169C15.5969 21.6415 16.4269 21.6415 17.1469 21.3015C17.8569 20.9615 18.4369 20.3815 18.7869 19.6615C19.1269 18.9415 19.1269 18.1015 19.1269 16.4315V14.3015C19.1269 12.6315 19.1269 11.7915 18.7869 11.0815C18.4469 10.3615 17.8769 9.79147 17.1469 9.43147Z" fill="#42535F"/>
        </svg>

        <svg class="completed-medal-icon" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: ${completionStatus === 'completed' ? 'block' : 'none'}">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M12.5647 8.45312C8.96775 8.45312 6.04175 11.3791 6.04175 14.9751C6.04175 18.5721 8.96775 21.4991 12.5647 21.4991C16.1627 21.4991 19.0887 18.5721 19.0887 14.9751C19.0887 11.3791 16.1627 8.45312 12.5647 8.45312Z" fill="#42535F"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M12.0552 6.96965C12.2834 6.95506 12.4282 6.70766 12.3171 6.5077L10.3978 3.05341C10.2128 2.71941 9.85977 2.51141 9.47777 2.51141H6.89277C6.51377 2.51141 6.17377 2.70641 5.98277 3.03441C5.79277 3.36041 5.78977 3.75241 5.97677 4.08241L8.1448 7.91915C8.22914 8.06841 8.42093 8.11628 8.5693 8.03041C9.60824 7.4291 10.7913 7.05042 12.0552 6.96965Z" fill="#42535F"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M19.0491 4.032C19.2141 3.703 19.1971 3.321 19.0051 3.008C18.8121 2.695 18.4781 2.508 18.1111 2.507L15.6831 2.5H15.6801C15.2801 2.5 14.9201 2.722 14.7391 3.081L13.0016 6.54355C12.9031 6.73983 13.0421 6.97286 13.2609 6.99162C14.4894 7.09696 15.6385 7.47854 16.647 8.07667C16.8009 8.168 17.0024 8.11384 17.0826 7.9538L19.0491 4.032Z" fill="#42535F"/>
        </svg>
    `;
    nodeContainer.appendChild(statusIcon);

    // Create title
    const title = document.createElement('h1');
    title.className = 'stage-title';
    title.textContent = storyData.title || `Story ${storyIndex}`;
    nodeContainer.appendChild(title);

    // Create stage number container
    const stageNumberContainer = document.createElement('div');
    stageNumberContainer.className = 'stage-number-container';
    stageNumberContainer.innerHTML = `STAGE <span class="stage-number">1</span> - <span class="story-number">${storyIndex}</span>`;
    nodeContainer.appendChild(stageNumberContainer);

    // Create story book container
    const storyBookContainer = document.createElement('div');
    storyBookContainer.className = 'story-book-container';
    
    // Add book aesthetic line
    const bookLine = document.createElement('div');
    bookLine.className = 'book-aesthetic-line';
    storyBookContainer.appendChild(bookLine);
    
    // Add cover image if available
    if (storyData.cover_image) {
        const coverImage = document.createElement('img');
        // Replace [character] with the actual character
        const imagePath = storyData.cover_image.replace('[character]', character);
        coverImage.src = imagePath;
        coverImage.alt = `${storyData.title} Cover`;
        coverImage.className = 'story-book-cover-image';
        coverImage.onerror = function() {
            console.log(`Failed to load cover image: ${this.src}`);
            this.src = 'assets/images/default_placeholder.png';
        };
        storyBookContainer.appendChild(coverImage);
    }
    
    nodeContainer.appendChild(storyBookContainer);

    // Add click event if the story is unlocked or completed
    if (completionStatus !== 'locked') {
        nodeContainer.classList.add('clickable');
        nodeContainer.addEventListener('click', () => startStory(storyId));
    }

    // Add node shadow
    const nodeShadow = document.createElement('div');
    nodeShadow.className = 'node-shadow';
    
    // Append everything to the wrapper
    nodeWrapper.appendChild(nodeContainer);
    nodeWrapper.appendChild(nodeShadow);
    
    return nodeWrapper;
}

// Helper function to check if a story is unlocked
function isStoryUnlocked(storyId) {
    console.log(`Checking if story ${storyId} is unlocked...`);
    
    // Story 1 is always unlocked
    if (storyId === 'story1') {
        console.log('Story1 is always unlocked');
        return true;
    }
    
    // Get the story number from the ID
    const storyNumber = parseInt(storyId.replace('story', ''));
    
    // Previous story must be completed to unlock the next one
    const previousStoryId = `story${storyNumber - 1}`;
    const isUnlocked = userManager.userData.stories[previousStoryId]?.completed === true;
    
    console.log(`Previous story ${previousStoryId} completed: ${userManager.userData.stories[previousStoryId]?.completed}`);
    console.log(`Story ${storyId} unlocked: ${isUnlocked}`);
    
    return isUnlocked;
}

// Helper function to check if a story is the next one to complete
function isNextStoryToComplete(storyId) {
    // If the story is already completed, it's not the next to complete
    if (userManager.userData.stories[storyId]?.completed) {
        return false;
    }
    
    // Get all story IDs
    const storyIds = Object.keys(userManager.userData.stories).sort();
    
    // Find the first incomplete story
    for (const id of storyIds) {
        if (!userManager.userData.stories[id].completed) {
            return id === storyId;
        }
    }
    
    return false;
}

function completeStory() {
    const currentStoryId = userManager.userData.progress.current_story;
    
    // Mark current story as completed in user data
    userManager.userData.stories[currentStoryId].completed = true;
    userManager.saveUserData();
    
    // Calculate progress
    const completedStories = Object.values(userManager.userData.stories)
        .filter(story => story.completed).length;
    const totalStories = Object.keys(userManager.userData.stories).length;
    const progressPercentage = (completedStories / totalStories) * 100;
    
    // Update progress in user data
    userManager.userData.progress.chapter1_progress = progressPercentage;
    userManager.saveUserData();
    
    // Store the current story ID for animation
    // The journey-map.js will handle finding the next story to unlock
    localStorage.setItem('story_to_animate', currentStoryId);
    
    // Redirect to practice page
    window.location.href = 'practice.html';
}

// Helper function to find the next story that should be unlocked
function findNextStoryToUnlock() {
    // Get current character and storyline
    const character = userManager.userData.progress.selectedCharacter;
    const storyline = userManager.userData.progress.selectedStoryline;
    
    // Get structure stories
    if (!userManager.structureData || 
        !userManager.structureData.chapter_1 || 
        !userManager.structureData.chapter_1.storylines || 
        !userManager.structureData.chapter_1.storylines[storyline]) {
        console.error('Missing storyline data:', storyline);
        return null;
    }
    
    const structureStories = userManager.structureData.chapter_1.storylines[storyline].stories;
    
    // Get all story IDs in order
    const storyIds = Object.keys(structureStories);
    
    // Find the first incomplete story
    for (const storyId of storyIds) {
        if (!userManager.userData.stories[storyId].completed) {
            return storyId;
        }
    }
    
    return null;
}

function goToJourneyMap() {
    // Navigate to the journey map page
    window.location.href = 'index.html';
}

// Function to start a story
function startStory(storyId) {
    console.log('Starting story:', storyId);
    
    // Update current story in user data
    if (userManager.userData) {
        userManager.userData.progress.current_story = storyId;
        userManager.saveUserData();
        console.log('Updated current story in user data');
    }
    
    // Redirect to story page
    window.location.href = 'story.html';
}

// === PAGE INITIALIZATION ===
function initializeAppropriateView() {
    // Check which page we're on and initialize accordingly
    if (document.querySelector('.story-page')) {
        // Story page now uses story.js
        console.log('Story page loaded');
    } else if (document.querySelector('.journey-page')) {
        initJourneyMap();
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

// Helper function to update stage name color based on progress bar overlap
function updateStageNameColor() {
    const progressBar = document.querySelector('.j-header-progress-bar');
    const stageName = document.querySelector('.j-header-stage-name');
    const container = document.querySelector('.j-header-progress-container');
    
    if (!progressBar || !stageName || !container) return;
    
    // Get the center point of the stage name
    const containerRect = container.getBoundingClientRect();
    const stageNameCenter = containerRect.width / 2;
    
    // Get the right edge of the progress bar
    // First try to get the computed width if the transition is in progress
    const computedStyle = window.getComputedStyle(progressBar);
    const computedWidth = parseFloat(computedStyle.width);
    
    // If we can get the computed width, use it, otherwise calculate from the style percentage
    let progressBarRight;
    if (!isNaN(computedWidth)) {
        progressBarRight = computedWidth;
    } else {
        // Fall back to calculating from the style percentage
        const widthPercentage = parseFloat(progressBar.style.width) || 0;
        progressBarRight = (widthPercentage / 100) * containerRect.width;
    }
    
    // Check if the progress bar has passed the center of the container
    // We add a small buffer (10px) to ensure the text changes color slightly before the bar reaches it
    if (progressBarRight >= stageNameCenter - 10) {
        stageName.classList.add('overlapped');
    } else {
        stageName.classList.remove('overlapped');
    }
}

// Function to update user progress
function updateUserProgress(storyId, completed = true) {
    // ... existing code ...
}