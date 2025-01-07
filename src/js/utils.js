export function toggleButtonState(button, isLoading) {
    const spinner = button.querySelector(".spinner-border");
    const loadingText = button.querySelector("#loadingText");
    const icon = button.querySelector("#Icon");
    const buttonText = button.querySelector('#buttonText');

    if (isLoading) {
        spinner?.classList.remove("d-none");
        loadingText?.classList.remove("d-none");
        icon?.classList.add("d-none");
        buttonText?.classList.add('d-none');
        button.disabled = true;
    } else {
        spinner?.classList.add("d-none");
        loadingText?.classList.add("d-none");
        icon?.classList.remove("d-none");
        buttonText?.classList.remove('d-none');
        button.disabled = false;
    }
}

export function handleServerErrors(errorFieldId, errorMessage) {
    const errorField = document.getElementById(errorFieldId);

    if (errorField) {
        errorField.textContent = errorMessage;
        errorField.classList.remove("d-none");
    }
}

export function clearAllErrorMessages() {
    const errorFields = document.querySelectorAll(".text-danger");
    errorFields.forEach((field) => {
        field.classList.add("d-none");
        field.textContent = "";
    });
}


export function initAddFilesModal() {
    const addRowBtn = document.getElementById("addRowBtn");
    const selectDeleteBtn = document.getElementById("selectDeleteBtn");
    const fileInputRowsContainer = document.querySelector(".file-input-rows");

    addRowBtn.addEventListener("click", () => {
        const newRow = document.createElement("div");
        newRow.classList.add("row", "my-3", "align-items-end", "file-input-row");
        
        newRow.innerHTML = `
            <div class="col">
                <label class="form-label">Label</label>
                <input type="text" class="form-control" name="labels[]" placeholder="Entrez le titre du fichier..." required>
            </div>
            <div class="col">
                <label class="form-label">Fichier</label>
                <input type="file" class="form-control" name="files[]">
            </div>
            <div class="col-auto">
                <button type="button" class="btn btn-danger remove-row-btn">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        
        fileInputRowsContainer.appendChild(newRow);
        
        newRow.querySelector(".remove-row-btn").addEventListener("click", () => {
            newRow.remove();
        });
    });

    let isDeleteMode = false;

    selectDeleteBtn.addEventListener("click", () => {
        isDeleteMode = !isDeleteMode;
        selectDeleteBtn.classList.toggle("btn-danger", isDeleteMode);
        selectDeleteBtn.innerHTML = isDeleteMode ? "<i class='bi bi-x-circle'></i> Annuler" : "<i class='bi bi-check2-square'></i> Sélectionner pour supprimer";

        const removeButtons = document.querySelectorAll(".remove-row-btn");
        removeButtons.forEach(btn => {
            btn.disabled = !isDeleteMode;
        });
    });
}
