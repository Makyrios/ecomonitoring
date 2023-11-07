function checkValue(val) {
    if (val < 0 || val == null || val == NaN) {
        return '-';
      }
    return val;
}

function calculateTaxes() {
    let taxSum = 0;

    // Отримайте всі рядки (таблиці) в таблиці "pollutionTable"
    var rows = document.querySelectorAll("#pollutionTable tr:not(.hidden)");
  
    // Пропустіть перший рядок, оскільки це заголовок таблиці
    for (var i = 1; i < rows.length; i++) {
      // Отримайте комірку "Усього викидів підприємства, т/рік"
      var amountCell = rows[i].querySelector("td:nth-child(3)");
  
      // Отримайте комірку "Ставка податку для речовини"
      var rateCell = rows[i].querySelector("td:nth-child(4)");
  
      // Отримайте комірку "Податок"
      var taxCell = rows[i].querySelector("td:nth-child(6)");
  
      // Перевірте, чи всі необхідні комірки існують
      if (amountCell && rateCell && taxCell) {

        if (amountCell.textContent == '-' || rateCell.textContent == '-') {
          taxCell.textContent = '-';
          continue;
        }

        // Отримайте значення "Усього викидів підприємства, т/рік" та "Ставка податку для речовини"
        var amount = parseFloat(amountCell.textContent);
        var rate = parseFloat(rateCell.textContent);
  
        // Розрахуйте податок (множення викидів на ставку)
        var tax = amount * rate;

        taxSum += tax;
  
        // Встановіть результат у комірку "Податок"
        taxCell.textContent = tax;
      }
    }
    document.getElementById('totalTaxesAmount').textContent = taxSum;
  }


function calculateTaxSum() {
  let taxesSum = document.getElementById('totalTaxesAmount');
  let taxes = document.querySelectorAll("#pollutionTable tr:not(.hidden) td:nth-child(6)");
  let sum = 0;
  taxes.forEach(function (tax) {
    if (tax.textContent != '-') {
      sum += parseFloat(tax.textContent);
    }
  });
  taxesSum.textContent = sum.toFixed(2);
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
    const pollutantFilter = document.getElementById("pollutantFilter").value.toLowerCase();
    const yearFilter = document.getElementById("yearFilter").value;

    const rows = document.querySelectorAll("#rowData");

    rows.forEach(function (row) {
        const company = row.querySelector("td:nth-child(1)").innerHTML.toLowerCase();
        const pollutant = row.querySelector("td:nth-child(2)").innerHTML.toLowerCase();
        const year = row.querySelector("td:nth-child(5)").innerHTML;

        if (
            company.includes(companyFilter) &&
            pollutant.includes(pollutantFilter) &&
            (yearFilter === "" || year === yearFilter)
        ) {
            row.classList.remove('hidden');
        } else {
            row.classList.add('hidden');
        }
    });

    // calculateTaxes();
    calculateTaxSum();
}

calculateTaxSum();