document.addEventListener('DOMContentLoaded', () => {
    const textElement = document.querySelector('.terminal-text');
    
    if (textElement) {
        const count = textElement.textContent.length;
        textElement.style.setProperty('--char-count', count);
        
        // Optional: Log it to make sure it's working
        console.log("Character count set to:", count);
    }
});
