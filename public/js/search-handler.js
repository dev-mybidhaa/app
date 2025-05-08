/**
 * Search handler for MyBidhaa e-commerce site
 */
document.addEventListener("DOMContentLoaded", function() {
    // Get necessary DOM elements
    const searchForm = document.getElementById("search-form");
    const searchInput = document.getElementById("search-input");
    const resultsContainer = document.getElementById("search-results");
    const searchPaginationContainer = document.getElementById("search-pagination");
    const searchLoader = document.getElementById("search-loader");
    const originalProductsContainer = document.querySelector('.product-category .row .products-list');
    const originalPaginationContainer = document.querySelector('.biolife-panigations-block');
    
    // Get filter elements from sidebar
    const categoryCheckboxes = document.querySelectorAll('.category-list input[type="checkbox"]');
    const elementCheckboxes = document.querySelectorAll('.element-list input[type="checkbox"]');
    
    // Store original content
    let originalContent = null;
    let originalPagination = null;
    
    // Function to get selected filters
    function getSelectedFilters() {
        const selectedCategories = Array.from(categoryCheckboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);
            
        const selectedElements = Array.from(elementCheckboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);
            
        return {
            categories: selectedCategories,
            elements: selectedElements
        };
    }
    
    // Add event listeners to filter checkboxes
    categoryCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleFilterChange);
    });
    
    elementCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleFilterChange);
    });
    
    // Function to handle filter changes
    function handleFilterChange() {
        // Get current search term or use empty string to show filtered results
        const searchTerm = searchInput.value.trim();
        
        // If there's no search term, we'll show filtered results from the current page
        if (searchTerm.length < 2) {
            // Save current content if not already saved
            if (!originalContent && originalProductsContainer) {
                originalContent = originalProductsContainer.innerHTML;
                originalPagination = originalPaginationContainer.innerHTML;
            }
            
            // Show loader
            if (originalProductsContainer) {
                originalProductsContainer.innerHTML = `
                    <div style="text-align: center; width: 100%; padding: 20px;">
                        <i class="fa fa-spinner fa-spin" style="font-size: 24px;"></i>
                        <p>Filtering...</p>
                    </div>
                `;
            }
            
            // Perform search with empty term to get filtered results
            performSearch('', 1);
        } else {
            // If there's a search term, perform search with current filters
            performSearch(searchTerm, 1);
        }
    }
    
    // Create a "Show All Products" button
    const showAllButton = document.createElement('button');
    showAllButton.className = 'btn btn-bold';
    showAllButton.style.backgroundColor = '#66cc33';
    showAllButton.style.color = 'white';
    showAllButton.style.display = 'none';
    showAllButton.style.margin = '20px auto';
    showAllButton.style.padding = '10px 20px';
    showAllButton.textContent = 'Show All Products';
    
    // Create container for the button
    const showAllContainer = document.createElement('div');
    showAllContainer.style.textAlign = 'center';
    showAllContainer.appendChild(showAllButton);
    
    // Insert button before pagination
    if (searchPaginationContainer) {
        searchPaginationContainer.parentNode.insertBefore(showAllContainer, searchPaginationContainer);
    }
    
    // Set up event listeners
    if (searchForm) {
        searchForm.addEventListener("submit", function(event) {
            event.preventDefault();
            const query = searchInput.value.trim();
            if (query.length > 1) {
                performSearch(query, 1);
            }
        });
    }
    
    // Show all products button event listener
    showAllButton.addEventListener('click', function() {
        restoreOriginalContent();
    });
    
    // Function to generate pagination HTML
    function generatePaginationHTML(currentPage, totalPages) {
        let paginationHTML = '<ul class="panigation-contain">';
        
        // Previous button
        if (currentPage > 1) {
            paginationHTML += `
                <li>
                    <a href="#" class="link-page prev" data-page="${currentPage - 1}">
                        <i class="fa fa-angle-left" aria-hidden="true"></i>
                    </a>
                </li>
            `;
        }
        
        // Page numbers
        const maxPagesToShow = 5;
        const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
        
        for (let i = startPage; i <= endPage; i++) {
            if (i === currentPage) {
                paginationHTML += `<li><span class="current-page">${i}</span></li>`;
            } else {
                paginationHTML += `<li><a href="#" class="link-page" data-page="${i}">${i}</a></li>`;
            }
        }
        
        // Add ellipsis if not showing all pages
        if (endPage < totalPages) {
            paginationHTML += `<li><span class="sep">....</span></li>`;
            paginationHTML += `<li><a href="#" class="link-page" data-page="${totalPages}">${totalPages}</a></li>`;
        }
        
        // Next button
        if (currentPage < totalPages) {
            paginationHTML += `
                <li>
                    <a href="#" class="link-page next" data-page="${currentPage + 1}">
                        <i class="fa fa-angle-right" aria-hidden="true"></i>
                    </a>
                </li>
            `;
        }
        
        paginationHTML += '</ul>';
        return paginationHTML;
    }
    
    // Function to perform search
    async function performSearch(searchTerm, page = 1) {
        // Get current table from URL path
        const pathSegments = window.location.pathname.split('/');
        const currentTable = pathSegments[pathSegments.length - 1].split('.')[0];
        
        // Save original content if not already saved
        if (!originalContent && originalProductsContainer) {
            originalContent = originalProductsContainer.innerHTML;
            originalPagination = originalPaginationContainer.innerHTML;
        }
        
        // Show loader in the original container
        if (originalProductsContainer) {
            originalProductsContainer.innerHTML = `
                <div style="text-align: center; width: 100%; padding: 20px;">
                    <i class="fa fa-spinner fa-spin" style="font-size: 24px;"></i>
                    <p>${searchTerm ? 'Searching...' : 'Filtering...'}</p>
                </div>
            `;
        }
        
        try {
            const limit = 12;
            // Get current filters
            const gradeSelect = document.querySelector('select[name="price"]');
            const publisherSelect = document.querySelector('select[name="publishers"]');
            const selectedFilters = getSelectedFilters();
            
            // Add current table and filters to search parameters
            const searchParams = new URLSearchParams({
                page: page,
                limit: limit
            });
            
            // Only add search term if it exists
            if (searchTerm) {
                searchParams.append('q', searchTerm);
            }
            
            if (currentTable) {
                searchParams.append('table', currentTable);
            }
            
            // Add grade filter if selected
            if (gradeSelect && gradeSelect.value !== 'all') {
                searchParams.append('grade', gradeSelect.value);
            }
            
            // Add publisher filter if selected
            if (publisherSelect && publisherSelect.value !== 'all') {
                searchParams.append('publisher', publisherSelect.value);
            }
            
            // Add category filters
            selectedFilters.categories.forEach(category => {
                searchParams.append('category', category);
            });
            
            // Add element filters
            selectedFilters.elements.forEach(element => {
                searchParams.append('element', element);
            });
            
            const response = await fetch(`/api/search?${searchParams.toString()}`);
            const data = await response.json();
            
            if (!data.success) {
                displayErrorMessage(data.message || 'Search failed');
                return;
            }
            
            // Clear the container before adding new content
            if (originalProductsContainer) {
                originalProductsContainer.innerHTML = '';
                
                if (data.items && data.items.length > 0) {
                    // Add search results title
                    const titleElement = document.createElement('h3');
                    titleElement.className = 'search-results-title';
                    titleElement.style.textAlign = 'center';
                    titleElement.style.marginBottom = '20px';
                    titleElement.textContent = searchTerm ? 
                        `Search Results for "${searchTerm}" (${data.total} items found)` :
                        `Filtered Results (${data.total} items found)`;
                    originalProductsContainer.appendChild(titleElement);
                    
                    // Add items to the container
                    data.items.forEach(item => {
                        const itemTitle = item.title || 'No Title';
                        
                        // Handle image paths correctly based on item type
                        let itemImage = null;
                        if (item.image_url) {
                            if (item.image_url.startsWith('http')) {
                                itemImage = item.image_url;
                            } else if (item.image_url.startsWith('/')) {
                                itemImage = item.image_url;
                            } else {
                                if (item.type === 'books') {
                                    itemImage = `/images/products/${item.image_url}`;
                                } else if (item.type === 'science_apparatus') {
                                    itemImage = `/apparatus/${item.image_url}`;
                                } else if (item.type === 'stationeries') {
                                    itemImage = `/images/stationery/${item.image_url}`;
                                } else {
                                    itemImage = `/images/${item.image_url}`;
                                }
                            }
                        }
                        
                        // Format price if available
                        const price = item.price ? `KES ${parseFloat(item.price).toFixed(2)}` : 'Price on request';
                        
                        // Create the item element
                        const itemElement = document.createElement('li');
                        itemElement.className = 'product-item col-lg-4 col-md-4 col-sm-4 col-xs-6';
                        itemElement.innerHTML = `
                            <div class="contain-product layout-default">
                                <div class="product-thumb">
                                    <a href="#" class="link-to-product">
                                        ${itemImage ? 
                                            `<img src="${itemImage}" alt="${itemTitle}" width="270" height="270" class="product-thumnail">` : 
                                            `<div class="empty-image-placeholder" style="width: 100%; height: 270px; background-color: #f9f9f9; display: flex; align-items: center; justify-content: center; color: #ddd; box-sizing: border-box;">
                                                <i class="fa fa-image" style="font-size: 48px;"></i>
                                            </div>`
                                        }
                                    </a>
                                </div>
                                <div class="info">
                                    <b class="categories">${item.type.charAt(0).toUpperCase() + item.type.slice(1)}</b>
                                    <h4 class="product-title"><a href="#" class="pr-name">${itemTitle}</a></h4>
                                    <div class="price">
                                        <ins><span class="price-amount"><span class="currencySymbol"></span>${price}</span></ins>
                                    </div>
                                    <div class="shipping-info"></div>
                                    <div class="slide-down-box">
                                        <div class="buttons">
                                            <a href="#" class="btn wishlist-btn"><i class="fa fa-heart" aria-hidden="true"></i></a>
                                            <a href="#" class="btn add-to-cart-btn"><i class="fa fa-cart-arrow-down" aria-hidden="true"></i>add to cart</a>
                                            <a href="#" class="btn compare-btn"><i class="fa fa-random" aria-hidden="true"></i></a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                        originalProductsContainer.appendChild(itemElement);
                    });
                    
                    // Show pagination if needed
                    if (data.total > limit) {
                        const totalPages = Math.ceil(data.total / limit);
                        const paginationHTML = generatePaginationHTML(page, totalPages);
                        if (originalPaginationContainer) {
                            originalPaginationContainer.innerHTML = paginationHTML;
                            
                            // Add event listeners to pagination links
                            const pageLinks = originalPaginationContainer.querySelectorAll('.link-page');
                            pageLinks.forEach(link => {
                                link.addEventListener('click', function(event) {
                                    event.preventDefault();
                                    const pageNumber = parseInt(this.getAttribute('data-page'));
                                    performSearch(searchTerm, pageNumber);
                                    // Scroll to top of results
                                    window.scrollTo({
                                        top: originalProductsContainer.offsetTop - 100,
                                        behavior: 'smooth'
                                    });
                                });
                            });
                        }
                    } else {
                        if (originalPaginationContainer) {
                            originalPaginationContainer.innerHTML = '';
                        }
                    }
                    
                    // Show the "Show All Products" button
                    showAllButton.style.display = 'block';
                } else {
                    // No results found
                    originalProductsContainer.innerHTML = `
                        <div style="text-align: center; width: 100%; padding: 20px;">
                            <p>No results found${searchTerm ? ` for "${searchTerm}"` : ''}</p>
                            <button class="btn btn-bold" style="background-color: #66cc33; color: white; margin-top: 20px;" onclick="restoreOriginalContent()">
                                Show All Products
                            </button>
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error('Search error:', error);
            displayErrorMessage('An error occurred while searching. Please try again.');
        }
    }
    
    // Function to display error messages
    function displayErrorMessage(message) {
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div style="text-align: center; padding: 30px; color: #cc0000;">
                    <h3>Error</h3>
                    <p>${message}</p>
                    <button id="error-try-again" class="btn btn-primary" style="margin-top: 15px;">Try Again</button>
                </div>
            `;
            
            // Add event listener for the "Try Again" button
            const tryAgainBtn = document.getElementById('error-try-again');
            if (tryAgainBtn) {
                tryAgainBtn.addEventListener('click', restoreOriginalContent);
            }

        }
    }
    
    // Function to restore original content
    function restoreOriginalContent() {
        if (originalContent && originalProductsContainer) {
            originalProductsContainer.innerHTML = originalContent;
            originalProductsContainer.style.display = 'block';
        }
        
        if (originalPagination && originalPaginationContainer) {
            originalPaginationContainer.innerHTML = originalPagination;
            originalPaginationContainer.style.display = 'block';
        }
        
        if (resultsContainer) resultsContainer.style.display = 'none';
        if (searchPaginationContainer) searchPaginationContainer.style.display = 'none';
        if (showAllButton) showAllButton.style.display = 'none';
    }
}); 