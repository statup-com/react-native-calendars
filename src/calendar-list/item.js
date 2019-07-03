import React, {Component} from 'react';
import {Text, View} from 'react-native';
import Calendar from '../calendar';
import styleConstructor from './style';


class CalendarListItem extends Component {
  static defaultProps = {
    hideMonthArrows: true,
    hideYearArrows: true,
    hideExtraDays: true
  };

  constructor(props) {
    super(props);
    this.style = styleConstructor(props.theme);
  }

  shouldComponentUpdate(nextProps) {
    const r1 = this.props.item;
    const r2 = nextProps.item;
    return r1.toString('yyyy MM') !== r2.toString('yyyy MM') || !!(r2.propbump && r2.propbump !== r1.propbump);
  }

  onSubtractMonth = (_, currentDate) => {
    const dateClone = currentDate.clone();
    if (this.props.onSubtractMonth) {
      this.props.onSubtractMonth(_, dateClone);
    } else if (this.props.scrollToMonth) {
      dateClone.addMonths(-1);
      this.props.scrollToMonth(dateClone);
    }
  }

  onAddMonth = (_, currentDate) => {
    const dateClone = currentDate.clone();
    if (this.props.onAddMonth) {
      this.props.onAddMonth(_, dateClone);
    } else if (this.props.scrollToMonth) {
      dateClone.addMonths(1);
      this.props.scrollToMonth(dateClone);
    }
  }

  onSubtractYear = (_, currentDate) => {
    const dateClone = currentDate.clone();
    if (this.props.onSubtractYear) {
      this.props.onSubtractYear(_, dateClone);
    } else if (this.props.scrollToYear) {
      dateClone.addYears(-1);
      this.props.scrollToYear(dateClone);
    }
  }

  onAddYear = (_, currentDate) => {
    const dateClone = currentDate.clone();
    if (this.props.onAddYear) {
      this.props.onAddYear(_, dateClone);
    } else if (this.props.scrollToYear) {
      dateClone.addYears(1);
      this.props.scrollToYear(dateClone);
    }
  }

  render() {
    const row = this.props.item;

    if (row.getTime) {
      return (
        <Calendar
          theme={this.props.theme}
          style={[{height: this.props.calendarHeight, width: this.props.calendarWidth}, this.style.calendar, this.props.style]}
          currentDate={row}
          hideMonthArrows={this.props.hideMonthArrows}
          hideYearArrows={this.props.hideYearArrows}
          hideExtraDays={this.props.hideExtraDays}
          disableMonthChange
          markedDates={this.props.markedDates}
          markingType={this.props.markingType}
          hideDayNames={this.props.hideDayNames}
          onDayPress={this.props.onDayPress}
          onDayLongPress={this.props.onDayLongPress}
          displayLoadingIndicator={this.props.displayLoadingIndicator}
          minDate={this.props.minDate}
          maxDate={this.props.maxDate}
          firstDay={this.props.firstDay}
          dateFormat={this.props.dateFormat}
          dayComponent={this.props.dayComponent}
          disabledByDefault={this.props.disabledByDefault}
          showWeekNumbers={this.props.showWeekNumbers}
          renderMonthArrow={this.props.renderMonthArrow}
          renderYearArrow={this.props.renderYearArrow}
          onSubtractMonth={this.props.horizontal ? this.onSubtractMonth : this.props.onSubtractMonth}
          onSubtractYear={this.props.horizontal ? this.onSubtractYear : this.props.onSubtractYear}
          onAddMonth={this.props.horizontal ? this.onAddMonth : this.props.onAddMonth}
          onAddYear={this.props.horizontal ? this.onAddYear : this.props.onAddYear}
          headerStyle={this.props.headerStyle}
        />);
    } else {
      const text = row.toString();

      return (
        <View style={[{height: this.props.calendarHeight, width: this.props.calendarWidth}, this.style.placeholder]}>
          <Text allowFontScaling={false} style={this.style.placeholderText}>{text}</Text>
        </View>
      );
    }
  }
}

export default CalendarListItem;
