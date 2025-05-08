/**
 * Category Loader JS
 * Functionality for loading different category items (apparatus, books, etc.) on shop pages
 */

class CategoryLoader {
    constructor() {
        this.productsContainer = document.querySelector('.products-list');
        this.productCategory = document.querySelector('.product-category');
        this.currentPage = 1;
        this.itemsPerPage = 12;
        
        // Initialize the loader after DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            this.initLoaders();
        });
    }
    
    /**
     * Initialize click event listeners for category triggers
     */
    initLoaders() {
        const categoryLinks = document.querySelectorAll('.category-load-trigger');
        
        categoryLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const category = link.getAttribute('data-category');
                if (category) {
                    this.loadCategoryItems(category, 1);
                }
            });
        });
        
        // Also handle the STEM/Science button if it exists separately
        const loadApparatusBtn = document.getElementById('loadApparatusBtn');
        if (loadApparatusBtn) {
            loadApparatusBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.loadCategoryItems('science', 1);
            });
        }
    }
    
    /**
     * Load category items with pagination
     * @param {string} category - The category to load (science, books, etc.)
     * @param {number} page - The page number to load
     */
    async loadCategoryItems(category, page = 1) {
        try {
            // Scroll to top of product list for better user experience
            if (this.productCategory) {
                this.productCategory.scrollIntoView({ behavior: 'smooth' });
                // Set data-category attribute for CSS targeting
                this.productCategory.setAttribute('data-category', category);
            }
            
            // Show loading indicator in the existing products list
            const initialProductList = this.productCategory.querySelector('.products-list');
            if (initialProductList) {
                initialProductList.innerHTML = '<div class="loading-indicator" style="text-align: center; width: 100%; padding: 20px;"><p>Loading items...</p></div>';
            }
            
            // Determine the appropriate endpoint based on category
            let endpoint = ''; // Initialize endpoint
            let titleText = ''; // Initialize title
            
            switch (category) {
                case 'science':
                    endpoint = '/apparatus/science'; // Science doesn't seem to have pagination in the original setup
                    titleText = 'Science Apparatus';
                    break;
                case 'books':
                    endpoint = `/books?page=${page}&limit=${this.itemsPerPage}`;
                    titleText = 'Books';
                    break;
                case 'stationery':
                    endpoint = `/stationeries?page=${page}&limit=${this.itemsPerPage}`;
                    titleText = 'Academic & Learning Resources';
                    break;
                case 'playground':
                    endpoint = `/playground?page=${page}&limit=${this.itemsPerPage}`;
                    titleText = 'Playground Equipment';
                    break;
                case 'electronics':
                    endpoint = `/electronics?page=${page}&limit=${this.itemsPerPage}`;
                    titleText = 'Electronics & Appliances';
                    break;
                // Add more cases as needed for different categories
                default:
                    console.error(`Unknown category: ${category}`);
                    if (initialProductList) {
                        initialProductList.innerHTML = `<div style="text-align: center; width: 100%; padding: 20px;"><p>Unknown category: ${category}</p></div>`;
                    }
                    return; // Exit if category is unknown
            }
            
            // Fetch items from the database
            const response = await fetch(endpoint);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // Extract items and pagination data based on category type
            let items = [];
            let totalPages = 1;
            let currentPageData = page;
            
            // Adjust data extraction based on expected API response structure for each category
            if (category === 'science') {
                items = data.apparatus || [];
                // Science apparatus endpoint doesn't seem to return total/pagination directly
                // We might need to paginate client-side or adjust the API if needed
                totalPages = Math.ceil(items.length / this.itemsPerPage); 
                const startIndex = (page - 1) * this.itemsPerPage;
                items = items.slice(startIndex, startIndex + this.itemsPerPage);
            } else if (category === 'books') {
                items = data.books || [];
                totalPages = data.totalPages || 1;
                currentPageData = data.currentPage || page;
            } else if (category === 'stationery') {
                items = data.stationeries || [];
                totalPages = data.totalPages || 1;
                currentPageData = data.currentPage || page;
            } else if (category === 'playground') {
                items = data.equipment || [];
                totalPages = data.totalPages || 1;
                currentPageData = data.currentPage || page;
            } else if (category === 'electronics') {
                items = data.electronics || [];
                totalPages = data.totalPages || 1;
                currentPageData = data.currentPage || page;
            } else {
                // Fallback for potential future categories
                items = data.items || []; 
                totalPages = data.totalPages || Math.ceil((data.total || items.length) / this.itemsPerPage);
                currentPageData = data.currentPage || page;
            }
            
            // Update page title
            const pageTitleElement = document.querySelector('.page-title'); // Assuming H1 with class page-title
            if (pageTitleElement) {
                pageTitleElement.innerText = titleText;
            }
            
            // Create the row and products list containers
            const rowElement = document.createElement('div');
            rowElement.className = 'row';
            rowElement.style.display = 'flex';
            rowElement.style.flexWrap = 'wrap';
            rowElement.style.marginLeft = '-10px';
            rowElement.style.marginRight = '-10px';
            
            const productsListElement = document.createElement('ul');
            productsListElement.className = 'products-list';
            productsListElement.style.width = '100%';
            productsListElement.style.display = 'flex';
            productsListElement.style.flexWrap = 'wrap';
            productsListElement.style.padding = '0';
            rowElement.appendChild(productsListElement);
            
            // Clear existing content and add new containers
            this.productCategory.innerHTML = '';
            this.productCategory.appendChild(rowElement);

            if (items && items.length > 0) {
                // Determine the HTML template based on category
                // Clear existing content
                this.productCategory.innerHTML = '';

                // Create row element with proper spacing
                const rowElement = document.createElement('div');
                rowElement.className = 'row';
                rowElement.style.display = 'flex';
                rowElement.style.flexWrap = 'wrap';
                rowElement.style.marginLeft = '-10px';
                rowElement.style.marginRight = '-10px';
                
                // Create products list
                const productsListElement = document.createElement('ul');
                productsListElement.className = 'products-list';
                productsListElement.style.width = '100%';
                productsListElement.style.display = 'flex';
                productsListElement.style.flexWrap = 'wrap';
                productsListElement.style.padding = '0';
                rowElement.appendChild(productsListElement);
                
                this.productCategory.appendChild(rowElement);

                // Ensure we only display properly - items per page (3x4 grid)
                const itemsToShow = items.slice(0, 12);
                
                itemsToShow.forEach(item => {
                    const itemElement = document.createElement('li');
                    itemElement.classList.add('product-item', 'col-lg-3', 'col-md-4', 'col-sm-6', 'col-xs-6');
                    itemElement.style.height = '350px';
                    itemElement.style.marginBottom = '15px';
                    itemElement.style.paddingLeft = '10px';
                    itemElement.style.paddingRight = '10px';
                    
                    // Format data based on category
                    let imagePath = '';
                    let itemName = '';
                    let itemPrice = '0.00';
                    let itemCategoryName = ''; // Display name for the category
                    
                    if (category === 'science') {
                        imagePath = item.image_url ? `/apparatus/${item.image_url.split('/').pop()}` : 'images/placeholder.jpg';
                        itemName = item.name || 'Unnamed Apparatus';
                        itemPrice = item.price || '0.00';
                        itemCategoryName = 'Science Apparatus';
                    } else if (category === 'books') {
                        imagePath = item.image_url || 'images/placeholder.jpg';
                        itemName = item.book_title || 'Untitled Book';
                        itemPrice = item.price || '0.00';
                        itemCategoryName = item.category || 'Book';
                    } else if (category === 'stationery') {
                        imagePath = item.image_url || 'images/placeholder.jpg';
                        itemName = item.stationery_name || 'Unnamed Stationery';
                        itemPrice = item.price || '0.00';
                        itemCategoryName = item.category || 'Stationery';
                    } else if (category === 'playground') {
                        imagePath = item.image_url || 'images/placeholder.jpg';
                        itemName = item.name || 'Unnamed Equipment';
                        itemPrice = item.price || '0.00';
                        itemCategoryName = 'Playground Equipment';
                    } else if (category === 'electronics') {
                        imagePath = item.image_url || 'images/placeholder.jpg';
                        itemName = item.name || 'Unnamed Electronics';
                        itemPrice = item.price || '0.00';
                        itemCategoryName = 'Electronics & Appliances';
                    } else {
                        // Default/Fallback structure
                        imagePath = item.image_url || 'images/placeholder.jpg';
                        itemName = item.name || item.book_title || 'Unnamed Item';
                        itemPrice = item.price || '0.00';
                        itemCategoryName = item.category || category.charAt(0).toUpperCase() + category.slice(1);
                    }
                    
                    // Template for item display
                    itemElement.innerHTML = `
                        <div class="contain-product layout-default" style="height: 100%; display: flex; flex-direction: column;">
                            <div class="product-thumb" style="height: 180px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                                <a href="#" class="link-to-product">
                                    <img src="${imagePath}" alt="${itemName}" width="180" height="180" class="product-thumnail" style="object-fit: contain;" onerror="this.onerror=null;this.src='images/placeholder.jpg';">
                                </a>
                            </div>
                            <div class="info" style="flex-grow: 1; display: flex; flex-direction: column;">
                                <b class="categories" style="height: 16px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: 11px;">${itemCategoryName}</b>
                                <h4 class="product-title" style="height: 38px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; font-size: 13px; margin: 5px 0;">
                                    <a href="#" class="pr-name">${itemName}</a>
                                </h4>
                                <div class="price" style="height: 22px; margin-top: 2px; font-size: 13px;">
                                    <ins><span class="price-amount"><span class="currencySymbol">KES </span>${parseFloat(itemPrice).toFixed(2)}</span></ins>
                                </div>
                                <div class="shipping-info">
                                    
                                </div>
                                <div class="slide-down-box" style="margin-top: auto;">
                                    <div class="buttons" style="padding: 4px 0;">
                                        <a href="#" class="btn wishlist-btn" style="padding: 4px 8px; font-size: 11px;"><i class="fa fa-heart" aria-hidden="true"></i></a>
                                        <a href="#" class="btn add-to-cart-btn" style="padding: 4px 8px; font-size: 11px;"><i class="fa fa-cart-arrow-down" aria-hidden="true"></i>add to cart</a>
                                        <a href="#" class="btn compare-btn" style="padding: 4px 8px; font-size: 11px;"><i class="fa fa-random" aria-hidden="true"></i></a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    productsListElement.appendChild(itemElement);
                });
                
                // Create pagination controls
                this.createPagination(currentPageData, totalPages, category);
                
            } else {
                // No items found
                this.productCategory.innerHTML = `<div style="text-align: center; width: 100%; padding: 20px;"><p>No ${titleText} found. Please check back later.</p></div>`;
                // Clear pagination if no items
                this.createPagination(0, 0, category); 
            }
        } catch (error) {
            // Handle fetch or processing errors
            const errorContainer = this.productCategory.querySelector('.products-list') || this.productCategory;
            if (errorContainer) {
                 errorContainer.innerHTML = '<div style="text-align: center; width: 100%; padding: 20px;"><p>Error loading items. Please try again later.</p></div>';
            }
            console.error(`Error loading ${category} items:`, error);
            // Clear pagination on error
            this.createPagination(0, 0, category);
        }
    }
    
    /**
     * Create pagination controls
     * @param {number} currentPage - The current page number
     * @param {number} totalPages - The total number of pages
     * @param {string} category - The category currently being displayed
     */
    createPagination(currentPage, totalPages, category) {
        // Find or create pagination container
        let paginationContainer = this.productCategory.querySelector('.biolife-panigations-block');
        if (!paginationContainer) {
            paginationContainer = document.createElement('div');
            paginationContainer.className = 'biolife-panigations-block';
            // Append after the .row containing products-list
            const productRow = this.productCategory.querySelector('.row');
            if (productRow && productRow.parentNode === this.productCategory) {
                this.productCategory.insertBefore(paginationContainer, productRow.nextSibling);
            } else {
                 this.productCategory.appendChild(paginationContainer);
            }
        }
        
        // Clear previous pagination
        paginationContainer.innerHTML = '';
        
        // Don't show pagination if only 1 page or 0 pages
        if (totalPages <= 1) {
            return;
        }
        
        const paginationList = document.createElement('ul');
        paginationList.className = 'panigation-contain';
        
        // Previous button
        if (currentPage > 1) {
            const prevLi = document.createElement('li');
            prevLi.innerHTML = '<a href="#" class="link-page prev"><i class="fa fa-angle-left" aria-hidden="true"></i></a>';
            prevLi.querySelector('a').addEventListener('click', (e) => {
                e.preventDefault();
                this.loadCategoryItems(category, currentPage - 1);
            });
            paginationList.appendChild(prevLi);
        }
        
        // Page numbers (simplified for brevity, could add logic for ellipsis)
        for (let i = 1; i <= totalPages; i++) {
            const pageLi = document.createElement('li');
            if (i === currentPage) {
                pageLi.innerHTML = `<span class="current-page">${i}</span>`;
            } else {
                pageLi.innerHTML = `<a href="#" class="link-page">${i}</a>`;
                pageLi.querySelector('a').addEventListener('click', (e) => {
                    e.preventDefault();
                    this.loadCategoryItems(category, i);
                });
            }
            paginationList.appendChild(pageLi);
        }
        
        // Next button
        if (currentPage < totalPages) {
            const nextLi = document.createElement('li');
            nextLi.innerHTML = '<a href="#" class="link-page next"><i class="fa fa-angle-right" aria-hidden="true"></i></a>';
            nextLi.querySelector('a').addEventListener('click', (e) => {
                e.preventDefault();
                this.loadCategoryItems(category, currentPage + 1);
            });
            paginationList.appendChild(nextLi);
        }
        
        paginationContainer.appendChild(paginationList);
    }
}

// Initialize the category loader
const categoryLoader = new CategoryLoader();

// Export for usage in other files if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CategoryLoader;
} 