// Enhanced Progress Indicators and Loading States
class ProgressIndicator {
    constructor() {
        this.init();
    }

    init() {
        this.createProgressBar();
        this.setupPageLoadProgress();
    }

    // Top progress bar for page loads and AJAX requests
    createProgressBar() {
        const progressBar = document.createElement('div');
        progressBar.id = 'top-progress-bar';
        progressBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            height: 3px;
            background: linear-gradient(90deg, #4a90e2, #2ecc71, #e74c3c);
            width: 0%;
            z-index: 99999;
            transition: width 0.3s ease;
            box-shadow: 0 0 10px rgba(74, 144, 226, 0.5);
        `;
        document.body.appendChild(progressBar);
    }

    // Show and animate progress bar
    show(duration = 2000) {
        const bar = document.getElementById('top-progress-bar');
        if (!bar) return;

        bar.style.width = '0%';
        bar.style.opacity = '1';

        // Animate to 90%
        setTimeout(() => {
            bar.style.width = '30%';
        }, 100);

        setTimeout(() => {
            bar.style.width = '70%';
        }, duration / 2);

        setTimeout(() => {
            bar.style.width = '90%';
        }, duration);
    }

    // Complete progress bar
    complete() {
        const bar = document.getElementById('top-progress-bar');
        if (!bar) return;

        bar.style.width = '100%';
        setTimeout(() => {
            bar.style.opacity = '0';
            setTimeout(() => {
                bar.style.width = '0%';
            }, 300);
        }, 200);
    }

    // Setup automatic progress for page loads
    setupPageLoadProgress() {
        // Show progress on page navigation
        window.addEventListener('beforeunload', () => {
            this.show();
        });

        // Complete progress on page load
        window.addEventListener('load', () => {
            this.complete();
        });

        // Intercept fetch requests
        const originalFetch = window.fetch;
        window.fetch = (...args) => {
            this.show(1500);
            return originalFetch(...args).finally(() => {
                this.complete();
            });
        };
    }

    // Create circular progress
    createCircular(percentage, size = 100) {
        const container = document.createElement('div');
        container.className = 'circular-progress';
        container.style.cssText = `
            position: relative;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: conic-gradient(
                #4a90e2 ${percentage * 3.6}deg,
                #e0e6ed ${percentage * 3.6}deg
            );
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const inner = document.createElement('div');
        inner.style.cssText = `
            width: ${size - 20}px;
            height: ${size - 20}px;
            border-radius: 50%;
            background: var(--card-bg);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: ${size / 4}px;
            color: var(--text-color);
        `;
        inner.textContent = `${Math.round(percentage)}%`;

        container.appendChild(inner);
        return container;
    }

    // Create linear progress bar
    createLinear(percentage, label = '') {
        const container = document.createElement('div');
        container.className = 'linear-progress';
        container.style.cssText = `
            width: 100%;
            margin: 10px 0;
        `;

        if (label) {
            const labelDiv = document.createElement('div');
            labelDiv.style.cssText = `
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
                font-size: 0.875rem;
                color: var(--text-light);
            `;
            labelDiv.innerHTML = `
                <span>${label}</span>
                <span>${Math.round(percentage)}%</span>
            `;
            container.appendChild(labelDiv);
        }

        const track = document.createElement('div');
        track.style.cssText = `
            width: 100%;
            height: 8px;
            background: var(--border-color);
            border-radius: 10px;
            overflow: hidden;
        `;

        const fill = document.createElement('div');
        fill.style.cssText = `
            height: 100%;
            width: ${percentage}%;
            background: linear-gradient(90deg, #4a90e2, #2ecc71);
            border-radius: 10px;
            transition: width 0.5s ease;
            box-shadow: 0 0 10px rgba(74, 144, 226, 0.5);
        `;

        track.appendChild(fill);
        container.appendChild(track);
        return container;
    }

    // Create skeleton loader
    createSkeleton(config = {}) {
        const {
            width = '100%',
            height = '20px',
            borderRadius = '4px',
            count = 1,
            gap = '10px'
        } = config;

        const container = document.createElement('div');
        container.className = 'skeleton-loader';
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: ${gap};
        `;

        for (let i = 0; i < count; i++) {
            const skeleton = document.createElement('div');
            skeleton.style.cssText = `
                width: ${width};
                height: ${height};
                background: linear-gradient(
                    90deg,
                    #f0f0f0 25%,
                    #e0e0e0 50%,
                    #f0f0f0 75%
                );
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
                border-radius: ${borderRadius};
            `;
            container.appendChild(skeleton);
        }

        // Add shimmer animation
        if (!document.getElementById('shimmer-style')) {
            const style = document.createElement('style');
            style.id = 'shimmer-style';
            style.textContent = `
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
            `;
            document.head.appendChild(style);
        }

        return container;
    }

    // Create pulsing dot loader
    createDotLoader() {
        const container = document.createElement('div');
        container.className = 'dot-loader';
        container.style.cssText = `
            display: flex;
            gap: 8px;
            align-items: center;
            justify-content: center;
            padding: 20px;
        `;

        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.style.cssText = `
                width: 12px;
                height: 12px;
                background: var(--primary-color);
                border-radius: 50%;
                animation: pulse 1.4s ease-in-out ${i * 0.2}s infinite;
            `;
            container.appendChild(dot);
        }

        // Add pulse animation
        if (!document.getElementById('pulse-style')) {
            const style = document.createElement('style');
            style.id = 'pulse-style';
            style.textContent = `
                @keyframes pulse {
                    0%, 80%, 100% {
                        transform: scale(0.6);
                        opacity: 0.5;
                    }
                    40% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        return container;
    }

    // Create spinner loader
    createSpinner(size = 40) {
        const spinner = document.createElement('div');
        spinner.className = 'spinner-loader';
        spinner.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            border: ${size / 10}px solid rgba(74, 144, 226, 0.2);
            border-top-color: var(--primary-color);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        `;

        // Add spin animation
        if (!document.getElementById('spin-style')) {
            const style = document.createElement('style');
            style.id = 'spin-style';
            style.textContent = `
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        return spinner;
    }
}

// Create global progress indicator instance
const progress = new ProgressIndicator();

// Helper functions for easy access
function showProgress() {
    progress.show();
}

function completeProgress() {
    progress.complete();
}

function createCircularProgress(percentage, size) {
    return progress.createCircular(percentage, size);
}

function createLinearProgress(percentage, label) {
    return progress.createLinear(percentage, label);
}

function createSkeleton(config) {
    return progress.createSkeleton(config);
}

function createDotLoader() {
    return progress.createDotLoader();
}

function createSpinner(size) {
    return progress.createSpinner(size);
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ProgressIndicator,
        showProgress,
        completeProgress,
        createCircularProgress,
        createLinearProgress,
        createSkeleton,
        createDotLoader,
        createSpinner
    };
}
