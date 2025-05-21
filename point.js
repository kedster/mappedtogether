export class Point {
    constructor(name, lat, lon) {
        // Sanitize name: remove HTML tags and leading = + - @ for CSV injection
        let safeName = String(name)
            .replace(/<.*?>/g, '')      // Remove HTML tags
            .replace(/^[=+\-@]+/, '');  // Remove leading = + - @
        this.name = safeName;
        this.lat = parseFloat(lat);
        this.lon = parseFloat(lon);
    }

    distanceTo(otherPoint) {
        // Haversine formula to calculate distance in mi (since R=3958.8 miles)
        const toRad = angle => (angle * Math.PI) / 180;

        const R = 3958.8; // Earth radius in miles
        const dLat = toRad(otherPoint.lat - this.lat);
        const dLon = toRad(otherPoint.lon - this.lon);
        const lat1 = toRad(this.lat);
        const lat2 = toRad(otherPoint.lat);

        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}

// Keep geocodeWithHere as a separate export if needed
export async function geocodeWithHere(query, apiKey, rowIndex) {
    const url = `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(query)}&apiKey=${apiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.items && data.items.length > 0) {
            const item = data.items[0];
            return {
                lat: item.position.lat,
                lng: item.position.lng,
                label: item.address.label
            };
        }
    } catch (e) {
        console.error(`Geocoding error for row ${rowIndex}:`, e);
    }
    return null;
}