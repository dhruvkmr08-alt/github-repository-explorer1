// ======================================================
// GITHUB REPOSITORY EXPLORER - VERSION 2
// ======================================================


// ---------- Get HTML Elements ----------

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");

const languageFilter = document.getElementById("languageFilter");
const sortSelect = document.getElementById("sortSelect");

const results = document.getElementById("results");
const searchMessage = document.getElementById("searchMessage");

const loading = document.getElementById("loading");

const pagination = document.getElementById("pagination");
const previousButton = document.getElementById("previousButton");
const nextButton = document.getElementById("nextButton");
const pageNumber = document.getElementById("pageNumber");

const favoritesButton = document.getElementById("favoritesButton");
const compareButton = document.getElementById("compareButton");

const themeButton = document.getElementById("themeButton");

const detailsModal = document.getElementById("detailsModal");
const detailsContent = document.getElementById("detailsContent");
const closeModal = document.getElementById("closeModal");

const compareModal = document.getElementById("compareModal");
const comparisonContent = document.getElementById("comparisonContent");
const closeCompareModal =
    document.getElementById("closeCompareModal");


// ---------- Application State ----------

let repositories = [];

let currentPage = 1;

let totalPages = 1;

let currentSearch = "";

let favorites =
    JSON.parse(localStorage.getItem("githubFavorites")) || [];

let showingFavorites = false;

let debounceTimer;


// ======================================================
// SEARCH
// ======================================================

async function searchRepositories(page = 1) {

    const searchTerm = searchInput.value.trim();

    if (searchTerm === "") {

        results.innerHTML = "";

        searchMessage.textContent =
            "Please enter a repository name.";

        pagination.classList.add("hidden");

        return;
    }


    currentSearch = searchTerm;

    currentPage = page;

    showingFavorites = false;


    // Update URL

    const urlParams = new URLSearchParams();

    urlParams.set("q", searchTerm);

    urlParams.set("page", page);

    history.replaceState(
        null,
        "",
        `?${urlParams.toString()}`
    );


    // Show loading state

    loading.classList.remove("hidden");

    results.innerHTML = "";

    searchMessage.textContent = "";


    try {

        const url =
            `https://api.github.com/search/repositories?q=${encodeURIComponent(searchTerm)}&page=${page}&per_page=12`;

        const response = await fetch(url);


        if (!response.ok) {

            if (response.status === 403) {
                throw new Error(
                    "GitHub API rate limit reached."
                );
            }

            throw new Error(
                "GitHub API request failed."
            );
        }


        const data = await response.json();


        repositories = data.items;


        // GitHub can return a very large number of results.
        // We limit our page calculation.

        totalPages = Math.min(
            Math.ceil(data.total_count / 12),
            34
        );


        displayRepositories();


    } catch (error) {

        results.innerHTML = `
            <div class="repo-card">
                <h2>Something went wrong</h2>
                <p>${error.message}</p>
            </div>
        `;

        pagination.classList.add("hidden");

    } finally {

        loading.classList.add("hidden");

    }
}


// ======================================================
// DISPLAY REPOSITORIES
// ======================================================

function displayRepositories() {

    let filteredRepositories = [...repositories];


    // ---------- Language Filter ----------

    const selectedLanguage =
        languageFilter.value;


    if (selectedLanguage !== "all") {

        filteredRepositories =
            filteredRepositories.filter(repo => {

                return repo.language === selectedLanguage;

            });

    }


    // ---------- Sorting ----------

    const sortValue = sortSelect.value;


    if (sortValue === "stars") {

        filteredRepositories.sort(
            (a, b) =>
                b.stargazers_count -
                a.stargazers_count
        );

    }


    else if (sortValue === "forks") {

        filteredRepositories.sort(
            (a, b) =>
                b.forks_count -
                a.forks_count
        );

    }


    else if (sortValue === "name") {

        filteredRepositories.sort(
            (a, b) =>
                a.name.localeCompare(b.name)
        );

    }


    else if (sortValue === "updated") {

        filteredRepositories.sort(
            (a, b) =>
                new Date(b.updated_at) -
                new Date(a.updated_at)
        );

    }


    // ---------- No Results ----------

    if (filteredRepositories.length === 0) {

        results.innerHTML = `
            <div class="repo-card">
                <h2>No repositories found</h2>
                <p>
                    Try another search or change
                    the language filter.
                </p>
            </div>
        `;

        pagination.classList.add("hidden");

        return;
    }


    // ---------- Create Cards ----------

    results.innerHTML = "";


    filteredRepositories.forEach(repo => {

        const isFavorite =
            favorites.includes(repo.id);


        const card = document.createElement("article");

        card.className = "repo-card";


        card.innerHTML = `

            <h2>${escapeHTML(repo.full_name)}</h2>

            <p class="repo-description">
                ${escapeHTML(
                    repo.description ||
                    "No description available."
                )}
            </p>


            <div class="repo-info">

                <span>
                    ⭐ ${formatNumber(
                        repo.stargazers_count
                    )}
                </span>

                <span>
                    🍴 ${formatNumber(
                        repo.forks_count
                    )}
                </span>

                <span>
                    ${escapeHTML(
                        repo.language ||
                        "Not specified"
                    )}
                </span>

            </div>


            <div class="card-buttons">

                <button
                    class="details-button"
                    onclick="showRepositoryDetails(${repo.id})"
                >
                    More Details
                </button>


                <a
                    class="github-button"
                    href="${repo.html_url}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    GitHub
                </a>


                <button
                    class="favorite-button"
                    onclick="toggleFavorite(${repo.id})"
                >
                    ${isFavorite ? "❤️" : "♡"}
                </button>

            </div>


            <label>

                <input
                    type="checkbox"
                    class="compare-checkbox"
                    data-id="${repo.id}"
                >

                Select for comparison

            </label>

        `;


        results.appendChild(card);

    });


    updatePagination();

}


// ======================================================
// FILTER AND SORT EVENTS
// ======================================================

languageFilter.addEventListener(
    "change",
    displayRepositories
);


sortSelect.addEventListener(
    "change",
    displayRepositories
);


// ======================================================
// SEARCH BUTTON
// ======================================================

searchButton.addEventListener(
    "click",
    () => searchRepositories(1)
);


// ======================================================
// DEBOUNCED SEARCH
// ======================================================

searchInput.addEventListener(
    "input",
    () => {

        clearTimeout(debounceTimer);


        debounceTimer = setTimeout(() => {

            if (searchInput.value.trim() !== "") {

                searchRepositories(1);

            }

        }, 600);

    }
);


// ======================================================
// PAGINATION
// ======================================================

previousButton.addEventListener(
    "click",
    () => {

        if (currentPage > 1) {

            searchRepositories(
                currentPage - 1
            );

        }

    }
);


nextButton.addEventListener(
    "click",
    () => {

        if (currentPage < totalPages) {

            searchRepositories(
                currentPage + 1
            );

        }

    }
);


function updatePagination() {

    if (totalPages <= 1) {

        pagination.classList.add("hidden");

        return;
    }


    pagination.classList.remove("hidden");


    pageNumber.textContent =
        `Page ${currentPage} of ${totalPages}`;


    previousButton.disabled =
        currentPage === 1;


    nextButton.disabled =
        currentPage === totalPages;

}


// ======================================================
// FAVORITES
// ======================================================

function toggleFavorite(repositoryId) {

    const index =
        favorites.indexOf(repositoryId);


    if (index === -1) {

        favorites.push(repositoryId);

    } else {

        favorites.splice(index, 1);

    }


    localStorage.setItem(
        "githubFavorites",
        JSON.stringify(favorites)
    );


    displayRepositories();

}


favoritesButton.addEventListener(
    "click",
    showFavorites
);


function showFavorites() {

    showingFavorites = true;

    const favoriteRepositories =
        repositories.filter(repo =>
            favorites.includes(repo.id)
        );


    if (favoriteRepositories.length === 0) {

        results.innerHTML = `
            <div class="repo-card">
                <h2>No favorites yet</h2>
                <p>
                    Add repositories to your favorites
                    using the heart button.
                </p>
            </div>
        `;

        pagination.classList.add("hidden");

        return;
    }


    results.innerHTML = "";


    favoriteRepositories.forEach(repo => {

        const card =
            document.createElement("article");

        card.className = "repo-card";


        card.innerHTML = `

            <h2>${escapeHTML(repo.full_name)}</h2>

            <p class="repo-description">
                ${escapeHTML(
                    repo.description ||
                    "No description available."
                )}
            </p>

            <div class="repo-info">

                <span>
                    ⭐ ${formatNumber(
                        repo.stargazers_count
                    )}
                </span>

                <span>
                    🍴 ${formatNumber(
                        repo.forks_count
                    )}
                </span>

                <span>
                    ${escapeHTML(
                        repo.language ||
                        "Not specified"
                    )}
                </span>

            </div>

            <div class="card-buttons">

                <button
                    class="details-button"
                    onclick="showRepositoryDetails(${repo.id})"
                >
                    More Details
                </button>

                <a
                    class="github-button"
                    href="${repo.html_url}"
                    target="_blank"
                >
                    GitHub
                </a>

            </div>

        `;


        results.appendChild(card);

    });


    pagination.classList.add("hidden");

}


// ======================================================
// REPOSITORY DETAILS
// ======================================================

async function showRepositoryDetails(repositoryId) {

    const repo =
        repositories.find(
            item => item.id === repositoryId
        );


    if (!repo) {

        return;

    }


    detailsModal.classList.remove("hidden");


    detailsContent.innerHTML = `
        <p>Loading repository details...</p>
    `;


    try {

        // We request the repository's detailed
        // information from GitHub.

        const response =
            await fetch(repo.url);


        if (!response.ok) {

            throw new Error(
                "Unable to load repository details."
            );

        }


        const details =
            await response.json();


        detailsContent.innerHTML = `

            <div class="details-header">

                <img
                    class="avatar"
                    src="${details.owner.avatar_url}"
                    alt="Repository owner"
                >

                <div>

                    <h2>
                        ${escapeHTML(
                            details.full_name
                        )}
                    </h2>

                    <p>
                        Owner:
                        ${escapeHTML(
                            details.owner.login
                        )}
                    </p>

                </div>

            </div>


            <p>
                ${escapeHTML(
                    details.description ||
                    "No description available."
                )}
            </p>


            <div class="details-grid">

                <div class="detail-box">
                    <strong>
                        ${formatNumber(
                            details.stargazers_count
                        )}
                    </strong>
                    Stars
                </div>


                <div class="detail-box">
                    <strong>
                        ${formatNumber(
                            details.forks_count
                        )}
                    </strong>
                    Forks
                </div>


                <div class="detail-box">
                    <strong>
                        ${formatNumber(
                            details.open_issues_count
                        )}
                    </strong>
                    Issues
                </div>


                <div class="detail-box">
                    <strong>
                        ${escapeHTML(
                            details.language ||
                            "N/A"
                        )}
                    </strong>
                    Language
                </div>

            </div>


            <p>
                <strong>Default Branch:</strong>
                ${escapeHTML(
                    details.default_branch
                )}
            </p>


            <p>
                <strong>License:</strong>
                ${escapeHTML(
                    details.license?.name ||
                    "Not specified"
                )}
            </p>


            <br>


            <a
                class="github-button"
                href="${details.html_url}"
                target="_blank"
            >
                Open on GitHub
            </a>

        `;


    } catch (error) {

        detailsContent.innerHTML = `
            <p>${error.message}</p>
        `;

    }

}


closeModal.addEventListener(
    "click",
    () => {
        detailsModal.classList.add("hidden");
    }
);


// ======================================================
// REPOSITORY COMPARISON
// ======================================================

compareButton.addEventListener(
    "click",
    compareRepositories
);


function compareRepositories() {

    const selectedCheckboxes =
        document.querySelectorAll(
            ".compare-checkbox:checked"
        );


    if (selectedCheckboxes.length < 2) {

        alert(
            "Please select at least two repositories."
        );

        return;
    }


    if (selectedCheckboxes.length > 3) {

        alert(
            "You can compare up to three repositories."
        );

        return;
    }


    const selectedIds =
        Array.from(selectedCheckboxes)
            .map(checkbox =>
                Number(checkbox.dataset.id)
            );


    const selectedRepositories =
        repositories.filter(repo =>
            selectedIds.includes(repo.id)
        );


    comparisonContent.innerHTML = `

        <div class="details-grid">

            ${selectedRepositories.map(repo => `

                <div class="detail-box">

                    <h3>
                        ${escapeHTML(
                            repo.name
                        )}
                    </h3>

                    <br>

                    ⭐
                    ${formatNumber(
                        repo.stargazers_count
                    )}

                    <br>

                    🍴
                    ${formatNumber(
                        repo.forks_count
                    )}

                    <br>

                    🐛
                    ${formatNumber(
                        repo.open_issues_count
                    )}

                    <br>

                    Language:
                    ${escapeHTML(
                        repo.language ||
                        "N/A"
                    )}

                </div>

            `).join("")}

        </div>

    `;


    compareModal.classList.remove("hidden");

}


closeCompareModal.addEventListener(
    "click",
    () => {
        compareModal.classList.add("hidden");
    }
);


// ======================================================
// DARK MODE
// ======================================================

themeButton.addEventListener(
    "click",
    toggleTheme
);


function toggleTheme() {

    document.body.classList.toggle("dark");


    const darkMode =
        document.body.classList.contains("dark");


    localStorage.setItem(
        "darkMode",
        darkMode
    );


    themeButton.textContent =
        darkMode
            ? "☀️ Light Mode"
            : "🌙 Dark Mode";

}


if (
    localStorage.getItem("darkMode") === "true"
) {

    document.body.classList.add("dark");

    themeButton.textContent =
        "☀️ Light Mode";

}


// ======================================================
// URL SEARCH
// ======================================================

function loadSearchFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const query =
        params.get("q");


    const page =
        Number(
            params.get("page")
        ) || 1;


    if (query) {

        searchInput.value = query;

        searchRepositories(page);

    }

}


loadSearchFromURL();


// ======================================================
// HELPER FUNCTIONS
// ======================================================


// Format large numbers.
// Example: 1500 → 1.5K

function formatNumber(number) {

    if (number >= 1000000) {

        return (
            number / 1000000
        ).toFixed(1) + "M";

    }


    if (number >= 1000) {

        return (
            number / 1000
        ).toFixed(1) + "K";

    }


    return number;

}


// Prevent API text from being inserted
// directly as unsafe HTML.

function escapeHTML(value) {

    if (!value) {
        return "";
    }


    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(
