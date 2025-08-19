import { Game } from './game.js';

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    new Game();
  } catch (error) {
    console.error('Failed to initialize game:', error);
    alert('Failed to initialize game. Please refresh the page.');
  }
});

// Prevent default behavior for arrow keys and space bar
document.addEventListener('keydown', (event) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
    event.preventDefault();
  }
});

// Add some global styles for better mobile experience
const style = document.createElement('style');
style.textContent = `
  * {
    box-sizing: border-box;
  }
  
  body {
    touch-action: manipulation;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
  
  canvas {
    touch-action: none;
  }
`;
document.head.appendChild(style);