// === JOURNEY MAP INITIALIZATION ===
async function initJourneyMap() {
    if (!document.querySelector('.journey-page')) return;
    
    console.log('Initializing journey map...');
    
    // Ensure user data is loaded
    if (!userManager.userData) {
        console.log('User data not loaded, loading now...');
        await userManager.loadUserData();
    }
    
    // Check user data again after loading
    if (!userManager.userData || !userManager.userData.stories) {
        console.error('No user data or stories found');
        window.location.href = 'welcome.html';
        return;
    }

    // Update character name in header
    updateCharacterNameInHeader();

    // Calculate chapter progress
    const completedStories = Object.values(userManager.userData.stories)
        .filter(story => story.completed).length;
    const totalStories = Object.keys(userManager.userData.stories).length;
    const progressPercentage = (completedStories / totalStories) * 100;
    
    // Update progress bar
    const progressBar = document.querySelector('.j-header-progress-bar');
    const stageName = document.querySelector('.j-header-stage-name');
    
    if (progressBar && stageName) {
        progressBar.style.width = `${progressPercentage}%`;
        updateStageNameColor();
    }
    
    // Get the container for journey stage nodes
    const journeyMapContainer = document.querySelector('.journey-map-container');
    if (!journeyMapContainer) {
        console.error('Journey map container not found');
        return;
    }

    // Clear existing content
    journeyMapContainer.innerHTML = '';
    
    // Get current character and storyline
    const character = userManager.userData.progress.selectedCharacter;
    const storyline = userManager.userData.progress.selectedStoryline;
    
    // Ensure story structure is loaded
    if (!userManager.structureData) {
        console.log('Story structure not loaded, loading now...');
        await userManager.loadStoryStructure();
    }
    
    // Get structure stories
    if (!userManager.structureData || 
        !userManager.structureData.chapter_1 || 
        !userManager.structureData.chapter_1.storylines || 
        !userManager.structureData.chapter_1.storylines[storyline]) {
        console.error('Missing storyline data:', storyline);
        return;
    }
    
    const structureStories = userManager.structureData.chapter_1.storylines[storyline].stories;
    
    // Create journey stage nodes
    let storyIndex = 1;
    Object.entries(structureStories).forEach(([storyId, storyData]) => {
        const userStory = userManager.userData.stories[storyId] || { completed: false };
        const node = createJourneyStageNode(storyId, storyData, userStory, storyIndex);
        journeyMapContainer.appendChild(node);
        storyIndex++;
    });
}

// Helper function to update character name in header
function updateCharacterNameInHeader() {
    const characterNameElements = document.querySelectorAll('.character-name-placeholder');
    if (userManager.userData && userManager.userData.characterName) {
        const characterName = UserManager.capitalizeFirstLetter(userManager.userData.characterName);
        
        characterNameElements.forEach(element => {
            if (element.dataset.possessive === 'true') {
                element.textContent = `${characterName}'s`;
            } else {
                element.textContent = characterName;
            }
        });
    }
}

// Helper function to create a journey stage node
function createJourneyStageNode(storyId, storyData, userStoryData, storyIndex) {
    // Determine completion status
    let completionStatus = 'locked';
    let statusText = "Haven't Unlocked Yet";
    
    if (userStoryData.completed) {
        completionStatus = 'completed';
        statusText = 'Completed';
    } else if (isStoryUnlocked(storyId)) {
        completionStatus = 'unlocked';
        statusText = 'Next To Read';
    }

    // Create the node HTML
    const nodeHTML = `
        <div class="journey-stage-node">
            <div class="node-container" id="STAGE-1-${storyIndex}" data-status="${completionStatus}">
                <div class="node-inner-container">
                    <div class="node-content">
                        <div class="book-aesthetic-line"></div>
                        <div class="book-title-container">
                            <h3 class="stage-chapter">Chapter ${storyIndex}</h3>
                            <h1 class="stage-title">${storyData.title || `Story ${storyIndex}`}</h1>
                        </div>
                        <div class="completion-status-container">${statusText}</div>
                    </div>
                </div>
            </div>
            <div class="node-shadow"></div>
        </div>
    `;

    // Create a temporary container to parse the HTML
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = nodeHTML;
    const node = tempContainer.firstElementChild;

    // Add click event if the story is unlocked or completed
    if (completionStatus !== 'locked') {
        const nodeContainer = node.querySelector('.node-container');
        nodeContainer.classList.add('clickable');
        nodeContainer.addEventListener('click', () => startStory(storyId));
    }

    // Check if this node should have the unlocking animation
    const storyToAnimate = localStorage.getItem('story_to_animate');
    if (storyToAnimate === storyId) {
        const nodeContainer = node.querySelector('.node-container');
        nodeContainer.setAttribute('data-animation', 'unlocking');
        localStorage.removeItem('story_to_animate');
    }

    return node;
}

// Helper function to check if a story is unlocked
function isStoryUnlocked(storyId) {
    // Story 1 is always unlocked
    if (storyId === 'story1') {
        return true;
    }
    
    // Get the story number from the ID
    const storyNumber = parseInt(storyId.replace('story', ''));
    
    // Previous story must be completed to unlock the next one
    const previousStoryId = `story${storyNumber - 1}`;
    return userManager.userData.stories[previousStoryId]?.completed === true;
}

// Function to start a story
function startStory(storyId) {
    // Set the current story in user data
    userManager.userData.progress.current_story = storyId;
    userManager.saveUserData();
    
    // Navigate to the story page
    window.location.href = 'readstory.html';
}

// Helper function to update stage name color based on progress bar overlap
function updateStageNameColor() {
    const progressBar = document.querySelector('.j-header-progress-bar');
    const stageName = document.querySelector('.j-header-stage-name');
    const container = document.querySelector('.j-header-progress-container');
    
    if (!progressBar || !stageName || !container) return;
    
    const containerRect = container.getBoundingClientRect();
    const stageNameCenter = containerRect.width / 2;
    
    const computedStyle = window.getComputedStyle(progressBar);
    const computedWidth = parseFloat(computedStyle.width);
    
    let progressBarRight;
    if (!isNaN(computedWidth)) {
        progressBarRight = computedWidth;
    } else {
        const widthPercentage = parseFloat(progressBar.style.width) || 0;
        progressBarRight = (widthPercentage / 100) * containerRect.width;
    }
    
    if (progressBarRight >= stageNameCenter - 10) {
        stageName.classList.add('overlapped');
    } else {
        stageName.classList.remove('overlapped');
    }
}

// Initialize journey map when the page loads
document.addEventListener('DOMContentLoaded', initJourneyMap); 