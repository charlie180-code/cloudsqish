import initFolderScript from "./js/async/GetMyFolders.js";
import initFilesScript from "./js/async/GetMyFiles.js";

function initTabScript() {
    const tabs = document.querySelectorAll(".tab");
    const contentContainer = document.getElementById("content");

    /**
     * @param tabName - The name of the tab to load.
     * @param clickedTab - The tab element that was clicked.
     */
    const updateActiveTab = async (tabName, clickedTab) => {
        if (!contentContainer) return;

        tabs.forEach((tab) => tab.classList.remove("active"));
        clickedTab.classList.add("active");

        try {
            const response = await fetch(`./src/(tabs)/${tabName}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load ${tabName}.html`);
            }
            const htmlContent = await response.text();
            contentContainer.innerHTML = htmlContent;

            if (tabName === "home") {
                initFolderScript();
            }
            if (tabName === "archive") {
                initFilesScript();
            }
        } catch (error) {
            console.error(error);
            contentContainer.innerHTML = `<p>Error: Unable to load content.</p>`;
        }
    };

    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            const tabName = tab.getAttribute("data-tab");
            if (tabName) {
                updateActiveTab(tabName, tab);
            }
        });
    });

    const defaultTab = document.querySelector(".tab[data-tab='home']");
    if (defaultTab) {
        defaultTab.click();
    }
}

document.addEventListener("DOMContentLoaded", initTabScript);
