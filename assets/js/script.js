// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  menuToggle.addEventListener('click', function() {
    navLinks.classList.toggle('active');
    const icon = this.querySelector('i');
    icon.classList.toggle('fa-bars');
    icon.classList.toggle('fa-times');
  });

  // Close mobile menu when clicking on a link
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
      const icon = menuToggle.querySelector('i');
      icon.classList.add('fa-bars');
      icon.classList.remove('fa-times');
    });
  });
});

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      const headerOffset = 80;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  });
});

// Project Filtering
document.addEventListener('DOMContentLoaded', function() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');
  
  // Function to filter projects
  function filterProjects(filter) {
    projectCards.forEach(card => {
      const categories = card.getAttribute('data-category');
      
      if (filter === 'all') {
        // Show all projects with animation
        card.classList.remove('hidden');
        card.style.transition = 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        card.style.opacity = '1';
        card.style.transform = 'scale(1)';
      } else {
        // Split categories by space and check if any category matches the filter
        if (categories && categories.split(' ').includes(filter)) {
          // Show matching projects with animation
          card.classList.remove('hidden');
          card.style.transition = 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
          card.style.opacity = '1';
          card.style.transform = 'scale(1)';
        } else {
          // Hide non-matching projects with animation
          card.style.transition = 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
          card.style.opacity = '0';
          card.style.transform = 'scale(0.8)';
          
          setTimeout(() => {
            card.classList.add('hidden');
            card.style.transition = '';
            card.style.opacity = '';
            card.style.transform = '';
          }, 400);
        }
      }
    });
    
    // Update grid layout based on visible projects
  }
  
  
  // Add click event listeners to filter buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      // Update active button
      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      this.classList.add('active');
      this.setAttribute('aria-pressed', 'true');
      
      const filter = this.getAttribute('data-filter');
      filterProjects(filter);
    });
  });
  
  // Initialize with 'all' filter
  filterProjects('all');
  
});


// Header Background on Scroll
window.addEventListener('scroll', () => {
  const header = document.querySelector('.header');
  if (window.scrollY > 50) {
    header.style.background = 'rgba(0, 0, 0, 0.95)';
  } else {
    header.style.background = 'rgba(0, 0, 0, 0.9)';
  }
});

// Premium Animation on Scroll
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('fade-in-elegant');
    }
  });
}, observerOptions);

// Observe elements for premium animation
document.querySelectorAll('.project-card, .skill-item, .section-title, .section-subtitle').forEach(el => {
  observer.observe(el);
});

// Add staggered animation to project cards
document.addEventListener('DOMContentLoaded', function() {
  const projectCards = document.querySelectorAll('.project-card');
  projectCards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
  });
  
  // Add premium hover effects
  projectCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transition = 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transition = 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    });
  });

  // Initialize premium features
  initScrollProgress();
  initParallax();
  initSectionAnimations();
  initTooltips();
  initBackToTop();
});

// Premium Responsive Skills Carousel
let carouselPosition = 0;
let isCarouselPaused = false;
let carouselInterval;
let isDragging = false;
let startX = 0;
let scrollLeft = 0;

document.addEventListener('DOMContentLoaded', function() {
  const skillsTrack = document.querySelector('.skills-track');
  const carousel = document.querySelector('.skills-carousel');
  
  if (skillsTrack && carousel) {
    // Duplicar os itens para criar loop infinito
    const skillItems = skillsTrack.innerHTML;
    skillsTrack.innerHTML = skillItems + skillItems;
    
    // Iniciar animação automática
    startCarouselAnimation();
    
    // Mouse events
    carousel.addEventListener('mousedown', handleMouseDown);
    carousel.addEventListener('mousemove', handleMouseMove);
    carousel.addEventListener('mouseup', handleMouseUp);
    carousel.addEventListener('mouseleave', handleMouseLeave);
    
    // Touch events
    carousel.addEventListener('touchstart', handleTouchStart, { passive: false });
    carousel.addEventListener('touchmove', handleTouchMove, { passive: false });
    carousel.addEventListener('touchend', handleTouchEnd);
    
    // Hover pause
      carousel.addEventListener('mouseenter', () => {
        isCarouselPaused = true;
        clearInterval(carouselInterval);
      });
      
      carousel.addEventListener('mouseleave', () => {
        isCarouselPaused = false;
      if (!isDragging) {
        startCarouselAnimation();
      }
      });
  }
});

function startCarouselAnimation() {
  if (!isCarouselPaused && !isDragging) {
    carouselInterval = setInterval(() => {
      carouselPosition -= 1;
      const skillsTrack = document.querySelector('.skills-track');
      if (skillsTrack) {
        skillsTrack.style.transform = `translateX(${carouselPosition}px)`;
        
        // Reset position when half way through
        const trackWidth = skillsTrack.scrollWidth / 2;
        if (Math.abs(carouselPosition) >= trackWidth) {
          carouselPosition = 0;
        }
      }
    }, 30);
  }
}

// Mouse drag functionality
function handleMouseDown(e) {
  isDragging = true;
  startX = e.pageX - e.currentTarget.offsetLeft;
  scrollLeft = carouselPosition;
  e.currentTarget.style.cursor = 'grabbing';
  isCarouselPaused = true;
  clearInterval(carouselInterval);
}

function handleMouseMove(e) {
  if (!isDragging) return;
  e.preventDefault();
  const x = e.pageX - e.currentTarget.offsetLeft;
  const walk = (x - startX) * 2;
  carouselPosition = scrollLeft - walk;
  const skillsTrack = document.querySelector('.skills-track');
  if (skillsTrack) {
    skillsTrack.style.transform = `translateX(${carouselPosition}px)`;
  }
}

function handleMouseUp() {
  isDragging = false;
  const carousel = document.querySelector('.skills-carousel');
  if (carousel) {
    carousel.style.cursor = 'grab';
  }
  isCarouselPaused = false;
  if (!isCarouselPaused) {
    startCarouselAnimation();
  }
}

function handleMouseLeave() {
  isDragging = false;
  const carousel = document.querySelector('.skills-carousel');
  if (carousel) {
    carousel.style.cursor = 'grab';
  }
  isCarouselPaused = false;
  if (!isCarouselPaused) {
    startCarouselAnimation();
  }
}

// Touch functionality
function handleTouchStart(e) {
  isDragging = true;
  startX = e.touches[0].pageX - e.currentTarget.offsetLeft;
  scrollLeft = carouselPosition;
  isCarouselPaused = true;
  clearInterval(carouselInterval);
}

function handleTouchMove(e) {
  if (!isDragging) return;
  e.preventDefault();
  const x = e.touches[0].pageX - e.currentTarget.offsetLeft;
  const walk = (x - startX) * 2;
  carouselPosition = scrollLeft - walk;
  const skillsTrack = document.querySelector('.skills-track');
  if (skillsTrack) {
    skillsTrack.style.transform = `translateX(${carouselPosition}px)`;
  }
}

function handleTouchEnd() {
  isDragging = false;
  isCarouselPaused = false;
  if (!isCarouselPaused) {
    startCarouselAnimation();
  }
}

function navigateCarousel(direction) {
  const skillsTrack = document.querySelector('.skills-track');
  if (!skillsTrack) return;
  
  // Pausar animação automática temporariamente
  clearInterval(carouselInterval);
  
  // Calcular movimento baseado na largura dos itens
  const itemWidth = 150; // Largura aproximada de cada item
  const moveDistance = itemWidth * 2; // Mover 2 itens por vez
  
  carouselPosition += direction * moveDistance;
  
  // Aplicar transformação suave
  skillsTrack.style.transition = 'transform 0.5s ease-in-out';
  skillsTrack.style.transform = `translateX(${carouselPosition}px)`;
  
  // Reset position se necessário
  const trackWidth = skillsTrack.scrollWidth / 2;
  if (Math.abs(carouselPosition) >= trackWidth) {
    setTimeout(() => {
      skillsTrack.style.transition = 'none';
      carouselPosition = 0;
      skillsTrack.style.transform = `translateX(${carouselPosition}px)`;
    }, 500);
  }
  
  // Retomar animação automática após 2 segundos
  setTimeout(() => {
    if (!isCarouselPaused) {
      skillsTrack.style.transition = 'none';
      startCarouselAnimation();
    }
  }, 2000);
}

// Loading state management
window.addEventListener('load', () => {
  document.body.classList.remove('loading');
});

// Project Modal Functions
function openProjectModal(projectCard) {
  const modal = document.getElementById('projectModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalImage = document.getElementById('modalImage');
  const modalDescription = document.getElementById('modalDescription');
  const modalMetrics = document.getElementById('modalMetrics');
  const modalTech = document.getElementById('modalTech');
  const modalLinks = document.getElementById('modalLinks');
  const modalValueSection = document.getElementById('modalValueSection');
  const modalValueBenefits = document.getElementById('modalValueBenefits');
  
  // Extract project data
  const title = projectCard.querySelector('.project-title').textContent;
  const image = projectCard.querySelector('.project-image img');
  const description = projectCard.querySelector('.description-full').textContent;
  const metrics = projectCard.querySelector('.project-metrics');
  const tech = projectCard.querySelector('.project-tech');
  const links = projectCard.querySelector('.project-links');
  const valueBenefits = projectCard.querySelector('.project-value-benefits');
  
  // Populate modal content
  modalTitle.textContent = title;
  modalImage.src = image.src;
  modalImage.alt = image.alt;
  modalDescription.textContent = description;
  modalMetrics.innerHTML = metrics.innerHTML;
  modalTech.innerHTML = tech.innerHTML;
  modalLinks.innerHTML = links.innerHTML;
  
  // Handle value/benefits section
  if (valueBenefits && valueBenefits.children.length > 0) {
    modalValueBenefits.innerHTML = valueBenefits.innerHTML;
    modalValueSection.style.display = 'block';
  } else {
    modalValueSection.style.display = 'none';
    modalValueBenefits.innerHTML = '';
  }
  
  // Show modal
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  
  // Focus management
  modal.querySelector('.modal-close').focus();
}

function closeProjectModal() {
  const modal = document.getElementById('projectModal');
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  
  // Return focus to the button that opened the modal
  if (window.lastFocusedButton) {
    window.lastFocusedButton.focus();
  }
}

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const modal = document.getElementById('projectModal');
    if (modal.classList.contains('active')) {
      closeProjectModal();
    }
  }
});

// Store reference to the button that opened the modal
document.addEventListener('click', function(e) {
  if (e.target.closest('.btn-see-more')) {
    window.lastFocusedButton = e.target.closest('.btn-see-more');
  }
});


// Premium Scroll Progress Indicator
function initScrollProgress() {
  const scrollProgress = document.getElementById('scrollProgress');
  const scrollProgressBar = document.getElementById('scrollProgressBar');
  
  if (!scrollProgress || !scrollProgressBar) return;
  
  window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset;
    const docHeight = document.body.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;
    
    scrollProgressBar.style.width = scrollPercent + '%';
    
    if (scrollTop > 100) {
      scrollProgress.classList.add('visible');
    } else {
      scrollProgress.classList.remove('visible');
    }
  });
}

// Premium Parallax Effect
// Throttle function for performance
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

function initParallax() {
  const hero = document.querySelector('.hero');
  const heroContent = document.querySelector('.hero-parallax-content');
  
  if (!hero || !heroContent) return;
  
  // Cache values for performance
  const heroRect = hero.getBoundingClientRect();
  const heroTop = hero.offsetTop;
  const heroHeight = hero.offsetHeight;
  const heroBottom = heroTop + heroHeight;
  
  // Pre-calculate values
  const maxParallax = 30; // Reduced for better performance
  const fadeStart = 0.7; // Start fade earlier
  
  // Optimized scroll handler with throttling
  const handleScroll = throttle(() => {
    const scrolled = window.pageYOffset;
    
    // Only calculate if in hero area
    if (scrolled >= heroTop && scrolled <= heroBottom) {
      const progress = (scrolled - heroTop) / heroHeight;
      
      // Simplified calculations
      const parallaxOffset = Math.round(progress * maxParallax);
      const opacity = progress > fadeStart ? Math.max(1 - (progress - fadeStart) * 2, 0.4) : 1;
      
      // Use transform3d for GPU acceleration
      heroContent.style.transform = `translate3d(0, ${parallaxOffset}px, 0)`;
      heroContent.style.opacity = opacity;
    } else if (scrolled > heroBottom) {
      heroContent.style.transform = `translate3d(0, ${maxParallax}px, 0)`;
      heroContent.style.opacity = '0.4';
    } else {
      heroContent.style.transform = 'translate3d(0, 0, 0)';
      heroContent.style.opacity = '1';
    }
  }, 16); // ~60fps
  
  window.addEventListener('scroll', handleScroll, { passive: true });
}

// Section Animation System
function initSectionAnimations() {
  // Select all sections and their elements
  const sections = document.querySelectorAll('.section');
  const sectionElements = document.querySelectorAll('.section-title, .section-subtitle, .project-card, .skill-item, .about-content, .contact-info, .project-filters, .skills-carousel, .color-palette, .language-selector');
  
  // Intersection Observer options
  const observerOptions = {
    root: null,
    rootMargin: '-10% 0px -10% 0px', // Trigger when section is 10% visible
    threshold: 0.1
  };
  
  // Section observer
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const section = entry.target;
      
      if (entry.isIntersecting) {
        // Section entering viewport
        section.classList.add('animate-in');
        section.classList.remove('animate-out');
        
        // Animate section elements with delay
        setTimeout(() => {
          const elements = section.querySelectorAll('.section-title, .section-subtitle, .project-card, .skill-item, .about-content, .contact-info');
          elements.forEach((el, index) => {
            setTimeout(() => {
              el.classList.add('animate-in');
            }, index * 100); // Staggered animation
          });
        }, 200);
        
      } else {
        // Section leaving viewport
        if (entry.boundingClientRect.top < 0) {
          // Section is above viewport (scrolling down)
          section.classList.add('animate-out');
          section.classList.remove('animate-in');
          
          // Fade out section elements
          const elements = section.querySelectorAll('.section-title, .section-subtitle, .project-card, .skill-item, .about-content, .contact-info');
          elements.forEach(el => {
            el.classList.remove('animate-in');
          });
        }
      }
    });
  }, observerOptions);
  
  // Element observer for individual elements
  const elementObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, {
    root: null,
    rootMargin: '0px 0px -20% 0px',
    threshold: 0.1
  });
  
  // Observe all sections
  sections.forEach(section => {
    sectionObserver.observe(section);
  });
  
  // Observe individual elements
  sectionElements.forEach(element => {
    elementObserver.observe(element);
  });
  
  // Initialize hero as visible (no animation needed)
  const hero = document.querySelector('.hero');
  if (hero) {
    hero.style.opacity = '1';
    hero.style.transform = 'translateY(0)';
  }
}

// Premium Tooltip System
function initTooltips() {
  const tooltipElements = document.querySelectorAll('[data-tooltip]');
  
  tooltipElements.forEach(el => {
    el.classList.add('tooltip');
  });
}

// Premium Toast Notification System
function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 400);
  }, duration);
}

// Premium Loading States
function showLoadingState(element) {
  element.classList.add('loading-skeleton');
  element.style.pointerEvents = 'none';
}

function hideLoadingState(element) {
  element.classList.remove('loading-skeleton');
  element.style.pointerEvents = 'auto';
}

// Color Palette System - Minimalist Professional
const colorThemes = {
  white: {
    primary: '#ffffff',
    hover: '#f5f5f5',
    gradient: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
    gradientHover: 'linear-gradient(135deg, #f5f5f5 0%, #e5e5e5 100%)',
    accent: '#ffffff',
    accentLight: 'rgba(255, 255, 255, 0.8)',
    accentSubtle: 'rgba(255, 255, 255, 0.1)'
  },
  gray: {
    primary: '#a3a3a3',
    hover: '#d4d4d4',
    gradient: 'linear-gradient(135deg, #a3a3a3 0%, #d4d4d4 100%)',
    gradientHover: 'linear-gradient(135deg, #d4d4d4 0%, #e5e5e5 100%)',
    accent: '#a3a3a3',
    accentLight: 'rgba(163, 163, 163, 0.8)',
    accentSubtle: 'rgba(163, 163, 163, 0.1)'
  },
  lightgray: {
    primary: '#d4d4d4',
    hover: '#e5e5e5',
    gradient: 'linear-gradient(135deg, #d4d4d4 0%, #e5e5e5 100%)',
    gradientHover: 'linear-gradient(135deg, #e5e5e5 0%, #f5f5f5 100%)'
  },
  darkgray: {
    primary: '#737373',
    hover: '#a3a3a3',
    gradient: 'linear-gradient(135deg, #737373 0%, #a3a3a3 100%)',
    gradientHover: 'linear-gradient(135deg, #a3a3a3 0%, #d4d4d4 100%)'
  },
  silver: {
    primary: '#c0c0c0',
    hover: '#d4d4d4',
    gradient: 'linear-gradient(135deg, #c0c0c0 0%, #d4d4d4 100%)',
    gradientHover: 'linear-gradient(135deg, #d4d4d4 0%, #e5e5e5 100%)'
  },
  charcoal: {
    primary: '#404040',
    hover: '#737373',
    gradient: 'linear-gradient(135deg, #404040 0%, #737373 100%)',
    gradientHover: 'linear-gradient(135deg, #737373 0%, #a3a3a3 100%)',
    accent: '#404040',
    accentLight: 'rgba(64, 64, 64, 0.8)',
    accentSubtle: 'rgba(64, 64, 64, 0.1)'
  },
  platinum: {
    primary: '#e5e5e5',
    hover: '#f5f5f5',
    gradient: 'linear-gradient(135deg, #e5e5e5 0%, #f5f5f5 100%)',
    gradientHover: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)'
  },
  steel: {
    primary: '#71717a',
    hover: '#a3a3a3',
    gradient: 'linear-gradient(135deg, #71717a 0%, #a3a3a3 100%)',
    gradientHover: 'linear-gradient(135deg, #a3a3a3 0%, #d4d4d4 100%)'
  },
  // Premium Color Themes
  gold: {
    primary: '#d4af37',
    hover: '#e6c547',
    gradient: 'linear-gradient(135deg, #d4af37 0%, #e6c547 100%)',
    gradientHover: 'linear-gradient(135deg, #e6c547 0%, #f0d75a 100%)',
    accent: '#d4af37',
    accentLight: 'rgba(212, 175, 55, 0.8)',
    accentSubtle: 'rgba(212, 175, 55, 0.1)'
  },
  blue: {
    primary: '#4a90e2',
    hover: '#5ba0f2',
    gradient: 'linear-gradient(135deg, #4a90e2 0%, #5ba0f2 100%)',
    gradientHover: 'linear-gradient(135deg, #5ba0f2 0%, #6bb0ff 100%)',
    accent: '#4a90e2',
    accentLight: 'rgba(74, 144, 226, 0.8)',
    accentSubtle: 'rgba(74, 144, 226, 0.1)'
  },
  purple: {
    primary: '#8b5cf6',
    hover: '#9d6ff8',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #9d6ff8 100%)',
    gradientHover: 'linear-gradient(135deg, #9d6ff8 0%, #af81fa 100%)',
    accent: '#8b5cf6',
    accentLight: 'rgba(139, 92, 246, 0.8)',
    accentSubtle: 'rgba(139, 92, 246, 0.1)'
  },
  emerald: {
    primary: '#10b981',
    hover: '#22c991',
    gradient: 'linear-gradient(135deg, #10b981 0%, #22c991 100%)',
    gradientHover: 'linear-gradient(135deg, #22c991 0%, #34d9a1 100%)',
    accent: '#10b981',
    accentLight: 'rgba(16, 185, 129, 0.8)',
    accentSubtle: 'rgba(16, 185, 129, 0.1)'
  },
  rose: {
    primary: '#f43f5e',
    hover: '#f5516e',
    gradient: 'linear-gradient(135deg, #f43f5e 0%, #f5516e 100%)',
    gradientHover: 'linear-gradient(135deg, #f5516e 0%, #f6617e 100%)',
    accent: '#f43f5e',
    accentLight: 'rgba(244, 63, 94, 0.8)',
    accentSubtle: 'rgba(244, 63, 94, 0.1)'
  },
  // Premium Mix Theme - All colors combined
  'premium-mix': {
    primary: '#8b5cf6', // Purple as primary
    hover: '#9d6ff8',
    gradient: 'linear-gradient(135deg, #d4af37 0%, #4a90e2 25%, #8b5cf6 50%, #10b981 75%, #f43f5e 100%)',
    gradientHover: 'linear-gradient(135deg, #e6c547 0%, #5ba0f2 25%, #9d6ff8 50%, #22c991 75%, #f5516e 100%)',
    accent: '#8b5cf6',
    accentLight: 'rgba(139, 92, 246, 0.8)',
    accentSubtle: 'rgba(139, 92, 246, 0.1)',
    // Special properties for mix theme
    isMix: true,
    goldAccent: '#d4af37',
    blueAccent: '#4a90e2',
    purpleAccent: '#8b5cf6',
    emeraldAccent: '#10b981',
    roseAccent: '#f43f5e'
  }
};

// Helper function to convert hex to RGB
function hexToRgb(hex) {
  if (!hex) return null;
  // Remove # if present
  hex = hex.replace('#', '');
  // Handle 3-digit hex
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return { r, g, b };
}

// Apply color theme
function applyColorTheme(themeName) {
  const theme = colorThemes[themeName];
  if (!theme) return;
  
  const root = document.documentElement;
  
  // Update CSS custom properties
  root.style.setProperty('--accent-color', theme.primary);
  root.style.setProperty('--accent-hover', theme.hover);
  root.style.setProperty('--gradient-primary', theme.gradient);
  root.style.setProperty('--gradient-hover', theme.gradientHover);
  
  // Update accent colors for premium themes
  if (theme.accent) {
    // Special handling for premium-mix theme
    if (theme.isMix) {
      // Apply individual colors for mix theme
      root.style.setProperty('--accent-gold', theme.goldAccent);
      root.style.setProperty('--accent-gold-light', 'rgba(212, 175, 55, 0.8)');
      root.style.setProperty('--accent-gold-subtle', 'rgba(212, 175, 55, 0.1)');
      root.style.setProperty('--gradient-gold', `linear-gradient(135deg, ${theme.goldAccent}, rgba(212, 175, 55, 0.8))`);
      
      root.style.setProperty('--accent-blue', theme.blueAccent);
      root.style.setProperty('--accent-blue-light', 'rgba(74, 144, 226, 0.8)');
      root.style.setProperty('--accent-blue-subtle', 'rgba(74, 144, 226, 0.1)');
      root.style.setProperty('--gradient-blue', `linear-gradient(135deg, ${theme.blueAccent}, rgba(74, 144, 226, 0.8))`);
      
      root.style.setProperty('--accent-purple', theme.purpleAccent);
      root.style.setProperty('--accent-purple-light', 'rgba(139, 92, 246, 0.8)');
      root.style.setProperty('--accent-purple-subtle', 'rgba(139, 92, 246, 0.1)');
      root.style.setProperty('--gradient-purple', `linear-gradient(135deg, ${theme.purpleAccent}, rgba(139, 92, 246, 0.8))`);
      
      root.style.setProperty('--accent-emerald', theme.emeraldAccent);
      root.style.setProperty('--accent-emerald-light', 'rgba(16, 185, 129, 0.8)');
      root.style.setProperty('--accent-emerald-subtle', 'rgba(16, 185, 129, 0.1)');
      root.style.setProperty('--gradient-emerald', `linear-gradient(135deg, ${theme.emeraldAccent}, rgba(16, 185, 129, 0.8))`);
      
      root.style.setProperty('--accent-rose', theme.roseAccent);
      root.style.setProperty('--accent-rose-light', 'rgba(244, 63, 94, 0.8)');
      root.style.setProperty('--accent-rose-subtle', 'rgba(244, 63, 94, 0.1)');
      root.style.setProperty('--gradient-rose', `linear-gradient(135deg, ${theme.roseAccent}, rgba(244, 63, 94, 0.8))`);
    } else {
      // Standard single-color theme
      root.style.setProperty('--accent-gold', theme.accent);
      root.style.setProperty('--accent-gold-light', theme.accentLight);
      root.style.setProperty('--accent-gold-subtle', theme.accentSubtle);
      root.style.setProperty('--gradient-gold', theme.gradient);
      
      root.style.setProperty('--accent-blue', theme.accent);
      root.style.setProperty('--accent-blue-light', theme.accentLight);
      root.style.setProperty('--accent-blue-subtle', theme.accentSubtle);
      root.style.setProperty('--gradient-blue', theme.gradient);
      
      root.style.setProperty('--accent-purple', theme.accent);
      root.style.setProperty('--accent-purple-light', theme.accentLight);
      root.style.setProperty('--accent-purple-subtle', theme.accentSubtle);
      root.style.setProperty('--gradient-purple', theme.gradient);
      
      root.style.setProperty('--accent-emerald', theme.accent);
      root.style.setProperty('--accent-emerald-light', theme.accentLight);
      root.style.setProperty('--accent-emerald-subtle', theme.accentSubtle);
      root.style.setProperty('--gradient-emerald', theme.gradient);
      
      root.style.setProperty('--accent-rose', theme.accent);
      root.style.setProperty('--accent-rose-light', theme.accentLight);
      root.style.setProperty('--accent-rose-subtle', theme.accentSubtle);
      root.style.setProperty('--gradient-rose', theme.gradient);
    }
  }
  
  // Create dynamic variables for business value icons only (always use primary color)
  const accentColor = theme.accent || theme.primary;
  const accentRgb = hexToRgb(accentColor);
  if (accentRgb) {
    root.style.setProperty('--value-icon-bg-start', `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.2)`);
    root.style.setProperty('--value-icon-bg-end', `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.1)`);
    root.style.setProperty('--value-icon-border', `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.3)`);
    root.style.setProperty('--value-icon-border-hover', `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.5)`);
    root.style.setProperty('--value-icon-shadow', `0 2px 8px rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.25)`);
  }
  
  // Update active color option
  document.querySelectorAll('.color-option').forEach(option => {
    option.classList.remove('active');
  });
  document.querySelector(`[data-color="${themeName}"]`).classList.add('active');
  
  // Save preference
  localStorage.setItem('selectedColorTheme', themeName);
}

// Toggle color palette visibility
function toggleColorPalette() {
  const colorOptions = document.querySelector('.color-options');
  const languageOptions = document.querySelector('.language-options');
  
  if (colorOptions) {
    colorOptions.classList.toggle('active');
    
    // Close language dropdown if color palette is opening
    if (colorOptions.classList.contains('active') && languageOptions) {
      languageOptions.classList.remove('active');
    }
  }
}

// Language System
const translations = {
  pt: {
    // Navigation
    'Projetos': 'Projetos',
    'Habilidades': 'Habilidades',
    'Sobre': 'Sobre',
    'Contato': 'Contato',
    
    // Hero
    'Olá, eu sou': 'Olá, eu sou',
    'Hello, I\'m': 'Olá, eu sou',
    'Desenvolvedor e Arquiteto de Software apaixonado por criar soluções tecnológicas inovadoras. Especialista em desenvolvimento full stack, cloud computing e arquitetura de sistemas escaláveis.': 'Desenvolvedor e Arquiteto de Software apaixonado por criar soluções tecnológicas inovadoras. Especialista em desenvolvimento full stack, cloud computing e arquitetura de sistemas escaláveis.',
    'Ver Projetos': 'Ver Projetos',
    'Contact': 'Contato',
    
    // Projects
    'Projects': 'Projetos',
    'Software solutions and innovative projects developed in personal and professional contexts': 'Soluções de software e projetos inovadores desenvolvidos em contextos pessoais e profissionais',
    'All': 'Todos',
    'Research': 'Pesquisa',
    'See more': 'Ver mais',
    
    // Skills
    'Skills': 'Habilidades',
    'Technologies and specialized tools in Data Science and MLOps': 'Tecnologias e ferramentas especializadas em Ciência de Dados e MLOps',
    
    // About
    'About': 'Sobre',
    'About Me': 'Sobre Mim',
    
    // Contact
    'Let\'s Talk': 'Vamos Conversar',
    'I\'m always open to new opportunities in Data Science, Machine Learning project collaborations, and conversations about data innovation. If you have a data challenge or want to discuss MLOps, I\'d be happy to chat!': 'Estou sempre aberto a novas oportunidades em Ciência de Dados, colaborações em projetos de Machine Learning e conversas sobre inovação em dados. Se você tem um desafio de dados ou quer trocar ideias sobre MLOps, ficarei feliz em conversar!',
    
    // Footer
    '© 2024 Sidnei Almeida. Criando soluções tecnológicas inovadoras.': '© 2024 Sidnei Almeida. Criando soluções tecnológicas inovadoras.'
  },
  en: {
    // Navigation
    'Projetos': 'Projects',
    'Habilidades': 'Skills',
    'Sobre': 'About',
    'Contato': 'Contact',
    
    // Hero
    'Olá, eu sou': 'Hello, I\'m',
    'Hello, I\'m': 'Hello, I\'m',
    'Desenvolvedor e Arquiteto de Software apaixonado por criar soluções tecnológicas inovadoras. Especialista em desenvolvimento full stack, cloud computing e arquitetura de sistemas escaláveis.': 'Developer and Software Architect passionate about creating innovative technological solutions. Expert in full stack development, cloud computing and scalable system architecture.',
    'Ver Projetos': 'View Projects',
    'Contact': 'Contact',
    
    // Projects
    'Projects': 'Projects',
    'Software solutions and innovative projects developed in personal and professional contexts': 'Software solutions and innovative projects developed in personal and professional contexts',
    'All': 'All',
    'Research': 'Research',
    'See more': 'See more',
    
    // Skills
    'Skills': 'Skills',
    'Technologies and specialized tools in Data Science and MLOps': 'Technologies and specialized tools in Data Science and MLOps',
    
    // About
    'About': 'About',
    'About Me': 'About Me',
    
    // Contact
    'Let\'s Talk': 'Let\'s Talk',
    'I\'m always open to new opportunities in Data Science, Machine Learning project collaborations, and conversations about data innovation. If you have a data challenge or want to discuss MLOps, I\'d be happy to chat!': 'I\'m always open to new opportunities in Data Science, Machine Learning project collaborations, and conversations about data innovation. If you have a data challenge or want to discuss MLOps, I\'d be happy to chat!',
    
    // Footer
    '© 2024 Sidnei Almeida. Creating innovative technological solutions.': '© 2024 Sidnei Almeida. Creating innovative technological solutions.',
    
    // Project Status Badges
    'Ativo': 'Active',
    'Destaque': 'Featured',
    'Em Desenvolvimento': 'In Development',
    'Em Breve': 'Coming Soon',
    'Inovação': 'Innovation',
    
    // Project Metrics
    '10+ Modelos': '10+ Models',
    'GPU Colab': 'GPU Colab',
    
    // Project Links
    'Código': 'Code',
    'Ver Demo': 'View Demo',
    
    // Carousel Controls
    'Anterior': 'Previous',
    'Próximo': 'Next'
  },
  es: {
    // Navigation
    'Projetos': 'Proyectos',
    'Habilidades': 'Habilidades',
    'Sobre': 'Acerca de',
    'Contato': 'Contacto',
    
    // Hero
    'Olá, eu sou': 'Hola, soy',
    'Hello, I\'m': 'Hola, soy',
    'Desenvolvedor e Arquiteto de Software apaixonado por criar soluções tecnológicas inovadoras. Especialista em desenvolvimento full stack, cloud computing e arquitetura de sistemas escaláveis.': 'Desarrollador y Arquitecto de Software apasionado por crear soluciones tecnológicas innovadoras. Experto en desarrollo full stack, cloud computing y arquitectura de sistemas escalables.',
    'Ver Projetos': 'Ver Proyectos',
    'Contact': 'Contacto',
    
    // Projects
    'Projects': 'Proyectos',
    'Software solutions and innovative projects developed in personal and professional contexts': 'Soluciones de software y proyectos innovadores desarrollados en contextos personales y profesionales',
    'All': 'Todos',
    'Research': 'Investigación',
    'See more': 'Ver más',
    
    // Skills
    'Skills': 'Habilidades',
    'Technologies and specialized tools in Data Science and MLOps': 'Tecnologías y herramientas especializadas en Ciencia de Datos y MLOps',
    
    // About
    'About': 'Acerca de',
    'About Me': 'Acerca de Mí',
    
    // Contact
    'Let\'s Talk': 'Hablemos',
    'I\'m always open to new opportunities in Data Science, Machine Learning project collaborations, and conversations about data innovation. If you have a data challenge or want to discuss MLOps, I\'d be happy to chat!': 'Siempre estoy abierto a nuevas oportunidades en Ciencia de Datos, colaboraciones en proyectos de Machine Learning y conversaciones sobre innovación en datos. Si tienes un desafío de datos o quieres discutir MLOps, ¡me encantaría charlar!',
    
    // Footer
    '© 2024 Sidnei Almeida. Criando soluções tecnológicas inovadoras.': '© 2024 Sidnei Almeida. Creando soluciones tecnológicas innovadoras.',
    
    // Project Status Badges
    'Ativo': 'Activo',
    'Destaque': 'Destacado',
    'Em Desenvolvimento': 'En Desarrollo',
    'Em Breve': 'Próximamente',
    'Inovação': 'Innovación',
    
    // Project Metrics
    '10+ Modelos': '10+ Modelos',
    'GPU Colab': 'GPU Colab',
    
    // Project Links
    'Código': 'Código',
    'Ver Demo': 'Ver Demo',
    
    // Carousel Controls
    'Anterior': 'Anterior',
    'Próximo': 'Siguiente'
  }
};

// Apply language
function applyLanguage(lang) {
  // Update document language
  let htmlLang = 'en';
  if (lang === 'pt') htmlLang = 'pt-BR';
  else if (lang === 'en') htmlLang = 'en';
  else if (lang === 'es') htmlLang = 'es';
  document.documentElement.lang = htmlLang;
  
  // Update elements with data attributes
  document.querySelectorAll('[data-pt], [data-en], [data-es]').forEach(element => {
    const text = element.getAttribute(`data-${lang}`);
    if (text) {
      element.textContent = text;
    }
  });
  
  // Update form placeholders
  document.querySelectorAll('[data-pt-placeholder], [data-en-placeholder], [data-es-placeholder]').forEach(input => {
    const placeholder = input.getAttribute(`data-${lang}-placeholder`);
    if (placeholder) {
      input.setAttribute('placeholder', placeholder);
    }
  });
  
  // Update aria-labels
  document.querySelectorAll('[data-pt-aria-label], [data-en-aria-label], [data-es-aria-label]').forEach(element => {
    const ariaLabel = element.getAttribute(`data-${lang}-aria-label`);
    if (ariaLabel) {
      element.setAttribute('aria-label', ariaLabel);
    }
  });
  
  // Update language selector
  const text = document.getElementById('currentLangText');
  if (text) {
    text.textContent = lang === 'pt' ? 'PT' : (lang === 'en' ? 'EN' : 'ESP');
  }
  
  // Update active language option
  const languageOptions = document.querySelectorAll('.language-option');
  languageOptions.forEach(option => {
    option.classList.remove('active');
    if (option.getAttribute('data-lang') === lang) {
      option.classList.add('active');
    }
  });
  
  // Save preference
  localStorage.setItem('selectedLanguage', lang);
}

// Toggle language dropdown
function toggleLanguage() {
  const languageOptions = document.querySelector('.language-options');
  const colorOptions = document.querySelector('.color-options');
  
  if (languageOptions) {
    languageOptions.classList.toggle('active');
    
    // Close color palette if language dropdown is opening
    if (languageOptions.classList.contains('active') && colorOptions) {
      colorOptions.classList.remove('active');
    }
  }
}

// Initialize color and language system
document.addEventListener('DOMContentLoaded', function() {
  // Load saved theme or default to premium-mix
  const savedTheme = localStorage.getItem('selectedColorTheme') || 'premium-mix';
  applyColorTheme(savedTheme);
  
  // Load saved language or default to English
  const savedLang = localStorage.getItem('selectedLanguage') || 'en';
  applyLanguage(savedLang);
  
  // Close dropdowns when clicking outside
  document.addEventListener('click', function(event) {
    const languageSelector = document.querySelector('.language-selector');
    const colorPalette = document.querySelector('.color-palette');
    
    // Close language dropdown if clicking outside
    if (languageSelector && !languageSelector.contains(event.target)) {
      const languageOptions = document.querySelector('.language-options');
      if (languageOptions) {
        languageOptions.classList.remove('active');
      }
    }
    
    // Close color palette if clicking outside
    if (colorPalette && !colorPalette.contains(event.target)) {
      const colorOptions = document.querySelector('.color-options');
      if (colorOptions) {
        colorOptions.classList.remove('active');
      }
    }
  });
  
  // Add click listeners to color options
  document.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', function() {
      const themeName = this.getAttribute('data-color');
      applyColorTheme(themeName);
      
      // Close palette after selection
      document.querySelector('.color-options').classList.remove('active');
    });
  });
  
  // Close palette when clicking outside
  document.addEventListener('click', function(e) {
    const colorPalette = document.getElementById('colorPalette');
    if (!colorPalette.contains(e.target)) {
      document.querySelector('.color-options').classList.remove('active');
    }
  });
});

// Ultra Minimalist Back to Top Button
function initBackToTop() {
  const backToTopBtn = document.getElementById('backToTop');
  
  if (!backToTopBtn) return;
  
  let isScrolling = false;
  let scrollTimeout;
  
  // Show/hide button based on scroll position with delay
  function toggleBackToTop() {
    const scrollY = window.pageYOffset;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    // Show only when scrolled past 50% of the page
    if (scrollY > (documentHeight - windowHeight) * 0.5) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  }
  
  // Smooth scroll to top
  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
  
  // Throttled scroll handler
  function handleScroll() {
    if (!isScrolling) {
      requestAnimationFrame(() => {
        toggleBackToTop();
        isScrolling = false;
      });
      isScrolling = true;
    }
  }
  
  // Event listeners
  window.addEventListener('scroll', handleScroll, { passive: true });
  backToTopBtn.addEventListener('click', scrollToTop);
  
  // Initial check
  toggleBackToTop();
}

// Contact Form Toggle and Handler
document.addEventListener('DOMContentLoaded', function() {
  const contactToggle = document.getElementById('contactToggle');
  const contactForm = document.getElementById('contactForm');
  
  // Toggle form visibility
  if (contactToggle && contactForm) {
    contactToggle.addEventListener('click', function() {
      contactForm.classList.toggle('active');
      contactToggle.classList.toggle('active');
      
      // Scroll to form if opening
      if (contactForm.classList.contains('active')) {
        setTimeout(() => {
          contactForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
    });
  }
  
  // Form submission handler
  if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const submitBtn = this.querySelector('.btn-primary');
      const originalText = submitBtn.querySelector('span').textContent;
      const lang = localStorage.getItem('selectedLanguage') || 'pt';
      
      // Messages for different languages
      const messages = {
        sending: {
          pt: 'Enviando...',
          en: 'Sending...',
          es: 'Enviando...'
        },
        success: {
          pt: 'Mensagem enviada!',
          en: 'Message sent!',
          es: '¡Mensaje enviado!'
        },
        error: {
          pt: 'Erro ao enviar. Tente novamente.',
          en: 'Error sending. Please try again.',
          es: 'Error al enviar. Inténtalo de nuevo.'
        }
      };
      
      // Disable button and show loading state
      submitBtn.disabled = true;
      submitBtn.querySelector('span').textContent = messages.sending[lang];
      submitBtn.style.opacity = '0.7';
      
      try {
        const formData = new FormData(this);
        const response = await fetch(this.action, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          // Success
          submitBtn.querySelector('span').textContent = messages.success[lang];
          submitBtn.style.background = 'var(--accent-emerald)';
          submitBtn.style.borderColor = 'var(--accent-emerald)';
          
          // Reset form
          this.reset();
          
          // Hide form and reset button after 2 seconds
          setTimeout(() => {
            // Close form
            contactForm.classList.remove('active');
            contactToggle.classList.remove('active');
            
            // Reset button
            submitBtn.disabled = false;
            submitBtn.querySelector('span').textContent = originalText;
            submitBtn.style.opacity = '1';
            submitBtn.style.background = '';
            submitBtn.style.borderColor = '';
          }, 2000);
        } else {
          throw new Error('Form submission failed');
        }
      } catch (error) {
        // Error
        submitBtn.querySelector('span').textContent = messages.error[lang];
        submitBtn.style.background = 'var(--accent-rose)';
        submitBtn.style.borderColor = 'var(--accent-rose)';
        
        // Reset button after 3 seconds
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.querySelector('span').textContent = originalText;
          submitBtn.style.opacity = '1';
          submitBtn.style.background = '';
          submitBtn.style.borderColor = '';
        }, 3000);
      }
    });
  }
});
