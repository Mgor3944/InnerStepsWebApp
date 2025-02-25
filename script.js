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

function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = this;
    
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
    });
}

// === STORY PAGE CODE ===
function initStoryPage() {
    // Set up story variables
    window.currentPage = 1;
    window.totalPages = document.querySelectorAll('.page').length;
    
    // Story images - update these with your actual image paths
    window.storyImages = [
        "images/forest-path.jpg",
        "images/talking-owl.jpg",
        "images/magic-stone.jpg"
    ];
    
    // Add click handler to next button if it exists
    const nextButton = document.querySelector('.next-btn');
    if (nextButton) {
        nextButton.addEventListener('click', nextPage);
    }
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
            }, 500);
        }, 250);
    }
}