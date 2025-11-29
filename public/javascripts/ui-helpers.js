class NotificationSystem {
    constructor() {
        this.container = null;
        this.init();
    }
    init() {
        if (!document.getElementById('notification-container')) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 12px;
                max-width: 400px;
            `;
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('notification-container');
        }
    }
    show(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#4a90e2'
        };
        notification.style.cssText = `
            padding: 16px 20px;
            background: white;
            border-left: 4px solid ${colors[type]};
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 12px;
            animation: slideInRight 0.4s ease-out;
            cursor: pointer;
            transition: all 0.3s ease;
            outline: none;
        `;
        
        notification.setAttribute('tabindex', '0');
        notification.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                notification.remove();
            }
        });
        notification.innerHTML = `
            <div style="
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: ${colors[type]};
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 14px;
                flex-shrink: 0;
            ">${icons[type]}</div>
            <div style="flex: 1; color: #2c3e50; font-size: 14px;">${message}</div>
            <button onclick="this.parentElement.remove()" style="
                background: none;
                border: none;
                color: #7f8c8d;
                font-size: 20px;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            ">×</button>
        `;
        notification.addEventListener('mouseenter', () => {
            notification.style.transform = 'translateX(-5px)';
            notification.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
        });
        notification.addEventListener('mouseleave', () => {
            notification.style.transform = 'translateX(0)';
            notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        });
        this.container.appendChild(notification);
        if (duration > 0) {
            setTimeout(() => {
                notification.style.animation = 'slideOutRight 0.4s ease-out';
                setTimeout(() => notification.remove(), 400);
            }, duration);
        }
        return notification;
    }
    success(message, duration) {
        return this.show(message, 'success', duration);
    }
    error(message, duration) {
        return this.show(message, 'error', duration);
    }
    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }
    info(message, duration) {
        return this.show(message, 'info', duration);
    }
}
const notify = new NotificationSystem();
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
function showLoader(message = 'Loading...') {
    let loader = document.getElementById('global-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.95);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            backdrop-filter: blur(5px);
        `;
        loader.innerHTML = `
            <div style="
                width: 60px;
                height: 60px;
                border: 4px solid rgba(74, 144, 226, 0.2);
                border-top-color: #4a90e2;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            "></div>
            <p style="
                margin-top: 20px;
                color: #2c3e50;
                font-size: 16px;
                font-weight: 500;
            ">${message}</p>
        `;
        document.body.appendChild(loader);
        const spinStyle = document.createElement('style');
        spinStyle.textContent = `
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(spinStyle);
    }
    return loader;
}
function hideLoader() {
    const loader = document.getElementById('global-loader');
    if (loader) {
        loader.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => loader.remove(), 300);
    }
}
function showConfirm(title, message, onConfirm, onCancel) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        animation: fadeIn 0.3s ease-out;
    `;
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
        animation: scaleUp 0.3s ease-out;
    `;
    dialog.innerHTML = `
        <h3 style="margin: 0 0 12px; color: #2c3e50; font-size: 1.5rem;">${title}</h3>
        <p style="margin: 0 0 24px; color: #7f8c8d; font-size: 1rem; line-height: 1.6;">${message}</p>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button id="cancel-btn" style="
                padding: 10px 20px;
                border: 2px solid #e0e6ed;
                background: white;
                border-radius: 8px;
                color: #7f8c8d;
                font-size: 1rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
            ">Cancel</button>
            <button id="confirm-btn" style="
                padding: 10px 20px;
                border: none;
                background: linear-gradient(135deg, #4a90e2, #357abd);
                border-radius: 8px;
                color: white;
                font-size: 1rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
            ">Confirm</button>
        </div>
    `;
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    const animStyle = document.createElement('style');
    animStyle.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes scaleUp {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
    `;
    document.head.appendChild(animStyle);
    const closeDialog = () => {
        overlay.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => overlay.remove(), 300);
    };
    dialog.querySelector('#cancel-btn').onclick = () => {
        if (onCancel) onCancel();
        closeDialog();
    };
    dialog.querySelector('#confirm-btn').onclick = () => {
        if (onConfirm) onConfirm();
        closeDialog();
    };
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            if (onCancel) onCancel();
            closeDialog();
        }
    };
}
function smoothScrollTo(element, duration = 800) {
    const target = typeof element === 'string' ? document.querySelector(element) : element;
    if (!target) return;
    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;
    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const run = ease(timeElapsed, startPosition, distance, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) requestAnimationFrame(animation);
    }
    function ease(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }
    requestAnimationFrame(animation);
}
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        notify.success('Copied to clipboard!');
        return true;
    } catch (err) {
        notify.error('Failed to copy');
        return false;
    }
}
function formatDate(date, format = 'MMM DD, YYYY') {
    const d = new Date(date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formatted = format
        .replace('YYYY', d.getFullYear())
        .replace('MM', String(d.getMonth() + 1).padStart(2, '0'))
        .replace('MMM', months[d.getMonth()])
        .replace('DD', String(d.getDate()).padStart(2, '0'))
        .replace('HH', String(d.getHours()).padStart(2, '0'))
        .replace('mm', String(d.getMinutes()).padStart(2, '0'));
    return formatted;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { notify, showLoader, hideLoader, showConfirm, smoothScrollTo, debounce, copyToClipboard, formatDate };
}
