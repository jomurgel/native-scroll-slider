/**
 * Utility functions for NativeScrollSlider
 *
 * @module helpers/utils
 */

/**
 * Parse minSlideWidth from string or number
 *
 * @param {string|number} minWidth - The minimum slide width value
 * @returns {number} - Parsed numeric value or 0
 */
export function parseMinSlideWidth(minWidth) {
  if (!minWidth) return 0;

  if (typeof minWidth === 'string') {
    // Handle "0px", "100px", etc.
    const numericValue = parseFloat(minWidth);
    return isNaN(numericValue) ? 0 : numericValue;
  }

  return typeof minWidth === 'number' ? minWidth : 0;
}

/**
 * Calculate how many slides are actually visible in the current viewport
 *
 * @param {HTMLElement} container - The container element
 * @param {Array} slides - Array of slide elements
 * @param {number} gap - Gap between slides
 * @param {number} configuredSlidesToShow - Configured slides to show
 * @returns {number} - Actual number of slides visible
 */
export function getActualSlidesToShow(container, slides, gap, configuredSlidesToShow) {
  if (!slides.length) return configuredSlidesToShow;

  const containerWidth = container.offsetWidth;
  const slideWidth = slides[0].offsetWidth;

  // Calculate how many slides actually fit in the visible area
  const actualSlidesToShow = Math.floor((containerWidth + gap) / (slideWidth + gap));

  // Return the smaller of configured vs actual
  return Math.min(actualSlidesToShow, configuredSlidesToShow);
}

/**
 * Calculate slide width based on container, gaps, and configuration
 *
 * @param {Object} params - Calculation parameters
 * @param {number} params.containerWidth - Width of container
 * @param {number} params.slidesToShow - Number of slides to show
 * @param {number} params.gap - Gap between slides
 * @param {number} params.minSlideWidth - Minimum slide width
 * @returns {Object} - Calculated dimensions {slideWidth, totalNeededWidth, leftPadding}
 */
export function calculateSlideWidth({ containerWidth, slidesToShow, gap, minSlideWidth }) {
  const totalGaps = (slidesToShow - 1) * gap;
  let calculatedSlideWidth = (containerWidth - totalGaps) / slidesToShow;

  let slideWidth;
  let totalNeededWidth;
  let leftPadding;

  // Apply minSlideWidth constraint
  const parsedMinWidth = parseMinSlideWidth(minSlideWidth);
  if (parsedMinWidth > 0 && calculatedSlideWidth < parsedMinWidth) {
    slideWidth = parsedMinWidth;
    totalNeededWidth = (slideWidth * slidesToShow) + totalGaps;
    leftPadding = Math.max(0, (containerWidth - totalNeededWidth) / 2);
  } else {
    slideWidth = calculatedSlideWidth;
    totalNeededWidth = (slideWidth * slidesToShow) + totalGaps;
    leftPadding = Math.max(0, (containerWidth - totalNeededWidth) / 2);
  }

  return { slideWidth, totalNeededWidth, leftPadding };
}

/**
 * Apply slide widths to all slides
 *
 * @param {Array} slides - Array of slide elements
 * @param {number} width - Width to apply to each slide
 * @returns {void}
 */
export function applySlideWidths(slides, width) {
  for (let i = 0; i < slides.length; i++) {
    if (slides[i] && slides[i].style) {
      slides[i].style.width = width + 'px';
      slides[i].style.flexShrink = '0';
    }
  }
}
