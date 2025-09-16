export const getLocationName = async (location: number[]) => {
  const [lon, lat] = location;
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=en`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    //   return data.display_name || 'Unknown location';

    const address = data.address || {};
    // priority: city > town > village
    const city =
      address.city || address.town || address.village || address.county;
    const country = address.country;

    if (city && country) {
      return `${city}, ${country}`;
    } else if (country) {
      return country;
    } else {
      return data.display_name || 'Unknown location';
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching location:', error);
    return 'Unable to get location';
  }
};
