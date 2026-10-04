// Moderno - Shopping Cart & Wishlist State Management

class CartManager {
    constructor() {
        this.userId = null;
        this.cart = [];
        this.wishlist = [];
        this.discountCode = '';
        this.discountPercent = 0;
        this.appliedPromo = null;

        // Check if user is known globally from PHP or auth session
        if (typeof window !== 'undefined') {
            if (window.AUTH_USER_ID) {
                this.userId = String(window.AUTH_USER_ID);
            } else if (window.currentUserState && window.currentUserState.id) {
                this.userId = String(window.currentUserState.id);
            }
        }

        this.loadData();
        this.init();
    }

    getStoragePrefix() {
        if (this.userId) {
            return `lgf_u${this.userId}_`;
        }
        if (typeof window !== 'undefined') {
            if (window.AUTH_USER_ID) {
                this.userId = String(window.AUTH_USER_ID);
                return `lgf_u${this.userId}_`;
            }
            if (window.currentUserState && window.currentUserState.id) {
                this.userId = String(window.currentUserState.id);
                return `lgf_u${this.userId}_`;
            }
        }
        return 'lgf_guest_';
    }

    getStorageItem(key) {
        const p = this.getStoragePrefix();
        let val = localStorage.getItem(p + key);
        // Fallback for legacy unscoped storage
        if (val === null && (p === 'lgf_guest_' || p === 'lgf_')) {
            val = localStorage.getItem('lgf_' + key);
        }
        return val;
    }

    setStorageItem(key, val) {
        const p = this.getStoragePrefix();
        localStorage.setItem(p + key, typeof val === 'string' ? val : JSON.stringify(val));
    }

    removeStorageItem(key) {
        const p = this.getStoragePrefix();
        localStorage.removeItem(p + key);
    }

    loadData(userId = null) {
        if (userId !== undefined && userId !== null) {
            this.userId = String(userId);
        } else if (typeof window !== 'undefined') {
            if (window.AUTH_USER_ID) {
                this.userId = String(window.AUTH_USER_ID);
            } else if (window.currentUserState && window.currentUserState.id) {
                this.userId = String(window.currentUserState.id);
            } else {
                this.userId = null;
            }
        } else {
            this.userId = null;
        }

        let rawCart = [];
        try {
            const cartStr = this.getStorageItem('cart');
            rawCart = cartStr ? JSON.parse(cartStr) : [];
        } catch (e) {
            rawCart = [];
        }

        this.cart = (Array.isArray(rawCart) ? rawCart : []).map(item => {
            if (!item.color || item.color === 'undefined' || item.color === 'null') {
                item.color = 'Standard';
            }
            let q = parseInt(item.quantity, 10);
            if (isNaN(q) || q < 1) {
                q = 1;
            }
            item.quantity = q;
            item.price = Number(item.price) || 0;
            item.originalPrice = Number(item.originalPrice) || item.price;
            item.id = String(item.id || '');
            return item;
        });

        let rawWish = [];
        try {
            const wishStr = this.getStorageItem('wishlist');
            rawWish = wishStr ? JSON.parse(wishStr) : [];
        } catch(e) {
            rawWish = [];
        }
        this.wishlist = Array.isArray(rawWish) ? rawWish.map(id => String(id)) : [];

        this.discountCode = this.getStorageItem('discount_code') || '';
        this.discountPercent = Number(this.getStorageItem('discount_percent')) || 0;
        try {
            const promoStr = this.getStorageItem('applied_promo');
            this.appliedPromo = promoStr ? JSON.parse(promoStr) : null;
        } catch (e) {
            this.appliedPromo = null;
        }
    }

    async fetchServerData() {
        try {
            const [cartRes, wishRes] = await Promise.all([
                fetch('api/cart/sync.php', { method: 'GET', credentials: 'same-origin' }).then(r => r.json()).catch(() => null),
                fetch('api/wishlist/sync.php', { method: 'GET', credentials: 'same-origin' }).then(r => r.json()).catch(() => null)
            ]);

            let changed = false;

            if (cartRes && cartRes.status === 'success' && cartRes.logged_in) {
                if (cartRes.user_id && String(cartRes.user_id) !== this.userId) {
                    this.userId = String(cartRes.user_id);
                }
                const serverCart = Array.isArray(cartRes.cart) ? cartRes.cart : [];
                this.cart = serverCart.map(item => {
                    if (!item.color || item.color === 'undefined' || item.color === 'null') {
                        item.color = 'Standard';
                    }
                    let q = parseInt(item.quantity, 10);
                    if (isNaN(q) || q < 1) q = 1;
                    item.quantity = q;
                    item.price = Number(item.price) || 0;
                    item.originalPrice = Number(item.originalPrice) || item.price;
                    item.id = String(item.id || '');
                    return item;
                });
                this.setStorageItem('cart', this.cart);
                changed = true;
            }

            if (wishRes && wishRes.status === 'success' && wishRes.logged_in) {
                if (wishRes.user_id && String(wishRes.user_id) !== this.userId) {
                    this.userId = String(wishRes.user_id);
                }
                const serverWish = Array.isArray(wishRes.wishlist) ? wishRes.wishlist : [];
                this.wishlist = serverWish.map(id => String(id));
                this.setStorageItem('wishlist', this.wishlist);
                changed = true;
            }

            if (changed) {
                this.updateBadges();
                this.updateWishlistIcons();
                this.renderCartDrawer();
                this.renderWishlistDrawer();

                if (typeof window.renderWishlistPage === 'function') {
                    window.renderWishlistPage();
                }
                if (typeof window.renderCartPage === 'function') {
                    window.renderCartPage();
                }
            }
        } catch (e) {
            console.error('CartManager fetchServerData error:', e);
        }
    }

    setUser(userId) {
        const newId = userId ? String(userId) : null;
        if (this.userId === newId && newId !== null) {
            this.fetchServerData();
            return;
        }

        const oldId = this.userId;
        this.userId = newId;

        // If transitioning from guest to logged-in user
        if (!oldId && newId) {
            let guestCart = [];
            let guestWish = [];
            try {
                const gCartStr = localStorage.getItem('lgf_guest_cart') || localStorage.getItem('lgf_cart');
                if (gCartStr) guestCart = JSON.parse(gCartStr);
            } catch (e) {}
            try {
                const gWishStr = localStorage.getItem('lgf_guest_wishlist') || localStorage.getItem('lgf_wishlist');
                if (gWishStr) guestWish = JSON.parse(gWishStr);
            } catch (e) {}

            if ((Array.isArray(guestCart) && guestCart.length > 0) || (Array.isArray(guestWish) && guestWish.length > 0)) {
                Promise.all([
                    (Array.isArray(guestCart) && guestCart.length > 0) ? fetch('api/cart/sync.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'same-origin',
                        body: JSON.stringify({ action: 'merge', guest_cart: guestCart, user_id: newId })
                    }) : Promise.resolve(),
                    (Array.isArray(guestWish) && guestWish.length > 0) ? fetch('api/wishlist/sync.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'same-origin',
                        body: JSON.stringify({ action: 'merge', guest_wishlist: guestWish, user_id: newId })
                    }) : Promise.resolve()
                ]).then(() => {
                    localStorage.removeItem('lgf_guest_cart');
                    localStorage.removeItem('lgf_guest_wishlist');
                    this.fetchServerData();
                });
            } else {
                this.loadData(newId);
                this.updateBadges();
                this.updateWishlistIcons();
                this.renderCartDrawer();
                this.renderWishlistDrawer();
                if (typeof window.renderWishlistPage === 'function') window.renderWishlistPage();
                if (typeof window.renderCartPage === 'function') window.renderCartPage();
                this.fetchServerData();
            }
        } else if (newId) {
            this.loadData(newId);
            this.updateBadges();
            this.updateWishlistIcons();
            this.renderCartDrawer();
            this.renderWishlistDrawer();
            if (typeof window.renderWishlistPage === 'function') window.renderWishlistPage();
            if (typeof window.renderCartPage === 'function') window.renderCartPage();
            this.fetchServerData();
        } else {
            // Logged out
            this.loadData(null);
            this.updateBadges();
            this.updateWishlistIcons();
            this.renderCartDrawer();
            this.renderWishlistDrawer();
            if (typeof window.renderWishlistPage === 'function') window.renderWishlistPage();
            if (typeof window.renderCartPage === 'function') window.renderCartPage();
        }
    }

    init() {
        this.updateBadges();
        this.renderCartDrawer();
        this.renderWishlistDrawer();
        this.bindEvents();
        this.fetchServerData();
    }

    bindEvents() {
        // Cart drawer triggers
        const cartTriggers = document.querySelectorAll('.cart-drawer-trigger');
        const cartDrawer = document.getElementById('cartDrawer');
        const drawerBackdrop = document.getElementById('drawerBackdrop');
        const closeCartBtn = document.getElementById('closeCartDrawer');

        cartTriggers.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openCart();
            });
        });

        if (closeCartBtn) {
            closeCartBtn.addEventListener('click', () => this.closeDrawers());
        }

        // Wishlist drawer triggers
        const wishlistTriggers = document.querySelectorAll('.wishlist-drawer-trigger');
        const wishlistDrawer = document.getElementById('wishlistDrawer');
        const closeWishlistBtn = document.getElementById('closeWishlistDrawer');

        wishlistTriggers.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openWishlist();
            });
        });

        if (closeWishlistBtn) {
            closeWishlistBtn.addEventListener('click', () => this.closeDrawers());
        }

        if (drawerBackdrop) {
            drawerBackdrop.addEventListener('click', () => this.closeDrawers());
        }

        // Coupon Form
        const couponForm = document.getElementById('cartCouponForm');
        if (couponForm) {
            couponForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const input = document.getElementById('couponInput');
                if (input) this.applyCoupon(input.value.trim());
            });
        }
    }

    openCart() {
        this.closeDrawers();
        const cartDrawer = document.getElementById('cartDrawer');
        const drawerBackdrop = document.getElementById('drawerBackdrop');
        if (cartDrawer && drawerBackdrop) {
            this.renderCartDrawer();
            cartDrawer.classList.add('active');
            drawerBackdrop.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    openWishlist() {
        this.closeDrawers();
        const wishlistDrawer = document.getElementById('wishlistDrawer');
        const drawerBackdrop = document.getElementById('drawerBackdrop');
        if (wishlistDrawer && drawerBackdrop) {
            this.renderWishlistDrawer();
            wishlistDrawer.classList.add('active');
            drawerBackdrop.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeDrawers() {
        const cartDrawer = document.getElementById('cartDrawer');
        const wishlistDrawer = document.getElementById('wishlistDrawer');
        const mobileNavDrawer = document.getElementById('mobileNavDrawer');
        const drawerBackdrop = document.getElementById('drawerBackdrop');

        if (cartDrawer) cartDrawer.classList.remove('active');
        if (wishlistDrawer) wishlistDrawer.classList.remove('active');
        if (mobileNavDrawer) mobileNavDrawer.classList.remove('active');
        if (drawerBackdrop) drawerBackdrop.classList.remove('active');
        document.body.style.overflow = '';
    }

    addToCart(productId, quantity = 1, selectedColor = null) {
        const targetId = String(productId).trim();
        const product = (typeof PRODUCTS !== 'undefined' && Array.isArray(PRODUCTS)) 
            ? PRODUCTS.find(p => String(p.id).trim() === targetId) 
            : null;

        if (!product) return;

        const colorToUse = selectedColor || (product.colors ? product.colors[0] : (product.finish || 'Standard'));
        const numQty = parseInt(quantity, 10) || 1;

        const existingItem = this.cart.find(item => 
            String(item.id).trim() === targetId && 
            String(item.color || 'Standard').trim().toLowerCase() === String(colorToUse).trim().toLowerCase()
        );

        if (existingItem) {
            existingItem.quantity = (parseInt(existingItem.quantity, 10) || 1) + numQty;
        } else {
            this.cart.push({
                id: String(product.id),
                name: product.name || 'Furniture Item',
                price: Number(product.price) || 0,
                originalPrice: Number(product.originalPrice) || Number(product.price) || 0,
                image: product.image || (product.images ? product.images[0] : ''),
                category: product.categoryName || product.category || 'Furniture',
                color: colorToUse || 'Standard',
                quantity: numQty
            });
        }

        this.saveCart('add', { product_id: targetId, quantity: numQty, color: colorToUse });
        this.updateBadges();
        this.validateCouponOrAutoRemove();
        this.renderCartDrawer();
        if (typeof window.renderCartPage === 'function') {
            window.renderCartPage();
        }
        this.showToast(`"${product.name}" added to your cart!`, 'success');
        this.openCart();
    }

    updateQuantity(productId, color = 'Standard', delta = 1) {
        const targetId = String(productId).trim();
        const targetColor = String(color || 'Standard').trim().toLowerCase();

        let itemIndex = this.cart.findIndex(i => {
            const iId = String(i.id).trim();
            const iCol = String(i.color || 'Standard').trim().toLowerCase();
            return iId === targetId && (iCol === targetColor || targetColor === 'standard' || !targetColor);
        });

        if (itemIndex === -1) {
            itemIndex = this.cart.findIndex(i => String(i.id).trim() === targetId);
        }

        if (itemIndex > -1 && itemIndex < this.cart.length) {
            this.updateQuantityByIndex(itemIndex, delta);
        }
    }

    updateQuantityByIndex(index, delta) {
        const idx = parseInt(index, 10);
        if (idx >= 0 && idx < this.cart.length) {
            let curQty = parseInt(this.cart[idx].quantity, 10);
            if (isNaN(curQty) || curQty < 1) curQty = 1;

            curQty += parseInt(delta, 10);

            if (curQty <= 0) {
                const removed = this.cart.splice(idx, 1)[0];
                this.showToast(`"${removed ? removed.name : 'Item'}" removed from cart`, 'info');
                this.saveCart('remove', { product_id: removed ? removed.id : '', color: removed ? removed.color : 'Standard' });
            } else {
                this.cart[idx].quantity = curQty;
                this.saveCart('update_qty', { product_id: this.cart[idx].id, color: this.cart[idx].color, quantity: curQty });
            }

            this.updateBadges();
            this.validateCouponOrAutoRemove();
            this.renderCartDrawer();
            if (typeof window.renderCartPage === 'function') {
                window.renderCartPage();
            }
        }
    }

    removeFromCart(productId, color = 'Standard') {
        const targetId = String(productId).trim();
        const targetColor = String(color || 'Standard').trim().toLowerCase();

        let itemIndex = this.cart.findIndex(i => {
            const iId = String(i.id).trim();
            const iCol = String(i.color || 'Standard').trim().toLowerCase();
            return iId === targetId && (iCol === targetColor || targetColor === 'standard' || !targetColor);
        });

        if (itemIndex === -1) {
            itemIndex = this.cart.findIndex(i => String(i.id).trim() === targetId);
        }

        if (itemIndex > -1 && itemIndex < this.cart.length) {
            this.removeFromCartByIndex(itemIndex);
        }
    }

    removeFromCartByIndex(index) {
        const idx = parseInt(index, 10);
        if (idx >= 0 && idx < this.cart.length) {
            const removed = this.cart.splice(idx, 1)[0];
            this.saveCart('remove', { product_id: removed ? removed.id : '', color: removed ? removed.color : 'Standard' });
            this.updateBadges();
            this.validateCouponOrAutoRemove();
            this.renderCartDrawer();
            if (typeof window.renderCartPage === 'function') {
                window.renderCartPage();
            }
            this.showToast(`"${removed ? removed.name : 'Item'}" removed from cart`, 'info');
        }
    }

    toggleWishlist(productId) {
        const targetId = String(productId).trim();
        const index = this.wishlist.findIndex(id => String(id).trim() === targetId);
        const product = (typeof PRODUCTS !== 'undefined' && Array.isArray(PRODUCTS))
            ? PRODUCTS.find(p => String(p.id).trim() === targetId)
            : null;
        const title = product ? product.name : 'Product';

        if (index > -1) {
            this.wishlist.splice(index, 1);
            this.showToast(`Removed "${title}" from wishlist`, 'info');
        } else {
            this.wishlist.push(targetId);
            this.showToast(`Added "${title}" to your wishlist!`, 'success');
        }

        this.saveWishlist('toggle', { product_id: targetId });
        this.updateBadges();
        this.renderWishlistDrawer();
        this.updateWishlistIcons();
    }

    isInWishlist(productId) {
        const targetId = String(productId).trim();
        return this.wishlist.some(id => String(id).trim() === targetId);
    }

    applyCoupon(code) {
        const upperCode = (code || '').toUpperCase().trim();
        if (!upperCode) {
            this.appliedPromo = null;
            this.removeStorageItem('applied_promo');
            this.removeStorageItem('discount_code');
            this.showToast('Please enter a promo code.', 'error');
            return;
        }

        const subtotal = this.cart.reduce((s, i) => s + (Number(i.price) || 0) * (parseInt(i.quantity, 10) || 1), 0);

        fetch('api/cart/apply_promo.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                promo_code: upperCode,
                subtotal: subtotal,
                cart_items: this.cart
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                this.appliedPromo = data;
                this.discountCode = data.promo_code;
                this.setStorageItem('applied_promo', data);
                this.setStorageItem('discount_code', data.promo_code);
                this.showToast(data.message || `Coupon ${data.promo_code} applied!`, 'success');
                this.renderCartDrawer();
                if (typeof window.renderCartPage === 'function') {
                    window.renderCartPage();
                }
            } else {
                this.appliedPromo = null;
                this.removeStorageItem('applied_promo');
                this.removeStorageItem('discount_code');
                this.showToast(data.message || 'Invalid Promo Code', 'error');
                this.renderCartDrawer();
            }
        })
        .catch(err => {
            console.error(err);
            this.showToast('Error validating promo code.', 'error');
        });
    }

    removeCoupon() {
        fetch('api/cart/remove_promo.php', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
            this.appliedPromo = null;
            this.discountCode = '';
            this.discountPercent = 0;
            this.removeStorageItem('applied_promo');
            this.removeStorageItem('discount_code');
            this.removeStorageItem('discount_percent');
            this.showToast('Promo code removed.', 'info');
            this.renderCartDrawer();
            if (typeof window.renderCartPage === 'function') {
                window.renderCartPage();
            }
        })
        .catch(err => {
            console.error(err);
            this.showToast('Error removing promo code.', 'error');
        });
    }

    saveCart(remoteAction = 'sync', remotePayload = null) {
        this.setStorageItem('cart', this.cart);

        const uid = this.userId || (typeof window !== 'undefined' && ((window.AUTH_USER_ID) || (window.currentUserState && window.currentUserState.id)));
        if (uid) {
            const payload = {
                action: remoteAction,
                cart: this.cart,
                user_id: String(uid),
                ...(remotePayload || {})
            };
            fetch('api/cart/sync.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(payload)
            }).catch(err => console.warn('Cart sync warning:', err));
        }
    }

    validateCouponOrAutoRemove() {
        if (!this.appliedPromo || !this.discountCode) return;

        if (this.cart.length === 0) {
            this.appliedPromo = null;
            this.discountCode = '';
            this.discountPercent = 0;
            this.removeStorageItem('applied_promo');
            this.removeStorageItem('discount_code');
            this.removeStorageItem('discount_percent');
            fetch('api/cart/remove_promo.php', { method: 'POST' });
            return;
        }

        const subtotal = this.cart.reduce((s, i) => s + (Number(i.price) || 0) * (parseInt(i.quantity, 10) || 1), 0);

        fetch('api/cart/apply_promo.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                promo_code: this.discountCode,
                subtotal: subtotal,
                cart_items: this.cart
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                this.appliedPromo = data;
                this.setStorageItem('applied_promo', data);
                this.renderCartDrawer();
                if (typeof window.renderCartPage === 'function') {
                    window.renderCartPage();
                }
            } else {
                this.appliedPromo = null;
                this.discountCode = '';
                this.discountPercent = 0;
                this.removeStorageItem('applied_promo');
                this.removeStorageItem('discount_code');
                this.removeStorageItem('discount_percent');
                
                fetch('api/cart/remove_promo.php', { method: 'POST' });

                this.showToast(`Coupon removed: ${data.message || 'Cart requirements not met'}`, 'error');
                
                this.renderCartDrawer();
                if (typeof window.renderCartPage === 'function') {
                    window.renderCartPage();
                }
            }
        })
        .catch(err => {
            console.error('Error auto-validating coupon:', err);
        });
    }

    openCouponModal() {
        const modal = document.getElementById('couponModal');
        if (modal) {
            modal.classList.add('active');
            const input = document.getElementById('modalCouponInput');
            if (input) {
                input.value = '';
                input.focus();
            }
            this.fetchActiveCoupons();
        }
    }

    closeCouponModal() {
        const modal = document.getElementById('couponModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    fetchActiveCoupons() {
        const container = document.getElementById('availableCouponsContainer');
        if (!container) return;

        container.innerHTML = `
            <div style="text-align:center; padding:2rem; color:#64748b;">
                <i class="fa-solid fa-circle-notch fa-spin" style="margin-right:6px;"></i> Loading coupons...
            </div>
        `;

        const subtotal = this.cart.reduce((s, i) => s + (Number(i.price) || 0) * (parseInt(i.quantity, 10) || 1), 0);

        fetch('api/promo_codes.php')
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {
                let html = '';
                data.data.forEach(promo => {
                    const minOrder = Number(promo.minimum_order_amount) || 0;
                    const discountVal = Number(promo.discount) || 0;
                    
                    let titleText = '';
                    let descText = '';

                    if (promo.discount_type === 'percentage') {
                        titleText = `Get ${discountVal}% OFF`;
                        descText = `Use code <strong>${promo.promo_code}</strong> & get ${discountVal}% off`;
                        const maxCap = Number(promo.max_discount_amount) || 0;
                        if (maxCap > 0) {
                            descText += ` capped up to ₹${maxCap.toLocaleString('en-IN')}`;
                        }
                    } else {
                        titleText = `Get flat ₹${discountVal.toLocaleString('en-IN')} OFF`;
                        descText = `Use code <strong>${promo.promo_code}</strong> & get flat ₹${discountVal.toLocaleString('en-IN')} off`;
                    }

                    if (minOrder > 0) {
                        descText += ` on orders above ₹${minOrder.toLocaleString('en-IN')}`;
                    }

                    const isDisabled = subtotal < minOrder;

                    html += `
                        <div class="coupon-card" style="${isDisabled ? 'opacity: 0.75;' : ''}">
                            <div class="coupon-code-badge">
                                <i class="fa-solid fa-tag" style="color: var(--primary);"></i>
                                <span>${promo.promo_code}</span>
                            </div>
                            <div class="coupon-card-title">${titleText}</div>
                            <div class="coupon-card-desc">${descText}.</div>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <button type="button" 
                                        class="coupon-card-apply-btn" 
                                        onclick="cartManager.applyCoupon('${promo.promo_code}'); cartManager.closeCouponModal();"
                                        ${isDisabled ? 'style="border-color:#cbd5e1; color:#94a3b8; cursor:not-allowed;" disabled' : ''}>
                                    Apply Coupon
                                </button>
                                ${isDisabled ? `<span style="font-size:0.72rem; color:#ef4444; font-weight:600;"><i class="fa-solid fa-circle-exclamation"></i> Add ₹${(minOrder - subtotal).toLocaleString('en-IN')} more to unlock</span>` : ''}
                            </div>
                        </div>
                    `;
                });
                container.innerHTML = html;
            } else {
                container.innerHTML = `
                    <div style="text-align:center; padding:2rem; color:#64748b;">
                        <i class="fa-solid fa-ticket" style="font-size:2rem; opacity:0.3; margin-bottom:0.5rem; display:block;"></i>
                        No coupons available at the moment.
                    </div>
                `;
            }
        })
        .catch(err => {
            console.error('Error fetching active coupons:', err);
            container.innerHTML = `
                <div style="text-align:center; padding:2rem; color:#ef4444;">
                    Error loading coupons. Please try again.
                </div>
            `;
        });
    }

    saveWishlist(remoteAction = 'sync', remotePayload = null) {
        this.setStorageItem('wishlist', this.wishlist);

        const uid = this.userId || (typeof window !== 'undefined' && ((window.AUTH_USER_ID) || (window.currentUserState && window.currentUserState.id)));
        if (uid) {
            const payload = {
                action: remoteAction,
                wishlist: this.wishlist,
                user_id: String(uid),
                ...(remotePayload || {})
            };
            fetch('api/wishlist/sync.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(payload)
            }).catch(err => console.warn('Wishlist sync warning:', err));
        }
    }

    updateBadges() {
        const cartCount = this.cart.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 1), 0);
        const wishlistCount = this.wishlist.length;

        document.querySelectorAll('.cart-count-badge').forEach(el => {
            el.textContent = cartCount;
            el.style.display = cartCount > 0 ? 'flex' : 'none';
        });

        document.querySelectorAll('.wishlist-count-badge').forEach(el => {
            el.textContent = wishlistCount;
            el.style.display = wishlistCount > 0 ? 'flex' : 'none';
        });
    }

    updateWishlistIcons() {
        document.querySelectorAll('.product-wishlist-btn').forEach(btn => {
            const prodId = btn.getAttribute('data-product-id');
            if (this.isInWishlist(prodId)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    renderCartDrawer() {
        const cartBody = document.getElementById('cartDrawerBody');
        const cartFooter = document.getElementById('cartDrawerFooter');
        if (!cartBody) return;

        if (this.cart.length === 0) {
            cartBody.innerHTML = `
                <div class="drawer-empty-state">
                    <i class="fa-solid fa-cart-shopping" style="font-size:2.5rem; color:var(--text-muted); margin-bottom:1rem;"></i>
                    <h4 style="font-size:1.125rem; font-weight:700; margin-bottom:0.5rem; color:var(--text-main);">Your Cart is Empty</h4>
                    <p style="font-size:0.875rem; margin-bottom:1.5rem;">Explore our premium furniture pieces and add elegance to your home.</p>
                    <a href="shop" class="btn btn-primary btn-sm" onclick="cartManager.closeDrawers()"><i class="fa-solid fa-arrow-left"></i> Start Shopping</a>
                </div>
            `;
            if (cartFooter) cartFooter.style.display = 'none';
            return;
        }

        if (cartFooter) cartFooter.style.display = 'block';

        let subtotal = 0;
        let totalOriginal = 0;

        let itemsHtml = '';
        this.cart.forEach((item, index) => {
            const qty = parseInt(item.quantity, 10) || 1;
            const price = Number(item.price) || 0;
            const origPrice = Number(item.originalPrice) || price;
            const itemTotal = price * qty;
            subtotal += itemTotal;
            totalOriginal += origPrice * qty;

            const safeId = String(item.id).replace(/'/g, "\\'");
            const safeColor = String(item.color || 'Standard').replace(/'/g, "\\'");

            itemsHtml += `
                <div class="cart-item" data-cart-index="${index}">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                    <div class="cart-item-info">
                        <div class="cart-item-title">${item.name}</div>
                        <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.25rem;">Finish: <strong>${item.color || 'Standard'}</strong></div>
                        <div class="cart-item-price">₹${price.toLocaleString('en-IN')}</div>
                        <div class="cart-item-qty-row">
                            <div class="qty-control">
                                <button type="button" class="qty-btn" onclick="cartManager.updateQuantityByIndex(${index}, -1)" aria-label="Decrease quantity"><i class="fa-solid fa-minus" style="font-size:0.65rem;"></i></button>
                                <span class="qty-value">${qty}</span>
                                <button type="button" class="qty-btn" onclick="cartManager.updateQuantityByIndex(${index}, 1)" aria-label="Increase quantity"><i class="fa-solid fa-plus" style="font-size:0.65rem;"></i></button>
                            </div>
                            <button type="button" class="cart-item-remove" onclick="cartManager.removeFromCartByIndex(${index})"><i class="fa-solid fa-trash-can"></i> Remove</button>
                        </div>
                    </div>
                </div>
            `;
        });

        cartBody.innerHTML = itemsHtml;

        // Render Summary
        let discountAmount = 0;
        if (this.appliedPromo && this.appliedPromo.discount_amount) {
            discountAmount = Math.round(Number(this.appliedPromo.discount_amount)) || 0;
        } else if (this.discountPercent > 0) {
            discountAmount = Math.round(subtotal * (this.discountPercent / 100));
        }

        const finalTotal = Math.max(0, subtotal - discountAmount);
        const totalSavings = Math.max(0, (totalOriginal - subtotal) + discountAmount);

        const subtotalEl = document.getElementById('cartSubtotal');
        const discountEl = document.getElementById('cartDiscountRow');
        const discountValEl = document.getElementById('cartDiscountVal');
        const finalTotalEl = document.getElementById('cartFinalTotal');
        const savingsBadgeEl = document.getElementById('cartSavingsBadge');

        if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
        if (discountEl && discountValEl) {
            if (discountAmount > 0) {
                discountEl.style.display = 'flex';
                let label = '';
                if (this.appliedPromo && this.appliedPromo.promo_code) {
                    label = `Promo Code: ${this.appliedPromo.promo_code}`;
                } else if (this.discountPercent > 0) {
                    label = `${this.discountPercent}% OFF`;
                } else {
                    label = `Discount`;
                }
                discountValEl.textContent = `-₹${discountAmount.toLocaleString('en-IN')} (${label})`;
            } else {
                discountEl.style.display = 'none';
            }
        }
        if (finalTotalEl) finalTotalEl.textContent = `₹${finalTotal.toLocaleString('en-IN')}`;
        if (savingsBadgeEl) {
            savingsBadgeEl.textContent = `You Save ₹${totalSavings.toLocaleString('en-IN')} on this order!`;
        }

        // Dynamically update the Coupon form to show Remove button when applied
        const couponForm = document.getElementById('cartCouponForm');
        if (couponForm) {
            if (this.appliedPromo && this.appliedPromo.promo_code) {
                couponForm.innerHTML = `
                    <div class="applied-coupon-card" style="margin-bottom: 0.5rem;">
                        <div class="applied-coupon-left">
                            <div class="applied-coupon-icon">
                                <i class="fa-solid fa-ticket"></i>
                            </div>
                            <div class="applied-coupon-details">
                                <span class="applied-coupon-code">${this.appliedPromo.promo_code}</span>
                                <span class="applied-coupon-subtext">Coupon applied</span>
                            </div>
                        </div>
                        <button type="button" onclick="cartManager.removeCoupon()" class="applied-coupon-remove-btn" title="Remove coupon">
                            <i class="fa-solid fa-xmark"></i> Remove
                        </button>
                    </div>
                `;
            } else {
                couponForm.innerHTML = `
                    <div class="apply-coupon-trigger-box" onclick="cartManager.openCouponModal()" style="margin-bottom: 0.5rem;">
                        <div class="coupon-icon-badge">
                            <i class="fa-solid fa-percent"></i>
                        </div>
                        <span>Apply Coupon</span>
                    </div>
                `;
            }
        }
    }

    renderWishlistDrawer() {
        const wishlistBody = document.getElementById('wishlistDrawerBody');
        if (!wishlistBody) return;

        if (this.wishlist.length === 0) {
            wishlistBody.innerHTML = `
                <div class="drawer-empty-state">
                    <i class="fa-regular fa-heart" style="font-size:2.5rem; color:#ef4444; margin-bottom:1rem;"></i>
                    <h4 style="font-size:1.125rem; font-weight:700; margin-bottom:0.5rem; color:var(--text-main);">Your Wishlist is Empty</h4>
                    <p style="font-size:0.875rem; margin-bottom:1.5rem;">Save your favorite furniture sets and revisit them anytime.</p>
                    <a href="shop" class="btn btn-primary btn-sm" onclick="cartManager.closeDrawers()"><i class="fa-solid fa-arrow-left"></i> Browse Catalog</a>
                </div>
            `;
            return;
        }

        let html = '';
        this.wishlist.forEach(id => {
            const product = (typeof PRODUCTS !== 'undefined' && Array.isArray(PRODUCTS)) 
                ? PRODUCTS.find(p => String(p.id).trim() === String(id).trim())
                : null;
            if (product) {
                const price = Number(product.price) || 0;
                html += `
                    <div class="cart-item">
                        <img src="${product.image}" alt="${product.name}" class="cart-item-img">
                        <div class="cart-item-info">
                            <div class="cart-item-title">${product.name}</div>
                            <div class="cart-item-price">₹${price.toLocaleString('en-IN')}</div>
                            <div style="display:flex; gap:0.5rem; margin-top:0.5rem;">
                                <button class="btn btn-primary btn-sm" style="flex:1; padding:0.35rem 0.6rem; font-size:0.75rem;" onclick="cartManager.addToCart('${product.id}'); cartManager.toggleWishlist('${product.id}');"><i class="fa-solid fa-bag-shopping" style="margin-right:4px;"></i> Move to Cart</button>
                                <button class="cart-item-remove" onclick="cartManager.toggleWishlist('${product.id}')"><i class="fa-solid fa-trash-can"></i> Remove</button>
                            </div>
                        </div>
                    </div>
                `;
            }
        });

        wishlistBody.innerHTML = html;
    }

    showToast(message, type = 'info') {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast-msg ${type}`;

        let iconHtml = type === 'success'
            ? `<i class="fa-solid fa-circle-check" style="color:#10b981; font-size:1.1rem;"></i>`
            : (type === 'error' ? `<i class="fa-solid fa-circle-exclamation" style="color:#ef4444; font-size:1.1rem;"></i>` : `<i class="fa-solid fa-circle-info" style="color:#0284c7; font-size:1.1rem;"></i>`);

        toast.innerHTML = `${iconHtml} <span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Instantiate global cart manager
const cartManager = new CartManager();
window.cartManager = cartManager;

// Global Helper Wrappers for inline onclick handlers across drawer & cart page
window.updateCartQty = function(id, color, delta, index) {
    if (index !== undefined && index !== null && !isNaN(index) && window.cartManager) {
        window.cartManager.updateQuantityByIndex(index, delta);
    } else if (window.cartManager) {
        window.cartManager.updateQuantity(id, color, delta);
    }
};

window.removeCartItem = function(id, color, index) {
    if (index !== undefined && index !== null && !isNaN(index) && window.cartManager) {
        window.cartManager.removeFromCartByIndex(index);
    } else if (window.cartManager) {
        window.cartManager.removeFromCart(id, color);
    }
};

/* ==========================================================================
   PRODUCT ENQUIRY MODAL HANDLERS
   ========================================================================== */
window.resetEnquirySubmitButton = function(method) {
    const submitBtn = document.getElementById('enqSubmitBtn');
    if (!submitBtn) return;

    submitBtn.disabled = false;
    
    // Determine the active payment method
    let activeMethod = method;
    if (activeMethod === undefined || activeMethod === null || activeMethod === '') {
        const selectedRadio = document.querySelector('input[name="enq_payment_method"]:checked');
        activeMethod = selectedRadio ? selectedRadio.value : (window.selectedEnquiryPaymentMethod || '');
    }

    if (activeMethod === 'razorpay') {
        submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> <span id="enqSubmitBtnText">Submit Payment Enquiry</span>';
    } else if (activeMethod === 'cod') {
        submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> <span id="enqSubmitBtnText">Submit COD Enquiry</span>';
    } else {
        submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> <span id="enqSubmitBtnText">Submit Product Enquiry</span>';
    }
};

window.setEnquirySubmitButtonLoading = function(loadingText) {
    const submitBtn = document.getElementById('enqSubmitBtn');
    if (!submitBtn) return;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> ${loadingText}`;
};

window.toggleEnquiryPaymentOption = function(method) {
    window.selectedEnquiryPaymentMethod = method;

    const codLabel = document.getElementById('enqCodOptionLabel');
    const rzpLabel = document.getElementById('enqRazorpayOptionLabel');

    const codRadio = document.getElementById('enqPayMethodCod');
    const rzpRadio = document.getElementById('enqPayMethodRazorpay');

    [codLabel, rzpLabel].forEach(lbl => {
        if (lbl) {
            lbl.style.borderColor = '#cbd5e1';
            lbl.style.background = '#ffffff';
            lbl.classList.remove('active');
        }
    });

    if (method === 'razorpay') {
        if (rzpRadio) rzpRadio.checked = true;
        if (rzpLabel) {
            rzpLabel.style.borderColor = '#0052cc';
            rzpLabel.style.background = '#f0f7ff';
            rzpLabel.classList.add('active');
        }
    } else if (method === 'cod') {
        if (codRadio) codRadio.checked = true;
        if (codLabel) {
            codLabel.style.borderColor = '#0052cc';
            codLabel.style.background = '#f0f7ff';
            codLabel.classList.add('active');
        }
    }

    window.resetEnquirySubmitButton(method);
};

window.cachedEnquiryAddresses = [];
window.activeEnquiryAddressId = null;

window.selectEnquirySavedAddressById = function(id) {
    if (!id) return;
    const addr = window.cachedEnquiryAddresses.find(a => parseInt(a.id) === parseInt(id));
    if (!addr) return;

    window.activeEnquiryAddressId = addr.id;

    // Reset all pill styles
    document.querySelectorAll('.enq-addr-pill').forEach(btn => {
        btn.style.background = '#ffffff';
        btn.style.color = '#334155';
        btn.style.borderColor = '#cbd5e1';
        btn.classList.remove('active');
    });

    // Reset all select styles
    document.querySelectorAll('.enq-addr-select').forEach(sel => {
        sel.style.background = '#ffffff';
        sel.style.color = '#334155';
        sel.style.borderColor = '#cbd5e1';
    });

    // Highlight active pill
    const pill = document.getElementById('enqPill_' + addr.id);
    if (pill) {
        pill.style.background = '#0052cc';
        pill.style.color = '#ffffff';
        pill.style.borderColor = '#0052cc';
        pill.classList.add('active');
    }

    // Highlight active dropdown if chosen from a dropdown
    const typeKey = (addr.type || 'Home').toLowerCase();
    const sel = document.getElementById('enqSelect_' + typeKey);
    if (sel) {
        sel.value = String(addr.id);
        sel.style.background = '#eff6ff';
        sel.style.color = '#0052cc';
        sel.style.borderColor = '#0052cc';
    }

    // Auto-fill Contact info if available
    const fnInput = document.getElementById('enqFirstName');
    const lnInput = document.getElementById('enqLastName');
    const phInput = document.getElementById('enqPhone');
    const emInput = document.getElementById('enqEmail');

    if (addr.full_name) {
        const parts = addr.full_name.trim().split(' ');
        if (fnInput) fnInput.value = parts[0] || '';
        if (lnInput) lnInput.value = parts.slice(1).join(' ') || '';
    }
    if (phInput && addr.phone) {
        phInput.value = String(addr.phone).replace(/[^0-9]/g, '');
    }

    // Auto-fill Email (from address email, fallback to user account email)
    if (emInput) {
        let userEmail = (addr.email || '').trim();
        if (!userEmail) {
            let u = window.currentUserState || null;
            if (!u) {
                try { u = JSON.parse(localStorage.getItem('lgf_user') || '{}'); } catch(e) {}
            }
            if (u && u.email) userEmail = u.email;
        }
        emInput.value = userEmail;
    }

    // Auto-fill Address Fields
    const bInput = document.getElementById('enqBuilding');
    const sInput = document.getElementById('enqStreet');
    const lInput = document.getElementById('enqLocality');
    const lmInput = document.getElementById('enqLandmark');
    const cInput = document.getElementById('enqCity');
    const stInput = document.getElementById('enqState');
    const pInput = document.getElementById('enqPincode');

    if (bInput) bInput.value = addr.address_line1 || '';
    if (sInput) sInput.value = addr.address_line2 || '';
    if (lInput) lInput.value = addr.locality || addr.address_line2 || '';
    if (lmInput) lmInput.value = addr.landmark || '';
    if (cInput) cInput.value = addr.city || '';
    if (stInput) stInput.value = addr.state || '';
    if (pInput) pInput.value = addr.pincode || '';
};

window.clearEnquiryAddressSelection = function() {
    window.activeEnquiryAddressId = null;

    document.querySelectorAll('.enq-addr-pill').forEach(btn => {
        btn.style.background = '#ffffff';
        btn.style.color = '#334155';
        btn.style.borderColor = '#cbd5e1';
        btn.classList.remove('active');
    });

    document.querySelectorAll('.enq-addr-select').forEach(sel => {
        sel.value = '';
        sel.style.background = '#ffffff';
        sel.style.color = '#334155';
        sel.style.borderColor = '#cbd5e1';
    });

    const manualBtn = document.getElementById('enqPill_manual');
    if (manualBtn) {
        manualBtn.style.background = '#0052cc';
        manualBtn.style.color = '#ffffff';
        manualBtn.style.borderColor = '#0052cc';
    }

    const bInput = document.getElementById('enqBuilding');
    const sInput = document.getElementById('enqStreet');
    const lInput = document.getElementById('enqLocality');
    const lmInput = document.getElementById('enqLandmark');
    const cInput = document.getElementById('enqCity');
    const stInput = document.getElementById('enqState');
    const pInput = document.getElementById('enqPincode');

    if (bInput) bInput.value = '';
    if (sInput) sInput.value = '';
    if (lInput) lInput.value = '';
    if (lmInput) lmInput.value = '';
    if (cInput) cInput.value = '';
    if (stInput) stInput.value = '';
    if (pInput) pInput.value = '';

    if (bInput) bInput.focus();
};

function loadAndRenderEnquiryAddresses() {
    const strip = document.getElementById('enqSavedAddrStrip');
    const pillsContainer = document.getElementById('enqSavedAddrPills');
    if (!strip || !pillsContainer) return;

    fetch('api/user/addresses.php?action=list')
        .then(r => r.json())
        .then(data => {
            if (data && data.success && Array.isArray(data.addresses) && data.addresses.length > 0) {
                const addresses = data.addresses;
                window.cachedEnquiryAddresses = addresses;

                // Group addresses by type: Home, Work, Other
                const groups = {
                    home: addresses.filter(a => (a.type || 'Home').toLowerCase() === 'home'),
                    work: addresses.filter(a => (a.type || 'Home').toLowerCase() === 'work'),
                    other: addresses.filter(a => (a.type || 'Home').toLowerCase() === 'other')
                };

                let defaultAddr = addresses.find(a => parseInt(a.is_default) === 1) || addresses[0];
                let pillsHtml = '';

                // Helper to render type pill or dropdown
                const renderGroup = (typeKey, label, icon) => {
                    const list = groups[typeKey];
                    if (!list || list.length === 0) return;

                    if (list.length === 1) {
                        const a = list[0];
                        const isDef = (parseInt(a.id) === parseInt(defaultAddr.id));
                        const safeTitle = (a.address_line1 || a.city || '').replace(/"/g, '&quot;');
                        pillsHtml += `
                            <button type="button" class="enq-addr-pill" id="enqPill_${a.id}" onclick="selectEnquirySavedAddressById(${a.id})" title="${safeTitle}" style="padding:3px 9px; border-radius:6px; font-size:0.75rem; font-weight:700; border:1px solid ${isDef ? '#0052cc' : '#cbd5e1'}; background:${isDef ? '#0052cc' : '#ffffff'}; color:${isDef ? '#ffffff' : '#334155'}; cursor:pointer; display:inline-flex; align-items:center; gap:4px; transition:all 0.15s ease;">
                                <i class="fa-solid ${icon}"></i> ${label}
                            </button>
                        `;
                    } else {
                        // Multiple addresses for same type -> render sleek mini dropdown
                        const hasDef = list.some(a => parseInt(a.id) === parseInt(defaultAddr.id));
                        pillsHtml += `
                            <div style="position:relative; display:inline-flex; align-items:center;">
                                <select class="enq-addr-select" id="enqSelect_${typeKey}" onchange="selectEnquirySavedAddressById(this.value)" style="padding:3px 8px; border-radius:6px; font-size:0.75rem; font-weight:700; border:1px solid ${hasDef ? '#0052cc' : '#cbd5e1'}; background:${hasDef ? '#eff6ff' : '#ffffff'}; color:${hasDef ? '#0052cc' : '#334155'}; cursor:pointer; outline:none; transition:all 0.15s ease; max-width:135px; text-overflow:ellipsis;">
                                    <option value="" disabled ${!hasDef ? 'selected' : ''}>${label} (${list.length}) ▾</option>
                                    ${list.map((a, i) => {
                                        const isDef = (parseInt(a.id) === parseInt(defaultAddr.id));
                                        const safeDesc = (a.address_line1 || a.city || 'Address ' + (i+1)).replace(/"/g, '&quot;');
                                        return `<option value="${a.id}" ${isDef ? 'selected' : ''}>${label} ${i+1}: ${safeDesc}</option>`;
                                    }).join('')}
                                </select>
                            </div>
                        `;
                    }
                };

                renderGroup('home', 'Home', 'fa-house');
                renderGroup('work', 'Work', 'fa-briefcase');
                renderGroup('other', 'Other', 'fa-location-dot');

                // Add manual new address button
                pillsHtml += `
                    <button type="button" class="enq-addr-pill" id="enqPill_manual" onclick="clearEnquiryAddressSelection()" title="Enter new address manually" style="padding:3px 8px; border-radius:6px; font-size:0.75rem; font-weight:700; border:1px solid #cbd5e1; background:#ffffff; color:#64748b; cursor:pointer; display:inline-flex; align-items:center; gap:4px; transition:all 0.15s ease;">
                        <i class="fa-solid fa-pen"></i> New
                    </button>
                `;

                pillsContainer.innerHTML = pillsHtml;
                strip.style.display = 'inline-flex';

                // Auto-fill default address
                if (defaultAddr) {
                    window.selectEnquirySavedAddressById(defaultAddr.id);
                }
            } else {
                strip.style.display = 'none';
            }
        })
        .catch(err => {
            strip.style.display = 'none';
        });
}

window.openEnquiryModal = function() {
    if (!window.cartManager || window.cartManager.cart.length === 0) {
        if (window.cartManager) {
            window.cartManager.showToast('Your cart is empty! Please add items to enquire.', 'error');
        } else {
            alert('Your cart is empty! Please add items to enquire.');
        }
        return;
    }

    window.cartManager.closeDrawers();

    const modal = document.getElementById('enquiryModal');
    const alertBox = document.getElementById('enquiryAlertBox');

    if (alertBox) alertBox.style.display = 'none';

    // Fetch and display saved addresses if user is logged in
    loadAndRenderEnquiryAddresses();

    // Auto-select first available payment option or fallback to direct enquiry
    const codRadio = document.getElementById('enqPayMethodCod');
    const rzpRadio = document.getElementById('enqPayMethodRazorpay');

    if (codRadio && (codRadio.checked || !rzpRadio)) {
        window.toggleEnquiryPaymentOption('cod');
    } else if (rzpRadio && rzpRadio.checked) {
        window.toggleEnquiryPaymentOption('razorpay');
    } else if (codRadio) {
        window.toggleEnquiryPaymentOption('cod');
    } else if (rzpRadio) {
        window.toggleEnquiryPaymentOption('razorpay');
    } else {
        window.selectedEnquiryPaymentMethod = '';
        window.resetEnquirySubmitButton('');
    }

    // Populate cart items preview in modal
    let total = 0;
    let totalQty = 0;
    let itemsHtml = '';

    window.cartManager.cart.forEach(item => {
        const qty = parseInt(item.quantity, 10) || 1;
        const price = Number(item.price) || 0;
        const lineTotal = price * qty;
        total += lineTotal;
        totalQty += qty;

        itemsHtml += `
            <div style="display:flex; align-items:center; justify-content:space-between; gap:0.75rem; padding:0.45rem 0; border-bottom:1px dashed #e2e8f0; font-size:0.825rem;">
                <div style="display:flex; align-items:center; gap:0.6rem; min-width:0; flex:1;">
                    <img src="${item.image}" alt="${item.name}" style="width:36px; height:36px; border-radius:4px; object-fit:cover; border:1px solid #e2e8f0; flex-shrink:0;">
                    <div style="min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                        <strong style="color:#0f172a; display:block;">${item.name}</strong>
                        <small style="color:#64748b;">${item.color || 'Standard'} &times; ${qty}</small>
                    </div>
                </div>
                <div style="font-weight:700; color:#0f172a; flex-shrink:0;">
                    ₹${lineTotal.toLocaleString('en-IN')}
                </div>
            </div>
        `;
    });

    const discountAmount = Math.round(total * ((window.cartManager.discountPercent || 0) / 100));
    const finalTotal = total - discountAmount;

    const itemCountEl = document.getElementById('enqItemCount');
    const totalAmountEl = document.getElementById('enqTotalAmount');
    const itemsListEl = document.getElementById('enqItemsList');

    if (itemCountEl) itemCountEl.textContent = totalQty;
    if (totalAmountEl) totalAmountEl.textContent = '₹' + finalTotal.toLocaleString('en-IN');
    if (itemsListEl) itemsListEl.innerHTML = itemsHtml;

    // Pre-fill logged-in user if available
    try {
        let u = window.currentUserState || null;
        if (!u) {
            u = JSON.parse(localStorage.getItem('lgf_user') || '{}');
        }
        if (u && (u.name || u.email || u.phone)) {
            const parts = (u.name || '').trim().split(' ');
            const fnInput = document.getElementById('enqFirstName');
            const lnInput = document.getElementById('enqLastName');
            const phInput = document.getElementById('enqPhone');
            const emInput = document.getElementById('enqEmail');

            if (fnInput && !fnInput.value) fnInput.value = parts[0] || '';
            if (lnInput && !lnInput.value) lnInput.value = parts.slice(1).join(' ') || '';
            if (phInput && !phInput.value) phInput.value = (u.phone || '').replace(/[^0-9]/g, '');
            if (emInput && !emInput.value) emInput.value = u.email || '';
        }
    } catch(e) {}

    if (modal) {
        modal.classList.add('active');
        document.body.classList.add('modal-open');
    }
};

window.closeEnquiryModal = function() {
    const modal = document.getElementById('enquiryModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
    }
};

// Helper: Toast inside Enquiry Popup
function showEnquiryNotice(msg, type = 'error') {
    const alertBox = document.getElementById('enquiryAlertBox');
    if (alertBox) {
        alertBox.style.display = 'block';
        if (type === 'error') {
            alertBox.style.background = '#fef2f2';
            alertBox.style.color = '#991b1b';
            alertBox.style.border = '1px solid #fecaca';
            alertBox.innerHTML = `<strong><i class="fa-solid fa-circle-exclamation"></i> Error:</strong> ${msg}`;
        } else if (type === 'warning') {
            alertBox.style.background = '#fffbeb';
            alertBox.style.color = '#92400e';
            alertBox.style.border = '1px solid #fde68a';
            alertBox.innerHTML = `<strong><i class="fa-solid fa-circle-info"></i> Notice:</strong> ${msg}`;
        } else {
            alertBox.style.background = '#ecfdf5';
            alertBox.style.color = '#047857';
            alertBox.style.border = '1px solid #a7f3d0';
            alertBox.innerHTML = `<strong><i class="fa-solid fa-circle-check"></i> Success:</strong> ${msg}`;
        }
    }
}

// Render Success UI inside Modal Container (No raw browser alert)
function renderEnquirySuccessUI(data) {
    const modalContainer = document.querySelector('#enquiryModal .modal-container');
    if (!modalContainer) return;

    const isPaid = (data.payment_status === 'Paid');
    let statusBadge = '<span style="background:#eff6ff; color:#1d4ed8; font-weight:700; padding:4px 12px; border-radius:20px; font-size:0.75rem;">Enquiry Placed</span>';
    if (isPaid) {
        statusBadge = '<span style="background:#dcfce7; color:#15803d; font-weight:700; padding:4px 12px; border-radius:20px; font-size:0.75rem;">Paid & Verified</span>';
    } else if (data.payment_method && data.payment_method.includes('COD')) {
        statusBadge = '<span style="background:#fef3c7; color:#92400e; font-weight:700; padding:4px 12px; border-radius:20px; font-size:0.75rem;">Pending (COD)</span>';
    }

    modalContainer.innerHTML = `
        <div style="text-align:center; padding:2rem 1rem;">
            <div style="width:72px; height:72px; background:#dcfce7; color:#16a34a; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 1.25rem; font-size:2rem; box-shadow:0 10px 25px rgba(22,163,74,0.2);">
                <i class="fa-solid fa-check"></i>
            </div>
            <h3 style="font-size:1.6rem; font-weight:800; color:#0f172a; margin:0 0 0.35rem;">
                ${isPaid ? 'Payment Successful!' : 'Enquiry Submitted Successfully!'}
            </h3>
            <p style="font-size:0.875rem; color:#64748b; margin:0 0 1.5rem;">
                Thank you, <strong>${data.customer_name || 'Valued Customer'}</strong>. Your product enquiry details have been recorded.
            </p>

            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:1.25rem; text-align:left; max-width:480px; margin:0 auto 1.5rem; font-size:0.875rem;">
                <div style="display:flex; justify-content:space-between; padding:0.4rem 0; border-bottom:1px solid #e2e8f0;">
                    <span style="color:#64748b;">Enquiry Reference #:</span>
                    <strong style="color:#0f172a;">${data.enquiry_number}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; padding:0.4rem 0; border-bottom:1px solid #e2e8f0;">
                    <span style="color:#64748b;">Total Amount:</span>
                    <strong style="color:#0052cc; font-size:1.05rem;">₹${Number(data.total_amount || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; padding:0.4rem 0; border-bottom:1px solid #e2e8f0;">
                    <span style="color:#64748b;">Enquiry Type:</span>
                    <strong style="color:#0f172a;">${data.payment_method || 'Product Enquiry'}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; padding:0.4rem 0; border-bottom:1px solid #e2e8f0;">
                    <span style="color:#64748b;">Status:</span>
                    <div>${statusBadge}</div>
                </div>
                ${data.transaction_id ? `
                <div style="display:flex; justify-content:space-between; padding:0.4rem 0;">
                    <span style="color:#64748b;">Transaction ID:</span>
                    <span style="font-family:monospace; color:#334155; font-size:0.8rem;">${data.transaction_id}</span>
                </div>` : ''}
            </div>

            <p style="font-size:0.8rem; color:#94a3b8; margin-bottom:1.5rem;">
                Our furniture design consultant will review your enquiry and contact you on your registered phone number shortly.
            </p>

            <div style="display:flex; gap:0.75rem; justify-content:center;">
                <button type="button" onclick="closeEnquiryModal(); window.location.reload();" style="padding:0.75rem 2rem; background:#0052cc; color:#ffffff; font-weight:800; border:none; border-radius:8px; font-size:0.9rem; cursor:pointer;">
                    Done / Continue Shopping
                </button>
            </div>
        </div>
    `;
}

window.handleEnquirySubmit = function(e) {
    if (e && e.preventDefault) e.preventDefault();

    const submitBtn = document.getElementById('enqSubmitBtn');
    const submitBtnText = document.getElementById('enqSubmitBtnText');
    const alertBox = document.getElementById('enquiryAlertBox');

    if (alertBox) alertBox.style.display = 'none';

    const hasPaymentOptions = Boolean(document.querySelector('input[name="enq_payment_method"]'));
    const selectedRadio = document.querySelector('input[name="enq_payment_method"]:checked');
    const selectedMethod = selectedRadio ? selectedRadio.value : (hasPaymentOptions ? (window.selectedEnquiryPaymentMethod || 'cod') : 'enquiry');

    const firstName = document.getElementById('enqFirstName')?.value.trim() || '';
    const lastName  = document.getElementById('enqLastName')?.value.trim() || '';
    const fullName  = `${firstName} ${lastName}`.trim();
    const phone     = document.getElementById('enqPhone')?.value.trim() || '';
    const email     = document.getElementById('enqEmail')?.value.trim() || '';

    const buildingName = document.getElementById('enqBuilding')?.value.trim() || '';
    const street       = document.getElementById('enqStreet')?.value.trim() || '';
    const locality     = document.getElementById('enqLocality')?.value.trim() || '';
    const landmark     = document.getElementById('enqLandmark')?.value.trim() || '';
    const city         = document.getElementById('enqCity')?.value.trim() || '';
    const state        = document.getElementById('enqState')?.value.trim() || '';
    const pincode      = document.getElementById('enqPincode')?.value.trim() || '';
    const deliveryNotes= document.getElementById('enqDeliveryNotes')?.value.trim() || '';

    if (!firstName || !lastName || !phone || !email || !buildingName || !street || !locality || !city || !state || !pincode) {
        showEnquiryNotice('Please fill in all required contact details and delivery address fields.');
        return;
    }

    const cartItems = (window.cartManager && window.cartManager.cart) ? window.cartManager.cart : [];
    if (!cartItems.length) {
        showEnquiryNotice('Your cart is empty! Please add products to cart before placing an enquiry.');
        return;
    }

    let subtotal = 0;
    cartItems.forEach(i => subtotal += (Number(i.price) || 0) * (parseInt(i.quantity, 10) || 1));
    const discountAmount = Math.round(subtotal * ((window.cartManager.discountPercent || 0) / 100));
    const finalTotal = Math.max(0, subtotal - discountAmount);

    const basePayload = {
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        email: email,
        building_name: buildingName,
        street: street,
        locality: locality,
        landmark: landmark,
        city: city,
        state: state,
        pincode: pincode,
        delivery_notes: deliveryNotes,
        discount_amount: discountAmount,
        total_amount: finalTotal,
        items: cartItems.map(i => ({
            id: i.id,
            name: i.title,
            color: i.color || 'Standard',
            quantity: i.quantity,
            price: i.price,
            image: i.image
        }))
    };

    // Helper: Execute Final Backend Order / Enquiry Submission
    function executeEnquirySubmission(finalPayload) {
        window.setEnquirySubmitButtonLoading('Submitting Enquiry...');

        fetch('api/submit_enquiry.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalPayload)
        })
        .then(r => r.json())
        .then(data => {
            if (data.status === 'success') {
                // Clear Cart
                if (window.cartManager) {
                    window.cartManager.cart = [];
                    window.cartManager.saveCart();
                    window.cartManager.updateBadges();
                    window.cartManager.renderCartDrawer();
                    if (typeof window.renderCartPage === 'function') {
                        window.renderCartPage();
                    }
                }

                // Render Success Card UI inside Modal
                renderEnquirySuccessUI(data);
            } else {
                throw new Error(data.message || 'Failed to process enquiry.');
            }
        })
        .catch(err => {
            window.resetEnquirySubmitButton(selectedMethod);
            showEnquiryNotice(err.message || 'Connection error. Please try again.');
        });
    }

    // === FLOW 1: PAYMENT DISABLED OR DIRECT PRODUCT ENQUIRY ===
    if (!hasPaymentOptions || selectedMethod === 'enquiry') {
        executeEnquirySubmission({
            ...basePayload,
            payment_method: 'Product Enquiry (Quotation Request)'
        });
        return;
    }

    // === FLOW 2: CASH ON DELIVERY (COD) ===
    if (selectedMethod === 'cod') {
        executeEnquirySubmission({
            ...basePayload,
            payment_method: 'Cash on Delivery (COD)'
        });
        return;
    }

    // === FLOW 3: OFFICIAL RAZORPAY ONLINE PAYMENT GATEWAY ===
    if (selectedMethod === 'razorpay') {
        window.setEnquirySubmitButtonLoading('Processing Payment...');

        // Step 1: Create Razorpay Order on Backend
        fetch('api/create_razorpay_order.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: finalTotal,
                customer_name: fullName,
                customer_phone: phone,
                customer_email: email,
                payment_method: 'razorpay'
            })
        })
        .then(res => res.json())
        .then(orderData => {
            if (orderData.status !== 'success') {
                window.resetEnquirySubmitButton('razorpay');
                showEnquiryNotice(orderData.message || 'Could not initialize Razorpay order. Please try again.');
                return;
            }

            const demoTxnId = 'DEMO_TXN_' + Date.now() + '_' + Math.floor(1000 + Math.random() * 9000);
            const demoOrderId = orderData.order_id || ('DEMO_ORD_' + Date.now());

            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: 'MODERNO Demo Payment',
                    text: `Simulating instant Demo Payment of ₹${(Number(orderData.amount_raw) || totalAmount).toLocaleString('en-IN')}...`,
                    icon: 'info',
                    showCancelButton: true,
                    confirmButtonColor: '#16a34a',
                    confirmButtonText: 'Complete Demo Payment (Success)',
                    cancelButtonText: 'Cancel'
                }).then((result) => {
                    if (result.isConfirmed) {
                        executeEnquirySubmission({
                            ...basePayload,
                            payment_method: 'Demo Online Payment (Simulated)',
                            transaction_id: demoTxnId,
                            order_id: demoOrderId,
                            payment_status: 'Paid'
                        });
                    } else {
                        window.resetEnquirySubmitButton('razorpay');
                    }
                });
            } else {
                executeEnquirySubmission({
                    ...basePayload,
                    payment_method: 'Demo Online Payment (Simulated)',
                    transaction_id: demoTxnId,
                    order_id: demoOrderId,
                    payment_status: 'Paid'
                });
            }
        })
        .catch(err => {
            console.error(err);
            window.resetEnquirySubmitButton('razorpay');
            showEnquiryNotice('Failed to connect to payment server. Please try again.');
        });
        return;
    }

    // Fallback: Direct Enquiry
    executeEnquirySubmission({
        ...basePayload,
        payment_method: 'Product Enquiry (Quotation Request)'
    });
};
