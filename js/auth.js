/**
 * MODERNO - Authentication & User Session Manager
 * Dynamic User Registration, Login, Profile State & Logout Flow
 */

document.addEventListener('DOMContentLoaded', function () {
    initAuthModule();
});

let currentUserState = null;

// Resolve the base path to api/auth.php regardless of current page depth
var AUTH_API_URL = (function () {
    // Find the script tag for auth.js and derive the base path from it
    var scripts = document.querySelectorAll('script[src]');
    for (var i = 0; i < scripts.length; i++) {
        var src = scripts[i].getAttribute('src');
        if (src && src.indexOf('auth.js') !== -1) {
            // e.g. "js/auth.js" or "/modernov1/js/auth.js"
            return src.replace(/js\/auth\.js.*$/, 'api/auth.php');
        }
    }
    // Fallback: use pathname-based detection
    var path = window.location.pathname;
    var parts = path.split('/');
    // Remove last segment (current file name like "account.php")
    parts.pop();
    return parts.join('/') + '/api/auth.php';
})();

function initAuthModule() {
    checkCurrentUserSession();
}

/**
 * Check logged-in user session from backend API
 */
function checkCurrentUserSession() {
    fetch(AUTH_API_URL + '?action=me', {
        method: 'GET',
        credentials: 'same-origin'
    })
        .then(res => res.json())
        .then(data => {
            if (data && data.logged_in && data.user) {
                currentUserState = data.user;
                updateHeaderUserUI(data.user);
                updateAccountPageUI(data.user);
                if (window.cartManager) {
                    window.cartManager.setUser(data.user.id);
                }
            } else {
                currentUserState = null;
                updateHeaderUserUI(null);
                updateAccountPageUI(null);
                if (window.cartManager) {
                    window.cartManager.setUser(null);
                }
            }
        })
        .catch(err => {
            console.error('Auth session check error:', err);
        });
}

/**
 * Update Header and Navigation UI based on Auth State
 */
function updateHeaderUserUI(user) {
    const headerAccountName = document.getElementById('headerAccountName');
    const mobileBottomAccountLabel = document.getElementById('mobileBottomAccountLabel');

    if (user) {
        const firstName = user.name.split(' ')[0];
        const formatted = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
        if (headerAccountName) {
            headerAccountName.textContent = 'Hello, ' + formatted;
        }
        if (mobileBottomAccountLabel) {
            mobileBottomAccountLabel.textContent = formatted;
        }
    } else {
        if (headerAccountName) {
            headerAccountName.textContent = 'Account';
        }
        if (mobileBottomAccountLabel) {
            mobileBottomAccountLabel.textContent = 'Account';
        }
    }
}

/**
 * Dynamically Sync Account Page View (Logged-in vs Logged-out)
 */
function updateAccountPageUI(user) {
    const loggedInView = document.getElementById('accountLoggedInView');
    const loggedOutView = document.getElementById('accountLoggedOutView');
    const welcomeHeader = document.getElementById('userWelcomeHeader');
    const profileName = document.getElementById('userProfileName');
    const profileEmail = document.getElementById('userProfileEmail');
    const profilePhone = document.getElementById('userProfilePhone');
    const profileAvatar = document.getElementById('userProfileAvatar');
    const sidebarName = document.getElementById('userSidebarName');
    const sidebarEmail = document.getElementById('userSidebarEmail');

    if (user) {
        const formattedName = user.name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

        if (loggedInView) loggedInView.style.display = 'block';
        if (loggedOutView) loggedOutView.style.display = 'none';

        if (welcomeHeader) welcomeHeader.textContent = 'Hello, ' + formattedName;
        if (profileName) profileName.textContent = formattedName;
        if (profileEmail) profileEmail.textContent = user.email;
        if (profilePhone) profilePhone.textContent = user.phone;
        if (sidebarName) sidebarName.textContent = formattedName;
        if (sidebarEmail) sidebarEmail.textContent = user.email;
        if (profileAvatar) profileAvatar.textContent = formattedName.charAt(0).toUpperCase();
    } else {
        if (loggedInView) loggedInView.style.display = 'none';
        if (loggedOutView) loggedOutView.style.display = 'block';
    }
}

/**
 * Intercept Account Button Click
 * If logged in -> Navigate to account.php
 * If logged out -> Open Login / Register Modal
 */
window.handleAccountButtonClick = function(event) {
    if (event) event.preventDefault();
    if (currentUserState) {
        window.location.href = 'account.php';
    } else {
        openLoginModal();
    }
};

/**
 * Intercept Wishlist Button Click
 * If logged in -> Open Wishlist Drawer or Navigate to wishlist
 * If logged out -> Open Sign In / Login Modal
 */
window.handleWishlistButtonClick = function(event) {
    if (event) event.preventDefault();
    var isLoggedIn = (typeof window.isUserLoggedIn !== 'undefined' && window.isUserLoggedIn === true) ||
                     (typeof currentUserState !== 'undefined' && currentUserState !== null && currentUserState.id);
    if (isLoggedIn) {
        if (typeof cartManager !== 'undefined' && typeof cartManager.openWishlist === 'function') {
            cartManager.openWishlist();
        } else {
            window.location.href = 'wishlist';
        }
    } else {
        if (typeof openLoginModal === 'function') {
            openLoginModal();
        } else {
            var modal = document.getElementById('loginModal');
            if (modal) {
                modal.classList.add('active');
                document.body.classList.add('modal-open');
                document.body.style.overflow = 'hidden';
            }
        }
    }
};

/**
 * Switch Auth Modal Tabs (Sign In vs Create Account)
 */
window.switchAuthTab = function(tabName) {
    const loginFormBox = document.getElementById('loginTabBox');
    const registerFormBox = document.getElementById('registerTabBox');
    const loginTabBtn = document.getElementById('loginTabBtn');
    const registerTabBtn = document.getElementById('registerTabBtn');
    const alertBox = document.getElementById('authModalAlert');

    if (alertBox) alertBox.style.display = 'none';

    if (tabName === 'register') {
        if (loginFormBox) loginFormBox.style.display = 'none';
        if (registerFormBox) registerFormBox.style.display = 'block';
        if (loginTabBtn) {
            loginTabBtn.style.color = '#64748b';
            loginTabBtn.style.fontWeight = '500';
            loginTabBtn.style.borderBottom = '2px solid transparent';
        }
        if (registerTabBtn) {
            registerTabBtn.style.color = '#0B5394';
            registerTabBtn.style.fontWeight = '600';
            registerTabBtn.style.borderBottom = '2px solid #0B5394';
        }
    } else {
        if (registerFormBox) registerFormBox.style.display = 'none';
        if (loginFormBox) loginFormBox.style.display = 'block';
        if (registerTabBtn) {
            registerTabBtn.style.color = '#64748b';
            registerTabBtn.style.fontWeight = '500';
            registerTabBtn.style.borderBottom = '2px solid transparent';
        }
        if (loginTabBtn) {
            loginTabBtn.style.color = '#0B5394';
            loginTabBtn.style.fontWeight = '600';
            loginTabBtn.style.borderBottom = '2px solid #0B5394';
        }
    }
};

/**
 * Handle Registration Form Submission
 */
window.handleUserRegistration = function(event) {
    event.preventDefault();
    const form = event.target;
    const name = form.querySelector('[name="name"]').value.trim();
    const email = form.querySelector('[name="email"]').value.trim();
    const phone = form.querySelector('[name="phone"]').value.trim();
    const password = form.querySelector('[name="password"]').value;
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!name || !email || !phone || !password) {
        showAuthAlert('danger', 'Please fill in all required fields.');
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating Account...';
    }

    fetch(AUTH_API_URL + '?action=register', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password })
    })
    .then(res => res.json())
    .then(data => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Account';
        }

        if (data.success) {
            showAuthAlert('success', 'Account Created Successfully!');
            currentUserState = data.user;
            updateHeaderUserUI(data.user);
            if (window.cartManager) {
                window.cartManager.setUser(data.user.id);
            }

            setTimeout(() => {
                closeModals();
                window.location.href = 'account.php';
            }, 1000);
        } else {
            showAuthAlert('danger', data.message || 'Registration failed.');
        }
    })
    .catch(err => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Account';
        }
        showAuthAlert('danger', 'Server error. Please try again.');
    });
};

/**
 * Handle Login Form Submission
 */
window.handleUserLoginSubmit = function(event) {
    event.preventDefault();
    const form = event.target;
    const identifier = form.querySelector('[name="identifier"]').value.trim();
    const password = form.querySelector('[name="password"]').value;
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!identifier || !password) {
        showAuthAlert('danger', 'Please enter your Email/Phone and Password.');
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing In...';
    }

    fetch(AUTH_API_URL + '?action=login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
    })
    .then(res => res.json())
    .then(data => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
        }

        if (data.success) {
            showAuthAlert('success', 'Logged in successfully!');
            currentUserState = data.user;
            updateHeaderUserUI(data.user);
            if (window.cartManager) {
                window.cartManager.setUser(data.user.id);
            }

            setTimeout(() => {
                closeModals();
                window.location.href = 'account.php';
            }, 800);
        } else {
            showAuthAlert('danger', data.message || 'Invalid credentials.');
        }
    })
    .catch(err => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
        }
        showAuthAlert('danger', 'Server error. Please try again.');
    });
};

/**
 * Handle User Logout
 */
window.handleUserLogout = function() {
    const doLogout = function() {
        fetch(AUTH_API_URL + '?action=logout', {
            method: 'GET',
            credentials: 'same-origin'
        })
            .then(res => res.json())
            .then(data => {
                currentUserState = null;
                updateHeaderUserUI(null);
                updateAccountPageUI(null);
                if (window.cartManager) {
                    window.cartManager.setUser(null);
                }
                if (window.location.pathname.includes('account') || window.location.pathname.includes('wishlist')) {
                    window.location.href = 'index.php';
                }
            })
            .catch(err => {
                currentUserState = null;
                updateHeaderUserUI(null);
                updateAccountPageUI(null);
                if (window.cartManager) {
                    window.cartManager.setUser(null);
                }
                if (window.location.pathname.includes('account') || window.location.pathname.includes('wishlist')) {
                    window.location.href = 'index.php';
                }
            });
    };

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Sign Out of Account?',
            text: 'Are you sure you want to sign out of your MODERNO account?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#0052cc',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, Sign Out',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                doLogout();
            }
        });
    } else {
        doLogout();
    }
};

/**
 * Show Alert Banner inside Auth Modal
 */
function showAuthAlert(type, message) {
    let alertBox = document.getElementById('authModalAlert');
    if (!alertBox) return;

    alertBox.style.display = 'block';
    if (type === 'success') {
        alertBox.style.background = '#ecfdf5';
        alertBox.style.color = '#047857';
        alertBox.style.border = '1px solid #a7f3d0';
    } else {
        alertBox.style.background = '#fef2f2';
        alertBox.style.color = '#dc2626';
        alertBox.style.border = '1px solid #fecaca';
    }
    alertBox.style.padding = '0.75rem 1rem';
    alertBox.style.borderRadius = '8px';
    alertBox.style.marginBottom = '1.25rem';
    alertBox.style.fontSize = '0.875rem';
    alertBox.style.fontWeight = '600';
    alertBox.style.textAlign = 'center';
    alertBox.innerHTML = message;
}

window.switchToOtpLogin = function(event) {
    if (event) event.preventDefault();
    const pwForm = document.getElementById('loginPasswordFormBox');
    const otpForm = document.getElementById('loginOtpFormBox');
    const alertBox = document.getElementById('authModalAlert');
    if (alertBox) alertBox.style.display = 'none';
    if (pwForm) pwForm.style.display = 'none';
    if (otpForm) otpForm.style.display = 'block';
};

window.switchToPasswordLogin = function(event) {
    if (event) event.preventDefault();
    const pwForm = document.getElementById('loginPasswordFormBox');
    const otpForm = document.getElementById('loginOtpFormBox');
    const alertBox = document.getElementById('authModalAlert');
    if (alertBox) alertBox.style.display = 'none';
    if (otpForm) otpForm.style.display = 'none';
    if (pwForm) pwForm.style.display = 'block';
};

let otpTimer = null;
window.sendLoginOtp = function(event) {
    if (event) event.preventDefault();
    const phoneInput = document.getElementById('otpPhoneInput');
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const sendBtn = document.getElementById('sendOtpBtn');

    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
        showAuthAlert('danger', 'Please enter a valid 10-digit mobile number.');
        return;
    }

    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.textContent = 'Sending...';
    }

    // Resolve URL to api/send_otp.php relative to AUTH_API_URL
    const sendOtpUrl = AUTH_API_URL.replace('auth.php', 'send_otp.php');

    fetch(sendOtpUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone, purpose: 'login' })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            showAuthAlert('success', data.message || 'OTP sent successfully!');
            document.getElementById('otpCodeInputContainer').style.display = 'block';
            document.getElementById('otpSubmitBtn').style.display = 'block';
            
            // Start countdown cooldown for send button
            let cooldown = data.cooldown_seconds || 60;
            if (otpTimer) clearInterval(otpTimer);
            otpTimer = setInterval(() => {
                cooldown--;
                if (cooldown <= 0) {
                    clearInterval(otpTimer);
                    sendBtn.disabled = false;
                    sendBtn.textContent = 'Resend OTP';
                } else {
                    sendBtn.textContent = `Retry in ${cooldown}s`;
                }
            }, 1000);
        } else {
            sendBtn.disabled = false;
            sendBtn.textContent = 'Send OTP';
            showAuthAlert('danger', data.message || 'Failed to send OTP. Please try again.');
        }
    })
    .catch(err => {
        console.error('Send OTP Error:', err);
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send OTP';
        showAuthAlert('danger', 'Network error. Please check connection and try again.');
    });
};

window.handleUserOtpLoginSubmit = function(event) {
    event.preventDefault();
    const phone = document.getElementById('otpPhoneInput').value.trim();
    const otp = document.getElementById('otpCodeInput').value.trim();
    const submitBtn = document.getElementById('otpSubmitBtn');

    if (!phone || !otp) {
        showAuthAlert('danger', 'Please enter both mobile number and OTP.');
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Verifying...';
    }

    fetch(AUTH_API_URL + '?action=login_otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone, otp: otp })
    })
    .then(res => res.json())
    .then(data => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Verify & Sign In';
        }

        if (data.success) {
            showAuthAlert('success', 'OTP verified & logged in successfully!');
            currentUserState = data.user;
            updateHeaderUserUI(data.user);
            if (window.cartManager) {
                window.cartManager.setUser(data.user.id);
            }

            setTimeout(() => {
                closeModals();
                window.location.href = 'account.php';
            }, 800);
        } else {
            showAuthAlert('danger', data.message || 'Verification failed. Please try again.');
        }
    })
    .catch(err => {
        console.error('OTP Login Error:', err);
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Verify & Sign In';
        }
        showAuthAlert('danger', 'Server error. Please try again.');
    });
};
