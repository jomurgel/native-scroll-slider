# Native Scroll Slider

A lightweight, dependency-free JavaScript slider that leverages native browser scrolling for smooth, performant carousel experiences. Built with modern web standards and optimized for minimal bundle size.

[![npm version](https://badge.fury.io/js/native-scroll-slider.svg)](https://www.npmjs.com/package/native-scroll-slider)
[![Bundle Size](https://img.shields.io/badge/bundle%20size-0.5%20KB%20gzipped-brightgreen)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🪶 **Ultra-lightweight**: Only ~3.7KB (~0.5KB gzipped) - 90% smaller than alternatives
- 🚀 **Native performance**: Uses browser's native scrolling for 60fps animations
- 📱 **Touch-friendly**: Built-in touch/swipe support without additional libraries
- 🎨 **Highly configurable**: 20+ options for complete customization
- 📐 **Responsive**: Built-in responsive breakpoints and adaptive layouts
- ♿ **Accessible**: Keyboard navigation and screen reader friendly
- 🔄 **Multiple modes**: Standard, infinite scroll, bounce-back, and center mode
- 📦 **Zero dependencies**: Pure vanilla JavaScript, works everywhere
- 🌐 **Modern browsers**: ES6+ with graceful degradation

## 📦 Installation

### npm
```bash
npm install @jomurgel/native-scroll-slider
```

### CDN (Coming Soon)
```html
<script src="https://unpkg.com/@jomurgel/native-scroll-slider/dist/native-scroll-slider.min.js"></script>
<script>
  const slider = new NativeScrollSlider(document.querySelector('.slider-track'));
</script>
```

### NPM Imports
```js
import NativeScrollSlider from '@jomurgel/native-scroll-slider';
// or
import NativeScrollSlider from 'native-scroll-slider';
```

### Direct Download
Download from [GitHub releases](https://github.com/jomurgel/native-scroll-slider/releases)

## 🚀 Quick Start

### Basic HTML Structure
```html
<div class="slider-container" data-slider-config='{"slidesToShow": 3, "autoplay": true}'>
  <div class="slider-track">
    <div class="slide">Slide 1</div>
    <div class="slide">Slide 2</div>
    <div class="slide">Slide 3</div>
    <div class="slide">Slide 4</div>
    <div class="slide">Slide 5</div>
  </div>
  <button class="slider-prev">Previous</button>
  <button class="slider-next">Next</button>
</div>
```

### JavaScript Initialization
```javascript
import NativeScrollSlider from '@jomurgel/native-scroll-slider';

// Initialize with default options
const slider = new NativeScrollSlider(document.querySelector('.slider-track'));

// Or with custom options
const slider = new NativeScrollSlider(document.querySelector('.slider-track'), {
  slidesToShow: 3,
  autoplay: true,
  autoplaySpeed: 4000,
  infinite: true,
  responsive: [
    {
      breakpoint: 768,
      settings: {
        slidesToShow: 1
      }
    }
  ]
});
```

## ⚙️ Configuration Options

### Complete Options Table

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `slidesToShow` | `number` | `4` | Number of slides visible at once |
| `slidesToScroll` | `number` | `1` | Number of slides to scroll at once |
| `infinite` | `boolean` | `false` | Enable infinite scrolling |
| `bounceBack` | `boolean` | `false` | Enable bounce-back at edges |
| `centerMode` | `boolean` | `false` | Center the active slide |
| `autoplay` | `boolean` | `false` | Enable automatic sliding |
| `autoplaySpeed` | `number` | `3000` | Autoplay interval in milliseconds |
| `gap` | `number` | `24` | Gap between slides in pixels |
| `startSlide` | `number` | `0` | Index of initial slide |
| `responsive` | `array` | `[...]` | Responsive breakpoint settings (see below) |
| `prevElement` | `string` | `'.prev, .slider-prev, .slider-grid-prev'` | Previous button selector |
| `nextElement` | `string` | `'.next, .slider-next, .slider-grid-next'` | Next button selector |
| `minSlideWidth` | `number` | `0` | Minimum slide width in pixels |
| `showOverflow` | `boolean` | `false` | Show partial next/previous slides + enable full-width mode |
| `overflowAmount` | `number` | `0.5` | Amount of overflow slide to show (0-1) |
| `containerMaxWidth` | `number` | `1200` | Max container width for overflow mode |
| `basePadding` | `number` | `35` | Base padding for overflow mode |

### Default Responsive Breakpoints
The slider includes these responsive breakpoints by default:
```javascript
responsive: [
  {
    breakpoint: 1200,
    settings: { slidesToShow: 3 }
  },
  {
    breakpoint: 992,
    settings: { slidesToShow: 2 }
  },
  {
    breakpoint: 768,
    settings: { slidesToShow: 1 }
  },
  {
    breakpoint: 576,
    settings: { slidesToShow: 1 }
  }
]
```

### Configuration Methods

#### 1. JavaScript Options
```javascript
const slider = new NativeScrollSlider(track, {
  slidesToShow: 3,
  autoplay: true,
  infinite: true
});
```

#### 2. Data Attributes
```html
<div data-slider-config='{"slidesToShow": 2, "autoplay": true}'>
  <div class="slider-track">...</div>
</div>
```

#### 3. Responsive Configuration
```javascript
const slider = new NativeScrollSlider(track, {
  slidesToShow: 4, // Desktop default
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
        slidesToShow: 1,
        centerMode: true
      }
    },
    {
      breakpoint: 576,
      settings: {
        slidesToShow: 1,
        autoplay: false
      }
    }
  ]
});
```

## 🎯 Usage Examples

### Image Gallery
```html
<div class="gallery-slider">
  <div class="slider-track">
    <div class="slide"><img src="image1.jpg" alt="Image 1"></div>
    <div class="slide"><img src="image2.jpg" alt="Image 2"></div>
    <div class="slide"><img src="image3.jpg" alt="Image 3"></div>
  </div>
</div>

<script>
new NativeScrollSlider(document.querySelector('.gallery-slider .slider-track'), {
  slidesToShow: 1,
  infinite: true,
  autoplay: true,
  centerMode: true
});
</script>
```

### Product Carousel
```html
<div class="product-carousel" data-slider-config='{"slidesToShow": 4, "showOverflow": true}'>
  <div class="slider-track">
    <div class="slide product-card">Product 1</div>
    <div class="slide product-card">Product 2</div>
    <div class="slide product-card">Product 3</div>
    <div class="slide product-card">Product 4</div>
    <div class="slide product-card">Product 5</div>
  </div>
  <button class="slider-prev">←</button>
  <button class="slider-next">→</button>
</div>
```

### Hero Banner Slider
```javascript
const heroSlider = new NativeScrollSlider(document.querySelector('.hero-track'), {
  slidesToShow: 1,
  autoplay: true,
  autoplaySpeed: 5000,
  infinite: true,
  showOverflow: true, // Enables full-width breakout
  responsive: [
    {
      breakpoint: 768,
      settings: {
        showOverflow: false
      }
    }
  ]
});
```

### Card Deck with Overflow
```javascript
const cardSlider = new NativeScrollSlider(document.querySelector('.cards-track'), {
  slidesToShow: 3,
  showOverflow: true,
  overflowAmount: 0.3,
  gap: 20,
  responsive: [
    {
      breakpoint: 768,
      settings: {
        slidesToShow: 1,
        showOverflow: false
      }
    }
  ]
});
```

## 🎨 Styling

### Basic CSS
```css
.slider-container {
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
}

.slider-track {
  display: flex;
  overflow-x: auto;
  scroll-behavior: smooth;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.slider-track::-webkit-scrollbar {
  display: none;
}

.slide {
  flex-shrink: 0;
  scroll-snap-align: start;
}

/* Navigation buttons */
.slider-prev,
.slider-next {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  background: rgba(0,0,0,0.5);
  color: white;
  border: none;
  padding: 10px;
  cursor: pointer;
}

.slider-prev {
  left: 10px;
}

.slider-next {
  right: 10px;
}

.slider-prev:disabled,
.slider-next:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
```

### Center Mode Styling
```css
.slide {
  transition: transform 0.3s ease, opacity 0.3s ease;
  opacity: 0.6;
  transform: scale(0.8);
}

.slide.center {
  opacity: 1;
  transform: scale(1);
}
```

## 📱 Responsive Design

### Mobile-First Approach
```javascript
const responsiveSlider = new NativeScrollSlider(track, {
  // Mobile defaults (matches built-in responsive)
  slidesToShow: 4, // Desktop default
  
  // Custom responsive overrides (combines with defaults)
  responsive: [
    {
      breakpoint: 1200,
      settings: {
        slidesToShow: 3,
        gap: 20
      }
    },
    {
      breakpoint: 992,
      settings: {
        slidesToShow: 2,
        gap: 16
      }
    },
    {
      breakpoint: 768,
      settings: {
        slidesToShow: 1,
        centerMode: true,
        gap: 12
      }
    }
  ]
});
```

## 🔧 API Reference

### Creating a Slider Instance
```javascript
// Store the slider instance to access methods
const slider = new NativeScrollSlider(document.querySelector('.slider-track'));

// Or with options
const slider = new NativeScrollSlider(document.querySelector('.slider-track'), {
  slidesToShow: 3,
  autoplay: true
});
```

### Public Methods
```javascript
// Navigation
slider.next();           // Go to next slide(s)
slider.prev();           // Go to previous slide(s)
slider.goToSlide(index); // Go to specific slide (0-based index)

// Lifecycle
slider.handleResize();   // Manually trigger resize recalculation
slider.destroy();        // Clean up event listeners and timers
```

### Complete Example
```javascript
// Create slider instance
const mySlider = new NativeScrollSlider(document.querySelector('.my-slider-track'), {
  slidesToShow: 3,
  autoplay: true,
  infinite: true
});

// Use the methods
document.querySelector('.custom-next-btn').addEventListener('click', () => {
  mySlider.next();
});

document.querySelector('.custom-prev-btn').addEventListener('click', () => {
  mySlider.prev();
});

// Go to specific slide
document.querySelector('.go-to-slide-3').addEventListener('click', () => {
  mySlider.goToSlide(2); // 0-based index, so 2 = 3rd slide
});
```

### Public Properties
```javascript
// Read-only access to slider state
slider.currentSlide;     // Current slide index (number)
slider.totalSlides;      // Total number of slides (number)
slider.track;            // Reference to track element (HTMLElement)
slider.container;        // Reference to container element (HTMLElement)
slider.isScrolling;      // Whether slider is currently scrolling (boolean)
```

### Event Handling
```javascript
// Listen to native scroll events on the track
const track = document.querySelector('.slider-track');

track.addEventListener('scroll', () => {
  console.log('Slider scrolled');
});

// Access slider state during scroll
slider.track.addEventListener('scroll', () => {
  console.log(`Current slide: ${slider.currentSlide}`);
  console.log(`Is scrolling: ${slider.isScrolling}`);
});

// Listen for scroll end (when user stops scrolling)
slider.track.addEventListener('scroll', () => {
  clearTimeout(slider.scrollEndTimer);
  slider.scrollEndTimer = setTimeout(() => {
    console.log('Scroll ended');
  }, 150);
});
```

### Autoplay Control
**Note**: Autoplay is controlled internally through options. To control autoplay programmatically:

```javascript
// Enable/disable via options
const slider = new NativeScrollSlider(track, {
  autoplay: true,
  autoplaySpeed: 3000
});

// Control through mouse events (built-in)
// Autoplay pauses on hover and resumes on leave automatically

// Manual control (access internal methods - use with caution)
slider.pauseAutoplay();  // Pause autoplay
slider.resumeAutoplay(); // Resume autoplay
```

## 🌟 Advanced Features

### Infinite Scroll
```javascript
const infiniteSlider = new NativeScrollSlider(track, {
  infinite: true,
  autoplay: true,
  slidesToShow: 3
});
// Automatically clones slides and manages seamless looping
```

### Show Overflow Mode
```javascript
const peekSlider = new NativeScrollSlider(track, {
  showOverflow: true,
  overflowAmount: 0.5, // Show 50% of next slide
  slidesToShow: 2
});
// Shows partial slides to indicate more content
// Also enables full-width breakout functionality
```

## 📊 Performance Comparison

| Library | Bundle Size (gzipped) | Dependencies | Performance |
|---------|----------------------|--------------|-------------|
| **Native Scroll Slider** | **0.5 KB** | **None** | **60fps native** |
| Slick.js | 6.2 KB | jQuery | Good |
| Swiper.js | 25 KB | None | Excellent |
| Glide.js | 7 KB | None | Good |
| Splide.js | 11 KB | None | Good |

### Why Choose Native Scroll Slider?

- **Smallest footprint**: 90% smaller than alternatives
- **Native performance**: Leverages browser optimizations
- **Touch-first**: Built-in mobile gestures
- **Accessibility**: Works with screen readers and keyboards
- **Future-proof**: Uses web standards, not polyfills

## 🛠️ Browser Support

- **Modern browsers**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **Mobile**: iOS 12+, Android 7+
- **Graceful degradation**: Falls back to basic scrolling in older browsers

### Feature Detection
```javascript
// Check for required features
const isSupported = 'scrollBehavior' in document.documentElement.style;
if (isSupported) {
  new NativeScrollSlider(track, options);
} else {
  // Fallback or polyfill
}
```

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Setup
```bash
# Clone the repository
git clone https://github.com/jomurgel/native-scroll-slider.git
cd native-scroll-slider

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Contribution Guidelines

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Write** tests for new functionality
4. **Ensure** all tests pass (`npm test`)
5. **Commit** changes (`git commit -m 'Add amazing feature'`)
6. **Push** to branch (`git push origin feature/amazing-feature`)
7. **Open** a Pull Request

### Code Standards
- Use ES6+ features
- Follow existing code style
- Add JSDoc comments for new methods
- Maintain backward compatibility
- Keep bundle size minimal

## 🐛 Issues & Support

### Reporting Issues
When reporting issues, please include:

- Browser and version
- Device type (desktop/mobile)
- Minimal reproduction case
- Expected vs actual behavior
- Console errors (if any)

**Report issues**: [GitHub Issues](https://github.com/jomurgel/native-scroll-slider/issues)

### Common Issues

**Q: Slider not initializing**
```javascript
// Ensure DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new NativeScrollSlider(document.querySelector('.slider-track'));
});
```

**Q: Touch scrolling not working**
```css
/* Ensure proper touch-action */
.slider-track {
  touch-action: pan-x;
}
```

**Q: Slides not sized correctly**
```javascript
// Call handleResize after dynamic content loads
slider.handleResize();
```

## 📄 License

MIT License © 2024 [Jo Murgel](https://github.com/jomurgel) - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by native browser scrolling capabilities
- Built for modern web performance standards  
- Responsive breakpoints based on [2025 design playbook](https://dev.to/gerryleonugroho/responsive-design-breakpoints-2025-playbook-53ih)
- Designed with accessibility in mind

## 📈 Changelog

### v0.0.1
- Initial release
- Core sliding functionality with desktop-first defaults (4 slides)
- Built-in responsive breakpoints (1200/992/768/576px)
- Autoplay support with hover pause/resume
- Infinite scroll mode with dynamic clone management
- Center mode with visual highlighting
- Show overflow mode with full-width breakout capability
- Touch/swipe support via native scroll behavior

---

**Made with ❤️ by [jomurgel](https://github.com/jomurgel)**

For more examples and documentation, visit: [https://github.com/jomurgel/native-scroll-slider](https://github.com/jomurgel/native-scroll-slider)