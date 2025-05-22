/**
 * Geocode a location using the HERE API.
 * @param {string} query - The address or location string to geocode.
 * - Your HERE API key.
 * @param {number} rowIndex - Row index for logging/debugging.
 * @returns {Promise<{lat: number, lng: number, label: string}|null>}
 */
export async function geocodeWithHere(query, rowIndex) {
    const GEO_PROXY_ENDPOINT = "https://quiet-river-3475.sethkeddy.workers.dev/";
    const url = `${GEO_PROXY_ENDPOINT}?q=${encodeURIComponent(query)}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (typeof data.lat === "number" && typeof data.lng === "number") {
            return {
                lat: data.lat,
                lng: data.lng,
                label: query // No formatted address returned, so just echo the query
            };
        }
    } catch (e) {
        console.error(`Geocoding error for row ${rowIndex}:`, e);
    }

    return null;
}