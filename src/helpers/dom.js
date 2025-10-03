/**
 * DOM manipulation helpers for NativeScrollSlider
 *
 * @module helpers/dom
 */

/**
 * Find the container element by looking up the DOM tree
 *
 * @param {HTMLElement} trackElement - The track element to start from
 * @returns {HTMLElement} - The container element
 */
export function findContainer(trackElement) {
  let element = trackElement;

  // Look up the DOM tree for an element with data-slider-config
  while (element && element !== document.body) {
    if (element.dataset.sliderConfig) {
      return element;
    }
    element = element.parentElement;
  }

  // If no container with config found, use track's parent or track itself
  return trackElement.parentElement || trackElement;
}

/**
 * Find navigation button using querySelector
 *
 * @param {string} selector - CSS selector for the button
 * @param {HTMLElement} container - Container element
 * @param {HTMLElement} track - Track element
 * @returns {HTMLElement|null} - The button element or null
 */
export function findNavButton(selector, container, track) {
  if (!selector) return null;

  // First try within container
  let button = container.querySelector(selector);

  // If not found, try within track
  if (!button) {
    button = track.querySelector(selector);
  }

  // If still not found, look for sibling .slider-controls container
  if (!button && container.parentElement) {
    const sliderControls = container.parentElement.querySelector('.slider-controls');
    if (sliderControls) {
      // Look for the specific prev/next button within slider-controls
      if (selector.includes('prev')) {
        button = sliderControls.querySelector('.slider-prev');
      } else if (selector.includes('next')) {
        button = sliderControls.querySelector('.slider-next');
      }
    }
  }

  return button;
}

/**
 * Calculate slide positions
 *
 * @param {Array} slides - Array of slide elements
 * @param {number} leftPadding - Left padding of the track
 * @returns {Array<number>} - Array of slide positions
 */
export function calculateSlidePositions(slides, leftPadding) {
  const positions = [];

  for (let i = 0; i < slides.length; i++) {
    positions.push(slides[i].offsetLeft - leftPadding);
  }

  return positions;
}

/**
 * Create cloned slides for infinite or bounce modes
 *
 * @param {Array} slides - Original slides array
 * @param {HTMLElement} track - Track element
 * @param {number} cloneCount - Number of slides to clone
 * @param {string} mode - 'infinite' or 'bounce'
 * @returns {Array} - All slides including clones
 */
export function createClonedSlides(slides, track, cloneCount, mode = 'infinite') {
  const totalSlides = slides.length;
  const cloneClass = mode === 'infinite' ? 'infinite-clone' : 'bounce-clone';

  if (mode === 'infinite') {
    // Clone slides to end
    for (let i = 0; i < cloneCount; i++) {
      const originalIndex = i % totalSlides;
      const clone = slides[originalIndex].cloneNode(true);
      clone.classList.add('cloned', cloneClass);
      clone.dataset.originalIndex = originalIndex;
      track.appendChild(clone);
    }

    // Clone slides to beginning
    for (let i = 0; i < cloneCount; i++) {
      const originalIndex = (totalSlides - cloneCount + i) % totalSlides;
      const clone = slides[originalIndex].cloneNode(true);
      clone.classList.add('cloned', cloneClass);
      clone.dataset.originalIndex = originalIndex;
      track.insertBefore(clone, track.firstChild);
    }
  } else {
    // Bounce mode: clone to end
    for (let i = 0; i < cloneCount; i++) {
      const clone = slides[i].cloneNode(true);
      clone.classList.add('cloned', cloneClass);
      track.appendChild(clone);
    }

    // Clone to beginning
    for (let i = totalSlides - cloneCount; i < totalSlides; i++) {
      const clone = slides[i].cloneNode(true);
      clone.classList.add('cloned', cloneClass);
      track.insertBefore(clone, track.firstChild);
    }
  }

  return Array.from(track.children);
}

/**
 * Inject required CSS styles into the document
 *
 * @returns {void}
 */
export function injectStyles() {
  if (!document.getElementById('native-scroll-slider-styles')) {
    const style = document.createElement('style');
    style.id = 'native-scroll-slider-styles';
    style.textContent = `
      .slider-ready .slider-track::-webkit-scrollbar,
      [data-slider-config] > *::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Remove cloned slides from the track
 *
 * @param {HTMLElement} track - Track element
 * @param {string} cloneClass - Class name of clones to remove
 * @returns {void}
 */
export function removeClonedSlides(track, cloneClass = '.infinite-clone') {
  if (track) {
    const clones = track.querySelectorAll(cloneClass);
    clones.forEach(clone => clone.remove());
  }
}
