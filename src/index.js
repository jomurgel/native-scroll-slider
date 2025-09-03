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
    let leftPadding, totalGaps, slideWidth, overflowSlideWidth, totalNeededWidth;

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
        // const availableForSlides = effectiveWidth - overflowSlideWidth;
        // const maxSlidesAtMinWidth = Math.floor((availableForSlides + this.currentOptions.gap) / (minSlideWidth + this.currentOptions.gap));
        // const actualSlidesToShow = Math.max(1, Math.min(maxSlidesAtMinWidth, this.currentOptions.slidesToShow));
      } else {
        slideWidth = calculatedSlideWidth;
      }

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
        } else {
          // For non-center mode, allow overflow - align left with minimal padding
          leftPadding = Math.max(0, (containerWidth - totalNeededWidth) / 2);
        }
      } else {
        // No minWidth constraint or already meets it
        slideWidth = calculatedSlideWidth;
        totalNeededWidth = (slideWidth * this.currentOptions.slidesToShow) + totalGaps;
        leftPadding = Math.max(0, (containerWidth - totalNeededWidth) / 2);
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
   * Setup the true infinite scroll with a simpler, more reliable approach
   *
   * @returns {void}
   */
  setupTrueInfinite() {
    // Calculate how many clones we need for smooth infinite scrolling
    // We need enough clones on each side to handle the maximum scroll distance
    const containerWidth = this.container.offsetWidth;
    const slideWidth = this.slides[0].offsetWidth + this.currentOptions.gap;
    const slidesPerView = Math.ceil(containerWidth / slideWidth);

    // Create enough clones to fill at least 2 viewport widths on each side
    const clonesNeeded = Math.max(this.totalSlides, slidesPerView * 2);

    this.initialCloneCount = clonesNeeded;

    // Clone slides to the end
    for (let i = 0; i < clonesNeeded; i++) {
      const originalIndex = i % this.totalSlides;
      const clone = this.slides[originalIndex].cloneNode(true);
      clone.classList.add('cloned', 'infinite-clone');
      clone.dataset.originalIndex = originalIndex;
      this.track.appendChild(clone);
    }

    // Clone slides to the beginning
    for (let i = 0; i < clonesNeeded; i++) {
      const originalIndex = (this.totalSlides - 1 - (i % this.totalSlides)) % this.totalSlides;
      const clone = this.slides[originalIndex].cloneNode(true);
      clone.classList.add('cloned', 'infinite-clone');
      clone.dataset.originalIndex = originalIndex;
      this.track.insertBefore(clone, this.track.firstChild);
    }

    this.allSlides = Array.from(this.track.children);

    // Set initial position after DOM updates
    const self = this;
    setTimeout(() => {
      self.calculateSlidePositions();

      // Start in the middle section (original slides)
      const startIndex = clonesNeeded + self.currentOptions.startSlide;
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

      // Disable smooth scrolling temporarily for initial positioning
      self.track.style.scrollBehavior = 'auto';
      self.track.scrollLeft = initialPosition;
      self.track.style.scrollBehavior = 'smooth';

      self.currentSlide = self.currentOptions.startSlide;
      self.infiniteScrollSetup = true;
    }, 10);
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
   * Enhanced scroll listener for infinite scroll
   *
   * @returns {void}
   */
  setupScrollListener() {
    const self = this;

    this.track.addEventListener('scroll', () => {
      self.isScrolling = true;
      self.pauseAutoplay();

      // Handle infinite scroll with debouncing
      if (self.currentOptions.infinite) {
        clearTimeout(self.infiniteScrollTimeout);
        self.infiniteScrollTimeout = setTimeout(() => {
          self.handleInfiniteScroll();
        }, 50); // Quick response for seamless experience
      }

      clearTimeout(self.scrollTimeout);
      self.scrollTimeout = setTimeout(() => {
        self.isScrolling = false;
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
   * Handle infinite scroll with seamless looping
   *
   * @returns {void}
   */
  handleInfiniteScroll() {
    if (!this.infiniteScrollSetup) return;

    const scrollLeft = this.track.scrollLeft;
    const slideWidth = this.slides[0].offsetWidth + this.currentOptions.gap;
    const totalOriginalWidth = this.totalSlides * slideWidth;

    // Calculate the boundaries where we need to "teleport"
    const leftBoundary = slideWidth * 2; // 2 slides worth of buffer
    const rightBoundary = this.slidePositions[this.initialCloneCount + this.totalSlides] - slideWidth * 2;

    // If we've scrolled too far left, jump to the equivalent position on the right
    if (scrollLeft <= leftBoundary) {
      const equivalentPosition = scrollLeft + totalOriginalWidth;
      this.seamlessJump(equivalentPosition);
    }
    // If we've scrolled too far right, jump to the equivalent position on the left
    else if (scrollLeft >= rightBoundary) {
      const equivalentPosition = scrollLeft - totalOriginalWidth;
      this.seamlessJump(equivalentPosition);
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
   * Perform a seamless jump to maintain infinite scroll illusion
   *
   * @param {number} newPosition - The new scroll position
   * @returns {void}
   */
  seamlessJump(newPosition) {
    // Temporarily disable smooth scrolling for the jump
    const originalBehavior = this.track.style.scrollBehavior;
    this.track.style.scrollBehavior = 'auto';

    // Perform the jump
    this.track.scrollLeft = newPosition;

    // Re-enable smooth scrolling after a small delay
    setTimeout(() => {
      this.track.style.scrollBehavior = originalBehavior || 'smooth';
    }, 10);
  }

  /**
   * Calculate how many slides are actually visible in the current viewport
   * @returns {number}
   */
  getActualSlidesToShow() {
    if (!this.slides.length) return this.currentOptions.slidesToShow;

    const containerWidth = this.container.offsetWidth;
    const slideWidth = this.slides[0].offsetWidth;
    const gap = this.currentOptions.gap;

    // Calculate how many slides actually fit in the visible area
    const actualSlidesToShow = Math.floor((containerWidth + gap) / (slideWidth + gap));

    // Return the smaller of configured vs actual
    return Math.min(actualSlidesToShow, this.currentOptions.slidesToShow);
  }

  /**
   * Enhanced next method for infinite scroll
   *
   * @returns {void}
   */
  next() {
    // For infinite mode, just scroll by the specified amount
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

    const actualSlidesToShow = this.getActualSlidesToShow();

    // Non-infinite mode logic remains the same
    let nextSlide;
    if (this.currentOptions.bounceBack) {
      nextSlide = (this.currentSlide + this.currentOptions.slidesToScroll) % this.totalSlides;
    } else {
      // Use actualSlidesToShow instead of this.currentOptions.slidesToShow
      nextSlide = Math.min(
        this.currentSlide + this.currentOptions.slidesToScroll,
        this.totalSlides - actualSlidesToShow
      );
    }

    this.goToSlide(nextSlide);
  }

  /**
   * Enhanced prev method for infinite scroll
   *
   * @returns {void}
   */
  prev() {
    // For infinite mode, just scroll by the specified amount
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

    // Non-infinite mode logic remains the same
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

    // For infinite mode, buttons are always enabled
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

      // Calculate the actual last scrollable position
      const maxScroll = this.track.scrollWidth - this.track.clientWidth;
      const currentScroll = this.track.scrollLeft;

      // Disable next if we can't scroll further right
      // Add a small buffer (5px) to account for rounding errors
      this.nextBtn.disabled = currentScroll >= maxScroll - 5;
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
   * Enhanced autoplay for infinite scroll
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
          // For infinite mode, always use next() method which handles centerMode properly
          const slideWidth = self.slides[0].offsetWidth + self.currentOptions.gap;
          const scrollAmount = slideWidth * self.currentOptions.slidesToScroll;

          if (self.currentOptions.centerMode) {
            const currentCenterSlide = self.findCurrentCenterSlideIndex();
            const nextCenterSlide = currentCenterSlide + self.currentOptions.slidesToScroll;
            self.goToCenterSlide(nextCenterSlide);
          } else {
            self.track.scrollTo({
              left: self.track.scrollLeft + scrollAmount,
              behavior: 'smooth'
            });
          }
        } else {
          // Non-infinite modes use next() method
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
   * Enhanced destroy method to clean up infinite scroll timeouts
   *
   * @returns {void}
   */
  destroy() {
    this.stopAutoplay();
    clearTimeout(this.scrollTimeout);
    clearTimeout(this.infiniteScrollTimeout);

    // Clean up any cloned slides
    if (this.track) {
      const clones = this.track.querySelectorAll('.infinite-clone');
      clones.forEach(clone => clone.remove());
    }
  }
}

export default NativeScrollSlider;

// Also make available globally when used in browser.
if (typeof window !== 'undefined') {
  window.NativeScrollSlider = NativeScrollSlider;
}
