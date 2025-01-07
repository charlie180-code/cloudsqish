import {
    toggleButtonState,
    handleServerErrors,
    clearAllErrorMessages,
    initAddFilesModal
} from "../utils.js";

export default function initFolderScript() {
    const userId = 1;
    const foldersTableBody = document.getElementById("folders-table-body");
    const foldersContainer = document.getElementById("folders-container");
    const noFoldersHero = document.getElementById("no-folders-hero");
    const saveFolderButton = document.getElementById("saveFolderButton");
    const createFolderForm = document.getElementById("createFolderForm");
    const folderDetailsPlaceholder = document.getElementById("folder-details-placeholder");
    const folderDetails = document.getElementById("folder-details");
    const folderDetailsContainer = document.getElementById('folder-details-container')
    const loadingSpinner = document.getElementById("loading-spinner");
    const errorMessage = document.getElementById("error-message");
    const folderInfo = document.getElementById("folder-info");

    document.getElementById('printFoldersButton').addEventListener('click', function() {
        fetch(`http://127.0.0.1:5001/archive/v1/generate-pdf-folders-list/${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/pdf'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to generate PDF');
            }
            return response.blob();
        })
        .then(blob => {
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.download = 'archives.pdf';
            link.click();

            URL.revokeObjectURL(url);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error generating PDF. Please try again later.');
        });
    });



    const initContextMenu = () => {
        const contextMenu = document.getElementById("contextMenu");
        let currentFolderId = null;

        const showContextMenu = (event, folderId) => {
            event.preventDefault();
            currentFolderId = folderId;

            contextMenu.style.left = `${event.pageX}px`;
            contextMenu.style.top = `${event.pageY}px`;
            contextMenu.classList.remove("d-none");
        };

        const hideContextMenu = () => contextMenu.classList.add("d-none");

        const handleRowRightClick = (row, folderId) => {
            row.addEventListener("contextmenu", (event) => showContextMenu(event, folderId));
        };

        document.addEventListener("click", hideContextMenu);

        document.getElementById("editFolder").addEventListener("click", () => {
            hideContextMenu();
            const rowElement = document.querySelector(`[data-folder-id='${currentFolderId}']`);
            if (rowElement) editFolder(currentFolderId, rowElement);
        });

        document.getElementById("attachFilesBtn")?.addEventListener("click", () => {
            if (currentFolderId) {
                attachFilesToFolder(currentFolderId);
            }
        });

        document.getElementById("deleteFolder").addEventListener("click", () => {
            hideContextMenu();
            deleteFolder(currentFolderId);
        });

        return handleRowRightClick;
    };


    const handleRowRightClick = initContextMenu();

    const fetchFolderDetails = async (folderId) => {
        try {
            loadingSpinner.style.display = "block";
            errorMessage.classList.add("d-none");
            folderDetails.classList.add("d-none");
            folderDetailsPlaceholder.classList.add("d-none");
    
            const response = await fetch(`http://127.0.0.1:5001/archive/v1/get-folder-details/${folderId}`);
            if (!response.ok) throw new Error("Failed to fetch folder details");
    
            const folderData = await response.json();
    
            folderDetails.classList.remove("d-none");
            folderDetailsPlaceholder.classList.add("d-none");
    
            folderInfo.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <h4><i class="bi-folder-fill text-warning me-2"></i>${folderData.name}</h4>
                    <button id="dismiss-button" class="btn btn-danger btn-sm">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
                <p><strong>Dossier N°:</strong> ${folderData.id || "N/A"}</p>
                <p><strong>Client:</strong> ${folderData.client || "N/A"}</p>
                <p><strong>Ajouté le:</strong> ${folderData.created_at}</p>
                <p>${folderData.description || "Aucune description disponible"}</p>
            `;
    
            let filesContainer = document.querySelector('#filesContainer');
            if (!filesContainer) {
                filesContainer = document.createElement('div');
                filesContainer.id = 'filesContainer';
            }
            filesContainer.innerHTML = '';
    
            const getFileIconClass = (extension) => {
                switch (extension.toLowerCase()) {
                    case "pdf": return "bi-file-earmark-pdf-fill text-danger";
                    case "png":
                    case "jpeg":
                    case "jpg": return "bi-file-earmark-image-fill text-primary";
                    case "doc":
                    case "docx": return "bi-file-earmark-word-fill text-info";
                    case "xls":
                    case "xlsx": return "bi-file-earmark-excel-fill text-success";
                    default: return "bi-file-earmark-fill";
                }
            };
    
            if (folderData.files && folderData.files.length > 0) {
                const fileList = document.createElement('ul');
                fileList.style.listStyleType = "none";
    
                folderData.files.forEach(file => {
                    const fileItem = document.createElement('li');
                    fileItem.style.marginBottom = "10px";
                    const fileIconClass = getFileIconClass(file.file_type);
    
                    if (file.url) {
                        fileItem.innerHTML = `
                            <a href="${file.url}" style="text-decoration:none">
                                <i class="bi ${fileIconClass}"></i> ${file.name}
                            </a>
                        `;
                    } else {
                        fileItem.innerHTML = `
                            <div class="text-dark d-flex align-items-center">
                                <i class="bi bi-file-earmark-fill"></i> ${file.name}
                            </div>
                        `;
                    }
                    fileList.appendChild(fileItem);
                });
    
                filesContainer.appendChild(fileList);
            } else {
                filesContainer.innerHTML = "<p>Aucun fichier disponible dans ce dossier.</p>";
            }
    
            folderDetails.appendChild(filesContainer);
    
            const dismissButton = document.getElementById('dismiss-button');
            dismissButton.addEventListener('click', () => {
                folderDetails.classList.add('d-none');
                folderDetailsPlaceholder.classList.remove('d-none');
            });
    
        } catch (error) {
            console.error("Error fetching folder details:", error);
            errorMessage.classList.remove("d-none");
            errorMessage.textContent = "Une erreur s'est produite lors du chargement des détails du dossier.";
        } finally {
            loadingSpinner.style.display = "none";
        }
    };
    


    const handleRowDoubleClick = (row, folderId) => {
        row.addEventListener("dblclick", () => {
            fetchFolderDetails(folderId);
        });
    };

    const fetchFolders = async (page = 1, limit = 10) => {
        try {
            if (!foldersTableBody) throw new Error("foldersTableBody element not found");
    
            const response = await fetch(`http://127.0.0.1:5001/archive/v1/get-my-client-folders/${userId}?page=${page}&limit=${limit}`);
            if (!response.ok) throw new Error("Failed to fetch folders");
    
            const data = await response.json();
            const { folders, total, pages, current_page } = data;
    
            foldersTableBody.innerHTML = "";
            const monthYearOptions = new Set();
    
            if (folders.length === 0) {
                foldersContainer?.classList.add("d-none");
                noFoldersHero?.classList.remove("d-none");
                folderDetailsContainer?.classList.add("d-none");
            } else {
                foldersContainer?.classList.remove("d-none");
                noFoldersHero?.classList.add("d-none");
                folderDetailsContainer?.classList.remove("d-none");
    
                folders.forEach((folder) => {
                    const date = new Date(folder.created_at);
                    const monthYear = `${date.getMonth() + 1}-${date.getFullYear()}`;
    
                    monthYearOptions.add(monthYear);
    
                    const row = document.createElement("tr");
                    row.dataset.folderId = folder.id;
                    row.innerHTML = `
                        <td><i class="bi-folder-fill text-warning me-2"></i></td>
                        <td>${folder.id}</td>
                        <td class="folder-name">${folder.name}</td>
                        <td class="folder-client">${folder.client || "N/A"}</td>
                        <td>${folder.created_at}</td>
                    `;
                    foldersTableBody.appendChild(row);
                    handleRowDoubleClick(row, folder.id);
                    handleRowRightClick(row, folder.id);
                });
            }
    
            // Sorting logic
            const sortByName = (folders) => folders.sort((a, b) => a.name.localeCompare(b.name));
            const sortByDateAscending = (folders) => folders.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            const sortByDateDescending = (folders) => folders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
            document.getElementById("sortByName").addEventListener("click", () => {
                const sortedFolders = sortByName([...folders]);
                updateFolderTable(sortedFolders);
            });
    
            document.getElementById("sortByDateAscending").addEventListener("click", () => {
                const sortedFolders = sortByDateAscending([...folders]);
                updateFolderTable(sortedFolders);
            });
    
            document.getElementById("sortByDateDescending").addEventListener("click", () => {
                const sortedFolders = sortByDateDescending([...folders]);
                updateFolderTable(sortedFolders);
            });
    
            // Populate the Month/Year filter dropdown
            const monthYearFilter = document.getElementById("monthYearFilter");
            monthYearFilter.innerHTML = ""; // Clear existing options
            monthYearOptions.forEach((option) => {
                const optionElement = document.createElement("option");
                optionElement.value = option;
                const [month, year] = option.split("-");
                const monthNames = [
                    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
                    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
                ];
                optionElement.textContent = `${monthNames[parseInt(month) - 1]} ${year}`;
                monthYearFilter.appendChild(optionElement);
            });
    
            // Update pagination
            updatePagination(current_page, pages);
        } catch (error) {
            console.error("Error fetching folders:", error);
            foldersTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-danger">
                        Unable to load folders. Please try again later.
                    </td>
                </tr>
            `;
        }
    };
    
    const updatePagination = (currentPage, totalPages) => {
        const paginationContainer = document.getElementById("pagination");
        paginationContainer.innerHTML = "";
    
        for (let i = 1; i <= totalPages; i++) {
            const button = document.createElement("button");
            button.textContent = i;
            button.className = `btn btn-sm ${i === currentPage ? "btn-primary" : "btn-outline-primary"}`;
            button.addEventListener("click", () => fetchFolders(i));
            paginationContainer.appendChild(button);
        }
    };
    
    
    // Filtering logic
    document.getElementById("monthYearFilter").addEventListener("change", (e) => {
        const selectedMonthYear = e.target.value;
        const filteredFolders = folders.filter(folder => {
            const folderDate = new Date(folder.created_at);
            const folderMonthYear = `${folderDate.getMonth() + 1}-${folderDate.getFullYear()}`;
            return folderMonthYear === selectedMonthYear;
        });
        updateFolderTable(filteredFolders);
    });
    
    // Folder search logic
    document.getElementById("folderSearchInput").addEventListener("input", (e) => {
        const searchTerm = e.target.value.trim().toLowerCase();
        const filteredFolders = folders.filter(folder => {
            return folder.name.toLowerCase().includes(searchTerm) || folder.client.toLowerCase().includes(searchTerm);
        });
        updateFolderTable(filteredFolders);
    });
    
    // Function to update the folder table
    const updateFolderTable = (folders) => {
        foldersTableBody.innerHTML = "";
        folders.forEach(folder => {
            const row = document.createElement("tr");
            row.dataset.folderId = folder.id;
            row.innerHTML = `
                <td><i class="bi-folder-fill text-warning me-2"></i></td>
                <td>${folder.id}</td>
                <td class="folder-name">${folder.name}</td>
                <td class="folder-client">${folder.client || "N/A"}</td>
                <td>${folder.created_at}</td>
            `;
            foldersTableBody.appendChild(row);
            handleRowDoubleClick(row, folder.id);
            handleRowRightClick(row, folder.id);
        });
    };
    

    const createFolder = async () => {
        const folderName = document.getElementById("folderName")?.value.trim();
        const folderClient = document.getElementById("folderClient")?.value.trim();
        const archiveDate = document.getElementById("archiveDate")?.value.trim();
        const comments = document.getElementById("comments")?.value.trim();
        const companyId = 1;

        clearAllErrorMessages();

        const folderData = { 
            name: folderName, 
            client: folderClient, 
            company_id: companyId 
        };

        if (archiveDate) {
            folderData.date = archiveDate;
        }

        if (comments) {
            folderData.comments = comments;
        }

        toggleButtonState(saveFolderButton, true);

        try {
            const response = await fetch(`http://127.0.0.1:5001/archive/v1/get-my-client-folders/${userId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(folderData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.field === "folderName") {
                    handleServerErrors("EmptyFolderName", errorData.error);
                } else if (errorData.field === "folderClient") {
                    handleServerErrors("EmptyClientName", errorData.error);
                }
                return;
            }

            createFolderForm.reset();
            bootstrap.Modal.getInstance(document.getElementById("createFolderModal"))?.hide();
            await fetchFolders();
            window.location.reload();
        } catch (error) {
            console.error("Error creating folder:", error);
            alert("An error occurred while creating the folder. Please try again.");
        } finally {
            toggleButtonState(saveFolderButton, false);
        }
    };

    const editFolder = async (folderId, rowElement) => {
        const nameCell = rowElement.querySelector(".folder-name");
        const clientCell = rowElement.querySelector(".folder-client");

        nameCell.setAttribute("contenteditable", "true");
        clientCell.setAttribute("contenteditable", "true");
        nameCell.classList.add("editable");
        clientCell.classList.add("editable");
        nameCell.focus();

        const saveChanges = async () => {
            const newName = nameCell.textContent.trim();
            const newClient = clientCell.textContent.trim();

            try {
                const response = await fetch(`http://127.0.0.1:5001/archive/v1/edit-my-client-folder/${folderId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: newName, client: newClient }),
                });

                if (!response.ok) throw new Error("Failed to edit folder");
                window.location.reload();
            } catch (error) {
                console.error("Error updating folder:", error);
                alert("An error occurred while updating the folder.");
            } finally {
                nameCell.removeAttribute("contenteditable");
                clientCell.removeAttribute("contenteditable");
                nameCell.classList.remove("editable");
                clientCell.classList.remove("editable");
            }
        };

        nameCell.addEventListener("blur", saveChanges, { once: true });
        clientCell.addEventListener("blur", saveChanges, { once: true });
    };

    const attachFilesToFolder = (folderId) => {
        const addFileModal = new bootstrap.Modal(document.getElementById("addFileModalEngineering"));
        const destinationFolder = document.getElementById("DestinationFolderSelect");
    
        if (!destinationFolder) {
            console.error("Destination folder dropdown not found");
            return;
        }
    
        destinationFolder.innerHTML = `<option value="" disabled>Sélectionnez un dossier</option>`;
    
        fetch(`http://127.0.0.1:5001/archive/v1/get-my-client-folders/${userId}`)
            .then(response => response.json())
            .then(folders => {
                folders.forEach(folder => {
                    const option = document.createElement("option");
                    option.value = folder.id;
                    option.textContent = folder.name;
                    destinationFolder.appendChild(option);
                });
    
                const folderOption = destinationFolder.querySelector(`option[value="${folderId}"]`);
                if (folderOption) folderOption.selected = true;
    
                initAddFilesModal();
    
                addFileModal.show();
            })
            .catch(error => {
                console.error("Error fetching folders for dropdown:", error);
            });
    };    

    document.getElementById("addFileForm")?.addEventListener("submit", async (event) => {
        event.preventDefault();
    
        const formData = new FormData(event.target);
        const selectedFolderId = formData.get("destination_folder");
    
        const submitButton = document.getElementById("submitButton");
        const buttonText = document.getElementById("buttonText");
        const submitSpinner = document.getElementById("submitSpinner");
        const addFilesLoadingText = document.getElementById("AddfilesloadingText");
        const iconText = document.getElementById("IconText");
    
        submitSpinner.classList.remove("d-none");
        buttonText.style.display = 'none';
        iconText.classList.add("d-none");
        addFilesLoadingText.style.display = "inline";
        submitButton.disabled = true;
    
        try {
            const response = await fetch(`http://127.0.0.1:5001/archive/v1/attach-my-client-files/${selectedFolderId}`, {
                method: "POST",
                body: formData,
            });
    
            const result = await response.json();
    
            if (response.ok) {
                bootstrap.Modal.getInstance(document.getElementById("addFileModalEngineering"))?.hide();
    
                const successModal = new bootstrap.Modal(document.getElementById("successModal"));
                successModal.show();
            } else {
                alert(result.error || "An error occurred while attaching the files.");
            }
        } catch (error) {
            console.error("Error attaching files:", error);
            alert("An error occurred while attaching the files.");
        } finally {
            submitSpinner.classList.add("d-none");
            buttonText.style.display = 'block';
            iconText.classList.remove("d-none");
            addFilesLoadingText.style.display = "none";
            submitButton.disabled = false;
        }
    });
    

    const deleteFolder = async (folderId) => {
        if (!confirm("Etes vous sur de vouloir ce dossier ainsi que tous ses fichiers?")) return;
    
        const successModal = new bootstrap.Modal(document.getElementById("DeletesuccessModal"));
        const errorModal = new bootstrap.Modal(document.getElementById("errorModal"));
        const errorModalBody = document.getElementById("errorModalBody");
    
        try {    
            const response = await fetch(`http://127.0.0.1:5001/archive/v1/delete-folder/${folderId}`, {
                method: "DELETE",
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "An unexpected error occurred.");
            }
            await fetchFolders();
            window.location.reload();
        } catch (error) {
            console.error("Error deleting folder:", error);
    
            errorModalBody.textContent = error.message || "An unexpected error occurred while deleting the folder.";
            errorModal.show();
        }
    };
    
    const folderSearchInput = document.getElementById("folderSearchInput");

    const highlightText = (text, query) => {
        if (!query) return text;
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, `<mark style="background-color: yellow;">$1</mark>`);
    };

    const filterFolders = () => {
        const query = folderSearchInput.value.toLowerCase();
        const rows = document.querySelectorAll("#folders-table-body tr");

        rows.forEach(row => {
            const folderNameCell = row.querySelector(".folder-name");
            const clientNameCell = row.querySelector(".folder-client");
            const uniqueIdCell = row.children[2];

            const folderName = folderNameCell?.textContent.toLowerCase() || "";
            const clientName = clientNameCell?.textContent.toLowerCase() || "";
            const uniqueId = uniqueIdCell?.textContent.toLowerCase() || "";

            const matches = folderName.includes(query) || clientName.includes(query) || uniqueId.includes(query);

            if (matches) {
                row.style.display = "";

                folderNameCell.innerHTML = highlightText(folderNameCell.textContent, query);
                clientNameCell.innerHTML = highlightText(clientNameCell.textContent, query);
                uniqueIdCell.innerHTML = highlightText(uniqueIdCell.textContent, query);
            } else {
                row.style.display = "none";
            }
        });
    };

    if (folderSearchInput) {
        folderSearchInput.addEventListener("input", () => {
            const rows = document.querySelectorAll("#folders-table-body tr");
            rows.forEach(row => {
                const folderNameCell = row.querySelector(".folder-name");
                const clientNameCell = row.querySelector(".folder-client");
                const uniqueIdCell = row.children[1];

                folderNameCell.innerHTML = folderNameCell.textContent;
                clientNameCell.innerHTML = clientNameCell.textContent;
                uniqueIdCell.innerHTML = uniqueIdCell.textContent;
            });

            filterFolders();
        });
    }

    

    saveFolderButton.addEventListener("click", createFolder);

    fetchFolders();

}
