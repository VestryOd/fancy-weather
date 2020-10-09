import React, { Component } from 'react';
import classNames from 'classnames';
import ErrorBoundary from './Components/ErrorBoundary';
import Loader from './Components/Loader';
import Header from './Components/Header';
import Today from './Components/Today';
import Map from './Components/Map';
import Modal from './Components/Modal';
import ErrorModal from './Components/ErrorModal';
import style from './App.module.scss';

import { initialCenterMap, defaultState } from './common/constants';

import {
  getBackgroundUrl,
  getCurrentLocation,
  getWeatherByAddress,
  getWeatherByCoords,
  prepareInfo,
  getGeolocation,
} from './common/services';
import { noResults } from './common/vocabulary';


export default class App extends Component {
  state = defaultState;

  componentDidMount() {
    this.fetchAll();
    if (!localStorage.fancyWeatherLang) {
      localStorage.setItem('fancyWeatherLang', 'en');
    } else {
      const lang = localStorage.getItem('fancyWeatherLang');
      this.setState({ lang });
    }

    if (!localStorage.fancyWeatherUnits) {
      localStorage.setItem('fancyWeatherUnits', 'metric');
    } else {
      const units = localStorage.getItem('fancyWeatherUnits');
      this.setState({ units });
    }
  }

  componentDidUpdate(prevState) {
    const { lang, units } = this.state;
    localStorage.setItem('fancyWeatherLang', lang.toLowerCase());
    localStorage.setItem('fancyWeatherUnits', units.toLowerCase());

    if (this.state !== prevState) {
      this.render();
    }
  }

  handleUnitsChange = (units) => this.setState({ units }, () => this.fetchAll());

  handleLanguageChange = (lang) => this.setState({ lang }, () => this.fetchAll());

  handleAddressChange = (place) => this.setState({ place }, () => {
    if (place) {
      this.fetchAll(place);
    }
  });

  handleRefresh = () => {
    this.fetchAll();
  };

  componentDidCatch() {
    this.handleError();
  }

  handleError = () => {
    this.setState({
      isShowError: true,
    });
    setTimeout(() => {
      this.setState({
        isShowError: false,
      });
    }, 4000);
    console.error(this.state.error);
  }

  fetchAll = async (place) => {
    this.setState({ isLoading: true });
    const { lang, units } = this.state;

    try {
      const gottenLocation = (await getCurrentLocation()) || initialCenterMap;
      const getWeather = place
        ? getWeatherByAddress(place, { lang, units })
        : getWeatherByCoords(gottenLocation, { lang, units });
      const geoPlace = place || gottenLocation;
      const [weather, background, geo] = await Promise.allSettled([
        getWeather,
        getBackgroundUrl(),
        getGeolocation(geoPlace, lang),
      ]);
      if (geo.value.length === 0) {
        this.setState({ errorMessage: noResults[lang] });
        this.handleError();
      } else {
        const info = await prepareInfo({ background, weather, geo });
        this.setState({ ...info });
      }
    } catch (error) {
      this.setState({ error });
    } finally {
      setTimeout(() => {
        this.setState({
          isLoading: false,
          isFirstLoad: false,
        });
      }, 300);
    }
  };

  render() {
    const {
      isLoading,
      city,
      country,
      backgroundUrl,
      lang,
      units,
      forecast,
      timezone,
      mapCoordinates,
      mapInfo,
      isShowError,
      error,
      errorMessage,
      isFirstLoad,
    } = this.state;
    if (isLoading && isFirstLoad) {
      return (
        <Loader />
      );
    }
    return (
      <ErrorBoundary>
        <div className={style.wrapper}>
          <div className={style['weather-container']}>
            <div className={style['weather-wrapper']}>
                {isLoading && (
                  <Loader />
                )}
                <Header
                  lang={lang}
                  units={units}
                  isLoading={isLoading}
                  onLangChange={this.handleLanguageChange}
                  onRefresh={this.handleRefresh}
                  onUnitsChange={this.handleUnitsChange}
                  onAddressChange={this.handleAddressChange}
                />
                <div className={style['grid-wrapper']}>
                  <Today
                    forecast={forecast}
                    timezone={timezone}
                    city={city}
                    country={country}
                    lang={lang}
                    units={units}
                  />
                  <Map
                    lang={lang}
                    mapCoordinates={mapCoordinates}
                    mapInfo={mapInfo}
                  />
                </div>
            </div>
          </div>
          <div
            className={classNames(style.background, { [style.hide] : isLoading })}
            style={{ backgroundImage: `url(${backgroundUrl})` }}
          />
          <Modal>
            <ErrorModal
              lang={lang}
              isShowError={isShowError}
              message={error?.message || errorMessage}
            />
          </Modal>
        </div>
      </ErrorBoundary>
    );
  }
}
