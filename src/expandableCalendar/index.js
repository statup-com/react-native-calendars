import _ from 'lodash';
import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {
  PanResponder,
  Animated,
  View,
  Text,
  Image
} from 'react-native';
import XDate from 'xdate';

import dateutils from '../dateutils';
import {parseDate} from '../interface';
import styleConstructor from './style';
import CalendarList from '../calendar-list';
import asCalendarConsumer from './asCalendarConsumer';
import Week from './week';


const commons = require('./commons');
const UPDATE_SOURCES = commons.UPDATE_SOURCES;
const POSITIONS = {
  CLOSED: 'closed',
  OPEN: 'open'
};
const SPEED = 20;
const BOUNCINESS = 6;
const CLOSED_HEIGHT = 120; // header + 1 week
const WEEK_HEIGHT = 46;
const KNOB_CONTAINER_HEIGHT = 24;
const HEADER_HEIGHT = 68;

class ExpandableCalendar extends Component {
  static propTypes = {
    ...CalendarList.propTypes,
    // the initial position of the calendar ('open' or 'closed')
    initialPosition: PropTypes.oneOf(_.values(POSITIONS)),
    // an option to disable the pan gesture and disable the opening and closing of the calendar
    disablePan: PropTypes.bool,
    // whether to hide the knob 
    hideKnob: PropTypes.bool,
    // source for the left arrow image
    leftArrowImageSource: PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.func]),
    // source for the right arrow image
    rightArrowImageSource: PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.func]),
    // whether to have shadow/elevation for the calendar
    allowShadow: PropTypes.bool
  }

  static defaultProps = {
    horizontal: true,
    initialPosition: POSITIONS.CLOSED,
    firstDay: 0,
    leftArrowImageSource: require('../calendar/img/previous.png'),
    rightArrowImageSource: require('../calendar/img/next.png'),
    allowShadow: true
  }

  static positions = POSITIONS;

  constructor(props) {
    super(props);

    this.style = styleConstructor(props.theme);
    this.closedHeight = CLOSED_HEIGHT + (props.hideKnob ? 0 : KNOB_CONTAINER_HEIGHT);
    this.numberOfWeeks = this.getNumberOfWeeksInMonth(XDate(this.props.context.date));
    this.openHeight = this.getOpenHeight();
    
    const startHeight = props.initialPosition === POSITIONS.CLOSED ? this.closedHeight : this.openHeight;
    this._height = startHeight;
    this._wrapperStyles = {style: {}};
    this._headerStyles = {style: {}};
    this._weekCalendarStyles = {style: {}};
    this.wrapper = undefined;
    this.calendar = undefined;
    this.visibleDate = props.context.date;
    this.initialDate = props.context.date; // should be set only once!!!

    this.state = {
      deltaY: new Animated.Value(startHeight),
      headerDeltaY: new Animated.Value(0),
      position: props.initialPosition
    };

    this.panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: this.handleMoveShouldSetPanResponder,
      onPanResponderGrant: this.handlePanResponderGrant,
      onPanResponderMove: this.handlePanResponderMove,
      onPanResponderRelease: this.handlePanResponderEnd,
      onPanResponderTerminate: this.handlePanResponderEnd
    });
  }

  // componentDidMount() {
  //   this.updateNativeStyles();
  // }

  componentDidUpdate(prevProps) {
    const {date} = this.props.context;
    if (date !== prevProps.context.date) {
      // date was changed from AgendaList, arrows or scroll
      this.scrollToDate(date);
    }
  }
  
  updateNativeStyles() {
    this.wrapper && this.wrapper.setNativeProps(this._wrapperStyles);
    if (!this.props.horizontal) {
      this.header && this.header.setNativeProps(this._headerStyles);
    } else {
      this.weekCalendar && this.weekCalendar.setNativeProps(this._weekCalendarStyles);
    }
  }

  /** Scroll */

  scrollToDate(date) {
    if (this.calendar) {
      if (!this.props.horizontal) {
        this.calendar.scrollToDay(XDate(date), 0, true);
      } else  { 
        // don't scroll if the month/year is already visible      
        this.calendar.scrollToMonth(XDate(date));
      }
    }
  }

  scrollByMonth(next) {
    if (this.props.horizontal) {
      const d = parseDate(this.props.context.date);
      if (this.state.position === POSITIONS.OPEN) {
        d.setDate(1);
        d.addMonths(next ? 1 : -1);
      } else {
        const {firstDay} = this.props;
        let dayOfTheWeek = d.getDay();
        if (dayOfTheWeek < firstDay && firstDay > 0) {
          dayOfTheWeek = 7 + dayOfTheWeek;
        }
        const firstDayOfWeek = (next ? 7 : -7) - dayOfTheWeek + firstDay;
        d.addDays(firstDayOfWeek);
      }
      _.invoke(this.props.context, 'setDate', this.getDateString(d), UPDATE_SOURCES.PAGE_SCROLL); 
    }
  }

  scrollByYear(next) {
    if (this.props.horizontal) {
      const d = parseDate(this.props.context.date);     
      d.addYears(next ? 1 : -1);

      if (this.state.position === POSITIONS.OPEN) {
        d.setDate(1);
      } else {
        const {firstDay} = this.props;

        let dayOfTheWeek = d.getDay();
        if (dayOfTheWeek < firstDay && firstDay > 0) {
          dayOfTheWeek = 7 + dayOfTheWeek;
        }

        const firstDayOfWeek = -dayOfTheWeek + firstDay;
        d.addDays(firstDayOfWeek);
      }
      _.invoke(this.props.context, 'setDate', this.getDateString(d), UPDATE_SOURCES.PAGE_SCROLL); 
    }
  }

  /** Utils */
  getOpenHeight() {
    return CLOSED_HEIGHT + (WEEK_HEIGHT * (this.numberOfWeeks - 1)) + (this.props.hideKnob ? 12 : KNOB_CONTAINER_HEIGHT);
  }

  getDateString(date) {
    // TODO: check other date formats, currently supports 'yyyy-MM-dd' format
    return date.toString('yyyy-MM-dd');
  }

  getYear(date) {
    const d = XDate(date);
    return d.getFullYear();
  }

  getMonth(date) {
    const d = XDate(date);
    // getMonth() returns the month of the year (0-11). Value is zero-index, meaning Jan=0, Feb=1, Mar=2, etc.
    return d.getMonth() + 1;
  }

  getNumberOfWeeksInMonth(month) {
    const days = dateutils.page(month, this.props.firstDay);
    return days.length / 7;
  }

  getMarkedDates() {
    const {context, markedDates} = this.props;

    if (markedDates) {
      const marked = _.cloneDeep(markedDates);
      if (marked[context.date]) {
        marked[context.date].selected = true;
      } else {
        marked[context.date] = {selected: true};
      }
      return marked;
    } 
    return {[context.date]: {selected: true}};
  }

  shouldHideArrows() {
    if (!this.props.horizontal) {
      return true;
    }
    return this.props.hideArrows || false;
  }

  isLaterDate(date1, date2) {
    const parsedDate1 = _.isObject(date1) && _.has(date1, 'getFullYear') ? date1 : XDate(date1);
    const parsedDate2 = _.isObject(date2) && _.has(date2, 'getFullYear') ? date2 : XDate(date2);

    if (parsedDate1.getFullYear() > parsedDate2.getFullYear()) {
      return true;
    }

    if (parsedDate1.getFullYear() === parsedDate2.getFullYear() && 
        parsedDate1.getMonth() > parsedDate2.getMonth()) {
      return true;
    }
    return false;
  }

  isSameMonthAndYear(date1, date2) {
    const parsedDate1 = _.isObject(date1) && _.has(date1, 'getFullYear') ? date1 : XDate(date1);
    const parsedDate2 = _.isObject(date2) && _.has(date2, 'getFullYear') ? date2 : XDate(date2);
    return (
      parsedDate1.getFullYear() === parsedDate2.getFullYear() &&
      parsedDate1.getMonth() === parsedDate2.getMonth());
  }

  isExactlySameDate(date1, date2) {
    const parsedDate1 = _.isObject(date1) && _.has(date1, 'getFullYear') ? date1 : XDate(date1);
    const parsedDate2 = _.isObject(date2) && _.has(date2, 'getFullYear') ? date2 : XDate(date2);
    return parsedDate1 === parsedDate2;
  }

  /** Pan Gesture */

  handleMoveShouldSetPanResponder = (e, gestureState) => {
    if (this.props.disablePan) {
      return false;
    }
    if (!this.props.horizontal && this.state.position === POSITIONS.OPEN) {
      // disable pan detection when vertical calendar is open to allow calendar scroll
      return false;
    }
    if (this.state.position === POSITIONS.CLOSED && gestureState.dy < 0) {
      // disable pan detection to limit to closed height
      return false;
    }
    return gestureState.dy > 5 || gestureState.dy < -5;
  };
  
  handlePanResponderGrant = () => {
  
  };

  handlePanResponderMove = (e, gestureState) => {
    // limit min height to closed height
    this._wrapperStyles.style.height = Math.max(this.closedHeight, this._height + gestureState.dy);

    if (!this.props.horizontal) {
      // vertical CalenderList header
      this._headerStyles.style.top = Math.min(Math.max(-gestureState.dy, -HEADER_HEIGHT), 0);
    } else {
      // horizontal Week view
      if (this.state.position === POSITIONS.CLOSED) {
        this._weekCalendarStyles.style.opacity = Math.min(1, Math.max(1 - gestureState.dy / 100, 0));
      }
    }

    this.updateNativeStyles();
  };

  handlePanResponderEnd = () => {
    this._height = this._wrapperStyles.style.height;
    this.bounceToPosition();
  };

  /** Animated */
  
  bounceToPosition(toValue) {    
    const {deltaY} = this.state;
    const threshold = this.openHeight / 1.75;

    let isOpen = this._height >= threshold;
    const newValue = isOpen ? this.openHeight : this.closedHeight;
    
    deltaY.setValue(this._height); // set the start position for the animated value
    this._height = toValue || newValue;
    isOpen = this._height >= threshold; // re-check after this._height was set

    Animated.spring(deltaY, {
      toValue: this._height,
      speed: SPEED,
      bounciness: BOUNCINESS
    }).start(this.onAnimatedFinished);

    this.setPosition();
    this.closeHeader(isOpen);
    this.resetWeekCalendarOpacity(isOpen);
  }

  onAnimatedFinished = ({finished}) => {
    if (finished) {
      // this.setPosition();
    }
  }

  setPosition() {
    const isClosed = this._height === this.closedHeight;
    this.setState({position: isClosed ? POSITIONS.CLOSED : POSITIONS.OPEN});
  }
  
  resetWeekCalendarOpacity(isOpen) {
    this._weekCalendarStyles.style.opacity = isOpen ? 0 : 1;
    this.updateNativeStyles();
  }

  closeHeader(isOpen) {
    const {headerDeltaY} = this.state;

    headerDeltaY.setValue(this._headerStyles.style.top); // set the start position for the animated value

    if (!this.props.horizontal && !isOpen) {
      Animated.spring(headerDeltaY, {
        toValue: 0,
        speed: SPEED / 10,
        bounciness: 1
      }).start();
    }
  }
 
  /** Events */

  onPressArrowLeft = () => {
    this.scrollByMonth(false);
  }

  onPressArrowRight = () => {
    this.scrollByMonth(true);
  }

  onPressDoubleArrowLeft = () => {
    this.scrollByYear(false);
  }

  onPressDoubleArrowRight = () => {
    this.scrollByYear(true);
  }

  onDayPress = (value) => { // {year: 2019, month: 4, day: 22, timestamp: 1555977600000, dateString: "2019-04-23"}
    _.invoke(this.props.context, 'setDate', value.dateString, UPDATE_SOURCES.DAY_PRESS); 
    
    setTimeout(() => { // to allows setDate to be completed
      if (this.state.position === POSITIONS.OPEN) {
        this.bounceToPosition(this.closedHeight);
      }
    }, 0);
  }

  onVisibleDateChange = (value) => {
    const firstOne = _.first(value);
    if (!_.isEmpty(firstOne) && !this.isSameMonthAndYear(this.visibleDate, firstOne)) {
      this.visibleDate = firstOne; 

      // for horizontal scroll
      const {date, updateSource} = this.props.context;

      if (!this.isExactlySameDate(this.visibleDate, date) && updateSource !== UPDATE_SOURCES.DAY_PRESS) {
        const next = this.isLaterDate(firstOne, date);
        this.scrollByMonth(next);
      }

      // updating openHeight
      setTimeout(() => { // to wait for setDate() call in horizontal scroll (this.scrollByMonth())
        const numberOfWeeks = this.getNumberOfWeeksInMonth(parseDate(this.props.context.date));
        if (numberOfWeeks !== this.numberOfWeeks) {
          this.numberOfWeeks = numberOfWeeks;
          this.openHeight = this.getOpenHeight();
          if (this.state.position === POSITIONS.OPEN) {
            this.bounceToPosition(this.openHeight);
          }
        }
      }, 0);
    }
  }

  onLayout = ({nativeEvent}) => {
    const x = nativeEvent.layout.x;
    if (!this.props.horizontal) {
      this.openHeight = commons.screenHeight - x - (commons.screenHeight * 0.2); // TODO: change to commons.screenHeight ?
    }
  }

  /** Renders */

  renderWeekDaysNames() {
    const weekDaysNames = dateutils.weekDayNames(this.props.firstDay);

    return (
      <View 
        style={[
          this.style.weekDayNames, 
          {
            paddingLeft: (this.props.calendarStyle.paddingLeft || 18) + 6, 
            paddingRight: (this.props.calendarStyle.paddingRight || 18) + 6
          }
        ]}
      >
        {weekDaysNames.map((day, index) => (
          <Text allowFontScaling={false} key={day+index} style={this.style.weekday} numberOfLines={1}>{day}</Text>
        ))}
      </View>
    );
  }

  renderHeader() {
    const monthYear = XDate(this.props.context.date).toString('MMMM yyyy');
    return (
      <Animated.View
        ref={e => this.header = e}
        style={[this.style.header, {height: HEADER_HEIGHT, top: this.state.headerDeltaY}]}
        pointerEvents={'none'}
      >
        <Text allowFontScaling={false} style={this.style.headerTitle}>{monthYear}</Text>
        {this.renderWeekDaysNames()}
      </Animated.View>
    );
  }

  renderWeekCalendar() {
    const {position} = this.state;

    return (
      <Animated.View
        ref={e => this.weekCalendar = e}
        style={{
          position: 'absolute', 
          left: 0, 
          right: 0, 
          top: HEADER_HEIGHT + (commons.isAndroid ? 12 : 8), // align row on top of calendar's first row
          opacity: position === POSITIONS.OPEN ? 0 : 1
        }}
        pointerEvents={position === POSITIONS.CLOSED ? 'auto' : 'none'}
      >
        <Week
          {...this.props}
          current={this.props.context.date}
          onDayPress={this.onDayPress}
          markedDates={this.getMarkedDates()}
          style={this.props.calendarStyle}
        />
      </Animated.View>
    );
  }

  renderKnob() {
    // TODO: turn to TouchableOpacity with onPress that closes it
    return (
      <View style={this.style.knobContainer} pointerEvents={'none'}>
        <View style={this.style.knob}/>
      </View>
    );
  }

  renderArrow = (direction) => {
    if (_.isFunction(this.props.renderArrow)) {
      this.props.renderArrow(direction);
    }

    return (
      <Image
        source={direction === 'right' ? this.props.rightArrowImageSource : this.props.leftArrowImageSource}
        style={this.style.arrowImage}
      />
    );
  }

  render() {
    const {style, hideKnob, horizontal, allowShadow} = this.props;
    const {deltaY, position} = this.state;
    const isOpen = position === POSITIONS.OPEN;

    return (
      <View style={[allowShadow && this.style.containerShadow, style]}>
        <Animated.View 
          ref={e => {this.wrapper = e;}}
          style={{height: deltaY}} 
          {...this.panResponder.panHandlers}
          onLayout={this.onLayout}
        >
          <CalendarList
            testID="calendar"
            {...this.props}
            ref={r => this.calendar = r}
            currentDate={this.visibleDate}
            onDayPress={this.onDayPress}
            onVisibleDateChange={this.onVisibleDateChange}
            pagingEnabled
            scrollEnabled={isOpen}
            markedDates={this.getMarkedDates()}
            hideMonthArrows={this.shouldHideArrows()}
            hideYearArrows={this.shouldHideArrows()}
            onSubtractMonth={this.onPressArrowLeft}
            onAddMonth={this.onPressArrowRight}
            onSubtractYear={this.onPressDoubleArrowLeft}
            onAddYear={this.onPressDoubleArrowRight}
            hideExtraDays={!horizontal}
            renderMonthArrow={this.props.renderMonthArrow}
            renderYearArrow={this.props.renderYearArrow}
            staticHeader
          /> 
          {horizontal && this.renderWeekCalendar()}
          {!hideKnob && this.renderKnob()}
          {!horizontal && this.renderHeader()}
        </Animated.View>
      </View>
    );
  }
}

export default asCalendarConsumer(ExpandableCalendar);
