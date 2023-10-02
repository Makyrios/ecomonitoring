// Get references to the buttons and table containers
const pollutionBtn = document.getElementById("pollutionBtn");
const companiesBtn = document.getElementById("companiesBtn");
const pollutantsBtn = document.getElementById("pollutantsBtn");

const pollutionTable = document.getElementById("pollutionTable");
const companiesTable = document.getElementById("companiesTable");
const pollutantsTable = document.getElementById("pollutantsTable");

// Add event listeners to buttons
pollutionBtn.addEventListener("click", function () {
    pollutionBtn.classList.add("active");    // Add active class to Pollution button
    companiesBtn.classList.remove("active");    // Remove active class to Pollution button
    pollutantsBtn.classList.remove("active");    // Remove active class to Pollution button

    pollutionTable.style.display = "block"; // Show Pollution table
    companiesTable.style.display = "none";   // Hide Companies table
    pollutantsTable.style.display = "none";   // Hide Pollutants table
});

companiesBtn.addEventListener("click", function () {
    pollutionBtn.classList.remove("active");    // Add active class to Pollution button
    companiesBtn.classList.add("active");    // Add active class to Pollution button
    pollutantsBtn.classList.remove("active");    // Add active class to Pollution button

    pollutionTable.style.display = "none";   // Hide Pollution table
    companiesTable.style.display = "block";  // Show Companies table
    pollutantsTable.style.display = "none";   // Hide Pollutants table
});

pollutantsBtn.addEventListener("click", function () {
    pollutionBtn.classList.remove("active");    // Add active class to Pollution button
    companiesBtn.classList.remove("active");    // Remove active class to Pollution button
    pollutantsBtn.classList.add("active");    // Remove active class to Pollution button

    pollutionTable.style.display = "none";   // Hide Pollution table
    companiesTable.style.display = "none";   // Hide Companies table
    pollutantsTable.style.display = "block";  // Show Pollutants table
});