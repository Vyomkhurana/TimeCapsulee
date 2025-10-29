// Enhanced Theme Switcher with Dark Mode
class ThemeManager {
    constructor() {
        this.themes = {
            light: {
                '--primary-color': '#4a90e2',
                '--primary-dark': '#357abd',
                '--primary-light': '#6ba3e8',
                '--secondary-color': '#2ecc71',
                '--accent-color': '#e74c3c',
                '--warning-color': '#f39c12',
                '--success-color': '#27ae60',
                '--text-color': '#2c3e50',
                '--text-light': '#7f8c8d',
                '--text-lighter': '#bdc3c7',
                '--bg-color': '#f5f7fa',
                '--card-bg': '#ffffff',
                '--border-color': '#e0e6ed'
            },
            dark: {
                '--primary-color': '#5da3f5',
                '--primary-dark': '#4a90e2',
                '--primary-light': '#7bb5f7',
                '--secondary-color': '#3ddc84',
                '--accent-color': '#ff5252',
                '--warning-color': '#ffb74d',
                '--success-color': '#4caf50',
                '--text-color': '#ecf0f1',
                '--text-light': '#bdc3c7',
                '--text-lighter': '#95a5a6',
                '--bg-color': '#1a1a1a',
                '--card-bg': '#2c3e50',
                '--border-color': '#34495e'
            },
            ocean: {
                '--primary-color': '#00acc1',
                '--primary-dark': '#00838f',
                '--primary-light': '#26c6da',
                '--secondary-color': '#26a69a',
                '--accent-color': '#ff7043',
                '--warning-color': '#ffa726',
                '--success-color': '#66bb6a',
                '--text-color': '#263238',
                '--text-light': '#607d8b',
                '--text-lighter': '#90a4ae',
                '--bg-color': '#e0f7fa',
                '--card-bg': '#ffffff',
                '--border-color': '#b2ebf2'
            },
            sunset: {
                '--primary-color': '#ff6b6b',
                '--primary-dark': '#ee5a52',
                '--primary-light': '#ff8787',
                '--secondary-color': '#4ecdc4',
                '--accent-color': '#ffe66d',
                '--warning-color': '#ff9f1c',
                '--success-color': '#06d6a0',
                '--text-color': '#2d3561',
                '--text-light': '#4a5568',
                '--text-lighter': '#718096',
                '--bg-color': '#fff5f5',
                '--card-bg': '#ffffff',
                '--border-color': '#fed7d7'
            }
        };
        
        this.currentTheme = this.getSavedTheme() || 'light';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.createThemeSwitcher();
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    createThemeSwitcher() {
        const switcher = document.createElement('div');
        switcher.className = 'theme-switcher';
        switcher.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 9999;
            background: var(--card-bg);
            border-radius: 50px;
            padding: 8px;
            box-shadow: var(--shadow-lg);
            display: flex;
            gap: 8px;
            border: 1px solid var(--border-color);
        `;

        const themes = [
            { name: 'light', icon: '☀️', label: 'Light' },
            { name: 'dark', icon: '🌙', label: 'Dark' },
            { name: 'ocean', icon: '🌊', label: 'Ocean' },
            { name: 'sunset', icon: '🌅', label: 'Sunset' }
        ];

        themes.forEach(theme => {
            const btn = document.createElement('button');
            btn.className = 'theme-btn';
            btn.title = theme.label;
            btn.style.cssText = `
                width: 40px;
                height: 40px;
                border-radius: 50%;
                border: 2px solid ${this.currentTheme === theme.name ? 'var(--primary-color)' : 'transparent'};
                background: ${this.currentTheme === theme.name ? 'var(--primary-color)' : 'transparent'};
                color: ${this.currentTheme === theme.name ? 'white' : 'var(--text-color)'};
                cursor: pointer;
                font-size: 1.2rem;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            `;
            btn.textContent = theme.icon;
            
            btn.addEventListener('click', () => {
                this.setTheme(theme.name);
                // Update all theme buttons
                document.querySelectorAll('.theme-btn').forEach(b => {
                    b.style.border = '2px solid transparent';
                    b.style.background = 'transparent';
                    b.style.color = 'var(--text-color)';
                });
                btn.style.border = '2px solid var(--primary-color)';
                btn.style.background = 'var(--primary-color)';
                btn.style.color = 'white';
            });
            
            btn.addEventListener('mouseenter', () => {
                if (this.currentTheme !== theme.name) {
                    btn.style.background = 'var(--bg-color)';
                    btn.style.transform = 'scale(1.1)';
                }
            });
            
            btn.addEventListener('mouseleave', () => {
                if (this.currentTheme !== theme.name) {
                    btn.style.background = 'transparent';
                    btn.style.transform = 'scale(1)';
                }
            });
            
            switcher.appendChild(btn);
        });

        document.body.appendChild(switcher);
    }

    applyTheme(themeName) {
        const theme = this.themes[themeName];
        if (!theme) return;

        const root = document.documentElement;
        Object.entries(theme).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });

        // Add smooth transition
        document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        
        // Dispatch theme change event
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: themeName } }));
    }

    setTheme(themeName) {
        this.currentTheme = themeName;
        this.applyTheme(themeName);
        this.saveTheme(themeName);
        
        // Show notification
        if (typeof notify !== 'undefined') {
            const themeLabels = {
                light: '☀️ Light Theme',
                dark: '🌙 Dark Theme',
                ocean: '🌊 Ocean Theme',
                sunset: '🌅 Sunset Theme'
            };
            notify.success(`Switched to ${themeLabels[themeName]}`);
        }
    }

    saveTheme(themeName) {
        localStorage.setItem('theme', themeName);
    }

    getSavedTheme() {
        return localStorage.getItem('theme');
    }

    getTheme() {
        return this.currentTheme;
    }
}

// Auto-initialize theme manager
let themeManager;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        themeManager = new ThemeManager();
    });
} else {
    themeManager = new ThemeManager();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}
