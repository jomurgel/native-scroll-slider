/**
 * Infinite scroll functionality for NativeScrollSlider
 *
 * @module modules/infinite-scroll
 */

/**
 * Handle infinite scroll with seamless looping
 *
 * @param {Object} context - Slider instance context
 * @returns {void}
 */
export function handleInfiniteScroll(context) {
  if (!context.infiniteScrollSetup) return;

  const { track, slides, slidePositions, initialCloneCount, currentOptions } = context;
  const scrollLeft = track.scrollLeft;
  const slideWidth = slides[0].offsetWidth + currentOptions.gap;
  const totalOriginalWidth = context.totalSlides * slideWidth;

  // Calculate the boundaries where we need to "teleport"
  const leftBoundary = slideWidth * 2; // 2 slides worth of buffer
  const rightBoundary = slidePositions[initialCloneCount + context.totalSlides] - slideWidth * 2;

  // If we've scrolled too far left, jump to the equivalent position on the right
  if (scrollLeft <= leftBoundary) {
    const equivalentPosition = scrollLeft + totalOriginalWidth;
    seamlessJump(track, equivalentPosition);
  }
  // If we've scrolled too far right, jump to the equivalent position on the left
  else if (scrollLeft >= rightBoundary) {
    const equivalentPosition = scrollLeft - totalOriginalWidth;
    seamlessJump(track, equivalentPosition);
  }
}

/**
 * Perform a seamless jump to maintain infinite scroll illusion
 *
 * @param {HTMLElement} track - Track element
 * @param {number} newPosition - The new scroll position
 * @returns {void}
 */
export function seamlessJump(track, newPosition) {
  // Temporarily disable smooth scrolling for the jump
  const originalBehavior = track.style.scrollBehavior;
  track.style.scrollBehavior = 'auto';

  // Perform the jump
  track.scrollLeft = newPosition;

  // Re-enable smooth scrolling after a small delay
  setTimeout(() => {
    track.style.scrollBehavior = originalBehavior || 'smooth';
  }, 10);
}

/**
 * Find the index of the currently centered slide in infinite mode
 *
 * @param {Object} context - Slider instance context
 * @returns {number} - Index of centered slide
 */
export function findCurrentCenterSlideIndex(context) {
  const { track, allSlides, slides } = context;
  const scrollLeft = track.scrollLeft;
  const trackStyles = window.getComputedStyle(track);
  const trackPaddingLeft = parseFloat(trackStyles.paddingLeft) || 0;
  const visibleTrackWidth = track.offsetWidth - trackPaddingLeft - (parseFloat(trackStyles.paddingRight) || 0);

  // Find the center point of the visible area
  const centerPoint = scrollLeft + (visibleTrackWidth / 2);

  let closestSlide = 0;
  let closestDistance = Infinity;

  const slidesToUse = allSlides || slides;
  for (let i = 0; i < slidesToUse.length; i++) {
    const slide = slidesToUse[i];
    const slideCenter = slide.offsetLeft + (slide.offsetWidth / 2) - trackPaddingLeft;
    const distance = Math.abs(centerPoint - slideCenter);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestSlide = i;
    }
  }

  return closestSlide;
}

/**
 * Go to a specific slide index and center it (for infinite mode)
 *
 * @param {Object} context - Slider instance context
 * @param {number} slideIndex - Index of slide to center
 * @returns {void}
 */
export function goToCenterSlide(context, slideIndex) {
  const { track, allSlides, slides } = context;
  const slidesToUse = allSlides || slides;

  // Make sure index is within bounds
  if (slideIndex < 0 || slideIndex >= slidesToUse.length) {
    return;
  }

  const targetSlide = slidesToUse[slideIndex];
  const trackStyles = window.getComputedStyle(track);
  const trackPaddingLeft = parseFloat(trackStyles.paddingLeft) || 0;
  const trackPaddingRight = parseFloat(trackStyles.paddingRight) || 0;
  const visibleTrackWidth = track.offsetWidth - trackPaddingLeft - trackPaddingRight;

  // Calculate position to center this slide
  const slideLeft = targetSlide.offsetLeft - trackPaddingLeft;
  const slideWidth = targetSlide.offsetWidth;
  const targetPosition = slideLeft - (visibleTrackWidth / 2) + (slideWidth / 2);

  track.scrollTo({
    left: targetPosition,
    behavior: 'smooth'
  });
}

/**
 * Setup true infinite scroll with clones
 *
 * @param {Object} context - Slider instance context
 * @returns {void}
 */
export function setupTrueInfinite(context) {
  const { container, track, slides, currentOptions } = context;

  // Calculate how many clones we need for smooth infinite scrolling
  const containerWidth = container.offsetWidth;
  const slideWidth = slides[0].offsetWidth + currentOptions.gap;
  const slidesPerView = Math.ceil(containerWidth / slideWidth);

  // Create enough clones to fill at least 2 viewport widths on each side
  const clonesNeeded = Math.max(context.totalSlides, slidesPerView * 2);

  context.initialCloneCount = clonesNeeded;

  // Clone slides to the end
  for (let i = 0; i < clonesNeeded; i++) {
    const originalIndex = i % context.totalSlides;
    const clone = slides[originalIndex].cloneNode(true);
    clone.classList.add('cloned', 'infinite-clone');
    clone.dataset.originalIndex = originalIndex;
    track.appendChild(clone);
  }

  // Clone slides to the beginning
  for (let i = 0; i < clonesNeeded; i++) {
    const originalIndex = (context.totalSlides - 1 - (i % context.totalSlides)) % context.totalSlides;
    const clone = slides[originalIndex].cloneNode(true);
    clone.classList.add('cloned', 'infinite-clone');
    clone.dataset.originalIndex = originalIndex;
    track.insertBefore(clone, track.firstChild);
  }

  context.allSlides = Array.from(track.children);

  // Set initial position after DOM updates
  setTimeout(() => {
    const slidePositions = [];
    const leftPadding = parseFloat(track.style.paddingLeft) || 0;
    for (let i = 0; i < context.allSlides.length; i++) {
      slidePositions.push(context.allSlides[i].offsetLeft - leftPadding);
    }
    context.slidePositions = slidePositions;

    // Start in the middle section (original slides)
    const startIndex = clonesNeeded + currentOptions.startSlide;
    let initialPosition = slidePositions[startIndex];

    // Apply centerMode calculations if needed
    if (currentOptions.centerMode) {
      const trackStyles = window.getComputedStyle(track);
      const trackPaddingLeft = parseFloat(trackStyles.paddingLeft) || 0;
      const trackPaddingRight = parseFloat(trackStyles.paddingRight) || 0;
      const visibleTrackWidth = track.offsetWidth - trackPaddingLeft - trackPaddingRight;
      const slideWidth = slides[0].offsetWidth;
      initialPosition = initialPosition - (visibleTrackWidth / 2) + (slideWidth / 2);
    }

    // Disable smooth scrolling temporarily for initial positioning
    track.style.scrollBehavior = 'auto';
    track.scrollLeft = initialPosition;
    track.style.scrollBehavior = 'smooth';

    context.currentSlide = currentOptions.startSlide;
    context.infiniteScrollSetup = true;
  }, 10);
}
