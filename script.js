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
            // Initialize default values
            const defaultProfile = {
                progress: {
                    current_story: 'story1',
                    chapter1_progress: 0,
                    selectedCharacter: UserManager.CHARACTERS.PIP,
                    selectedStoryline: UserManager.STORYLINES.UMBRELLA_RACING
                },
                stories: {},
                analytics: { worry_ratings: [] }
            };
            
            // Use a single consistent key for user data
            const storedData = localStorage.getItem('user_data');
            this.userData = storedData ? JSON.parse(storedData) : defaultProfile;
            
            // If character and storyline are selected, load the appropriate stories
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
            const character = this.userData.progress.selectedCharacter;
            const storyline = this.userData.progress.selectedStoryline;
            
            console.log(`Loading stories for character: ${character}, storyline: ${storyline}`);
            
            // Load structure data if not already loaded
            if (!this.structureData) {
                await this.loadStoryStructure();
            }
            
            // Debug log the structure data
            console.log('Structure data:', this.structureData);
            
            // Validate storyline exists in structure
            if (!this.structureData?.chapter_1?.storylines?.[storyline]?.stories) {
                console.error(`Storyline "${storyline}" or its stories not found in structure data`);
                return { error: "This storyline is coming soon! Please select a different option." };
            }
            
            // Try to load the stories data
            try {
                const storiesResponse = await fetch(`data/stories/${character}_${storyline}.json`);
                if (!storiesResponse.ok) {
                    console.warn(`No story content found for ${character} with storyline ${storyline}`);
                    return { error: "Stories for this character and storyline are coming soon! Please select a different option." };
                }
                
                const storiesData = await storiesResponse.json();
                
                if (!storiesData || !storiesData.stories) {
                    console.error('Invalid story data format');
                    return { error: "There was a problem loading the story content. Please try a different option." };
                }
                
                // Debug log the stories data
                console.log('Stories data:', storiesData);
                
                // Get structure stories and validate
                const structureStories = this.structureData.chapter_1.storylines[storyline].stories;
                if (!structureStories || typeof structureStories !== 'object') {
                    console.error('Invalid structure stories format');
                    return { error: "There was a problem with the story structure. Please try a different option." };
                }
                
                // Merge story content with structure data
                const mergedStories = {};
                
                // First, validate that we have matching stories
                const storyIds = Object.keys(storiesData.stories);
                console.log('Story IDs to process:', storyIds);
                
                storyIds.forEach(storyId => {
                    const structureStory = structureStories[storyId];
                    const contentStory = storiesData.stories[storyId];
                    
                    if (!structureStory) {
                        console.log(`Story ${storyId} not found in structure data, skipping`);
                        return;
                    }
                    
                    if (!contentStory) {
                        console.log(`Story ${storyId} not found in content data, skipping`);
                        return;
                    }
                    
                    mergedStories[storyId] = {
                        ...contentStory,
                        title: structureStory.title || '',
                        description: structureStory.description || '',
                        cover_image: structureStory.cover_image || '',
                        practice: structureStory.practice || null,
                        completed: false
                    };
                });
                
                if (Object.keys(mergedStories).length === 0) {
                    console.error('No stories were successfully merged');
                    return { error: "No stories are available for this selection. Please try a different option." };
                }
                
                // Update the stories in userData
                this.userData.stories = mergedStories;
                
                // Ensure story progress is maintained if there's local data
                const storedData = localStorage.getItem('user_data');
                const localData = storedData ? JSON.parse(storedData) : null;
                
                if (localData && localData.stories) {
                    Object.keys(localData.stories).forEach(storyId => {
                        if (this.userData.stories[storyId]) {
                            this.userData.stories[storyId].completed = localData.stories[storyId].completed || false;
                        }
                    });
                }
                
                return true;
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
        // Validate inputs
        if (!this.isValidCharacter(character)) {
            console.error('Invalid character selected:', character);
            return { error: "Invalid character selected. Please choose a valid character." };
        }
        if (!this.isValidStoryline(storyline)) {
            console.error('Invalid storyline selected:', storyline);
            return { error: "Invalid storyline selected. Please choose a valid storyline." };
        }

        this.userData.progress.selectedCharacter = character;
        this.userData.progress.selectedStoryline = storyline;
        
        // Load the appropriate stories
        const result = await this.loadStoriesForSelection();
        
        // Save the updated user data
        this.saveUserData();
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
            // Ensure required objects exist
            if (!this.userData.stories) {
                this.userData.stories = {
                    story1: { completed: false }
                };
            }
            
            if (!this.userData.progress) {
                this.userData.progress = {
                    current_story: 'story1',
                    chapter1_progress: 0,
                    selectedCharacter: this.userData.character || 'pip',
                    selectedStoryline: 'umbrella_racing'
                };
            }
            
            if (!this.userData.analytics) {
                this.userData.analytics = { 
                    worry_ratings: [],
                    last_session: new Date().toISOString()
                };
            }
            
            // Create a deep copy of userData to avoid reference issues
            const dataToSave = JSON.parse(JSON.stringify(this.userData));
            
            // Ensure stories have the correct format
            if (dataToSave.stories) {
                Object.keys(dataToSave.stories || {}).forEach(storyId => {
                    if (!dataToSave.stories[storyId].hasOwnProperty('completed')) {
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
        }
    }

    getCurrentStory() {
        if (!this.userData || !this.userData.progress || !this.userData.stories) {
            console.error('Missing user data, progress, or stories');
            return null;
        }
        
        const currentStoryId = this.userData.progress.current_story;
        console.log('Getting current story:', currentStoryId);
        
        // Get the story from user data
        const userStory = this.userData.stories[currentStoryId];
        
        if (!userStory) {
            console.error('Story not found in user data:', currentStoryId);
            return null;
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
            
            console.log('Structure data:', this.structureData);
            console.log('Looking for storyline:', storyline);
            console.log('Looking for story:', currentStoryId);
            
            // Get the practice data from the structure
            if (this.structureData.chapter_1 && 
                this.structureData.chapter_1.storylines && 
                this.structureData.chapter_1.storylines[storyline] && 
                this.structureData.chapter_1.storylines[storyline].stories && 
                this.structureData.chapter_1.storylines[storyline].stories[currentStoryId]) {
                
                const structureStory = this.structureData.chapter_1.storylines[storyline].stories[currentStoryId];
                
                if (structureStory && structureStory.practice) {
                    // Merge the practice data into the user story
                    userStory.practice = structureStory.practice;
                    console.log('Added practice data to story:', structureStory.practice);
                } else {
                    console.error('Practice data not found in structure for story:', currentStoryId);
                }
            } else {
                console.error('Story structure path not found:', `chapter_1.storylines.${storyline}.stories.${currentStoryId}`);
            }
        } catch (error) {
            console.error('Error getting practice data:', error);
        }
        
        return userStory;
    }

    updateUserProfile(profileData) {
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
        } else {
            // Create a deep copy of the current userData
            const currentData = JSON.parse(JSON.stringify(this.userData));
            
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
        }
        
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
        initWelcomePage();
    } else if (document.getElementById('onboardingForm')) {
        // Check if user has completed onboarding
        if (userManager.userData?.name) {
            window.location.href = 'index.html';
            return;
        }
        initOnboardingForm();
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

function initWelcomePage() {
    // Add fade-in animation to text elements
    const h1 = document.querySelector('.welcome-page h1');
    const h3 = document.querySelector('.welcome-page h3');
    
    if (h1) {
        h1.style.opacity = '0';
        h1.style.animation = 'fadeIn 0.6s ease-in forwards';
    }
    
    if (h3) {
        h3.style.opacity = '0';
        h3.style.animation = 'fadeIn 0.6s ease-in forwards 1s';
    }

    // After 4 seconds, redirect to onboarding
    setTimeout(() => {
        window.location.href = 'onboarding.html';
    }, 4000);
}

// === PAGE DETECTION AND INITIALIZATION ===
function initOnboardingForm() {
    // Add event listener to the form submission
    document.getElementById('onboardingForm').addEventListener('submit', handleFormSubmit);
    
    // Initialize welcome animation if we're on step 1
    if (document.querySelector('.step.active').id === 'step1') {
        initWelcomeAnimation();
    }
}

function showError(input, message) {
    input.classList.add('error');
    
    // Find or create error message element
    let errorDiv = input.nextElementSibling;
    if (!errorDiv || !errorDiv.classList.contains('error-message')) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        input.parentNode.insertBefore(errorDiv, input.nextElementSibling);
    }
    
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
}

function clearError(input) {
    input.classList.remove('error');
    const errorDiv = input.nextElementSibling;
    if (errorDiv && errorDiv.classList.contains('error-message')) {
        errorDiv.classList.remove('show');
    }
    input.style.borderColor = '#bfd5c9';
}

function validateInput(input) {
    const value = input.value.trim();
    
    // Check if empty
    if (!value) {
        showError(input, 'This field is required');
        return false;
    }
    
    // Check for numbers and special characters
    if (input.type === 'text' && !/^[a-zA-Z\s]*$/.test(value)) {
        showError(input, 'Please use only letters and spaces');
        return false;
    }
    
    clearError(input);
    return true;
}

// Add input event listeners to all text inputs
document.addEventListener('DOMContentLoaded', function() {
    const textInputs = document.querySelectorAll('input[type="text"]');
    textInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            // Remove any non-letter characters as they're typed
            this.value = this.value.replace(/[^a-zA-Z\s]/g, '');
            // Clear any existing errors when the user starts typing
            clearError(this);
        });
        
        input.addEventListener('blur', function() {
            // Only validate on blur if the input has a value
            if (this.value.trim()) {
                validateInput(this);
            }
        });
    });
});

// Add pronoun sets to our data structure
function initializeUserData() {
    if (!localStorage.getItem('user_data')) {
        const initialData = {
            gender: '',
            pronouns: {
                subject: '',    // he/she/they
                object: '',     // him/her/them
                possessive: '', // his/her/their
            },
            character: '',
            characterName: '',
            hobbies: [],
            adventure: '',
            mood: '',
            progress: 0
        };
        localStorage.setItem('user_data', JSON.stringify(initialData));
    }
    return JSON.parse(localStorage.getItem('user_data'));
}

// Function to set pronouns based on gender
function updatePronouns(gender) {
    const pronounSets = {
        'boy': {
            subject: 'he',
            object: 'him',
            possessive: 'his'
        },
        'girl': {
            subject: 'she',
            object: 'her',
            possessive: 'her'
        },
        'other': {
            subject: 'they',
            object: 'them',
            possessive: 'their'
        }
    };

    const userData = JSON.parse(localStorage.getItem('user_data'));
    userData.pronouns = pronounSets[gender];
    localStorage.setItem('user_data', JSON.stringify(userData));

    // Update any pronoun placeholders in the UI
    updatePronounPlaceholders();
}

// Function to update pronoun placeholders in the UI
function updatePronounPlaceholders() {
    const userData = JSON.parse(localStorage.getItem('user_data'));
    if (!userData || !userData.pronouns) return;

    // Update character name title
    const characterNameTitle = document.querySelector('#step4 h1');
    if (characterNameTitle) {
        characterNameTitle.textContent = `What's ${userData.pronouns.possessive} Name?`;
    }

    // Update all pronoun spans in the document
    document.querySelectorAll('.character-pronoun').forEach(span => {
        const type = span.dataset.pronounType || 'subject'; // default to subject pronoun
        span.textContent = userData.pronouns[type];
    });
}

// Update user data in localStorage
function updateUserData(key, value) {
    const userData = JSON.parse(localStorage.getItem('user_data')) || initializeUserData();
    userData[key] = value;
    localStorage.setItem('user_data', JSON.stringify(userData));
    
    // If updating character name, refresh all name placeholders
    if (key === 'characterName') {
        updateNamePlaceholders();
    }
}

// New function to update name placeholders
function updateNamePlaceholders() {
    const userData = JSON.parse(localStorage.getItem('user_data'));
    if (!userData || !userData.characterName) return;

    // Update all character name placeholders
    document.querySelectorAll('.character-name-placeholder').forEach(element => {
        // Check if we need to add possessive 's
        if (element.dataset.possessive === 'true') {
            element.textContent = `${userData.characterName}'s`;
        } else {
            element.textContent = userData.characterName;
        }
    });
}

// Modify the nextStep function to handle pronoun updates
function nextStep(current, next) {
    // Only validate if moving forward (next > current)
    if (next > current) {
        // Validate current step
        let currentStep = document.getElementById(`step${current}`);
        let inputs = currentStep.querySelectorAll('input[required], select[required]');
        let valid = true;
        
        inputs.forEach(input => {
            if (input.type === 'radio' || input.type === 'checkbox') {
                let name = input.name;
                let inputGroup = currentStep.querySelectorAll(`input[name="${name}"]`);
                let checked = false;
                
                inputGroup.forEach(input => {
                    if (input.checked) checked = true;
                });
                
                if (!checked && input.required) {
                    valid = false;
                    // Find the input group container and show error
                    const container = input.closest('.form-group');
                    showError(container, "Please select an option");
                }
            } else {
                if (!validateInput(input)) {
                    valid = false;
                }
            }
        });
        
        if (!valid) {
            return;
        }
        
        // Clear any remaining errors before moving to next step
        inputs.forEach(input => clearError(input));

        // Save form data based on current step
        switch(current) {
            case 2:
                const gender = document.querySelector('input[name="gender"]:checked')?.value;
                if (gender) {
                    updateUserData('gender', gender);
                    updatePronouns(gender); // Update pronouns when gender is selected
                }
                break;
            case 3:
                const character = document.querySelector('input[name="character"]:checked')?.value;
                if (character) updateUserData('character', character);
                break;
            case 4:
                const characterName = document.getElementById('characterName').value;
                if (characterName) {
                    updateUserData('characterName', characterName);
                    // Name placeholders will be updated by updateUserData
                }
                break;
            case 5:
                const hobbies = Array.from(document.querySelectorAll('input[name="hobbies"]:checked'))
                    .map(checkbox => checkbox.value);
                updateUserData('hobbies', hobbies);
                break;
            case 6:
                const adventure = document.querySelector('input[name="adventure"]:checked')?.value;
                if (adventure) updateUserData('adventure', adventure);
                break;
            case 7:
                const mood = document.querySelector('input[name="mood"]:checked')?.value;
                if (mood) updateUserData('mood', mood);
                break;
        }

        // Update progress
        const progress = (next / 7) * 100;
        updateUserData('progress', progress);
    }
    
    // Update progress bar
    const progressBar = document.querySelector('.onboarding-progress-bar');
    if (progressBar) {
        const progress = (next / 7) * 100;
        progressBar.style.width = `${progress}%`;
    }
    
    // Move to next step
    document.getElementById(`step${current}`).classList.remove('active');
    document.getElementById(`step${next}`).classList.add('active');
    
    // Update character pronoun based on gender selection
    if (current === 2 && next === 3) {
        const gender = document.querySelector('input[name="gender"]:checked')?.value;
        const pronoun = gender === 'girl' ? 'she' : 'he';
        document.querySelectorAll('.character-pronoun').forEach(el => {
            el.textContent = pronoun;
        });
    }
}

function validateInterests() {
    let interestInputs = document.querySelectorAll('input[name="interests[]"]');
    let filledInputs = Array.from(interestInputs).filter(input => input.value.trim() !== '');
    
    if (filledInputs.length < 2) {
        alert("Please add at least 2 interests before continuing.");
        return;
    }
    
    nextStep(4, 5);
}

function addInterestField() {
    let container = document.getElementById('interestsContainer');
    let newField = document.createElement('div');
    newField.className = 'interest-item';
    newField.innerHTML = `
        <input type="text" name="interests[]" placeholder="I love...">
        <button type="button" class="add-interest" onclick="addInterestField()">+</button>
    `;
    
    // Remove the + button from previous field
    let lastField = container.lastElementChild;
    lastField.querySelector('.add-interest').remove();
    
    container.appendChild(newField);
}

// Create a loading overlay for form submission
function showLoadingOverlay() {
    // Create overlay container
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    
    // Create loading spinner
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    
    // Create text message
    const message = document.createElement('p');
    message.textContent = 'We are building your story...';
    message.className = 'loading-message';
    
    // Append elements
    overlay.appendChild(spinner);
    overlay.appendChild(message);
    document.body.appendChild(overlay);
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = this;
    
    // Show loading overlay
    showLoadingOverlay();
    
    // Disable submit button to prevent multiple submissions
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
    }
    
    // Collect all form data
    const formData = new FormData(form);
    
    const profileData = {
        name: formData.get('characterName'), // Using characterName as the user's name
        gender: formData.get('gender'),
        character: formData.get('character'),
        characterName: formData.get('characterName'),
        hobbies: Array.from(formData.getAll('hobbies')),
        mood: formData.get('mood'), // Adding mood from the form
        progress: {
            selectedCharacter: formData.get('character'),
            selectedStoryline: formData.get('adventure'),
            current_story: 'story1',
            chapter1_progress: 0
        },
        stories: {
            story1: { completed: false }
        },
        analytics: {
            worry_ratings: [],
            last_session: new Date().toISOString()
        }
    };

    console.log('Saving user profile data:', profileData);

    // Add a delay to show the loading animation
    setTimeout(async () => {
        try {
            console.log('Step 1: Updating user profile');
            // Update UserManager with the new profile data
            await userManager.updateUserProfile(profileData);
            
            console.log('Step 2: Setting character and storyline');
            console.log('Selected character:', profileData.progress.selectedCharacter);
            console.log('Selected storyline:', profileData.progress.selectedStoryline);
            
            // Try to load the selected character's story content
            const result = await userManager.setCharacterAndStoryline(
                profileData.progress.selectedCharacter,
                profileData.progress.selectedStoryline
            );
            
            // Check if there was an error loading the stories
            if (result && result.error) {
                // Remove loading overlay
                const overlay = document.querySelector('.loading-overlay');
                if (overlay) {
                    overlay.remove();
                }
                
                // Show error message
                alert(result.error);
                
                // Re-enable submit button
                if (submitButton) {
                    submitButton.disabled = false;
                }
                
                return;
            }
            
            console.log('Story content loaded successfully');
            
            // Save to localStorage directly as well to ensure it's saved
            console.log('Step 3: Saving to localStorage directly');
            const userData = {
                ...profileData
            };
            localStorage.setItem('user_data', JSON.stringify(userData));
            
            console.log('User data saved successfully:', userData);
            
            // Redirect to story page
            console.log('Step 4: Redirecting to story page');
            window.location.href = 'story.html';
        } catch (error) {
            console.error('Detailed error information:', error);
            console.error('Error stack:', error.stack);
            
            // Try to save basic user data even if there's an error
            try {
                localStorage.setItem('user_data', JSON.stringify(profileData));
                console.log('Basic user data saved despite error');
            } catch (saveError) {
                console.error('Failed to save even basic user data:', saveError);
            }
            
            alert('There was a problem saving your information. Please try again.');
            
            // Remove loading overlay
            const overlay = document.querySelector('.loading-overlay');
            if (overlay) {
                overlay.remove();
            }
            
            // Re-enable submit button
            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    }, 3000);
}

// === STORY PAGE CODE ===
function initStoryPage() {
    console.log('Initializing story page...');
    
    // Ensure user data and story selection are available
    if (!userManager.userData || !userManager.userData.progress.selectedCharacter || !userManager.userData.progress.selectedStoryline) {
        console.error('Missing character or storyline selection');
        window.location.href = 'index.html';
        return;
    }
    
    // Get current story data
    const currentStoryId = userManager.userData.progress.current_story;
    console.log('Current story ID:', currentStoryId);
    
    const currentStory = userManager.getCurrentStory();
    console.log('Current story data:', currentStory);
    
    if (!currentStory || !currentStory.pages || currentStory.pages.length === 0) {
        console.error('No valid story content found!');
        window.location.href = 'index.html';
        return;
    }
    
    // Set up story variables
    window.currentPage = 1;
    window.totalPages = currentStory.pages.length;
    
    // Get story container elements
    const storyTextContainer = document.querySelector('.story-text');
    const backBtn = document.getElementById('storyBackBtn');
    const nextBtn = document.getElementById('storyNextBtn');
    
    if (!storyTextContainer || !backBtn || !nextBtn) {
        console.error('Story container elements not found!');
        return;
    }
    
    // Load the first page
    loadStoryContent(currentStory);
    
    // Set up navigation buttons
    backBtn.addEventListener('click', handleBackNavigation);
    nextBtn.addEventListener('click', handleNextNavigation);
    
    // Function to handle back navigation
    function handleBackNavigation() {
        if (window.currentPage > 1) {
            window.currentPage--;
            loadStoryContent(currentStory);
        } else {
            // If we're on the first page, go back to the journey map (home page)
            window.location.href = 'index.html';
        }
    }
    
    // Function to handle next navigation
    function handleNextNavigation() {
        if (window.currentPage < window.totalPages) {
            window.currentPage++;
            loadStoryContent(currentStory);
        } else {
            // If we're on the last page, go to practice page
            window.location.href = 'practice.html';
        }
    }
    
    // Function to load story content
    function loadStoryContent(story) {
        const storyTextContainer = document.querySelector('.story-text');
        if (!storyTextContainer) {
            console.error('Story text container not found!');
            return;
        }
        
        // Get the current page content
        const pageContent = story.pages[window.currentPage - 1];
        if (!pageContent) {
            console.error('Page content not found!');
            return;
        }
        
        console.log('Page content:', pageContent);
        
        // Get navigation buttons
        const navButtons = document.querySelector('.story-nav-buttons');
        
        // Clear existing content while preserving navigation buttons
        if (navButtons) {
            storyTextContainer.innerHTML = '';
            storyTextContainer.appendChild(navButtons);
        } else {
            console.error('Navigation buttons not found!');
        }
        
        // Create content wrapper without animation
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'page';
        
        // Add title based on page number
        if (window.currentPage === 1) {
            const titleElement = document.createElement('h1');
            titleElement.textContent = story.title;
            contentWrapper.appendChild(titleElement);
        } else {
            const titleElement = document.createElement('h4');
            titleElement.textContent = story.title;
            contentWrapper.appendChild(titleElement);
        }
        
        // Add story text
        const textElement = document.createElement('p');
        
        // Extract the text content based on the page structure
        let pageText = '';
        if (typeof pageContent === 'string') {
            pageText = pageContent;
        } else if (pageContent && typeof pageContent === 'object') {
            if (pageContent.text) {
                pageText = pageContent.text;
            } else {
                console.error('Page content has no text property:', pageContent);
                pageText = 'Story content unavailable.';
            }
        } else {
            console.error('Unexpected page content format:', pageContent);
            pageText = 'Story content unavailable.';
        }
        
        // Personalize the text and add it to the element
        textElement.innerHTML = personalizeStoryText(pageText);
        contentWrapper.appendChild(textElement);
        
        // Insert content before navigation buttons
        storyTextContainer.insertBefore(contentWrapper, navButtons);
        
        // Update navigation buttons
        const backBtn = document.getElementById('storyBackBtn');
        const nextBtn = document.getElementById('storyNextBtn');
        
        // Always show back button with full opacity since it now has a function on the first page
        if (backBtn) {
            backBtn.style.visibility = 'visible';
            backBtn.style.opacity = '1';
            // Remove the disabled attribute if it exists
            backBtn.disabled = false;
        }
        
        if (nextBtn) {
            if (window.currentPage === window.totalPages) {
                nextBtn.innerHTML = `
                    <span>Practice</span>
                    <svg class="story-next-arrow" width="45px" height="45px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                        <g id="Iconly/Bold/Arrow---Right" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                            <g id="Arrow---Right" transform="translate(3.000000, 6.000000)" fill="#fff" fill-rule="nonzero">
                                <path d="M7.83655568,6.36070466 L7.8350323,6.00660914 C7.8350323,4.53497338 7.92121308,3.19331742 8.05102968,2.31870755 L8.16475558,1.77483018 C8.22802754,1.48678171 8.31120835,1.15880301 8.39793457,0.991371397 C8.71538527,0.378924178 9.33610502,0 10.0004606,0 L10.0582781,0 C10.4913637,0.0143198091 11.4011709,0.394345511 11.4011709,0.407563797 C12.8651531,1.02183092 15.6895424,2.87571834 16.9940026,4.19738844 L17.3730714,4.59418673 C17.4723361,4.70172939 17.5838596,4.82900679 17.6530951,4.92821737 C17.884365,5.23444098 18,5.61336516 18,5.99228933 C18,6.41527446 17.8701834,6.80851845 17.6247318,7.13016339 L17.2352725,7.55047018 L17.2352725,7.55047018 L17.1480103,7.6401689 C15.9643883,8.9234441 12.8738803,11.0218469 11.2571726,11.6640352 L11.0130847,11.7575787 C10.719361,11.8628603 10.3078205,11.988434 10.0582781,12 C9.74082738,12 9.43755833,11.9261979 9.14847093,11.7807968 C8.7873844,11.5770149 8.49938789,11.2553699 8.34011709,10.8764457 C8.23866377,10.6142831 8.07939298,9.82669359 8.07939298,9.81237378 C7.93338076,9.01825987 7.84871691,7.76518207 7.83655568,6.36070466 Z M1.77635684e-15,5.99955939 C1.77635684e-15,5.1612998 0.673082751,4.48165963 1.50325451,4.48165963 L5.20248239,4.80881219 C5.85374723,4.80881219 6.38174083,5.3419497 6.38174083,5.99955939 C6.38174083,6.65827061 5.85374723,7.19030659 5.20248239,7.19030659 L1.50325451,7.51745915 C0.673082751,7.51745915 1.77635684e-15,6.83781898 1.77635684e-15,5.99955939 Z"></path>
                            </g>
                        </g>
                    </svg>
                `;
            } else {
                nextBtn.innerHTML = `
                    <svg class="story-next-arrow" width="45px" height="45px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                        <g id="Iconly/Bold/Arrow---Right" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                            <g id="Arrow---Right" transform="translate(3.000000, 6.000000)" fill="#fff" fill-rule="nonzero">
                                <path d="M7.83655568,6.36070466 L7.8350323,6.00660914 C7.8350323,4.53497338 7.92121308,3.19331742 8.05102968,2.31870755 L8.16475558,1.77483018 C8.22802754,1.48678171 8.31120835,1.15880301 8.39793457,0.991371397 C8.71538527,0.378924178 9.33610502,0 10.0004606,0 L10.0582781,0 C10.4913637,0.0143198091 11.4011709,0.394345511 11.4011709,0.407563797 C12.8651531,1.02183092 15.6895424,2.87571834 16.9940026,4.19738844 L17.3730714,4.59418673 C17.4723361,4.70172939 17.5838596,4.82900679 17.6530951,4.92821737 C17.884365,5.23444098 18,5.61336516 18,5.99228933 C18,6.41527446 17.8701834,6.80851845 17.6247318,7.13016339 L17.2352725,7.55047018 L17.2352725,7.55047018 L17.1480103,7.6401689 C15.9643883,8.9234441 12.8738803,11.0218469 11.2571726,11.6640352 L11.0130847,11.7575787 C10.719361,11.8628603 10.3078205,11.988434 10.0582781,12 C9.74082738,12 9.43755833,11.9261979 9.14847093,11.7807968 C8.7873844,11.5770149 8.49938789,11.2553699 8.34011709,10.8764457 C8.23866377,10.6142831 8.07939298,9.82669359 8.07939298,9.81237378 C7.93338076,9.01825987 7.84871691,7.76518207 7.83655568,6.36070466 Z M1.77635684e-15,5.99955939 C1.77635684e-15,5.1612998 0.673082751,4.48165963 1.50325451,4.48165963 L5.20248239,4.80881219 C5.85374723,4.80881219 6.38174083,5.3419497 6.38174083,5.99955939 C6.38174083,6.65827061 5.85374723,7.19030659 5.20248239,7.19030659 L1.50325451,7.51745915 C0.673082751,7.51745915 1.77635684e-15,6.83781898 1.77635684e-15,5.99955939 Z"></path>
                            </g>
                        </g>
                    </svg>
                `;
            }
        }
        
        // Load story image
        const storyImage = document.getElementById('storyImage');
        if (storyImage) {
            // Always use the correct path structure based on the actual files
            const character = userManager.userData.progress.selectedCharacter;
            const storyline = userManager.userData.progress.selectedStoryline;
            const storyNumber = currentStoryId.replace('story', '');
            
            // Construct path following the exact structure found in the filesystem:
            // assets/images/pip/chapter_1/umbrella_racing/story1/image_1.jpg
            const imagePath = `assets/images/${character}/chapter_1/${storyline}/story${storyNumber}/image_${window.currentPage}.jpg`;
            
            console.log('Loading image from:', imagePath);
            storyImage.src = imagePath;
            storyImage.onerror = function() {
                console.log(`Failed to load story image: ${this.src}`);
                
                // Log the actual URL that failed to load
                const failedUrl = new URL(this.src, window.location.href);
                console.log('Full failed URL:', failedUrl.href);
                
                // Use default placeholder
                this.src = 'assets/images/default_placeholder.png';
            };
        }
    }
}

// === USER PROGRESS HANDLING ===
function loadUserProgress() {
    // Keep only story progression logic
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed');
    if (hasCompletedOnboarding) {
        initJourneyMap();
    }
}

function updateUserProgress() {
    // Mark session as complete
    localStorage.setItem('session1_complete', 'true');
}

// === JOURNEY MAP HANDLING ===
async function initJourneyMap() {
    if (!document.querySelector('.journey-page')) return;
    
    // Ensure user data is loaded
    if (!userManager.userData) {
        await userManager.loadUserData();
    }
    
    // Check user data again after loading
    if (!userManager.userData || !userManager.userData.stories) {
        console.error('No user data or stories found');
        // Redirect to login if no valid user data
        window.location.href = 'login.html';
        return;
    }

    // Show appropriate welcome message
    const firstVisit = document.querySelector('.first-visit');
    const returnVisit = document.querySelector('.return-visit');
    const hasVisitedBefore = localStorage.getItem('has_visited_journey');

    if (!hasVisitedBefore) {
        firstVisit.classList.add('show');
        localStorage.setItem('has_visited_journey', 'true');
    } else {
        returnVisit.classList.add('show');
    }

    // Calculate chapter progress based on userData
    const completedStories = Object.values(userManager.userData.stories)
        .filter(story => story.completed).length;
    const totalStories = Object.keys(userManager.userData.stories).length;
    const progressPercentage = (completedStories / totalStories) * 100;
    
    // Update progress bar
    const progressBar = document.querySelector('.chapter-progress-bar');
    if (progressBar) {
        progressBar.style.width = `${Math.max(5, progressPercentage)}%`;
    }
    
    // Get the container for story nodes
    const storyNodesContainer = document.querySelector('.story-nodes-container');
    if (!storyNodesContainer) return;

    // Clear existing story nodes
    storyNodesContainer.innerHTML = '';
    
    // Get current character and storyline
    const character = userManager.userData.progress.selectedCharacter;
    const storyline = userManager.userData.progress.selectedStoryline;
    const structureStories = userManager.structureData.chapter_1.storylines[storyline].stories;
    
    // Create story nodes
    let foundNextToComplete = false;
    Object.entries(structureStories).forEach(([storyId, storyData]) => {
        const story = userManager.userData.stories[storyId];
        const isCompleted = story?.completed || false;
        
        // Determine node status
        let status;
        if (isCompleted) {
            status = 'completed';
        } else if (!foundNextToComplete) {
            status = 'next-to-complete';
            foundNextToComplete = true;
        } else {
            status = 'locked';
        }

        // Create story node
        const storyNode = document.createElement('div');
        storyNode.className = 'story-node';
        storyNode.id = storyId;
        storyNode.setAttribute('data-status', status);

        // Create cover image container
        const coverContainer = document.createElement('div');
        coverContainer.className = 'story-cover';
        
        // Create and set up image
        const coverImage = document.createElement('img');
        const imagePath = storyData.cover_image.replace('[character]', character);
        coverImage.src = imagePath;
        coverImage.alt = storyData.title;
        
        // Add error handling for cover image
        coverImage.onerror = function() {
            console.log(`Failed to load cover image: ${this.src}`);
            this.src = 'assets/images/default_placeholder.png';
        };
        
        // Create title and button
        const title = document.createElement('h3');
        title.textContent = storyData.title;
        
        const button = document.createElement('button');
        if (status === 'locked') {
            button.textContent = 'Locked';
            button.disabled = true;
            button.style.pointerEvents = 'none';
        } else {
            button.textContent = status === 'completed' ? 'Read Again' : 'Begin Adventure';
            button.onclick = () => startStory(storyId);
        }

        // Assemble the node
        coverContainer.appendChild(coverImage);
        storyNode.appendChild(coverContainer);
        storyNode.appendChild(title);
        storyNode.appendChild(button);
        
        // Add to container
        storyNodesContainer.appendChild(storyNode);
    });
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
    
    // Redirect to practice page
    window.location.href = 'practice.html';
}

function goToJourneyMap() {
    // Navigate to the journey map page
    window.location.href = 'index.html';
}

function personalizeStoryText(text) {
    // If text is not a string, return a default message
    if (typeof text !== 'string') {
        console.error('personalizeStoryText received non-string input:', text);
        return 'Story content unavailable.';
    }
    
    const userData = userManager.userData;
    if (!userData) return text;
    
    // Get pronouns based on selected character
    const pronouns = {
        they: 'they',
        their: 'their',
        them: 'them'
    };
    
    // Replace all placeholders
    try {
        return text
            .replace(/\[name\]/g, userData.name || '[name]')
            .replace(/\[age\]/g, userData.age || '[age]')
            .replace(/\[they\]/g, pronouns.they)
            .replace(/\[their\]/g, pronouns.their)
            .replace(/\[them\]/g, pronouns.them);
    } catch (error) {
        console.error('Error personalizing text:', error);
        return text; // Return original text if replacement fails
    }
}

// Update startStory function to handle story data validation
function startStory(storyId) {
    const userData = userManager.userData;
    const storyData = userData.stories[storyId];

    if (!storyData) {
        console.error('No story data found for:', storyId);
        return;
    }

    // Update the current story in user data
    userManager.userData.progress.current_story = storyId;
    userManager.saveUserData();
    
    // Redirect to story page
    window.location.href = 'story.html';
}

// === PAGE INITIALIZATION ===
function initializeAppropriateView() {
    // Check which page we're on and initialize accordingly
    if (document.querySelector('.story-page')) {
        initStoryPage();
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
function initWelcomeAnimation() {
    const welcomeBoxes = document.querySelectorAll('.welcome-box');
    const welcomeButton = document.querySelector('.welcome-button');
    const typingDots = document.querySelectorAll('.typing-dots');

    // Hide all welcome boxes and button initially
    welcomeBoxes.forEach(box => {
        box.style.display = 'none';
    });
    welcomeButton.style.display = 'none';

    // Function to animate each welcome box
    function animateWelcomeBox(index) {
        const box = welcomeBoxes[index];
        const dots = typingDots[index];
        const text = box.querySelector('p');

        // Show the box and typing dots
        box.style.display = 'block';
        dots.style.display = 'flex';
        box.classList.add('show');

        // After 1.5 seconds, hide dots and show text
        setTimeout(() => {
            dots.style.display = 'none';
            text.classList.add('show');
        }, 1500);
    }

    // Animate each box in sequence
    setTimeout(() => animateWelcomeBox(0), 0);      // First box at 0s
    setTimeout(() => animateWelcomeBox(1), 3000);   // Second box at 3s
    setTimeout(() => animateWelcomeBox(2), 6000);   // Third box at 6s

    // Show welcome button after the third text has been displayed (7.5s)
    setTimeout(() => {
        welcomeButton.style.display = 'block';
        welcomeButton.classList.add('show');
    }, 7500);
}

// Add event listeners for gender selection to update pronouns immediately
document.addEventListener('DOMContentLoaded', function() {
    initializeUserData();
    updateNamePlaceholders(); // Update name placeholders on page load

    // Add event listeners to gender radio buttons
    document.querySelectorAll('input[name="gender"]').forEach(radio => {
        radio.addEventListener('change', function() {
            updatePronouns(this.value);
        });
    });

    // Check if we already have gender data and update pronouns
    const userData = JSON.parse(localStorage.getItem('user_data'));
    if (userData && userData.gender) {
        updatePronouns(userData.gender);
    }
});

// === PRACTICE PAGE HANDLING ===
// Practice page functionality has been moved to scripts/practice.js

// === TEXT PERSONALIZATION ===
function personalizeText(text, userData) {
    if (!text || !userData) return text;
    
    const placeholders = {
        name: userData.name,
        age: userData.age,
        interests: userData.interests ? userData.interests.join(', ') : '',
        first_interest: userData.interests && userData.interests.length > 0 ? userData.interests[0] : '',
        second_interest: userData.interests && userData.interests.length > 1 ? userData.interests[1] : ''
    };

    // Replace placeholders with actual values
    return text.replace(/\[(\w+)\]/g, (match, key) => {
        // If the placeholder exists in our mapping, use it; otherwise keep the original placeholder
        return placeholders[key] !== undefined ? placeholders[key] : match;
    });
}