document.addEventListener("DOMContentLoaded", () => {
  const lines = document.querySelectorAll('.terminal-text');
  
  lines.forEach(line => {
    const length = line.textContent.length;
    line.style.setProperty('--char-count', length);
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const lines = document.querySelectorAll('.terminal-text');
  let cumulativeDelay = 0;

  lines.forEach((line, index) => {
    const length = line.textContent.length;
    // How long this specific line takes to type (e.g., 0.05s per character)
    const duration = length * 0.05; 

    line.style.setProperty('--char-count', length);
    line.style.setProperty('--delay', `${cumulativeDelay}s`);
    line.style.setProperty('--duration', `${duration}s`);

    // The next line starts only after this one finishes
    cumulativeDelay += duration;
  });
});
