// Mobile redirection script
document.addEventListener('DOMContentLoaded', function() {
    // Function to check if screen width is below 1000px
    function isMobileDevice() {
        return window.innerWidth < 1000;
    }
    
    // Function to redirect to under-construction page
    function redirectToMobilePage() {
        // Get current page
        const currentPage = window.location.pathname;
        
        // Only redirect if not already on the under-construction page
        if (currentPage.indexOf('under-construction.html') === -1) {
            window.location.href = 'under-construction.html';
        }
    }
    
    // Check on page load
    if (isMobileDevice()) {
        redirectToMobilePage();
    }
    
    // Also check on resize (in case user rotates device or resizes browser)
    window.addEventListener('resize', function() {
        if (isMobileDevice()) {
            redirectToMobilePage();
        }
    });
}); 