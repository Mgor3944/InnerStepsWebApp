// === USER AUTHENTICATION AND DATA MANAGEMENT ===
class UserManager {
    constructor() {
        this.currentPin = null;
        this.userData = null;
        this.baseData = null; // Store the base data from JSON
    }

    async initialize() {
        // Load user data if PIN exists in localStorage
        const storedPin = localStorage.getItem('current_pin');
        if (storedPin) {
            this.currentPin = storedPin;
            await this.loadUserData();
        }
    }

    async validatePin(pin) {
        try {
            const response = await fetch('data/valid_pins.json');
            const data = await response.json();
            return data.valid_pins.includes(pin);
        } catch (error) {
            console.error('Error validating PIN:', error);
            return false;
        }
    }

    async loadUserData() {
        try {
            // First load the base data from JSON
            const response = await fetch('data/user_data.json');
            const data = await response.json();
            this.baseData = data;

            // Get the base profile for this PIN
            const baseProfile = data.user_profiles[this.currentPin];
            
            // Try to get any stored modifications from localStorage
            const storedData = localStorage.getItem(`user_data_${this.currentPin}`);
            const localData = storedData ? JSON.parse(storedData) : null;

            // Merge the base profile with any local modifications
            this.userData = localData ? this.mergeUserData(baseProfile, localData) : baseProfile;
            
            return this.userData;
        } catch (error) {
            console.error('Error loading user data:', error);
            return null;
        }
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
            // Only save the modifications to localStorage
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

    updateUserProfile(profileData) {
        if (this.userData) {
            this.userData = { ...this.userData, ...profileData };
            this.saveUserData();
        }
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
    } else if (!userManager.currentPin) {
        // No PIN, redirect to login
        window.location.href = 'login.html';
        return;
    } else if (document.getElementById('onboardingForm')) {
        // Check if user has completed onboarding
        if (userManager.userData?.name) {
            window.location.href = 'index.html';
            return;
        }
        initOnboardingForm();
    } else {
        initializeAppropriateView();
    }
});

function initLoginPage() {
    const pinForm = document.getElementById('pinForm');
    const inputs = pinForm.querySelectorAll('input');

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
            
            // Redirect to onboarding if new user, otherwise to journey map
            window.location.href = userManager.userData?.name ? 'index.html' : 'onboarding.html';
        } else {
            alert('Invalid PIN. Please try again.');
            pinForm.reset();
            inputs[0].focus();
        }
    });
}

// === PAGE DETECTION AND INITIALIZATION ===
function initOnboardingForm() {
    // Add event listener to the form submission
    document.getElementById('onboardingForm').addEventListener('submit', handleFormSubmit);
}

function nextStep(current, next) {
    // Validate current step
    let currentStep = document.getElementById(`step${current}`);
    
    // Skip validation for step 1 (intro) and step 6 (final)
    if (current !== 1 && current !== 6) {
        let inputs = currentStep.querySelectorAll('input[required], select[required]');
        let valid = true;
        
        inputs.forEach(input => {
            if (input.type === 'radio') {
                let name = input.name;
                let radioGroup = currentStep.querySelectorAll(`input[name="${name}"]`);
                let checked = false;
                
                radioGroup.forEach(radio => {
                    if (radio.checked) checked = true;
                });
                
                if (!checked) valid = false;
            } else if (!input.value) {
                input.style.borderColor = '#ff4757';
                valid = false;
            } else {
                input.style.borderColor = '#ddd';
            }
        });
        
        if (!valid) {
            alert("Please fill in all required fields before continuing.");
            return;
        }
    }
    
    // Move to next step
    document.getElementById(`step${current}`).classList.remove('active');
    document.getElementById(`step${next}`).classList.add('active');
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

function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = this;
    
    // Show loading overlay
    showLoadingOverlay();
    
    // Disable submit button to prevent multiple submissions
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
    }
    
    // Collect all interests into an array
    const interests = Array.from(document.querySelectorAll('input[name="interests[]"]'))
        .map(input => input.value)
        .filter(value => value); // Remove empty values
    
    // Create the user profile data
    const formData = new FormData(form);
    const profileData = {
        name: formData.get('name'),
        age: formData.get('age'),
        interests: interests,
        favorite_color: formData.get('color'),
        favorite_animal: formData.get('animal')
    };

    // Add a delay to show the loading animation
    setTimeout(() => {
        try {
            // Update user profile in UserManager
            userManager.updateUserProfile(profileData);
            
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
    }, 3000); // 3 second loading animation
}

// === STORY PAGE CODE ===
function initStoryPage() {
    console.log('Initializing story page...');
    console.log('User data:', userManager.userData);
    
    // Get current story data
    const currentStoryId = userManager.userData.progress.current_story || 'story1';
    console.log('Current story ID:', currentStoryId);
    
    const currentStory = userManager.userData.stories[currentStoryId];
    console.log('Current story data:', currentStory);
    
    if (!currentStory) {
        console.error('No story found!');
        window.location.href = 'index.html';
        return;
    }
    
    // Set up story variables
    window.currentPage = 1;
    window.totalPages = currentStory.pages.length;
    
    // Create story pages
    const storyTextContainer = document.querySelector('.story-text');
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
        
        // Add text content
        const p = document.createElement('p');
        p.textContent = personalizeStoryText(page.text);
        pageDiv.appendChild(p);
        
        storyTextContainer.appendChild(pageDiv);
    });
    
    // Set initial image
    const storyImage = document.getElementById('storyImage');
    if (storyImage && currentStory.pages[0]) {
        storyImage.src = currentStory.pages[0].image;
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
            // On first page, back button takes user to journey map
            oldBackButton.addEventListener('click', () => window.location.href = 'index.html');
        } else {
            // On other pages, back button goes to previous page
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
            oldNextButton.textContent = 'Practice Questions';
            oldNextButton.style.backgroundColor = '#4CAF50'; // Green color for practice
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
    let currentScenarioIndex = 0;
    let ratings = [];

    // Initialize progress tracking
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    
    function updateProgress() {
        const progress = ((currentScenarioIndex) / practice.scenarios.length) * 100;
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `Question ${currentScenarioIndex + 1} of ${practice.scenarios.length}`;
    }

    // Initialize thermometer
    const worrySlider = document.querySelector('.worry-slider-horizontal');
    const thermometerFill = document.querySelector('.thermometer-fill-horizontal');

    function updateThermometer(value) {
        const fillWidth = (value / 10) * 100;
        thermometerFill.style.width = `${fillWidth}%`;
    }

    // Event listener for slider
    worrySlider.addEventListener('input', (e) => {
        updateThermometer(e.target.value);
    });

    // Initialize demo thermometer
    const demoSlider = document.querySelector('.demo-worry-slider');
    const demoFill = document.querySelector('.demo-thermometer-fill');
    
    if (demoSlider && demoFill) {
        demoSlider.addEventListener('input', (e) => {
            const fillWidth = (e.target.value / 10) * 100;
            demoFill.style.width = `${fillWidth}%`;
        });
    }

    // Show scenario
    function showScenario(index) {
        const scenario = practice.scenarios[index];
        const scenarioText = document.querySelector('.scenario-text');
        scenarioText.textContent = scenario;
        
        // Reset slider to 1
        worrySlider.value = 1;
        updateThermometer(1);
        
        // Update progress
        updateProgress();
        
        // Update navigation buttons
        const backBtn = document.querySelector('.back-btn');
        const nextBtn = document.querySelector('.next-btn');
        
        backBtn.style.display = index === 0 ? 'none' : 'block';
        nextBtn.textContent = index === practice.scenarios.length - 1 ? 'Finish' : 'Next';
    }

    // Handle navigation
    document.querySelector('.start-btn').addEventListener('click', () => {
        document.querySelector('.intro-section').style.display = 'none';
        document.querySelector('.scenario-section').style.display = 'block';
        showScenario(0);
    });

    document.querySelector('.back-btn').addEventListener('click', () => {
        if (currentScenarioIndex > 0) {
            currentScenarioIndex--;
            showScenario(currentScenarioIndex);
        }
    });

    document.querySelector('.next-btn').addEventListener('click', () => {
        // Save current rating
        ratings[currentScenarioIndex] = parseInt(worrySlider.value);

        if (currentScenarioIndex < practice.scenarios.length - 1) {
            currentScenarioIndex++;
            showScenario(currentScenarioIndex);
        } else {
            showSummary();
        }
    });

    function showSummary() {
        // Hide scenario section
        document.querySelector('.scenario-section').style.display = 'none';
        
        // Show summary section
        const summarySection = document.querySelector('.rating-summary');
        summarySection.style.display = 'block';
        
        // Create summary content
        let summaryHTML = '<h3>Your Worry Ratings:</h3>';
        practice.scenarios.forEach((scenario, index) => {
            const rating = ratings[index];
            summaryHTML += `
                <div class="rating-item">
                    <div class="scenario">${scenario}</div>
                    <div class="rating">Worry Level: ${rating}/10</div>
                </div>
            `;
        });
        
        summarySection.innerHTML = summaryHTML;

        // Save analytics data
        const analyticsData = {
            timestamp: new Date().toISOString(),
            ratings: ratings.map((rating, index) => ({
                scenario: practice.scenarios[index],
                rating: rating
            }))
        };

        // Update user data with analytics
        if (!userManager.userData.analytics) {
            userManager.userData.analytics = {};
        }
        if (!userManager.userData.analytics.worry_ratings) {
            userManager.userData.analytics.worry_ratings = [];
        }
        userManager.userData.analytics.worry_ratings.push(analyticsData);
        
        // Mark story as completed
        userManager.completeStory();
        userManager.saveUserData();

        // Add return to journey button
        const returnButton = document.createElement('button');
        returnButton.className = 'next-btn';
        returnButton.textContent = 'Return to Journey Map';
        returnButton.addEventListener('click', () => {
            window.location.href = 'journey.html';
        });
        summarySection.appendChild(returnButton);
    }

    // Initialize first view (intro section)
    document.querySelector('.scenario-section').style.display = 'none';
    document.querySelector('.rating-summary').style.display = 'none';
    updateProgress();
}

function personalizeText(text, userData) {
    return text.replace(/\[(\w+)\]/g, (match, key) => {
        if (key === 'name' || key === 'age' || key.startsWith('favorite_')) {
            return userData[key] || match;
        }
        return match;
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
function initJourneyMap() {
    if (document.querySelector('.journey-page')) {
        // Get completion status of all stories
        const story1Complete = localStorage.getItem('alex_giant_completed') === 'true';
        const story2Complete = localStorage.getItem('story2_completed') === 'true';
        const story3Complete = localStorage.getItem('story3_completed') === 'true';
        const story4Complete = localStorage.getItem('story4_completed') === 'true';
        
        // Calculate chapter progress
        const completedStories = [story1Complete, story2Complete, story3Complete, story4Complete]
            .filter(Boolean).length;
        const progressPercentage = (completedStories / 4) * 100;
        
        // Update progress bar - Fix: Use correct class name
        const progressBar = document.querySelector('.chapter-progress-bar');
        if (progressBar) {
            // Ensure there's always some visible progress (at least 5%)
            progressBar.style.width = `${Math.max(5, progressPercentage)}%`;
        }
        
        // Store progress in localStorage
        localStorage.setItem('chapter1_progress', progressPercentage);
        
        // Update story nodes status
        const storyNodes = document.querySelectorAll('.story-node');
        
        // Update story states based on completion
        if (story1Complete) {
            updateStoryNodeStatus(storyNodes[0], 'completed', false); // No animation for first story
            updateStoryNodeStatus(storyNodes[1], 'next-to-complete', true); // Show animation if newly unlocked
            unlockStoryNode(storyNodes[1]);
        } else {
            lockStoryNode(storyNodes[1]);
        }
        
        if (story2Complete && story1Complete) {
            updateStoryNodeStatus(storyNodes[1], 'completed', false);
            updateStoryNodeStatus(storyNodes[2], 'next-to-complete', true);
            unlockStoryNode(storyNodes[2]);
        } else {
            lockStoryNode(storyNodes[2]);
        }
        
        if (story3Complete && story2Complete && story1Complete) {
            updateStoryNodeStatus(storyNodes[2], 'completed', false);
            updateStoryNodeStatus(storyNodes[3], 'next-to-complete', true);
            unlockStoryNode(storyNodes[3]);
        } else {
            lockStoryNode(storyNodes[3]);
        }
        
        if (story4Complete && story3Complete && story2Complete && story1Complete) {
            updateStoryNodeStatus(storyNodes[3], 'completed', false);
            // Chapter complete - no need to unlock a next node
        }

        // Add click handlers to story nodes
        document.querySelectorAll('.story-node').forEach((node, index) => {
            const storyId = `story${index + 1}`;
            node.querySelector('button').addEventListener('click', () => {
                startStory(storyId);
            });
        });
    }
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
}

function unlockStoryNode(node) {
    const title = node.querySelector('h3');
    const button = node.querySelector('button');
    
    // Restore original content if it exists
    if (title.hasAttribute('data-original-text')) {
        title.textContent = title.dataset.originalText;
        button.textContent = 'Begin Adventure';
        button.disabled = false;
    }
}

function updateStoryNodeStatus(node, status, checkAnimation = true) {
    node.setAttribute('data-status', status);
    
    if (status === 'completed') {
        const button = node.querySelector('button');
        button.textContent = 'Read Again';
    } else if (status === 'next-to-complete' && checkAnimation) {
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
    
    return text
        .replace(/\[name\]/g, userData.name || '[name]')
        .replace(/\[age\]/g, userData.age || '[age]')
        .replace(/\[favorite_color\]/g, userData.favorite_color || '[favorite_color]')
        .replace(/\[favorite_animal\]/g, userData.favorite_animal || '[favorite_animal]');
}

// When a user clicks on a story in the journey map
function startStory(storyId) {
    // Update the current story in user data
    userManager.userData.progress.current_story = storyId;
    userManager.saveUserData();
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
    const thermometerFill = document.querySelector('.thermometer-fill');
    const fillHeight = (value / 10) * 100;
    thermometerFill.style.height = `${fillHeight}%`;

    // Update the slider thumb color based on the value
    const slider = document.querySelector('.worry-slider');
    if (value <= 3) {
        slider.style.setProperty('--thumb-color', '#95d5b2');  // Light green for little worries
    } else if (value <= 7) {
        slider.style.setProperty('--thumb-color', '#ffd93d');  // Yellow for medium worries
    } else {
        slider.style.setProperty('--thumb-color', '#ff6b6b');  // Red for big worries
    }
}

// Add event listeners for the worry slider
document.querySelectorAll('.worry-slider').forEach(slider => {
    slider.addEventListener('input', (e) => {
        updateThermometer(e.target.value);
    });
});