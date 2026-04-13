document.addEventListener('DOMContentLoaded', () => {
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -100px 0px'
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal-up, .reveal-fade, .accordion-group').forEach(el => {
        revealObserver.observe(el);
    });

    
    let bag = JSON.parse(localStorage.getItem('sarsa_reserve')) || [];
    const bagBtn = document.getElementById('bag-btn');
    const closeBag = document.getElementById('close-bag');
    const bagSystem = document.getElementById('side-bag');
    const bagOverlay = document.querySelector('.bag-overlay');
    const bagList = document.getElementById('bag-items-list');
    const bagCount = document.getElementById('bag-count');
    const bagTotal = document.getElementById('bag-total');
    const checkoutBtn = document.getElementById('checkout-action');

    const updateBagUI = () => {
        const count = bag.reduce((acc, item) => acc + item.quantity, 0);
        bagCount.textContent = count;

        if (bag.length === 0) {
            bagList.innerHTML = '<p class="empty-msg">Begin your selection from the reserve...</p>';
            bagTotal.textContent = '₱0.00';
            checkoutBtn.style.opacity = '0.3';
            checkoutBtn.disabled = true;
        } else {
            checkoutBtn.style.opacity = '1';
            checkoutBtn.disabled = false;
            let total = 0;
            bagList.innerHTML = bag.map((item, index) => {
                total += item.price * item.quantity;
                return `
                    <div class="bag-item">
                        <div class="item-info">
                            <span class="item-meta">RESERVE ET0${index + 1}</span>
                            <h4 class="item-name">${item.name}</h4>
                            <span class="item-price">₱${item.price.toFixed(2)}</span>
                        </div>
                        <div class="item-controls">
                            <div class="qty-adjuster">
                                <button class="qty-btn dec-qty" data-index="${index}">-</button>
                                <span class="qty-num">${item.quantity}</span>
                                <button class="qty-btn inc-qty" data-index="${index}">+</button>
                            </div>
                            <button class="remove-btn remove-from-bag" data-index="${index}">REMOVE</button>
                        </div>
                    </div>
                `;
            }).join('');
            bagTotal.textContent = `₱${total.toFixed(2)}`;
        }
        localStorage.setItem('milanese_reserve', JSON.stringify(bag));
    };

    document.querySelectorAll('.add-to-bag').forEach(btn => {
        btn.addEventListener('click', () => {
            const revealContainer = btn.closest('.product-reveal');
            const id = revealContainer.dataset.id;
            const name = revealContainer.dataset.name;
            const price = parseFloat(revealContainer.dataset.price);

            const existing = bag.find(i => i.id === id);
            if (existing) {
                if (existing.quantity >= 5) {
                    const originalText = btn.textContent;
                    btn.textContent = 'MAX LIMIT REACHED';
                    btn.classList.add('limit-error');
                    setTimeout(() => {
                        btn.textContent = originalText;
                        btn.classList.remove('limit-error');
                    }, 2000);
                    return;
                }
                existing.quantity += 1;
            } else {
                bag.push({ id, name, price, quantity: 1 });
            }

            updateBagUI();
            btn.textContent = 'ADDED TO RESERVE';
            setTimeout(() => {
                btn.textContent = `Add to Bag — ₱${price.toFixed(2)}`;
            }, 2000);
        });
    });

    
    bagList.addEventListener('click', (e) => {
        const target = e.target;
        const idx = target.dataset.index;

        if (target.classList.contains('remove-from-bag')) {
            bag.splice(idx, 1);
            updateBagUI();
        }

        if (target.classList.contains('inc-qty')) {
            if (bag[idx].quantity < 5) {
                bag[idx].quantity += 1;
                updateBagUI();
            }
        }

        if (target.classList.contains('dec-qty')) {
            if (bag[idx].quantity > 1) {
                bag[idx].quantity -= 1;
                updateBagUI();
            }
        }
    });


    const toggleBag = () => bagSystem.classList.toggle('open');
    bagBtn.addEventListener('click', toggleBag);
    closeBag.addEventListener('click', toggleBag);
    bagOverlay.addEventListener('click', toggleBag);

    const successModal = document.getElementById('reserve-success');
    const modalClose = document.getElementById('modal-close');
    const step1 = document.getElementById('bag-step-1');
    const step2 = document.getElementById('bag-step-2');
    const backBtn = document.getElementById('back-to-items');

    const resetBagSteps = () => {
        step1.classList.add('active');
        step2.classList.remove('active');
        checkoutBtn.textContent = 'RESERVE NOW';
    };

    checkoutBtn.addEventListener('click', () => {
        if (step1.classList.contains('active')) {
            step1.classList.remove('active');
            step2.classList.add('active');
            checkoutBtn.textContent = 'CONFIRM SELECTION';
        } else {
            const name = document.getElementById('reserve-name').value;
            const address = document.getElementById('reserve-address').value;
            
            if (!name || !address) {
                checkoutBtn.textContent = 'PLEASE PROVIDE DETAILS';
                setTimeout(() => checkoutBtn.textContent = 'CONFIRM SELECTION', 2000);
                return;
            }

            bagSystem.classList.remove('open');
            setTimeout(() => {
                successModal.classList.add('active');
                bag = [];
                updateBagUI();
                resetBagSteps();
            }, 800);
        }
    });

    backBtn.addEventListener('click', resetBagSteps);

    modalClose.addEventListener('click', () => {
        successModal.classList.remove('active');
    });
    
    document.querySelectorAll('.accordion-head').forEach(head => {
        head.addEventListener('click', () => {
            const group = head.parentElement;
            const isOpen = group.classList.contains('is-open');
            
            document.querySelectorAll('.accordion-group').forEach(g => g.classList.remove('is-open'));
            if (!isOpen) group.classList.add('is-open');
        });
    });

    
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
       
        const navPill = document.querySelector('.nav-pill');
        if (scrolled > 100) {
            navPill.style.transform = 'translateY(-10px) scale(0.95)';
        } else {
            navPill.style.transform = 'translateY(0) scale(1)';
        }

        
        const heroImg = document.querySelector('.hero-img');
        if (heroImg) {
            heroImg.style.transform = `scale(1.1) translateY(${scrolled * 0.1}px)`;
        }
    });



    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const mobileLinks = document.querySelectorAll('.nav-links a');

    if (menuToggle && navLinks) {
        const toggleMenu = () => {
            menuToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
            
            if (navLinks.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = 'auto';
            }
        };

        menuToggle.addEventListener('click', toggleMenu);

        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.style.overflow = 'auto';
            });
        });

        bagBtn.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }

    updateBagUI();
});
