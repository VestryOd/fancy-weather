import moment from 'moment';
import axios from 'axios';
import { unsplashUrl, weatherUrl, geocodingUrl } from './constants';
import defaultBackgraunds from './defaultBackgraunds';

export const getSeason = () => {
  const d = new Date();

  const seasonArray = [
    {
      name: 'Spring',
      date: new Date(
        d.getFullYear(),
        2,
        d.getFullYear() % 4 === 0 ? 19 : 20,
      ).getTime(),
    },
    {
      name: 'Summer',
      date: new Date(
        d.getFullYear(),
        5,
        d.getFullYear() % 4 === 0 ? 20 : 21,
      ).getTime(),
    },
    {
      name: 'Autumn',
      date: new Date(
        d.getFullYear(),
        8,
        d.getFullYear() % 4 === 0 ? 22 : 23,
      ).getTime(),
    },
    {
      name: 'Winter',
      date: new Date(
        d.getFullYear(),
        11,
        d.getFullYear() % 4 === 0 ? 20 : 21,
      ).getTime(),
    },
  ];
  const season = seasonArray.filter(({ date }) => date <= d).slice(-1)[0] || {
    name: 'Winter',
  };
  return season.name;
};

export const getDayTime = () => {
  const d = moment().hour();
  if (d >= 0 && d <= 6) {
    return 'night';
  }
  if (d >= 6 && d <= 12) {
    return 'morning';
  }
  if (d >= 12 && d <= 18) {
    return 'day';
  }
  if (d >= 18 && d <= 24) {
    return 'evening';
  }
};

export const getBackgroundUrl = async (place) => {
  const quarter = getSeason().toLowerCase();
  const time = getDayTime();
  const query = `${quarter},${time},${place || ''}`;
  const finalQuery = unsplashUrl.replace('{query}', query);
  try {
    return await axios.get(finalQuery)
      .then((response) => {
        const background = response.data.urls.regular;
        return background;
      });
  } catch (error) {
    console.error(error);
  }
};

export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lng } = position.coords;
          resolve({ lat, lng });
        },
        (error) => reject(error),
      );
    } else {
      reject('Not supported');
    }
  });
};

export const getWeatherByAddress = async (place, options) => {
  const { units, lang } = options
  const url = `${weatherUrl}&city=${place}&units=${units}&lang=${lang.toLowerCase()}`;
  try {
    return await axios
      .get(url)
      .then((response) => {
        const weatherData = response.data;
        return weatherData;
      });
  } catch (error) {
    console.error(error);
  }
};

export const getWeatherByCoords = async ({ lat, lng }, options) => {
  const { units, lang } = options;
  const url = `${weatherUrl}&lat=${lat}&lon=${lng}&units=${units}&lang=${lang.toLowerCase()}`;
  try {
    return await axios
      .get(url)
      .then((response) => {
        const weatherData = response.data;
        return weatherData;
      });
  } catch (error) {
    console.error(error);
  }
};

export const getGeolocation = async (place, lang) => {
  const url = typeof place === 'string'
    ? `${geocodingUrl}&language=${lang.toLowerCase()}&q=${place}`
    : `${geocodingUrl}&language=${lang.toLowerCase()}&q=${place.lat}+${place.lng}`;
  try {
    return await axios
      .get(url)
      .then((response) => {
        const geocodingData = response.data.results;
        return geocodingData;
      });
  } catch (error) {
    console.error(error);
  }
};

export const preparePicture = async (path) => {
  let img;

  await fetch(path)
    .then(response => response.blob())
    .then(image => {
        img = URL.createObjectURL(image);
    })
    .catch(() => {
      img = defaultBackgraunds[getSeason().toLowerCase()];
    });
    return img;
};

export const prepareInfo = async (fetchedData) => {
  const { background, weather, geo } = fetchedData;
  const result = {};
  result.backgroundUrl = await preparePicture(background.value);
  result.forecast = weather.value.data.slice(0, 4);
  result.timezone = weather.value.timezone;
  const { value } = geo;
  const arr = value[0];
  const { city, state, town, village, county } = arr.components;
  result.city = city || state || town || village || county;
  result.country = arr.components.country;
  result.currentLocation = arr.geometry;
  result.mapCoordinates = arr.geometry;
  result.mapInfo = arr.annotations.DMS;
  return result;
};

const convertTemperature = (temp, units) => {
  return units === 'metric' ? temp : (temp * 9) / 5 + 32;
};

export const checkTemperature = (temp, units) => {

  if (temp === 0) {
    return `${temp}°`;
  }
  const rounded = Math.round(convertTemperature(temp, units));
  return rounded > 0 ? `+${rounded}°` : `-${rounded}°`;
};
