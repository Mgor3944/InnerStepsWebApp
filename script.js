// === PAGE DETECTION AND INITIALIZATION ===
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the onboarding form page
    if (document.getElementById('onboardingForm')) {
        initOnboardingForm();
    }
    
    // Check if we're on the story page
    if (document.querySelector('.story-container')) {
        initStoryPage();
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
    
    if (filledInputs.length < 3) {
        alert("Please add at least 3 interests before continuing.");
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
                // Redirect to story page after successful submission
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
    
    // Story images - update these with your actual image paths
    window.storyImages = [
        "assets/images/Alex/image_1.png",
        "assets/images/Alex/image_2.png",
        "assets/images/Alex/image_3.png"
    ];
    
    // Add click handler to next button if it exists
    const nextButton = document.querySelector('.next-btn');
    if (nextButton) {
        nextButton.addEventListener('click', nextPage);
    }
    
    // Add click handler to back button if it exists
    const backButton = document.querySelector('.back-btn');
    if (backButton) {
        backButton.addEventListener('click', previousPage);
    }
    
    // Check if back button should be hidden (first page)
    updateNavigationButtons();
}

function nextPage() {
    if (window.currentPage < window.totalPages) {
        // Add page turn animation to current page
        document.getElementById(`page${window.currentPage}`).classList.add('page-turn');
        
        setTimeout(() => {
            // Hide current page
            document.getElementById(`page${window.currentPage}`).classList.add('hidden');
            document.getElementById(`page${window.currentPage}`).classList.remove('page-turn');
            
            // Show next page
            window.currentPage++;
            document.getElementById(`page${window.currentPage}`).classList.remove('hidden');
            document.getElementById(`page${window.currentPage}`).classList.add('new-page');
            
            // Update image if it exists
            const storyImage = document.getElementById('storyImage');
            if (storyImage && window.storyImages && window.storyImages[window.currentPage - 1]) {
                storyImage.src = window.storyImages[window.currentPage - 1];
            }
            
            setTimeout(() => {
                document.getElementById(`page${window.currentPage}`).classList.remove('new-page');
                
                // Update navigation buttons
                updateNavigationButtons();
            }, 500);
        }, 250);
    }
}

function previousPage() {
    if (window.currentPage > 1) {
        // Add reverse page turn animation to current page
        document.getElementById(`page${window.currentPage}`).classList.add('page-turn-reverse');
        
        setTimeout(() => {
            // Hide current page
            document.getElementById(`page${window.currentPage}`).classList.add('hidden');
            document.getElementById(`page${window.currentPage}`).classList.remove('page-turn-reverse');
            
            // Show previous page
            window.currentPage--;
            document.getElementById(`page${window.currentPage}`).classList.remove('hidden');
            document.getElementById(`page${window.currentPage}`).classList.add('new-page-reverse');
            
            // Update image if it exists
            const storyImage = document.getElementById('storyImage');
            if (storyImage && window.storyImages && window.storyImages[window.currentPage - 1]) {
                storyImage.src = window.storyImages[window.currentPage - 1];
            }
            
            setTimeout(() => {
                document.getElementById(`page${window.currentPage}`).classList.remove('new-page-reverse');
                
                // Update navigation buttons
                updateNavigationButtons();
            }, 500);
        }, 250);
    }
}

function updateNavigationButtons() {
    const backButton = document.querySelector('.back-btn');
    const nextButton = document.querySelector('.next-btn');
    
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
    
    if (nextButton) {
        // Hide next button on last page
        if (window.currentPage === window.totalPages) {
            nextButton.style.opacity = '0';
            nextButton.style.pointerEvents = 'none';
        } else {
            nextButton.style.opacity = '1';
            nextButton.style.pointerEvents = 'auto';
        }
    }
}