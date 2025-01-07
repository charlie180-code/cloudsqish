export default function initFilesScript() {
    const userId = 1;
    const filesTableBody = document.getElementById("files-table-body");
    const filesContainer = document.getElementById("files-container");
    const noFilesHero = document.getElementById("no-files-hero");
    const monthYearSelect = document.querySelector('.form-select');

    const deleteFile = async (fileId) => {
        if (!confirm("Etes vous sûre de vouloir supprimer ce fichier?")) {
            return;
        }

        try {
            const response = await fetch(`http://127.0.0.1:5001/archive/v1/delete-file/${fileId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to delete file");
            }

            const result = await response.json();
            alert(result.message || "File successfully deleted");
            fetchFilesByUser(userId);
        } catch (error) {
            console.error("Error deleting file:", error);
            alert(error.message || "An error occurred while deleting the file.");
        }
    };


    const fetchFilesByUser = async (userId) => {
        try {
            const response = await fetch(`http://127.0.0.1:5001/archive/v1/get-files-by-user/${userId}`);
            if (!response.ok) throw new Error("Failed to fetch files");

            const files = await response.json();
            filesTableBody.innerHTML = "";

            if (files.length === 0) {
                displayNoResultsMessage("");
            } else {
                populateMonthYearOptions(files);
                displayFiles(files);
            }
        } catch (error) {
            console.error("Error fetching files:", error);
            filesTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-danger">
                        Unable to load files. Please try again later.
                    </td>
                </tr>
            `;
        }
    };

    const filterFilesByMonthYear = async (userId, monthYear) => {
        try {
            const response = await fetch(`http://127.0.0.1:5001/archive/v1/get-files-by-user/${userId}`);
            if (!response.ok) throw new Error("Failed to fetch files");

            const files = await response.json();
            const [month, year] = monthYear.split("-");
            const filteredFiles = files.filter(file => {
                const fileDate = new Date(file.uploaded_at);
                return (
                    fileDate.getMonth() === getMonthIndex(month) &&
                    fileDate.getFullYear() === parseInt(year)
                );
            });

            if (filteredFiles.length === 0) {
                displayNoResultsMessage(`${month}-${year}`);
            } else {
                displayFiles(filteredFiles);
            }
        } catch (error) {
            console.error("Error filtering files by month-year:", error);
        }
    };

    const populateMonthYearOptions = (files) => {
        const uniqueMonths = new Set();

        files.forEach(file => {
            const fileDate = new Date(file.uploaded_at);
            const monthYear = `${getMonthName(fileDate.getMonth())}-${fileDate.getFullYear()}`;
            uniqueMonths.add(monthYear);
        });

        monthYearSelect.innerHTML = Array.from(uniqueMonths).sort().map(monthYear => `
            <option value="${monthYear.toLowerCase()}">${monthYear}</option>
        `).join('');
    };

    const searchUserFoldersOrFiles = async (userId, query) => {
        try {
            const response = await fetch(`http://127.0.0.1:5001/archive/v1/search-user-folders-or-files/${userId}?query=${query}`);
            if (!response.ok) throw new Error("Failed to search folders");

            const results = await response.json();
            displaySearchResults(query, results);
        } catch (error) {
            console.error("Error searching folders:", error);
        }
    };

    const displayFiles = (files) => {
        filesContainer.classList.remove("d-none");
        noFilesHero.classList.add("d-none");
    
        filesTableBody.innerHTML = files.map((file, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>
                    ${file.filepath ? `
                        <a href="${file.filepath}" download class="text-decoration-none text-dark d-flex align-items-center">
                            <i class="bi ${getFileIconClass(file.filepath)} me-2"></i>
                            ${file.label}
                        </a>
                    ` : `
                        <div class="d-flex align-items-center text-dark">
                            <i class="bi bi-file-earmark-fill me-2"></i>
                            ${file.label}
                        </div>
                    `}
                </td>
                <td>${new Date(file.uploaded_at).toLocaleDateString()}</td>
                <td>
                    <div class="file-info">
                        <strong>${file.folder_name || "N/A"}</strong> ${file.folder_id || ""}<br />
                        <em>${file.client_name || "N/A"}</em>
                    </div>
                </td>
                <td class="text-end">
                    <button class="btn btn-danger btn-sm" onclick="deleteFile(${file.id})">
                        <i class="bi bi-trash"></i> Supprimer
                    </button>
                </td>
            </tr>
        `).join('');
    };
    
    
    
    const displaySearchResults = (query, results) => {
        filesTableBody.innerHTML = "";
    
        if (results.length === 0) {
            displayNoResultsMessage(query);
        } else {
            filesContainer.classList.remove("d-none");
            noFilesHero.classList.add("d-none");
    
            results.forEach((folder) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td colspan="5">
                        <strong class="highlighted">${folder.name} (ID: ${folder.unique_id})</strong><br />
                        <em>Client: ${folder.client_name || "N/A"}</em>
                        <ul class="list-unstyled">
                            ${folder.files.map(file => `
                                <li class="highlighted">
                                    ${file.filepath ? `
                                        <a href="${file.filepath}" download class="text-decoration-none text-dark">
                                            <i class="bi ${getFileIconClass(file.filepath)} me-2"></i>
                                            ${file.label}
                                        </a>
                                    ` : `
                                        <div class="text-dark d-flex align-items-center">
                                            <i class="bi bi-file-earmark-fill me-2"></i>
                                            ${file.label}
                                        </div>
                                    `}
                                </li>
                            `).join('')}
                        </ul>
                    </td>
                `;
                filesTableBody.appendChild(row);
            });
        }
    };
    
    

    const displayNoResultsMessage = (query) => {
        filesContainer.classList.add("d-none");
        noFilesHero.classList.remove("d-none");
        filesTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">
                    Aucun résultat trouvé pour "${query}"
                </td>
            </tr>
        `;
    };

    const getFileIconClass = (filepath) => {
        const extension = filepath.split(".").pop().toLowerCase();
        switch (extension) {
            case "pdf":
                return "bi-file-earmark-pdf-fill text-danger";
            case "png":
            case "jpeg":
            case "jpg":
                return "bi-file-earmark-image-fill text-primary";
            case "doc":
            case "docx":
                return "bi-file-earmark-word-fill text-info";
            case "xls":
            case "xlsx":
                return "bi-file-earmark-excel-fill text-success";
            default:
                return "bi-file-earmark-fill";
        }
    };

    const getMonthIndex = (month) => {
        const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
        return months.indexOf(month.toLowerCase());
    };

    const getMonthName = (index) => {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return months[index];
    };

    document.querySelector('.input-group input').addEventListener('input', (event) => {
        const query = event.target.value.trim();
        if (query) {
            searchUserFoldersOrFiles(userId, query);
        } else {
            fetchFilesByUser(userId);
        }
    });

    monthYearSelect.addEventListener('change', (event) => {
        const selectedMonthYear = event.target.value;
        if (selectedMonthYear) {
            filterFilesByMonthYear(userId, selectedMonthYear);
        }
    });

    document.querySelector('.input-group input').addEventListener('input', (event) => {
        const query = event.target.value.trim();
        if (query) {
            searchUserFoldersOrFiles(userId, query);
        } else {
            fetchFilesByUser(userId);
        }
    });

    window.deleteFile = deleteFile;

    fetchFilesByUser(userId);
}
