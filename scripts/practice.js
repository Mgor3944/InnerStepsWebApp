// === PRACTICE PAGE HANDLING ===
async function initPracticePage() {
    try {
        console.log('Practice page loaded, initializing...');
        
        // Wait for user manager to initialize
        if (!userManager) {
            console.error('User manager not found');
            return;
        }
        
        // Initialize user manager if needed
        if (!userManager.userData) {
            console.log('Initializing user manager...');
            await userManager.initialize();
        }
        
        // Make sure story structure is loaded
        if (!userManager.structureData) {
            console.log('Loading story structure...');
            await userManager.loadStoryStructure();
        }
        
        // Check if we have a current story
        if (!userManager.userData || !userManager.userData.progress || !userManager.userData.progress.current_story) {
            console.error('No current story found');
            alert('Please select a story from the journey map first.');
            window.location.href = './index.html';
            return;
        }
        
        console.log('Current story ID:', userManager.userData.progress.current_story);
        
        const currentStory = userManager.getCurrentStory();
        console.log('Current story:', currentStory);
        
        if (!currentStory || !currentStory.practice) {
            console.error('No practice data found for current story');
            return;
        }

        const practice = currentStory.practice;
        console.log('Practice data:', practice);
        
        let currentScenarioIndex = -1; // Start at -1 for overview screen
        let ratings = []; // Store all worry ratings

        // Initialize progress tracking
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        
        function updateProgress() {
            if (currentScenarioIndex === -1) return; // Don't show progress on overview
            const progress = ((currentScenarioIndex) / practice.scenarios.length) * 100;
            if (progressFill) progressFill.style.width = `${progress}%`;
            if (progressText) progressText.textContent = `Question ${currentScenarioIndex + 1} of ${practice.scenarios.length}`;
        }

        // Function to show summary
        function showSummary() {
            console.log('Showing summary...');
            const summarySection = document.querySelector('.summary-section');
            if (!summarySection) {
                console.error('Summary section not found');
                return;
            }
            
            // Hide other sections
            const overviewSection = document.querySelector('.overview-section');
            const scenarioSection = document.querySelector('.scenario-section');
            if (overviewSection) overviewSection.classList.add('hidden');
            if (scenarioSection) scenarioSection.classList.add('hidden');
            
            // Show summary section
            summarySection.classList.remove('hidden');
            
            // Store ratings in analytics without displaying them
            if (ratings.length > 0) {
                // Save the ratings to user analytics
                if (!userManager.userData.analytics) {
                    userManager.userData.analytics = { worry_ratings: [] };
                } else if (!userManager.userData.analytics.worry_ratings) {
                    userManager.userData.analytics.worry_ratings = [];
                }
                
                userManager.userData.analytics.worry_ratings.push({
                    story_id: userManager.userData.progress.current_story,
                    timestamp: new Date().toISOString(),
                    ratings: ratings,
                    average: calculateAverageWorry(ratings)
                });
                
                // Save user data with updated analytics
                userManager.saveUserData();
                console.log('Worry ratings saved to analytics:', ratings);
            }
            
            // Get story data and personalization elements in one clean step
            const currentStoryId = userManager.userData.progress.current_story;
            const storyline = userManager.userData.progress.selectedStoryline;
            
            // Default values
            let badgeImage = 'assets/images/default_placeholder.png';
            let keyMessage = 'Great job completing this activity!';
            let characterName = '';
            
            // Get all data from the story structure in one try-catch block
            try {
                // Get character name directly from userManager
                if (userManager.userData && userManager.userData.characterName) {
                    characterName = userManager.userData.characterName;
                }
                
                // Get badge and key message from story data
                const storyData = userManager.structureData.chapter_1.storylines[storyline].stories[currentStoryId];
                if (storyData) {
                    // Get badge image, removing leading slash if present
                    if (storyData.badge_image) {
                        badgeImage = storyData.badge_image.startsWith('/') 
                            ? storyData.badge_image.substring(1) 
                            : storyData.badge_image;
                    }
                    
                    // Get key message
                    if (storyData.key_message) {
                        keyMessage = storyData.key_message;
                    }
                }
            } catch (error) {
                console.error('Error retrieving personalization data:', error);
                // Continue with default values if there's an error
            }
            
            // Generate summary content with badge and key message
            let summaryContent = `
                <div class="completion-badge-container">
                    <img src="${badgeImage}" alt="Completion Badge" onerror="this.src='assets/images/default_placeholder.png'">
                </div>
                <h2>Congrats${characterName ? ', ' + characterName : ''}!</h2>
                <p>You've unlocked a new badge for completing <b>${practice.title}</b>.</p>
                <div class="key-takeaway-container">   
                    <p>${keyMessage}</p>
                </div>
                <button class="practice-finish-btn" onclick="window.completePractice()">Home Time</button>
            `;
            
            summarySection.innerHTML = summaryContent;
        }

        // Function to complete practice and unlock next story
        function completePractice() {
            try {
                console.log('Completing practice and unlocking next story...');
                const currentStoryId = userManager.userData.progress.current_story;
                console.log('Current story ID:', currentStoryId);
                
                // Mark current story as completed in user data
                if (userManager.userData.stories[currentStoryId]) {
                    console.log('Before update - Story completion status:', userManager.userData.stories[currentStoryId].completed);
                    
                    userManager.userData.stories[currentStoryId].completed = true;
                    userManager.userData.stories[currentStoryId].practice_completed = true;
                    
                    console.log('After update - Story completion status:', userManager.userData.stories[currentStoryId].completed);
                    
                    // Calculate progress
                    const completedStories = Object.values(userManager.userData.stories)
                        .filter(story => story.completed).length;
                    const totalStories = Object.keys(userManager.userData.stories).length;
                    const progressPercentage = (completedStories / totalStories) * 100;
                    
                    console.log(`Progress calculation: ${completedStories}/${totalStories} stories completed (${progressPercentage}%)`);
                    
                    // Update progress in user data
                    userManager.userData.progress.chapter1_progress = progressPercentage;
                    
                    // Store the current story ID for animation
                    console.log('Setting story_to_animate in localStorage:', currentStoryId);
                    localStorage.setItem('story_to_animate', currentStoryId);
                    
                    // Save user data
                    console.log('About to save user data...');
                    userManager.saveUserData();
                    console.log('User data saved');
                    
                    // Verify the data was saved correctly
                    const savedData = localStorage.getItem('user_data');
                    const parsedData = JSON.parse(savedData);
                    console.log('Data retrieved from localStorage:', parsedData);
                    console.log('Stories in localStorage:', parsedData.stories);
                    console.log('Completion status in localStorage:', parsedData.stories[currentStoryId].completed);
                    
                    console.log('Story and practice marked as completed:', currentStoryId);
                }
                
                // Navigate to journey map
                console.log('Navigating to journey map...');
                window.location.href = './index.html';
            } catch (error) {
                console.error('Error completing practice:', error);
                console.error('Error stack:', error.stack);
                // Fallback to simple navigation if there's an error
                window.location.href = './index.html';
            }
        }

        // Calculate average worry rating
        function calculateAverageWorry(ratings) {
            if (!ratings.length) return 0;
            const sum = ratings.reduce((a, b) => a + b, 0);
            return Math.round((sum / ratings.length) * 10) / 10;
        }

        // Initialize overview screen
        function showOverview() {
            console.log('Showing overview...');
            const overviewSection = document.querySelector('.overview-section');
            const scenarioSection = document.querySelector('.scenario-section');
            const summarySection = document.querySelector('.summary-section');
            
            if (!overviewSection) {
                console.error('Overview section not found');
                return;
            }
            
            // Hide other sections
            if (scenarioSection) scenarioSection.classList.add('hidden');
            if (summarySection) summarySection.classList.add('hidden');
            
            // Show overview section
            overviewSection.classList.remove('hidden');
            
            // Generate overview content
            let overviewContent = `
                <h2>${practice.title || 'Understanding Our Worries'}</h2>
                <p>${practice.description || 'Let\'s explore how different situations make us feel by moving the slider to show how worried you feel about each situation.'}</p>
                <div class="thermometer-container-horizontal">
                    <div class="thermometer-horizontal">
                        <input type="range" min="1" max="10" value="1" class="worry-slider-horizontal">
                        <div class="thermometer-fill-horizontal"></div>
                    </div>
                    <div class="thermometer-scale-horizontal">
                        <span>1</span>
                        <span>2</span>
                        <span>3</span>
                        <span>4</span>
                        <span>5</span>
                        <span>6</span>
                        <span>7</span>
                        <span>8</span>
                        <span>9</span>
                        <span>10</span>
                    </div>
                </div>
                <button class="practice-start-btn">I'm Ready to Begin!</button>
            `;
            
            overviewSection.innerHTML = overviewContent;
            
            // Initialize demo worry meter
            const demoSlider = overviewSection.querySelector('.worry-slider-horizontal');
            const demoThermometer = overviewSection.querySelector('.thermometer-fill-horizontal');
            
            if (demoSlider && demoThermometer) {
                demoSlider.addEventListener('input', (e) => {
                    updateThermometer(e.target, demoThermometer);
                });
            }
            
            // Add event listener to start button
            const startBtn = overviewSection.querySelector('.practice-start-btn');
            console.log('Start button:', startBtn);
            if (startBtn) {
                startBtn.addEventListener('click', () => {
                    console.log('Start button clicked!');
                    currentScenarioIndex = 0;
                    showScenario(currentScenarioIndex);
                });
            }
        }

        // Helper function to update thermometer
        function updateThermometer(slider, thermometer) {
            const value = slider.value;
            const fillWidth = (value / 10) * 100;
            thermometer.style.width = `${fillWidth}%`;
            
            // Update color based on value
            if (value <= 3) {
                thermometer.style.backgroundColor = '#8DBA36'; // Green for low worry
            } else if (value <= 7) {
                thermometer.style.backgroundColor = '#FFA500'; // Orange for medium worry
            } else {
                thermometer.style.backgroundColor = '#FF4500'; // Red for high worry
            }
        }

        // Show scenario
        function showScenario(index) {
            console.log('Showing scenario:', index);
            if (index === -1) {
                showOverview();
                return;
            }

            if (!practice.scenarios || !practice.scenarios[index]) {
                console.error('Scenario not found:', index);
                console.log('Available scenarios:', practice.scenarios);
                return;
            }

            const scenario = practice.scenarios[index];
            console.log('Current scenario:', scenario);
            
            const scenarioText = document.querySelector('.scenario-text');
            const activityContainer = document.querySelector('.activity-container');
            const overviewSection = document.querySelector('.overview-section');
            const scenarioSection = document.querySelector('.scenario-section');
            const summarySection = document.querySelector('.summary-section');
            
            if (!scenarioSection) {
                console.error('Scenario section not found');
                return;
            }
            
            // Hide other sections
            if (overviewSection) overviewSection.classList.add('hidden');
            if (summarySection) summarySection.classList.add('hidden');
            
            // Show scenario section
            scenarioSection.classList.remove('hidden');
            
            // Add a progress bar and scenario text
            if (scenarioText) {
                const progressHtml = `<div class="scenario-progress">Scenario ${index + 1} of ${practice.scenarios.length}</div>`;
                const scenarioHtml = `<h2>${scenario.text}</h2>`;
                scenarioText.innerHTML = progressHtml + scenarioHtml;
            }
            
            // Clear activity container
            if (activityContainer) activityContainer.innerHTML = '';
            
            // Create worry meter activity
            const template = document.getElementById('worry-meter-template');
            if (template && activityContainer) {
                const clone = document.importNode(template.content, true);
                activityContainer.appendChild(clone);
                
                // Initialize worry meter
                const worrySlider = activityContainer.querySelector('.worry-slider-horizontal');
                const thermometer = activityContainer.querySelector('.thermometer-fill-horizontal');
                
                if (worrySlider && thermometer) {
                    worrySlider.value = 1; // Reset to 1
                    updateThermometer(worrySlider, thermometer);
                    
                    worrySlider.addEventListener('input', () => {
                        updateThermometer(worrySlider, thermometer);
                    });
                }
            }
            
            // Update navigation buttons
            const backBtn = document.querySelector('.practice-back-btn');
            const nextBtn = document.querySelector('.practice-next-btn');
            
            if (backBtn) backBtn.style.display = 'block'; // Always show back button
            if (nextBtn) nextBtn.textContent = index === practice.scenarios.length - 1 ? 'Finish' : 'Continue';
            
            // Update progress
            updateProgress();
        }

        // Function to get current rating
        function getCurrentRating() {
            const worrySlider = document.querySelector('.worry-slider-horizontal');
            return worrySlider ? parseInt(worrySlider.value) : 1; // Default to 1 if slider not found
        }

        // Handle navigation
        function setupNavigation() {
            console.log('Setting up navigation...');
            const backBtn = document.querySelector('.practice-back-btn');
            const nextBtn = document.querySelector('.practice-next-btn');
            const practiceContainer = document.querySelector('.practice-container');
            
            console.log('Back button:', backBtn);
            console.log('Next button:', nextBtn);
            
            if (backBtn) {
                backBtn.addEventListener('click', () => {
                    console.log('Back button clicked!');
                    if (currentScenarioIndex > 0) {
                        currentScenarioIndex--;
                        showScenario(currentScenarioIndex);
                    } else if (currentScenarioIndex === 0) {
                        // Go back to overview page
                        currentScenarioIndex = -1;
                        showScenario(currentScenarioIndex);
                    }
                });
            }

            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    console.log('Next button clicked!');
                    // Save current rating
                    ratings[currentScenarioIndex] = getCurrentRating();

                    if (currentScenarioIndex < practice.scenarios.length - 1) {
                        currentScenarioIndex++;
                        showScenario(currentScenarioIndex);
                    } else {
                        showSummary();
                    }
                });
            }
            
            // Listen for completePractice event
            if (practiceContainer) {
                practiceContainer.addEventListener('completePractice', () => {
                    console.log('completePractice event received');
                    completePractice();
                });
            }
        }

        // Initialize
        showOverview();
        setupNavigation();
    } catch (error) {
        console.error('Error initializing practice page:', error);
        alert('An error occurred. Please try again.');
    }
}

// Export the function for use in other files
if (typeof window !== 'undefined') {
    window.initPracticePage = initPracticePage;
    window.completePractice = function() {
        console.log('Global completePractice function called');
        try {
            // Check if userManager exists
            if (!userManager) {
                console.error('userManager is not defined');
                window.location.href = './index.html';
                return;
            }
            
            // Check if userData exists
            if (!userManager.userData) {
                console.error('userManager.userData is not defined');
                window.location.href = './index.html';
                return;
            }
            
            // Check if progress exists
            if (!userManager.userData.progress) {
                console.error('userManager.userData.progress is not defined');
                window.location.href = './index.html';
                return;
            }
            
            // Get the current story ID
            const currentStoryId = userManager.userData.progress.current_story;
            console.log('Current story ID:', currentStoryId);
            
            // Check if stories object exists
            if (!userManager.userData.stories) {
                console.error('userManager.userData.stories is not defined');
                window.location.href = './index.html';
                return;
            }
            
            // Check if current story exists in stories object
            if (!userManager.userData.stories[currentStoryId]) {
                console.error('Current story not found in user data:', currentStoryId);
                console.log('Available stories:', Object.keys(userManager.userData.stories));
                window.location.href = './index.html';
                return;
            }
            
            console.log('Before update - Story completion status:', userManager.userData.stories[currentStoryId].completed);
            
            // Mark current story as completed in user data
            userManager.userData.stories[currentStoryId].completed = true;
            userManager.userData.stories[currentStoryId].practice_completed = true;
            
            console.log('After update - Story completion status:', userManager.userData.stories[currentStoryId].completed);
            
            // Calculate progress
            const completedStories = Object.values(userManager.userData.stories)
                .filter(story => story.completed).length;
            const totalStories = Object.keys(userManager.userData.stories).length;
            const progressPercentage = (completedStories / totalStories) * 100;
            
            console.log(`Progress calculation: ${completedStories}/${totalStories} stories completed (${progressPercentage}%)`);
            
            // Update progress in user data
            userManager.userData.progress.chapter1_progress = progressPercentage;
            
            // Save user data
            console.log('About to save user data...');
            userManager.saveUserData();
            console.log('User data saved');
            
            // Verify the data was saved correctly
            const savedData = localStorage.getItem('user_data');
            const parsedData = JSON.parse(savedData);
            console.log('Data retrieved from localStorage:', parsedData);
            console.log('Stories in localStorage:', parsedData.stories);
            console.log('Completion status in localStorage:', parsedData.stories[currentStoryId].completed);
            
            console.log('Story and practice marked as completed:', currentStoryId);
            console.log('Updated user data:', userManager.userData);
            
            // Store the current story ID for animation
            console.log('Setting story_to_animate in localStorage:', currentStoryId);
            localStorage.setItem('story_to_animate', currentStoryId);
            
            // Navigate to journey map
            console.log('Navigating to journey map...');
            window.location.href = './index.html';
        } catch (error) {
            console.error('Error in global completePractice function:', error);
            console.error('Error stack:', error.stack);
            // Fallback to simple navigation if there's an error
            window.location.href = './index.html';
        }
    };
}

// Auto-initialize when the DOM is loaded if we're on the practice page
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.practice-page')) {
        initPracticePage();
    }
}); 