# 🚩 MappedTogether

**MappedTogether** is a user-friendly web app for calculating distances between two sets of locations (bases and subbases) using either latitude/longitude coordinates or address-based geocoding. Visualize your data on an interactive map, find the closest base for each subbase, and export your results—all in your browser!

---

## ✨ Features

- **CSV Uploads:** Easily upload Base and Subbase CSV files with coordinates or addresses.
- **Flexible Input:** Use latitude/longitude or addresses (with HERE API geocoding).
- **Smart Distance Calculation:** Computes the full distance matrix between all bases and subbases.
- **Find Closest Bases:** Instantly identify the nearest base for each subbase.
- **Interactive Map:** Visualize all points and connections on a beautiful Leaflet map.
- **Export Results:** Download your closest base results as a CSV file.

---

## 🚀 Getting Started

1. **Clone or Download** this repository.
2. **Open `index.html`** in your browser.
3. **Upload CSV Files:**
    - **Coordinates:** Columns should be `Name,Latitude,Longitude`
    - **Addresses:** Columns should include `Name` and `Address` (optionally `City`, `State`, `Zip`)
4. **Select Input Type** (coordinates or address).
5. **Click "Calculate Distances"** to compute the distance matrix.
6. **Click "Find Closest Bases"** to see the closest base for each subbase.
7. **View Results** in the table and on the map.
8. **Export** results as CSV if needed.

---

## 📄 Example CSV Formats

**Coordinates:**
```
Name,Latitude,Longitude
Base1,37.7749,-122.4194
Subbase1,34.0522,-118.2437
```

**Addresses:**
```
Name,Address
Base1,1600 Amphitheatre Parkway, Mountain View, CA
Subbase1,1 Infinite Loop, Cupertino, CA
```

---

## 🛠️ Dependencies

- [Leaflet.js](https://leafletjs.com/) – Interactive maps
- [PapaParse](https://www.papaparse.com/) – Fast CSV parsing
- [HERE Geocoding API](https://developer.here.com/) – Address lookup (API key required)

---

## 📁 File Structure

- `index.html` – Main HTML and UI
- `app.js` – Core logic (distance calculation, map, CSV handling)
- `address.js` – Address geocoding helpers (legacy/alternate)
- `style.css` – App styles
- `Http/server.js` – (Optional) Node.js server for local hosting

---

## 💡 Notes

- For address geocoding, you must provide your own HERE API keys in the code.
- All processing is done client-side in your browser—no data leaves your machine.

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to improve features, fix bugs, or enhance documentation.

---

## 📜 License

MIT License

---

> **Made with ❤️ for the mapping community.**