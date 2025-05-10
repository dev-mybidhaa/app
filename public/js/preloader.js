// Wait for both DOM and all assets (images, etc.) to load
window.addEventListener('load', function() {
    // Safely handle preloader
    const preloader = document.getElementById('biof-loading');
    
    // Only try to hide if preloader exists
    if (preloader) {
        // Add fade-out animation
        preloader.style.transition = 'opacity 0.5s ease';
        preloader.style.opacity = '0';
        
        // Remove after animation completes
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 500); // Match this timeout to your CSS transition time
    } else {
        console.warn('Preloader element (#biof-loading) not found');
    }
    
    // Optional: Show content (if you have a #content element)
    const content = document.getElementById('content');
    if (content) {
        content.style.display = 'block';
    }
});