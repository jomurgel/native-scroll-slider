/**
 * Navigation functionality for NativeScrollSlider
 *
 * @module modules/navigation
 */

import { getActualSlidesToShow } from '../helpers/utils.js';
import { findCurrentCenterSlideIndex, goToCenterSlide } from './infinite-scroll.js';

/**
 * Setup navigation buttons and event listeners
 *
 * @param {Object} context - Slider instance context
 * @returns {void}
 */
export function setupNavigation(context) {
  if (context.prevBtn) {
    context.prevBtn.addEventListener('click', () => {
      prev(context);
    });
  }

  if (context.nextBtn) {
    context.nextBtn.addEventListener('click', () => {
      next(context);
    });
  }

  updateNavigation(context);
}

/**
 * Update navigation button states
 *
 * @param {Object} context - Slider instance context
 * @returns {void}
 */
export function updateNavigation(context) {
  const { prevBtn, nextBtn, currentOptions, currentSlide, track } = context;

  if (!prevBtn || !nextBtn) return;

  // For infinite mode, buttons are always enabled
  if (currentOptions.infinite) {
    prevBtn.disabled = false;
    nextBtn.disabled = false;
    return;
  }

  if (currentOptions.bounceBack) {
    prevBtn.disabled = false;
    nextBtn.disabled = false;
  } else {
    prevBtn.disabled = currentSlide === 0;

    // Calculate the actual last scrollable position
    const maxScroll = track.scrollWidth - track.clientWidth;
    const currentScroll = track.scrollLeft;

    // Disable next if we can't scroll further right
    // Add a small buffer (5px) to account for rounding errors
    nextBtn.disabled = currentScroll >= maxScroll - 5;
  }
}

/**
 * Navigate to next slide(s)
 *
 * @param {Object} context - Slider instance context
 * @returns {void}
 */
export function next(context) {
  const { currentOptions, slides, track, container, totalSlides, currentSlide } = context;

  // For infinite mode, just scroll by the specified amount
  if (currentOptions.infinite) {
    const slideWidth = slides[0].offsetWidth + currentOptions.gap;
    const scrollAmount = slideWidth * currentOptions.slidesToScroll;

    if (currentOptions.centerMode) {
      const currentCenterSlide = findCurrentCenterSlideIndex(context);
      const nextCenterSlide = currentCenterSlide + currentOptions.slidesToScroll;
      goToCenterSlide(context, nextCenterSlide);
    } else {
      track.scrollTo({
        left: track.scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
    return;
  }

  const actualSlidesToShow = getActualSlidesToShow(container, slides, currentOptions.gap, currentOptions.slidesToShow);

  // Non-infinite mode logic
  let nextSlide;
  if (currentOptions.bounceBack) {
    nextSlide = (currentSlide + currentOptions.slidesToScroll) % totalSlides;
  } else {
    nextSlide = Math.min(
      currentSlide + currentOptions.slidesToScroll,
      totalSlides - actualSlidesToShow
    );
  }

  goToSlide(context, nextSlide);
}

/**
 * Navigate to previous slide(s)
 *
 * @param {Object} context - Slider instance context
 * @returns {void}
 */
export function prev(context) {
  const { currentOptions, slides, track, currentSlide, totalSlides } = context;

  // For infinite mode, just scroll by the specified amount
  if (currentOptions.infinite) {
    const slideWidth = slides[0].offsetWidth + currentOptions.gap;
    const scrollAmount = slideWidth * currentOptions.slidesToScroll;

    if (currentOptions.centerMode) {
      const currentCenterSlide = findCurrentCenterSlideIndex(context);
      const prevCenterSlide = currentCenterSlide - currentOptions.slidesToScroll;
      goToCenterSlide(context, prevCenterSlide);
    } else {
      track.scrollTo({
        left: track.scrollLeft - scrollAmount,
        behavior: 'smooth'
      });
    }
    return;
  }

  // Non-infinite mode logic
  let prevSlide;
  if (currentOptions.bounceBack) {
    prevSlide = currentSlide - currentOptions.slidesToScroll;
    if (prevSlide < 0) {
      prevSlide = totalSlides + prevSlide;
    }
  } else {
    prevSlide = Math.max(currentSlide - currentOptions.slidesToScroll, 0);
  }

  goToSlide(context, prevSlide);
}

/**
 * Go to a specific slide
 *
 * @param {Object} context - Slider instance context
 * @param {number} slideIndex - Index of slide to navigate to
 * @returns {void}
 */
export function goToSlide(context, slideIndex) {
  const { currentOptions, totalSlides, slidePositions, slides, container, track } = context;

  // For infinite mode, don't use goToSlide - just use next/prev buttons
  if (currentOptions.infinite) {
    return;
  }

  if (slideIndex < 0 || slideIndex >= totalSlides) return;

  let targetPosition;

  if (currentOptions.bounceBack) {
    const cloneCount = Math.max(currentOptions.slidesToShow, 2);
    targetPosition = slidePositions[cloneCount + slideIndex];
  } else {
    targetPosition = slidePositions[slideIndex];
  }

  if (currentOptions.centerMode) {
    // Get actual container dimensions accounting for padding
    const containerStyles = window.getComputedStyle(container);
    const containerPaddingLeft = parseFloat(containerStyles.paddingLeft) || 0;
    const containerPaddingRight = parseFloat(containerStyles.paddingRight) || 0;
    const containerInnerWidth = container.offsetWidth - containerPaddingLeft - containerPaddingRight;

    const slideWidth = slides[0].offsetWidth;

    // Center the slide within the container's inner width
    targetPosition = targetPosition - (containerInnerWidth / 2) + (slideWidth / 2);

    // Account for container padding offset in scroll position
    targetPosition = targetPosition - containerPaddingLeft;
  }

  track.scrollTo({
    left: targetPosition,
    behavior: 'smooth'
  });

  context.currentSlide = slideIndex;
}
