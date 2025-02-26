// === PAGE DETECTION AND INITIALIZATION ===
document.addEventListener('DOMContentLoaded', function() {
    // Comment out the onboarding check temporarily for testing
    // Check if user has completed onboarding
    
    // const hasCompletedOnboarding = localStorage.getItem('onboarding_completed');
    
    // // If on index.html and hasn't completed onboarding, redirect to onboarding
    // if (window.location.pathname.endsWith('index.html') && !hasCompletedOnboarding) {
    //     window.location.href = 'onboarding.html';
    //     return;
    // }
    
    // Initialize appropriate page
    if (document.getElementById('onboardingForm')) {
        initOnboardingForm();
    } else if (document.querySelector('.story-container')) {
        initStoryPage();
    } else if (document.querySelector('.practice-page')) {
        initPracticePage();
    } else if (document.querySelector('.journey-page')) {
        initJourneyMap();
        loadUserProgress();
    }

    // Add coins display to relevant pages
    if (document.querySelector('.story-page') || 
        document.querySelector('.practice-page') || 
        document.querySelector('.journey-page')) {
        loadUserProgress();
    }
});

// === ONBOARDING FORM CODE ===
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
    
    // Collect all interests into a single string for better email readability
    let interests = Array.from(document.querySelectorAll('input[name="interests[]"]'))
        .map(input => input.value)
        .filter(value => value) // Remove empty values
        .join(', ');
        
    // Create a hidden field for the combined interests
    let interestsField = document.createElement('input');
    interestsField.type = 'hidden';
    interestsField.name = 'interests';
    interestsField.value = interests;
    form.appendChild(interestsField);
    
    // Use AJAX to submit the form
    const formData = new FormData(form);
    
    // Add a delay before redirecting to show the loading animation
    setTimeout(() => {
        fetch(form.action, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                // Redirect to story page
                window.location.href = 'story.html';
            } else {
                throw new Error('Form submission failed');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('There was a problem submitting your information. Please try again.');
            
            // Remove loading overlay
            const overlay = document.querySelector('.loading-overlay');
            if (overlay) {
                overlay.remove();
            }
            
            // Re-enable submit button
            if (submitButton) {
                submitButton.disabled = false;
            }
        });
    }, 3000); // 3 second loading animation
}

// === STORY PAGE CODE ===
function initStoryPage() {
    // Set up story variables
    window.currentPage = 1;
    window.totalPages = document.querySelectorAll('.page').length;
    
    // Set up story images array
    window.storyImages = [
        'assets/story_images/Alex/image_1.png',
        'assets/story_images/Alex/image_2.png',
        'assets/story_images/Alex/image_3.png'
    ];
    
    console.log("=== Story Page Initialization ===");
    console.log("Total pages found:", window.totalPages);
    console.log("Current page:", window.currentPage);
    console.log("Images array:", window.storyImages);
    
    // List all pages for debugging
    document.querySelectorAll('.page').forEach((page, index) => {
        console.log(`Page ${index + 1} ID:`, page.id);
    });
    
    // Hide all pages except the first one
    document.querySelectorAll('.page').forEach((page, index) => {
        if (index === 0) {
            page.classList.remove('hidden');
        } else {
            page.classList.add('hidden');
        }
    });
    
    // Add event listeners for navigation buttons
    const nextButton = document.querySelector('.next-btn');
    if (nextButton) {
        nextButton.removeEventListener('click', nextPage);
        nextButton.addEventListener('click', nextPage);
    }
    
    const backButton = document.querySelector('.back-btn');
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
            if (storyImage && window.storyImages && window.storyImages[window.currentPage - 1]) {
                storyImage.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    storyImage.src = window.storyImages[window.currentPage - 1];
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
            if (storyImage && window.storyImages && window.storyImages[window.currentPage - 1]) {
                storyImage.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    storyImage.src = window.storyImages[window.currentPage - 1];
                    storyImage.style.transform = 'scale(1)';
                }, 300);
            }
            
            updateNavigationButtons();
        }, 300);
    }
}

function updateNavigationButtons() {
    const backButton = document.querySelector('.back-btn');
    const nextButton = document.querySelector('.next-btn');
    const practiceButton = document.querySelector('.practice-btn');
    
    if (backButton) {
        // Hide back button on first page
        if (window.currentPage === 1) {
            backButton.style.opacity = '0';
            backButton.style.pointerEvents = 'none';
        } else {
            backButton.style.opacity = '1';
            backButton.style.pointerEvents = 'auto';
        }
    }
    
    if (nextButton && practiceButton) {
        // On last page
        if (window.currentPage === window.totalPages) {
            // Hide next button
            nextButton.style.opacity = '0';
            nextButton.style.pointerEvents = 'none';
            
            // Show practice button
            practiceButton.classList.remove('hidden');
            setTimeout(() => {
                practiceButton.classList.add('show');
            }, 300);
        } else {
            // Show next button and hide practice button
            nextButton.style.opacity = '1';
            nextButton.style.pointerEvents = 'auto';
            
            practiceButton.classList.remove('show');
            setTimeout(() => {
                practiceButton.classList.add('hidden');
            }, 300);
        }
    }
}

// === PRACTICE PAGE HANDLING ===
function initPracticePage() {
    console.log('Initializing practice page...'); // Debug log
    const practiceContainer = document.querySelector('.practice-container');
    if (practiceContainer) {
        // Initialize question tracking
        window.currentQuestion = 1;
        window.totalQuestions = document.querySelectorAll('.question').length;
        
        console.log('Total questions:', window.totalQuestions); // Debug log
        
        // Initialize navigation with IDs
        const practiceBackBtn = document.getElementById('practiceBackBtn');
        const practiceNextBtn = document.getElementById('practiceNextBtn');
        
        console.log('Back button:', practiceBackBtn); // Debug log
        console.log('Next button:', practiceNextBtn); // Debug log
        
        // Update next button text based on question number
        updateNextButtonText();
        
        if (practiceBackBtn) {
            practiceBackBtn.addEventListener('click', handlePracticePrevious);
        }
        
        if (practiceNextBtn) {
            practiceNextBtn.addEventListener('click', handlePracticeNext);
        }
        
        // Show first question and hide others
        document.querySelectorAll('.question').forEach((question, index) => {
            if (index === 0) {
                question.classList.add('active');
                question.classList.remove('hidden');
            } else {
                question.classList.remove('active');
                question.classList.add('hidden');
            }
        });
        
        loadUserProgress();
    }
}

function updateNextButtonText() {
    const nextButton = document.querySelector('.next-btn-practice');
    if (nextButton) {
        nextButton.textContent = window.currentQuestion === window.totalQuestions ? 'Complete' : 'Next';
    }
}

function handlePracticePrevious() {
    if (window.currentQuestion === 1) {
        // If on first question, redirect to story page
        window.location.href = 'story.html';
    } else {
        // Move to previous question
        const currentQuestionElement = document.getElementById(`question${window.currentQuestion}`);
        const prevQuestionElement = document.getElementById(`question${window.currentQuestion - 1}`);
        
        if (currentQuestionElement && prevQuestionElement) {
            currentQuestionElement.classList.remove('active');
            currentQuestionElement.classList.add('hidden');
            
            window.currentQuestion--;
            
            prevQuestionElement.classList.remove('hidden');
            prevQuestionElement.classList.add('active');
            
            // Update next button text
            updateNextButtonText();
        }
    }
}

function handlePracticeNext() {
    if (window.currentQuestion === window.totalQuestions) {
        // If on last question, show completion page
        const practiceContainer = document.querySelector('.practice-container');
        const completionContainer = document.querySelector('.completion-container');
        
        if (practiceContainer && completionContainer) {
            practiceContainer.classList.add('hidden');
            completionContainer.classList.remove('hidden');
            
            // Update user progress
            updateUserProgress();
        }
    } else {
        // Move to next question
        const currentQuestionElement = document.getElementById(`question${window.currentQuestion}`);
        const nextQuestionElement = document.getElementById(`question${window.currentQuestion + 1}`);
        
        if (currentQuestionElement && nextQuestionElement) {
            currentQuestionElement.classList.remove('active');
            currentQuestionElement.classList.add('hidden');
            
            window.currentQuestion++;
            
            nextQuestionElement.classList.remove('hidden');
            nextQuestionElement.classList.add('active');
            
            // Update next button text
            updateNextButtonText();
        }
    }
}

function showCompletionPage() {
    const practiceContainer = document.querySelector('.practice-container');
    const completionContainer = document.querySelector('.completion-container');
    const questionsCompleted = document.querySelector('.questions-completed');
    
    // Update questions completed
    if (questionsCompleted) {
        questionsCompleted.textContent = window.totalQuestions;
    }
    
    // Hide practice container
    practiceContainer.classList.add('hidden');
    
    // Show completion container
    completionContainer.classList.remove('hidden');
    
    // Update user progress
    updateUserProgress();
}

// === USER PROGRESS HANDLING ===
function loadUserProgress() {
    // Load coins from localStorage or initialize if not exists
    window.userCoins = parseInt(localStorage.getItem('userCoins')) || 0;
    updateCoinsDisplay();
}

function updateUserProgress() {
    // Add coins
    window.userCoins += 25;
    localStorage.setItem('userCoins', window.userCoins);
    updateCoinsDisplay();
    
    // Mark session as complete
    localStorage.setItem('session1_complete', 'true');
}

function updateCoinsDisplay() {
    if (!document.querySelector('.coins-display')) {
        const coinsDisplay = document.createElement('div');
        coinsDisplay.className = 'coins-display';
        coinsDisplay.innerHTML = `
            <svg class="gem-icon" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M21.0725 8.81987L18.1305 4.50188C17.6735 3.82488 16.9125 3.42188 16.0955 3.42188H7.90951C7.09351 3.42188 6.33351 3.82487 5.87751 4.49987L2.92651 8.81987C2.28551 9.75987 2.37251 11.0119 3.13951 11.8689L10.4455 19.8869C10.8425 20.3249 11.4085 20.5759 11.9985 20.5759C12.5895 20.5759 13.1545 20.3249 13.5515 19.8879L20.8575 11.8589C21.6275 11.0149 21.7155 9.76487 21.0725 8.81987Z"/>
            </svg>
            <span>${window.userCoins}/100</span>
        `;
        document.body.appendChild(coinsDisplay);
    } else {
        document.querySelector('.coins-display span').textContent = `${window.userCoins}/100`;
    }
}

function goToJourneyMap() {
    window.location.href = 'index.html';
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
        
        // Update progress bar
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progressPercentage}%`;
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
    const currentStory = localStorage.getItem('currentStory') || 'alex_giant';
    
    // Mark current story as completed
    localStorage.setItem(`${currentStory}_completed`, 'true');
    
    // Update chapter progress
    const story1Complete = localStorage.getItem('alex_giant_completed') === 'true';
    const story2Complete = localStorage.getItem('story2_completed') === 'true';
    const story3Complete = localStorage.getItem('story3_completed') === 'true';
    const story4Complete = localStorage.getItem('story4_completed') === 'true';
    
    const completedStories = [story1Complete, story2Complete, story3Complete, story4Complete]
        .filter(Boolean).length;
    const progressPercentage = (completedStories / 4) * 100;
    
    localStorage.setItem('chapter1_progress', progressPercentage);
    
    // Add coins for completion
    window.userCoins = (parseInt(localStorage.getItem('userCoins')) || 0) + 15;
    localStorage.setItem('userCoins', window.userCoins);
    
    // Redirect to practice page
    window.location.href = 'practice.html';
}