// Main event listener that initializes the script when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    const booksContainer = document.querySelector('.products-list');
    const paginationContainer = document.querySelector('.pagination-contain');
    let currentPage = 1;

    // Fetch initial books
    function fetchBooks(page) {
        fetch(`/books?page=${page}`)
            .then(response => response.json())
            .then(data => {
                // // Clear previous books
                // booksContainer.innerHTML = '';
                displayBooks(data.books);
                updatePagination(data.totalPages, page);
            })
            .catch(error => {
                console.error('Error fetching books:', error);
            });
    }

    // Display books on the page
    function displayBooks(books) {
        booksContainer.innerHTML = ''; // Clear previous books

        books.forEach(book => {
            const bookElement = document.createElement('li');
            bookElement.classList.add('product-item', 'col-md-4', 'col-sm-4', 'col-xs-6', 'col-lg-4');
            bookElement.innerHTML = `
            <div class="contain-product layout-default">
                <div class="product-thumnail">
                    <a href="#" class="link-to-product">
                        <img src="${book.image_url}" alt="${book.book_title}">
                    </a>
                </div>
                <div class="info">
                <b class="categories">${book.category}</b>
                <h4 class="product-title"><a href="#" class="pr-name">${book.book_title}</a></h4>
                <div class="price">
                <ins><span class="price-amount"><span class="currencySymbol">KES</span>${book.price}</span></ins>
                </div>
                <div class="slide-down-box">
                    <p class="message">${book.category}</p>
                    <div class="buttons">
                        <a href="#" class="btn btn-add-to-cart"><i class="fa fa-cart-arrow-down" aria-hidden="true"></i>Add to Cart</a>
                        <a href="#" class="btn compare-btn"><i class="fa fa-random" aria-hidden="true"></i></a>
                        </div>
                    </div>
                </div>
            `;

            booksContainer.appendChild(bookElement);
        });
    }

    // Update pagination
    function updatePagination(totalPages, page) {
        paginationContainer.innerHTML = '';

        // Create pagination buttons
        if (pages > 1) {
            paginationContainer.innerHTML += `<li><a href="#" class="link-page prev"><i class="fa fa-angle-left"></i></a></li>`;
        }

        for (let i = 1; i <= totalPages; i++) {
            if (i === page) {
                paginationContainer.innerHTML += `<li><span class="current-page">${i}</span></li>`;
            } else {
                paginationContainer.innerHTML += `<li><a href="#" class="link-page">${i}</a></li>`;
            }
        }

        if (page < totalPages) {
            paginationContainer.innerHTML += `<li><a href="#" class="link-page next"><i class="fa fa-angle-right"></i></a></li>`;
        }

        addPaginationListeners();
    }

    // Add event listeners to pagination buttons
    function addPaginationListeners() {
        document.querySelectorAll("link-page").forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                if (this.classList.contains('prev')) {
                    currentPage = Math.max(1, currentPage - 1);
                } else if (this.classList.contains('next')) {
                    currentPage++;
                } else {
                    currentPage = parseInt(this.textContent);
                }
                fetchBooks(currentPage);
            });
        });
    }
    fetchBooks(currentPage);
});

// Utility function to handle image paths
// Ensures proper formatting of image URLs whether they're absolute or relative
function getImagePath(imageUrl) {
    // If it's already an absolute path starting with http, return as is
    if (imageUrl.startsWith('http')) return imageUrl;
    
    // Replace /images/books with /books to match your actual directory structure
    return imageUrl.replace('/images/books', '/books');
}

// Loads books into a carousel display format
// Fetches first 9 books and displays them in a sliding carousel
async function loadCarouselBooks() {
    try {
        const response = await fetch('/books/api/books?page=1&limit=9');
        const data = await response.json();
        
        const carouselContainer = document.querySelector('.products-list.biolife-carousel .slick-track');
        carouselContainer.innerHTML = '';

        data.books.forEach(book => {
            const bookHTML = `
                <li class="product-item slick-slide" style="margin-right: 10px; width: 302.5px;">
                    <div class="contain-product layout-02">
                        <div class="product-thumb">
                            <a href="#" class="link-to-product">
                                <img src="${getImagePath(book.image_url)}" 
                                     alt="${book.book_title}" 
                                     width="270" 
                                     height="270" 
                                     class="product-thumnail">
                            </a>
                        </div>
                        <div class="info">
                        <b class="categories">${book.category}</b>
                        <h4 class="product-title"><a href="#" class="pr-name">${book.book_title}</a></h4>
                        <div class="price">
                        <ins><span class="price-amount"><span class="currencySymbol">KES</span>${book.price}</span></ins>
                        </div>
                        <div class="slide-down-box">
                            <p class="message">${book.category}</p>
                            <div class="buttons">
                                <a href="#" class="btn btn-add-to-cart"><i class="fa fa-cart-arrow-down" aria-hidden="true"></i>Add to Cart</a>
                                <a href="#" class="btn compare-btn"><i class="fa fa-random" aria-hidden="true"></i></a>
                                </div>
                            </div>
                        </div>
                    </div>
                </li>
            `;
            carouselContainer.innerHTML += bookHTML;
        });

        // Reinitialize the carousel
        if (typeof $.fn.slick !== 'undefined') {
            $('.biolife-carousel').slick('refresh');
        }
    } catch (error) {
        console.error('Error loading carousel books:', error);
    }
}

// Loads books in a grid layout with pagination
// Fetches 12 books per page and displays them in a responsive grid
async function loadGridBooks(page = 1) {
    try {
        const response = await fetch(`/books?page=${page}&limit=12`);
        const data = await response.json();
        
        const productsContainer = document.querySelector('.product-category .row > .products-list');
        if (!productsContainer) {
            console.error('Products container not found');
            return;
        }

        // Clear existing content
        productsContainer.innerHTML = '';

        // Create row wrapper for every 3 books
        let currentRow;
        data.books.forEach((book, index) => {
            // Create new row for every 3rd book
            if (index % 3 === 0) {
                currentRow = document.createElement('div');
                currentRow.className = 'row-books';
                productsContainer.appendChild(currentRow);
            }

            const bookHTML = `
                <li class="product-item col-lg-4 col-md-4 col-sm-4 col-xs-6">
                    <div class="contain-product layout-default">
                        <div class="product-thumb">
                            <a href="#" class="link-to-product">
                                <img src="${getImagePath(book.image_url)}" 
                                     alt="${book.book_title}" 
                                     width="270" 
                                     height="270" 
                                     class="product-thumnail">
                            </a>
                        </div>
                        <div class="info">
                            <b class="categories">${book.category}</b>
                            <h4 class="product-title"><a href="#" class="pr-name">${book.book_title}</a></h4>
                            <div class="price">
                                <ins><span class="price-amount"><span class="currencySymbol">KES </span>${book.price}</span></ins>
                            </div>
                            <div class="shipping-info">
                                <p class="shipping-day">${book.publishers || ''}</p>
                            </div>
                            <div class="slide-down-box">
                                <div class="buttons">
                                    <a href="#" class="btn wishlist-btn"><i class="fa fa-heart" aria-hidden="true"></i></a>
                                    <a href="#" class="btn add-to-cart-btn"><i class="fa fa-cart-arrow-down" aria-hidden="true"></i>add to cart</a>
                                    <a href="#" class="btn compare-btn"><i class="fa fa-random" aria-hidden="true"></i></a>
                                </div>
                            </div>
                        </div>
                    </div>
                </li>
            `;
            currentRow.insertAdjacentHTML('beforeend', bookHTML);
        });

        // Add this CSS to your stylesheet or add it dynamically
        const style = document.createElement('style');
        style.textContent = `
            .row-books {
                display: flex;
                flex-wrap: nowrap;
                margin: 0 -15px;
                clear: both;
            }
            .row-books .product-item {
                flex: 0 0 33.333%;
                max-width: 33.333%;
                padding: 0 15px;
                margin-bottom: 30px;
            }
        `;
        document.head.appendChild(style);

        // Update pagination
        updatePagination(page, data.totalPages);

    } catch (error) {
        console.error('Error loading grid books:', error);
    }
}

// Handles the creation and display of pagination controls
// Creates numbered page links, prev/next buttons, and ellipsis for long page lists
function updatePagination(currentPage, totalPages) {
    const paginationContainer = document.querySelector('.biolife-panigations-block .panigation-contain');
    if (!paginationContainer) return;

    let paginationHTML = '';

    // Previous page button
    if (currentPage > 1) {
        paginationHTML += `
            <li><a href="#" class="link-page prev" data-page="${currentPage - 1}">
                <i class="fa fa-angle-left" aria-hidden="true"></i>
            </a></li>
        `;
    }

    // First page
    if (currentPage > 2) {
        paginationHTML += `<li><a href="#" class="link-page" data-page="1">1</a></li>`;
        if (currentPage > 3) {
            paginationHTML += `<li><span class="sep">...</span></li>`;
        }
    }

    // Current page and surrounding pages
    for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
        if (i === currentPage) {
            paginationHTML += `<li><span class="current-page">${i}</span></li>`;
        } else {
            paginationHTML += `<li><a href="#" class="link-page" data-page="${i}">${i}</a></li>`;
        }
    }

    // Last page
    if (currentPage < totalPages - 1) {
        if (currentPage < totalPages - 2) {
            paginationHTML += `<li><span class="sep">...</span></li>`;
        }
        paginationHTML += `<li><a href="#" class="link-page" data-page="${totalPages}">${totalPages}</a></li>`;
    }

    // Next page button
    if (currentPage < totalPages) {
        paginationHTML += `
            <li><a href="#" class="link-page next" data-page="${currentPage + 1}">
                <i class="fa fa-angle-right" aria-hidden="true"></i>
            </a></li>
        `;
    }

    paginationContainer.innerHTML = paginationHTML;

    // Add click handlers for all pagination links
    paginationContainer.querySelectorAll('.link-page').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageNum = parseInt(e.currentTarget.dataset.page);
            loadGridBooks(pageNum);
            
            // Scroll to top of products
            const productsSection = document.querySelector('.product-category');
            if (productsSection) {
                productsSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Initialize the grid view when the page loads
document.addEventListener('DOMContentLoaded', function() {
    loadGridBooks(1);
});
