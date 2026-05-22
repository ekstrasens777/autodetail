// PRELOADER
window.addEventListener('load', function() {
    setTimeout(() => document.getElementById('preloader').classList.add('hidden'), 1500);
});

// БУРГЕР МЕНЮ
const mobileMenu  = document.getElementById('mobileMenu');
const mainNav     = document.getElementById('mainNav');
const navCloseBtn = document.getElementById('navCloseBtn');

function openNav()  { mainNav.classList.add('active');    document.body.style.overflow='hidden'; }
function closeNav() { mainNav.classList.remove('active'); document.body.style.overflow=''; }

mobileMenu  && mobileMenu.addEventListener('click', openNav);
navCloseBtn && navCloseBtn.addEventListener('click', closeNav);
document.querySelectorAll('#navList a, .nav-mobile-contacts a').forEach(a => a.addEventListener('click', closeNav));

// HEADER SCROLL
window.addEventListener('scroll', () => {
    document.getElementById('header').classList.toggle('scrolled', window.scrollY > 50);
});

// SMOOTH SCROLL
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function(e) {
        const id = this.getAttribute('href');
        if (id === '#') return;
        const el = document.querySelector(id);
        if (el) { e.preventDefault(); window.scrollTo({ top: el.offsetTop - 75, behavior: 'smooth' }); }
    });
});

// SCROLL ANIMATIONS
const observer = new IntersectionObserver(
    entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('animated'); }),
    { threshold: 0.1 }
);
document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

// FORM SUBMIT
const form = document.getElementById('application-form');
if (form) {
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const btn      = document.getElementById('submitBtn');
        const success  = document.getElementById('formSuccess');
        const error    = document.getElementById('formError');
        const errorTxt = document.getElementById('formErrorText');

        success.style.display = error.style.display = 'none';
        btn.disabled = true;
        btn.textContent = 'Отправка...';

        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_name:  document.getElementById('name').value.trim(),
                    customer_phone: document.getElementById('phone').value.trim(),
                    customer_email: document.getElementById('email').value.trim(),
                    service:        document.getElementById('service').value,
                    message:        document.getElementById('message').value.trim()
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                success.style.display = 'block';
                form.reset();
                setTimeout(() => success.style.display = 'none', 6000);
            } else {
                errorTxt.textContent = data.error || 'Ошибка. Попробуйте ещё раз.';
                error.style.display = 'block';
            }
        } catch {
            errorTxt.textContent = 'Нет связи с сервером. Позвоните нам напрямую.';
            error.style.display = 'block';
        }

        btn.disabled = false;
        btn.textContent = 'Отправить заявку';
    });
}
