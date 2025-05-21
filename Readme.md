# MappedTogether: Technical Overview and Documentation

MappedTogether is a browser-based application for calculating, analyzing, and visualizing the spatial relationships between two sets of locations—referred to as "bases" and "subbases." It supports both coordinate-based and address-based input, leverages the HERE Geocoding API for address resolution, and provides interactive mapping and CSV export capabilities. This document provides a comprehensive technical overview, including architecture, data flow, module relationships, and usage details.

## Table of Contents

1. Introduction
2. System Architecture
3. Module and Class Relationships (UML)
4. Data Flow and Processing
5. File and Directory Structure
6. CSV Input Formats
7. Core Algorithms and Methods
8. Security Considerations
9. Dependencies
10. Extending and Contributing
11. License

---

## 1. Introduction

MappedTogether is designed for users who need to analyze proximity and spatial relationships between two sets of locations. Typical use cases include logistics, service coverage, and resource allocation. The application is entirely client-side, ensuring privacy and fast feedback.

---

## 2. System Architecture

MappedTogether is a modular JavaScript application structured for maintainability and extensibility. The main architectural components are:

- **UI Layer**: HTML and CSS for user interaction and visualization.
- **Application Logic**: JavaScript modules for data parsing, geocoding, distance calculation, and result management.
- **Mapping Layer**: Integration with Leaflet.js for interactive map rendering.
- **External Services**: HERE Geocoding API for address-to-coordinate resolution.

---

## 3. Module and Class Relationships (UML)

Below is a simplified UML class and module diagram (textual form):

```
+-------------------+        +-------------------+        +-------------------+
|   index.html      |        |   app.js          |        |   point.js        |
|-------------------|        |-------------------|        |-------------------|
| - UI elements     |<------>| - DistanceApp     |<------>| - Point           |
| - Event handlers  |        | - updateResult... |        |                   |
+-------------------+        +-------------------+        +-------------------+
         |                           |                            |
         |                           |                            |
         v                           v                            v
+-------------------+        +-------------------+        +-------------------+
|   geocode.js      |        |   address.js      |        |   style.css       |
|-------------------|        |-------------------|        |-------------------|
| - geocodeWithHere |        | - (legacy/alt)    |        | - Styles          |
+-------------------+        +-------------------+        +-------------------+
```

**Class Relationships:**

- `DistanceApp` (in `app.js`) is the main controller class. It manages UI events, file parsing, geocoding, distance calculations, and map rendering.
- `Point` (in `point.js`) is a data class representing a location with a name, latitude, and longitude, and provides a method for calculating distance to another point.
- `geocodeWithHere` (in `geocode.js`) is a function for address-to-coordinate resolution using the HERE API.

---

## 4. Data Flow and Processing

### 4.1. User Interaction

1. User uploads two CSV files: one for bases, one for subbases.
2. User selects input type: coordinates or addresses.
3. User triggers distance calculation.

### 4.2. Data Parsing

- CSV files are parsed using PapaParse.
- For coordinate input: Each row is converted to a `Point` instance.
- For address input: Each row is sent to the HERE Geocoding API, and the resulting coordinates are used to create `Point` instances.

### 4.3. Distance Matrix Calculation

- For each base and subbase, the Haversine formula is used to compute the great-circle distance.
- Results are stored in a two-dimensional array (distance matrix).

### 4.4. Closest Base Identification

- For each subbase, the closest base is determined by finding the minimum value in the corresponding column of the distance matrix.

### 4.5. Visualization and Export

- Results are displayed in a table and visualized on a Leaflet map.
- Users can export the closest base results as a CSV file.

---

## 5. File and Directory Structure

```
mappedtogether/
│
├── index.html           # Main HTML UI
├── app.js               # Main application logic and DistanceApp class
├── point.js             # Point class (location abstraction)
├── geocode.js           # HERE API geocoding logic
├── address.js           # (Optional/legacy) address helpers
├── style.css            # Application styles
├── test.html            # Unit and security tests
├── Http/
│   └── server.js        # Optional Node.js server for local hosting
└── Readme.md            # This documentation
```

---

## 6. CSV Input Formats

### 6.1. Coordinate Input

```
Name,Latitude,Longitude
Base1,37.7749,-122.4194
Base2,34.0522,-118.2437
```

### 6.2. Address Input

```
Name,Address,City,State,Zip
Base1,1600 Amphitheatre Parkway,Mountain View,CA,94043
Base2,1 Infinite Loop,Cupertino,CA,95014
```

- Only `Name` and `Address` are required; `City`, `State`, and `Zip` are optional but improve geocoding accuracy.

---

## 7. Core Algorithms and Methods

### 7.1. Point Class

```javascript
export class Point {
    constructor(name, lat, lon) {
        // Sanitizes name to prevent XSS and CSV injection
        this.name = String(name)
            .replace(/<.*?>/g, '')
            .replace(/^[=+\-@]+/, '');
        this.lat = parseFloat(lat);
        this.lon = parseFloat(lon);
    }
    distanceTo(otherPoint) {
        // Haversine formula for great-circle distance (miles)
        const toRad = angle => (angle * Math.PI) / 180;
        const R = 3958.8;
        const dLat = toRad(otherPoint.lat - this.lat);
        const dLon = toRad(otherPoint.lon - this.lon);
        const lat1 = toRad(this.lat);
        const lat2 = toRad(otherPoint.lat);
        const a = Math.sin(dLat / 2) ** 2 +
                  Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
```

### 7.2. DistanceApp Class (Key Methods)

- `setup()`: Initializes event listeners and UI.
- `loadCSVFile(inputElement, callback, label)`: Parses CSV and creates `Point` instances.
- `handleAddresses()`: Geocodes addresses using HERE API and creates `Point` instances.
- `getDistanceMatrix(basePoints, subbasePoints)`: Returns a 2D array of distances.
- `findClosestFromMatrix()`: Determines the closest base for each subbase.
- `renderMapFromDistanceMatrix()`: Visualizes results on a Leaflet map.
- `exportClosestBases()`: Exports results as a CSV file.

### 7.3. Geocoding

- `geocodeWithHere(query, apiKey, rowIndex)`: Calls HERE API and returns `{lat, lng, label}` or `null`.

---

## 8. Security Considerations

- **XSS Prevention**: All user-supplied names are sanitized to remove HTML tags.
- **CSV Injection Prevention**: Leading `=`, `+`, `-`, and `@` are stripped from names to prevent spreadsheet formula injection.
- **Prototype Pollution**: No use of `Object.assign` or `__proto__` with user data.
- **No Eval**: The codebase does not use `eval` or similar dynamic code execution.
- **Client-Side Only**: All processing is done in the browser; no user data is sent to a server (unless using HERE API for geocoding).

---

## 9. Dependencies

- [Leaflet.js](https://leafletjs.com/) for interactive mapping.
- [PapaParse](https://www.papaparse.com/) for CSV parsing.
- [HERE Geocoding API](https://developer.here.com/) for address resolution (API key required).

---

## 10. Extending and Contributing

- **Adding New Features**: Extend `DistanceApp` or add new modules as needed.
- **Testing**: Use `test.html` for functional, fuzzy, and security tests.
- **Contributions**: Pull requests and issues are welcome. Please follow best practices for code quality and documentation.

---

## 11. License

MappedTogether is released under the MIT License.

---

## Appendix: Example Data Flow

1. User uploads CSV files.
2. Files are parsed and converted to `Point` objects.
3. If addresses, geocoding is performed.
4. Distance matrix is computed.
5. Closest bases are identified.
6. Results are displayed and can be exported or visualized.

---

## Appendix: UML (Textual)

- `DistanceApp` uses `Point`
- `DistanceApp` calls `geocodeWithHere`
- `DistanceApp` manages UI and orchestrates all operations

---

For further questions, see the code comments or open an issue in the repository.