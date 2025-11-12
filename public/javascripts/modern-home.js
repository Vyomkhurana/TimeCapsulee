document.documentElement.style.scrollBehavior = 'smooth';

function createParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 25 : 50;
    const fragment = document.createDocumentFragment();
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 4 + 2;
        const startX = Math.random() * 100;
        const startY = Math.random() * 100;
        const duration = Math.random() * 20 + 15;
        const delay = Math.random() * 5;
        const hue = Math.random() * 60 + 220;
        
        particle.style.cssText = `
            position:absolute;
            width:${size}px;
            height:${size}px;
            background:radial-gradient(circle,hsla(${hue},80%,60%,0.6),transparent);
            border-radius:50%;
            left:${startX}%;
            top:${startY}%;
            animation:floatParticle ${duration}s ease-in-out ${delay}s infinite;
            pointer-events:none;
            will-change:transform;
        `;
        fragment.appendChild(particle);
    }
    particlesContainer.appendChild(fragment);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes floatParticle {
        0% { transform: translate(0, 0) scale(0); opacity: 0; }
        10% { opacity: 1; transform: scale(1); }
        50% { transform: translate(var(--tx, 50px), -50vh) scale(1.2); }
        90% { opacity: 0.8; }
        100% { transform: translate(var(--tx, 100px), -100vh) scale(0.5); opacity: 0; }
    }
    .particle { --tx: ${Math.random() * 200 - 100}px; }
    .visible { opacity: 1 !important; transform: translateY(0) !important; }
    .navbar { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s ease, box-shadow 0.3s ease !important; }
    .animate-in { animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
    @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
    }
    @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
    }
`;
document.head.appendChild(style);

const navbar=document.getElementById('navbar');let lastScrollY=window.scrollY,ticking=false;
const updateNavbar=()=>{const y=window.scrollY;y>50?navbar?.classList.add('scrolled'):navbar?.classList.remove('scrolled');y>lastScrollY&&y>100?navbar&&(navbar.style.transform='translateY(-100%)'):navbar&&(navbar.style.transform='translateY(0)');lastScrollY=y;ticking=false};
window.addEventListener('scroll',()=>{ticking||(window.requestAnimationFrame(updateNavbar),ticking=true)});

const fadeInObserver=new IntersectionObserver(e=>{e.forEach(t=>{t.isIntersecting&&t.target.classList.add('visible')})},{threshold:.1,rootMargin:'0px 0px -50px 0px'});
document.querySelectorAll('.feature-card,.step,.testimonial-card,.stat').forEach(e=>{e.style.opacity='0';e.style.transform='translateY(30px)';e.style.transition='opacity .6s ease,transform .6s ease';fadeInObserver.observe(e)});

document.querySelectorAll('a[href^="#"]').forEach(a=>{a.addEventListener('click',function(e){e.preventDefault();const t=document.querySelector(this.getAttribute('href'));t&&t.scrollIntoView({behavior:'smooth',block:'start'})})});
document.querySelectorAll('.btn,.feature-card,.capsule-card').forEach(e=>{e.style.transition='transform .3s ease,box-shadow .3s ease';e.addEventListener('mouseenter',function(){this.style.transform='translateY(-5px) scale(1.02)'});e.addEventListener('mouseleave',function(){this.style.transform='translateY(0) scale(1)'})});

const mobileMenuToggle=document.getElementById('mobileMenuToggle'),navLinksContainer=document.querySelector('.nav-links');
mobileMenuToggle&&mobileMenuToggle.addEventListener('click',()=>{navLinksContainer?.classList.toggle('active');mobileMenuToggle.classList.toggle('active');const i=mobileMenuToggle.querySelector('i');i&&(i.classList.toggle('fa-bars'),i.classList.toggle('fa-times'))});

function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-target'));
    if (!target) return;
    
    const duration = 2000;
    const startTime = performance.now();
    const startValue = 0;
    
    const easeOutQuad = t => t * (2 - t);
    
    const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutQuad(progress);
        const current = Math.floor(startValue + (target - startValue) * easedProgress);
        
        element.textContent = current.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            element.textContent = target.toLocaleString();
        }
    };
    
    requestAnimationFrame(animate);
}

const statsObserver=new IntersectionObserver(e=>{e.forEach(t=>{t.isIntersecting&&(animateCounter(t.target),statsObserver.unobserve(t.target))})},{threshold:.5,rootMargin:'0px'});

document.addEventListener('DOMContentLoaded', () => {
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => createParticles(), { timeout: 2000 });
    } else {
        setTimeout(createParticles, 100);
    }

    document.querySelectorAll('.stat-number').forEach(el => statsObserver.observe(el));
    document.querySelectorAll('.feature-card,.step,.testimonial-card').forEach(el => fadeInObserver.observe(el));

    const scrollIndicator = document.querySelector('.scroll-indicator');
    scrollIndicator?.addEventListener('click', () => {
        document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const image = entry.target;
                    image.src = image.dataset.src;
                    image.removeAttribute('data-src');
                    obs.unobserve(image);
                }
            });
        });
        observer.observe(img);
    });

    window.addEventListener('load', () => {
        document.body.classList.add('loaded');
        if ('serviceWorker' in navigator && location.protocol === 'https:') {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
        }
    });

    let rafId;
    const parallaxElements = document.querySelectorAll('.hero-visual,.capsule-preview');
    window.addEventListener('scroll', () => {
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
            const scrollY = window.pageYOffset;
            parallaxElements.forEach(el => {
                el.style.transform = `translateY(${scrollY * 0.3}px)`;
            });
            rafId = null;
        });
    }, { passive: true });

    document.querySelectorAll('.hero-cta .btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => this.style.transform = '', 150);
        });
    });

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    prefersDark.addEventListener('change', (e) => {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    });
});

window.addEventListener('resize',()=>{window.innerWidth>768&&navLinksContainer?.classList.contains('active')&&(navLinksContainer.classList.remove('active'),mobileMenuToggle?.classList.remove('active'))});
