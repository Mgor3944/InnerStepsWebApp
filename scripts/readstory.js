// Initialize story page with new layout
async function initReadStoryPage() {
    console.log('Initializing read story page with new layout...');
    
    // Verify user data is available
    const storedData = localStorage.getItem('user_data');
    if (!storedData) {
        console.error('No user_data found in localStorage');
        window.location.href = 'welcome.html';
        return;
    }
    
    // Ensure userManager is initialized and structure data is loaded
    if (!userManager.userData) {
        console.log('Initializing userManager...');
        await userManager.initialize();
    }
    
    // Wait for structure data to be loaded
    if (!userManager.structureData) {
        console.log('Loading story structure...');
        await userManager.loadStoryStructure();
    }
    
    // Get current story data
    const currentStoryId = userManager.userData.progress.current_story || 'story1';
    console.log('Current story ID:', currentStoryId);
    
    let currentStory = userManager.getCurrentStory();
    console.log('Current story data:', currentStory);
    
    if (!currentStory) {
        console.error('Failed to load current story');
        window.location.href = 'welcome.html';
        return;
    }
    
    // Set up story variables
    window.currentPage = 1;
    window.totalPages = currentStory.pages.length;
    console.log(`Story has ${window.totalPages} pages`);
    
    // Get navigation buttons
    const backBtn = document.querySelector('.nav-left');
    const nextBtn = document.querySelector('.nav-right');
    
    if (!backBtn || !nextBtn) {
        console.error('Navigation buttons not found!');
        return;
    }
    
    // Load initial content
    loadStoryContent(currentStory);
    
    // Set up navigation buttons
    backBtn.addEventListener('click', () => handleBackNavigation(currentStory));
    nextBtn.addEventListener('click', () => handleNextNavigation(currentStory));
    
    // Update button states
    updateNavigationButtons();
}

// Function to personalize story text
function personalizeStoryText(text) {
    if (!text || typeof text !== 'string') {
        console.error('Invalid text input for personalization');
        return text;
    }
    
    const userData = userManager.userData;
    if (!userData) {
        console.error('No user data available for personalization');
        return text;
    }
    
    // Get the character name, ensuring first letter is capitalized
    const characterName = userData.characterName ? 
        UserManager.capitalizeFirstLetter(userData.characterName) : 'Character';
    
    // Get pronouns
    const pronouns = userData.pronouns || {
        subject: 'they',
        object: 'them',
        possessive: 'their',
        possessivePronoun: 'theirs',
        reflexive: 'themself'
    };
    
    // Create capitalized versions of pronouns
    const capitalizedPronouns = {
        subject: UserManager.capitalizeFirstLetter(pronouns.subject),
        object: UserManager.capitalizeFirstLetter(pronouns.object),
        possessive: UserManager.capitalizeFirstLetter(pronouns.possessive),
        possessivePronoun: UserManager.capitalizeFirstLetter(pronouns.possessivePronoun),
        reflexive: UserManager.capitalizeFirstLetter(pronouns.reflexive)
    };
    
    // Replace placeholders with actual values
    let personalizedText = text
        // Replace name (both lowercase and capitalized versions)
        .replace(/\[name\]/g, characterName)
        .replace(/\[Name\]/g, characterName)
        
        // Replace standard pronouns
        .replace(/\[they\]/g, pronouns.subject)
        .replace(/\[their\]/g, pronouns.possessive)
        .replace(/\[them\]/g, pronouns.object)
        .replace(/\[theirs\]/g, pronouns.possessivePronoun)
        .replace(/\[themself\]/g, pronouns.reflexive)
        
        // Replace capitalized pronouns (for sentence beginnings)
        .replace(/\[They\]/g, capitalizedPronouns.subject)
        .replace(/\[Their\]/g, capitalizedPronouns.possessive)
        .replace(/\[Them\]/g, capitalizedPronouns.object)
        .replace(/\[Theirs\]/g, capitalizedPronouns.possessivePronoun)
        .replace(/\[Themself\]/g, capitalizedPronouns.reflexive);
    
    return personalizedText;
}

// Function to load story content
function loadStoryContent(story) {
    console.log('Loading story content for page:', window.currentPage);
    
    const storyTitle = document.getElementById('readStoryTitle');
    const storyText = document.getElementById('readStoryText');
    const leftPage = document.querySelector('.story-book-left');
    const rightPage = document.querySelector('.story-book-right');
    
    if (!storyTitle || !storyText || !leftPage || !rightPage) {
        console.error('Story content containers not found!');
        return;
    }
    
    // Get the current page content
    const pageContent = story.pages[window.currentPage - 1];
    console.log('Page content:', pageContent);
    
    if (!pageContent) {
        console.error('Page content not found!');
        return;
    }
    
    // Clear existing content
    storyText.innerHTML = '';
    
    // Add title based on page number
    if (window.currentPage === 1) {
        storyTitle.innerHTML = `<h1>${story.title}</h1>`;
    } else {
        storyTitle.innerHTML = `<h4>${story.title}</h4>`;
    }
    
    // Add story text
    if (typeof pageContent === 'string') {
        // Handle legacy string format
        const textElement = document.createElement('p');
        textElement.innerHTML = personalizeStoryText(pageContent);
        storyText.appendChild(textElement);
    } else if (pageContent && typeof pageContent === 'object') {
        if (pageContent.text) {
            if (Array.isArray(pageContent.text)) {
                // Handle array of paragraphs
                pageContent.text.forEach(paragraph => {
                    const textElement = document.createElement('p');
                    textElement.innerHTML = personalizeStoryText(paragraph);
                    storyText.appendChild(textElement);
                });
            } else {
                // Handle single text string
                const textElement = document.createElement('p');
                textElement.innerHTML = personalizeStoryText(pageContent.text);
                storyText.appendChild(textElement);
            }
        }
    }
    
    // Load story images
    if (pageContent.left_image) {
        console.log('Loading left image:', pageContent.left_image);
        leftPage.style.backgroundImage = `url(${pageContent.left_image})`;
        leftPage.style.backgroundSize = 'cover';
        leftPage.style.backgroundPosition = 'center';
        leftPage.onerror = function() {
            console.error(`Failed to load left story image, using fallback color`);
            leftPage.style.backgroundImage = 'none';
            leftPage.style.backgroundColor = '#EFDEAD';
        };
    }
    
    if (pageContent.right_image) {
        console.log('Loading right image:', pageContent.right_image);
        rightPage.style.backgroundImage = `url(${pageContent.right_image})`;
        rightPage.style.backgroundSize = 'cover';
        rightPage.style.backgroundPosition = 'center';
        rightPage.onerror = function() {
            console.error(`Failed to load right story image, using fallback color`);
            rightPage.style.backgroundImage = 'none';
            rightPage.style.backgroundColor = '#EFDEAD';
        };
    }
    
    // Update navigation buttons
    updateNavigationButtons();
}

// Function to handle back navigation
function handleBackNavigation(story) {
    if (window.currentPage > 1) {
        window.currentPage--;
        loadStoryContent(story);
    } else {
        window.location.href = 'index.html';
    }
}

// Function to handle next navigation
function handleNextNavigation(story) {
    if (window.currentPage < window.totalPages) {
        window.currentPage++;
        loadStoryContent(story);
    } else {
        window.location.href = 'practice.html';
    }
}

// Function to update navigation buttons
function updateNavigationButtons() {
    const backBtn = document.querySelector('.nav-left');
    const nextBtn = document.querySelector('.nav-right');
    
    // Both buttons should always have the same opacity and cursor
    backBtn.style.opacity = '0.8';
    backBtn.style.cursor = 'pointer';
    
    nextBtn.style.opacity = '0.8';
    nextBtn.style.cursor = 'pointer';
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    if (document.querySelector('.story-book-container')) {
        console.log('New story layout detected, initializing...');
        
        // Check localStorage for user data
        const storedData = localStorage.getItem('user_data');
        if (!storedData) {
            console.error('No user_data found in localStorage');
            window.location.href = 'welcome.html';
            return;
        }
        
        // Ensure userManager is initialized
        if (!userManager.userData) {
            await userManager.initialize();
        }
        
        // Check if we have story data
        if (userManager.userData && userManager.userData.stories) {
            initReadStoryPage();
        } else {
            console.error('No stories available in user data');
            window.location.href = 'welcome.html';
        }
    }
}); 