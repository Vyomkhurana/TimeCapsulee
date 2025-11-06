document.documentElement.style.scrollBehavior = 'smooth';

function createParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    const particleCount = 50;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 4 + 2;
        const startX = Math.random() * window.innerWidth;
        const startY = Math.random() * window.innerHeight;
        const duration = Math.random() * 20 + 10;
        const delay = Math.random() * 5;
        particle.style.cssText = `position:absolute;width:${size}px;height:${size}px;background:radial-gradient(circle,rgba(99,102,241,0.8),transparent);border-radius:50%;left:${startX}px;top:${startY}px;animation:floatParticle ${duration}s linear ${delay}s infinite;pointer-events:none`;
        particlesContainer.appendChild(particle);
    }
}

document.head.appendChild(document.createElement('style')).textContent=`@keyframes floatParticle{0%,100%{transform:translate(0,0);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translate(${Math.random()*100-50}px,-100vh);opacity:0}}.visible{opacity:1!important;transform:translateY(0)!important}.navbar{transition:transform .3s ease,padding .3s ease,box-shadow .3s ease!important}.animate-in{animation:fadeInUp .6s ease forwards}@keyframes fadeInUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}`;

const navbar=document.getElementById('navbar');let lastScrollY=window.scrollY,ticking=false;
const updateNavbar=()=>{const y=window.scrollY;y>50?navbar?.classList.add('scrolled'):navbar?.classList.remove('scrolled');y>lastScrollY&&y>100?navbar&&(navbar.style.transform='translateY(-100%)'):navbar&&(navbar.style.transform='translateY(0)');lastScrollY=y;ticking=false};
window.addEventListener('scroll',()=>{ticking||(window.requestAnimationFrame(updateNavbar),ticking=true)});

const fadeInObserver=new IntersectionObserver(e=>{e.forEach(t=>{t.isIntersecting&&t.target.classList.add('visible')})},{threshold:.1,rootMargin:'0px 0px -50px 0px'});
document.querySelectorAll('.feature-card,.step,.testimonial-card,.stat').forEach(e=>{e.style.opacity='0';e.style.transform='translateY(30px)';e.style.transition='opacity .6s ease,transform .6s ease';fadeInObserver.observe(e)});

document.querySelectorAll('a[href^="#"]').forEach(a=>{a.addEventListener('click',function(e){e.preventDefault();const t=document.querySelector(this.getAttribute('href'));t&&t.scrollIntoView({behavior:'smooth',block:'start'})})});
document.querySelectorAll('.btn,.feature-card,.capsule-card').forEach(e=>{e.style.transition='transform .3s ease,box-shadow .3s ease';e.addEventListener('mouseenter',function(){this.style.transform='translateY(-5px) scale(1.02)'});e.addEventListener('mouseleave',function(){this.style.transform='translateY(0) scale(1)'})});

const mobileMenuToggle=document.getElementById('mobileMenuToggle'),navLinksContainer=document.querySelector('.nav-links');
mobileMenuToggle&&mobileMenuToggle.addEventListener('click',()=>{navLinksContainer?.classList.toggle('active');mobileMenuToggle.classList.toggle('active');const i=mobileMenuToggle.querySelector('i');i&&(i.classList.toggle('fa-bars'),i.classList.toggle('fa-times'))});

function animateCounter(e){const t=parseInt(e.getAttribute('data-target'));if(!t)return;const n=t/125;let r=0;const a=()=>{r+=n;r<t?(e.textContent=Math.floor(r).toLocaleString(),requestAnimationFrame(a)):e.textContent=t.toLocaleString()};a()}

const statsObserver=new IntersectionObserver(e=>{e.forEach(t=>{t.isIntersecting&&(animateCounter(t.target),statsObserver.unobserve(t.target))})},{threshold:.5,rootMargin:'0px'});

document.addEventListener('DOMContentLoaded',()=>{createParticles();document.querySelectorAll('.stat-number').forEach(e=>statsObserver.observe(e));document.querySelectorAll('.feature-card,.step,.testimonial-card').forEach(e=>fadeInObserver.observe(e));const e=document.querySelector('.scroll-indicator');e&&e.addEventListener('click',()=>document.querySelector('#features')?.scrollIntoView({behavior:'smooth'}));window.addEventListener('load',()=>document.body.classList.add('loaded'));const t=document.querySelectorAll('.hero-visual,.capsule-preview');window.addEventListener('scroll',()=>{const e=window.pageYOffset;t.forEach(t=>t.style.transform=`translateY(${e*.5}px)`)});document.querySelectorAll('.hero-cta .btn').forEach(e=>{e.addEventListener('click',function(){this.style.transform='scale(0.95)';setTimeout(()=>this.style.transform='',200)})})});

window.addEventListener('resize',()=>{window.innerWidth>768&&navLinksContainer?.classList.contains('active')&&(navLinksContainer.classList.remove('active'),mobileMenuToggle?.classList.remove('active'))});
