document.addEventListener("DOMContentLoaded", () => {
  const lines = document.querySelectorAll('.terminal-text');
  
  lines.forEach(line => {
    const length = line.textContent.length;
    line.style.setProperty('--char-count', length);
  });
});
