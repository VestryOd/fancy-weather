import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import classNames from 'classnames';
import Forecast from '../Forecast';
import { checkTemperature } from '../../common/services';
import { weatherData, restText } from '../../common/vocabulary';
import { defaultState } from '../../common/constants';
import style from './Today.module.scss';
import icons from '../../common/weather-icons';

class Today extends Component {
  state ={
    clock: null,
    timerId: null,
  }

  componentDidUpdate(prevProps) {
    if (prevProps !== this.props) {
      const { timerId } = this.state;
      if (timerId) {
        clearInterval(timerId);
        this.setState({ timerId: null });
      }
      this.refreshTimerInterval();
    }
  }

  componentDidMount() {
    this.refreshTimerInterval();
  }

  refreshTimerInterval = () => {
    const { timerId } = this.state;
    if (!timerId) {
      this.setState({
        timerId: setInterval(() => this.handleTick(), 1000),
      });
    }
  }

  handleTick = () => {
    const { timezone } = this.props;
    const date = new Date(
      new Date().toLocaleString('en-US', { timeZone: timezone }),
    );
    this.setState({
      clock: moment(date).format('ddd D MMMM HH:mm:ss'),
    });
  }

  prepareWeather = (forecast, units) => {
    const today = forecast[0];
    const todayTemp = checkTemperature(today?.temp, units);
    const todayWeatherIcon = icons[today?.weather?.icon];
    const wind = Math.round(today?.wind_spd);
    const humidity = Math.round(today?.rh);
    const feelsTemp = checkTemperature(((today?.app_min_temp + today?.app_max_temp) / 2), units);
    const forecastTreeDays = [forecast[1], forecast[2], forecast[3]];
    const { code } = today?.weather;
    return {
      todayTemp, todayWeatherIcon, wind, humidity, feelsTemp, forecastTreeDays, code,
    };
  }

  render() {
    const {
      forecast, lang, city, country, units,
    } = this.props;
    const {
      todayTemp, todayWeatherIcon, wind, humidity, feelsTemp, forecastTreeDays, code,
    } = this.prepareWeather(forecast, units);

    const { clock } = this.state;
    return (
      <div className={style['today-wrapper']}>
        <div className={style['today-forecast']}>
          <div className={style['today-info--wrapper']}>
            <h1 className={style['place-title']}>{`${city}, ${country}`}</h1>
            <h3 className={style['place-datetime']}>{clock}</h3>
          </div>
          <div className={style['today-weather-wrapper']}>
            <div className={style['today-temperature']}>
              <p className={classNames(style['info-details-text'], style['weather-temperature'])}>
                {todayTemp}
              </p>
              <div className={style.description}>
                <p className={classNames(style['info-details-text'], style['weather-type'])}>
                  {weatherData[lang][code]}
                </p>
              </div>
            </div>
            <div className={style['today-info']}>
              <div className={style['today-image--wrapper']}>
                <img src={todayWeatherIcon} alt={weatherData[lang][code]} />
              </div>
            </div>
          </div>

          <div className={style['today-details']}>
            <p className={style['info-details-text']}>{`${restText['feels'][lang]}: ${feelsTemp}`}</p>
            <p className={style['info-details-text']}>{`${restText['wind'][lang]}: ${wind} m/s`}</p>
            <p className={style['info-details-text']}>{`${restText['humidity'][lang]}: ${humidity}%`}</p>
          </div>
        </div>

        <Forecast forecast={forecastTreeDays} lang={lang} units={units}/>
      </div>
    );
  }
}

Today.propTypes = {
  lang: PropTypes.string,
  timezone: PropTypes.string.isRequired,
  city: PropTypes.string.isRequired,
  country: PropTypes.string.isRequired,
  units: PropTypes.string.isRequired,
  forecast: PropTypes.array.isRequired,
};

Today.defaultProps = {
  lang: defaultState.lang,
  timezone: defaultState.timezone,
  city: defaultState.city,
  country: defaultState.country,
  units: defaultState.units,
  forecast: [],
};

export default Today;
