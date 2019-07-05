import React, {Component} from 'react';
import {View} from 'react-native';

import XDate from 'xdate';
import dateutils from '../dateutils';
import {xdateToData, parseDate} from '../interface';
import { CalendarPropTypes } from '../propTypes';
import styleConstructor from './style';
import Day from './day/basic';
import UnitDay from './day/period';
import MultiDotDay from './day/multi-dot';
import MultiPeriodDay from './day/multi-period';
import SingleDay from './day/custom';
import CalendarHeader from './header';
import shouldComponentUpdate from './updater';
import {SELECT_DATE_SLOT} from '../testIDs';

//Fallback when RN version is < 0.44
const EmptyArray = [];

class Calendar extends Component {

  static propTypes = CalendarPropTypes;

  constructor(props) {
    super(props);
    this.style = styleConstructor(this.props.theme);
    
    this.state = {
      currentDate: props.currentDate ? parseDate(props.currentDate) : XDate()
    };

    this.updateDate = this.updateDate.bind(this);
    this.changeMonth = this.changeMonth.bind(this);
    this.changeYear = this.changeYear.bind(this);
    this.pressDay = this.pressDay.bind(this);
    this.longPressDay = this.longPressDay.bind(this);
    this.shouldComponentUpdate = shouldComponentUpdate;
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const propsDate = parseDate(nextProps.currentDate);
    const stateDate = prevState.currentDate;
    return { currentDate: (stateDate === undefined) ? 
        propsDate.clone() : 
        stateDate 
    };
  }

  updateDate(day, doNotTriggerListeners) {
    if (day.toString('yyyy MM') === this.state.currentDate.toString('yyyy MM')) {
      return;
    }
    this.setState({
      currentDate: day.clone()
    }, () => {
      if (!doNotTriggerListeners) {
        const currDate = this.state.currentDate.clone();
        if (this.props.onDateChange) {
          this.props.onDateChange(xdateToData(currDate));
        }
        if (this.props.onVisibleDateChange) {
          this.props.onVisibleDateChange([xdateToData(currDate)]);
        }
      }
    });
  }

  _handleDayInteraction(date, interaction) {
    const day = parseDate(date);
    const minDate = parseDate(this.props.minDate);
    const maxDate = parseDate(this.props.maxDate);
    if (!(minDate && !dateutils.isGTE(day, minDate)) && !(maxDate && !dateutils.isLTE(day, maxDate))) {
      const shouldUpdateMonth = this.props.disableMonthChange === undefined || !this.props.disableMonthChange;
      if (shouldUpdateMonth) {
        this.updateDate(day);
      }
      if (interaction) {
        interaction(xdateToData(day));
      }
    }
  }

  pressDay(date) {
    this._handleDayInteraction(date, this.props.onDayPress);
  }

  longPressDay(date) {
    this._handleDayInteraction(date, this.props.onDayLongPress);
  }

  changeMonth(count) {
    this.updateDate(this.state.currentDate.clone().addMonths(count, true));
  }

  changeYear(count) {
    this.updateDate(this.state.currentDate.clone().addYears(count, true));
  }

  renderDay(day, id) {
    const minDate = parseDate(this.props.minDate);
    const maxDate = parseDate(this.props.maxDate);
    let state = '';
    if (this.props.disabledByDefault) {
      state = 'disabled';
    } else if ((minDate && !dateutils.isGTE(day, minDate)) || (maxDate && !dateutils.isLTE(day, maxDate))) {
      state = 'disabled';
    } else if (!dateutils.sameMonth(day, this.state.currentDate)) {
      state = 'disabled';
    } else if (dateutils.sameDate(day, XDate())) {
      state = 'today';
    }

    if (!dateutils.sameMonth(day, this.state.currentDate) && this.props.hideExtraDays) {
      return (<View key={id} style={{flex: 1}}/>);
    }

    const DayComp = this.getDayComponent();
    const date = day.getDate();
    const dateAsObject = xdateToData(day);

    return (
      <View style={{flex: 1, alignItems: 'center'}} key={id}>
        <DayComp
          testID={`${SELECT_DATE_SLOT}-${dateAsObject.dateString}`}
          state={state}
          theme={this.props.theme}
          onPress={this.pressDay}
          onLongPress={this.longPressDay}
          date={dateAsObject}
          marking={this.getDateMarking(day)}>
          {date}
        </DayComp>
      </View>
    );
  }

  getDayComponent() {
    if (this.props.dayComponent) {
      return this.props.dayComponent;
    }

    switch (this.props.markingType) {
    case 'period':
      return UnitDay;
    case 'multi-dot':
      return MultiDotDay;
    case 'multi-period':
      return MultiPeriodDay;
    case 'custom':
      return SingleDay;
    default:
      return Day;
    }
  }

  getDateMarking(day) {
    if (!this.props.markedDates) {
      return false;
    }
    const dates = this.props.markedDates[day.toString('yyyy-MM-dd')] || EmptyArray;
    if (dates.length || dates) {
      return dates;
    } else {
      return false;
    }
  }

  renderWeekNumber (weekNumber) {
    return <Day key={`week-${weekNumber}`} theme={this.props.theme} marking={{disableTouchEvent: true}} state='disabled'>{weekNumber}</Day>;
  }

  renderWeek(days, id) {
    const week = [];
    days.forEach((day, id2) => {
      week.push(this.renderDay(day, id2));
    }, this);

    if (this.props.showWeekNumbers) {
      week.unshift(this.renderWeekNumber(days[days.length - 1].getWeek()));
    }

    return (<View style={this.style.week} key={id}>{week}</View>);
  }

  render() {
    const days = dateutils.page(this.state.currentDate, this.props.firstDay);
    const weeks = [];
    while (days.length) {
      weeks.push(this.renderWeek(days.splice(0, 7), weeks.length));
    }
    let indicator;
    const current = parseDate(this.props.currentDate);
    if (current) {
      const lastMonthOfDay = current.clone().addMonths(1, true).setDate(1).addDays(-1).toString('yyyy-MM-dd');
      if (this.props.displayLoadingIndicator &&
          !(this.props.markedDates && this.props.markedDates[lastMonthOfDay])) {
        indicator = true;
      }
    }
    return (
      <View style={[this.style.container, this.props.style]}>
        <CalendarHeader
          changeMonth={this.changeMonth}
          changeYear={this.changeYear}
          currentDate={this.state.currentDate}
          dateFormat={this.props.dateFormat}
          displayLoadingIndicator={indicator}
          firstDay={this.props.firstDay}
          hideDayNames={this.props.hideDayNames}
          hideDoubleArrows={this.props.hideYearArrows}
          hideSingleArrows={this.props.hideMonthArrows}
          onPressDoubleArrowLeft={this.props.onSubtractYear}
          onPressDoubleArrowRight={this.props.onAddYear}
          onPressSingleArrowLeft={this.props.onSubtractMonth}
          onPressSingleArrowRight={this.props.onAddMonth}
          renderDoubleArrow={this.props.renderYearArrow}
          renderSingleArrow={this.props.renderMonthArrow}
          showWeekNumbers={this.props.showWeekNumbers}
          style={this.props.headerStyle}
          theme={this.props.theme}
        />
        <View style={this.style.monthView}>{weeks}</View>
      </View>);
  }
}

export default Calendar;
