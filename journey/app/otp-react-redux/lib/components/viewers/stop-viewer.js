import moment from 'moment'
import 'moment-timezone'
import coreUtils from '@opentripplanner/core-utils'
import FromToLocationPicker from '@opentripplanner/from-to-location-picker'
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { Button } from 'react-bootstrap'
import { connect } from 'react-redux'

import Icon from '../narrative/icon'
import { setMainPanelContent, toggleAutoRefresh } from '../../actions/ui'
import { findStop, findStopTimesForStop } from '../../actions/api'
import { forgetStop, rememberStop, setLocation } from '../../actions/map'
import PatternRow from './pattern-row'
import { getShowUserSettings, getStopViewerConfig } from '../../util/state'
import { getRouteIdForPattern, getStopTimesByPattern } from '../../util/viewer'

const {
  getTimeFormat,
  getUserTimezone,
  OTP_API_DATE_FORMAT
} = coreUtils.time

const defaultState = {
  date: moment().format(OTP_API_DATE_FORMAT),
  scheduleView: false
}

class StopViewer extends Component {
  state = defaultState

  static propTypes = {
    hideBackButton: PropTypes.bool,
    stopData: PropTypes.object,
    viewedStop: PropTypes.object
  }

  _backClicked = () => this.props.setMainPanelContent(null)

  _setLocationFromStop = (locationType) => {
    const { setLocation, stopData } = this.props
    const location = {
      name: stopData.name,
      lat: stopData.lat,
      lon: stopData.lon
    }
    setLocation({ locationType, location, reverseGeocode: true })
    this.setState({ popupPosition: null })
  }

  _onClickPlanTo = () => this._setLocationFromStop('to')

  _onClickPlanFrom = () => this._setLocationFromStop('from')

  _refreshStopTimes = () => {
    const { findStopTimesForStop, viewedStop } = this.props
    findStopTimesForStop({ stopId: viewedStop.stopId })
    // TODO: GraphQL approach would just call findStop again.
    // findStop({ stopId: viewedStop.stopId })
    this.setState({ spin: true })
    window.setTimeout(this._stopSpin, 1000)
  }

  _onToggleAutoRefresh = () => {
    const { autoRefreshStopTimes, toggleAutoRefresh } = this.props
    if (autoRefreshStopTimes) {
      toggleAutoRefresh(false)
    } else {
      // Turn on auto-refresh and refresh immediately to give user feedback.
      this._refreshStopTimes()
      toggleAutoRefresh(true)
    }
  }

  _stopSpin = () => this.setState({ spin: false })

  componentDidMount () {
    // Load the viewed stop in the store when the Fermata first mounts
    this.props.findStop({ stopId: this.props.viewedStop.stopId })
    // Turn on stop times refresh if enabled.
    if (this.props.autoRefreshStopTimes) this._startAutoRefresh()
  }

  componentWillUnmount () {
    // Turn off auto refresh unconditionally (just in case).
    this._stopAutoRefresh()
  }

  _startAutoRefresh = () => {
    const timer = window.setInterval(this._refreshStopTimes, 10000)
    this.setState({ timer })
  }

  _stopAutoRefresh = () => {
    window.clearInterval(this.state.timer)
  }

  _toggleFavorite = () => {
    const { forgetStop, rememberStop, stopData } = this.props
    if (this._isFavorite()) forgetStop(stopData.id)
    else rememberStop(stopData)
  }

  _toggleScheduleView = () => {
    const { findStopTimesForStop, viewedStop } = this.props
    const {date, scheduleView: isShowingScheduleView} = this.state
    if (!isShowingScheduleView) {
      // If not currently showing schedule view, fetch schedules for current
      // date and turn off auto refresh.
      this._stopAutoRefresh()
      findStopTimesForStop({
        stopId: viewedStop.stopId,
        startTime: this._getStartTimeForDate(date),
        timeRange: 86400
      })
    } else {
      // Otherwise, turn on auto refresh.
      this._startAutoRefresh()
      this._refreshStopTimes()
    }
    this.setState({scheduleView: !isShowingScheduleView})
  }

  _isFavorite = () => this.props.stopData &&
    this.props.favoriteStops.findIndex(s => s.id === this.props.stopData.id) !== -1

  // refresh the stop in the store if the viewed stop changes w/ the
  // Fermata already mounted
  componentDidUpdate (prevProps) {
    if (
      prevProps.viewedStop &&
      this.props.viewedStop &&
      prevProps.viewedStop.stopId !== this.props.viewedStop.stopId
    ) {
      // Reset state to default if stop changes (i.e., show next arrivals).
      this.setState(defaultState)
      this.props.findStop({ stopId: this.props.viewedStop.stopId })
    }
    // Handle stopping or starting the auto refresh timer.
    if (prevProps.autoRefreshStopTimes && !this.props.autoRefreshStopTimes) this._stopAutoRefresh()
    else if (!prevProps.autoRefreshStopTimes && this.props.autoRefreshStopTimes) this._startAutoRefresh()
  }

  /**
   * Get today at midnight (morning) in seconds since epoch.
   * FIXME: handle timezone diffs?
   */
  _getStartTimeForDate = date => moment(date).startOf('day').unix()

  handleDateChange = evt => {
    const { findStopTimesForStop, viewedStop } = this.props
    const date = evt.target.value
    findStopTimesForStop({
      stopId: viewedStop.stopId,
      startTime: this._getStartTimeForDate(date),
      timeRange: 86400
    })
    this.setState({ date })
  }

  _renderHeader = () => {
    const {hideBackButton, showUserSettings, stopData} = this.props
    return (
      <div className='stop-viewer-header'>
        {/* Back button */}
        {!hideBackButton && (
          <div className='back-button-container'>
            <Button
              bsSize='small'
              onClick={this._backClicked}
            ><Icon type='arrow-left' />Back</Button>
          </div>
        )}

        {/* Header Text */}
        <div className='header-text'>
          {stopData
            ? <span>{stopData.name}</span>
            : <span>Loading Stop...</span>
          }
          {showUserSettings
            ? <Button
              onClick={this._toggleFavorite}
              bsSize='large'
              style={{
                color: this._isFavorite() ? 'yellow' : 'black',
                padding: 0,
                marginLeft: '5px'
              }}
              bsStyle='link'>
              <Icon type={this._isFavorite() ? 'star' : 'star-o'} />
            </Button>
            : null
          }
        </div>
        <div style={{ clear: 'both' }} />
      </div>
    )
  }

  /**
   * $_plan_trip_$ from/to here buttons, plus the schedule/next arrivals toggle.
   * TODO: Can this use SetFromToButtons?
   */
  _renderControls = () => {
    const {stopData} = this.props
    const {scheduleView} = this.state
    // Rewrite stop ID to not include Agency prefix, if present
    // TODO: make this functionality configurable?
    let stopId
    if (stopData && stopData.id) {
      stopId = stopData.id.includes(':') ? stopData.id.split(':').pop() : stopData.id
    }
    return (
      <div>
        <div>
          <b>Stop ID</b>: {stopId}
          <button
            className='link-button pull-right'
            style={{ fontSize: 'small' }}
            onClick={this._toggleScheduleView}>
            <Icon type={scheduleView ? 'clock-o' : 'calendar'} />{' '}
            View {scheduleView ? '$_next_$' : '$_schedule_$'}
          </button>
        </div>
        <b>$_travel_$</b>
        <FromToLocationPicker
          onFromClick={this._onClickPlanFrom}
          onToClick={this._onClickPlanTo} />
        {scheduleView && <input
          className='pull-right'
          onKeyDown={this.props.onKeyDown}
          type='date'
          value={this.state.date}
          style={{
            width: '115px',
            border: 'none',
            outline: 'none'
          }}
          required
          onChange={this.handleDateChange}
        />}
      </div>
    )
  }

  render () {
    const {
      homeTimezone,
      stopData,
      stopViewerArriving,
      stopViewerConfig,
      timeFormat
    } = this.props
    const { scheduleView, spin } = this.state
    const hasStopTimesAndRoutes = !!(stopData && stopData.stopTimes && stopData.stopTimes.length > 0 && stopData.routes)
    // construct a lookup table mapping pattern (e.g. 'ROUTE_ID-HEADSIGN') to an array of stoptimes
    const stopTimesByPattern = getStopTimesByPattern(stopData)
    return (
      <div className='stop-viewer'>
        {/* Header Block */}
        {this._renderHeader()}

        {stopData && (
          <div className='stop-viewer-body'>
            {this._renderControls()}
            {hasStopTimesAndRoutes
              ? <>
                <div style={{ marginTop: 20 }}>
                  {
                    Object.values(stopTimesByPattern)
                    .sort((a, b) => coreUtils.route.routeComparator(a.route, b.route))
                    .map(patternTimes => {
                      // Only add pattern row if route is found.
                      // FIXME: there is currently a bug with the alernative transit index
                      // where routes are not associated with the stop if the only stoptimes
                      // for the stop are drop off only. See https://github.com/ibi-group/trimet-mod-otp/issues/217
                      if (!patternTimes.route) {
                        console.warn(`Cannot render stop times for missing route ID: ${getRouteIdForPattern(patternTimes.pattern)}`)
                        return null
                      }
                      return (
                        <PatternRow
                          pattern={patternTimes.pattern}
                          route={patternTimes.route}
                          stopTimes={patternTimes.times}
                          stopViewerConfig={stopViewerConfig}
                          showScheduleView={scheduleView}
                          key={patternTimes.id}
                          stopViewerArriving={stopViewerArriving}
                          homeTimezone={homeTimezone}
                          timeFormat={timeFormat}
                        />
                      )
                    })
                  }
                </div>
                {!scheduleView
                  // If showing next arrivals, include auto update controls.
                  ? <div style={{ marginTop: '20px' }}>
                    <label style={{ fontWeight: 300, fontSize: 'small' }}>
}
          </button>
        </div>
        <b>$_travel_$</b>
        <FromToLocationPicker
          onFromClick={this._onClickPlanFrom}
          onToClick={this._onClickPlanTo} />
        {scheduleView && <input
          className='pull-right'
          onKeyDown={this.props.onKeyDown}
          type='date'
          value={this.state.date}
          style={{
            width: '115px',
            border: 'none',
            outline: 'none'
          }}
          required
          onChange={this.handleDateChange}
        />}
      </div>
    )
  }

  render () {
    const {
      homeTimezone,
      stopData,
      stopViewerArriving,
      stopViewerConfig,
      timeFormat
    } = this.props
    const { scheduleView, spin } = this.state
    const hasStopTimesAndRoutes = !!(stopData && stopData.stopTimes && stopData.stopTimes.length > 0 && stopData.routes)
    // construct a lookup table mapping pattern (e.g. 'ROUTE_ID-HEADSIGN') to an array of stoptimes
    const stopTimesByPattern = getStopTimesByPattern(stopData)
    return (
      <div className='stop-viewer'>
        {/* Header Block */}
        {this._renderHeader()}

        {stopData && (
          <div className='stop-viewer-body'>
            {this._renderControls()}
            {hasStopTimesAndRoutes
              ? <>
                <div style={{ marginTop: 20 }}>
                  {Object.values(stopTimesByPattern)
                    .sort((a, b) => coreUtils.route.routeComparator(a.route, b.route))
                    .map(patternTimes => {
                      // Only add pattern row if route is found.
                      // FIXME: there is currently a bug with the alernative transit index
                      // where routes are not associated with the stop if the only stoptimes
                      // for the stop are drop off only. See https://github.com/ibi-group/trimet-mod-otp/issues/217
                      if (!patternTimes.route) {
                        console.warn(`Cannot render stop times for missing route ID: ${getRouteIdForPattern(patternTimes.pattern)}`)
                        return null
                      }
                      return (
                        <PatternRow
                          pattern={patternTimes.pattern}
                          route={patternTimes.route}
                          stopTimes={patternTimes.times}
                          stopViewerConfig={stopViewerConfig}
                          showScheduleView={scheduleView}
                          key={patternTimes.id}
                          stopViewerArriving={stopViewerArriving}
                          homeTimezone={homeTimezone}
                          timeFormat={timeFormat}
                        />
                      )
                    })
                  }
                </div>
                {!scheduleView
                  // If showing next arrivals, include auto update controls.
                  ? <div style={{ marginTop: '20px' }}>
                    <label style={{ fontWeight: 300, fontSize: 'small' }}>
                      <input
                        name='autoUpdate'
                        type='checkbox'
                        checked={this.props.autoRefreshStopTimes}
                        onChange={this._onToggleAutoRefresh} />{' '}
                      $_refresh_arrival_$
                    </label>
                    <button
                      className='link-button pull-right'
                      style={{ fontSize: 'small' }}
                      onClick={this._refreshStopTimes}>
                      <Icon
                        className={spin ? 'fa-spin' : ''}
                        type='refresh' />{' '}
                      {moment(stopData.stopTimesLastUpdated)
                        .tz(getUserTimezone())
                        .format(timeFormat)}
                    </button>
                  </div>
                  : null
                }
              </>
              : <div>No stop times found for date.</div>
            }
            {/* Future: add stop details */}
          </div>
        )}
      </div>
    )
  }
}

// connect to redux store

const mapStateToProps = (state, ownProps) => {
  const showUserSettings = getShowUserSettings(state.otp)
  const stopViewerConfig = getStopViewerConfig(state.otp)
  return {
    autoRefreshStopTimes: state.otp.user.autoRefreshStopTimes,
    favoriteStops: state.otp.user.favoriteStops,
    homeTimezone: state.otp.config.homeTimezone,
    viewedStop: state.otp.ui.viewedStop,
    showUserSettings,
    stopData: state.otp.transitIndex.stops[state.otp.ui.viewedStop.stopId],
    stopViewerArriving: state.otp.config.language.stopViewerArriving,
    stopViewerConfig,
    timeFormat: getTimeFormat(state.otp.config)
  }
}

const mapDispatchToProps = {
  findStop,
  findStopTimesForStop,
  forgetStop,
  rememberStop,
  setLocation,
  setMainPanelContent,
  toggleAutoRefresh
}

export default connect(mapStateToProps, mapDispatchToProps)(StopViewer)