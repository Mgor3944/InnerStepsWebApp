document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const emailStep = document.getElementById('emailStep');
    const loadingStep = document.getElementById('loadingStep');
    const verificationStep = document.getElementById('verificationStep');
    const successStep = document.getElementById('successStep');
    const benefitsStep = document.getElementById('benefitsStep');
    
    const emailForm = document.getElementById('emailForm');
    const verificationForm = document.getElementById('verificationForm');
    const netlifyForm = document.getElementById('netlifyForm');
    const backToIndexBtn = document.getElementById('backToIndexBtn');
    const backToEmailBtn = document.getElementById('backToEmailBtn');
    const savePreferencesBtn = document.getElementById('savePreferencesBtn');
    
    const emailStatusMessage = document.getElementById('emailStatusMessage');
    const verificationStatusMessage = document.getElementById('verificationStatusMessage');
    const pinInputs = document.querySelectorAll('.insights-pin-inputs input');
    const hiddenEmail = document.getElementById('hiddenEmail');
    const hiddenCode = document.getElementById('hiddenCode');
    
    // Function to show a specific step
    function showStep(step) {
        // Hide all steps
        [emailStep, loadingStep, verificationStep, successStep, benefitsStep].forEach(s => {
            s.classList.remove('insights-active');
        });
        
        // Show the requested step
        step.classList.add('insights-active');
    }
    
    // Function to show status message
    function showStatus(element, message, isError = false) {
        element.textContent = message;
        element.className = 'insights-status-message ' + (isError ? 'insights-error' : 'insights-success');
        element.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
    
    // Generate a random 6-digit verification code
    function generateVerificationCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    
    // Handle email form submission
    emailForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('parentEmail').value;
        
        // Show loading step
        showStep(loadingStep);
        
        // Generate a new verification code
        const verificationCode = generateVerificationCode();
        
        // Store email and verification code in localStorage
        const userData = JSON.parse(localStorage.getItem('user_data')) || {};
        userData.parentEmail = email;
        userData.verificationCode = verificationCode;
        localStorage.setItem('user_data', JSON.stringify(userData));
        
        try {
            // Set values in the hidden Netlify form
            hiddenEmail.value = email;
            hiddenCode.value = verificationCode;
            
            // Submit the form to Netlify
            const formData = new FormData(netlifyForm);
            
            // First, submit the form data to Netlify Forms for storage
            await fetch('/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(formData).toString()
            });
            
            // Then, call our Netlify function to send the verification email
            const emailResponse = await fetch('/api/send-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: email, 
                    code: verificationCode 
                })
            });
            
            const emailResult = await emailResponse.json();
            
            if (emailResponse.ok) {
                console.log('Verification email sent successfully:', emailResult);
                
                // Show verification step
                showStep(verificationStep);
                pinInputs[0].focus();
            } else {
                throw new Error(emailResult.message || 'Failed to send verification email');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            showStep(emailStep);
            showStatus(emailStatusMessage, 'Failed to send verification code. Please try again.', true);
        }
    });
    
    // Auto-focus next input in verification code
    pinInputs.forEach((input, index) => {
        // Ensure only one digit per input
        input.addEventListener('input', () => {
            if (input.value.length > 1) {
                input.value = input.value.slice(0, 1);
            }
            
            if (input.value && index < pinInputs.length - 1) {
                pinInputs[index + 1].focus();
            }
        });
        
        // Allow backspace to go to previous input
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !input.value && index > 0) {
                pinInputs[index - 1].focus();
            }
        });
        
        // Handle paste event
        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text').trim();
            
            // Check if pasted data contains only digits
            if (/^\d+$/.test(pastedData)) {
                // Distribute digits across inputs
                const digits = pastedData.split('');
                pinInputs.forEach((input, index) => {
                    if (digits[index]) {
                        input.value = digits[index];
                    }
                });
                
                // Focus the next empty input or the last one
                const lastFilledIndex = Math.min(digits.length - 1, pinInputs.length - 1);
                pinInputs[lastFilledIndex].focus();
            }
        });
    });
    
    // Handle verification form submission
    verificationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const enteredCode = Array.from(pinInputs).map(input => input.value).join('');
        
        // Get the stored verification code
        const userData = JSON.parse(localStorage.getItem('user_data')) || {};
        const storedCode = userData.verificationCode;
        
        if (enteredCode === storedCode) {
            // Mark email as verified in localStorage
            userData.emailVerified = true;
            localStorage.setItem('user_data', JSON.stringify(userData));
            
            // Show success message
            showStep(successStep);
            
            // After 2 seconds, show benefits step
            setTimeout(() => {
                showStep(benefitsStep);
            }, 2000);
        } else {
            showStatus(verificationStatusMessage, 'Invalid verification code. Please try again.', true);
            verificationForm.reset();
            pinInputs[0].focus();
        }
    });
    
    // Back button handlers
    backToIndexBtn.addEventListener('click', function() {
        window.location.href = 'index.html';
    });
    
    backToEmailBtn.addEventListener('click', function() {
        showStep(emailStep);
    });
    
    // Save preferences button
    savePreferencesBtn.addEventListener('click', function() {
        const emailTime = document.getElementById('emailTime').value;
        
        // Save preference to localStorage
        const userData = JSON.parse(localStorage.getItem('user_data')) || {};
        userData.emailPreference = emailTime;
        localStorage.setItem('user_data', JSON.stringify(userData));
        
        // Show success message and redirect
        showStatus(document.createElement('div'), 'Preferences saved successfully!');
        
        // Redirect to journey map after 2 seconds
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    });
}); 