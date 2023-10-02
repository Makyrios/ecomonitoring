fetch('/companies')
    .then((response) => response.json())
    .then((data) => {
      const companySelect = document.getElementById('company_select');
      data.forEach((company) => {
        const option = document.createElement('option');
        option.value = company.idcompany;
        option.textContent = company.name;
        companySelect.appendChild(option);
      });
    });

// Fetch data for the pollutant select dropdown
fetch('/pollutants')
    .then((response) => response.json())
    .then((data) => {
        const pollutantSelect = document.getElementById('pollutant_select');
        data.forEach((pollutant) => {
        const option = document.createElement('option');
        option.value = pollutant.idpollutant;
        option.textContent = pollutant.name;
        pollutantSelect.appendChild(option);
    });
});