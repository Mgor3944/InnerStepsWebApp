/**
 * Story Module
 * Contains all functionality related to the story page.
 */

// === STORY PAGE INITIALIZATION ===
function initStoryPage() {
    console.log('Initializing story page...');
    console.log('User data:', userManager.userData);
    
    // Ensure user data and story selection are available
    if (!userManager.userData) {
        console.error('No user data available');
        window.location.href = 'welcome.html';
        return;
    }
    
    if (!userManager.userData.progress) {
        console.error('No progress data available');
        window.location.href = 'welcome.html';
        return;
    }
    
    if (!userManager.userData.progress.selectedCharacter) {
        console.error('No character selected');
        window.location.href = 'welcome.html';
        return;
    }
    
    if (!userManager.userData.progress.selectedStoryline) {
        console.error('No storyline selected');
        window.location.href = 'welcome.html';
        return;
    }
    
    // Get current story data
    const currentStoryId = userManager.userData.progress.current_story || 'story1';
    console.log('Current story ID:', currentStoryId);
    
    // If current_story is not set, set it to story1
    if (!userManager.userData.progress.current_story) {
        console.log('Setting current_story to story1');
        userManager.userData.progress.current_story = 'story1';
        userManager.saveUserData();
    }
    
    let currentStory = userManager.getCurrentStory();
    console.log('Current story data:', currentStory);
    
    // Check if stories exist in userData
    if (!userManager.userData.stories) {
        console.error('No stories found in user data');
        userManager.userData.stories = {};
        userManager.saveUserData();
    }
    
    // Check if current story exists
    if (!currentStory) {
        console.error('Current story not found, creating default');
        
        // Create a default story
        const defaultStory = {
            title: "Your First Adventure",
            description: "Begin your journey with this introductory story.",
            pages: [
                {
                    text: "Welcome to your adventure! This is a placeholder story until we can load your real stories.",
                    image: "assets/images/default_placeholder.png"
                }
            ],
            completed: false
        };
        
        // Add the default story to userData
        userManager.userData.stories[currentStoryId] = defaultStory;
        userManager.saveUserData();
        
        console.log('Default story created:', defaultStory);
        
        // Use the default story
        currentStory = defaultStory;
    }
    
    // Check if the story has pages
    if (!currentStory.pages || currentStory.pages.length === 0) {
        console.error('No pages found in story data');
        
        // Try to reload the stories from the file
        console.log('Attempting to reload stories from file...');
        
        // We'll try to reload the stories and then check again
        userManager.loadStoriesForSelection().then(() => {
            console.log('Stories reloaded, checking for pages again...');
            
            // Get the story again after reloading
            currentStory = userManager.getCurrentStory();
            
            // Check if pages are now available
            if (currentStory && currentStory.pages && currentStory.pages.length > 0) {
                console.log('Pages found after reload:', currentStory.pages);
                // Reinitialize the story page with the new data
                loadStoryContent(currentStory);
                return;
            }
            
            // If still no pages, add default pages
            console.log('Still no pages found, adding default pages');
            
            // Add default pages
            currentStory.pages = [
                {
                    text: "Welcome to your adventure! This is a placeholder story until we can load your real stories.",
                    image: "assets/images/default_placeholder.png"
                }
            ];
            
            // Update the story in userData
            userManager.userData.stories[currentStoryId] = currentStory;
            userManager.saveUserData();
            
            console.log('Default pages added to story:', currentStory);
            
            // Load the story content with the default pages
            loadStoryContent(currentStory);
        });
        
        // Add default pages for now
        currentStory.pages = [
            {
                text: "Welcome to your adventure! This is a placeholder story until we can load your real stories.",
                image: "assets/images/default_placeholder.png"
            }
        ];
        
        // Update the story in userData
        userManager.userData.stories[currentStoryId] = currentStory;
        userManager.saveUserData();
        
        console.log('Default pages added to story:', currentStory);
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
    
    // Set initial button classes based on page number
    if (window.currentPage === 1) {
        backBtn.className = 'story-home-btn';
        backBtn.innerHTML = `
            <svg class="story-back-arrow" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                <g id="Iconly/Bold/Arrow---Left-2" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                    <g id="Arrow---Left-2" transform="translate(7.000000, 6.000000)" fill="#fff" fill-rule="nonzero">
                        <path d="M0.369215782,4.869 C0.425718461,4.811 0.639064783,4.563 0.837798344,4.359 C2.00292255,3.076 5.04237701,0.976 6.63321968,0.335 C6.87481734,0.232 7.48563078,0.014 7.81198246,0 C8.12469557,0 8.42279591,0.072 8.70725767,0.218 C9.06186069,0.422 9.34632245,0.743 9.50219191,1.122 C9.60253288,1.385 9.75840234,2.172 9.75840234,2.186 C9.9142718,3.047 10,4.446 10,5.992 C10,7.465 9.9142718,8.807 9.78665368,9.681 C9.77204092,9.695 9.61617146,10.673 9.44568924,11.008 C9.13297613,11.62 8.52216269,12 7.86848514,12 L7.81198246,12 C7.386264,11.985 6.4909888,11.605 6.4909888,11.591 C4.98587433,10.949 2.01656113,8.952 0.823185582,7.625 C0.823185582,7.625 0.48709206,7.284 0.340964442,7.071 C0.113005358,6.765 -8.8817842e-16,6.386 -8.8817842e-16,6.007 C-8.8817842e-16,5.584 0.12761812,5.19 0.369215782,4.869"></path>
                    </g>
                </g>
            </svg>
            Home
        `;
    }
    
    if (window.currentPage === window.totalPages) {
        nextBtn.className = 'story-practice-btn';
        nextBtn.innerHTML = `
            Practice Your Skills
            <svg class="story-next-arrow" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                <g id="Iconly/Bold/Arrow---Right-2" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                    <g id="Arrow---Right-2" transform="translate(7.000000, 6.000000)" fill="#fff" fill-rule="nonzero">
                        <path d="M9.63078422,7.131 C9.57428154,7.189 9.36093522,7.437 9.16220166,7.641 C7.99707745,8.924 4.95762299,11.024 3.36678032,11.665 C3.12518266,11.768 2.51436922,11.986 2.18801754,12 C1.87530443,12 1.57720409,11.928 1.29274233,11.782 C0.938139308,11.578 0.653677545,11.257 0.497808086,10.878 C0.397467121,10.615 0.241597662,9.828 0.241597662,9.814 C0.0857282026,8.953 0,7.554 0,6.008 C0,4.535 0.0857282026,3.193 0.213346322,2.319 C0.227959084,2.305 0.383828544,1.327 0.554310765,0.992 C0.867023868,0.38 1.47783731,0 2.13151486,0 L2.18801754,0 C2.613736,0.015 3.5090112,0.395 3.5090112,0.409 C5.01412567,1.051 7.98343887,3.048 9.17681442,4.375 C9.17681442,4.375 9.51290794,4.716 9.65903556,4.929 C9.88699464,5.235 10,5.614 10,5.993 C10,6.416 9.87238188,6.81 9.63078422,7.131"></path>
                    </g>
                </g>
            </svg>
        `;
    }
    
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
        const textContainer = document.createElement('div');
        textContainer.className = 'story-paragraphs';
        
        // Extract the text content based on the page structure
        let pageText = '';
        if (typeof pageContent === 'string') {
            // Handle legacy string format
            pageText = pageContent;
            const textElement = document.createElement('p');
            textElement.innerHTML = personalizeStoryText(pageText);
            textContainer.appendChild(textElement);
        } else if (pageContent && typeof pageContent === 'object') {
            if (pageContent.text) {
                if (Array.isArray(pageContent.text)) {
                    // Handle array of paragraphs
                    pageContent.text.forEach(paragraph => {
                        const textElement = document.createElement('p');
                        textElement.innerHTML = personalizeStoryText(paragraph);
                        textContainer.appendChild(textElement);
                    });
                } else {
                    // Handle single text string
                    pageText = pageContent.text;
                    const textElement = document.createElement('p');
                    textElement.innerHTML = personalizeStoryText(pageText);
                    textContainer.appendChild(textElement);
                }
            } else {
                console.error('Page content has no text property:', pageContent);
                const textElement = document.createElement('p');
                textElement.innerHTML = 'Story content unavailable.';
                textContainer.appendChild(textElement);
            }
        } else {
            console.error('Unexpected page content format:', pageContent);
            const textElement = document.createElement('p');
            textElement.innerHTML = 'Story content unavailable.';
            textContainer.appendChild(textElement);
        }
        
        contentWrapper.appendChild(textContainer);
        
        // Insert content before navigation buttons
        storyTextContainer.insertBefore(contentWrapper, navButtons);
        
        // Update navigation buttons
        const backBtn = document.getElementById('storyBackBtn');
        const nextBtn = document.getElementById('storyNextBtn');
        
        // Update back button based on page number
        if (backBtn) {
            if (window.currentPage === 1) {
                // First page - show "Home" button
                backBtn.innerHTML = `
                    <svg class="story-back-arrow" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                        <g id="Iconly/Bold/Arrow---Left-2" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                            <g id="Arrow---Left-2" transform="translate(7.000000, 6.000000)" fill="#fff" fill-rule="nonzero">
                                <path d="M0.369215782,4.869 C0.425718461,4.811 0.639064783,4.563 0.837798344,4.359 C2.00292255,3.076 5.04237701,0.976 6.63321968,0.335 C6.87481734,0.232 7.48563078,0.014 7.81198246,0 C8.12469557,0 8.42279591,0.072 8.70725767,0.218 C9.06186069,0.422 9.34632245,0.743 9.50219191,1.122 C9.60253288,1.385 9.75840234,2.172 9.75840234,2.186 C9.9142718,3.047 10,4.446 10,5.992 C10,7.465 9.9142718,8.807 9.78665368,9.681 C9.77204092,9.695 9.61617146,10.673 9.44568924,11.008 C9.13297613,11.62 8.52216269,12 7.86848514,12 L7.81198246,12 C7.386264,11.985 6.4909888,11.605 6.4909888,11.591 C4.98587433,10.949 2.01656113,8.952 0.823185582,7.625 C0.823185582,7.625 0.48709206,7.284 0.340964442,7.071 C0.113005358,6.765 -8.8817842e-16,6.386 -8.8817842e-16,6.007 C-8.8817842e-16,5.584 0.12761812,5.19 0.369215782,4.869"></path>
                            </g>
                        </g>
                    </svg>
                    Home
                `;
                backBtn.className = 'story-home-btn';
            } else {
                // Other pages - show "Back" button
                backBtn.innerHTML = `
                    <svg class="story-back-arrow" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                        <g id="Iconly/Bold/Arrow---Left-2" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                            <g id="Arrow---Left-2" transform="translate(7.000000, 6.000000)" fill="#fff" fill-rule="nonzero">
                                <path d="M0.369215782,4.869 C0.425718461,4.811 0.639064783,4.563 0.837798344,4.359 C2.00292255,3.076 5.04237701,0.976 6.63321968,0.335 C6.87481734,0.232 7.48563078,0.014 7.81198246,0 C8.12469557,0 8.42279591,0.072 8.70725767,0.218 C9.06186069,0.422 9.34632245,0.743 9.50219191,1.122 C9.60253288,1.385 9.75840234,2.172 9.75840234,2.186 C9.9142718,3.047 10,4.446 10,5.992 C10,7.465 9.9142718,8.807 9.78665368,9.681 C9.77204092,9.695 9.61617146,10.673 9.44568924,11.008 C9.13297613,11.62 8.52216269,12 7.86848514,12 L7.81198246,12 C7.386264,11.985 6.4909888,11.605 6.4909888,11.591 C4.98587433,10.949 2.01656113,8.952 0.823185582,7.625 C0.823185582,7.625 0.48709206,7.284 0.340964442,7.071 C0.113005358,6.765 -8.8817842e-16,6.386 -8.8817842e-16,6.007 C-8.8817842e-16,5.584 0.12761812,5.19 0.369215782,4.869"></path>
                            </g>
                        </g>
                    </svg>
                    Back
                `;
                backBtn.className = 'story-back-btn';
            }
            backBtn.style.visibility = 'visible';
            backBtn.style.opacity = '1';
            backBtn.disabled = false;
        }
        
        // Update next button based on page number
        if (nextBtn) {
            if (window.currentPage === window.totalPages) {
                // Last page - show "Practice Your Skills" button
                nextBtn.innerHTML = `
                    Practice Your Skills
                    <svg class="story-next-arrow" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                        <g id="Iconly/Bold/Arrow---Right-2" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                            <g id="Arrow---Right-2" transform="translate(7.000000, 6.000000)" fill="#fff" fill-rule="nonzero">
                                <path d="M9.63078422,7.131 C9.57428154,7.189 9.36093522,7.437 9.16220166,7.641 C7.99707745,8.924 4.95762299,11.024 3.36678032,11.665 C3.12518266,11.768 2.51436922,11.986 2.18801754,12 C1.87530443,12 1.57720409,11.928 1.29274233,11.782 C0.938139308,11.578 0.653677545,11.257 0.497808086,10.878 C0.397467121,10.615 0.241597662,9.828 0.241597662,9.814 C0.0857282026,8.953 0,7.554 0,6.008 C0,4.535 0.0857282026,3.193 0.213346322,2.319 C0.227959084,2.305 0.383828544,1.327 0.554310765,0.992 C0.867023868,0.38 1.47783731,0 2.13151486,0 L2.18801754,0 C2.613736,0.015 3.5090112,0.395 3.5090112,0.409 C5.01412567,1.051 7.98343887,3.048 9.17681442,4.375 C9.17681442,4.375 9.51290794,4.716 9.65903556,4.929 C9.88699464,5.235 10,5.614 10,5.993 C10,6.416 9.87238188,6.81 9.63078422,7.131"></path>
                            </g>
                        </g>
                    </svg>
                `;
                nextBtn.className = 'story-practice-btn';
            } else {
                // Other pages - show "Next Page" button
                nextBtn.innerHTML = `
                    Next Page
                    <svg class="story-next-arrow" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                        <g id="Iconly/Bold/Arrow---Right-2" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                            <g id="Arrow---Right-2" transform="translate(7.000000, 6.000000)" fill="#fff" fill-rule="nonzero">
                                <path d="M9.63078422,7.131 C9.57428154,7.189 9.36093522,7.437 9.16220166,7.641 C7.99707745,8.924 4.95762299,11.024 3.36678032,11.665 C3.12518266,11.768 2.51436922,11.986 2.18801754,12 C1.87530443,12 1.57720409,11.928 1.29274233,11.782 C0.938139308,11.578 0.653677545,11.257 0.497808086,10.878 C0.397467121,10.615 0.241597662,9.828 0.241597662,9.814 C0.0857282026,8.953 0,7.554 0,6.008 C0,4.535 0.0857282026,3.193 0.213346322,2.319 C0.227959084,2.305 0.383828544,1.327 0.554310765,0.992 C0.867023868,0.38 1.47783731,0 2.13151486,0 L2.18801754,0 C2.613736,0.015 3.5090112,0.395 3.5090112,0.409 C5.01412567,1.051 7.98343887,3.048 9.17681442,4.375 C9.17681442,4.375 9.51290794,4.716 9.65903556,4.929 C9.88699464,5.235 10,5.614 10,5.993 C10,6.416 9.87238188,6.81 9.63078422,7.131"></path>
                            </g>
                        </g>
                    </svg>
                `;
                nextBtn.className = 'story-next-btn';
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
            // assets/images/pip/chapter_1/umbrella_racing/story1/page_1.jpg
            const imagePath = `assets/images/${character}/chapter_1/${storyline}/story${storyNumber}/page_${window.currentPage}.jpg`;
            
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

// Function to personalize story text by replacing placeholders
function personalizeStoryText(text) {
    // If text is not a string, return a default message
    if (typeof text !== 'string') {
        console.error('personalizeStoryText received non-string input:', text);
        return 'Story content unavailable.';
    }
    
    const userData = userManager.userData;
    if (!userData) return text;
    
    // Get pronouns based on user data
    let pronouns = {
        they: 'they',
        their: 'their',
        them: 'them'
    };
    
    // Use the pronouns from user data if available
    if (userData.pronouns) {
        pronouns = {
            they: userData.pronouns.subject || 'they',
            their: userData.pronouns.possessive || 'their',
            them: userData.pronouns.object || 'them'
        };
    }
    
    console.log('Using pronouns:', pronouns);
    
    // Replace placeholders with actual values
    let personalizedText = text
        .replace(/\[name\]/g, userData.characterName || 'Character')
        .replace(/\[they\]/g, pronouns.they)
        .replace(/\[their\]/g, pronouns.their)
        .replace(/\[them\]/g, pronouns.them);
    
    return personalizedText;
}

// Initialize story page if we're on the story page
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOMContentLoaded event fired on story page');
    
    if (document.querySelector('.story-page')) {
        console.log('Story page detected');
        
        // Check localStorage directly
        const storedData = localStorage.getItem('user_data');
        if (storedData) {
            console.log('Found user_data in localStorage');
            try {
                const parsedData = JSON.parse(storedData);
                console.log('Parsed user_data:', parsedData);
                console.log('Stories in localStorage:', parsedData.stories);
                
                // Check if stories exist in localStorage
                if (!parsedData.stories || Object.keys(parsedData.stories).length === 0) {
                    console.error('No stories found in localStorage');
                    
                    // Add a default story to localStorage
                    parsedData.stories = {
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
                    
                    // Make sure current_story is set
                    if (!parsedData.progress) {
                        parsedData.progress = {};
                    }
                    parsedData.progress.current_story = 'story1';
                    
                    // Save the updated data
                    localStorage.setItem('user_data', JSON.stringify(parsedData));
                    console.log('Added default story to localStorage');
                }
            } catch (error) {
                console.error('Error parsing user_data from localStorage:', error);
            }
        } else {
            console.error('No user_data found in localStorage');
        }
        
        // Ensure userManager is initialized
        if (!userManager.userData) {
            console.log('User data not loaded, initializing userManager');
            await userManager.initialize();
        }
        
        console.log('User data after initialization:', userManager.userData);
        
        // Check if we have story data
        if (userManager.userData && userManager.userData.stories) {
            console.log('Stories available:', Object.keys(userManager.userData.stories));
            initStoryPage();
        } else {
            console.error('No stories available in user data');
            // Redirect to login if no stories are available
            window.location.href = 'welcome.html';
        }
    }
});

// In the clearUserData function (if it exists)
function clearUserData() {
    localStorage.removeItem('user_data');
    localStorage.removeItem('story_progress');
    window.location.href = 'welcome.html';
} 