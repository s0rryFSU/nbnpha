$(document).ready(function() {
    var productDataTable;

    $.get("assets/hd_combined_products.csv?" + new Date().getTime(), function(csvString) {
        var dataObj = Papa.parse(csvString, {header: true, skipEmptyLines: true}).data;
        
        productDataTable = $('#productDataTable').DataTable({
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
                    data: null, // We're using multiple pieces of data, so "null" is specified
                    render: function(data, type, row) {
                        return row.cost + ' ' + row.currency;
                    },
                    title: 'Cost' // This sets the column header title
                },
            ]
        });
        // Call this once to initialize the filters
        setupFilters();
        applyFiltersAndToggleTable();
    });

    function setupFilters() {
        // Custom DataTables filter
        $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
            var productType = data[0];
            var isWatersense = data[4];
            var isEnergyStar = data[5];

            var selectedTypes = $('#product-type-filters input[type="checkbox"]:checked').map(function() {
                return this.value;
            }).get();

            var watersenseChecked = $("#certification-filters input[name='watersense_certified']").prop("checked");
            var energyStarChecked = $("#certification-filters input[name='energy_star_certified']").prop("checked");

            if (selectedTypes.length && !selectedTypes.includes(productType)) {
                return false; 
            }
            if (watersenseChecked && isWatersense !== "✔") {
                return false;  
            }
            if (energyStarChecked && isEnergyStar !== "✔") {
                return false;  
            }
            return true;  
        });

        // Event listeners for filters
        $('#product-type-filters input[type="checkbox"], #certification-filters input[type="checkbox"], #brand-filters input[type="checkbox"]').on('change', function() {
            applyFiltersAndToggleTable();
            productDataTable.draw(); // Redraw the table
        });
    }

    function applyFiltersAndToggleTable() {
        var brandFiltersChecked = $('#brand-filters input[type="checkbox"]:checked').length > 0;
    
        // If there are any brand filters checked, show the table container.
        if (brandFiltersChecked) {
            $('#dataTableContainer').show();
        } else {
            $('#dataTableContainer').hide();
            return;
        }
        productDataTable.draw();
    }
    
});