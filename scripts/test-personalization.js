// Test script for story text personalization

// Mock user data for testing
const testUserData = {
    characterName: 'pip',
    gender: 'boy',
    pronouns: {
        subject: 'he',
        object: 'him',
        possessive: 'his',
        possessivePronoun: 'his',
        reflexive: 'himself'
    }
};

// Mock story text with placeholders
const testStoryText = [
    "Rain drummed against [name]'s bedroom window as morning light filtered through the clouds.",
    "As [name] splashed down the garden path, something extraordinary caught [their] eye.",
    "[They] squinted through the downpour.",
    "[Their] umbrella was getting wet.",
    "The umbrella belonged to [them], it was [theirs].",
    "[Name] looked at [themself] in the mirror."
];

// Mock UserManager for testing
const mockUserManager = {
    userData: testUserData,
    static: {
        capitalizeFirstLetter: function(string) {
            if (!string) return string;
            return string.charAt(0).toUpperCase() + string.slice(1);
        }
    }
};

// Copy of the personalizeStoryText function from story.js
function personalizeStoryText(text) {
    // If text is not a string, return a default message
    if (typeof text !== 'string') {
        console.error('personalizeStoryText received non-string input:', text);
        return 'Story content unavailable.';
    }
    
    const userData = mockUserManager.userData;
    if (!userData) return text;
    
    // Get the character name, ensuring first letter is capitalized
    const characterName = userData.characterName ? 
        UserManager.capitalizeFirstLetter(userData.characterName) : 'Character';
    
    // Get pronouns based on user data
    let pronouns = {
        they: 'they',
        their: 'their',
        them: 'them',
        theirs: 'theirs',
        themself: 'themself'
    };
    
    // Use the pronouns from user data if available
    if (userData.pronouns) {
        pronouns = {
            they: userData.pronouns.subject || 'they',
            their: userData.pronouns.possessive || 'their',
            them: userData.pronouns.object || 'them',
            theirs: userData.pronouns.possessivePronoun || 'theirs',
            themself: userData.pronouns.reflexive || 'themself'
        };
    }
    
    console.log('Using pronouns:', pronouns);
    
    // Create capitalized versions of pronouns for sentence beginnings
    const capitalizedPronouns = {};
    Object.keys(pronouns).forEach(key => {
        capitalizedPronouns[key] = UserManager.capitalizeFirstLetter(pronouns[key]);
    });
    
    // Replace placeholders with actual values
    let personalizedText = text
        // Replace name (both lowercase and capitalized versions)
        .replace(/\[name\]/g, characterName)
        .replace(/\[Name\]/g, characterName)
        
        // Replace standard pronouns
        .replace(/\[they\]/g, pronouns.they)
        .replace(/\[their\]/g, pronouns.their)
        .replace(/\[them\]/g, pronouns.them)
        .replace(/\[theirs\]/g, pronouns.theirs)
        .replace(/\[themself\]/g, pronouns.themself)
        
        // Replace capitalized pronouns (for sentence beginnings)
        .replace(/\[They\]/g, capitalizedPronouns.they)
        .replace(/\[Their\]/g, capitalizedPronouns.their)
        .replace(/\[Them\]/g, capitalizedPronouns.them)
        .replace(/\[Theirs\]/g, capitalizedPronouns.theirs)
        .replace(/\[Themself\]/g, capitalizedPronouns.themself);
    
    return personalizedText;
}

// Run the test
function runTest() {
    console.log('Running personalization test...');
    console.log('User data:', testUserData);
    
    // Fix the capitalizeFirstLetter reference
    UserManager = mockUserManager.static;
    
    // Process each test string
    testStoryText.forEach((text, index) => {
        const personalized = personalizeStoryText(text);
        console.log(`\nTest ${index + 1}:`);
        console.log('Original:', text);
        console.log('Personalized:', personalized);
    });
    
    console.log('\nTest completed!');
}

// Run the test when the script is loaded
runTest(); 