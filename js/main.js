// Moderno - Core Interactive Logic & Dynamic Views

// Global Themed Modal Alert Interceptor (Replaces default browser "localhost says" dialogs)
(function() {
    if (typeof window !== 'undefined') {
        const _nativeAlert = window.alert;
        window.alert = function(message) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: 'Notice',
                    text: String(message || ''),
                    icon: 'info',
                    confirmButtonColor: '#0052cc',
                    confirmButtonText: 'OK',
                    customClass: {
                        popup: 'moderno-swal-popup',
                        title: 'moderno-swal-title',
                        confirmButton: 'moderno-swal-confirm-btn'
                    }
                });
            } else {
                _nativeAlert(message);
            }
        };
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    initHeroSlider();
    initCategories();
    initProductCatalog();
    initExperienceCenters();
    initReviews();
    initFaqs();
    initSearch();
    initModals();
    initFloatingActions();
    initMobileNav();
    initPincodeChecker();
    initOfferBanner();
});

/* ==========================================================================
   1. HEADER & STICKY BEHAVIOR
   ========================================================================== */
function initHeader() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    let isScrolled = false;
    let ticking = false;

    function updateHeaderOnScroll() {
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        
        // Hysteresis deadband: activate smoothly at > 45px, restore when scrolling up to < 20px
        if (!isScrolled && scrollY > 45) {
            isScrolled = true;
            header.classList.add('scrolled');
        } else if (isScrolled && scrollY < 20) {
            isScrolled = false;
            header.classList.remove('scrolled');
        }
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateHeaderOnScroll);
            ticking = true;
        }
    }, { passive: true });

    // Initial check on load
    updateHeaderOnScroll();

    // Auto-scroll active category nav item into view on mobile
    const activeNavItem = document.querySelector('.header-nav .nav-item.active, .header-nav .nav-link.active');
    if (activeNavItem) {
        setTimeout(() => {
            activeNavItem.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }, 100);
    }
}

/* ==========================================================================
   2. HERO SLIDER CAROUSEL (SEAMLESS INFINITE FORWARD SLIDER)
   ========================================================================== */
let heroTrackIndex = 1;
let totalHeroSlides = 0;
let isHeroTransitioning = false;
let slideInterval = null;

function initHeroSlider() {
    const sliderContainer = document.getElementById('heroSliderContainer');
    const track = document.getElementById('heroSliderTrack');
    const dotsContainer = document.getElementById('heroSliderDots');
    if (!sliderContainer || !track) return;

    // Prevent double initialization
    if (track.getAttribute('data-slider-inited') === 'true') return;

    // If PHP didn't render slides, populate with JS fallback
    const existingSlides = track.querySelectorAll('.hero-slide');
    if (existingSlides.length === 0 && typeof HERO_SLIDES !== 'undefined' && HERO_SLIDES.length > 0) {
        track.innerHTML = HERO_SLIDES.map((slide, index) => `
            <div class="hero-slide ${index === 0 ? 'active' : ''}">
                <a href="${slide.href}" class="hero-slide-link">
                    <img src="${slide.image}" alt="${slide.alt || 'Moderno Banner'}" class="hero-slide-img" loading="${index === 0 ? 'eager' : 'lazy'}">
                </a>
            </div>
        `).join('');
    }

    const origSlides = Array.from(track.querySelectorAll('.hero-slide'));
    totalHeroSlides = origSlides.length;

    if (totalHeroSlides <= 1) {
        if (dotsContainer) dotsContainer.style.display = 'none';
        const prevBtn = document.getElementById('heroPrevBtn');
        const nextBtn = document.getElementById('heroNextBtn');
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        // Auto-play and loop video if only a single slide exists
        const singleVid = track.querySelector('video');
        if (singleVid) {
            singleVid.loop = true;
            singleVid.play().catch(() => {});
        }
        return;
    }

    track.setAttribute('data-slider-inited', 'true');

    // Build navigation dots for original slides
    if (dotsContainer) {
        dotsContainer.innerHTML = origSlides.map((_, index) => `
            <button class="slider-dot ${index === 0 ? 'active' : ''}" onclick="goToHeroSlide(${index})" aria-label="Go to slide ${index + 1}"></button>
        `).join('');
    }

    // Clone boundary slides for seamless infinite forward looping
    const firstClone = origSlides[0].cloneNode(true);
    const lastClone = origSlides[totalHeroSlides - 1].cloneNode(true);
    firstClone.classList.add('hero-slide-clone');
    lastClone.classList.add('hero-slide-clone');

    track.insertBefore(lastClone, origSlides[0]);
    track.appendChild(firstClone);

    // Initial position at real slide 0 (track index 1)
    heroTrackIndex = 1;
    track.style.transition = 'none';
    track.style.transform = `translateX(-100%)`;
    void track.offsetWidth; // Force layout recalculation
    track.style.transition = 'transform 0.65s cubic-bezier(0.25, 1, 0.5, 1)';

    // Seamless loop boundary reset on transition end
    track.addEventListener('transitionend', (e) => {
        if (e.target !== track || e.propertyName !== 'transform') return;
        isHeroTransitioning = false;

        // If advanced forward past the last original slide onto the clone of slide 0
        if (heroTrackIndex === totalHeroSlides + 1) {
            track.style.transition = 'none';
            heroTrackIndex = 1;
            track.style.transform = `translateX(-100%)`;
            void track.offsetWidth; // Force reflow
            track.style.transition = 'transform 0.65s cubic-bezier(0.25, 1, 0.5, 1)';
            updateHeroSlideStates(0);
        }
        // If stepped backwards before the first slide onto the clone of last slide
        else if (heroTrackIndex === 0) {
            track.style.transition = 'none';
            heroTrackIndex = totalHeroSlides;
            track.style.transform = `translateX(-${totalHeroSlides * 100}%)`;
            void track.offsetWidth; // Force reflow
            track.style.transition = 'transform 0.65s cubic-bezier(0.25, 1, 0.5, 1)';
            updateHeroSlideStates(totalHeroSlides - 1);
        }
    });

    // Controls
    const prevBtn = document.getElementById('heroPrevBtn');
    const nextBtn = document.getElementById('heroNextBtn');
    if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); });

    // Touch / Swipe support
    let touchStartX = 0;
    let touchEndX = 0;
    sliderContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        stopSlideTimer();
    }, { passive: true });

    sliderContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        if (touchStartX - touchEndX > 45) {
            nextSlide();
        } else if (touchEndX - touchStartX > 45) {
            prevSlide();
        }
    }, { passive: true });

    // Mouse pause on hover
    sliderContainer.addEventListener('mouseenter', stopSlideTimer);
    sliderContainer.addEventListener('mouseleave', () => {
        const allSlides = document.querySelectorAll('#heroSliderTrack .hero-slide');
        const currentSlideEl = allSlides[heroTrackIndex];
        if (currentSlideEl && !currentSlideEl.querySelector('video')) {
            startSlideTimer();
        }
    });

    // Initialize slide state and timer/video handlers
    updateHeroSlideStates(0);
}

function updateHeroSlideStates(realIndex) {
    const dots = document.querySelectorAll('#heroSliderDots .slider-dot');
    dots.forEach((dot, idx) => {
        if (idx === realIndex) dot.classList.add('active');
        else dot.classList.remove('active');
    });

    const allSlides = document.querySelectorAll('#heroSliderTrack .hero-slide');
    let hasActiveVideo = false;

    allSlides.forEach((slide, idx) => {
        const isCurrent = idx === heroTrackIndex;
        const video = slide.querySelector('video');

        if (isCurrent) {
            slide.classList.add('active');
            if (video) {
                hasActiveVideo = true;
                stopSlideTimer();

                // Ensure muted and inline playback for cross-device compatibility
                video.muted = true;
                video.defaultMuted = true;
                video.setAttribute('playsinline', '');
                video.setAttribute('webkit-playsinline', '');

                try {
                    video.currentTime = 0;
                } catch (e) {}

                video.onended = function() {
                    video.onended = null;
                    nextSlide();
                };
                video.onerror = function() {
                    startSlideTimer();
                };

                const playPromise = video.play();
                if (playPromise !== undefined) {
                    playPromise.catch(function() {
                        startSlideTimer();
                    });
                }
            }
        } else {
            slide.classList.remove('active');
            if (video) {
                video.onended = null;
                try {
                    video.pause();
                } catch (e) {}
            }
        }
    });

    // If current active slide is an image, start 5-second interval timer
    if (!hasActiveVideo) {
        startSlideTimer();
    }
}

function startSlideTimer() {
    stopSlideTimer();
    slideInterval = setInterval(nextSlide, 5000);
}

function stopSlideTimer() {
    if (slideInterval) {
        clearInterval(slideInterval);
        slideInterval = null;
    }
}

function nextSlide() {
    if (isHeroTransitioning || totalHeroSlides <= 1) return;
    const track = document.getElementById('heroSliderTrack');
    if (!track) return;

    isHeroTransitioning = true;
    heroTrackIndex++;
    track.style.transition = 'transform 0.65s cubic-bezier(0.25, 1, 0.5, 1)';
    track.style.transform = `translateX(-${heroTrackIndex * 100}%)`;

    let realIndex = (heroTrackIndex - 1) % totalHeroSlides;
    if (realIndex < 0) realIndex += totalHeroSlides;
    updateHeroSlideStates(realIndex);

    // Fallback in case transitionend is skipped by browser throttling
    setTimeout(() => {
        if (isHeroTransitioning) {
            isHeroTransitioning = false;
            if (heroTrackIndex === totalHeroSlides + 1) {
                track.style.transition = 'none';
                heroTrackIndex = 1;
                track.style.transform = `translateX(-100%)`;
                void track.offsetWidth;
                track.style.transition = 'transform 0.65s cubic-bezier(0.25, 1, 0.5, 1)';
                updateHeroSlideStates(0);
            } else if (heroTrackIndex === 0) {
                track.style.transition = 'none';
                heroTrackIndex = totalHeroSlides;
                track.style.transform = `translateX(-${totalHeroSlides * 100}%)`;
                void track.offsetWidth;
                track.style.transition = 'transform 0.65s cubic-bezier(0.25, 1, 0.5, 1)';
                updateHeroSlideStates(totalHeroSlides - 1);
            }
        }
    }, 720);
}

function prevSlide() {
    if (isHeroTransitioning || totalHeroSlides <= 1) return;
    const track = document.getElementById('heroSliderTrack');
    if (!track) return;

    isHeroTransitioning = true;
    heroTrackIndex--;
    track.style.transition = 'transform 0.65s cubic-bezier(0.25, 1, 0.5, 1)';
    track.style.transform = `translateX(-${heroTrackIndex * 100}%)`;

    let realIndex = (heroTrackIndex - 1) % totalHeroSlides;
    if (realIndex < 0) realIndex += totalHeroSlides;
    updateHeroSlideStates(realIndex);

    setTimeout(() => {
        if (isHeroTransitioning) {
            isHeroTransitioning = false;
            if (heroTrackIndex === totalHeroSlides + 1) {
                track.style.transition = 'none';
                heroTrackIndex = 1;
                track.style.transform = `translateX(-100%)`;
                void track.offsetWidth;
                track.style.transition = 'transform 0.65s cubic-bezier(0.25, 1, 0.5, 1)';
                updateHeroSlideStates(0);
            } else if (heroTrackIndex === 0) {
                track.style.transition = 'none';
                heroTrackIndex = totalHeroSlides;
                track.style.transform = `translateX(-${totalHeroSlides * 100}%)`;
                void track.offsetWidth;
                track.style.transition = 'transform 0.65s cubic-bezier(0.25, 1, 0.5, 1)';
                updateHeroSlideStates(totalHeroSlides - 1);
            }
        }
    }, 720);
}

function goToHeroSlide(realIndex) {
    if (isHeroTransitioning || totalHeroSlides <= 1) return;
    const track = document.getElementById('heroSliderTrack');
    if (!track) return;

    isHeroTransitioning = true;
    heroTrackIndex = realIndex + 1;
    track.style.transition = 'transform 0.65s cubic-bezier(0.25, 1, 0.5, 1)';
    track.style.transform = `translateX(-${heroTrackIndex * 100}%)`;
    updateHeroSlideStates(realIndex);

    setTimeout(() => { isHeroTransitioning = false; }, 720);
}

// Backward-compatible alias
function goToSlide(index) {
    goToHeroSlide(index);
}

/* ==========================================================================
   3. SHOP BY CATEGORY STRIP
   ========================================================================== */
function cleanMediaUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    if (url.startsWith('api/images')) return url;
    return url.replace(/^\/?(modernov[12]\/)+/i, '').replace(/^\/+/, '');
}

window.scrollCategoriesSlider = function(direction) {
    const container = document.getElementById('categorySliderContainer');
    if (!container) return;
    const scrollAmount = container.clientWidth * 0.75 * direction;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
};

async function initCategories() {
    const container = document.getElementById('categoryGridContainer');
    const pillsBar = document.getElementById('categoryPillsBar');
    if (!container) return;

    try {
        const response = await fetch('api/categories.php?homepage=1');
        const result = await response.json();
        
        if (result.status === 'success' && result.data) {
            const categories = result.data;
            
            // Helper function to render cards for a selected category
            function renderCategoryCards(selectedCat) {
                if (!selectedCat) {
                    container.innerHTML = '';
                    return;
                }

                const isDealTab = (selectedCat.slug === 'one-time-deal' || 
                                   selectedCat.slug === 'deals' || 
                                   (selectedCat.name || '').toLowerCase().includes('deal'));

                let cardsToDisplay = [];

                if (isDealTab) {
                    // For "One Time Deal", display ONLY ALL MAIN (parent) CATEGORIES (no subcategories)
                    const mainCategories = categories.filter(c => {
                        const s = (c.slug || '').toLowerCase();
                        const n = (c.name || '').toLowerCase();
                        return s !== 'one-time-deal' && s !== 'deals' && !n.includes('deal');
                    });

                    cardsToDisplay = mainCategories.map(cat => {
                        const catSlug = cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                        return {
                            id: cat.id,
                            name: cat.name,
                            slug: catSlug,
                            imageUrl: cleanMediaUrl(cat.image_url) || 'https://via.placeholder.com/150',
                            linkUrl: `shop?category=${encodeURIComponent(catSlug)}`
                        };
                    });
                } else {
                    // For specific categories, check if it has subcategories (children)
                    const hasChildren = selectedCat.children && Array.isArray(selectedCat.children) && selectedCat.children.length > 0;
                    
                    if (hasChildren) {
                        // Display ALL subcategories for this category
                        cardsToDisplay = selectedCat.children.map(child => {
                            const childSlug = child.slug || child.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                            const childImg = cleanMediaUrl(child.image_url) || cleanMediaUrl(selectedCat.image_url) || 'https://via.placeholder.com/150';
                            return {
                                id: child.id,
                                name: child.name,
                                slug: childSlug,
                                imageUrl: childImg,
                                linkUrl: `shop?category=${encodeURIComponent(childSlug)}`
                            };
                        });
                    } else {
                        // Display the category itself if no subcategories exist
                        const catSlug = selectedCat.slug || selectedCat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                        cardsToDisplay = [{
                            id: selectedCat.id,
                            name: selectedCat.name,
                            slug: catSlug,
                            imageUrl: cleanMediaUrl(selectedCat.image_url) || 'https://via.placeholder.com/150',
                            linkUrl: `shop?category=${encodeURIComponent(catSlug)}`
                        }];
                    }
                }

                container.innerHTML = cardsToDisplay.map(item => `
                    <a href="${item.linkUrl}" class="category-card group" data-category="${item.id}" data-slug="${item.slug}">
                        <div class="category-card-img-box">
                            <img src="${item.imageUrl}" alt="${item.name}" loading="lazy">
                        </div>
                        <div class="category-card-info">
                            <span class="category-card-title">${item.name}</span>
                            <span class="category-card-link-text">
                                Explore
                                <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
                            </span>
                        </div>
                    </a>
                `).join('');

                // Reset horizontal scroll position
                const sliderContainer = document.getElementById('categorySliderContainer');
                if (sliderContainer) {
                    sliderContainer.scrollTo({ left: 0, behavior: 'smooth' });
                }

                // Toggle Carousel Side Buttons:
                // On Mobile (<= 768px): only show if more than 2 categories (3 or more)
                // On Desktop/Tablet (> 768px): only show if more than 7 categories (8 or more)
                const prevBtn = document.getElementById('categoriesPrevBtn');
                const nextBtn = document.getElementById('categoriesNextBtn');
                const isMobile = window.innerWidth <= 768;
                const threshold = isMobile ? 2 : 7;

                if (cardsToDisplay.length > threshold) {
                    if (prevBtn) prevBtn.style.display = 'flex';
                    if (nextBtn) nextBtn.style.display = 'flex';
                    container.classList.remove('grid-fit');
                } else {
                    if (prevBtn) prevBtn.style.display = 'none';
                    if (nextBtn) nextBtn.style.display = 'none';
                    container.classList.add('grid-fit');
                }

                // Handle screen resize dynamically
                window.onresizeCategoryCarousel = function() {
                    const isMob = window.innerWidth <= 768;
                    const th = isMob ? 2 : 7;
                    if (cardsToDisplay.length > th) {
                        if (prevBtn) prevBtn.style.display = 'flex';
                        if (nextBtn) nextBtn.style.display = 'flex';
                        container.classList.remove('grid-fit');
                    } else {
                        if (prevBtn) prevBtn.style.display = 'none';
                        if (nextBtn) nextBtn.style.display = 'none';
                        container.classList.add('grid-fit');
                    }
                };
                window.removeEventListener('resize', window.onresizeCategoryCarousel);
                window.addEventListener('resize', window.onresizeCategoryCarousel);
            }

            // Populate Quick Filter Pills
            if (pillsBar && categories.length > 0) {
                pillsBar.innerHTML = categories.map((cat, index) => {
                    const slug = cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                    const activeClass = index === 0 ? 'active' : '';
                    return `<button class="cat-pill-btn ${activeClass}" data-id="${cat.id}" data-filter="${slug}">${cat.name}</button>`;
                }).join('');
                
                // Initial render with first category
                renderCategoryCards(categories[0]);

                // Quick Filter Pills Click Handlers
                const pillButtons = pillsBar.querySelectorAll('.cat-pill-btn');
                pillButtons.forEach(btn => {
                    btn.addEventListener('click', function () {
                        const catId = this.getAttribute('data-id');
                        const filterSlug = this.getAttribute('data-filter');
                        
                        pillButtons.forEach(b => b.classList.remove('active'));
                        this.classList.add('active');
                        
                        // Find matching category object
                        const selectedCat = categories.find(c => String(c.id) === String(catId) || c.slug === filterSlug);
                        if (selectedCat) {
                            renderCategoryCards(selectedCat);
                        }
                    });
                });
            } else if (categories.length > 0) {
                renderCategoryCards(categories[0]);
            }
        }
    } catch (e) {
        console.error('Failed to load categories', e);
    }
}

/* ==========================================================================
   4. PRODUCT CATALOG & FILTERABLE TABS
   ========================================================================== */
let activeCategoryFilter = 'all';

function initProductCatalog() {
    const container = document.getElementById('featuredProductsGrid');
    const filterTabsContainer = document.getElementById('productFilterTabs');
    if (!container) return;

    // Fetch categories dynamically from DB and build filter tabs
    if (filterTabsContainer) {
        filterTabsContainer.innerHTML = '<span style="font-size:0.85rem;color:var(--text-muted);">Loading categories...</span>';

        fetch('api/categories.php?only_parents=1&homepage=1', { credentials: 'same-origin' })
            .then(res => res.json())
            .then(data => {
                // API returns { status: 'success', data: [...] } for only_parents=1
                const categories = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);

                // Build tabs: All Products first, then each DB category
                const tabs = [{ id: 'all', label: 'All Products' }];
                categories.forEach(cat => {
                    tabs.push({
                        id: cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
                        label: cat.name,
                        dbId: cat.id
                    });
                });

                filterTabsContainer.innerHTML = tabs.map(tab => {
                    const count = getProductCountForTab(tab.id);
                    return `<button class="filter-tab-btn ${tab.id === 'all' ? 'active' : ''}" onclick="filterProducts('${tab.id}', this)">${tab.label} <span class="filter-tab-count">(${count})</span></button>`;
                }).join('');

                renderProductsGrid();
                updateTabArrows();
            })
            .catch(() => {
                // Fallback: render all products if API fails
                const total = typeof PRODUCTS !== 'undefined' ? PRODUCTS.length : 0;
                filterTabsContainer.innerHTML = `<button class="filter-tab-btn active" onclick="filterProducts('all', this)">All Products <span class="filter-tab-count">(${total})</span></button>`;
                renderProductsGrid();
                updateTabArrows();
            });

        const tabsCont = document.getElementById('tabsCarouselContainer') || document.querySelector('.products-filter-carousel-container');
        if (tabsCont) {
            tabsCont.addEventListener('scroll', updateTabArrows);
            window.addEventListener('resize', updateTabArrows);
        }

        const prodCont = document.getElementById('featuredProductsContainer');
        if (prodCont && !prodCont.dataset.arrowListenerAttached) {
            prodCont.dataset.arrowListenerAttached = 'true';
            prodCont.addEventListener('scroll', updateProductSliderArrows, { passive: true });
            window.addEventListener('resize', updateProductSliderArrows, { passive: true });
        }
    } else {
        renderProductsGrid();
        const prodCont = document.getElementById('featuredProductsContainer');
        if (prodCont && !prodCont.dataset.arrowListenerAttached) {
            prodCont.dataset.arrowListenerAttached = 'true';
            prodCont.addEventListener('scroll', updateProductSliderArrows, { passive: true });
            window.addEventListener('resize', updateProductSliderArrows, { passive: true });
        }
    }
}

/**
 * Count products that match a given filter tab slug.
 * A product matches if:
 *   - its categorySlug equals the tab slug (product is directly in a parent category)
 *   - its parentSlug equals the tab slug (product is in a child category of that parent)
 */
function getProductCountForTab(tabId) {
    if (typeof PRODUCTS === 'undefined') return 0;
    if (tabId === 'all') return PRODUCTS.length;
    const filterLower = tabId.toLowerCase();
    return PRODUCTS.filter(p => {
        const catSlug    = (p.categorySlug || '').toLowerCase();
        const parentSlug = (p.parentSlug   || '').toLowerCase();
        return catSlug === filterLower || parentSlug === filterLower;
    }).length;
}

function filterProducts(categoryId, btnElement) {
    activeCategoryFilter = categoryId;
    document.querySelectorAll('.filter-tab-btn').forEach(btn => btn.classList.remove('active'));
    if (btnElement) {
        btnElement.classList.add('active');
        btnElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
    renderProductsGrid();
}

function scrollProductsSlider(direction) {
    const container = document.getElementById('featuredProductsContainer');
    if (!container) return;
    const card = container.querySelector('.product-card');
    const scrollAmount = card ? (card.offsetWidth + 16) * direction : (container.clientWidth * 0.8 * direction);
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    setTimeout(updateProductSliderArrows, 350);
}

function updateProductSliderArrows() {
    const container = document.getElementById('featuredProductsContainer');
    const prevBtn = document.getElementById('prodPrevBtn');
    const nextBtn = document.getElementById('prodNextBtn');
    if (!container) return;

    const hasOverflow = container.scrollWidth > container.clientWidth + 5;
    
    // Left arrow: only display if there are products to the left (scrollLeft > 10)
    if (prevBtn) {
        const canScrollLeft = hasOverflow && container.scrollLeft > 10;
        prevBtn.style.display = canScrollLeft ? 'flex' : 'none';
    }

    // Right arrow: only display if there are products to the right
    if (nextBtn) {
        const canScrollRight = hasOverflow && (container.scrollLeft + container.clientWidth < container.scrollWidth - 10);
        nextBtn.style.display = canScrollRight ? 'flex' : 'none';
    }
}

window.scrollTabsSlider = function(direction) {
    const container = document.getElementById('tabsCarouselContainer') || document.querySelector('.products-filter-carousel-container');
    if (!container) return;
    const scrollAmount = Math.max(180, Math.floor(container.clientWidth * 0.6)) * direction;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    setTimeout(updateTabArrows, 350);
};

function updateTabArrows() {
    const container = document.getElementById('tabsCarouselContainer') || document.querySelector('.products-filter-carousel-container');
    const prevBtn = document.getElementById('tabPrevBtn');
    const nextBtn = document.getElementById('tabNextBtn');
    if (!container) return;

    const hasOverflow = container.scrollWidth > container.clientWidth + 5;
    
    // Left arrow: only display if there are tabs to the left (scrollLeft > 10)
    if (prevBtn) {
        const canScrollLeft = hasOverflow && container.scrollLeft > 10;
        prevBtn.style.display = canScrollLeft ? 'flex' : 'none';
    }

    // Right arrow: only display if there are tabs to the right
    if (nextBtn) {
        const canScrollRight = hasOverflow && (container.scrollLeft + container.clientWidth < container.scrollWidth - 10);
        nextBtn.style.display = canScrollRight ? 'flex' : 'none';
    }
}

function getRatingStarsHtml(rating) {
    const r = Math.max(0, Math.min(5, parseFloat(rating) || 0));
    const fullStars = Math.floor(r);
    const remainder = r - fullStars;
    const hasHalf = remainder >= 0.25 && remainder < 0.75;
    const extraFull = remainder >= 0.75 ? 1 : 0;
    const finalFull = fullStars + extraFull;
    
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= finalFull) {
            html += '<i class="fa-solid fa-star"></i>';
        } else if (i === finalFull + 1 && hasHalf) {
            html += '<i class="fa-solid fa-star-half-stroke"></i>';
        } else {
            html += '<i class="fa-regular fa-star"></i>';
        }
    }
    return html;
}
window.getRatingStarsHtml = getRatingStarsHtml;

function renderProductsGrid() {
    const container = document.getElementById('featuredProductsGrid');
    if (!container) return;

    const filtered = activeCategoryFilter === 'all'
        ? PRODUCTS
        : PRODUCTS.filter(p => {
            const filterLower = activeCategoryFilter.toLowerCase();
            const catSlug    = (p.categorySlug || '').toLowerCase();
            const parentSlug = (p.parentSlug   || '').toLowerCase();
            return catSlug === filterLower || parentSlug === filterLower;
        });

    const prevBtn = document.getElementById('prodPrevBtn');
    const nextBtn = document.getElementById('prodNextBtn');
    const sliderContainer = document.getElementById('featuredProductsContainer');

    if (filtered.length === 0) {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align:center; padding:3rem 0; color:var(--text-muted);">
                <p>No products found in this category currently. Check back soon!</p>
            </div>
        `;
        return;
    }

    const isMobile = window.innerWidth <= 768;
    const isSliderActive = isMobile ? filtered.length > 1 : filtered.length > 4;
    if (sliderContainer) {
        sliderContainer.scrollLeft = 0;
        sliderContainer.style.overflowX = isSliderActive ? 'auto' : 'hidden';
    }

    container.innerHTML = filtered.map(prod => {
        let discountText = '';
        if (prod.discount) {
            const d = prod.discount.toString().trim();
            discountText = d.toLowerCase().includes('off') ? d.toLowerCase() : (d.endsWith('%') ? `${d.toLowerCase()} off` : `${d}% off`);
        } else if (prod.originalPrice && prod.originalPrice > prod.price) {
            discountText = `${Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100)}% off`;
        }

        const subtitle = prod.shortDescription || prod.short_description || prod.categoryName || 'Solid Wood Furniture';
        const revCount = (prod.reviewsCount !== undefined && prod.reviewsCount !== null) ? prod.reviewsCount : (prod.review_count || 0);

        return `
        <div class="product-card">
            <div class="product-image-box">
                <a href="product-detail?id=${prod.id}" class="product-img-link" aria-label="${prod.name}">
                    <img src="${prod.image}" alt="${prod.name}" loading="lazy">
                </a>
                <button class="product-wishlist-btn ${cartManager.isInWishlist(prod.id) ? 'active' : ''}" 
                        data-product-id="${prod.id}" 
                        onclick="cartManager.toggleWishlist('${prod.id}')" 
                        title="Add to Wishlist"
                        aria-label="Add to Wishlist">
                    <i class="fa-solid fa-heart"></i>
                </button>
                <div class="product-card-quick-actions">
                    <button type="button" class="btn-quick-cart" onclick="cartManager.addToCart('${prod.id}')" title="Add to Cart">
                        <i class="fa-solid fa-bag-shopping"></i> <span>Add to Cart</span>
                    </button>
                    <a href="product-detail?id=${prod.id}" class="btn-quick-view" title="Quick View" aria-label="Quick View">
                        <i class="fa-regular fa-eye"></i>
                    </a>
                </div>
            </div>
            <div class="product-details">
                <h3 class="product-title">
                    <a href="product-detail?id=${prod.id}">${prod.name}</a>
                </h3>
                <div class="product-subtitle" title="${subtitle}">${subtitle}</div>
                <div class="product-price-row">
                    <span class="product-current-price">₹${prod.price.toLocaleString('en-IN')}</span>
                    ${prod.originalPrice ? `<span class="product-original-price">₹${prod.originalPrice.toLocaleString('en-IN')}</span>` : ''}
                    ${discountText ? `<span class="product-discount-tag">${discountText}</span>` : ''}
                </div>
                <div class="product-rating-row">
                    <span class="rating-stars">${getRatingStarsHtml(prod.rating)}</span>
                    <span class="rating-count">${revCount} Reviews</span>
                </div>
            </div>
        </div>
        `;
    }).join('');

    setTimeout(updateProductSliderArrows, 50);
}

/* ==========================================================================
   5. EXPERIENCE CENTERS / STORES SECTION
   ========================================================================== */
function initExperienceCenters() {
    const container = document.getElementById('experienceCentersGrid');
    if (!container) return;

    const centers = typeof EXPERIENCE_CENTERS !== 'undefined' ? EXPERIENCE_CENTERS : (typeof STORES !== 'undefined' ? STORES : []);
    container.innerHTML = centers.slice(0, 6).map(store => `
        <div class="store-card">
            <div class="store-image">
                <img src="${store.image}" alt="${store.name}" loading="lazy">
                <span class="store-city-badge">${store.city}</span>
            </div>
            <div class="store-content">
                <h3 class="store-name">${store.name}</h3>
                <div class="store-info-row">
                    <i class="fa-solid fa-location-dot" style="color:var(--primary); font-size:0.9rem; flex-shrink:0;"></i>
                    <span>${store.address}</span>
                </div>
                <div class="store-info-row">
                    <i class="fa-solid fa-clock" style="color:var(--primary); font-size:0.9rem; flex-shrink:0;"></i>
                    <span>${store.timing}</span>
                </div>
                <div class="store-amenities">
                    ${store.amenities.map(a => `<span class="amenity-chip">${a}</span>`).join('')}
                </div>
                <div class="store-actions">
                    <a href="${store.mapUrl}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">
                        <i class="fa-solid fa-diamond-turn-right" style="margin-right:4px;"></i> Get Directions
                    </a>
                    <button class="btn btn-primary btn-sm" onclick="openAppointmentModal('${store.name}')">
                        <i class="fa-solid fa-calendar-check" style="margin-right:4px;"></i> Book Visit
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

/* ==========================================================================
   6. CUSTOMER REVIEWS (VOICES OF SATISFACTION) & DYNAMIC AUTO CAROUSEL
   ========================================================================== */
let testimonialAutoTimer = null;
let currentTestimonialIndex = 0;
let isTouchingTestimonial = false;

function escapeReviewText(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function initReviews() {
    const container = document.getElementById('testimonialsGrid');
    const dotsContainer = document.getElementById('testimonialSliderDots');
    const prevBtn = document.getElementById('testimonialPrevBtn');
    const nextBtn = document.getElementById('testimonialNextBtn');
    const section = document.getElementById('testimonialsSection');
    if (!container) return;

    const list = (typeof REVIEWS !== 'undefined' && Array.isArray(REVIEWS)) ? REVIEWS : [];

    if (list.length === 0) {
        if (section) section.style.display = 'none';
        return;
    }
    if (section) section.style.display = '';

    const isCarousel = list.length > 4;

    if (isCarousel) {
        container.classList.add('is-carousel');
    } else {
        container.classList.remove('is-carousel');
        container.style.transform = 'none';
    }

    container.innerHTML = list.map((r, idx) => {
        const rating = Math.min(5, Math.max(1, parseInt(r.rating) || 5));
        const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
        const tag = r.tag || r.date || 'Verified Buyer';
        const productHtml = r.product ? `<div class="testimonial-footer"><i class="fa-solid fa-bag-shopping" style="margin-right:4px;"></i> Purchased: ${escapeReviewText(r.product)}</div>` : '';
        const avatarImg = r.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

        return `
            <div class="testimonial-card" data-index="${idx}">
                <div class="testimonial-header">
                    <img src="${avatarImg}" alt="${escapeReviewText(r.author)}" class="testimonial-avatar" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'">
                    <div>
                        <div class="testimonial-author">${escapeReviewText(r.author)}</div>
                        <div class="testimonial-city">${escapeReviewText(r.city || 'Bangalore')} • <span class="verified-tag">${escapeReviewText(tag)}</span></div>
                    </div>
                </div>
                <div class="rating-stars" style="margin-bottom:0.75rem; color:#f59e0b; font-size:1rem;">${stars}</div>
                <p class="testimonial-quote">"${escapeReviewText(r.text)}"</p>
                ${productHtml}
            </div>
        `;
    }).join('');

    if (prevBtn) prevBtn.style.display = isCarousel ? 'flex' : 'none';
    if (nextBtn) nextBtn.style.display = isCarousel ? 'flex' : 'none';

    if (dotsContainer) {
        if (isCarousel || window.innerWidth <= 768) {
            dotsContainer.style.display = 'flex';
            dotsContainer.innerHTML = list.map((_, i) => `
                <button class="testimonial-dot ${i === 0 ? 'active' : ''}" onclick="goToTestimonialSlide(${i})" aria-label="Slide ${i + 1}"></button>
            `).join('');
        } else {
            dotsContainer.style.display = 'none';
            dotsContainer.innerHTML = '';
        }
    }

    currentTestimonialIndex = 0;
    setupTestimonialAutoSlider(container, isCarousel, list.length);
}

function getTestimonialScrollStep(container) {
    const firstCard = container.querySelector('.testimonial-card');
    if (!firstCard) return 300;
    const style = window.getComputedStyle(container);
    const gap = parseFloat(style.gap) || 24;
    return firstCard.offsetWidth + gap;
}

window.scrollTestimonialsSlider = function(direction) {
    const container = document.getElementById('testimonialsGrid');
    if (!container) return;
    const list = (typeof REVIEWS !== 'undefined' && Array.isArray(REVIEWS)) ? REVIEWS : [];
    const total = list.length;
    if (total === 0) return;

    if (window.innerWidth <= 768 && !container.classList.contains('is-carousel')) {
        goToTestimonialSlide(currentTestimonialIndex + direction);
        return;
    }

    if (container.classList.contains('is-carousel')) {
        const step = getTestimonialScrollStep(container);
        const maxScroll = container.scrollWidth - container.clientWidth;

        if (direction > 0) {
            if (container.scrollLeft >= maxScroll - 20) {
                container.scrollTo({ left: 0, behavior: 'smooth' });
                currentTestimonialIndex = 0;
            } else {
                container.scrollBy({ left: step, behavior: 'smooth' });
                currentTestimonialIndex = Math.min(total - 1, currentTestimonialIndex + 1);
            }
        } else {
            if (container.scrollLeft <= 20) {
                container.scrollTo({ left: maxScroll, behavior: 'smooth' });
                currentTestimonialIndex = total - 1;
            } else {
                container.scrollBy({ left: -step, behavior: 'smooth' });
                currentTestimonialIndex = Math.max(0, currentTestimonialIndex - 1);
            }
        }
        updateTestimonialDots(currentTestimonialIndex);
    } else {
        goToTestimonialSlide(currentTestimonialIndex + direction);
    }
};

window.goToTestimonialSlide = function(index) {
    const container = document.getElementById('testimonialsGrid');
    if (!container) return;
    const list = (typeof REVIEWS !== 'undefined' && Array.isArray(REVIEWS)) ? REVIEWS : [];
    const total = list.length;
    if (total === 0) return;

    currentTestimonialIndex = (index + total) % total;

    if (container.classList.contains('is-carousel')) {
        const step = getTestimonialScrollStep(container);
        const targetScroll = currentTestimonialIndex * step;
        const maxScroll = container.scrollWidth - container.clientWidth;
        container.scrollTo({ left: Math.min(targetScroll, maxScroll), behavior: 'smooth' });
    } else if (window.innerWidth <= 768) {
        container.style.transform = `translateX(-${currentTestimonialIndex * 100}%)`;
    } else {
        container.style.transform = 'none';
    }

    updateTestimonialDots(currentTestimonialIndex);
};

function updateTestimonialDots(index) {
    const dots = document.querySelectorAll('.testimonial-dot');
    dots.forEach((d, i) => {
        d.classList.toggle('active', i === index);
    });
}

function setupTestimonialAutoSlider(container, isCarousel, total) {
    if (testimonialAutoTimer) {
        clearInterval(testimonialAutoTimer);
        testimonialAutoTimer = null;
    }

    function shouldAutoPlay() {
        if (isCarousel) return true;
        if (window.innerWidth <= 768 && total > 1) return true;
        return false;
    }

    function startTimer() {
        if (testimonialAutoTimer) clearInterval(testimonialAutoTimer);
        testimonialAutoTimer = setInterval(() => {
            if (shouldAutoPlay() && !isTouchingTestimonial) {
                if (container.classList.contains('is-carousel')) {
                    scrollTestimonialsSlider(1);
                } else if (window.innerWidth <= 768) {
                    goToTestimonialSlide(currentTestimonialIndex + 1);
                }
            }
        }, 3500);
    }

    startTimer();

    // Mouse pause on hover
    const wrapper = document.getElementById('testimonialsSliderWrapper') || container;
    wrapper.addEventListener('mouseenter', () => { isTouchingTestimonial = true; });
    wrapper.addEventListener('mouseleave', () => { isTouchingTestimonial = false; });

    // Touch events for mobile
    let startX = 0;
    let currentX = 0;
    let isSwiping = false;

    container.addEventListener('touchstart', (e) => {
        isTouchingTestimonial = true;
        isSwiping = true;
        startX = e.touches[0].clientX;
        currentX = startX;
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;
        currentX = e.touches[0].clientX;
    }, { passive: true });

    container.addEventListener('touchend', () => {
        if (!isSwiping) return;
        isSwiping = false;
        const diffX = startX - currentX;
        if (diffX > 40) {
            if (container.classList.contains('is-carousel')) {
                scrollTestimonialsSlider(1);
            } else {
                goToTestimonialSlide(currentTestimonialIndex + 1);
            }
        } else if (diffX < -40) {
            if (container.classList.contains('is-carousel')) {
                scrollTestimonialsSlider(-1);
            } else {
                goToTestimonialSlide(currentTestimonialIndex - 1);
            }
        }
        setTimeout(() => {
            isTouchingTestimonial = false;
        }, 800);
    });

    if (container.classList.contains('is-carousel')) {
        let scrollTimeout;
        container.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const step = getTestimonialScrollStep(container);
                if (step > 0) {
                    const activeIdx = Math.round(container.scrollLeft / step);
                    currentTestimonialIndex = Math.min(total - 1, Math.max(0, activeIdx));
                    updateTestimonialDots(currentTestimonialIndex);
                }
            }, 100);
        }, { passive: true });
    }

    window.addEventListener('resize', () => {
        const dotsContainer = document.getElementById('testimonialSliderDots');
        if (isCarousel || window.innerWidth <= 768) {
            if (dotsContainer) dotsContainer.style.display = 'flex';
        } else {
            if (dotsContainer) dotsContainer.style.display = 'none';
        }

        if (!container.classList.contains('is-carousel')) {
            if (window.innerWidth > 768) {
                container.style.transform = 'none';
            } else {
                container.style.transform = `translateX(-${currentTestimonialIndex * 100}%)`;
            }
        }
    });
}

/* ==========================================================================
   7. FAQS ACCORDION (100% DYNAMIC FROM DATABASE / API)
   ========================================================================== */
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function initFaqs() {
    const container = document.getElementById('faqsAccordionContainer');
    const mainSection = document.getElementById('faqsMainSection');
    if (!container) return;

    try {
        const res = await fetch('api/faqs.php');
        if (!res.ok) throw new Error('API request failed');
        const json = await res.json();

        if (json.status === 'success' && Array.isArray(json.data) && json.data.length > 0) {
            container.innerHTML = json.data.map((faq, index) => `
                <div class="faq-item ${index === 0 ? 'active' : ''}">
                    <button type="button" class="faq-question" onclick="toggleFaq(this)" aria-expanded="${index === 0 ? 'true' : 'false'}">
                        <span class="faq-question-text">${escapeHtml(faq.question)}</span>
                        <span class="faq-icon-pill">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </span>
                    </button>
                    <div class="faq-answer">
                        <div class="faq-answer-inner">
                            <p>${escapeHtml(faq.answer).replace(/\n/g, '<br>')}</p>
                        </div>
                    </div>
                </div>
            `).join('');
            if (mainSection) mainSection.style.display = 'block';
        } else {
            if (mainSection) {
                mainSection.style.display = 'none';
            } else {
                container.innerHTML = '<div style="text-align:center; color:#94a3b8; padding:2rem;">No active FAQs found.</div>';
            }
        }
    } catch (err) {
        console.warn('Failed to load dynamic FAQs:', err);
        if (typeof FAQS !== 'undefined' && FAQS.length > 0) {
            container.innerHTML = FAQS.map((faq, index) => `
                <div class="faq-item ${index === 0 ? 'active' : ''}">
                    <button type="button" class="faq-question" onclick="toggleFaq(this)" aria-expanded="${index === 0 ? 'true' : 'false'}">
                        <span class="faq-question-text">${escapeHtml(faq.q)}</span>
                        <span class="faq-icon-pill">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </span>
                    </button>
                    <div class="faq-answer">
                        <div class="faq-answer-inner">
                            <p>${escapeHtml(faq.a)}</p>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }
}

function toggleFaq(btn) {
    const item = btn.closest('.faq-item');
    const wasActive = item.classList.contains('active');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
    if (!wasActive) {
        item.classList.add('active');
    }
}

/* ==========================================================================
   8. LIVE SEARCH AUTO-COMPLETE
   ========================================================================== */
function initSearch() {
    const searchInputs = document.querySelectorAll('.search-input');
    if (!searchInputs.length) return;

    searchInputs.forEach(input => {
        const container = input.closest('.mobile-search-inner-box') || input.closest('.nav-search-pill-box') || input.closest('.header-search-inner') || input.closest('.header-search') || input.parentElement;
        let dropdown = container ? container.querySelector('.search-dropdown') : null;
        if (!dropdown) dropdown = document.getElementById('mobileSearchDropdown') || document.getElementById('headerSearchDropdown') || document.getElementById('navSearchDropdown');
        if (!dropdown) return;

        input.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            if (query.length < 2) {
                dropdown.classList.remove('active');
                return;
            }

            const prods = (typeof PRODUCTS !== 'undefined' && Array.isArray(PRODUCTS)) ? PRODUCTS : [];
            const results = prods.filter(p =>
                (p.name && p.name.toLowerCase().includes(query)) ||
                (p.categoryName && p.categoryName.toLowerCase().includes(query)) ||
                (p.material && p.material.toLowerCase().includes(query))
            ).slice(0, 5);

            if (results.length > 0) {
                dropdown.innerHTML = `
                    <div class="search-category-title">Matching Products (${results.length})</div>
                    ${results.map(r => `
                        <a href="product-detail?id=${r.id}" class="search-result-item">
                            <img src="${r.image}" alt="${r.name}">
                            <div class="search-result-info">
                                <div class="search-result-name">${r.name}</div>
                                <div class="search-result-price">₹${r.price.toLocaleString('en-IN')}</div>
                            </div>
                        </a>
                    `).join('')}
                    <div style="margin-top:0.75rem; text-align:center;">
                        <a href="shop?search=${encodeURIComponent(query)}" class="btn btn-outline-primary btn-sm btn-block">View All Results</a>
                    </div>
                `;
                dropdown.classList.add('active');
            } else {
                dropdown.innerHTML = `
                    <div style="text-align:center; padding:1rem; color:var(--text-muted); font-size:0.875rem;">
                        No furniture found for "<strong>${query}</strong>". Try searching "Sofa", "Bed", or "Dining".
                    </div>
                `;
                dropdown.classList.add('active');
            }
        });
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.mobile-search-inner-box') && !e.target.closest('.header-search-inner') && !e.target.closest('.nav-search-pill-box') && !e.target.closest('.header-search')) {
            document.querySelectorAll('.search-dropdown').forEach(d => d.classList.remove('active'));
        }
    });
}

/* ==========================================================================
   9. QUICK VIEW & BOOKING MODALS
   ========================================================================== */
function initModals() {
    const modalOverlays = document.querySelectorAll('.modal-overlay');
    modalOverlays.forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModals();
            }
        });
    });

    // Appointment Form
    const apptForm = document.getElementById('appointmentForm');
    if (apptForm) {
        apptForm.addEventListener('submit', (e) => {
            e.preventDefault();
            cartManager.showToast('Showroom visit booked! Our design advisor will call you shortly.', 'success');
            closeModals();
            apptForm.reset();
        });
    }
}

function openQuickView(productId) {
    const cleanId = String(productId).replace(/\D/g, '');
    const product = (typeof PRODUCTS !== 'undefined') ? PRODUCTS.find(p => String(p.id) === String(productId) || String(p.id) === cleanId || p.slug === productId) : null;
    if (!product) return;

    const modal = document.getElementById('quickViewModal');
    const content = document.getElementById('quickViewModalContent');
    if (!modal || !content) return;

    const gallery = product.gallery || [product.image];

    content.innerHTML = `
        <div class="quickview-grid">
            <div class="quickview-gallery">
                <img src="${gallery[0]}" alt="${product.name}" class="quickview-main-img" id="quickViewMainImg">
                <div class="quickview-thumbs">
                    ${gallery.map((img, idx) => `
                        <img src="${img}" alt="Thumb" class="quickview-thumb-img ${idx === 0 ? 'active' : ''}" 
                             onclick="document.getElementById('quickViewMainImg').src='${img}'; document.querySelectorAll('.quickview-thumb-img').forEach(t=>t.classList.remove('active')); this.classList.add('active');">
                    `).join('')}
                </div>
            </div>
            <div class="quickview-info">
                <span class="product-category-name">${product.categoryName}</span>
                <h3>${product.name}</h3>
                <div class="product-rating-row">
                    <span class="rating-stars">${getRatingStarsHtml(product.rating)}</span>
                    <span class="rating-count">${product.reviewsCount !== undefined && product.reviewsCount !== null ? product.reviewsCount : (product.review_count || 0)} Reviews</span>
                </div>
                <div class="product-price-row" style="margin: 0.75rem 0;">
                    <span class="product-current-price" style="font-size:1.5rem;">₹${product.price.toLocaleString('en-IN')}</span>
                    ${product.originalPrice ? `<span class="product-original-price">₹${product.originalPrice.toLocaleString('en-IN')}</span>` : ''}
                    ${product.discount ? `<span class="product-discount-tag">${product.discount.toString().toLowerCase().includes('off') ? product.discount : product.discount + '% OFF'}</span>` : ''}
                </div>
                <p style="font-size:0.875rem; color:var(--text-muted); line-height:1.5; margin-bottom:1rem;">
                    ${product.description}
                </p>

                <table class="quickview-spec-table">
                    <tr><td>Material:</td><td>${product.material}</td></tr>
                    <tr><td>Dimensions:</td><td>${product.dimensions}</td></tr>
                    <tr><td>Warranty:</td><td>${product.warranty}</td></tr>
                </table>

                <div class="pincode-box">
                    <input type="text" class="pincode-input" id="quickViewPincode" placeholder="Enter Pincode" maxlength="6">
                    <button class="btn btn-secondary btn-sm" onclick="checkPincode('quickViewPincode', 'quickViewPincodeResult')">Check Delivery</button>
                </div>
                <div id="quickViewPincodeResult" class="pincode-result"></div>

                <div style="display:flex; gap:1rem; margin-top:1.5rem;">
                    <button class="btn btn-primary btn-block" onclick="cartManager.addToCart('${product.id}'); closeModals();">
                        Add to Cart • ₹${product.price.toLocaleString('en-IN')}
                    </button>
                    <a href="product-detail?id=${product.id}" class="btn btn-secondary">
                        Full Details
                    </a>
                </div>
            </div>
        </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function openAppointmentModal(storeName = '') {
    const modal = document.getElementById('appointmentModal');
    const storeSelect = document.getElementById('appointmentStoreSelect');
    if (!modal) return;

    if (storeSelect && storeName) {
        storeSelect.value = storeName;
    }

    modal.classList.add('active');
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
}

function openLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        const alertBox = document.getElementById('authModalAlert');
        if (alertBox) {
            alertBox.style.display = 'none';
            alertBox.innerHTML = '';
        }
        modal.classList.add('active');
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
    }
}

function closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
}

/* ==========================================================================
   10. PINCODE DELIVERY CHECKER
   ========================================================================== */
function initPincodeChecker() {
    // Initializer if needed
}

function checkPincode(inputId, resultId) {
    const input = document.getElementById(inputId);
    const result = document.getElementById(resultId);
    if (!input || !result) return;

    const pin = input.value.trim();
    if (!/^\d{6}$/.test(pin)) {
        result.innerHTML = `<span style="color:#ef4444; font-weight:600;">Please enter a valid 6-digit Indian PIN code.</span>`;
        return;
    }

    // Bangalore & Hyderabad fast delivery simulation
    if (pin.startsWith('560') || pin.startsWith('500')) {
        result.innerHTML = `
            <span style="color:#16a34a; font-weight:600;">
                ✓ Express Delivery & Free Installation available by Tomorrow!
            </span>
        `;
    } else {
        result.innerHTML = `
            <span style="color:#16a34a; font-weight:600;">
                ✓ Standard Free Delivery available in 3 - 5 business days.
            </span>
        `;
    }
}

/* ==========================================================================
   11. MOBILE DRAWER NAVIGATION
   ========================================================================== */
window.openMobileNav = function() {
    const drawer = document.getElementById('mobileNavDrawer');
    const backdrop = document.getElementById('drawerBackdrop');
    if (drawer) drawer.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
};

window.closeMobileNav = function() {
    const drawer = document.getElementById('mobileNavDrawer');
    const backdrop = document.getElementById('drawerBackdrop');
    if (drawer) drawer.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = '';
};

window.toggleMobileNav = function(e) {
    if (e && e.preventDefault) e.preventDefault();
    const drawer = document.getElementById('mobileNavDrawer');
    if (drawer && drawer.classList.contains('active')) {
        window.closeMobileNav();
    } else {
        window.openMobileNav();
    }
};

window.toggleMobileAccordion = function(btn) {
    if (!btn) return;
    const group = btn.closest('.mobile-accordion-group');
    if (!group) return;
    const childList = group.querySelector('.mobile-child-list');
    const toggleBtn = group.querySelector('.mobile-accordion-toggle');
    if (childList) {
        const isShown = childList.classList.toggle('show');
        if (toggleBtn) {
            if (isShown) {
                toggleBtn.classList.add('active');
            } else {
                toggleBtn.classList.remove('active');
            }
        }
    }
};

function initMobileNav() {
    const openBtn = document.getElementById('mobileMenuBtn');
    const closeBtn = document.getElementById('closeMobileNav');
    const backdrop = document.getElementById('drawerBackdrop');

    if (openBtn) {
        openBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.openMobileNav();
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.closeMobileNav();
        });
    }

    if (backdrop) {
        backdrop.addEventListener('click', () => {
            window.closeMobileNav();
        });
    }
}

/* ==========================================================================
   12. FLOATING ACTIONS & BACK TO TOP
   ========================================================================== */
function initFloatingActions() {
    const backToTopBtn = document.getElementById('backToTopBtn');
    if (!backToTopBtn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/* ==========================================================================
   13. DYNAMIC OFFER BANNER
   ========================================================================== */
function initOfferBanner() {
    const container = document.getElementById('offerBannerContainer');
    if (!container) return;

    // Loading State: Shimmering Skeleton
    container.innerHTML = `
        <div class="offer-banner-section" style="padding: 1.5rem 0;">
            <div class="container">
                <div class="offer-banner-wrapper">
                    <div class="skeleton" style="width: 100%; height: 260px; border-radius: 12px;"></div>
                </div>
            </div>
        </div>
    `;

    fetch('api/offer_banners.php')
        .then(response => {
            if (!response.ok) throw new Error('API response error');
            return response.json();
        })
        .then(data => {
            if (!Array.isArray(data) || data.length === 0) {
                container.innerHTML = ''; // Empty State
                return;
            }

            const bannersHtml = data.map(banner => {
                const hasLink = banner.link && banner.link.trim() !== '';
                const linkOpen = hasLink ? `<a href="${escHtml(banner.link)}" class="offer-banner-link">` : '';
                const linkClose = hasLink ? `</a>` : '';
                return `
                    <div class="offer-banner-item" style="margin-bottom: 1.25rem;">
                        ${linkOpen}
                            <img src="${escHtml(cleanMediaUrl(banner.image_url))}" 
                                 alt="${escHtml(banner.title || 'Promo Offer')}" 
                                 class="offer-banner-img" 
                                 onerror="this.style.display='none'; this.parentElement.style.display='none';"
                                 loading="lazy">
                        ${linkClose}
                    </div>
                `;
            }).join('');

            container.innerHTML = `
                <section class="offer-banner-section" style="padding: 1.5rem 0; background-color: #ffffff;">
                    <div class="container">
                        <div class="offer-banner-wrapper">
                            ${bannersHtml}
                        </div>
                    </div>
                </section>
            `;
        })
        .catch(err => {
            console.error('Error loading offer banners:', err);
            container.innerHTML = ''; // Handle error gracefully
        });
}

function escHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ==========================================================================
   SHORT VIDEOS & REELS SLIDER & MODAL (URBAN LADDER STYLE)
   ========================================================================== */
window.scrollReelsSlider = function(direction) {
    const container = document.getElementById('reelsSliderContainer');
    if (!container) return;
    const firstCard = container.querySelector('.reel-card');
    const scrollAmount = firstCard ? (firstCard.offsetWidth + 20) * direction : (container.clientWidth * 0.75 * direction);
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    setTimeout(updateReelSliderArrows, 350);
};

function updateReelSliderArrows() {
    const container = document.getElementById('reelsSliderContainer');
    const prevBtn = document.getElementById('reelPrevBtn');
    const nextBtn = document.getElementById('reelNextBtn');
    if (!container) return;

    const hasOverflow = container.scrollWidth > container.clientWidth + 5;

    // Left button: ONLY visible when scrolled to the right (i.e. cards exist to the left)
    if (prevBtn) {
        const canScrollLeft = hasOverflow && container.scrollLeft > 10;
        prevBtn.style.display = canScrollLeft ? 'flex' : 'none';
    }

    // Right button: ONLY visible when there are more cards to the right
    if (nextBtn) {
        const canScrollRight = hasOverflow && (container.scrollLeft + container.clientWidth < container.scrollWidth - 10);
        nextBtn.style.display = canScrollRight ? 'flex' : 'none';
    }
}
window.updateReelSliderArrows = updateReelSliderArrows;

window.openReelModal = function(card) {
    if (!card) return;
    const videoUrl = card.getAttribute('data-video') || '';
    const title = card.getAttribute('data-title') || 'Featured Product';
    const link = card.getAttribute('data-link') || 'shop';
    const views = card.getAttribute('data-views') || '120K';

    const backdrop = document.getElementById('reelModalBackdrop');
    const modalVideo = document.getElementById('reelModalVideo');
    const modalTitle = document.getElementById('reelModalTitle');
    const modalShopBtn = document.getElementById('reelModalShopBtn');
    const modalViews = document.getElementById('reelModalViews');
    const indicator = document.getElementById('reelModalPlayIndicator');

    if (modalTitle) modalTitle.textContent = title;
    if (modalShopBtn) modalShopBtn.href = link;
    if (modalViews) modalViews.innerHTML = `<i class="fa-solid fa-eye"></i> <span>${views} views</span>`;
    if (indicator) indicator.classList.remove('visible');

    if (modalVideo && videoUrl) {
        modalVideo.src = videoUrl;
        modalVideo.currentTime = 0;
        modalVideo.muted = false;
        modalVideo.load();
        
        const playPromise = modalVideo.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                updateMuteBtnIcon(false);
            }).catch(e => {
                console.warn('Unmuted autoplay prevented by browser, playing muted:', e);
                modalVideo.muted = true;
                updateMuteBtnIcon(true);
                modalVideo.play().catch(err => console.log('Playback error:', err));
            });
        }
    }

    if (backdrop) {
        backdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
};

window.toggleModalVideoPlay = function() {
    const video = document.getElementById('reelModalVideo');
    const indicator = document.getElementById('reelModalPlayIndicator');
    if (!video) return;

    if (video.paused) {
        video.play().then(() => {
            if (indicator) {
                indicator.innerHTML = '<i class="fa-solid fa-play"></i>';
                indicator.classList.remove('visible');
            }
        }).catch(() => {});
    } else {
        video.pause();
        if (indicator) {
            indicator.innerHTML = '<i class="fa-solid fa-pause"></i>';
            indicator.classList.add('visible');
        }
    }
};

window.toggleModalVideoMute = function() {
    const video = document.getElementById('reelModalVideo');
    if (!video) return;
    video.muted = !video.muted;
    updateMuteBtnIcon(video.muted);
};

function updateMuteBtnIcon(isMuted) {
    const muteBtn = document.getElementById('reelModalMuteBtn');
    if (!muteBtn) return;
    muteBtn.innerHTML = isMuted ? '<i class="fa-solid fa-volume-xmark"></i>' : '<i class="fa-solid fa-volume-high"></i>';
}
window.updateMuteBtnIcon = updateMuteBtnIcon;

window.closeReelModal = function(e) {
    if (e && e.target && e.target.closest('.reel-modal-dialog') && !e.target.closest('.reel-modal-close')) {
        return;
    }
    const backdrop = document.getElementById('reelModalBackdrop');
    const modalVideo = document.getElementById('reelModalVideo');
    const indicator = document.getElementById('reelModalPlayIndicator');
    if (modalVideo) {
        modalVideo.pause();
        modalVideo.removeAttribute('src');
        modalVideo.load();
    }
    if (indicator) {
        indicator.classList.remove('visible');
    }
    if (backdrop) {
        backdrop.classList.remove('active');
        document.body.style.overflow = '';
    }
};

window.toggleReelLike = function(btn, videoId) {
    if (!btn) return;
    btn.classList.toggle('liked');
    const icon = btn.querySelector('i');
    const numSpan = btn.querySelector('.reel-like-num');
    
    if (btn.classList.contains('liked')) {
        if (icon) {
            icon.classList.remove('fa-regular');
            icon.classList.add('fa-solid');
        }
        if (numSpan) {
            const current = parseInt(numSpan.textContent) || 0;
            numSpan.textContent = current + 1;
        }
    } else {
        if (icon) {
            icon.classList.remove('fa-solid');
            icon.classList.add('fa-regular');
        }
        if (numSpan) {
            const current = parseInt(numSpan.textContent) || 1;
            numSpan.textContent = Math.max(0, current - 1);
        }
    }
};

// Video preview hover playback & Arrow listeners
document.addEventListener('DOMContentLoaded', function() {
    updateReelSliderArrows();
    const reelContainer = document.getElementById('reelsSliderContainer');
    if (reelContainer) {
        reelContainer.addEventListener('scroll', updateReelSliderArrows, { passive: true });
    }
    window.addEventListener('resize', updateReelSliderArrows);

    const reelCards = document.querySelectorAll('.reel-card');
    reelCards.forEach(card => {
        const video = card.querySelector('video.reel-preview-video');
        if (video) {
            card.addEventListener('mouseenter', () => {
                video.currentTime = 0;
                video.play().catch(() => {});
            });
            card.addEventListener('mouseleave', () => {
                video.pause();
                video.currentTime = 0;
            });
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            window.closeReelModal();
        }
    });
});


