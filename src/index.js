/**
 * NativeScrollSlider
 *
 * A simple slider that leverages native overflow scroll behavior.
 *
 * @author Jo Murgel
 * @version 0.0.2
 * @license MIT
 * @copyright 2024 Jo Murgel
 * @see https://github.com/jomurgel/native-scroll-slider
 * @see https://www.npmjs.com/package/@jomurgel/native-scroll-slider
 */
class NativeScrollSlider {

  /**
       * Initialize the slider.
       *
       * @constructor
       * @param {HTMLElement} trackElement - The track element containing the slides.
       * @param {Object} options - The options for the slider.
       * @returns {void}
       */
  constructor(trackElement, options = {}) {
    // Safety checks
    if (!trackElement) {
      console.error('NativeScrollSlider: trackElement is null or undefined');
      return;
    }

    this.track = trackElement;

    // Find container - look up the DOM tree for a container with data-slider-config or use parent
    this.container = this.findContainer(trackElement);

    // Merge options: defaults < data-slider-config < passed options
    this.options = this.buildConfig(options);

    // Find slides within the track
    this.slides = Array.from(this.track.children);

    if (this.slides.length === 0) {
      console.error('NativeScrollSlider: no slides found in track', this.track);
      return;
    }

    // Find navigation buttons
    this.prevBtn = this.findNavButton(this.options.prevElement);
    this.nextBtn = this.findNavButton(this.options.nextElement);

    this.currentSlide = 0;
    this.totalSlides = this.slides.length;
    this.autoplayInterval = null;
    this.slidePositions = [];
    this.isScrolling = false;
    this.scrollTimeout = null;

    this.init();
  }

  /**
       * Find the container element by looking up the DOM tree
       *
       * @param {HTMLElement} trackElement
       * @returns {HTMLElement}
       */
  findContainer(trackElement) {
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
       * Build the configuration by merging defaults, data attributes, and passed options
       *
       * @param {Object} passedOptions
       * @returns {Object}
       */
  buildConfig(passedOptions) {
    // Default configuration
    const defaults = {
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

    // Try to get config from data attribute
    let dataConfig = {};
    if (this.container && this.container.dataset.sliderConfig) {
      try {
        dataConfig = JSON.parse(this.container.dataset.sliderConfig);
      } catch (e) {
        console.warn('NativeScrollSlider: Invalid JSON in data-slider-config', e);
      }
    }

    // Merge: defaults < dataConfig < passedOptions
    return Object.assign({}, defaults, dataConfig, passedOptions);
  }

  /**
       * Find navigation button using querySelector
       *
       * @param {string} selector
       * @returns {HTMLElement|null}
       */
  findNavButton(selector) {
    if (!selector) return null;

    // First try within container
    let button = this.container.querySelector(selector);

    // If not found, try within track
    if (!button) {
      button = this.track.querySelector(selector);
    }

    // If still not found, try document (for cases where buttons are outside)
    if (!button) {
      button = document.querySelector(selector);
    }

    return button;
  }

  /**
       * Initialize the slider.
       *
       * @returns {void}
       */
  init() {
    // Setup responsive settings FIRST
    this.setupResponsive();

    // Now we can setup track styles with correct currentOptions
    this.setupTrackStyles();

    this.setupSlides();
    this.calculateSlidePositions();
    this.setupNavigation();
    this.setupScrollListener();
    this.setupAutoplay();

    const self = this;
    window.addEventListener('resize', () => {
      self.handleResize();
    });

    this.container.classList.add('slider-ready');

    setTimeout(() => {
      self.goToSlide(self.currentOptions.startSlide);
    }, 50);

    this.updateCurrentSlideFromScroll();
  }

  /**
       * Setup basic track styles for horizontal scrolling
       *
       * @returns {void}
       */
  setupTrackStyles() {
    this.track.style.display = 'flex';
    this.track.style.overflowX = 'auto';
    this.track.style.scrollBehavior = 'smooth';
    this.track.style.scrollbarWidth = 'none';
    this.track.style.msOverflowStyle = 'none';

    // Setup or reset pull-to-right styles based on current options
    if (this.currentOptions.showOverflow) {
      this.setupPullToRightStyles();
    } else {
      this.resetPullToRightStyles();
    }

    // Hide webkit scrollbars
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
       * Setup pull-to-right styles to break out to viewport width
       *
       * @returns {void}
       */
  setupPullToRightStyles() {
    // Break container out to full viewport width
    this.container.style.width = '100vw';
    this.container.style.position = 'relative';
    this.container.style.left = '50%';
    this.container.style.right = '50%';
    this.container.style.marginLeft = '-50vw';
    this.container.style.marginRight = '-50vw';

    // Calculate left padding to maintain alignment with page content
    this.updatePullToRightPadding();
  }

  /**
       * Reset pull-to-right styles when disabled
       *
       * @returns {void}
       */
  resetPullToRightStyles() {
    // Reset container styles
    this.container.style.width = '';
    this.container.style.position = '';
    this.container.style.left = '';
    this.container.style.right = '';
    this.container.style.marginLeft = '';
    this.container.style.marginRight = '';

    // Reset track padding - it will be recalculated in setupSlides
    this.track.style.paddingLeft = '';
    this.track.style.paddingRight = '';

    // Clear stored padding
    this.pullToRightLeftPadding = 0;
  }

  /**
       * Update pull-to-right padding based on viewport and container size
       *
       * @returns {void}
       */
  updatePullToRightPadding() {
    if (!this.currentOptions.showOverflow) {
      return;
    }

    const viewportWidth = window.innerWidth;
    const containerMaxWidth = this.currentOptions.containerMaxWidth; // Use currentOptions
    const basePadding = this.currentOptions.basePadding; // Use currentOptions

    let leftPadding;

    if (viewportWidth <= containerMaxWidth + (basePadding * 2)) {
      // On smaller screens, just use base padding
      leftPadding = basePadding;
    } else {
      // On larger screens, calculate padding to align with page content
      leftPadding = Math.max(basePadding, (viewportWidth - containerMaxWidth) / 2 + basePadding);
    }

    // Apply the calculated padding
    this.track.style.paddingLeft = leftPadding + 'px';
    this.track.style.paddingRight = basePadding + 'px';

    // Store the calculated padding for use in slide calculations
    this.pullToRightLeftPadding = leftPadding;
  }

  /**
     * Setup the responsive settings.
     *
     * @returns {void}
     */
  setupResponsive() {
    const width = window.innerWidth;
    let currentOptions = Object.assign({}, this.options);

    // Sort responsive breakpoints in descending order (largest first)
    const sortedBreakpoints = [...this.options.responsive].sort((a, b) => b.breakpoint - a.breakpoint);

    // Apply settings from all matching breakpoints in cascade (largest to smallest)
    for (let i = 0; i < sortedBreakpoints.length; i++) {
      const breakpoint = sortedBreakpoints[i];
      if (width <= breakpoint.breakpoint) {
        // Apply this breakpoint's settings on top of previous settings
        currentOptions = Object.assign(currentOptions, breakpoint.settings);
        // Don't break - continue to apply smaller breakpoints too
      }
    }

    this.currentOptions = currentOptions;
  }

  /**
   * Setup the slides.
   *
   * @returns {void}
   */
  setupSlides() {
    if (!this.track) {
      console.error('setupSlides: track is null');
      return;
    }

    this.track.style.gap = this.currentOptions.gap + 'px';

    if (!this.container) {
      console.error('setupSlides: container is null');
      return;
    }

    let containerWidth = this.container.offsetWidth;
    let availableWidth, leftPadding, totalGaps, slideWidth, overflowSlideWidth, totalNeededWidth;

    // Handle pull-to-right mode
    if (this.currentOptions.showOverflow) {
      // Update padding first
      this.updatePullToRightPadding();

      // Use viewport width for calculations since container is now 100vw
      containerWidth = window.innerWidth;

      // Account for the left padding we applied
      const effectiveWidth = containerWidth - this.pullToRightLeftPadding - this.currentOptions.basePadding;

      totalGaps = (this.currentOptions.slidesToShow - 1) * this.currentOptions.gap;
      overflowSlideWidth = 0;

      if (this.currentOptions.overflowAmount > 0) {
        const tempSlideWidth = (effectiveWidth - totalGaps - this.currentOptions.gap) / (this.currentOptions.slidesToShow + this.currentOptions.overflowAmount);
        overflowSlideWidth = tempSlideWidth * this.currentOptions.overflowAmount;
      }

      let calculatedSlideWidth = (effectiveWidth - totalGaps - overflowSlideWidth) / this.currentOptions.slidesToShow;

      // Apply minSlideWidth if defined - force it regardless of slidesToShow
      const minSlideWidth = this.parseMinSlideWidth();
      if (minSlideWidth > 0 && calculatedSlideWidth < minSlideWidth) {
        slideWidth = minSlideWidth;

        // Calculate how many slides can actually fit at this minimum width
        // For overflow mode, we need to account for the overflow space too
        const availableForSlides = effectiveWidth - overflowSlideWidth;
        const maxSlidesAtMinWidth = Math.floor((availableForSlides + this.currentOptions.gap) / (minSlideWidth + this.currentOptions.gap));
        const actualSlidesToShow = Math.max(1, Math.min(maxSlidesAtMinWidth, this.currentOptions.slidesToShow));

        console.log('showOverflow mode - minSlideWidth forcing layout change:');
        console.log('- configured slidesToShow:', this.currentOptions.slidesToShow);
        console.log('- actual slides that fit:', actualSlidesToShow);
        console.log('- slideWidth:', slideWidth);
        console.log('- effectiveWidth:', effectiveWidth);
      } else {
        slideWidth = calculatedSlideWidth;
      }

      availableWidth = effectiveWidth;

      // Don't add additional padding - we already set it in updatePullToRightPadding
      leftPadding = 0;
    } else {
      // Regular mode
      totalGaps = (this.currentOptions.slidesToShow - 1) * this.currentOptions.gap;
      let calculatedSlideWidth = (containerWidth - totalGaps) / this.currentOptions.slidesToShow;

      // Apply minSlideWidth constraint - force the width but don't change slide count
      const minSlideWidth = this.parseMinSlideWidth();
      if (minSlideWidth > 0 && calculatedSlideWidth < minSlideWidth) {
        slideWidth = minSlideWidth;

        // Keep original slidesToShow but recalculate total needed width
        totalNeededWidth = (slideWidth * this.currentOptions.slidesToShow) + totalGaps;

        if (this.currentOptions.centerMode) {
          // For center mode, center the content within container
          leftPadding = Math.max(0, (containerWidth - totalNeededWidth) / 2);
          availableWidth = totalNeededWidth;
        } else {
          // For non-center mode, allow overflow - align left with minimal padding
          leftPadding = Math.max(0, (containerWidth - totalNeededWidth) / 2);
          availableWidth = totalNeededWidth;
        }
      } else {
        // No minWidth constraint or already meets it
        slideWidth = calculatedSlideWidth;
        totalNeededWidth = (slideWidth * this.currentOptions.slidesToShow) + totalGaps;
        leftPadding = Math.max(0, (containerWidth - totalNeededWidth) / 2);
        availableWidth = totalNeededWidth;
      }

      // Apply padding to track
      this.track.style.paddingLeft = leftPadding + 'px';
      this.track.style.paddingRight = leftPadding + 'px';
    }

    // Apply slide widths
    for (let i = 0; i < this.slides.length; i++) {
      if (this.slides[i] && this.slides[i].style) {
        this.slides[i].style.width = slideWidth + 'px';
        this.slides[i].style.flexShrink = '0';
      }
    }

    if ((this.currentOptions.infinite || this.currentOptions.bounceBack) && this.totalSlides > this.currentOptions.slidesToShow) {
      if (this.currentOptions.infinite) {
        this.setupTrueInfinite();
      } else if (this.currentOptions.bounceBack) {
        this.setupBounceBack();
      }
    }
  }

  /**
     * Parse minSlideWidth from string or number
     *
     * @returns {number}
     */
  parseMinSlideWidth() {
    if (!this.currentOptions.minSlideWidth) return 0;

    const minWidth = this.currentOptions.minSlideWidth;
    if (typeof minWidth === 'string') {
      // Handle "0px", "100px", etc.
      const numericValue = parseFloat(minWidth);
      return isNaN(numericValue) ? 0 : numericValue;
    }

    return typeof minWidth === 'number' ? minWidth : 0;
  }

  /**
   * Setup bounce back or infinite mode
   *
   * @param {string} mode - 'bounce' or 'infinite'
   * @returns {void}
   */
  setupClonedSlides(mode) {
    const slidesToClone = mode === 'infinite'
      ? this.currentOptions.slidesToShow + 1
      : Math.max(this.currentOptions.slidesToShow, 2);

    if (mode === 'infinite') {
      // Clone slides to end
      for (let i = 0; i < slidesToClone; i++) {
        const originalIndex = i % this.totalSlides;
        const clone = this.slides[originalIndex].cloneNode(true);
        clone.classList.add('cloned', 'infinite-clone');
        clone.dataset.originalIndex = originalIndex;
        this.track.appendChild(clone);
      }

      // Clone slides to beginning
      for (let i = 0; i < slidesToClone; i++) {
        const originalIndex = (this.totalSlides - slidesToClone + i) % this.totalSlides;
        const clone = this.slides[originalIndex].cloneNode(true);
        clone.classList.add('cloned', 'infinite-clone');
        clone.dataset.originalIndex = originalIndex;
        this.track.insertBefore(clone, this.track.firstChild);
      }

      this.initialCloneCount = slidesToClone;
    } else {
      // Bounce mode: clone to end
      for (let i = 0; i < slidesToClone; i++) {
        const clone = this.slides[i].cloneNode(true);
        clone.classList.add('cloned', 'bounce-clone');
        this.track.appendChild(clone);
      }

      // Clone to beginning
      for (let i = this.totalSlides - slidesToClone; i < this.totalSlides; i++) {
        const clone = this.slides[i].cloneNode(true);
        clone.classList.add('cloned', 'bounce-clone');
        this.track.insertBefore(clone, this.track.firstChild);
      }
    }

    this.allSlides = Array.from(this.track.children);

    // Set initial position after DOM updates
    const self = this;
    setTimeout(() => {
      self.calculateSlidePositions();

      const startIndex = mode === 'infinite'
        ? slidesToClone + self.currentOptions.startSlide
        : slidesToClone + self.currentOptions.startSlide;

      let initialPosition = self.slidePositions[startIndex];

      // Apply centerMode calculations if needed
      if (self.currentOptions.centerMode) {
        const trackStyles = window.getComputedStyle(self.track);
        const trackPaddingLeft = parseFloat(trackStyles.paddingLeft) || 0;
        const trackPaddingRight = parseFloat(trackStyles.paddingRight) || 0;
        const visibleTrackWidth = self.track.offsetWidth - trackPaddingLeft - trackPaddingRight;

        const slideWidth = self.slides[0].offsetWidth;
        initialPosition = initialPosition - (visibleTrackWidth / 2) + (slideWidth / 2);
      }

      self.track.scrollLeft = initialPosition;
      self.currentSlide = self.currentOptions.startSlide;
    }, 10);
  }

  /**
     * Setup the bounce back.
     *
     * @returns {void}
     */
  setupBounceBack() {
    this.setupClonedSlides('bounce');
  }

  /**
     * Setup the true infinite.
     *
     * @returns {void}
     */
  setupTrueInfinite() {
    this.setupClonedSlides('infinite');
  }

  /**
       * Calculate the slide positions.
       *
       * @returns {void}
       */
  calculateSlidePositions() {
    this.slidePositions = [];
    const slidesToUse = this.allSlides || this.slides;
    const leftPadding = parseFloat(this.track.style.paddingLeft) || 0;

    for (let i = 0; i < slidesToUse.length; i++) {
      this.slidePositions.push(slidesToUse[i].offsetLeft - leftPadding);
    }
  }

  /**
       * Setup the scroll listener.
       *
       * @returns {void}
       */
  setupScrollListener() {
    const self = this;
    this.track.addEventListener('scroll', () => {
      self.isScrolling = true;
      self.pauseAutoplay();

      clearTimeout(self.scrollTimeout);

      self.scrollTimeout = setTimeout(() => {
        self.isScrolling = false;
        self.handleScrollEnd();
        self.resumeAutoplay();
      }, 150);

      self.updateCurrentSlideFromScroll();
    }, { passive: true });
  }

  /**
   * Update the current slide from the scroll.
   *
   * @returns {void}
   */
  updateCurrentSlideFromScroll() {
    const scrollLeft = this.track.scrollLeft;

    // For infinite mode, don't track slides - just let it scroll freely.
    if (this.currentOptions.infinite) {
      this.updateCenterMode();
      return;
    }

    let adjustedScrollLeft = scrollLeft;
    if (this.currentOptions.centerMode) {
      // Get actual container dimensions accounting for padding
      const containerStyles = window.getComputedStyle(this.container);
      const containerPaddingLeft = parseFloat(containerStyles.paddingLeft) || 0;
      const containerPaddingRight = parseFloat(containerStyles.paddingRight) || 0;
      const containerInnerWidth = this.container.offsetWidth - containerPaddingLeft - containerPaddingRight;

      // Adjust scroll position to account for centering and container padding
      adjustedScrollLeft = scrollLeft + (containerInnerWidth / 2) + containerPaddingLeft;
    }

    let closestSlide = 0;
    let closestDistance = Infinity;

    for (let i = 0; i < this.slidePositions.length; i++) {
      const position = this.slidePositions[i];
      let comparePosition = position;
      if (this.currentOptions.centerMode) {
        const slideWidth = this.slides[0].offsetWidth;
        comparePosition = position + (slideWidth / 2);
      }

      const distance = Math.abs(adjustedScrollLeft - comparePosition);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestSlide = i;
      }
    }

    if (this.currentOptions.bounceBack && this.allSlides) {
      const cloneCount = Math.max(this.currentOptions.slidesToShow, 2);
      if (closestSlide >= cloneCount && closestSlide < cloneCount + this.totalSlides) {
        this.currentSlide = closestSlide - cloneCount;
      }
    } else {
      this.currentSlide = closestSlide;
    }

    this.updateNavigation();
    this.updateCenterMode();
  }

  /**
       * Handle the scroll end.
       *
       * @returns {void}
       */
  handleScrollEnd() {
    if (this.currentOptions.bounceBack) {
      this.handleBounceBackScroll();
    } else if (this.currentOptions.infinite) {
      this.handleInfiniteScroll();
    }
  }

  /**
       * Handle the bounce back scroll.
       *
       * @returns {void}
       */
  handleBounceBackScroll() {
    const cloneCount = Math.max(this.currentOptions.slidesToShow, 2);
    const scrollLeft = this.track.scrollLeft;
    const slideWidth = this.slides[0].offsetWidth + this.currentOptions.gap;

    if (scrollLeft < cloneCount * slideWidth / 2) {
      const targetIndex = cloneCount + this.totalSlides - (cloneCount - Math.floor(scrollLeft / slideWidth));
      this.track.scrollLeft = this.slidePositions[targetIndex];
    } else if (scrollLeft > this.slidePositions[cloneCount + this.totalSlides - 1]) {
      const targetIndex = cloneCount + (this.currentSlide % this.totalSlides);
      this.track.scrollLeft = this.slidePositions[targetIndex];
    }
  }

  /**
       * Handle the infinite scroll.
       *
       * @returns {void}
       */
  handleInfiniteScroll() {
    const scrollLeft = this.track.scrollLeft;
    const containerWidth = this.container.offsetWidth;

    // Buffer distance - when to add more clones (1 viewport width)
    const addBuffer = containerWidth;
    // Max clones to keep (prevent infinite growth)
    const maxClones = this.totalSlides * 3;

    // Check if we need more clones at the end
    const trackWidth = this.track.scrollWidth;
    const distanceFromEnd = trackWidth - (scrollLeft + containerWidth);

    if (distanceFromEnd < addBuffer) {
      const currentClones = this.track.querySelectorAll('.infinite-clone').length;
      if (currentClones < maxClones) {
        this.addClonesAtEnd();
      }
    }

    // Check if we need more clones at the beginning
    if (scrollLeft < addBuffer) {
      const currentClones = this.track.querySelectorAll('.infinite-clone').length;
      if (currentClones < maxClones) {
        this.addClonesAtStart();
      }
    }

    // Clean up distant clones (more than 3 viewport widths away)
    this.cleanupDistantClones();
  }

  /**
       * Add clones at the end.
       *
       * @returns {void}
       */
  addClonesAtEnd() {
    // Add one full cycle of slides.
    for (let i = 0; i < this.totalSlides; i++) {
      const clone = this.slides[i].cloneNode(true);
      clone.classList.add('cloned', 'infinite-clone');
      clone.dataset.originalIndex = i;
      this.track.appendChild(clone);
    }

    this.allSlides = Array.from(this.track.children);
    this.calculateSlidePositions();
  }

  /**
       * Add clones at the start.
       *
       * @returns {void}
       */
  addClonesAtStart() {
    const currentScrollLeft = this.track.scrollLeft;
    let addedWidth = 0;

    // Add one full cycle of slides at the beginning
    for (let i = this.totalSlides - 1; i >= 0; i--) {
      const clone = this.slides[i].cloneNode(true);
      clone.classList.add('cloned', 'infinite-clone');
      clone.dataset.originalIndex = i;
      this.track.insertBefore(clone, this.track.firstChild);

      // Calculate added width for scroll adjustment.
      addedWidth += clone.offsetWidth + this.currentOptions.gap;
    }

    this.allSlides = Array.from(this.track.children);

    // Adjust scroll position to maintain current view.
    this.track.scrollLeft = currentScrollLeft + addedWidth;

    this.calculateSlidePositions();
  }

  /**
       * Cleanup clones specifically for autoplay to prevent infinite growth
       *
       * @returns {void}
       */
  cleanupClonesForAutoplay() {
    const clones = this.track.querySelectorAll('.infinite-clone');
    const maxAllowedClones = this.totalSlides * 4; // Allow 4 full cycles max

    if (clones.length <= maxAllowedClones) {
      return; // Not enough clones to worry about cleanup yet
    }

    const scrollLeft = this.track.scrollLeft;
    const containerWidth = this.container.offsetWidth;
    const keepBuffer = containerWidth * 2; // Keep 2 viewport widths on each side

    const clonesToRemove = [];

    // Find clones that are far from current viewport
    clones.forEach((clone) => {
      const cloneLeft = clone.offsetLeft;
      const cloneRight = cloneLeft + clone.offsetWidth;
      const viewportLeft = scrollLeft - keepBuffer;
      const viewportRight = scrollLeft + containerWidth + keepBuffer;

      // Remove if clone is completely outside the keep buffer
      if (cloneRight < viewportLeft || cloneLeft > viewportRight) {
        clonesToRemove.push(clone);
      }
    });

    // Remove from farthest to closest to maintain scroll position
    clonesToRemove.sort((a, b) => {
      const distanceA = Math.abs((a.offsetLeft + a.offsetWidth / 2) - (scrollLeft + containerWidth / 2));
      const distanceB = Math.abs((b.offsetLeft + b.offsetWidth / 2) - (scrollLeft + containerWidth / 2));
      return distanceB - distanceA;
    });

    // Remove clones but keep minimum buffer
    const maxToRemove = Math.max(0, clonesToRemove.length - this.totalSlides);
    let scrollAdjustment = 0;

    for (let i = 0; i < Math.min(clonesToRemove.length, maxToRemove); i++) {
      const clone = clonesToRemove[i];

      // If removing clone before current position, adjust scroll
      if (clone.offsetLeft < scrollLeft) {
        scrollAdjustment += clone.offsetWidth + this.currentOptions.gap;
      }

      clone.remove();
    }

    // Adjust scroll position if we removed clones before current view
    if (scrollAdjustment > 0) {
      this.track.scrollLeft = scrollLeft - scrollAdjustment;
    }

    // Update references
    if (clonesToRemove.length > 0) {
      this.allSlides = Array.from(this.track.children);
      this.calculateSlidePositions();
    }
  }

  /**
       * Cleanup the distant clones.
       *
       * @returns {void}
       */
  cleanupDistantClones() {
    // Use the more aggressive cleanup for autoplay scenarios
    if (this.currentOptions.autoplay) {
      this.cleanupClonesForAutoplay();
      return;
    }

    // Original cleanup logic for manual scrolling
    let scrollLeft = this.track.scrollLeft;
    const containerWidth = this.container.offsetWidth;
    const cleanupDistance = containerWidth * 4; // Keep clones within 4 viewport widths

    const clonesToRemove = [];
    const self = this;

    this.allSlides.forEach((slide, index) => {
      if (slide.classList.contains('infinite-clone')) {
        const slidePosition = self.slidePositions[index];
        const distanceFromViewport = Math.abs(slidePosition - scrollLeft);

        // Remove clones that are far from current view.
        if (distanceFromViewport > cleanupDistance) {
          clonesToRemove.push({
            slide: slide,
            position: slidePosition,
            index: index
          });
        }
      }
    });

    // Sort by distance and remove the farthest clones first.
    clonesToRemove.sort((a, b) => {
      const distanceA = Math.abs(a.position - scrollLeft);
      const distanceB = Math.abs(b.position - scrollLeft);
      return distanceB - distanceA;
    });

    // Remove clones but keep a minimum buffer.
    const minClonesPerSide = this.totalSlides;
    let removedCount = 0;
    const maxToRemove = Math.max(0, clonesToRemove.length - (minClonesPerSide * 2));

    for (let i = 0; i < Math.min(clonesToRemove.length, maxToRemove); i++) {
      const cloneInfo = clonesToRemove[i];

      // Adjust scroll position if removing clone before current view.
      if (cloneInfo.position < scrollLeft) {
        const slideWidth = cloneInfo.slide.offsetWidth + this.currentOptions.gap;
        this.track.scrollLeft = scrollLeft - slideWidth;
        scrollLeft = this.track.scrollLeft;
      }

      cloneInfo.slide.remove();
      removedCount++;
    }

    if (removedCount > 0) {
      this.allSlides = Array.from(this.track.children);
      this.calculateSlidePositions();
    }
  }

  /**
       * Setup the navigation.
       *
       * @returns {void}
       */
  setupNavigation() {
    const self = this;
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => {
        self.prev();
      });
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => {
        self.next();
      });
    }

    this.updateNavigation();
  }

  /**
       * Setup the autoplay.
       *
       * @returns {void}
       */
  setupAutoplay() {
    if (this.currentOptions.autoplay) {
      this.startAutoplay();

      const self = this;
      this.container.addEventListener('mouseenter', () => {
        self.pauseAutoplay();
      });
      this.container.addEventListener('mouseleave', () => {
        self.resumeAutoplay();
      });
    }
  }

  /**
     * Go to the slide.
     *
     * @param {number} slideIndex - The index of the slide to go to.
     * @returns {void}
     */
  goToSlide(slideIndex) {
    // For infinite mode, don't use goToSlide - just use next/prev buttons.
    if (this.currentOptions.infinite) {
      return;
    }

    if (slideIndex < 0 || slideIndex >= this.totalSlides) return;

    let targetPosition;

    if (this.currentOptions.bounceBack) {
      const cloneCount = Math.max(this.currentOptions.slidesToShow, 2);
      targetPosition = this.slidePositions[cloneCount + slideIndex];
    } else {
      targetPosition = this.slidePositions[slideIndex];
    }

    if (this.currentOptions.centerMode) {
      // Get actual container dimensions accounting for padding
      const containerStyles = window.getComputedStyle(this.container);
      const containerPaddingLeft = parseFloat(containerStyles.paddingLeft) || 0;
      const containerPaddingRight = parseFloat(containerStyles.paddingRight) || 0;
      const containerInnerWidth = this.container.offsetWidth - containerPaddingLeft - containerPaddingRight;

      const slideWidth = this.slides[0].offsetWidth;

      // Center the slide within the container's inner width
      targetPosition = targetPosition - (containerInnerWidth / 2) + (slideWidth / 2);

      // Account for container padding offset in scroll position
      targetPosition = targetPosition - containerPaddingLeft;
    }

    this.track.scrollTo({
      left: targetPosition,
      behavior: 'smooth'
    });

    this.currentSlide = slideIndex;
  }

  /**
   * Go to the next slide.
   *
   * @returns {void}
   */
  next() {
    // For infinite mode, just scroll by one slide width.
    if (this.currentOptions.infinite) {
      const slideWidth = this.slides[0].offsetWidth + this.currentOptions.gap;
      const scrollAmount = slideWidth * this.currentOptions.slidesToScroll;

      if (this.currentOptions.centerMode) {
        // For center mode, we need to find the current center slide and go to the next one
        const currentCenterSlide = this.findCurrentCenterSlideIndex();
        const nextCenterSlide = currentCenterSlide + this.currentOptions.slidesToScroll;
        this.goToCenterSlide(nextCenterSlide);
      } else {
        this.track.scrollTo({
          left: this.track.scrollLeft + scrollAmount,
          behavior: 'smooth'
        });
      }
      return;
    }

    let nextSlide;
    if (this.currentOptions.bounceBack) {
      nextSlide = (this.currentSlide + this.currentOptions.slidesToScroll) % this.totalSlides;
    } else {
      nextSlide = Math.min(
        this.currentSlide + this.currentOptions.slidesToScroll,
        this.totalSlides - this.currentOptions.slidesToShow
      );
    }

    this.goToSlide(nextSlide);
  }

  /**
     * Go to the previous slide.
     *
     * @returns {void}
     */
  prev() {
    // For infinite mode, just scroll by one slide width.
    if (this.currentOptions.infinite) {
      const slideWidth = this.slides[0].offsetWidth + this.currentOptions.gap;
      const scrollAmount = slideWidth * this.currentOptions.slidesToScroll;

      if (this.currentOptions.centerMode) {
        // For center mode, we need to find the current center slide and go to the previous one
        const currentCenterSlide = this.findCurrentCenterSlideIndex();
        const prevCenterSlide = currentCenterSlide - this.currentOptions.slidesToScroll;
        this.goToCenterSlide(prevCenterSlide);
      } else {
        this.track.scrollTo({
          left: this.track.scrollLeft - scrollAmount,
          behavior: 'smooth'
        });
      }
      return;
    }

    let prevSlide;
    if (this.currentOptions.bounceBack) {
      prevSlide = this.currentSlide - this.currentOptions.slidesToScroll;
      if (prevSlide < 0) {
        prevSlide = this.totalSlides + prevSlide;
      }
    } else {
      prevSlide = Math.max(this.currentSlide - this.currentOptions.slidesToScroll, 0);
    }

    this.goToSlide(prevSlide);
  }

  /**
     * Find the index of the currently centered slide in infinite mode
     *
     * @returns {number}
     */
  findCurrentCenterSlideIndex() {
    const scrollLeft = this.track.scrollLeft;
    const trackStyles = window.getComputedStyle(this.track);
    const trackPaddingLeft = parseFloat(trackStyles.paddingLeft) || 0;
    const visibleTrackWidth = this.track.offsetWidth - trackPaddingLeft - (parseFloat(trackStyles.paddingRight) || 0);

    // Find the center point of the visible area
    const centerPoint = scrollLeft + (visibleTrackWidth / 2);

    let closestSlide = 0;
    let closestDistance = Infinity;

    const slidesToUse = this.allSlides || this.slides;
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
     * @param {number} slideIndex
     * @returns {void}
     */
  goToCenterSlide(slideIndex) {
    const slidesToUse = this.allSlides || this.slides;

    // Make sure index is within bounds
    if (slideIndex < 0 || slideIndex >= slidesToUse.length) {
      return;
    }

    const targetSlide = slidesToUse[slideIndex];
    const trackStyles = window.getComputedStyle(this.track);
    const trackPaddingLeft = parseFloat(trackStyles.paddingLeft) || 0;
    const trackPaddingRight = parseFloat(trackStyles.paddingRight) || 0;
    const visibleTrackWidth = this.track.offsetWidth - trackPaddingLeft - trackPaddingRight;

    // Calculate position to center this slide
    const slideLeft = targetSlide.offsetLeft - trackPaddingLeft;
    const slideWidth = targetSlide.offsetWidth;
    const targetPosition = slideLeft - (visibleTrackWidth / 2) + (slideWidth / 2);

    this.track.scrollTo({
      left: targetPosition,
      behavior: 'smooth'
    });
  }

  /**
       * Update the navigation.
       *
       * @returns {void}
       */
  updateNavigation() {
    if (!this.prevBtn || !this.nextBtn) return;

    // For infinite mode, buttons are always enabled.
    if (this.currentOptions.infinite) {
      this.prevBtn.disabled = false;
      this.nextBtn.disabled = false;
      return;
    }

    if (this.currentOptions.bounceBack) {
      this.prevBtn.disabled = false;
      this.nextBtn.disabled = false;
    } else {
      this.prevBtn.disabled = this.currentSlide === 0;
      this.nextBtn.disabled = this.currentSlide >= this.totalSlides - this.currentOptions.slidesToShow;
    }
  }

  /**
       * Update the center mode.
       *
       * @returns {void}
       */
  updateCenterMode() {
    if (!this.currentOptions.centerMode) return;

    const slidesToUse = this.allSlides || this.slides;
    for (let i = 0; i < slidesToUse.length; i++) {
      slidesToUse[i].classList.remove('center');
    }

    let centerSlideIndex;
    if (this.currentOptions.bounceBack) {
      const cloneCount = Math.max(this.currentOptions.slidesToShow, 2);
      centerSlideIndex = cloneCount + this.currentSlide;
    } else if (this.currentOptions.infinite) {
      const scrollLeft = this.track.scrollLeft;
      const containerWidth = this.container.offsetWidth;
      const centerPoint = scrollLeft + (containerWidth / 2);

      let closestSlide = null;
      let closestDistance = Infinity;

      for (let i = 0; i < slidesToUse.length; i++) {
        const slide = slidesToUse[i];
        const slideCenter = slide.offsetLeft + (slide.offsetWidth / 2);
        const distance = Math.abs(centerPoint - slideCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestSlide = slide;
        }
      }

      if (closestSlide) {
        closestSlide.classList.add('center');
      }
      return;
    } else {
      centerSlideIndex = this.currentSlide;
    }

    if (slidesToUse[centerSlideIndex]) {
      slidesToUse[centerSlideIndex].classList.add('center');
    }
  }

  /**
   * Start the autoplay.
   *
   * @returns {void}
   */
  startAutoplay() {
    if (!this.currentOptions.autoplay) return;

    this.stopAutoplay();
    const self = this;

    this.autoplayInterval = setInterval(() => {
      if (!self.isScrolling) {
        if (self.currentOptions.infinite) {
          // Infinite mode with centerMode support
          if (self.currentOptions.centerMode) {
            const currentCenterSlide = self.findCurrentCenterSlideIndex();
            const nextCenterSlide = currentCenterSlide + self.currentOptions.slidesToScroll;
            self.goToCenterSlide(nextCenterSlide);
          } else {
            const slideWidth = self.slides[0].offsetWidth + self.currentOptions.gap;
            const scrollAmount = slideWidth * self.currentOptions.slidesToScroll;
            self.track.scrollTo({
              left: self.track.scrollLeft + scrollAmount,
              behavior: 'smooth'
            });
          }

          // Cleanup clones periodically during autoplay
          self.cleanupClonesForAutoplay();
        } else {
          // Non-infinite modes (regular, bounceBack) - use next() method
          // This already handles centerMode properly via goToSlide()
          self.next();
        }
      }
    }, this.currentOptions.autoplaySpeed);
  }

  /**
       * Stop the autoplay.
       *
       * @returns {void}
       */
  stopAutoplay() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
    }
  }

  /**
       * Pause the autoplay.
       *
       * @returns {void}
       */
  pauseAutoplay() {
    this.autoplayPaused = true;
    this.stopAutoplay();
  }

  /**
       * Resume the autoplay.
       *
       * @returns {void}
       */
  resumeAutoplay() {
    if (this.currentOptions.autoplay && this.autoplayPaused) {
      this.autoplayPaused = false;
      const self = this;
      setTimeout(() => {
        if (!self.autoplayPaused && !self.isScrolling) {
          self.startAutoplay();
        }
      }, 1000);
    }
  }

  /**
       * Handle the resize.
       *
       * @returns {void}
       */
  handleResize() {
    const self = this;
    setTimeout(() => {
      // Store current responsive settings to detect changes.
      const previousSlidesToShow = self.currentOptions.slidesToShow;
      const previousShowOverflow = self.currentOptions.showOverflow;

      // Update responsive settings first
      self.setupResponsive();

      // If pull-to-right setting changed, we need to reset styles
      if (self.currentOptions.showOverflow !== previousShowOverflow) {
        self.setupTrackStyles(); // This will apply or reset pull-to-right styles
      } else if (self.currentOptions.showOverflow) {
        // If still pull-to-right, just update padding
        self.updatePullToRightPadding();
      }

      self.setupSlides();
      self.calculateSlidePositions();
      self.cleanupClonesForAutoplay();

      // Always reposition on resize, but use different logic based on responsive changes.
      if (self.currentOptions.slidesToShow !== previousSlidesToShow) {
        // If slidesToShow changed due to responsive breakpoint, reset to startSlide.
        const targetSlide = self.currentOptions.startSlide || 0;
        self.goToSlide(targetSlide);
      } else {
        // If slidesToShow didn't change, stay on current slide but reposition it.
        self.goToSlide(self.currentSlide);
      }
    }, 100);
  }

  /**
       * Destroy the slider.
       *
       * @returns {void}
       */
  destroy() {
    this.stopAutoplay();
    clearTimeout(this.scrollTimeout);
  }
}

export default NativeScrollSlider;

// Also make available globally when used in browser.
if (typeof window !== 'undefined') {
  window.NativeScrollSlider = NativeScrollSlider;
}
