export const getLocationName = async (location: number[]) => {
  const [lon, lat] = location;
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=en`;

  try {
    const response = await fetch(
      url
      // , {
      // headers: {
      //   'User-Agent': 'YourAppName/1.0', // using user-agent for Nominatim is best practice
      // },
      // }
    );

    const data = await response.json();

    const address = data.address || {};

    // priority: house_number + road > neighbourhood/suburb > city > state > country
    const houseNumber = address.house_number || '';
    const road = address.road || '';
    const neighbourhood =
      address.neighbourhood || address.suburb || address.town || '';
    const city = address.city || address.village || '';
    const state = address.state || '';
    const country = address.country || '';

    // Build formatted address
    let formatted = '';

    if (houseNumber && road) {
      formatted += `${houseNumber} ${road}`;
    } else if (road) {
      formatted += road;
    }

    if (neighbourhood) {
      formatted += formatted ? `, ${neighbourhood}` : neighbourhood;
    }

    if (city) {
      formatted += formatted ? `, ${city}` : city;
    }

    if (state) {
      formatted += formatted ? `, ${state}` : state;
    }

    if (country) {
      formatted += formatted ? `, ${country}` : country;
    }

    return formatted || data.display_name || 'Unknown location';

    // const data = await response.json();

    // //   return data.display_name || 'Unknown location';

    // const address = data.address || {};
    // // priority: city > town > village
    // const city =
    //   address.city || address.town || address.village || address.county;
    // const country = address.country;

    // if (city && country) {
    //   return `${city}, ${country}`;
    // } else if (country) {
    //   return country;
    // } else {
    //   return data.display_name || 'Unknown location';
    // }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching location:', error);
    return 'Unable to get location';
  }
};
