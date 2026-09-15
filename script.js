const searchButton = document.getElementById("searchButton");
const searchInput = document.getElementById("searchInput");
const results = document.getElementById("results");
const languageFilter = document.getElementById("languageFilter");
const sortSelect = document.getElementById("sortSelect");

let repositories = [];


searchButton.addEventListener("click", searchRepositories);


async function searchRepositories() {

    const searchTerm = searchInput.value.trim();

    if (searchTerm === "") {
        results.innerHTML = "<p>Please enter a search term.</p>";
        return;
    }

    results.innerHTML = "<p>Searching...</p>";

    const url =
        `https://api.github.com/search/repositories?q=${encodeURIComponent(searchTerm)}`;

    try {

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Request failed");
        }

        const data = await response.json();

        repositories = data.items;

        if (repositories.length === 0) {
            results.innerHTML = "<p>No repositories found.</p>";
            return;
        }

        displayRepositories();

    } catch (error) {

        results.innerHTML =
            "<p>Something went wrong. Please try again.</p>";

        console.log(error);
    }
}


function displayRepositories() {

    let filteredRepositories = [...repositories];

    const selectedLanguage = languageFilter.value;
    const selectedSort = sortSelect.value;


    if (selectedLanguage !== "") {

        filteredRepositories = filteredRepositories.filter(repo => {
            return repo.language === selectedLanguage;
        });

    }


    if (selectedSort === "stars") {

        filteredRepositories.sort((a, b) => {
            return b.stargazers_count - a.stargazers_count;
        });

    }


    if (selectedSort === "forks") {

        filteredRepositories.sort((a, b) => {
            return b.forks_count - a.forks_count;
        });

    }


    if (selectedSort === "name") {

        filteredRepositories.sort((a, b) => {
            return a.name.localeCompare(b.name);
        });

    }


    if (filteredRepositories.length === 0) {

        results.innerHTML = "<p>No repositories match the selected filter.</p>";
        return;

    }


    results.innerHTML = "";


    filteredRepositories.forEach(repo => {

        results.innerHTML += `

            <div class="repo-card">

                <h2>${repo.name}</h2>

                <p>
                    ${repo.description || "No description available."}
                </p>

                <p>
                    ⭐ Stars: ${repo.stargazers_count}
                </p>

                <p>
                    🍴 Forks: ${repo.forks_count}
                </p>

                <p>
                    Language: ${repo.language || "Not specified"}
                </p>

                <details>
                    <summary>More Details</summary>

                    <p>
                        Owner: ${repo.owner.login}
                    </p>

                    <p>
                        Open Issues: ${repo.open_issues_count}
                    </p>

                    <p>
                        Default Branch: ${repo.default_branch}
                    </p>

                    <a
                        href="${repo.html_url}"
                        target="_blank"
                    >
                        View Repository on GitHub
                    </a>

                </details>

            </div>

        `;

    });

}


languageFilter.addEventListener("change", displayRepositories);

sortSelect.addEventListener("change", displayRepositories);