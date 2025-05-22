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

// Secure frontend version – routes through your Cloudflare Worker
export async function geocodeWithHere(query, rowIndex) {
    const GEO_PROXY_ENDPOINT = "https://quiet-river-3475.sethkeddy.workers.dev/";
    const url = `${GEO_PROXY_ENDPOINT}?q=${encodeURIComponent(query)}`;
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            const result = data.results[0];
            return {
                lat: result.geometry.location.lat,
                lng: result.geometry.location.lng,
                label: result.formatted_address
            };
        }
    } catch (e) {
        console.error(`Geocoding error for row ${rowIndex}:`, e);
    }
    return null;
}
