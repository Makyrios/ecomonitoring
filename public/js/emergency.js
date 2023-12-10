function calculateLossessSum() {
  let LossessSum = document.getElementById('totalLossessAmount');
  let Lossess = document.querySelectorAll("#pollutionTable tr:not(.hidden) td:nth-child(17)");
  let sum = 0;
  Lossess.forEach(function (Lossess) {
    if (Lossess.textContent != '-') {
      sum += parseFloat(Lossess.textContent);
    }
  });
  LossessSum.textContent = sum.toFixed(2);
}

function toggleFilter(filterName, thName) {
  const filter = document.getElementById(filterName);
  const th = document.getElementById(thName);
  if (filter.classList.contains("filter-input-disabled")) {
    th.innerHTML = th.innerHTML.slice(0, -1) + "▲";
    filter.classList.remove("filter-input-disabled");
    filter.classList.add("filter-input");
  } 
  else {
    th.innerHTML = th.innerHTML.slice(0, -1) + "▼";
    filter.classList.remove("filter-input");
    filter.classList.add("filter-input-disabled");
  }
}


function filterTable() {
    const companyFilter = document.getElementById("companyFilter").value.toLowerCase();
    const yearFilter = document.getElementById("yearFilter").value;

    const rows = document.querySelectorAll("#rowData");

    rows.forEach(function (row) {
        const company = row.querySelector("td:nth-child(3)").innerHTML.toLowerCase();
        const year = row.querySelector("td:nth-child(4)").innerHTML;

        if (
            company.includes(companyFilter) &&
            (yearFilter === "" || year === yearFilter)
        ) {
            row.classList.remove('hidden');
        } else {
            row.classList.add('hidden');
        }
    });

    calculateLossessSum();
}

calculateLossessSum();