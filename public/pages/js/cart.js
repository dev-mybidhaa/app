document.addEventListener('DOMContentLoaded', function() {
    // Initialize cart in localStorage
    if (!localStorage.getItem('cart')) {
        localStorage.setItem('cart', JSON.stringify([]));
    }

    // Generate unique product IDs based on content
    function generateProductId(productItem) {
        const name = productItem.querySelector('.pr-name').textContent.trim();
        const category = productItem.querySelector('.categories').textContent.trim();
        const price = productItem.querySelector('.price-amount').textContent.trim();
        return 'prod-' + md5(name + category + price).substr(0, 8);
    }

    // Simple MD5 function for generating consistent IDs
    function md5(string) {
        return string.split('').reduce(function(a, b) {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
    }

    // Single event listener for all add-to-cart buttons
    document.addEventListener('click', function(e) {
        const addToCartBtn = e.target.closest('.add-to-cart-btn');
        if (!addToCartBtn) return;

        e.preventDefault();
        e.stopPropagation();
        
        const productItem = addToCartBtn.closest('.product-item');
        const productId = generateProductId(productItem);
        const productName = productItem.querySelector('.pr-name').textContent.trim();
        const productPrice = parseFloat(
            productItem.querySelector('.price-amount').textContent
                .replace('KES', '')
                .replace(/,/g, '')
                .trim()
        );
        const productImage = productItem.querySelector('.product-thumnail').src;
        const productCategory = productItem.querySelector('.categories').textContent.trim();
        
        addToCart({
            id: productId,
            name: productName,
            price: productPrice,
            image: productImage,
            category: productCategory
        });
        
        showAddToCartFeedback(addToCartBtn);
    });

    // Cart management functions
    function addToCart(product) {
        const cart = JSON.parse(localStorage.getItem('cart'));
        const existingIndex = cart.findIndex(item => item.id === product.id);
        
        if (existingIndex >= 0) {
            cart[existingIndex].quantity += 1;
        } else {
            product.quantity = 1;
            cart.push(product);
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
    }

    function updateCartDisplay() {
        const cart = JSON.parse(localStorage.getItem('cart'));
        const cartItemsContainer = document.querySelector('.minicart-contain .products');
        const cartQuantity = document.querySelector('.minicart-contain .qty');
        const cartSubtotal = document.querySelector('.minicart-contain .sub-total');
        
        let totalQuantity = 0;
        let subtotal = 0;
        
        cart.forEach(item => {
            totalQuantity += item.quantity;
            subtotal += item.price * item.quantity;
        });
        
        if (cartQuantity) cartQuantity.textContent = totalQuantity;
        if (cartSubtotal) cartSubtotal.textContent = `KES ${subtotal.toFixed(2)}`;
        
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
                                    <label>Qty:</label>
                                    <input type="number" class="input-qty" value="${item.quantity}" min="1" data-id="${item.id}" disabled>
                                </div>
                            </div>
                            <div class="action">
                                <a href="#" class="edit"><i class="fa fa-pencil" aria-hidden="true"></i></a>
                                <a href="#" class="remove" data-id="${item.id}"><i class="fa fa-trash-o" aria-hidden="true"></i></a>
                            </div>
                        </div>
                    </li>
                `;
                cartItemsContainer.insertAdjacentHTML('beforeend', cartItemHTML);
            });
        }
    }

    // Handle remove item clicks
    document.addEventListener('click', function(e) {
        const removeBtn = e.target.closest('.remove');
        if (removeBtn) {
            e.preventDefault();
            removeFromCart(removeBtn.dataset.id);
        }
    });

    function removeFromCart(id) {
        let cart = JSON.parse(localStorage.getItem('cart'));
        cart = cart.filter(item => item.id !== id);
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
    }

    // Handle edit quantity clicks
    document.addEventListener('click', function(e) {
        const editBtn = e.target.closest('.edit');
        if (editBtn) {
            e.preventDefault();
            const qtyInput = editBtn.closest('.minicart-item').querySelector('.input-qty');
            qtyInput.disabled = !qtyInput.disabled;
            if (!qtyInput.disabled) {
                qtyInput.focus();
            } else {
                updateCartItemQuantity(qtyInput.dataset.id, parseInt(qtyInput.value));
            }
        }
    });

    // Handle quantity changes
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('input-qty') && !e.target.disabled) {
            updateCartItemQuantity(e.target.dataset.id, parseInt(e.target.value));
        }
    });

    function updateCartItemQuantity(id, newQuantity) {
        if (newQuantity < 1) {
            removeFromCart(id);
            return;
        }

        const cart = JSON.parse(localStorage.getItem('cart'));
        const item = cart.find(item => item.id === id);
        if (item) {
            item.quantity = newQuantity;
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartDisplay();
        }
    }

    // Visual feedback when adding to cart
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

    // Initialize cart on page load
    updateCartDisplay();
});