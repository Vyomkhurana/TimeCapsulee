// Modern Authentication JavaScript

// Toggle password visibility
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

if (togglePassword) {
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        togglePassword.innerHTML = type === 'password' 
            ? '<i class="fas fa-eye"></i>' 
            : '<i class="fas fa-eye-slash"></i>';
    });
}

// Form validation functions
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

function showError(inputId, message) {
    const input = document.getElementById(inputId);
    const errorText = document.getElementById(`${inputId}Error`);
    
    if (input) input.classList.add('error');
    if (errorText) {
        errorText.textContent = message;
        errorText.classList.add('show');
    }
}

function clearError(inputId) {
    const input = document.getElementById(inputId);
    const errorText = document.getElementById(`${inputId}Error`);
    
    if (input) input.classList.remove('error');
    if (errorText) {
        errorText.textContent = '';
        errorText.classList.remove('show');
    }
}

function showAlert(message, type = 'error') {
    const alertElement = document.getElementById('errorAlert');
    const messageElement = document.getElementById('errorMessage');
    
    if (alertElement && messageElement) {
        messageElement.textContent = message;
        alertElement.className = `alert alert-${type}`;
        alertElement.style.display = 'flex';
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            alertElement.style.display = 'none';
        }, 5000);
    }
}

function hideAlert() {
    const alertElement = document.getElementById('errorAlert');
    if (alertElement) {
        alertElement.style.display = 'none';
    }
}

// Real-time validation
const emailInput = document.getElementById('email');
if (emailInput) {
    emailInput.addEventListener('blur', () => {
        const email = emailInput.value.trim();
        if (email && !validateEmail(email)) {
            showError('email', 'Please enter a valid email address');
        } else {
            clearError('email');
        }
    });

    emailInput.addEventListener('input', () => {
        clearError('email');
        hideAlert();
    });
}

if (passwordInput) {
    passwordInput.addEventListener('input', () => {
        clearError('password');
        hideAlert();
    });
}

// Login Form Submission
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Clear previous errors
        clearError('email');
        clearError('password');
        hideAlert();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        // Validation
        let hasError = false;
        
        if (!email) {
            showError('email', 'Email is required');
            hasError = true;
        } else if (!validateEmail(email)) {
            showError('email', 'Please enter a valid email address');
            hasError = true;
        }
        
        if (!password) {
            showError('password', 'Password is required');
            hasError = true;
        } else if (!validatePassword(password)) {
            showError('password', 'Password must be at least 6 characters');
            hasError = true;
        }
        
        if (hasError) return;
        
        // Show loading state
        const loginBtn = document.getElementById('loginBtn');
        loginBtn.classList.add('loading');
        loginBtn.disabled = true;
        
        try {
            const response = await fetch('/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                // Show success message
                showAlert('Login successful! Redirecting...', 'success');
                
                // Redirect to dashboard after a short delay
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1500);
            } else {
                // Show error message
                showAlert(data.error || 'Login failed. Please try again.');
                loginBtn.classList.remove('loading');
                loginBtn.disabled = false;
            }
        } catch (error) {
            console.error('Login error:', error);
            showAlert('An error occurred. Please try again later.');
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
        }
    });
}

// Signup Form Submission
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const termsCheckbox = document.getElementById('terms');
    
    // Toggle confirm password visibility
    if (toggleConfirmPassword) {
        toggleConfirmPassword.addEventListener('click', () => {
            const type = confirmPasswordInput.type === 'password' ? 'text' : 'password';
            confirmPasswordInput.type = type;
            toggleConfirmPassword.innerHTML = type === 'password' 
                ? '<i class="fas fa-eye"></i>' 
                : '<i class="fas fa-eye-slash"></i>';
        });
    }
    
    // Password strength indicator
    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            const password = passwordInput.value;
            const strengthIndicator = document.getElementById('passwordStrength');
            
            if (strengthIndicator) {
                let strength = 'weak';
                let color = 'var(--error)';
                let width = '33%';
                
                if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
                    strength = 'strong';
                    color = 'var(--success)';
                    width = '100%';
                } else if (password.length >= 6 && (/[A-Z]/.test(password) || /[0-9]/.test(password))) {
                    strength = 'medium';
                    color = 'var(--warning)';
                    width = '66%';
                }
                
                const bar = strengthIndicator.querySelector('.strength-bar');
                const text = strengthIndicator.querySelector('.strength-text');
                
                if (bar) {
                    bar.style.width = width;
                    bar.style.background = color;
                }
                
                if (text) {
                    text.textContent = `Password strength: ${strength}`;
                    text.style.color = color;
                }
                
                strengthIndicator.style.display = password ? 'block' : 'none';
            }
        });
    }
    
    // Confirm password validation
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('blur', () => {
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            
            if (confirmPassword && password !== confirmPassword) {
                showError('confirmPassword', 'Passwords do not match');
            } else {
                clearError('confirmPassword');
            }
        });
        
        confirmPasswordInput.addEventListener('input', () => {
            clearError('confirmPassword');
        });
    }
    
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Clear previous errors
        ['username', 'email', 'password', 'confirmPassword', 'terms'].forEach(clearError);
        hideAlert();
        
        const username = document.getElementById('username').value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const terms = termsCheckbox.checked;
        
        // Validation
        let hasError = false;
        
        if (!username) {
            showError('username', 'Username is required');
            hasError = true;
        } else if (username.length < 3) {
            showError('username', 'Username must be at least 3 characters');
            hasError = true;
        }
        
        if (!email) {
            showError('email', 'Email is required');
            hasError = true;
        } else if (!validateEmail(email)) {
            showError('email', 'Please enter a valid email address');
            hasError = true;
        }
        
        if (!password) {
            showError('password', 'Password is required');
            hasError = true;
        } else if (!validatePassword(password)) {
            showError('password', 'Password must be at least 6 characters');
            hasError = true;
        }
        
        if (!confirmPassword) {
            showError('confirmPassword', 'Please confirm your password');
            hasError = true;
        } else if (password !== confirmPassword) {
            showError('confirmPassword', 'Passwords do not match');
            hasError = true;
        }
        
        if (!terms) {
            showError('terms', 'You must accept the terms and conditions');
            showAlert('Please accept the terms and conditions to continue');
            hasError = true;
        }
        
        if (hasError) return;
        
        // Show loading state
        const signupBtn = document.getElementById('signupBtn');
        signupBtn.classList.add('loading');
        signupBtn.disabled = true;
        
        try {
            const response = await fetch('/users/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    confirmPassword,
                    terms
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                // Show success message
                showAlert('Account created successfully! Redirecting...', 'success');
                
                // Redirect to dashboard after a short delay
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1500);
            } else {
                // Show error message
                showAlert(data.error || 'Signup failed. Please try again.');
                signupBtn.classList.remove('loading');
                signupBtn.disabled = false;
            }
        } catch (error) {
            console.error('Signup error:', error);
            showAlert('An error occurred. Please try again later.');
            signupBtn.classList.remove('loading');
            signupBtn.disabled = false;
        }
    });
}

// Social login placeholders
const socialButtons = document.querySelectorAll('.btn-social');
socialButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        showAlert('Social login coming soon! Please use email login.', 'info');
    });
});

// Smooth animations on load
document.addEventListener('DOMContentLoaded', () => {
    const authBox = document.querySelector('.auth-box');
    if (authBox) {
        authBox.style.opacity = '0';
        authBox.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            authBox.style.transition = 'all 0.6s ease';
            authBox.style.opacity = '1';
            authBox.style.transform = 'translateY(0)';
        }, 100);
    }
});

// Add input focus effects
document.querySelectorAll('.form-group input').forEach(input => {
    input.addEventListener('focus', () => {
        input.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', () => {
        if (!input.value) {
            input.parentElement.classList.remove('focused');
        }
    });
});
