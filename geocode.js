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