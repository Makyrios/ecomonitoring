function toggleFilter(filterName, thName) {
    const filter = document.getElementById(filterName);
    const th = document.getElementById(thName);
    if (filter.classList.contains("filter-input-disabled")) {
        th.innerHTML = th.innerHTML.slice(0, -1) + "▲";
        filter.classList.remove("filter-input-disabled");
        filter.classList.add("filter-input");
    } else {
        th.innerHTML = th.innerHTML.slice(0, -1) + "▼";
        filter.classList.remove("filter-input");
        filter.classList.add("filter-input-disabled");
    }
}


function filterTable() {
    const companyFilter = document.getElementById("companyFilter").value.toLowerCase();
    const pollutantFilter = document.getElementById("pollutantFilter").value.toLowerCase();
    const yearFilter = document.getElementById("yearFilter").value;

    const rows = document.querySelectorAll("#rowData");

    rows.forEach(function (row) {
        const company = row.querySelector("td:nth-child(1)").innerHTML.toLowerCase();
        const pollutant = row.querySelector("td:nth-child(2)").innerHTML.toLowerCase();
        const year = row.querySelector("td:nth-child(10)").innerHTML;

        if (
            company.includes(companyFilter) &&
            pollutant.includes(pollutantFilter) &&
            (yearFilter === "" || year === yearFilter)
        ) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });
}

// Popup window for color info
const HQ = document.getElementById("HQ");
const CR = document.getElementById("CR");

const tableCells = [HQ, CR];

tableCells.forEach(cell => {
    cell.addEventListener("mouseover", () => {
        let additionalInfo;
        if (cell.id === "HQ") {
            additionalInfo = document.getElementById("HQadditionalInfo");
        }
        else if (cell.id == "CR") {
            additionalInfo = document.getElementById("CRadditionalInfo");
        }
        additionalInfo.style.display = "block";

        additionalInfo.style.left = cell.getBoundingClientRect().x + cell.getBoundingClientRect().width / 2 + "px";
        additionalInfo.style.top = cell.getBoundingClientRect().y + "px";
    });

    cell.addEventListener("mouseout", () => {
        let additionalInfo;
        if (cell.id === "HQ") {
            additionalInfo = document.getElementById("HQadditionalInfo");
        }
        else if (cell.id == "CR") {
            additionalInfo = document.getElementById("CRadditionalInfo");
        }
        additionalInfo.style.display = "none";
    });
});