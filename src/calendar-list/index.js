import React, {Component} from 'react';
import {FlatList, Platform, Dimensions, ActivityIndicator, View} from 'react-native';
import PropTypes from 'prop-types';
import XDate from 'xdate';

import {xdateToData, parseDate} from '../interface';
import styleConstructor from './style';
import dateutils from '../dateutils';
import CalendarListItem from './item';
import CalendarHeader from '../calendar/header/index';
import { CalendarPropTypes } from '../propTypes';


const {width} = Dimensions.get('window');

class CalendarList extends Component {
  static propTypes = {
    ...CalendarPropTypes,
    // Max amount of months allowed to scroll to the past. Default = 50
    pastScrollRange: PropTypes.number,
    // Max amount of months allowed to scroll to the future. Default = 50
    futureScrollRange: PropTypes.number,
    // Enable or disable scrolling of calendar list
    scrollEnabled: PropTypes.bool,
    // Enable or disable vertical scroll indicator. Default = false
    showScrollIndicator: PropTypes.bool,
    // When true, the calendar list scrolls to top when the status bar is tapped. Default = true
    scrollsToTop: PropTypes.bool,
    // Enable or disable paging on scroll
    pagingEnabled: PropTypes.bool,
    // Whether the scroll is horizontal
    horizontal: PropTypes.bool,
    // Used when calendar scroll is horizontal, default is device width, pagination should be disabled
    calendarWidth: PropTypes.number,
    // Dynamic calendar height
    calendarHeight: PropTypes.number,
    // Style for the List item (the calendar)
    calendarStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.array]),
    // Whether to use static header that will not scroll with the list (horizontal only)
    staticHeader: PropTypes.bool
  }

  static defaultProps = {
    horizontal: false,
    calendarWidth: width,
    calendarHeight: 360,
    pastScrollRange: 50,
    futureScrollRange: 50,
    showScrollIndicator: false,
    scrollEnabled: true,
    scrollsToTop: false,
    removeClippedSubviews: Platform.OS === 'android' ? false : true
  }

  constructor(props) {
    super(props);
    this.style = styleConstructor(props.theme);
    this.viewabilityConfig = {
      itemVisiblePercentThreshold: 20
    };

    const rows = [];
    const texts = [];
    const date = parseDate(props.currentDate) || XDate();
    
    for (let i = 0; i <= this.props.pastScrollRange + this.props.futureScrollRange; i++) {
      const rangeDate = date.clone().addMonths(i - this.props.pastScrollRange, true);
      const rangeDateStr = rangeDate.toString('MMM yyyy');
      texts.push(rangeDateStr);
      /*
       * This selects range around current shown month [-0, +2] or [-1, +1] month for detail calendar rendering.
       * If `this.pastScrollRange` is `undefined` it's equal to `false` or 0 in next condition.
       */
      if (this.props.pastScrollRange - 1 <= i && i <= this.props.pastScrollRange + 1 || !this.props.pastScrollRange && i <= this.props.pastScrollRange + 2) {
        rows.push(rangeDate);
      } else {
        rows.push(rangeDateStr);
      }
    }

    this.state = {
      rows,
      texts,
      openDate: date,
      currentDate: props.currentDate ? parseDate(props.currentDate) : XDate(),
    };

    this.onViewableItemsChangedBound = this.onViewableItemsChanged.bind(this);
    this.renderCalendarBound = this.renderCalendar.bind(this);
    this.getItemLayout = this.getItemLayout.bind(this);
    this.onLayout = this.onLayout.bind(this);
    this.changeMonth = this.changeMonth.bind(this);
    this.changeYear = this.changeYear.bind(this);
  }

  onLayout(event) {
    if (this.props.onLayout) {
      this.props.onLayout(event);
    }
  }

  scrollToDay(d, offset, animated) {
    const scrollToDate = parseDate(d);
    const diffMonths = Math.round(this.state.openDate.clone().setDate(1).diffMonths(scrollToDate.clone().setDate(1)));
    const size = this.props.horizontal ? this.props.calendarWidth : this.props.calendarHeight;
    let scrollAmount = (size * this.props.pastScrollRange) + (diffMonths * size) + (offset || 0);
    
    if (!this.props.horizontal) {
      let week = 0;
      const days = dateutils.page(scrollToDate, this.props.firstDay);
      for (let i = 0; i < days.length; i++) {
        week = Math.floor(i / 7);
        if (dateutils.sameDate(days[i], scrollToDate)) {
          scrollAmount += 46 * week;
          break;
        }
      }
    }
    this.listView.scrollToOffset({offset: scrollAmount, animated});
    
    this.setState({currentDate: scrollToDate.clone()});
  }

  scrollToMonth(m) {
    const scrollToDate = parseDate(m);
    const scrollTo = scrollToDate || this.state.openDate;
    let diffMonths = Math.round(this.state.openDate.clone().setDate(1).diffMonths(scrollTo.clone().setDate(1)));
    const size = this.props.horizontal ? this.props.calendarWidth : this.props.calendarHeight;
    const scrollAmount = (size * this.props.pastScrollRange) + (diffMonths * size);
    this.listView.scrollToOffset({offset: scrollAmount, animated: false});
    
    this.setState({currentDate: scrollToDate.clone()});
  }
  
  componentDidUpdate(prevProps) {
    const previousCurrent = parseDate(prevProps.currentDate);
    const currentCurrent = parseDate(this.props.currentDate);
    if (previousCurrent && currentCurrent && previousCurrent.getTime() !== currentCurrent.getTime()) {
      this.scrollToMonth(currentCurrent);
    }
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const rowclone = prevState.rows;
    const newrows = [];
    
    for (let i = 0; i < rowclone.length; i++) {
      let val = prevState.texts[i];
      if (rowclone[i].getTime) {
        val = rowclone[i].clone();
        val.propbump = rowclone[i].propbump ? rowclone[i].propbump + 1 : 1;
      }
      newrows.push(val);
    }

    return { 
      ...prevState, 
      rows: newrows,
      currentDate: parseDate(prevState.currentDate) 
    };
  }

  onViewableItemsChanged({viewableItems}) {
    function rowIsCloseToViewable(index, distance) {
      for (let i = 0; i < viewableItems.length; i++) {
        if (Math.abs(index - parseInt(viewableItems[i].index)) <= distance) {
          return true;
        }
      }
      return false;
    }

    const rowclone = this.state.rows;
    const newrows = [];
    const visibleMonths = [];
    
    for (let i = 0; i < rowclone.length; i++) {
      let val = rowclone[i];
      const rowShouldBeRendered = rowIsCloseToViewable(i, 1);

      if (rowShouldBeRendered && !rowclone[i].getTime) {
        val = this.state.openDate.clone().addMonths(i - this.props.pastScrollRange, true);
      } else if (!rowShouldBeRendered) {
        val = this.state.texts[i];
      }

      newrows.push(val);
      if (rowIsCloseToViewable(i, 0)) {
        visibleMonths.push(xdateToData(val));
      }
    }

    if (this.props.onVisibleDateChange) {
      this.props.onVisibleDateChange(visibleMonths);
    }

    this.setState({
      rows: newrows,
      currentDate: parseDate(visibleMonths[0])
    });
  }

  renderCalendar({item}) {
    return (
      <CalendarListItem
        scrollToMonth={this.scrollToMonth.bind(this)}
        item={item} 
        calendarHeight={this.props.calendarHeight} 
        calendarWidth={this.props.horizontal ? this.props.calendarWidth : undefined} 
        {...this.props} 
        style={this.props.calendarStyle}
      />
    );
  }

  getItemLayout(data, index) {
    return {
      length: this.props.horizontal ? this.props.calendarWidth : this.props.calendarHeight, 
      offset: (this.props.horizontal ? this.props.calendarWidth : this.props.calendarHeight) * index, index
    };
  }

  getMonthIndex(month) {
    let diffMonths = this.state.openDate.diffMonths(month) + this.props.pastScrollRange;
    return diffMonths;
  }

  changeMonth(count) {
    this.updateDate(this.state.currentDate.clone().addMonths(count, true));
  }

  changeYear(count) {
    this.updateDate(this.state.currentDate.clone().addYears(count, true));
  }

  updateDate(day, doNotTriggerListeners) {
    if (day.toString('yyyy MM') === this.state.currentDate.toString('yyyy MM')) {
      return;
    }

    this.setState({
      currentDate: day.clone()
    }, () => {
      this.scrollToMonth(this.state.currentDate);
      
      if (!doNotTriggerListeners) {
        const currMont = this.state.currentDate.clone();
        if (this.props.onDateChange) {
          this.props.onDateChange(xdateToData(currMont));
        }
        if (this.props.onVisibleDateChange) {
          this.props.onVisibleDateChange([xdateToData(currMont)]);
        }
      }
    });
  }

  renderStaticHeader() {
    const {staticHeader, horizontal} = this.props;
    const useStaticHeader = staticHeader && horizontal;
    
    if (useStaticHeader) {
      let indicator;
      if (this.props.displayLoadingIndicator) {
        indicator = <ActivityIndicator color={this.props.theme && this.props.theme.indicatorColor}/>;
      }

      return (
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
          style={[this.style.staticHeader, this.props.headerStyle]}
          theme={this.props.theme}
        />
      );
    }
  }

  render() {
    return (
      <View>
        <FlatList
          onLayout={this.onLayout}
          ref={(c) => this.listView = c}
          //scrollEventThrottle={1000}
          style={[this.style.container, this.props.style]}
          initialListSize={this.props.pastScrollRange + this.props.futureScrollRange + 1}
          data={this.state.rows}
          //snapToAlignment='start'
          //snapToInterval={this.calendarHeight}
          removeClippedSubviews={this.props.removeClippedSubviews}
          pageSize={1}
          horizontal={this.props.horizontal}
          pagingEnabled={this.props.pagingEnabled}
          onViewableItemsChanged={this.onViewableItemsChangedBound}
          viewabilityConfig={this.viewabilityConfig}
          renderItem={this.renderCalendarBound}
          showsVerticalScrollIndicator={this.props.showScrollIndicator}
          showsHorizontalScrollIndicator={this.props.showScrollIndicator}
          scrollEnabled={this.props.scrollEnabled}
          keyExtractor={(item, index) => String(index)}
          initialScrollIndex={this.state.openDate ? this.getMonthIndex(this.state.openDate) : false}
          getItemLayout={this.getItemLayout}
          scrollsToTop={this.props.scrollsToTop}
        />
        {this.renderStaticHeader()}
      </View>
    );
  }
}

export default CalendarList;
