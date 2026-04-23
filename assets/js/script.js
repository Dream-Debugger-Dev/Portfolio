// ===== INTRO / BOOT SEQUENCE =====
(function runIntro() {
    const overlay = document.getElementById('introOverlay');
    if (!overlay) return;

    const skipBtn   = document.getElementById('introSkip');
    const barFill   = document.getElementById('introBarFill');
    const percentEl = document.getElementById('introPercent');
    const hexEl     = document.getElementById('introHex');
    const statusEl  = document.getElementById('introStatus');

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const alreadyShown   = sessionStorage.getItem('introShown') === '1';

    document.body.classList.add('intro-active');

    // Reveal body now (hidden by inline style) — overlay sits above it
    document.body.style.opacity = '1';

    // Fast path: skip if already shown this session or reduced motion
    if (alreadyShown || prefersReduced) {
        finish(true);
        return;
    }

    const statusLines = [
        'SYSTEM BOOT // NEURAL LINK INITIALIZING',
        'CALIBRATING VISOR // HUD SYNC',
        'LOADING PORTFOLIO MATRIX',
        'ENGAGING INTERFACE'
    ];

    let progress = 0;
    let zoomTriggered = false;
    const totalDuration = 2200;         // bar fills over ~2.2s
    const stepInterval  = 35;
    const increment     = 100 / (totalDuration / stepInterval);

    const ticker = setInterval(() => {
        progress = Math.min(100, progress + increment + Math.random() * 1.6);
        const rounded = Math.floor(progress);
        if (barFill)   barFill.style.width = progress + '%';
        if (percentEl) percentEl.textContent = rounded;
        if (hexEl)     hexEl.textContent = '0x' + rounded.toString(16).toUpperCase().padStart(2, '0');
        if (statusEl)  statusEl.textContent = statusLines[Math.min(statusLines.length - 1, Math.floor(progress / 28))];

        if (progress >= 100 && !zoomTriggered) {
            zoomTriggered = true;
            clearInterval(ticker);
            setTimeout(triggerZoom, 200);
        }
    }, stepInterval);

    function triggerZoom() {
        overlay.classList.add('phase-zoom');
        setTimeout(() => finish(false), 900);
    }

    function finish(instant) {
        sessionStorage.setItem('introShown', '1');
        document.body.classList.remove('intro-active');
        if (instant) {
            overlay.classList.add('is-hidden');
        } else {
            overlay.classList.add('is-done');
            setTimeout(() => overlay.classList.add('is-hidden'), 700);
        }
    }

    // Skip controls
    function skip() {
        if (zoomTriggered) return;
        zoomTriggered = true;
        clearInterval(ticker);
        triggerZoom();
    }
    if (skipBtn) skipBtn.addEventListener('click', skip);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') skip();
    }, { once: false });
})();

// ===== CURSOR GLOW (OPTIMIZED) =====
const cursorGlow = document.getElementById('cursorGlow');
let mouseX = 0, mouseY = 0;
let rafId = null;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!rafId) {
        rafId = requestAnimationFrame(() => {
            cursorGlow.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
            rafId = null;
        });
    }
});

// Hide cursor glow on mobile
if (window.innerWidth < 768) {
    cursorGlow.style.display = 'none';
}

// ===== COSMIC PARTICLE SYSTEM =====
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
let cosmicParticles = [];
let shootingStars = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// --- Cosmic dust / floating particles ---
class CosmicParticle {
    constructor() { this.reset(true); }
    reset(initial) {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.8 + 0.3;
        this.speedX = (Math.random() - 0.5) * 0.15;
        this.speedY = (Math.random() - 0.5) * 0.15;
        this.baseOpacity = Math.random() * 0.4 + 0.1;
        this.opacity = this.baseOpacity;
        this.twinkleSpeed = Math.random() * 0.02 + 0.005;
        this.twinkleOffset = Math.random() * Math.PI * 2;
        const r = Math.random();
        if (r < 0.35) this.color = [255, 255, 255];
        else if (r < 0.55) this.color = [0, 240, 255];
        else if (r < 0.72) this.color = [139, 92, 246];
        else if (r < 0.85) this.color = [255, 0, 229];
        else this.color = [244, 114, 182];
    }
    update(time) {
        this.x += this.speedX;
        this.y += this.speedY;
        this.opacity = this.baseOpacity + Math.sin(time * this.twinkleSpeed + this.twinkleOffset) * 0.2;
        if (this.opacity < 0) this.opacity = 0;
        if (this.x < -10) this.x = canvas.width + 10;
        if (this.x > canvas.width + 10) this.x = -10;
        if (this.y < -10) this.y = canvas.height + 10;
        if (this.y > canvas.height + 10) this.y = -10;
    }
    draw() {
        const [r, g, b] = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${this.opacity})`;
        ctx.fill();
        if (this.size > 1.2 && this.opacity > 0.25) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},${this.opacity * 0.12})`;
            ctx.fill();
        }
    }
}

// --- Shooting Star ---
class ShootingStar {
    constructor() { this.reset(); }
    reset() {
        this.active = true;
        this.x = Math.random() * canvas.width * 1.2 - canvas.width * 0.1;
        this.y = Math.random() * canvas.height * 0.4;
        const angle = (Math.random() * 30 + 15) * Math.PI / 180;
        const speed = Math.random() * 12 + 8;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.tailLength = Math.random() * 60 + 40;
        this.life = 1.0;
        this.decay = Math.random() * 0.012 + 0.008;
        this.width = Math.random() * 1.5 + 0.8;
        const r = Math.random();
        if (r < 0.4) this.color = [0, 240, 255];
        else if (r < 0.7) this.color = [255, 255, 255];
        else if (r < 0.85) this.color = [139, 92, 246];
        else this.color = [244, 114, 182];
        this.trail = [];
    }
    update() {
        this.trail.push({ x: this.x, y: this.y, life: this.life });
        if (this.trail.length > this.tailLength) this.trail.shift();
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        if (this.life <= 0 || this.x > canvas.width + 100 || this.y > canvas.height + 100) {
            this.active = false;
        }
    }
    draw() {
        const [r, g, b] = this.color;
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const progress = i / this.trail.length;
            const alpha = progress * t.life * 0.6;
            const size = this.width * progress;
            ctx.beginPath();
            ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
            ctx.fill();
        }
        if (this.life > 0) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width * 2.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},${this.life * 0.4})`;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${this.life * 0.8})`;
            ctx.fill();
        }
    }
}

// Adjust particle count based on device
const isMobile = window.innerWidth < 768;
const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
const particleCount = isMobile ? 40 : isTablet ? 80 : 120;

for (let i = 0; i < particleCount; i++) {
    cosmicParticles.push(new CosmicParticle());
}

// Spawn shooting stars every 5-10 seconds
function spawnShootingStar() {
    const count = Math.random() < 0.3 ? 2 : 1;
    for (let i = 0; i < count; i++) {
        shootingStars.push(new ShootingStar());
    }
    const nextDelay = Math.random() * 5000 + 5000;
    setTimeout(spawnShootingStar, nextDelay);
}
setTimeout(spawnShootingStar, Math.random() * 2000 + 2000);

// Draw subtle nebula clouds on canvas
function drawNebulaClouds(time) {
    const clouds = [
        { x: 0.2, y: 0.3, r: 250, color: [139, 92, 246], pulse: 0.003 },
        { x: 0.8, y: 0.2, r: 200, color: [0, 240, 255], pulse: 0.004 },
        { x: 0.5, y: 0.7, r: 280, color: [255, 0, 229], pulse: 0.0025 },
        { x: 0.65, y: 0.5, r: 180, color: [59, 130, 246], pulse: 0.0035 },
    ];
    clouds.forEach(c => {
        const breathe = 1 + Math.sin(time * c.pulse) * 0.15;
        const radius = c.r * breathe;
        const alpha = 0.018 + Math.sin(time * c.pulse + 1) * 0.008;
        const grad = ctx.createRadialGradient(
            canvas.width * c.x, canvas.height * c.y, 0,
            canvas.width * c.x, canvas.height * c.y, radius
        );
        grad.addColorStop(0, `rgba(${c.color.join(',')},${alpha})`);
        grad.addColorStop(1, `rgba(${c.color.join(',')},0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    });
}

// Draw faint connection lines between nearby particles
function drawConnections() {
    for (let i = 0; i < cosmicParticles.length; i++) {
        for (let j = i + 1; j < cosmicParticles.length; j++) {
            const a = cosmicParticles[i], b = cosmicParticles[j];
            const dx = a.x - b.x, dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
                const alpha = 0.03 * (1 - dist / 100) * Math.min(a.opacity, b.opacity) * 2;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
                ctx.lineWidth = 0.4;
                ctx.stroke();
            }
        }
    }
}

// Main animation loop
let animTime = 0;
let animFrameId = null;

function animateCosmos() {
    animTime++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawNebulaClouds(animTime);
    cosmicParticles.forEach(p => { p.update(animTime); p.draw(); });
    drawConnections();
    shootingStars = shootingStars.filter(s => s.active);
    shootingStars.forEach(s => { s.update(); s.draw(); });
    animFrameId = requestAnimationFrame(animateCosmos);
}
animateCosmos();

// Pause animations when tab is hidden (save battery)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        cancelAnimationFrame(animFrameId);
    } else {
        animateCosmos();
    }
});

// ===== NAVBAR =====
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
const navOverlay = document.getElementById('navOverlay');

window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
});

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
    navOverlay.classList.toggle('active');
    document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
});

// Close menu when clicking overlay
navOverlay.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navLinks.classList.remove('active');
    navOverlay.classList.remove('active');
    document.body.style.overflow = '';
});

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
        navOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });
});

// Active nav link on scroll
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY + 100;
    sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        const id = section.getAttribute('id');
        const link = document.querySelector(`.nav-link[href="#${id}"]`);
        if (link) {
            link.classList.toggle('active', scrollY >= top && scrollY < top + height);
        }
    });
});

// ===== TYPEWRITER EFFECT =====
const typewriterEl = document.getElementById('typewriter');
const phrases = [
    'Web Applications',
    'Python Automation Tools',
    'Data Dashboards',
    'Clean & Modern UIs',
    'Solutions That Matter'
];
let phraseIndex = 0, charIndex = 0, isDeleting = false;

function typewrite() {
    const current = phrases[phraseIndex];
    if (isDeleting) {
        typewriterEl.textContent = current.substring(0, charIndex - 1);
        charIndex--;
    } else {
        typewriterEl.textContent = current.substring(0, charIndex + 1);
        charIndex++;
    }
    let speed = isDeleting ? 30 : 60;
    if (!isDeleting && charIndex === current.length) {
        speed = 2000; isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        speed = 500;
    }
    setTimeout(typewrite, speed);
}
typewrite();

// ===== PARALLAX HERO LAYERS =====
const heroLayers = document.querySelectorAll('.hero-layer');
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    heroLayers.forEach(layer => {
        const speed = parseFloat(layer.dataset.speed) || 0;
        layer.style.transform = `translateY(${scrollY * speed}px)`;
    });
});

const heroSection = document.querySelector('.hero-section');
if (heroSection) {
    heroSection.addEventListener('mousemove', (e) => {
        const rect = heroSection.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        heroLayers.forEach(layer => {
            const speed = parseFloat(layer.dataset.speed) || 0;
            layer.style.transform = `translate(${x * speed * 30}px, ${y * speed * 30 + window.scrollY * speed}px)`;
        });
    });
}

// ===== SCROLL ANIMATIONS (Custom AOS) =====
function initAOS() {
    const elements = document.querySelectorAll('[data-aos]');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.dataset.aosDelay || 0;
                setTimeout(() => { entry.target.classList.add('aos-animate'); }, parseInt(delay));
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    elements.forEach(el => observer.observe(el));
}
initAOS();

// ===== SKILL BAR ANIMATION =====
function animateSkillBars() {
    const fills = document.querySelectorAll('.skill-fill');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.width = entry.target.dataset.width + '%';
            }
        });
    }, { threshold: 0.5 });
    fills.forEach(fill => observer.observe(fill));
}
animateSkillBars();

// ===== COUNTER ANIMATION =====
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.dataset.count);
                let current = 0;
                const increment = target / 40;
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        entry.target.textContent = target;
                        clearInterval(timer);
                    } else {
                        entry.target.textContent = Math.floor(current);
                    }
                }, 30);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    counters.forEach(counter => observer.observe(counter));
}
animateCounters();

// ===== TESTIMONIALS SLIDER =====
const testimonialCards = document.querySelectorAll('.testimonial-card');
const dots = document.querySelectorAll('.dot');
const prevBtn = document.querySelector('.testimonial-prev');
const nextBtn = document.querySelector('.testimonial-next');
let currentTestimonial = 0;

function showTestimonial(index) {
    testimonialCards.forEach(card => card.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    testimonialCards[index].classList.add('active');
    dots[index].classList.add('active');
    currentTestimonial = index;
}

if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => {
        showTestimonial((currentTestimonial - 1 + testimonialCards.length) % testimonialCards.length);
    });
    nextBtn.addEventListener('click', () => {
        showTestimonial((currentTestimonial + 1) % testimonialCards.length);
    });
    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => showTestimonial(i));
    });
    setInterval(() => {
        showTestimonial((currentTestimonial + 1) % testimonialCards.length);
    }, 5000);
}

// ===== CONTACT FORM (ENHANCED) =====
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    const inputs = contactForm.querySelectorAll('input, textarea');

    // Real-time validation
    inputs.forEach(input => {
        input.addEventListener('blur', () => {
            if (input.validity.valid) {
                input.style.borderColor = 'var(--neon-green)';
            } else {
                input.style.borderColor = '#ef4444';
            }
        });

        input.addEventListener('input', () => {
            if (input.value.trim() !== '') {
                input.style.borderColor = 'rgba(139,92,246,0.3)';
            }
        });
    });

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Validate all fields
        let isValid = true;
        inputs.forEach(input => {
            if (!input.validity.valid) {
                isValid = false;
                input.style.borderColor = '#ef4444';
            }
        });

        if (!isValid) {
            const errorMsg = document.createElement('div');
            errorMsg.textContent = 'Please fill in all fields correctly.';
            errorMsg.style.cssText = 'color: #ef4444; text-align: center; margin-top: 10px; font-size: 0.9rem;';
            contactForm.appendChild(errorMsg);
            setTimeout(() => errorMsg.remove(), 3000);
            return;
        }

        const btn = contactForm.querySelector('.btn-submit');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<span>Sending...</span> <i class="fas fa-spinner fa-spin"></i>';
        btn.disabled = true;

        fetch(contactForm.action, {
            method: 'POST',
            body: new FormData(contactForm),
            headers: { 'Accept': 'application/json' }
        }).then(response => {
            if (response.ok) {
                btn.innerHTML = '<span>Message Sent!</span> <i class="fas fa-check"></i>';
                btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                contactForm.reset();
                inputs.forEach(input => input.style.borderColor = '');

                // Success message
                const successMsg = document.createElement('div');
                successMsg.textContent = "Thank you! I'll get back to you soon.";
                successMsg.style.cssText = 'color: #10b981; text-align: center; margin-top: 10px; font-size: 0.9rem;';
                contactForm.appendChild(successMsg);
                setTimeout(() => successMsg.remove(), 5000);
            } else {
                btn.innerHTML = '<span>Failed — Try Again</span> <i class="fas fa-times"></i>';
                btn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            }
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.style.background = '';
                btn.disabled = false;
            }, 3000);
        }).catch(() => {
            btn.innerHTML = '<span>Error — Try Again</span> <i class="fas fa-times"></i>';
            btn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.style.background = '';
                btn.disabled = false;
            }, 3000);
        });
    });
}

// ===== SMOOTH REVEAL ON LOAD (fallback — intro normally handles this) =====
window.addEventListener('load', () => {
    if (document.body.style.opacity !== '1') {
        document.body.style.opacity = '1';
    }
});
