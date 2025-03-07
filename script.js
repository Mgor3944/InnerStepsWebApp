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
        // Load user data if PIN exists in localStorage
        const storedPin = localStorage.getItem('current_pin');
        if (storedPin) {
            this.currentPin = storedPin;
            await this.loadUserData();
            // Load story structure data
            await this.loadStoryStructure();
        }
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
            
            // Try to get any stored modifications from localStorage
            const storedData = localStorage.getItem(`user_data_${this.currentPin}`);
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
                return false;
            }
            
            // Load the stories data
            const storiesResponse = await fetch(`data/stories/${character}_${storyline}.json`);
            if (!storiesResponse.ok) {
                console.error(`No story content found for ${character} with storyline ${storyline}`);
                return false;
            }
            
            const storiesData = await storiesResponse.json();
            if (!storiesData || !storiesData.stories) {
                console.error('Invalid story data format');
                return false;
            }
            
            // Debug log the stories data
            console.log('Stories data:', storiesData);
            
            // Get structure stories and validate
            const structureStories = this.structureData.chapter_1.storylines[storyline].stories;
            if (!structureStories || typeof structureStories !== 'object') {
                console.error('Invalid structure stories format');
                return false;
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
                return false;
            }
            
            // Update the stories in userData
            this.userData.stories = mergedStories;
            
            // Ensure story progress is maintained if there's local data
            const storedData = localStorage.getItem(`user_data_${this.currentPin}`);
            const localData = storedData ? JSON.parse(storedData) : null;
            
            if (localData && localData.stories) {
                Object.keys(localData.stories).forEach(storyId => {
                    if (this.userData.stories[storyId]) {
                        this.userData.stories[storyId].completed = localData.stories[storyId].completed;
                    }
                });
            }
            
            console.log(`Successfully loaded stories for ${character} with storyline ${storyline}`);
            console.log('Final merged stories:', this.userData.stories);
            return true;
        } catch (error) {
            console.error('Error loading stories:', error);
            console.error('Error stack:', error.stack);
            return false;
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
            return false;
        }
        if (!this.isValidStoryline(storyline)) {
            console.error('Invalid storyline selected:', storyline);
            return false;
        }

        this.userData.progress.selectedCharacter = character;
        this.userData.progress.selectedStoryline = storyline;
        
        // Load the appropriate stories
        await this.loadStoriesForSelection();
        
        // Save the updated user data
        this.saveUserData();
        return true;
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
        if (this.currentPin && this.userData) {
            // Save to localStorage
            const dataToSave = {
                name: this.userData.name,
                age: this.userData.age,
                interests: this.userData.interests,
                favorite_color: this.userData.favorite_color,
                favorite_animal: this.userData.favorite_animal,
                progress: this.userData.progress,
                stories: Object.keys(this.userData.stories).reduce((acc, storyId) => {
                    acc[storyId] = {
                        completed: this.userData.stories[storyId].completed
                    };
                    return acc;
                }, {})
            };
            localStorage.setItem(`user_data_${this.currentPin}`, JSON.stringify(dataToSave));
        }
    }

    getCurrentStory() {
        if (!this.userData || !this.userData.progress || !this.userData.stories) {
            return null;
        }
        const currentStoryId = this.userData.progress.current_story;
        return this.userData.stories[currentStoryId];
    }

    updateUserProfile(profileData) {
        if (this.userData) {
            this.userData = { ...this.userData, ...profileData };
            this.saveUserData();
        }
    }

    async validatePin(pin) {
        try {
            const response = await fetch('data/user_data.json');
            const data = await response.json();
            return data.valid_pins.includes(pin);
        } catch (error) {
            console.error('Error validating PIN:', error);
            return false;
        }
    }
}

// Initialize user manager
const userManager = new UserManager();

// === PAGE INITIALIZATION ===
document.addEventListener('DOMContentLoaded', async function() {
    await userManager.initialize();

    // Check for stored PIN first
    const storedPin = localStorage.getItem('current_pin');
    if (storedPin) {
        // Validate the stored PIN
        if (await userManager.validatePin(storedPin)) {
            userManager.currentPin = storedPin;
            await userManager.loadUserData();
            
            // If we're on the login page, redirect to journey map
            if (document.querySelector('.login-page')) {
                window.location.href = 'index.html';
                return;
            }
        } else {
            // Invalid stored PIN, clear it
            localStorage.removeItem('current_pin');
        }
    }

    // Handle different pages
    if (document.querySelector('.login-page')) {
        initLoginPage();
    } else if (document.querySelector('.welcome-page')) {
        initWelcomePage();
    } else if (!userManager.currentPin) {
        // No valid PIN, redirect to login
        window.location.href = 'login.html';
        return;
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
    const pinForm = document.getElementById('pinForm');
    const inputs = pinForm.querySelectorAll('input');

    // Focus the first input when the page loads
    inputs[0].focus();

    // Auto-focus next input
    inputs.forEach((input, index) => {
        input.addEventListener('input', () => {
            if (input.value && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });
    });

    pinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const pin = Array.from(inputs).map(input => input.value).join('');
        
        if (await userManager.validatePin(pin)) {
            userManager.currentPin = pin;
            localStorage.setItem('current_pin', pin);
            await userManager.loadUserData();
            
            // Redirect to welcome page for new users, otherwise to journey map
            window.location.href = userManager.userData?.name ? 'index.html' : 'welcome.html';
        } else {
            alert('Invalid PIN. Please try again.');
            pinForm.reset();
            inputs[0].focus();
        }
    });
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

    // After 5 seconds, redirect to onboarding
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
        name: formData.get('name'),
        gender: formData.get('gender'),
        character: formData.get('character'),
        characterName: formData.get('characterName'),
        hobbies: Array.from(formData.getAll('hobbies')),
        favorite_color: formData.get('favorite_color'),
        progress: {
            selectedCharacter: formData.get('character'),
            selectedStoryline: formData.get('adventure'),
            current_story: 'story1',
            chapter1_progress: 0
        }
    };

    // Add a delay to show the loading animation
    setTimeout(async () => {
        try {
            // Update UserManager with the new profile data
            await userManager.updateUserProfile(profileData);
            
            // Try to load the selected character's story content
            const success = await userManager.setCharacterAndStoryline(
                profileData.progress.selectedCharacter,
                profileData.progress.selectedStoryline
            );
            
            if (!success) {
                console.log('Selected story content not found, falling back to default (Pip\'s Umbrella Racing)');
                // Fall back to Pip's umbrella racing story
                await userManager.setCharacterAndStoryline(
                    UserManager.CHARACTERS.PIP,
                    UserManager.STORYLINES.UMBRELLA_RACING
                );
            }
            
            // Redirect to story page
            window.location.href = 'story.html';
        } catch (error) {
            console.error('Error:', error);
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
    
    const currentStory = userManager.userData.stories[currentStoryId];
    console.log('Current story data:', currentStory);
    
    if (!currentStory || !currentStory.pages || currentStory.pages.length === 0) {
        console.error('No valid story content found!');
        window.location.href = 'index.html';
        return;
    }
    
    // Set up story variables
    window.currentPage = 1;
    window.totalPages = currentStory.pages.length;
    
    // Create story pages
    const storyTextContainer = document.querySelector('.story-text');
    if (!storyTextContainer) {
        console.error('Story text container not found!');
        return;
    }
    
    // Clear any existing content
    storyTextContainer.innerHTML = '';
    
    // Create pages
    currentStory.pages.forEach((page, index) => {
        const pageDiv = document.createElement('div');
        pageDiv.id = `page${index + 1}`;
        pageDiv.className = `page ${index === 0 ? '' : 'hidden'}`;
        
        // Add title to first page, subtitle to others
        if (index === 0) {
            pageDiv.innerHTML = `<h1>${currentStory.title}</h1>`;
        } else {
            pageDiv.innerHTML = `<h4>${currentStory.title}</h4>`;
        }
        
        // Add text content with personalization
        const p = document.createElement('p');
        p.textContent = personalizeStoryText(page.text);
        pageDiv.appendChild(p);
        
        storyTextContainer.appendChild(pageDiv);
    });
    
    // Set initial image
    const storyImage = document.getElementById('storyImage');
    if (storyImage && currentStory.pages[0]) {
        // Get the character and storyline for the image path
        const character = userManager.userData.progress.selectedCharacter;
        const storyline = userManager.userData.progress.selectedStoryline;
        
        // Construct the image path using assets/images directory
        const imagePath = `assets/images/${character}/chapter_1/${storyline}/story${currentStoryId.replace('story', '')}_${window.currentPage}.jpg`;
        console.log('Attempting to load story image:', imagePath);
        
        storyImage.src = imagePath;
        storyImage.alt = `Page 1 of ${currentStory.title}`;
        
        // Add error handling for images
        storyImage.onerror = function() {
            console.log(`Failed to load story image: ${this.src}`);
            // Try to load the default placeholder
            const defaultPlaceholder = 'assets/images/default_placeholder.png';
            console.log('Falling back to default placeholder:', defaultPlaceholder);
            this.src = defaultPlaceholder;
        };
    }
    
    // Add event listeners for navigation buttons
    const nextButton = document.querySelector('.story-next-btn');
    if (nextButton) {
        nextButton.removeEventListener('click', nextPage);
        nextButton.addEventListener('click', nextPage);
    }
    
    const backButton = document.querySelector('.story-back-btn');
    if (backButton) {
        backButton.removeEventListener('click', previousPage);
        backButton.addEventListener('click', previousPage);
    }
    
    // Initialize navigation buttons
    updateNavigationButtons();
}

function nextPage() {
    if (window.currentPage < window.totalPages) {
        const currentPageElement = document.getElementById(`page${window.currentPage}`);
        currentPageElement.classList.add('turning-forward');
        
        setTimeout(() => {
            // Hide current page
            currentPageElement.classList.add('hidden');
            currentPageElement.classList.remove('turning-forward');
            
            // Move to next page
            window.currentPage++;
            
            // Show next page
            const nextPageElement = document.getElementById(`page${window.currentPage}`);
            nextPageElement.classList.remove('hidden');
            
            // Update image with transition
            const storyImage = document.getElementById('storyImage');
            const currentStory = userManager.userData.stories[userManager.userData.progress.current_story];
            if (storyImage && currentStory.pages[window.currentPage - 1]) {
                storyImage.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    storyImage.src = currentStory.pages[window.currentPage - 1].image;
                    storyImage.style.transform = 'scale(1)';
                }, 300);
            }
            
            updateNavigationButtons();
        }, 300);
    }
}

function previousPage() {
    if (window.currentPage > 1) {
        const currentPageElement = document.getElementById(`page${window.currentPage}`);
        currentPageElement.classList.add('turning-backward');
        
        setTimeout(() => {
            // Hide current page
            currentPageElement.classList.add('hidden');
            currentPageElement.classList.remove('turning-backward');
            
            // Move to previous page
            window.currentPage--;
            
            // Show previous page
            const prevPageElement = document.getElementById(`page${window.currentPage}`);
            prevPageElement.classList.remove('hidden');
            
            // Update image with transition
            const storyImage = document.getElementById('storyImage');
            const currentStory = userManager.userData.stories[userManager.userData.progress.current_story];
            if (storyImage && currentStory.pages[window.currentPage - 1]) {
                storyImage.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    storyImage.src = currentStory.pages[window.currentPage - 1].image;
                    storyImage.style.transform = 'scale(1)';
                }, 300);
            }
            
            updateNavigationButtons();
        }, 300);
    }
}

function updateNavigationButtons() {
    const backButton = document.querySelector('.story-back-btn');
    const nextButton = document.querySelector('.story-next-btn');
    
    if (backButton) {
        // First, remove all existing event listeners
        const oldBackButton = backButton.cloneNode(true);
        backButton.parentNode.replaceChild(oldBackButton, backButton);
        
        if (window.currentPage === 1) {
            // On first page, back button takes user to journey map and says "Home"
            oldBackButton.innerHTML = `
                <svg class="story-back-arrow" width="35px" height="35px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                    <g id="Iconly/Bold/Arrow---Left-2" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                        <g id="Arrow---Left-2" transform="translate(7.000000, 6.000000)" fill="#ffffff" fill-rule="nonzero">
                            <path d="M0.369215782,4.869 C0.425718461,4.811 0.639064783,4.563 0.837798344,4.359 C2.00292255,3.076 5.04237701,0.976 6.63321968,0.335 C6.87481734,0.232 7.48563078,0.014 7.81198246,0 C8.12469557,0 8.42279591,0.072 8.70725767,0.218 C9.06186069,0.422 9.34632245,0.743 9.50219191,1.122 C9.60253288,1.385 9.75840234,2.172 9.75840234,2.186 C9.9142718,3.047 10,4.446 10,5.992 C10,7.465 9.9142718,8.807 9.78665368,9.681 C9.77204092,9.695 9.61617146,10.673 9.44568924,11.008 C9.13297613,11.62 8.52216269,12 7.86848514,12 L7.81198246,12 C7.386264,11.985 6.4909888,11.605 6.4909888,11.591 C4.98587433,10.949 2.01656113,8.952 0.823185582,7.625 C0.823185582,7.625 0.48709206,7.284 0.340964442,7.071 C0.113005358,6.765 -8.8817842e-16,6.386 -8.8817842e-16,6.007 C-8.8817842e-16,5.584 0.12761812,5.19 0.369215782,4.869"></path>
                        </g>
                    </g>
                </svg>
                Home`;
            oldBackButton.addEventListener('click', () => window.location.href = 'index.html');
        } else {
            // On other pages, back button goes to previous page
            oldBackButton.innerHTML = `
                <svg class="story-back-arrow" width="35px" height="35px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                    <g id="Iconly/Bold/Arrow---Left-2" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                        <g id="Arrow---Left-2" transform="translate(7.000000, 6.000000)" fill="#ffffff" fill-rule="nonzero">
                            <path d="M0.369215782,4.869 C0.425718461,4.811 0.639064783,4.563 0.837798344,4.359 C2.00292255,3.076 5.04237701,0.976 6.63321968,0.335 C6.87481734,0.232 7.48563078,0.014 7.81198246,0 C8.12469557,0 8.42279591,0.072 8.70725767,0.218 C9.06186069,0.422 9.34632245,0.743 9.50219191,1.122 C9.60253288,1.385 9.75840234,2.172 9.75840234,2.186 C9.9142718,3.047 10,4.446 10,5.992 C10,7.465 9.9142718,8.807 9.78665368,9.681 C9.77204092,9.695 9.61617146,10.673 9.44568924,11.008 C9.13297613,11.62 8.52216269,12 7.86848514,12 L7.81198246,12 C7.386264,11.985 6.4909888,11.605 6.4909888,11.591 C4.98587433,10.949 2.01656113,8.952 0.823185582,7.625 C0.823185582,7.625 0.48709206,7.284 0.340964442,7.071 C0.113005358,6.765 -8.8817842e-16,6.386 -8.8817842e-16,6.007 C-8.8817842e-16,5.584 0.12761812,5.19 0.369215782,4.869"></path>
                        </g>
                    </g>
                </svg>
                Go Back`;
            oldBackButton.addEventListener('click', previousPage);
        }
        oldBackButton.style.opacity = '1';
        oldBackButton.style.pointerEvents = 'auto';
    }
    
    if (nextButton) {
        // First, remove all existing event listeners
        const oldNextButton = nextButton.cloneNode(true);
        nextButton.parentNode.replaceChild(oldNextButton, nextButton);
        
        if (window.currentPage === window.totalPages) {
            // On last page, transform next button into practice button
            oldNextButton.textContent = 'Let\'s Practice Together!';
            oldNextButton.style.backgroundColor = '#4CAF50'; // Green color for practice
            oldNextButton.addEventListener('mouseover', () => {
                oldNextButton.style.backgroundColor = '#3d8b40'; // Darker green on hover
            });
            oldNextButton.addEventListener('mouseout', () => {
                oldNextButton.style.backgroundColor = '#4CAF50'; // Return to original green
            });
            oldNextButton.addEventListener('click', completeStory);
        } else {
            // On other pages, keep as next button
            oldNextButton.innerHTML = `Next Page
                <svg class="story-next-arrow" width="35px" height="35px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                    <g id="Iconly/Bold/Arrow---Right-2" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                        <g id="Arrow---Right-2" transform="translate(7.000000, 6.000000)" fill="#ffffff" fill-rule="nonzero">
                            <path d="M9.63078422,7.131 C9.57428154,7.189 9.36093522,7.437 9.16220166,7.641 C7.99707745,8.924 4.95762299,11.024 3.36678032,11.665 C3.12518266,11.768 2.51436922,11.986 2.18801754,12 C1.87530443,12 1.57720409,11.928 1.29274233,11.782 C0.938139308,11.578 0.653677545,11.257 0.497808086,10.878 C0.397467121,10.615 0.241597662,9.828 0.241597662,9.814 C0.0857282026,8.953 0,7.554 0,6.008 C0,4.535 0.0857282026,3.193 0.213346322,2.319 C0.227959084,2.305 0.383828544,1.327 0.554310765,0.992 C0.867023868,0.38 1.47783731,0 2.13151486,0 L2.18801754,0 C2.613736,0.015 3.5090112,0.395 3.5090112,0.409 C5.01412567,1.051 7.98343887,3.048 9.17681442,4.375 C9.17681442,4.375 9.51290794,4.716 9.65903556,4.929 C9.88699464,5.235 10,5.614 10,5.993 C10,6.416 9.87238188,6.81 9.63078422,7.131"></path>
                        </g>
                    </g>
                </svg>`;
            oldNextButton.style.backgroundColor = '#FFAE34'; // Reset to original color
            oldNextButton.addEventListener('click', nextPage);
        }
        oldNextButton.style.opacity = '1';
        oldNextButton.style.pointerEvents = 'auto';
    }
}

// === PRACTICE PAGE HANDLING ===
function initPracticePage() {
    const currentStory = userManager.getCurrentStory();
    if (!currentStory || !currentStory.practice) {
        console.error('No practice data found for current story');
        return;
    }

    const practice = currentStory.practice;
    let currentScenarioIndex = -1; // Start at -1 for overview screen
    let ratings = [];

    // Initialize progress tracking
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    
    function updateProgress() {
        if (currentScenarioIndex === -1) return; // Don't show progress on overview
        const progress = ((currentScenarioIndex) / practice.scenarios.length) * 100;
        if (progressFill) progressFill.style.width = `${progress}%`;
        if (progressText) progressText.textContent = `Question ${currentScenarioIndex + 1} of ${practice.scenarios.length}`;
    }

    // Initialize overview screen
    function showOverview() {
        const overviewSection = document.querySelector('.overview-section');
        const scenarioSection = document.querySelector('.scenario-section');
        
        if (overviewSection && scenarioSection) {
            overviewSection.style.display = 'block';
            scenarioSection.style.display = 'none';
            
            // Initialize demo worry meter
            const demoSlider = overviewSection.querySelector('.worry-slider');
            const demoThermometer = overviewSection.querySelector('.thermometer-fill');
            
            if (demoSlider && demoThermometer) {
                demoSlider.addEventListener('input', (e) => {
                    const value = e.target.value;
                    const fillWidth = (value / 9) * 100;
                    demoThermometer.style.width = `${fillWidth}%`;
                    
                    // Update color based on value
                    if (value <= 3) {
                        demoThermometer.style.backgroundColor = '#4CAF50'; // Green
                    } else if (value <= 5) {
                        demoThermometer.style.backgroundColor = '#FFC107'; // Yellow
                    } else if (value <= 7) {
                        demoThermometer.style.backgroundColor = '#FF9800'; // Orange
                    } else {
                        demoThermometer.style.backgroundColor = '#f44336'; // Red
                    }
                });
            }
        }
    }

    // Show scenario
    function showScenario(index) {
        if (index === -1) {
            showOverview();
            return;
        }

        const scenario = practice.scenarios[index];
        const scenarioText = document.querySelector('.scenario-text');
        const overviewSection = document.querySelector('.overview-section');
        const scenarioSection = document.querySelector('.scenario-section');
        
        if (overviewSection) overviewSection.style.display = 'none';
        if (scenarioSection) scenarioSection.style.display = 'block';
        if (scenarioText) scenarioText.textContent = scenario.text;
        
        // Reset slider to 0
        const worrySlider = document.querySelector('.worry-slider');
        if (worrySlider) {
            worrySlider.value = 0;
            updateThermometer(0);
        }
        
        // Update progress
        updateProgress();
        
        // Update navigation buttons
        const backBtn = document.querySelector('.back-btn');
        const nextBtn = document.querySelector('.next-btn');
        
        if (backBtn) backBtn.style.display = index === 0 ? 'none' : 'block';
        if (nextBtn) nextBtn.textContent = index === practice.scenarios.length - 1 ? 'Finish' : 'Next';
    }

    // Handle navigation
    const startBtn = document.querySelector('.start-btn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            currentScenarioIndex = 0;
            showScenario(currentScenarioIndex);
        });
    }

    const backBtn = document.querySelector('.back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (currentScenarioIndex > 0) {
                currentScenarioIndex--;
                showScenario(currentScenarioIndex);
            }
        });
    }

    const nextBtn = document.querySelector('.next-btn');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const worrySlider = document.querySelector('.worry-slider');
            if (worrySlider) {
                ratings[currentScenarioIndex] = parseInt(worrySlider.value);
            }

            if (currentScenarioIndex < practice.scenarios.length - 1) {
                currentScenarioIndex++;
                showScenario(currentScenarioIndex);
            } else {
                showSummary();
            }
        });
    }

    // Initialize first view (overview)
    showScenario(-1);
}

function personalizeText(text, userData) {
    if (!text || !userData) return text;
    
    const placeholders = {
        name: userData.name,
        age: userData.age,
        favorite_color: userData.favorite_color,
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
    
    // Update story nodes status
    const storyNodes = document.querySelectorAll('.story-node');
    let foundNextToComplete = false;
    
    storyNodes.forEach((node, index) => {
        const storyId = node.id;
        const story = userManager.userData.stories[storyId];
        
        if (!story) return;
        
        if (story.completed) {
            node.setAttribute('data-status', 'completed');
        } else if (!foundNextToComplete) {
            node.setAttribute('data-status', 'next-to-complete');
            foundNextToComplete = true;
        } else {
            node.setAttribute('data-status', 'locked');
        }
        
        // Add click handlers for interactive nodes
        if (node.getAttribute('data-status') !== 'locked') {
            node.addEventListener('click', () => startStory(storyId));
        }
    });
}

function lockStoryNode(node) {
    updateStoryNodeStatus(node, 'locked');
    const title = node.querySelector('h3');
    const button = node.querySelector('button');
    
    // Store original content as data attributes
    if (!title.hasAttribute('data-original-text')) {
        title.dataset.originalText = title.textContent;
        button.dataset.originalText = button.textContent;
    }
    
    // Update to locked content
    title.textContent = '????';
    button.textContent = 'Haven\'t Unlocked Yet';
    button.disabled = true;
    button.style.pointerEvents = 'none';
}

function unlockStoryNode(node) {
    const title = node.querySelector('h3');
    const button = node.querySelector('button');
    
    // Restore original content if it exists
    if (title.hasAttribute('data-original-text')) {
        title.textContent = title.dataset.originalText;
    }
    
    // Enable the button and set its text
    button.textContent = 'Begin Adventure';
    button.disabled = false;
    button.style.pointerEvents = 'auto';
    
    // Get the story ID from the node
    const storyId = node.id;
    
    // Remove any existing click handler
    button.onclick = null;
    
    // Add the click handler
    button.addEventListener('click', () => {
        if (userManager.userData.stories[storyId]) {
            startStory(storyId);
        }
    });
}

function updateStoryNodeStatus(node, status, checkAnimation = true) {
    node.setAttribute('data-status', status);
    const button = node.querySelector('button');
    
    if (status === 'completed') {
        button.textContent = 'Read Again';
        button.disabled = false;
        button.style.pointerEvents = 'auto';
    } else if (status === 'next-to-complete' && checkAnimation) {
        button.disabled = false;
        button.style.pointerEvents = 'auto';
        
        // Only show animation if this story hasn't been unlocked before
        const storyId = node.id;
        const hasBeenUnlocked = localStorage.getItem(`${storyId}_unlocked`) === 'true';
        
        if (!hasBeenUnlocked) {
            node.setAttribute('data-animation', 'unlocking');
            
            // Remove animation attributes after animation completes
            node.addEventListener('animationend', () => {
                node.removeAttribute('data-animation');
                // Mark this story as having shown its unlock animation
                localStorage.setItem(`${storyId}_unlocked`, 'true');
            }, { once: true });
        }
    }
}

// Update the completeStory function to handle story progression
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
    const userData = userManager.userData;
    if (!userData) return text;
    
    // Get pronouns based on selected character
    const pronouns = {
        they: 'they',
        their: 'their',
        them: 'them'
    };
    
    // Replace all placeholders
    return text
        .replace(/\[name\]/g, userData.name || '[name]')
        .replace(/\[age\]/g, userData.age || '[age]')
        .replace(/\[favorite_color\]/g, userData.favorite_color || '[favorite_color]')
        .replace(/\[they\]/g, pronouns.they)
        .replace(/\[their\]/g, pronouns.their)
        .replace(/\[them\]/g, pronouns.them);
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
    } else if (document.querySelector('.practice-page')) {
        initPracticePage();
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