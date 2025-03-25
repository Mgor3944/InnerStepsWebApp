/**
 * Welcome Page Module
 * Contains all functionality related to the welcome page animations and interactions.
 */

function initWelcomePage() {
    const introAnimation = document.querySelector('.intro-animation');
    const loadingBar = document.querySelector('.loading-bar');
    const loadingPercentage = document.querySelector('.loading-percentage');
    const welcomeContent = document.querySelector('.welcome-content');
    const getStartedContainer = document.querySelector('.get-started-container');

    // Initial setup
    getStartedContainer.style.display = 'none';
    getStartedContainer.style.opacity = '0';

    // Start loading sequence after logo animation completes
    setTimeout(() => {
        introAnimation.classList.add('loading');
        
        // Update loading percentage
        let progress = 0;
        const interval = setInterval(() => {
            progress += 1;
            loadingPercentage.textContent = `Loading... ${progress}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
                
                // Start circle expansion animation
                setTimeout(() => {
                    introAnimation.classList.add('circle-expand');
                    
                    // Show welcome content after circle expansion
                    setTimeout(() => {
                        introAnimation.classList.add('complete');
                        welcomeContent.style.display = 'flex';
                        welcomeContent.classList.add('show');
                        
                        // Start the transition to get-started container after 3 seconds
                        setTimeout(() => {
                            // Fade out welcome content
                            welcomeContent.style.opacity = '0';
                            welcomeContent.style.transition = 'opacity 0.5s ease-out';
                            
                            // After welcome content has faded out, hide it and show get-started
                            setTimeout(() => {
                                welcomeContent.style.display = 'none';
                                // Show get-started container
                                getStartedContainer.style.display = 'flex';
                                // Force a reflow to ensure the display change takes effect
                                getStartedContainer.offsetHeight;
                                // Start fade in
                                getStartedContainer.style.transition = 'opacity 0.5s ease-in';
                                getStartedContainer.style.opacity = '1';
                            }, 500); // Wait for welcome content fade out to complete
                            
                        }, 3000);
                    }, 1200); // Adjust timing for circle expansion completion
                }, 500);
            }
        }, 40); // Updates every 40ms for 4-second duration (4000ms / 100 steps = 40ms per step)
    }, 1200); // Wait for logo animation to complete (1s animation + 200ms buffer)

    // Add click handler for the start journey button
    const startButton = document.getElementById('startJourneyButton');
    if (startButton) {
        startButton.addEventListener('click', () => {
            window.location.href = 'onboarding.html';
        });
    }
}

// Initialize welcome page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize welcome page if we're on the welcome page
    if (document.querySelector('.welcome-page')) {
        initWelcomePage();
    }
}); 