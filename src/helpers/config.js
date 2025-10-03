/**
 * Configuration management for NativeScrollSlider
 *
 * @module helpers/config
 */

/**
 * Default slider configuration
 */
export const DEFAULT_CONFIG = {
  slidesToShow: 4,
  slidesToScroll: 1,
  infinite: false,
  bounceBack: false,
  centerMode: false,
  autoplay: false,
  autoplaySpeed: 3000,
  gap: 24,
  startSlide: 0,
  // @see https://dev.to/gerryleonugroho/responsive-design-breakpoints-2025-playbook-53ih
  responsive: [
    {
      breakpoint: 1200,
      settings: {
        slidesToShow: 3
      }
    },
    {
      breakpoint: 992,
      settings: {
        slidesToShow: 2
      }
    },
    {
      breakpoint: 768,
      settings: {
        slidesToShow: 1
      }
    },
    {
      breakpoint: 576,
      settings: {
        slidesToShow: 1
      }
    }
  ],
  prevElement: '.prev, .slider-prev, .slider-grid-prev',
  nextElement: '.next, .slider-next, .slider-grid-next',
  minSlideWidth: 0,
  showOverflow: false,
  overflowAmount: 0.5,
  containerMaxWidth: 1200,
  basePadding: 35
};

/**
 * Build configuration by merging defaults, data attributes, and passed options
 *
 * @param {HTMLElement} container - Container element
 * @param {Object} passedOptions - Options passed to constructor
 * @returns {Object} - Merged configuration
 */
export function buildConfig(container, passedOptions = {}) {
  // Try to get config from data attribute
  let dataConfig = {};
  if (container && container.dataset.sliderConfig) {
    try {
      dataConfig = JSON.parse(container.dataset.sliderConfig);
    } catch (e) {
      console.warn('NativeScrollSlider: Invalid JSON in data-slider-config', e);
    }
  }

  // Merge: defaults < dataConfig < passedOptions
  return Object.assign({}, DEFAULT_CONFIG, dataConfig, passedOptions);
}

/**
 * Setup responsive settings based on viewport width
 *
 * @param {Object} options - Base configuration options
 * @returns {Object} - Options with responsive settings applied
 */
export function applyResponsiveSettings(options) {
  const width = window.innerWidth;
  let currentOptions = Object.assign({}, options);

  // Sort responsive breakpoints in descending order (largest first)
  const sortedBreakpoints = [...options.responsive].sort((a, b) => b.breakpoint - a.breakpoint);

  // Apply settings from all matching breakpoints in cascade (largest to smallest)
  for (let i = 0; i < sortedBreakpoints.length; i++) {
    const breakpoint = sortedBreakpoints[i];
    if (width <= breakpoint.breakpoint) {
      // Apply this breakpoint's settings on top of previous settings
      currentOptions = Object.assign(currentOptions, breakpoint.settings);
    }
  }

  return currentOptions;
}
