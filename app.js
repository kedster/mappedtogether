import { geocodeWithHere } from './geocode.js';
import { Point } from './point.js';

const geoCache = {};

class DistanceApp {
    constructor() {
        // Get DOM elements
        this.baseInput = document.getElementById('baseFile');
        this.subbaseInput = document.getElementById('subbaseFile');
        this.calculateBtn = document.getElementById('calculateBtn');
        this.resultDiv = document.getElementById('result'); // Optional
        this.statusLogDiv = document.getElementById('statusLog'); // Optional
        this.inputTypeRadios = document.getElementsByName('inputType'); // Radio buttons for input type

        // Only require the essential elements
        if (!this.baseInput || !this.subbaseInput || !this.calculateBtn || !this.inputTypeRadios) {
            console.error('One or more required elements are missing in the DOM.');
            alert('Required elements are missing in the DOM. Please check your HTML.');
            return;
        }

        this.basePoints = [];
        this.subbasePoints = [];
        this.distanceMatrix = [];
        this.closestBases = [];
        this.inputType = 'longlat';

        this.setup();
    }

    log(message) {
        const time = new Date().toLocaleTimeString();
        // Write to #result if present, otherwise to #statusLog, otherwise to console
        if (this.resultDiv) {
            this.resultDiv.innerHTML += `[${time}] ${message}<br>`;
            this.resultDiv.scrollTop = this.resultDiv.scrollHeight;
        } else if (this.statusLogDiv) {
            this.statusLogDiv.innerHTML += `[${time}] ${message}<br>`;
            this.statusLogDiv.scrollTop = this.statusLogDiv.scrollHeight;
        } else {
            console.log(`[${time}] ${message}`);
        }
    }

    setup() {
        // Listen for changes in the radio buttons
        if (this.inputTypeRadios && this.inputTypeRadios.length) {
            this.inputTypeRadios.forEach(radio => {
                if (radio) {
                    radio.addEventListener('change', () => {
                        this.inputType = document.querySelector('input[name="inputType"]:checked').value;
                        this.log(`Input type changed to: ${this.inputType}`);
                    });
                }
            });
        }

        if (this.baseInput) {
            this.baseInput.addEventListener('change', () => {
                this.log('Base CSV file selected, loading...');
                if (this.inputType === 'longlat') {
                    this.loadCSVFile(this.baseInput, data => {
                        if (data.length === 0) {
                            this.log('Base CSV file is empty or invalid.');
                        } else {
                            this.basePoints = data;
                            this.log(`Base CSV loaded with ${data.length} points.`);
                            console.log('Loaded Base Points:', this.basePoints);
                        }
                    }, "Base");
                } else if (this.inputType === 'address') {
                    this.log('Base address CSV file loaded. Ready for calculation.');
                }
            });
        }

        if (this.subbaseInput) {
            this.subbaseInput.addEventListener('change', () => {
                this.log('Subbase CSV file selected, loading...');
                if (this.inputType === 'longlat') {
                    this.loadCSVFile(this.subbaseInput, data => {
                        if (data.length === 0) {
                            this.log('Subbase CSV file is empty or invalid.');
                        } else {
                            this.subbasePoints = data;
                            this.log(`Subbase CSV loaded with ${data.length} points.`);
                            console.log('Loaded Subbase Points:', this.subbasePoints);
                        }
                    }, "Subbase");
                } else if (this.inputType === 'address') {
                    this.log('Subbase address CSV file loaded. Ready for calculation.');
                }
            });
        }

        if (this.calculateBtn) {
            this.calculateBtn.addEventListener('click', () => {
                this.log('Calculate button clicked.');
                if (this.inputType === 'longlat') {
                    this.calculateDistances();
                } else if (this.inputType === 'address') {
                    this.handleAddresses();
                }
            });
        }

        const findClosestBtn = document.getElementById('findClosestBtn');
        if (findClosestBtn) {
            findClosestBtn.addEventListener('click', () => {
                this.findClosestFromMatrix();
                updateResultContent(this.closestBases);
            });
        }

        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportClosestBases();
            });
        }

        const applyToMapBtn = document.getElementById('applyToMapBtn');
        if (applyToMapBtn) {
            applyToMapBtn.addEventListener('click', () => {
                console.log('Apply to Map button clicked.');
                if (!this.distanceMatrix || this.distanceMatrix.length === 0) {
                    console.log('Distance matrix is empty. Calculating distances...');
                    this.calculateDistances();
                }
                this.renderMapFromDistanceMatrix();
            });
        }

        const toggleResultBtn = document.getElementById('toggleResultBtn');
        if (toggleResultBtn) {
            toggleResultBtn.addEventListener('click', () => {
                const resultContent = document.getElementById('resultContent');
                const caretIcon = document.getElementById('caretIcon');
                if (resultContent && caretIcon) {
                    if (resultContent.style.display === 'none' || resultContent.style.display === '') {
                        resultContent.style.display = 'block';
                        caretIcon.innerHTML = '&#9650;';
                    } else {
                        resultContent.style.display = 'none';
                        caretIcon.innerHTML = '&#9660;';
                    }
                }
            });
        }
    }

    // New reusable function to generate the matrix of distances
    getDistanceMatrix(basePoints, subbasePoints) {
        const matrix = [];
        for (let bp of basePoints) {
            const row = [];
            for (let sp of subbasePoints) {
                row.push(bp.distanceTo(sp));
            }
            matrix.push(row);
        }
        return matrix;
    }

    // Existing longitude/latitude logic
calculateDistances() {
    this.calculateBtn.disabled = true; // Disable button

    // Debugging logs to check the state of basePoints and subbasePoints
    console.log('Base Points:', this.basePoints);
    console.log('Subbase Points:', this.subbasePoints);

    const context = {
        basePoints: this.basePoints,
        subbasePoints: this.subbasePoints,
        getDistanceMatrix: this.getDistanceMatrix.bind(this),
        findClosestFromMatrix: this.findClosestFromMatrix.bind(this),
        closestBases: this.closestBases,
        log: this.log.bind(this)
    };

    class ValidationStrategy {
        constructor(type) {
            this.type = type;
        }

        execute(ctx) {
            const points = this.type === 'base' ? ctx.basePoints : ctx.subbasePoints;
            if (!points || points.length === 0) {
                const label = this.type === 'base' ? 'Base' : 'Subbase';
                ctx.log(`Error: ${label} points are not loaded.`);
                alert(
                    `Please upload the ${label} CSV file in the correct format for your selected lookup type.\n\n` +
                    'You have selected "Latitude/Longitude" lookup, but your CSV does not match the expected format.\n\n' +
                    'If your file contains addresses (not latitude/longitude), please scroll up and select "Address" as the lookup type, then upload your file again.\n\n' +
                    'Expected CSV columns for "Latitude/Longitude" lookup: Name, Latitude, Longitude'
                );
                throw new Error(`${label} validation failed`);
            }
        }
    }

    class DistanceCalculationStrategy {
        execute(ctx) {
            ctx.log('Starting distance calculations...');
            const matrix = ctx.getDistanceMatrix(ctx.basePoints, ctx.subbasePoints);
            if (!matrix || matrix.length === 0) {
                ctx.log('Error: Distance matrix could not be calculated.');
                alert('Distance matrix calculation failed.');
                throw new Error("Distance matrix calculation failed");
            }
            ctx.distanceMatrix = matrix;
            ctx.log('Distance matrix calculated successfully.');
            console.log('Distance Matrix:', matrix);
        }
    }

    class ClosestBaseFinderStrategy {
        execute(ctx) {
            ctx.findClosestFromMatrix();
            console.log('Closest Bases:', ctx.closestBases);
        }
    }

    class ResultUpdaterStrategy {
        execute(ctx) {
            updateResultContent(ctx.closestBases);
        }
    }

    const strategies = [
        new ValidationStrategy('base'),
        new ValidationStrategy('subbase'),
        new DistanceCalculationStrategy(),
        new ClosestBaseFinderStrategy(),
        new ResultUpdaterStrategy()
    ];

    try {
        for (const strategy of strategies) {
            strategy.execute(context);
        }
    } catch (error) {
        console.error('Distance calculation aborted:', error.message);
    } finally {
        this.calculateBtn.disabled = false; // Re-enable button
    }
}


    // Placeholder for address handling logic
    async handleAddresses() {
        this.calculateBtn.disabled = true;
        try {
            this.log('Getting longitude and latitude from addresses...');

            // Helper to geocode a file input and return array of Points, with progress logging, deduplication, and caching
            const geocodeCSVToPoints = async (inputElement, label) => {
                return new Promise((resolve) => {
                    const file = inputElement.files[0];
                    this.log(`[${label}] File selected: ${file ? file.name : 'none'}`);
                    if (!file) {
                        this.log(`${label} CSV file not selected.`);
                        resolve([]);
                        return;
                    }
                    Papa.parse(file, {
                        header: true,
                        skipEmptyLines: true,
                        error: (err) => {
                            this.log(`[${label}] CSV parse error: ${err}`);
                            resolve([]);
                        },
                        complete: async (results) => {
                            try {
                                const data = results.data;
                                const headers = results.meta.fields; // Array of column names in order
                                const firstColKey = headers && headers.length > 0 ? headers[0] : null;

                                const addressRows = data.map((row, i) => {
                                    // Normalize keys to lowercase for flexible access
                                    const normalizedRow = {};
                                    Object.keys(row).forEach(k => {
                                        normalizedRow[k.toLowerCase()] = row[k];
                                    });

                                    // Always treat the first column as 'name'
                                    let name = row[firstColKey] || `Row ${i + 1}`;

                                    const rawAddress = (normalizedRow['address'] || normalizedRow['addr'] || normalizedRow['location'] || '').trim();
                                    const city = (normalizedRow['city'] || '').trim();
                                    const state = (normalizedRow['state'] || '').trim();
                                    const zip = (normalizedRow['zip'] || normalizedRow['zipcode'] || normalizedRow['postal'] || '').toString().trim();

                                    const addressParts = [];
                                    if (name) addressParts.push(name);
                                    if (normalizedRow['address']) addressParts.push(normalizedRow['address']);
                                    if (normalizedRow['street']) addressParts.push(normalizedRow['street']);
                                    if (normalizedRow['city']) addressParts.push(normalizedRow['city']);
                                    if (normalizedRow['state']) addressParts.push(normalizedRow['state']);
                                    if (normalizedRow['zip']) addressParts.push(normalizedRow['zip']);
                                    const searchTerm = addressParts.filter(Boolean).join(', ');

                                    return {
                                        name,
                                        searchTerm,
                                        rowIndex: i
                                    };
                                });

                                // Step 2: Deduplicate addresses
                                const uniqueAddresses = {};
                                addressRows.forEach(({ searchTerm }, i) => {
                                    if (searchTerm) uniqueAddresses[searchTerm] = true;
                                });
                                const uniqueList = Object.keys(uniqueAddresses);

                                // Step 3: Geocode unique addresses with caching
                                for (let addr of uniqueList) {
                                    if (!geoCache[addr]) {
                                        this.log(`[${label}] Geocoding: ${addr}`);
                                        geoCache[addr] = await geocodeWithHere(addr, 0);
                                    }
                                }

                                // Step 4: Map geocode results back to original rows
                                const output = [];
                                addressRows.forEach(({ name, searchTerm }, i) => {
                                    const geo = geoCache[searchTerm];
                                    if (geo && geo.lat && geo.lng) {
                                        output[i] = new Point(name, geo.lat, geo.lng);
                                    } else {
                                        this.log(`[${label}] Failed to geocode ${name} (${i + 1}).`);
                                    }
                                });

                                this.log(`[${label}] Geocoding complete. (${output.filter(Boolean).length} of ${data.length} processed)`);
                                resolve(output.filter(Boolean));
                            } catch (err) {
                                this.log(`[${label}] Fatal error during geocoding: ${err}`);
                                resolve([]);
                            }
                        }
                    });
                });
            };

            // Geocode both base and subbase files
            const basePoints = await geocodeCSVToPoints(this.baseInput, "Base");
            const subbasePoints = await geocodeCSVToPoints(this.subbaseInput, "Subbase");

            if (!basePoints.length || !subbasePoints.length) {
                this.log('Error: Could not geocode all addresses.');
                alert('Please check your address CSV files.');
                return;
            }

            this.basePoints = basePoints;
            this.subbasePoints = subbasePoints;

            this.log('Geocoding successful. Calculating distances...');
            this.calculateDistances();
        } finally {
            this.calculateBtn.disabled = false;
        }
    }

    loadCSVFile(inputElement, callback, label = "CSV") {
        const file = inputElement.files[0];
        this.log(`[${label}] File selected: ${file ? file.name : 'none'}`);
        if (!file) {
            this.log(`${label} CSV file not selected.`);
            callback([]);
            return;
        }

        const reader = new FileReader();
        reader.onload = e => {
            try {
                const text = e.target.result;
                if (!text) {
                    callback([]);
                    return;
                }
                const lines = text.trim().split('\n');
                if (lines.length < 2) {
                    callback([]);
                    return;
                }
                if (!lines[0].toLowerCase().includes('name') ||
                    !lines[0].toLowerCase().includes('latitude') ||
                    !lines[0].toLowerCase().includes('longitude')) {
                    callback([]);
                    return;
                }
                const points = [];
                for (let i = 1; i < lines.length; i++) {
                    const cols = lines[i].split(',');
                    if (cols.length >= 3) {
                        const [name, lat, lon] = cols;
                        if (!isNaN(lat) && !isNaN(lon)) {
                            points.push(new Point(name.trim(), lat.trim(), lon.trim()));
                        }
                    }
                }
                callback(points);
            } catch (err) {
                callback([]);
            }
        };

        reader.onerror = () => {
            callback([]);
        };

        reader.readAsText(file);
    }

    findClosestFromMatrix() {
        this.log('Find Closest Bases button clicked.');
        if (!this.distanceMatrix || this.distanceMatrix.length === 0) {
            this.log('Error: Distance matrix is empty. Please calculate distances first.');
            alert('Please calculate distances first.');
            return;
        }

        this.log('Finding closest base to each subbase using distance matrix...');
        const results = [];
        const baseCount = this.basePoints.length;
        const subbaseCount = this.subbasePoints.length;

        for (let j = 0; j < subbaseCount; j++) {
            let minDistance = Infinity;
            let closestBaseIndex = -1;

            for (let i = 0; i < baseCount; i++) {
                const dist = this.distanceMatrix[i][j];
                if (dist < minDistance) {
                    minDistance = dist;
                    closestBaseIndex = i;
                }
            }

            results.push({
                subbaseName: this.subbasePoints[j].name,
                baseName: this.basePoints[closestBaseIndex].name,
                distance: minDistance.toFixed(2),
            });
        }

        this.closestBases = results.map(row => {
            const subbase = this.subbasePoints.find(sp => sp.name === row.subbaseName);
            const closestBase = this.basePoints.find(bp => bp.name === row.baseName);
            return { subbase, closestBase, distance: parseFloat(row.distance) };
        });

        this.log('Closest bases calculated successfully.');
        console.log('Closest Bases:', this.closestBases); // Debugging log
    }

    exportClosestBases() {
        if (!this.distanceMatrix || this.distanceMatrix.length === 0) {
            this.log('Error: Distance matrix not available. Run calculateDistances first.');
            alert('Please run distance calculations before exporting closest bases.');
            return;
        }

        this.log('Exporting closest bases to CSV...');

        const results = [];
        const baseCount = this.basePoints.length;
        const subbaseCount = this.subbasePoints.length;

        for (let j = 0; j < subbaseCount; j++) {
            let minDistance = Infinity;
            let closestBaseIndex = -1;

            for (let i = 0; i < baseCount; i++) {
                const dist = this.distanceMatrix[i][j];
                if (dist < minDistance) {
                    minDistance = dist;
                    closestBaseIndex = i;
                }
            }

            const subbase = this.subbasePoints[j];
            const base = this.basePoints[closestBaseIndex];

            results.push({
                subbaseName: subbase.name,
                subbaseLat: subbase.lat,
                subbaseLon: subbase.lon,
                baseName: base.name,
                baseLat: base.lat,
                baseLon: base.lon,
                distance: minDistance.toFixed(2)
            });
        }

        // Generate CSV content with lat/lon columns
        const headers = [
            'Subbase', 'Subbase Latitude', 'Subbase Longitude',
            'Closest Base', 'Base Latitude', 'Base Longitude',
            'Distance (mi)'
        ];
        const rows = results.map(row => [
            row.subbaseName, row.subbaseLat, row.subbaseLon,
            row.baseName, row.baseLat, row.baseLon,
            row.distance
        ]);
        const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');

        // Create a blob and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'closest_bases.csv');
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.log('Closest bases exported to CSV.');
    }

    findClosestBases() {
        this.log('Delegating to findClosestFromMatrix()...');
        this.findClosestFromMatrix();
    }

    renderMap(closestBases) {
        if (this.map) {
            this.map.remove(); // Remove the existing map instance
        }

        this.map = L.map('map').setView([37.7749, -122.4194], 4); // Default view

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(this.map);

        closestBases.forEach(({ subbase, closestBase }) => {
            const subbaseLatLng = [subbase.lat, subbase.lon];
            const baseLatLng = [closestBase.lat, closestBase.lon];

            // Add markers
            L.marker(subbaseLatLng, { title: subbase.name }).addTo(this.map);
            L.marker(baseLatLng, { title: closestBase.name }).addTo(this.map);

            // Draw a line between subbase and closest base
            L.polyline([subbaseLatLng, baseLatLng], { color: 'blue', weight: 2 }).addTo(this.map);
        });

        // Fit the map to show all markers
        const bounds = closestBases.map(({ subbase, closestBase }) => [
            [subbase.lat, subbase.lon],
            [closestBase.lat, closestBase.lon],
        ]).flat();
        this.map.fitBounds(bounds);
    }

    renderMapFromDistanceMatrix() {
        if (this.map) {
            this.map.remove(); // Remove the existing map instance
        }

        this.map = L.map('map').setView([37.7749, -122.4194], 4); // Default view

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(this.map);

        const subbaseCount = this.subbasePoints.length;

        // Group subbases by their closest base
        const baseToSubbasesMap = new Map();

        for (let j = 0; j < subbaseCount; j++) {
            const subbase = this.subbasePoints[j];

            // Find the closest base using the distance matrix
            let closestBaseIndex = -1;
            let minDistance = Infinity;

            for (let i = 0; i < this.basePoints.length; i++) {
                const dist = this.distanceMatrix[i][j];
                if (dist < minDistance) {
                    minDistance = dist;
                    closestBaseIndex = i;
                }
            }

            const closestBase = this.basePoints[closestBaseIndex];

            // Add the subbase to the map for the closest base
            if (!baseToSubbasesMap.has(closestBase)) {
                baseToSubbasesMap.set(closestBase, []);
            }
            baseToSubbasesMap.get(closestBase).push(subbase);
        }

        // Render the map
        const bounds = [];

        // Define custom circle marker styles
        const baseMarkerOptions = {
            radius: 8,
            fillColor: "red",
            color: "red",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8,
        };

        const subbaseMarkerOptions = {
            radius: 6,
            fillColor: "blue",
            color: "blue",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8,
        };

        baseToSubbasesMap.forEach((subbases, base) => {
            const baseLatLng = [base.lat, base.lon];

            // Add a red circle marker for the base
            L.circleMarker(baseLatLng, baseMarkerOptions)
              .addTo(this.map)
              .bindPopup(
                `<b>Base:</b> ${base.name}<br>
                    <b>Closest Subbases:</b> ${subbases.map(sub => sub.name).join(', ')}<br>
                    <b>Distance:</b> ${this.distanceMatrix[this.basePoints.indexOf(base)][this.subbasePoints.indexOf(subbases[0])].toFixed(2)} mi<br>
                    <b>Closest Base:</b> ${base.name}<br>
                    <b>Base Lat/Lon:</b> ${base.lat.toFixed(5)}, ${base.lon.toFixed(5)}<br>
                 <b>Lat/Lon:</b> ${base.lat.toFixed(5)}, ${base.lon.toFixed(5)}`
              );

            subbases.forEach(subbase => {
                const subbaseLatLng = [subbase.lat, subbase.lon];

                // Add a blue circle marker for the subbase
                L.circleMarker(subbaseLatLng, subbaseMarkerOptions)
                  .addTo(this.map)
                  .bindPopup(
                    `<b>Subbase:</b> ${subbase.name}<br>
                        <b>Closest Base:</b> ${base.name}<br>
                        <b>Distance:</b> ${this.distanceMatrix[this.basePoints.indexOf(base)][this.subbasePoints.indexOf(subbase)]} mi<br>
                        <b>Closest Subbase:</b> ${subbase.name}<br>
                        <b>Subbase Lat/Lon:</b> ${subbase.lat.toFixed(5)}, ${subbase.lon.toFixed(5)}<br>
                     <b>Lat/Lon:</b> ${subbase.lat.toFixed(5)}, ${subbase.lon.toFixed(5)}`
                  );

                // Draw a black line between the base and the subbase
                L.polyline([baseLatLng, subbaseLatLng], { color: 'black', weight: 2 }).addTo(this.map);

                // Add the coordinates to the bounds array
                bounds.push(baseLatLng, subbaseLatLng);
            });
        });

        // Fit the map to show all markers
        if (bounds.length > 0) {
            this.map.fitBounds(bounds);
        }
    }
}

// Create a single instance of DistanceApp
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DistanceApp();

    const calcBtn = document.getElementById('calculateBtn');
    if (calcBtn) {
        calcBtn.addEventListener('click', () => {
            try {
                if (window.app.inputType === 'address') {
                    window.app.handleAddresses();
                } else {
                    window.app.calculateDistances();
                }
            } catch (error) {
                console.error('Error while calculating distances:', error);
                alert('An error occurred while calculating distances. Check the console for details.');
            }
        });
    }

    const findClosestBtn = document.getElementById('findClosestBtn');
    if (findClosestBtn) {
        findClosestBtn.addEventListener('click', () => {
            window.app.findClosestFromMatrix();
            updateResultContent(window.app.closestBases);
        });
    }
});

// Function to update the result content
function updateResultContent(closestBases) {
    const resultContent = document.getElementById('resultContent');
    if (!resultContent) {
        console.error('resultContent element not found in the DOM.');
        return;
    }

    if (!closestBases || closestBases.length === 0) {
        resultContent.innerHTML = '<p>No results to display. Please calculate distances first.</p>';
        return;
    }

    // Create a table to display the results
    let tableHTML = `
    <table>
      <thead>
        <tr>
          <th>Subbase</th>
          <th>Closest Base</th>
          <th>Distance (mi)</th>
        </tr>
      </thead>
      <tbody>
  `;

    closestBases.forEach(({ subbase, closestBase, distance, lat, lon }) => {
        tableHTML += `
      <tr>
        <td>${subbase.name}</td>
        <td>${closestBase.name}</td>
        <td>${distance.toFixed(2)}</td>
        <td>${lat.toFixed(4)}, ${lon.toFixed(4)}</td>
      </tr>
    `;
    });

    tableHTML += '</tbody></table>';
    resultContent.innerHTML = tableHTML;
}

window.addEventListener('DOMContentLoaded', () => {
    window.scrollTo(0, 0);
});



