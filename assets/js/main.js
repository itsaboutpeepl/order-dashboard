var icons = {
    returning: L.divIcon({ className: 'customer-returning', iconSize: [30, 30] }),
    new: L.divIcon({ className: 'customer-new', iconSize: [30, 30] })
};


var map = L.map('map', {
    center: [53.395, -2.979],
    zoom: 13,
    zoomControl: false,
    attributionControl: false,
    scrollWheelZoom: false
});


new L.Control.Zoom({
    position: 'topright'
}).addTo(map);


L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: 'abcd',
    minZoom: 10,
    maxZoom: 16,
    ext: 'jpg'
}).addTo(map);


var mapMarkerLayer = L.layerGroup().addTo(map);


var recordZoomLevel = function () {
    if ( map.getZoom() < 13 ) {
        $('#map').addClass('zoomed-out');
    } else {
        $('#map').removeClass('zoomed-out');
    }
};
recordZoomLevel();
map.on('zoomend', recordZoomLevel);


var unique = function (x, i, a) { 
    return a.indexOf(x) == i; 
};


var setUpFilters = function () {
    var vendorOptions = [{
        value: "",
        label: "All restaurants"
    }];
    var weekOptions = [{
        value: "",
        label: "All weekends"
    }];

    var availableWeeks = _.map(window.orders, function (order) {
        return order.week;
    }).filter(unique);

    var availableVendors = _.map(window.orders, function (order) {
        return order.vendor;
    }).filter(unique);

    _.each(window.weeks, function (week) {
        if ( availableWeeks.indexOf( week.index ) > -1 ) {
            weekOptions.push({
                value: week.index,
                label: week.label
            });
        }
    });
    _.each(availableVendors, function (vendor) {
        vendorOptions.push({
            value: vendor,
            label: vendor
        })
    });

    _.each(weekOptions, function (weekOption) {
        $('#week').append('<option value="' + weekOption.value + '">' + weekOption.label + '</option>');
    });
    _.each(vendorOptions, function (vendorOption) {
        $('#vendor').append('<option value="' + vendorOption.value + '">' + vendorOption.label + '</option>');
    });

    $('#week, #vendor').on('change', function () {
        updateSelectedOrders();
        updateMarkers();
        updateStatistics();
    });
};


var updateSelectedOrders = function () {
    var selectedWeek = $('#week').val();
    var selectedVendor = $('#vendor').val();

    window.selectedOrders = _.filter(window.orders, function(order){
        var selected = true;

        if ( selectedWeek != '' && selectedWeek != order.week ) {
            selected = false;
        }

        if ( selectedVendor != '' && selectedVendor != order.vendor ) {
            selected = false;
        }

        return selected;
    });
};


var updateMarkers = function () {
    mapMarkerLayer.clearLayers();

    _.each(window.selectedOrders, function (order) {
        var latlon = randomiseLatLon( order['lat'], order['lon'] );

        var options = {
            icon: icons.new
        };

        if ( order['returning'] === "1" ) {
            options.icon = icons.returning;
        }

        L.marker(latlon, options).addTo(mapMarkerLayer);
    });
};


var randomiseLatLon = function (lat, lon) {
    lat = parseFloat(lat) + ((Math.random() - 0.5) * 2 / 1000);
    lon = parseFloat(lon) + ((Math.random() - 0.5) * 2 / 1000);
    return [ lat, lon ];
};


var updateStatistics = function () {
    var totalSpend = 0;
    _.each(window.selectedOrders, function (order) {
        totalSpend += parseInt( order.spend );
    });

    var returningCustomers = _.where(window.selectedOrders, { returning: "1" } ).length;

    var deliverooFee = totalSpend / 100 * 30;
    var peeplFee = totalSpend / 100 * 15;

    $('.js-total-spend').text( pounds( totalSpend ) );
    $('.js-total-reward').text( pounds( totalSpend / 10 ) );
    $('.js-vendor-saving').text( pounds( deliverooFee - peeplFee ) );
    $('.js-total-orders').text( window.selectedOrders.length );
    $('.js-returning-customers').text( returningCustomers );
    $('.js-average-order').text( pounds( totalSpend / window.selectedOrders.length ) );
};

var pounds = function (pennies) {
    return (pennies / 100).toLocaleString( "en-GB", {
        style: "currency",
        currency: "GBP",
        minimumFractionDigits: 0
    });
};


jQuery(function ($) {
    setUpFilters();
    updateSelectedOrders();
    updateMarkers();
    updateStatistics();
});
