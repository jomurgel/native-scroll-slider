/**
 * Autoplay functionality for NativeScrollSlider
 *
 * @module modules/autoplay
 */

/**
 * Setup autoplay with pause on hover
 *
 * @param {Object} context - Slider instance context
 * @returns {void}
 */
export function setupAutoplay(context) {
  if (context.currentOptions.autoplay) {
    startAutoplay(context);

    context.container.addEventListener('mouseenter', () => {
      pauseAutoplay(context);
    });
    context.container.addEventListener('mouseleave', () => {
      resumeAutoplay(context);
    });
  }
}

/**
 * Start autoplay interval
 *
 * @param {Object} context - Slider instance context
 * @returns {void}
 */
export function startAutoplay(context) {
  if (!context.currentOptions.autoplay) return;

  stopAutoplay(context);

  context.autoplayInterval = setInterval(() => {
    if (!context.isScrolling) {
      if (context.currentOptions.infinite) {
        // For infinite mode, always use next() method which handles centerMode properly
        const slideWidth = context.slides[0].offsetWidth + context.currentOptions.gap;
        const scrollAmount = slideWidth * context.currentOptions.slidesToScroll;

        if (context.currentOptions.centerMode) {
          const { findCurrentCenterSlideIndex, goToCenterSlide } = require('./infinite-scroll.js');
          const currentCenterSlide = findCurrentCenterSlideIndex(context);
          const nextCenterSlide = currentCenterSlide + context.currentOptions.slidesToScroll;
          goToCenterSlide(context, nextCenterSlide);
        } else {
          context.track.scrollTo({
            left: context.track.scrollLeft + scrollAmount,
            behavior: 'smooth'
          });
        }
      } else {
        // Non-infinite modes use next() method
        const { next } = require('./navigation.js');
        next(context);
      }
    }
  }, context.currentOptions.autoplaySpeed);
}

/**
 * Stop autoplay interval
 *
 * @param {Object} context - Slider instance context
 * @returns {void}
 */
export function stopAutoplay(context) {
  if (context.autoplayInterval) {
    clearInterval(context.autoplayInterval);
    context.autoplayInterval = null;
  }
}

/**
 * Pause autoplay
 *
 * @param {Object} context - Slider instance context
 * @returns {void}
 */
export function pauseAutoplay(context) {
  context.autoplayPaused = true;
  stopAutoplay(context);
}

/**
 * Resume autoplay after pause
 *
 * @param {Object} context - Slider instance context
 * @returns {void}
 */
export function resumeAutoplay(context) {
  if (context.currentOptions.autoplay && context.autoplayPaused) {
    context.autoplayPaused = false;
    setTimeout(() => {
      if (!context.autoplayPaused && !context.isScrolling) {
        startAutoplay(context);
      }
    }, 1000);
  }
}
