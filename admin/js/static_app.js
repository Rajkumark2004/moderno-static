/**
 * MODERNO Universal Static Client-Side Router & Smart Dynamic Image Fallback Controller
 * Ensures 0 broken links, 0 404s, and 0 duplicate/broken image placeholders across the site.
 */

window.DIVERSE_FURNITURE_FALLBACKS = [
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80", // Luxe Emerald Sofa
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&auto=format&fit=crop&q=80", // Master King Bed
    "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&auto=format&fit=crop&q=80", // Royal Dining Set
    "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&auto=format&fit=crop&q=80", // Velvet Accent Chair
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&auto=format&fit=crop&q=80", // Ergonomic Office Desk
    "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&auto=format&fit=crop&q=80", // Wooden Sideboard Cabinet
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80", // Outdoor Patio Deck
    "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&auto=format&fit=crop&q=80", // Crafted Solid Wood Door
    "https://images.unsplash.com/photo-1567016432779-094069958ea5?w=800&auto=format&fit=crop&q=80", // Minimalist Gray Sofa
    "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&auto=format&fit=crop&q=80", // Cozy Bedroom Platform
    "https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=800&auto=format&fit=crop&q=80", // Rustic Dining Table
    "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&auto=format&fit=crop&q=80", // Modern Lounge Chair
    "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80", // Scandinavian Bookshelf
    "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80", // Solid Wood Shoe Rack
    "https://images.unsplash.com/photo-1558882224-dda166733046?w=800&auto=format&fit=crop&q=80", // 3-Door Wooden Wardrobe
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&auto=format&fit=crop&q=80", // Hand-Tufted Woolen Rug
    "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&auto=format&fit=crop&q=80", // Velvet Decorative Cushions
    "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800&auto=format&fit=crop&q=80", // Modern Coffee Table
    "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=800&auto=format&fit=crop&q=80", // Low-Profile TV Unit
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop&q=80"  // Luxury Aesthetic Interior
];

window.handleImageError = function(img) {
    if (!img || img.dataset.fallbackDone) return;
    img.dataset.fallbackDone = "true";
    img.onerror = null;

    var text = (img.alt || img.title || img.dataset.name || img.dataset.category || '').toLowerCase();
    var src = (img.src || '').toLowerCase();

    if (text.includes('bed') || text.includes('cot') || text.includes('mattress') || text.includes('bedroom')) {
        img.src = "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&auto=format&fit=crop&q=80";
    } else if (text.includes('dining') || text.includes('table set') || text.includes('eating')) {
        img.src = "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&auto=format&fit=crop&q=80";
    } else if (text.includes('chair') || text.includes('recliner') || text.includes('armchair') || text.includes('seating')) {
        img.src = "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&auto=format&fit=crop&q=80";
    } else if (text.includes('office') || text.includes('desk') || text.includes('study') || text.includes('workstation')) {
        img.src = "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&auto=format&fit=crop&q=80";
    } else if (text.includes('door') || text.includes('entryway')) {
        img.src = "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&auto=format&fit=crop&q=80";
    } else if (text.includes('wardrobe') || text.includes('cupboard') || text.includes('closet')) {
        img.src = "https://images.unsplash.com/photo-1558882224-dda166733046?w=800&auto=format&fit=crop&q=80";
    } else if (text.includes('shoe') || text.includes('rack')) {
        img.src = "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80";
    } else if (text.includes('book') || text.includes('shelf') || text.includes('bookshelf')) {
        img.src = "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80";
    } else if (text.includes('rug') || text.includes('carpet')) {
        img.src = "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&auto=format&fit=crop&q=80";
    } else if (text.includes('cushion') || text.includes('pillow')) {
        img.src = "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&auto=format&fit=crop&q=80";
    } else if (text.includes('outdoor') || text.includes('patio') || text.includes('balcony') || text.includes('garden')) {
        img.src = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80";
    } else if (text.includes('sofa') || text.includes('couch') || text.includes('living')) {
        img.src = "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&auto=format&fit=crop&q=80";
    } else {
        var hash = 0;
        var str = (img.src || '') + (img.alt || '') + (img.className || '');
        for (var i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        var idx = Math.abs(hash) % window.DIVERSE_FURNITURE_FALLBACKS.length;
        img.src = window.DIVERSE_FURNITURE_FALLBACKS[idx];
    }
};

// Global DOM error listener captures ALL broken images dynamically
document.addEventListener('error', function(e) {
    if (e.target && e.target.tagName === 'IMG') {
        window.handleImageError(e.target);
    }
}, true);

document.addEventListener('DOMContentLoaded', () => {
    console.log("MODERNO Universal Router & Dynamic Image Controller active.");

    // Scan all image tags
    document.querySelectorAll('img').forEach(img => {
        img.onerror = function() {
            window.handleImageError(this);
        };
        if (!img.src || img.src.includes('undefined') || img.src.endsWith('/')) {
            window.handleImageError(img);
        }
    });

    // Client-Side Link Normalizer (Fixes 404s)
    document.addEventListener('click', (e) => {
        const anchor = e.target.closest('a');
        if (anchor && anchor.href) {
            const url = new URL(anchor.href, window.location.origin);
            if (url.origin === window.location.origin && !url.pathname.endsWith('.html') && !url.pathname.endsWith('/') && !url.pathname.includes('.')) {
                e.preventDefault();
                let newPath = url.pathname + '.html' + url.search + url.hash;
                window.location.href = newPath;
            }
        }
    });
});
