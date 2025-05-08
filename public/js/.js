document.addEventListener('DOMContentLoaded', function() {
                // Initialize cart in localStorage if it doesn't exist
                if (!localStorage.getItem('cart')) {
                    localStorage.setItem('cart', JSON.stringify([]));
                }
            
                // Add click event to all "Add to Cart" buttons
                document.querySelectorAll('.add-to-cart-btn').forEach(button => {
                    button.addEventListener('click', function(e) {
                        e.preventDefault();
                        
                        // Get product details from the clicked item
                        const productItem = this.closest('.product-item');
                        const productName = productItem.querySelector('.pr-name').textContent.trim();
                        const productPrice = parseFloat(
                            productItem.querySelector('.price-amount').textContent
                                .replace('KES', '')
                                .replace(',', '') // Handle comma in price (1,300 → 1300)
                                .trim()
                        );
                        const productImage = productItem.querySelector('.product-thumnail').src;
                        const productCategory = productItem.querySelector('.categories').textContent.trim();
                        
                        // Add to cart
                        addToCart({
                            name: productName,
                            price: productPrice,
                            image: productImage,
                            category: productCategory
                        });
                        
                        // Show visual feedback
                        showAddToCartFeedback(this);
                    });
                });
            
                // Function to add item to cart
                function addToCart(product) {
                    const cart = JSON.parse(localStorage.getItem('cart'));
                    const existingItem = cart.find(item => item.name === product.name);
                    
                    if (existingItem) {
                        existingItem.quantity += 1;
                    } else {
                        product.quantity = 1;
                        cart.push(product);
                    }
                    
                    localStorage.setItem('cart', JSON.stringify(cart));
                    updateCartDisplay();
                }
            
                // Update cart display (works with your existing HTML structure)
                function updateCartDisplay() {
                    const cart = JSON.parse(localStorage.getItem('cart'));
                    const cartItemsContainer = document.querySelector('.minicart-contain .products');
                    const cartQuantity = document.querySelector('.minicart-contain .qty');
                    const cartSubtotal = document.querySelector('.minicart-contain .sub-total');
                    
                    // Calculate totals
                    let totalQuantity = 0;
                    let subtotal = 0;
                    
                    cart.forEach(item => {
                        totalQuantity += item.quantity;
                        subtotal += item.price * item.quantity;
                    });
                    
                    // Update cart header
                    if (cartQuantity) cartQuantity.textContent = totalQuantity;
                    if (cartSubtotal) cartSubtotal.textContent = `KES ${subtotal.toFixed(2)}`;
                    
                    // Update cart items list
                    if (cartItemsContainer) {
                        cartItemsContainer.innerHTML = '';
                        
                        cart.forEach(item => {
                            const cartItemHTML = `
                                <li>
                                    <div class="minicart-item">
                                        <div class="thumb">
                                            <a href="#"><img src="${item.image}" width="90" height="90" alt="${item.name}"></a>
                                        </div>
                                        <div class="left-info">
                                            <div class="product-title"><a href="#" class="product-name">${item.name}</a></div>
                                            <div class="price">
                                                <ins><span class="price-amount"><span class="currencySymbol">KES</span>${item.price.toFixed(2)}</span></ins>
                                            </div>
                                            <div class="qty">
                                                <label>Qty: ${item.quantity}</label>
                                            </div>
                                        </div>
                                        <div class="action">
                                            <a href="#" class="remove" data-name="${item.name}"><i class="fa fa-trash-o"></i></a>
                                        </div>
                                    </div>
                                </li>
                            `;
                            cartItemsContainer.insertAdjacentHTML('beforeend', cartItemHTML);
                        });
                        
                        // Add event listeners to remove buttons
                        document.querySelectorAll('.remove').forEach(button => {
                            button.addEventListener('click', function(e) {
                                e.preventDefault();
                                removeFromCart(this.dataset.name);
                            });
                        });
                    }
                }
            
                // Remove item from cart
                function removeFromCart(name) {
                    let cart = JSON.parse(localStorage.getItem('cart'));
                    cart = cart.filter(item => item.name !== name);
                    localStorage.setItem('cart', JSON.stringify(cart));
                    updateCartDisplay();
                }
            
                // Show visual feedback when item is added
                function showAddToCartFeedback(button) {
                    const originalHTML = button.innerHTML;
                    button.innerHTML = '<i class="fa fa-check"></i> Added!';
                    button.classList.add('added');
                    
                    setTimeout(() => {
                        button.innerHTML = originalHTML;
                        button.classList.remove('added');
                    }, 2000);
                }
            
                // Toggle cart visibility
                document.querySelector('.minicart-contain .link-to')?.addEventListener('click', function(e) {
                    e.preventDefault();
                    document.querySelector('.minicart-contain .cart-content').classList.toggle('show');
                });
            
                // Initialize cart display
                updateCartDisplay();
            });
            // Add this to your existing cart.js file
function setupViewCartButton() {
    const viewCartBtn = document.querySelector('.view-cart');
    if (viewCartBtn) {
        viewCartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Save cart data to localStorage before navigating
            localStorage.setItem('cart', JSON.stringify(cart));
            // Navigate to shopping cart page
            window.location.href = 'pages/shopping-cart.html';
        });
    }
}

// Call this function in your DOMContentLoaded event
document.addEventListener('DOMContentLoaded', function() {
    // ... your existing code ...
    setupViewCartButton();
});
document.addEventListener('DOMContentLoaded', function() {
    // View Cart Button
    const viewCartBtn = document.getElementById('view-cart-btn');
    if (viewCartBtn) {
        viewCartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Ensure cart is saved before navigating
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            localStorage.setItem('cart', JSON.stringify(cart));
            window.location.href = 'pages/shopping-cart.html';
        });
    }

    // Checkout Button
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            
            if (cart.length === 0) {
                alert('Your cart is empty. Please add items before checkout.');
                return;
            }
            
            // Save cart and proceed to checkout
            localStorage.setItem('cart', JSON.stringify(cart));
            window.location.href = 'pages/checkout.html';
        });
    }
});