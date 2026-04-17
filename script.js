const SUPABASE_URL = 'https://humjrhsljrntqsifvjve.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_zIelwsJFBxMxtara1zTP6Q_VUP49k1-';



let _supabase = null;
try {
    if (typeof supabase !== 'undefined' && SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_URL.startsWith('http')) {
        _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
} catch (e) {
    console.error("Supabase initialization failed:", e);
}

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
        localStorage.setItem('sarsa_reserve', JSON.stringify(bag));
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
    const step3 = document.getElementById('bag-step-3');
    const step4 = document.getElementById('bag-step-4');
    
    const backBtn = document.getElementById('back-to-items');
    const backToDetails = document.getElementById('back-to-details');
    const backToPayment = document.getElementById('back-to-payment');
    
    const paymentOptions = document.querySelectorAll('.payment-option');
    const fileInput = document.getElementById('payment_proof');
    const fileNameDisplay = document.getElementById('file-name-display');

    let selectedMethod = 'gcash';

    const updateProgressUI = (step) => {
        document.querySelectorAll('.progress-step').forEach(el => {
            const s = parseInt(el.dataset.step);
            el.classList.remove('active', 'completed');
            if (s === step) el.classList.add('active');
            if (s < step) el.classList.add('completed');
        });
    };

    const resetBagSteps = () => {
        [step1, step2, step3, step4].forEach(s => s.classList.remove('active'));
        step1.classList.add('active');
        checkoutBtn.textContent = 'RESERVE NOW';
        updateProgressUI(1);
    };

    // Payment Option Selection
    paymentOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            paymentOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            selectedMethod = opt.dataset.method;
        });
    });

    // File input feedback
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const fileName = e.target.files[0]?.name || 'Choose screenshot...';
            fileNameDisplay.textContent = fileName;
        });
    }

    checkoutBtn.addEventListener('click', async () => {
        // Step 1 -> 2 (Details)
        if (step1.classList.contains('active')) {
            step1.classList.remove('active');
            step2.classList.add('active');
            checkoutBtn.textContent = 'CONFIRM SELECTION';
            updateProgressUI(2);
            return;
        } 

        // Step 2 -> 3 (Payment Method)
        if (step2.classList.contains('active')) {
            const name = document.getElementById('customer_name').value;
            const address = document.getElementById('shipping_address').value;
            const phone = document.getElementById('contact_number').value;

            if (!name || !address || !phone) {
                checkoutBtn.textContent = 'PLEASE PROVIDE ALL DETAILS';
                setTimeout(() => checkoutBtn.textContent = 'CONFIRM SELECTION', 2000);
                return;
            }

            step2.classList.remove('active');
            step3.classList.add('active');
            checkoutBtn.textContent = 'PROCEED TO PAYMENT';
            updateProgressUI(3);
            return;
        }

        // Step 3 -> Step 4 OR Submit (COD)
        if (step3.classList.contains('active')) {
            if (selectedMethod === 'gcash') {
                step3.classList.remove('active');
                step4.classList.add('active');
                checkoutBtn.textContent = 'SEND PROOF & RESERVE';
                updateProgressUI(4);
            } else {
                submitOrder(); // COD submits directly
            }
            return;
        }

        // Step 4 (GCash Proof Submit)
        if (step4.classList.contains('active')) {
            const file = fileInput.files[0];
            if (!file) {
                checkoutBtn.textContent = 'PLEASE UPLOAD PROOF';
                setTimeout(() => checkoutBtn.textContent = 'SEND PROOF & RESERVE', 2000);
                return;
            }
            submitOrder(file);
        }
    });

    const submitOrder = async (file = null) => {
        if (!_supabase) {
            checkoutBtn.textContent = 'SUPABASE NOT CONFIGURED';
            setTimeout(() => checkoutBtn.textContent = 'CONFIRM SELECTION', 2000);
            return;
        }

        checkoutBtn.textContent = 'PROCESSING...';
        checkoutBtn.disabled = true;

        const name = document.getElementById('customer_name').value;
        const address = document.getElementById('shipping_address').value;
        const phone = document.getElementById('contact_number').value;
        const totalAmount = bag.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        let proofUrl = null;

        // If GCash, upload the file first
        if (file) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const { data, error: uploadError } = await _supabase.storage
                .from('payment-proofs')
                .upload(fileName, file);

            if (uploadError) {
                console.error('Upload error:', uploadError);
                checkoutBtn.textContent = 'UPLOAD FAILED';
                checkoutBtn.disabled = false;
                return;
            }
            
            // Get Public URL
            const { data: { publicUrl } } = _supabase.storage
                .from('payment-proofs')
                .getPublicUrl(fileName);
            proofUrl = publicUrl;
        }

        const { data, error } = await _supabase
            .from('orders')
            .insert([
                { 
                    customer_name: name, 
                    shipping_address: address, 
                    contact_number: phone,
                    order_items: bag,
                    total_price: totalAmount,
                    payment_method: selectedMethod,
                    payment_proof_url: proofUrl
                }
            ]);

        if (error) {
            console.error('Supabase error:', error);
            checkoutBtn.textContent = 'ERROR - TRY AGAIN';
            checkoutBtn.disabled = false;
            return;
        }

        bagSystem.classList.remove('open');
        setTimeout(() => {
            successModal.classList.add('active');
            bag = [];
            updateBagUI();
            resetBagSteps();
            checkoutBtn.disabled = false;
        }, 800);
    };

    backBtn.addEventListener('click', resetBagSteps);
    if (backToDetails) backToDetails.addEventListener('click', () => {
        step3.classList.remove('active');
        step2.classList.add('active');
        checkoutBtn.textContent = 'CONFIRM SELECTION';
        updateProgressUI(2);
    });
    if (backToPayment) backToPayment.addEventListener('click', () => {
        step4.classList.remove('active');
        step3.classList.add('active');
        checkoutBtn.textContent = 'PROCEED TO PAYMENT';
        updateProgressUI(3);
    });

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

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    const contactInput = document.getElementById('contact_number');
    if (contactInput) {
        contactInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });
    }

    updateBagUI();
});
