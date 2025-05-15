// Cart.js
// This script manages the shopping cart functionality, including adding items, displaying the cart, and handling checkout.
// Enhanced Checkout Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Helper function to format numbers with commas
    function formatNumberWithCommas(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

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
    
    // Initialize order data from localStorage or create new
    let orderData = JSON.parse(localStorage.getItem('orderData')) || {
        customer: {},
        shipping: {},
        cart: JSON.parse(localStorage.getItem('cart')) || [],
        totals: {
            subtotal: 0,
            shipping: 200, // Default shipping fee
            total: 0
        },
        currentStep: 'customer' // Track current step
    };

    // Save order data to localStorage
    function saveOrderData() {
        localStorage.setItem('orderData', JSON.stringify(orderData));
    }

    // Show the current step and hide others
    function showCurrentStep() {
        // Hide all sections first
        customerSection.classList.remove('active');
        shippingSection.classList.remove('active');
        paymentSection.classList.remove('active');
        document.getElementById('step-customer').classList.remove('active');
        document.getElementById('step-shipping').classList.remove('active');
        document.getElementById('step-payment').classList.remove('active');

        // Show the current step
        switch(orderData.currentStep) {
            case 'customer':
                customerSection.classList.add('active');
                document.getElementById('step-customer').classList.add('active');
                break;
            case 'shipping':
                shippingSection.classList.add('active');
                document.getElementById('step-shipping').classList.add('active');
                // Pre-fill shipping form if data exists
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

    // Initialize order summary
    function initOrderSummary() {
        const cartItemsContainer = document.querySelector('.cart-items');
        const subtotalElement = document.querySelector('.subtotal-amount');
        const shippingElement = document.querySelector('.shipping-amount');
        const totalElement = document.querySelector('.total-amount');
        
        // Calculate subtotal
        orderData.totals.subtotal = orderData.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        orderData.totals.total = orderData.totals.subtotal + orderData.totals.shipping;
        
        // Update UI with formatted numbers
        subtotalElement.textContent = `KES ${formatNumberWithCommas(orderData.totals.subtotal.toFixed(2))}`;
        shippingElement.textContent = `KES ${formatNumberWithCommas(orderData.totals.shipping.toFixed(2))}`;
        totalElement.textContent = `KES ${formatNumberWithCommas(orderData.totals.total.toFixed(2))}`;
        
        // Populate cart items with formatted numbers
        cartItemsContainer.innerHTML = orderData.cart.map(item => `
            <div class="cart-item">
                <span>${item.name} × ${item.quantity}</span>
                <span>KES ${formatNumberWithCommas((item.price * item.quantity).toFixed(2))}</span>
            </div>
        `).join('');
    }
    
    // Form validation
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
        
        // Save customer data
        orderData.customer = {
            email: email,
            subscribed: document.getElementById('input_subscribe').checked
        };
        orderData.currentStep = 'shipping';
        saveOrderData();
        
        // Move to shipping section
        showCurrentStep();
    });
    
    // Proceed to payment
    proceedBtn.addEventListener('click', function() {
        const requiredFields = [
            { id: 'county', name: 'County' },
            { id: 'Town/Province', name: 'Town/Province' },
            { id: 'delivery-address', name: 'Delivery Address' },
            { id: 'contact-person', name: 'Contact Person' },
            { id: 'phone-number', name: 'Phone Number' }
        ];
        
        let isValid = true;
        
        requiredFields.forEach(field => {
            const element = document.getElementById(field.id);
            if (!element || !element.value) {
                alert(`Please fill in the ${field.name} field.`);
                if (element) element.style.borderColor = '#EF4444';
                isValid = false;
            } else {
                if (element) element.style.borderColor = '#ddd';
            }
        });
        
        // Validate phone number
        const phoneNumber = phoneInput.value;
        if (!validatePhone(phoneNumber)) {
            document.getElementById('phone-error').textContent = 'Please enter a valid 10-digit phone number';
            document.getElementById('phone-error').style.display = 'block';
            phoneInput.style.borderColor = '#EF4444';
            isValid = false;
        }
        
        if (isValid) {
            // Save shipping data
            orderData.shipping = {
                county: countySelect.value,
                town: townInput.value,
                deliveryAddress: document.getElementById('delivery-address').value,
                contactPerson: document.getElementById('contact-person').value,
                phoneNumber: phoneNumber
            };
            orderData.currentStep = 'payment';
            saveOrderData();
            
            // Move to payment section
            showCurrentStep();
        }
    });
    
    // Submit order via WhatsApp
    submitBtn.addEventListener('click', function() {
        if (!orderData.shipping.phoneNumber) {
            alert('Please complete all shipping information first');
            return;
        }
        
        // Format WhatsApp message with comma-separated numbers
        const message = `*NEW ORDER - MyBidhaa*%0A%0A` +
            `*Customer Information*%0A` +
            `Email: ${orderData.customer.email || 'Not provided'}%0A` +
            `Subscribed: ${orderData.customer.subscribed ? 'Yes' : 'No'}%0A%0A` +
            `*Shipping Details*%0A` +
            `County: ${orderData.shipping.county || 'Not provided'}%0A` +
            `Town: ${orderData.shipping.town || 'Not provided'}%0A` +
            `Address: ${orderData.shipping.deliveryAddress || 'Not provided'}%0A` +
            `Contact: ${orderData.shipping.contactPerson || 'Not provided'}%0A` +
            `Phone: ${orderData.shipping.phoneNumber || 'Not provided'}%0A%0A` +
            `*Order Summary*%0A` +
            `${orderData.cart.map(item => 
                `${item.name} (${item.quantity} × KES ${formatNumberWithCommas(item.price.toFixed(2))}) - KES ${formatNumberWithCommas((item.price * item.quantity).toFixed(2))}`
            ).join('%0A')}%0A%0A` +
            `Subtotal: KES ${formatNumberWithCommas(orderData.totals.subtotal.toFixed(2))}%0A` +
            `Shipping: KES ${formatNumberWithCommas(orderData.totals.shipping.toFixed(2))}%0A` +
            `*Total: KES ${formatNumberWithCommas(orderData.totals.total.toFixed(2))}*`;
        
        // Open WhatsApp with order details
        window.open(`https://wa.me/254797100500?text=${message}`, '_blank');
        
        // Clear the order data after submission (optional)
        localStorage.removeItem('orderData');
    });
    
    // County selection - simplified since you're using text input for town
    countySelect.addEventListener('change', function() {
        const selectedCounty = this.value;
        // You can set different shipping fees based on county if needed
        const shippingFee = selectedCounty ? 200 : 0; // Example flat rate
        orderData.totals.shipping = shippingFee;
        orderData.totals.total = orderData.totals.subtotal + shippingFee;
        document.querySelector('.shipping-amount').textContent = `KES ${formatNumberWithCommas(shippingFee.toFixed(2))}`;
        document.querySelector('.total-amount').textContent = `KES ${formatNumberWithCommas(orderData.totals.total.toFixed(2))}`;
        saveOrderData();
    });
    
    // Initialize
    showCurrentStep(); // Show the appropriate step first
    initOrderSummary();
    
    // Clear order data when leaving the page (optional)
    window.addEventListener('beforeunload', function() {
        // Only clear if order is completed
        if (orderData.currentStep !== 'payment') {
            saveOrderData();
        }
    });
});