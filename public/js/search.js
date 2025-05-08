document.addEventListener("DOMContentLoaded", function () {
    const searchForm = document.querySelector(".form-search");
    const searchInput = searchForm.querySelector("input[name='s']");
    const categorySelect = searchForm.querySelector("select[name='category']");
    const resultsContainer = document.getElementById("searchResults");

    searchForm.addEventListener("submit", async function (event) {
        event.preventDefault();  // Prevent form submission
        const query = searchInput.value.trim();
        const category = categorySelect.value;

        if (query.length < 2) {
            resultsContainer.innerHTML = "";  // Clear results if query is too short
            return;
        }

        try {
            const response = await fetch(`/search?query=${query}&category=${category}`);
            const data = await response.json();

            if (data.results.length === 0) {
                resultsContainer.innerHTML = "<p>No results found</p>";
                return;
            }

            resultsContainer.innerHTML = data.results
                .map(
                    (item) => `
                    <div class="search-result">
                        <p><strong>${item.type}:</strong> ${item.book_title || item.name || item.equipment_name || item.product_name}</p>
                    </div>
                `
                )
                .join("");
        } catch (error) {
            console.error("Search error:", error);
        }
    });
});
