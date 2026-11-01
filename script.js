/**
 * Fine Cane Works - Website JavaScript
 * Handles mobile navigation, smooth scrolling, form validation, and interactivity
 * Based on content from: FINE CANE WORKS.docx
 */

// Wait for Forminit SDK to load (it's loaded via script tag in HTML)
function waitForForminit(callback, maxRetries = 10, retryInterval = 100) {
    let retries = 0;
    const check = () => {
        if (typeof forminit !== 'undefined' && forminit.submit) {
            callback();
        } else if (retries < maxRetries) {
            retries++;
            setTimeout(check, retryInterval);
        } else {
            console.error('Forminit SDK failed to load after', maxRetries, 'retries');
        }
    };
    check();
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all components
    initMobileNavigation();
    initSmoothScrolling();
    initProductButtons();
    updateCurrentYear();

    // Lazy load images for performance
    initLazyLoading();

    // Initialize form validation after Forminit SDK is loaded
    waitForForminit(initFormValidation, 15, 200);
});

/**
 * Mobile Navigation Management
 * Handles hamburger menu toggle and accessibility
 */
function initMobileNavigation() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const navLinkItems = document.querySelectorAll('.nav-link');

    if (!mobileMenuBtn || !navLinks) return;

    // Toggle mobile menu
    mobileMenuBtn.addEventListener('click', () => {
        const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
        mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
        navLinks.classList.toggle('show');

        if (!isExpanded) {
            const closeMenu = (e) => {
                if (!navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                    navLinks.classList.remove('show');
                    mobileMenuBtn.setAttribute('aria-expanded', 'false');
                    document.removeEventListener('click', closeMenu);
                }
            };
            setTimeout(() => {
                document.addEventListener('click', closeMenu);
            }, 100);
        }
    });

    // Close mobile menu when clicking a nav link
    navLinkItems.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('show');
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
        });
    });
}

/**
 * Smooth Scrolling for Anchor Links
 */
function initSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');

            if (href && href !== '#') {
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });

                    // Update URL without jumping
                    history.pushState(null, '', href);
                }
            }
        });
    });
}

/**
 * Form Validation with Accessible Error Messages
 */
function initFormValidation() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const isValid = validateForm(form);
        const hasValidContact = validateContactInfo(form);

        if (isValid && hasValidContact) {
            handleSubmit(form);
        } else {
            const firstError = form.querySelector('.error-message:not([aria-hidden="true"])');
            if (firstError) {
                firstError.focus();
            }
        }
    });

    // Real-time validation on input blur
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', () => {
            validateField(input);
        });

        input.addEventListener('input', () => {
            clearFieldError(input);
        });
    });

    // Initialize WhatsApp buttons
    initWhatsAppButtons();
}

/**
 * Validate a single form field
 */
function validateField(field) {
    const errorElement = document.querySelector(`#${field.id}-error`);
    let isValid = true;
    let errorMessage = '';

    // Required field check
    if (field.hasAttribute('required') && !field.value.trim()) {
        isValid = false;
        errorMessage = 'This field is required';
    }
    // Email validation
    else if (field.type === 'email' && field.value) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(field.value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        }
    }
    // Minlength validation
    else if (field.minLength && field.value.length < parseInt(field.minLength)) {
        isValid = false;
        errorMessage = `Please enter at least ${field.minLength} characters`;
    }

    // Show/hide error message
    if (errorElement) {
        if (!isValid) {
            errorElement.textContent = errorMessage;
            errorElement.setAttribute('aria-hidden', 'false');
            field.setAttribute('aria-invalid', 'true');
            field.classList.add('error');
        } else {
            clearFieldError(field);
        }
    }

    return isValid;
}

/**
 * Validate email or phone requirement (at least one is required)
 */
function validateContactInfo(form) {
    const email = form.querySelector('#email').value.trim();
    const phone = form.querySelector('#phone').value.trim();

    if (!email && !phone) {
        const emailError = form.querySelector('#email-error');
        const phoneError = form.querySelector('#phone-error');
        emailError.textContent = 'Please provide at least an email or phone number';
        emailError.setAttribute('aria-hidden', 'false');
        phoneError.textContent = 'Please provide at least an email or phone number';
        phoneError.setAttribute('aria-hidden', 'false');
        form.querySelector('#email').setAttribute('aria-invalid', 'true');
        form.querySelector('#phone').setAttribute('aria-invalid', 'true');
        return false;
    }

    // Clear errors if valid
    const emailError = form.querySelector('#email-error');
    const phoneError = form.querySelector('#phone-error');
    emailError.textContent = '';
    emailError.setAttribute('aria-hidden', 'true');
    phoneError.textContent = '';
    phoneError.setAttribute('aria-hidden', 'true');
    form.querySelector('#email').setAttribute('aria-invalid', 'false');
    form.querySelector('#phone').setAttribute('aria-invalid', 'false');

    return true;
}

/**
 * Clear field error state
 */
function clearFieldError(field) {
    const errorElement = document.querySelector(`#${field.id}-error`);

    if (errorElement) {
        errorElement.textContent = '';
        errorElement.setAttribute('aria-hidden', 'true');
    }

    field.setAttribute('aria-invalid', 'false');
    field.classList.remove('error');
}

/**
 * Validate entire form
 */
function validateForm(form) {
    const inputs = form.querySelectorAll('input, textarea, select');
    let isValid = true;

    inputs.forEach(input => {
        const fieldValid = validateField(input);
        if (!fieldValid) {
            isValid = false;
        }
    });

    return isValid;
}

/**
 * Handle form submission using Forminit
 */
let isSubmitting = false;

async function handleSubmit(form) {
    const successMessage = document.getElementById('form-success');
    const errorMessage = document.getElementById('form-error');

    // Prevent double submission
    if (isSubmitting) return;
    isSubmitting = true;

    // Disable submit button
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    successMessage.textContent = 'Sending your message...';
    successMessage.style.display = 'block';
    successMessage.style.color = '#333';
    successMessage.classList.remove('error', 'show');

    try {
        // Build FormData
        const fd = new FormData(form);

        // Map field names to Forminit format
        const fieldMappings = {
            'name': 'fi-sender-fullName',
            'email': 'fi-sender-email',
            'phone': 'fi-sender-phone',
            'message': 'fi-text-message'
        };

        // Create new FormData with mapped field names
        const mappedFd = new FormData();
        for (const [key, value] of fd.entries()) {
            if (value && value.toString().trim() !== '') {
                const forminitName = fieldMappings[key] || `fi-text-${key}`;
                mappedFd.append(forminitName, value);
            }
        }

        // Add sender email (required by Forminit)
        mappedFd.append('fi-sender-email', fd.get('email') || fd.get('name') || 'anon@example.com');

        // Submit to Forminit
        const { data, error } = await forminit.submit('nj6oxos4t5q', mappedFd);

        if (!error && data) {
            // Success - show message and reset form
            successMessage.textContent = 'Thank you! Your message has been sent successfully. We will contact you soon.';
            successMessage.style.display = 'block';
            successMessage.style.color = '#10b981';
            successMessage.classList.remove('error');

            errorMessage.style.display = 'none';
            errorMessage.classList.remove('show');

            form.reset();

            // Reset after 5 seconds
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 5000);
        } else {
            throw new Error(error?.message || ('data: ' + JSON.stringify(data)));
        }

    } catch (error) {
        console.error('Forminit error:', error);

        // Show error message
        errorMessage.textContent = 'Sorry, there was a problem sending your message. Please try again later.';
        errorMessage.style.display = 'block';
        errorMessage.style.color = '#ef4444';

        // Hide error after 5 seconds
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    } finally {
        isSubmitting = false;
        submitBtn.disabled = false;
    }
}

/**
 * Product inquiry buttons - Opens WhatsApp with product inquiry
 */
function initProductButtons() {
    const productButtons = document.querySelectorAll('[data-product]');
    const whatsappNumber = '919048922075'; // Your WhatsApp number

    productButtons.forEach(button => {
        button.addEventListener('click', () => {
            const product = button.getAttribute('data-product');
            const productName = product === 'chairs' ? 'Chairs' :
                               product === 'swing' ? 'Swings' :
                               product === 'table' ? 'Tables & Teapoys' :
                               product === 'decor' ? 'Home Décor' :
                               product === 'basket' ? 'Cane Baskets & Hampers' : product;

            const message = encodeURIComponent(`Hello, I'm interested in your ${productName} product. Could you please provide more information?`);
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

            window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        });
    });
}

/**
 * Initialize WhatsApp buttons
 */
function initWhatsAppButtons() {
    const whatsappBtn = document.querySelector('[href*="wa.me"]');
    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', () => {
            const message = encodeURIComponent('Hello, I would like to inquire about Fine Cane Works products. Could you please help me?');
            const whatsappNumber = '919048922075';
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
            window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        });
    }
}

/**
 * Update copyright year dynamically
 */
function updateCurrentYear() {
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

/**
 * Initialize lazy loading for images
 */
function initLazyLoading() {
    const images = document.querySelectorAll('img[loading="lazy"]');

    images.forEach(img => {
        img.loading = 'lazy';
    });
}

/**
 * Utility: Debounce function for performance
 */
function debounce(func, wait, immediate) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

/**
 * Utility: Check for reduced motion preference
 */
function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Utility: Get current scroll position
 */
function getScrollPosition() {
    return window.pageYOffset || document.documentElement.scrollTop;
}

/**
 * Utility: Smooth scroll to top
 */
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}