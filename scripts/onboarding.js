/**
 * Onboarding Module
 * Contains all functionality related to the onboarding process.
 */

// === ONBOARDING FORM INITIALIZATION ===
function initOnboardingForm() {
    // Add event listener to the form submission
    document.getElementById('onboardingForm').addEventListener('submit', handleFormSubmit);
    
    // Add event listener to the character name input field
    const characterNameInput = document.getElementById('characterName');
    if (characterNameInput) {
        characterNameInput.addEventListener('input', capitalizeFirstLetter);
    }

    // Initialize welcome animation if we're on step 1
    if (document.getElementById('step1').classList.contains('active')) {
        initWelcomeAnimation();
    }
}

// === WELCOME ANIMATION HANDLING ===
function initWelcomeAnimation() {
    const welcomeBoxes = document.querySelectorAll('.welcome-box');
    const welcomeButton = document.querySelector('.welcome-button');
    let currentBox = 0;

    function showNextBox() {
        if (currentBox < welcomeBoxes.length) {
            const box = welcomeBoxes[currentBox];
            const dots = box.querySelector('.typing-dots');
            const text = box.querySelector('p');

            // Show the box first
            box.classList.add('show');
            
            // Show typing dots
            dots.classList.add('show');

            // After a delay, hide dots and show text
            setTimeout(() => {
                dots.classList.remove('show');
                text.classList.add('show');
                
                currentBox++;
                
                // If there are more boxes, show the next one after a delay
                if (currentBox < welcomeBoxes.length) {
                    setTimeout(showNextBox, 1000);
                } else {
                    // If all boxes are shown, show the button
                    setTimeout(() => {
                        welcomeButton.classList.add('show');
                    }, 500);
                }
            }, 2000); // Show typing dots for 2 seconds
        }
    }

    // Start the animation sequence
    showNextBox();
}

// Function to capitalize the first letter of the character name input
function capitalizeFirstLetter(e) {
    const input = e.target;
    const value = input.value;
    
    if (value.length > 0) {
        // Use the UserManager utility function if available, otherwise use the inline method
        if (typeof UserManager !== 'undefined' && UserManager.capitalizeFirstLetter) {
            input.value = UserManager.capitalizeFirstLetter(value);
        } else {
            input.value = value.charAt(0).toUpperCase() + value.slice(1);
        }
    }
}

// === FORM VALIDATION FUNCTIONS ===
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

// === USER DATA MANAGEMENT ===
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
    console.log('Setting pronouns for gender:', gender);
    
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

    const userData = JSON.parse(localStorage.getItem('user_data'));
    
    userData.pronouns = pronounSets[gender];
    console.log('Pronouns set to:', userData.pronouns);
    
    localStorage.setItem('user_data', JSON.stringify(userData));
    
    // Verify the data was saved correctly
    const savedData = localStorage.getItem('user_data');
    const parsedData = JSON.parse(savedData);
    console.log('Verified pronouns saved in localStorage');

    // Update any pronoun placeholders in the UI
    updatePronounPlaceholders();
}

// Function to update pronoun placeholders in the UI
function updatePronounPlaceholders() {
    const userData = JSON.parse(localStorage.getItem('user_data'));
    if (!userData || !userData.pronouns) return;

    // Update all pronoun spans in the document
    document.querySelectorAll('.character-pronoun').forEach(span => {
        const type = span.dataset.pronounType || 'subject'; // default to subject pronoun
        // Get the correct pronoun based on type
        let pronoun;
        if (type === 'possessive') {
            pronoun = userData.pronouns.possessive; // 'his', 'her', 'their'
        } else if (type === 'possessivePronoun') {
            pronoun = userData.pronouns.possessivePronoun; // 'his', 'hers', 'theirs'
        } else if (type === 'object') {
            pronoun = userData.pronouns.object; // 'him', 'her', 'them'
        } else {
            pronoun = userData.pronouns.subject; // 'he', 'she', 'they'
        }
        
        // Capitalize if the span has text-transform: capitalize
        span.textContent = span.style.textTransform === 'capitalize' 
            ? pronoun.charAt(0).toUpperCase() + pronoun.slice(1)
            : pronoun;
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

// Function to update name placeholders
function updateNamePlaceholders() {
    const userData = JSON.parse(localStorage.getItem('user_data'));
    if (!userData || !userData.characterName) return;

    // Ensure the character name is capitalized
    let characterName = userData.characterName;
    // Use the UserManager utility function if available, otherwise use the inline method
    if (typeof UserManager !== 'undefined' && UserManager.capitalizeFirstLetter) {
        characterName = UserManager.capitalizeFirstLetter(characterName);
    } else if (characterName.length > 0) {
        characterName = characterName.charAt(0).toUpperCase() + characterName.slice(1);
    }

    // Update all character name placeholders
    document.querySelectorAll('.character-name-placeholder').forEach(element => {
        // Check if we need to add possessive 's
        if (element.dataset.possessive === 'true') {
            element.textContent = `${characterName}'s`;
        } else {
            element.textContent = characterName;
        }
    });
}

// === NAVIGATION FUNCTIONS ===
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
                    // Capitalize the first letter of the character name
                    let capitalizedName;
                    if (typeof UserManager !== 'undefined' && UserManager.capitalizeFirstLetter) {
                        capitalizedName = UserManager.capitalizeFirstLetter(characterName);
                    } else {
                        capitalizedName = characterName.charAt(0).toUpperCase() + characterName.slice(1);
                    }
                    updateUserData('characterName', capitalizedName);
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

// === FORM SUBMISSION HANDLING ===
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
    
    // Get the gender and ensure pronouns are set
    const gender = formData.get('gender');
    console.log('Selected gender:', gender);
    
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
    
    // Get pronouns based on gender
    const pronouns = pronounSets[gender] || pronounSets['other'];
    console.log('Using pronouns:', pronouns);
    
    const profileData = {
        name: formData.get('characterName'), // Using characterName as the user's name
        gender: gender,
        character: formData.get('character'),
        characterName: formData.get('characterName'),
        hobbies: Array.from(formData.getAll('hobbies')),
        mood: formData.get('mood'), // Adding mood from the form
        pronouns: pronouns, // Add pronouns to the profile data
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
            console.log('About to call setCharacterAndStoryline with:', {
                character: profileData.progress.selectedCharacter,
                storyline: profileData.progress.selectedStoryline
            });
            
            const result = await userManager.setCharacterAndStoryline(
                profileData.progress.selectedCharacter,
                profileData.progress.selectedStoryline
            );
            
            console.log('Result from setCharacterAndStoryline:', result);
            
            // Check if there was an error loading the stories
            if (result && result.error) {
                console.error('Error loading stories:', result.error);
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
            
            // Make sure we have the latest user data with stories
            const userData = {
                ...profileData,
                stories: userManager.userData.stories || {}
            };
            
            console.log('User data to save to localStorage:', userData);
            localStorage.setItem('user_data', JSON.stringify(userData));
            
            // Verify the data was saved correctly
            const savedData = localStorage.getItem('user_data');
            const parsedData = JSON.parse(savedData);
            console.log('Data retrieved from localStorage:', parsedData);
            console.log('Stories in localStorage:', parsedData.stories);
            
            // Check if stories were loaded properly
            console.log('Checking user data before redirect:', userManager.userData);
            console.log('Stories in user data:', userManager.userData.stories);
            
            // Make sure we have story data before redirecting
            if (!userManager.userData.stories || Object.keys(userManager.userData.stories).length === 0) {
                console.error('No stories loaded, cannot redirect to story page');
                
                // Try to load stories one more time
                console.log('Attempting to load stories one more time');
                const retryResult = await userManager.loadStoriesForSelection();
                console.log('Retry result:', retryResult);
                
                if (retryResult && retryResult.error) {
                    console.error('Error loading stories on retry:', retryResult.error);
                    alert('There was a problem loading your stories: ' + retryResult.error + '. Please try again.');
                    
                    // Remove loading overlay
                    const overlay = document.querySelector('.loading-overlay');
                    if (overlay) {
                        overlay.remove();
                    }
                    
                    // Re-enable submit button
                    if (submitButton) {
                        submitButton.disabled = false;
                    }
                    
                    return;
                }
                
                // Check if we have stories now
                if (!userManager.userData.stories || Object.keys(userManager.userData.stories).length === 0) {
                    console.error('Still no stories after retry');
                    alert('There was a problem loading your stories. Please try again.');
                    
                    // Remove loading overlay
                    const overlay = document.querySelector('.loading-overlay');
                    if (overlay) {
                        overlay.remove();
                    }
                    
                    // Re-enable submit button
                    if (submitButton) {
                        submitButton.disabled = false;
                    }
                    
                    return;
                }
                
                console.log('Stories loaded successfully on retry');
            }
            
            // Make sure current_story is set
            if (!userManager.userData.progress.current_story) {
                console.log('Setting current_story to story1');
                userManager.userData.progress.current_story = 'story1';
                userManager.saveUserData();
            }
            
            // Make sure we have at least one story
            if (!userManager.userData.stories || Object.keys(userManager.userData.stories).length === 0) {
                console.log('Adding default story1');
                userManager.userData.stories = {
                    story1: { 
                        completed: false,
                        pages: [
                            {
                                text: "Welcome to your adventure! This is a placeholder story until we can load your real stories.",
                                image: "assets/images/default_placeholder.png"
                            }
                        ],
                        title: "Your First Adventure"
                    }
                };
                userManager.saveUserData();
            }
            
            // Final check of user data before redirect
            console.log('Final user data before redirect:', userManager.userData);
            console.log('Stories before redirect:', userManager.userData.stories);
            
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

// === EVENT LISTENERS ===
document.addEventListener('DOMContentLoaded', function() {
    // Initialize onboarding form if we're on the onboarding page
    if (document.querySelector('.onboarding-page')) {
        initOnboardingForm();
        
        // Add input event listeners to all text inputs
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
        
        // Initialize user data
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
    }
}); 