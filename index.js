let conversionRate = null; // The conversion rate from USD to CAD
var productDataTable;
var allData; // Global variable to store all the data
// init table

$(document).ready(function() {
    // Initialize DataTables
    $('#retailer-filters input[type="checkbox"]').on('change', function() {
        let isChecked = $(this).is(':checked');
        let retailer = $(this).attr('name');
    
        if (isChecked) {
            loadDataForRetailer(retailer);
            populateBrandDropdownForRetailer(retailer);
        } else {
            productDataTable.clear().draw();
        }
    });
    setupFilters();
    applyFiltersAndToggleTable();

    $('#product-type-filters input[type="checkbox"]').on('change', function() {
        sortBrandsBasedOnSelectedProductType();
        productDataTable.draw();
    });
    $('#brandFilter').on('change', function() {
        productDataTable.draw();
    });
    // Fetch the conversion rate once when the page loads or DataTables is initialized.
    getConversionRate('USD', 'CAD', function(rate) {
        if (rate) {
            conversionRate = rate;
            initDataTable(); // Initialize DataTables after getting the rate
        } else {
            console.error('Failed to get the conversion rate. Initializing DataTable without conversion.');
            initDataTable();
        }
    });    

    function sortBrandsBasedOnSelectedProductType() {
        var selectedTypes = $('#product-type-filters input[type="checkbox"]:checked').map(function() {
            return this.value;
        }).get();
    
        var brandsUnderSelectedTypes = allData
            .filter(product => selectedTypes.includes(product.product_type))
            .map(product => product.brand_name)
            .filter((value, index, self) => self.indexOf(value) === index)
            .sort();
    
        $('#brandFilter').empty();
        $('#brandFilter').append(new Option("Select a brand", "", false, false)); // Default option
    
        brandsUnderSelectedTypes.forEach(function(brand) {
            var option = new Option(brand, brand, false, false);
            $('#brandFilter').append(option);
        });
    }

    function initializeDataTable(dataObj) {
    // $.get("assets/hd_products.csv?" + new Date().getTime(), function(csvString) {
        // var dataObj = Papa.parse(csvString, {header: true, skipEmptyLines: true}).data;
        return $('#productDataTable').DataTable({
        // productDataTable = $('#productDataTable').DataTable({
            data: dataObj,
            autoWidth: false,
            columns: [
                { data: "product_type" },
                {
                    data: "brand_name",
                    render: function(data, type, row) {
                        return '<span class="capitalize">' + data + '</span>';
                    }
                },                        
                {
                    data: "product_description",
                    render: function(data, type, row) {
                        return '<span class="truncate" title="' + data + '">' + data + '</span>';
                    }
                },
                { data: "search_result_id" },
                {   data: "watersense_certified",
                        render: function(data, type, row) {
                            return data == "1" ? "✔" : "✖";
                    }
                },
                {   data: "energy_star_certified",
                        render: function(data, type, row) {
                            return data == "1" ? "✔" : "✖";
                    }
                },
                {   data: "ada_certified",
                        render: function(data, type, row) {
                            return data == "1" ? "✔" : "✖";
                    }
                },
                { data: "product_url",
                    render: function(data, type, row) {
                        return '<a href="' + data + '">Link</a>';
                    }
                },
                {
                    data: "image_url",
                    render: function(data, type, row) {
                        return '<img src="' + data + '" alt="Product Image" width="75" />';
                    }
                },
                {
                    data: "product_rating",
                    render: function(data, type, row) {
                        var rating = parseInt(data);
                        return '<span class="star-rating">' + '★'.repeat(rating) + '☆'.repeat(5-rating) + '</span>';
                    }
                },                        
                {
                    data: null,
                    render: function(data, type, row) {
                        let costValue = parseFloat(row.cost); 
    
                        // If the currency is USD and we have a conversion rate, convert it to CAD
                        if (row.currency === 'USD' && conversionRate) {
                            costValue *= conversionRate;
                            row.currency = 'CAD'; // Change currency to CAD after conversion
                        }
    
                        // For display, return the formatted cost with currency
                        if (type === 'display') {
                            return costValue.toFixed(2) + ' ' + row.currency; // Use toFixed(2) to format as currency
                        }
    
                        // For sorting, return the numerical value
                        return costValue;
                    },
                    title: 'Cost'
                }
            ]
        });
    }        

    function loadDataForRetailer(retailer) {
        $.get(`assets/${retailer}_products.csv?` + new Date().getTime(), function(csvString) {
            var dataObj = Papa.parse(csvString, { header: true, skipEmptyLines: true }).data;

            allData = dataObj; // Store all the data in a global variable
            productDataTable = initializeDataTable(dataObj);
            productDataTable.draw(); // Force a redraw after data is loaded or table is initialized

            populateBrandDropdownForRetailer(dataObj);
            applyFiltersAndToggleTable(); // Ensure this is called after loading data
        });
    }
    
    function populateBrandDropdownForRetailer(dataObj) {
        var brandsUnderRetailer = dataObj
            .map(product => product.brand_name)
            .filter((value, index, self) => self.indexOf(value) === index)
            .sort(); // Sort the brands in alphabetical order
    
        $('#brandFilter').empty();
    
        // Add a default null option
        $('#brandFilter').append(new Option("Select a brand", "", false, false));
        
        brandsUnderRetailer.forEach(function(brand) {
            var option = new Option(brand, brand, false, false);
            $('#brandFilter').append(option);
        });
    }
    function setupFilters() {
        // Custom DataTables filter
        $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
            var productType = data[0];
            var isWatersense = data[4];
            var isEnergyStar = data[5];
            var isAda = data[6];

            var selectedTypes = $('#product-type-filters input[type="checkbox"]:checked').map(function() {
                return this.value;
            }).get();
            var selectedBrand = $('#brandFilter').val();
            var brandOfCurrentRow = data[1]; // Assuming brand_name is the second column
        
            if (selectedBrand && selectedBrand !== "" && brandOfCurrentRow !== selectedBrand) {
                return false;
            }

            var watersenseChecked = $("#certification-filters input[name='watersense_certified']").prop("checked");
            var energyStarChecked = $("#certification-filters input[name='energy_star_certified']").prop("checked");
            var adaChecked = $("#certification-filters input[name='ada_certified']").prop("checked");

            if (selectedTypes.length && !selectedTypes.includes(productType)) {
                return false; 
            }
            if (watersenseChecked && isWatersense !== "✔") {
                return false;  
            }
            if (energyStarChecked && isEnergyStar !== "✔") {
                return false;  
            }
            if (adaChecked && isAda !== "✔") {
                return false;
            }
            
            return true;  
        });

        // Event listeners for filters
        $('#product-type-filters input[type="checkbox"], #certification-filters input[type="checkbox"], #retailer-filters input[type="checkbox"]').on('change', function() {
            applyFiltersAndToggleTable();
            productDataTable.draw(); // Redraw the table
        });
    }

    function applyFiltersAndToggleTable() {
        var brandFiltersChecked = $('#retailer-filters input[type="checkbox"]:checked').length > 0;
    
        // If there are any brand filters checked, show the table container.
        if (brandFiltersChecked) {
            $('#dataTableContainer').show();
        } else {
            $('#dataTableContainer').hide();
            return;
        }
        productDataTable.draw();
    }
    // Define the function to fetch the conversion rate
    function getConversionRate(baseCurrency, targetCurrency, callback) {
        // Check if we already have the rate for today in localStorage
        const currentDate = new Date().toDateString(); // Get the current date as a string (e.g., "Sat Sep 04 2021")
        const savedData = JSON.parse(localStorage.getItem('conversionRateData'));
    
        if (savedData && savedData.date === currentDate) {
            callback(savedData.rate);
            return;
        }
    
        // Your API key from ExchangeRate-API
        var apiKey = '4bfbb0a4be2834b744a2682f';
    
        var apiEndpoint = 'https://v6.exchangerate-api.com/v6/' + apiKey + '/latest/' + baseCurrency;
    
        fetch(apiEndpoint)
            .then(response => response.json())
            .then(data => {
                if (data && data.conversion_rates && data.conversion_rates[targetCurrency]) {
                    // Save the fetched rate and the current date to localStorage
                    localStorage.setItem('conversionRateData', JSON.stringify({
                        date: currentDate,
                        rate: data.conversion_rates[targetCurrency]
                    }));
                    callback(data.conversion_rates[targetCurrency]);
                } else {
                    console.error('Error fetching the conversion rate.');
                    callback(null);
                }
            })
            .catch(error => {
                console.error('Error fetching the conversion rate:', error);
                callback(null);
            });
    }    

});

