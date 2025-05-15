// Cart.js
// This script manages the shopping cart functionality, including adding items, displaying the cart, and handling checkout.
document.addEventListener('DOMContentLoaded', function() {
    // ======================
    // 1. SAFE CART MANAGEMENT
    // ======================
    function getCart() {
        try {
            const cartData = localStorage.getItem('cart');
            // Double-check we have a valid array
            const cart = cartData ? JSON.parse(cartData) : [];
            return Array.isArray(cart) ? cart : [];
        } catch (e) {
            console.error("Cart data corrupted, resetting:", e);
            return [];
        }
    }

    function saveCart(cart) {
        if (!Array.isArray(cart)) {
            console.warn("Attempted to save non-array cart data");
            cart = [];
        }
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    // Initialize cart with empty array if needed
    if (!localStorage.getItem('cart') || !Array.isArray(JSON.parse(localStorage.getItem('cart')))) {
        saveCart([]);
    }

    // ======================
    // 2. ADD TO CART HANDLERS
    // ======================
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const productItem = this.closest('.product-item');
            if (!productItem) {
                console.error("Couldn't find product container");
                return;
            }

            const getSafeText = (selector, fallback = '') => {
                const el = productItem.querySelector(selector);
                return el?.textContent?.trim() || fallback;
            };

            const product = {
                name: getSafeText('.pr-name', 'Unnamed Product'),
                price: parseFloat(getSafeText('.price-amount', '0').replace(/KES|,/g, '')) || 0,
                image: productItem.querySelector('.product-thumnail')?.src || 'images/placeholder.jpg',
                category: getSafeText('.categories', 'General')
            };

            addToCart(product);
            showAddToCartFeedback(this);
        });
    });

    function addToCart(product) {
        const cart = getCart();
        const existingItem = cart.find(item => 
            item.name.toLowerCase() === product.name.toLowerCase()
        );

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                ...product,
                quantity: 1
            });
        }

        saveCart(cart);
        updateCartDisplay();
    }

    // ======================
    // 3. CART DISPLAY SYSTEM
    // ======================
    function updateCartDisplay() {
        const cart = getCart(); // Always returns an array
        const cartItemsContainer = document.querySelector('.minicart-contain .products');
        const cartQuantity = document.querySelector('.minicart-contain .qty');
        const cartSubtotal = document.querySelector('.minicart-contain .sub-total');

        // Calculate totals safely
        const { totalQuantity, subtotal } = cart.reduce((acc, item) => {
            const quantity = Number.isInteger(item.quantity) ? item.quantity : 1;
            const price = typeof item.price === 'number' ? item.price : 0;
            return {
                totalQuantity: acc.totalQuantity + quantity,
                subtotal: acc.subtotal + (price * quantity)
            };
        }, { totalQuantity: 0, subtotal: 0 });

        // Update UI elements if they exist
        if (cartQuantity) cartQuantity.textContent = totalQuantity;
        if (cartSubtotal) cartSubtotal.textContent = `KES ${subtotal.toFixed(2)}`;

        // Update cart items list
        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = cart.map(item => `
                <li>
                    <div class="minicart-item">
                        <div class="thumb">
                            <a href="#">
                                <img src="${item.image}" 
                                     onerror="this.src='images/placeholder.jpg'"
                                     width="90" height="90" 
                                     alt="${item.name}">
                            </a>
                        </div>
                        <div class="left-info">
                            <div class="product-title">
                                <a href="#" class="product-name">${item.name}</a>
                            </div>
                            <div class="price">
                                <ins>
                                    <span class="price-amount">
                                        <span class="currencySymbol">KES</span>${item.price.toFixed(2)}
                                    </span>
                                </ins>
                            </div>
                            <div class="qty">
                                <label>Qty: ${item.quantity}</label>
                            </div>
                        </div>
                        <div class="action">
                            <a href="#" class="remove" data-name="${item.name}">
                                <i class="fa fa-trash-o"></i>
                            </a>
                        </div>
                    </div>
                </li>
            `).join('');

            // Add remove handlers
            document.querySelectorAll('.remove').forEach(button => {
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    removeFromCart(this.dataset.name);
                });
            });
        }
    }

    // ======================
    // 4. HELPER FUNCTIONS
    // ======================
    function removeFromCart(name) {
        const cart = getCart().filter(item => item.name !== name);
        saveCart(cart);
        updateCartDisplay();
    }

    function showAddToCartFeedback(button) {
        if (!button) return;
        
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fa fa-check"></i> Added!';
        button.classList.add('added');
        
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.classList.remove('added');
        }, 2000);
    }

    // ======================
    // 5. EVENT LISTENERS
    // ======================
    // Toggle cart visibility
    document.querySelector('.minicart-contain .link-to')?.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelector('.minicart-contain .cart-content')?.classList.toggle('show');
    });

    // Navigation buttons
    document.getElementById('view-cart-btn')?.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'pages/shopping-cart.html';
    });

    document.getElementById('checkout-btn')?.addEventListener('click', function(e) {
        e.preventDefault();
        if (getCart().length === 0) {
            alert('Your cart is empty. Please add items before checkout.');
            return;
        }
        window.location.href = 'pages/checkout.html';
    });

    // Initialize
    updateCartDisplay();
});
