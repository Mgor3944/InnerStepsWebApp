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
        window.location.href = 'login.html';
        return;
    }
    
    if (!userManager.userData.progress) {
        console.error('No progress data available');
        window.location.href = 'login.html';
        return;
    }
    
    if (!userManager.userData.progress.selectedCharacter) {
        console.error('No character selected');
        window.location.href = 'login.html';
        return;
    }
    
    if (!userManager.userData.progress.selectedStoryline) {
        console.error('No storyline selected');
        window.location.href = 'login.html';
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
        
        // Always show back button with full opacity since it now has a function on the first page
        if (backBtn) {
            backBtn.style.visibility = 'visible';
            backBtn.style.opacity = '1';
            // Remove the disabled attribute if it exists
            backBtn.disabled = false;
        }
        
        if (nextBtn) {
            if (window.currentPage === window.totalPages) {
                nextBtn.innerHTML = `
                    <span>Practice</span>
                    <svg class="story-next-arrow" width="45px" height="45px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                        <g id="Iconly/Bold/Arrow---Right" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                            <g id="Arrow---Right" transform="translate(3.000000, 6.000000)" fill="#fff" fill-rule="nonzero">
                                <path d="M7.83655568,6.36070466 L7.8350323,6.00660914 C7.8350323,4.53497338 7.92121308,3.19331742 8.05102968,2.31870755 L8.16475558,1.77483018 C8.22802754,1.48678171 8.31120835,1.15880301 8.39793457,0.991371397 C8.71538527,0.378924178 9.33610502,0 10.0004606,0 L10.0582781,0 C10.4913637,0.0143198091 11.4011709,0.394345511 11.4011709,0.407563797 C12.8651531,1.02183092 15.6895424,2.87571834 16.9940026,4.19738844 L17.3730714,4.59418673 C17.4723361,4.70172939 17.5838596,4.82900679 17.6530951,4.92821737 C17.884365,5.23444098 18,5.61336516 18,5.99228933 C18,6.41527446 17.8701834,6.80851845 17.6247318,7.13016339 L17.2352725,7.55047018 L17.2352725,7.55047018 L17.1480103,7.6401689 C15.9643883,8.9234441 12.8738803,11.0218469 11.2571726,11.6640352 L11.0130847,11.7575787 C10.719361,11.8628603 10.3078205,11.988434 10.0582781,12 C9.74082738,12 9.43755833,11.9261979 9.14847093,11.7807968 C8.7873844,11.5770149 8.49938789,11.2553699 8.34011709,10.8764457 C8.23866377,10.6142831 8.07939298,9.82669359 8.07939298,9.81237378 C7.93338076,9.01825987 7.84871691,7.76518207 7.83655568,6.36070466 Z M1.77635684e-15,5.99955939 C1.77635684e-15,5.1612998 0.673082751,4.48165963 1.50325451,4.48165963 L5.20248239,4.80881219 C5.85374723,4.80881219 6.38174083,5.3419497 6.38174083,5.99955939 C6.38174083,6.65827061 5.85374723,7.19030659 5.20248239,7.19030659 L1.50325451,7.51745915 C0.673082751,7.51745915 1.77635684e-15,6.83781898 1.77635684e-15,5.99955939 Z"></path>
                            </g>
                        </g>
                    </svg>
                `;
            } else {
                nextBtn.innerHTML = `
                    <svg class="story-next-arrow" width="45px" height="45px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                        <g id="Iconly/Bold/Arrow---Right" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                            <g id="Arrow---Right" transform="translate(3.000000, 6.000000)" fill="#fff" fill-rule="nonzero">
                                <path d="M7.83655568,6.36070466 L7.8350323,6.00660914 C7.8350323,4.53497338 7.92121308,3.19331742 8.05102968,2.31870755 L8.16475558,1.77483018 C8.22802754,1.48678171 8.31120835,1.15880301 8.39793457,0.991371397 C8.71538527,0.378924178 9.33610502,0 10.0004606,0 L10.0582781,0 C10.4913637,0.0143198091 11.4011709,0.394345511 11.4011709,0.407563797 C12.8651531,1.02183092 15.6895424,2.87571834 16.9940026,4.19738844 L17.3730714,4.59418673 C17.4723361,4.70172939 17.5838596,4.82900679 17.6530951,4.92821737 C17.884365,5.23444098 18,5.61336516 18,5.99228933 C18,6.41527446 17.8701834,6.80851845 17.6247318,7.13016339 L17.2352725,7.55047018 L17.2352725,7.55047018 L17.1480103,7.6401689 C15.9643883,8.9234441 12.8738803,11.0218469 11.2571726,11.6640352 L11.0130847,11.7575787 C10.719361,11.8628603 10.3078205,11.988434 10.0582781,12 C9.74082738,12 9.43755833,11.9261979 9.14847093,11.7807968 C8.7873844,11.5770149 8.49938789,11.2553699 8.34011709,10.8764457 C8.23866377,10.6142831 8.07939298,9.82669359 8.07939298,9.81237378 C7.93338076,9.01825987 7.84871691,7.76518207 7.83655568,6.36070466 Z M1.77635684e-15,5.99955939 C1.77635684e-15,5.1612998 0.673082751,4.48165963 1.50325451,4.48165963 L5.20248239,4.80881219 C5.85374723,4.80881219 6.38174083,5.3419497 6.38174083,5.99955939 C6.38174083,6.65827061 5.85374723,7.19030659 5.20248239,7.19030659 L1.50325451,7.51745915 C0.673082751,7.51745915 1.77635684e-15,6.83781898 1.77635684e-15,5.99955939 Z"></path>
                            </g>
                        </g>
                    </svg>
                `;
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
    
    // Get pronouns based on selected character
    const pronouns = {
        they: 'they',
        their: 'their',
        them: 'them'
    };
    
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
            window.location.href = 'login.html';
        }
    }
}); 