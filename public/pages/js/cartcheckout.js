document.addEventListener('DOMContentLoaded', function() {
    // Helper: Format numbers with commas
    function formatNumberWithCommas(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // Get cart items from localStorage safely
    function getCartItems() {
        try {
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            return Array.isArray(cart) ? cart.filter(item =>
                item && typeof item === 'object' &&
                'id' in item && 'name' in item &&
                'price' in item && 'quantity' in item
            ) : [];
        } catch (e) {
            console.error('Error parsing cart:', e);
            return [];
        }
    }

    // Initialize orderData
    let orderData = JSON.parse(localStorage.getItem('orderData')) || {
        customer: {},
        shipping: {},
        cart: [],
        totals: {
            subtotal: 0,
            shipping: 200,
            total: 0
        },
        currentStep: 'customer'
    };

    // DOM Elements
    const continueBtn = document.getElementById('continue-as-guest');
    const proceedBtn = document.getElementById('proceed-to-payment');
    const submitBtn = document.getElementById('submit-order');
    const customerSection = document.getElementById('customer-section');
    const shippingSection = document.getElementById('shipping-section');
    const paymentSection = document.getElementById('payment-section');
    const emailInput = document.getElementById('input_email');
    const phoneInput = document.getElementById('phone-number');
    const countySelect = document.getElementById('county');
    const townInput = document.getElementById('Town/Province');

    // Save to localStorage
    function saveOrderData() {
        localStorage.setItem('orderData', JSON.stringify(orderData));
    }

    // Show the current step
    function showCurrentStep() {
        customerSection.classList.remove('active');
        shippingSection.classList.remove('active');
        paymentSection.classList.remove('active');
        document.getElementById('step-customer').classList.remove('active');
        document.getElementById('step-shipping').classList.remove('active');
        document.getElementById('step-payment').classList.remove('active');

        switch(orderData.currentStep) {
            case 'customer':
                customerSection.classList.add('active');
                document.getElementById('step-customer').classList.add('active');
                if (orderData.customer.email) {
                    emailInput.value = orderData.customer.email;
                    document.getElementById('input_subscribe').checked = orderData.customer.subscribed || false;
                }
                break;
            case 'shipping':
                shippingSection.classList.add('active');
                document.getElementById('step-shipping').classList.add('active');
                if (orderData.shipping.county) countySelect.value = orderData.shipping.county;
                if (orderData.shipping.town) townInput.value = orderData.shipping.town;
                if (orderData.shipping.deliveryAddress) document.getElementById('delivery-address').value = orderData.shipping.deliveryAddress;
                if (orderData.shipping.contactPerson) document.getElementById('contact-person').value = orderData.shipping.contactPerson;
                if (orderData.shipping.phoneNumber) phoneInput.value = orderData.shipping.phoneNumber;
                break;
            case 'payment':
                paymentSection.classList.add('active');
                document.getElementById('step-payment').classList.add('active');
                break;
        }
    }

    // Load order summary
    function initOrderSummary() {
        const cartItemsContainer = document.querySelector('.cart-items');
        const subtotalElement = document.querySelector('.subtotal-amount');
        const shippingElement = document.querySelector('.shipping-amount');
        const totalElement = document.querySelector('.total-amount');

        // Load and update cart
        orderData.cart = getCartItems();

        // Calculate subtotal
        orderData.totals.subtotal = orderData.cart.reduce((sum, item) => {
            const price = Number(item.price) || 0;
            const quantity = Number(item.quantity) || 0;
            return sum + (price * quantity);
        }, 0);

        orderData.totals.total = orderData.totals.subtotal + (Number(orderData.totals.shipping) || 0);

        // Update DOM
        subtotalElement.textContent = `KES ${formatNumberWithCommas(orderData.totals.subtotal.toFixed(2))}`;
        shippingElement.textContent = `KES ${formatNumberWithCommas(orderData.totals.shipping.toFixed(2))}`;
        totalElement.textContent = `KES ${formatNumberWithCommas(orderData.totals.total.toFixed(2))}`;

        // Render cart items
        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = orderData.cart.map(item => {
                const price = Number(item.price) || 0;
                const quantity = Number(item.quantity) || 1;
                const total = price * quantity;

                return `
                    <div class="cart-item">
                        <div class="cart-item-image">
                            <img src="${item.image || 'images/placeholder-product.jpg'}" alt="${item.name}" onerror="this.src='images/placeholder-product.jpg'">
                        </div>
                        <div class="cart-item-details">
                            <h4>${item.name}</h4>
                            <p>KES ${formatNumberWithCommas(price.toFixed(2))} × ${quantity}</p>
                        </div>
                        <div class="cart-item-total">
                            KES ${formatNumberWithCommas(total.toFixed(2))}
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Item count (optional)
        const itemCountElement = document.querySelector('.cart-item-count');
        if (itemCountElement) {
            const totalItems = orderData.cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
            itemCountElement.textContent = totalItems === 1 ? '1 item' : `${totalItems} items`;
        }

        saveOrderData();
    }

    // Validators
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function validatePhone(phone) {
        return /^[0-9]{10}$/.test(phone);
    }

    // Continue as guest
    continueBtn.addEventListener('click', function() {
        const email = emailInput.value.trim();

        if (!email) {
            document.getElementById('email-error').textContent = 'Email is required';
            document.getElementById('email-error').style.display = 'block';
            return;
        }

        if (!validateEmail(email)) {
            document.getElementById('email-error').textContent = 'Please enter a valid email';
            document.getElementById('email-error').style.display = 'block';
            return;
        }

        orderData.customer = {
            email: email,
            subscribed: document.getElementById('input_subscribe').checked
        };
        orderData.currentStep = 'shipping';
        saveOrderData();
        showCurrentStep();
    });

    // Proceed to payment
    proceedBtn.addEventListener('click', function() {
        const fields = [
            { id: 'county', name: 'County' },
            { id: 'Town/Province', name: 'Town/Province' },
            { id: 'delivery-address', name: 'Delivery Address' },
            { id: 'contact-person', name: 'Contact Person' },
            { id: 'phone-number', name: 'Phone Number' }
        ];
        let valid = true;

        fields.forEach(field => {
            const el = document.getElementById(field.id);
            if (!el || !el.value.trim()) {
                alert(`Please fill in the ${field.name} field.`);
                if (el) el.style.borderColor = '#EF4444';
                valid = false;
            } else {
                if (el) el.style.borderColor = '#ddd';
            }
        });

        if (!validatePhone(phoneInput.value)) {
            document.getElementById('phone-error').textContent = 'Please enter a valid 10-digit phone number';
            document.getElementById('phone-error').style.display = 'block';
            phoneInput.style.borderColor = '#EF4444';
            valid = false;
        }

        if (valid) {
            orderData.shipping = {
                county: countySelect.value,
                town: townInput.value,
                deliveryAddress: document.getElementById('delivery-address').value,
                contactPerson: document.getElementById('contact-person').value,
                phoneNumber: phoneInput.value
            };
            orderData.currentStep = 'payment';
            saveOrderData();
            initOrderSummary();
            showCurrentStep();
        }
    });

    // Submit Order via WhatsApp
    submitBtn.addEventListener('click', function() {
        if (!orderData.shipping.phoneNumber) {
            alert('Please complete all shipping information first');
            return;
        }

        const message = `*NEW ORDER - MyBidhaa*%0A%0A` +
            `*Customer Info*%0A` +
            `Email: ${orderData.customer.email || 'N/A'}%0A` +
            `Subscribed: ${orderData.customer.subscribed ? 'Yes' : 'No'}%0A%0A` +
            `*Shipping*%0A` +
            `County: ${orderData.shipping.county}%0A` +
            `Town: ${orderData.shipping.town}%0A` +
            `Address: ${orderData.shipping.deliveryAddress}%0A` +
            `Contact: ${orderData.shipping.contactPerson}%0A` +
            `Phone: ${orderData.shipping.phoneNumber}%0A%0A` +
            `*Items*%0A` +
            `${orderData.cart.map(item => {
                const price = Number(item.price) || 0;
                const qty = Number(item.quantity) || 1;
                return `${item.name} (${qty} × KES ${formatNumberWithCommas(price.toFixed(2))}) = KES ${formatNumberWithCommas((price * qty).toFixed(2))}`;
            }).join('%0A')}%0A%0A` +
            `Subtotal: KES ${formatNumberWithCommas(orderData.totals.subtotal.toFixed(2))}%0A` +
            `Shipping: KES ${formatNumberWithCommas(orderData.totals.shipping.toFixed(2))}%0A` +
            `*Total: KES ${formatNumberWithCommas(orderData.totals.total.toFixed(2))}*`;

        window.open(`https://wa.me/254797100500?text=${message}`, '_blank');
        localStorage.removeItem('cart');
        localStorage.removeItem('orderData');
    });

    // Update shipping fee on county change
    countySelect.addEventListener('change', function() {
        const selected = this.value;
        const fee = selected === 'Nairobi' ? 150 : 250;
        orderData.totals.shipping = fee;
        orderData.totals.total = orderData.totals.subtotal + fee;

        document.querySelector('.shipping-amount').textContent = `KES ${formatNumberWithCommas(fee.toFixed(2))}`;
        document.querySelector('.total-amount').textContent = `KES ${formatNumberWithCommas(orderData.totals.total.toFixed(2))}`;
        saveOrderData();
    });

    // INIT
    orderData.cart = getCartItems(); // ensure cart is fresh
    showCurrentStep();
    initOrderSummary();

    // Listen for changes in localStorage from other tabs
    window.addEventListener('storage', function(event) {
        if (event.key === 'cart') {
            orderData.cart = getCartItems();
            initOrderSummary();
        }
    });
});