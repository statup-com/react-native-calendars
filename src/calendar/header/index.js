import React, {Component} from 'react';
import {ActivityIndicator, View, Text, TouchableOpacity} from 'react-native';
import MCIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import styleConstructor from './style';
import {weekDayNames} from '../../dateutils';
import {GenericPropTypes} from '../../propTypes';
import {CHANGE_MONTH_LEFT_ARROW, CHANGE_MONTH_RIGHT_ARROW, CHANGE_YEAR_LEFT_ARROW, CHANGE_YEAR_RIGHT_ARROW, CALENDAR_HEADER_ARROW} from '../../testIDs';


class CalendarHeader extends Component {

  static propTypes = GenericPropTypes;

  static defaultProps = {
    dateFormat: 'MMMM yyyy',
    onPressHeader: () => { },
  };

  constructor(props) {
    super(props);
    this.style = styleConstructor(props.theme);
    this.addMonth = this.addMonth.bind(this);
    this.subtractMonth = this.subtractMonth.bind(this);
    this.addYear = this.addYear.bind(this);
    this.subtractYear = this.subtractYear.bind(this);
    this.onSingleArrowLeft = this.onSingleArrowLeft.bind(this);
    this.onSingleArrowRight = this.onSingleArrowRight.bind(this);
    this.onDoubleArrowLeft = this.onDoubleArrowLeft.bind(this);
    this.onDoubleArrowRight = this.onDoubleArrowRight.bind(this);
    this.onHeaderSection = this.onHeaderSection.bind(this);
  }

  addMonth() {
    this.props.changeMonth(1);
  }

  subtractMonth() {
    this.props.changeMonth(-1);
  }

  addYear() {
    this.props.changeYear(1);
  }

  subtractYear() {
    this.props.changeYear(-1);
  }

  shouldComponentUpdate(nextProps) {
    if (nextProps.currentDate.toString('yyyy MM') !== this.props.currentDate.toString('yyyy MM')) {
      return true;
    }
    if (nextProps.displayLoadingIndicator !== this.props.displayLoadingIndicator) {
      return true;
    }
    if (nextProps.hideDayNames !== this.props.hideDayNames) {
      return true;
    }
    return false;
  }

  onSingleArrowLeft() {
    const {onPressSingleArrowLeft} = this.props;
    if (typeof onPressSingleArrowLeft === 'function') {
      return onPressSingleArrowLeft(this.subtractMonth, this.props.currentDate);
    }
    return this.subtractMonth();
  }

  onSingleArrowRight() {
    const {onPressSingleArrowRight} = this.props;
    if (typeof onPressSingleArrowRight === 'function') {
      return onPressSingleArrowRight(this.addMonth, this.props.currentDate);
    }
    return this.addMonth();
  }

  onDoubleArrowLeft() {
    const {onPressDoubleArrowLeft} = this.props;
    if (typeof onPressDoubleArrowLeft === 'function') {
      return onPressDoubleArrowLeft(this.subtractYear, this.props.currentDate);
    }
    return this.subtractYear();
  }

  onDoubleArrowRight() {
    const {onPressDoubleArrowRight} = this.props;
    if (typeof onPressDoubleArrowRight === 'function') {
      return onPressDoubleArrowRight(this.addYear, this.props.currentDate);
    }
    return this.addYear();
  }

  onHeaderSection() {
    const {onPressHeader} = this.props;
    if (typeof onPressHeader === 'function') {
      onPressHeader(this.props.currentDate);
    }
  }

  render() {
    let leftMonthArrow = <View />;
    let rightMonthArrow = <View />;
    let leftYearArrow = <View />;
    let rightYearArrow = <View />;
    let weekDaysNames = weekDayNames(this.props.firstDay);

    if (!this.props.hideSingleArrows) {
      leftMonthArrow = (
        <TouchableOpacity
          onPress={this.onSingleArrowLeft}
          style={this.style.arrow}
          hitSlop={{left: 20, right: 20, top: 20, bottom: 20}}
          testID={CHANGE_MONTH_LEFT_ARROW}>
          {this.props.renderSingleArrow
            ? this.props.renderSingleArrow('left')
            : <MCIcons style={this.style.arrowImage} name='chevron-left' size={30} color='#ff2121' /> }
        </TouchableOpacity>
      );
      rightMonthArrow = (
        <TouchableOpacity
          onPress={this.onSingleArrowRight}
          style={this.style.arrow}
          hitSlop={{left: 20, right: 20, top: 20, bottom: 20}}
          testID={CHANGE_MONTH_RIGHT_ARROW}>
          {this.props.renderSingleArrow
            ? this.props.renderSingleArrow('right')
            : <MCIcons style={this.style.arrowImage} name='chevron-right' size={30} color='#ff2121' /> }
        </TouchableOpacity>
      );
    }

    if (!this.props.hideDoubleArrows) {
      leftYearArrow = (
        <TouchableOpacity
          onPress={this.onDoubleArrowLeft}
          style={this.style.arrow}
          hitSlop={{left: 20, right: 20, top: 20, bottom: 20}}
          testID={CHANGE_YEAR_LEFT_ARROW}>
          {this.props.renderDoubleArrow
            ? this.props.renderDoubleArrow('left')
            : <MCIcons style={this.style.arrowImage} name='chevron-double-left' size={30} color='#ff2121' /> }
        </TouchableOpacity>
      );
      rightYearArrow = (
        <TouchableOpacity
          onPress={this.onDoubleArrowRight}
          style={this.style.arrow}
          hitSlop={{left: 20, right: 20, top: 20, bottom: 20}}
          testID={CHANGE_YEAR_RIGHT_ARROW}>
          {this.props.renderDoubleArrow
            ? this.props.renderDoubleArrow('right')
            : <MCIcons style={this.style.arrowImage} name='chevron-double-right' size={30} color='#ff2121' /> }
        </TouchableOpacity>
      );
    }

    let indicator;
    if (this.props.displayLoadingIndicator) {
      indicator = <ActivityIndicator color={this.props.theme && this.props.theme.indicatorColor}/>;
    }

    return (
      <View style={this.props.style}>
        <View style={this.style.header}>
          {leftYearArrow}
          {leftMonthArrow}
          <TouchableOpacity
            onPress={this.onHeaderSection}
            hitSlop={{left: 20, right: 20, top: 20, bottom: 20}}
            testID={CALENDAR_HEADER_ARROW}>
            <View style={{ flexDirection: 'row' }}>
              <Text allowFontScaling={false} style={this.style.monthText} accessibilityTraits='header'>
                {this.props.currentDate.toString(this.props.dateFormat)}
              </Text>
              {indicator}
            </View>
          </TouchableOpacity>
          {rightMonthArrow}
          {rightYearArrow}
        </View>
        {
          !this.props.hideDayNames &&
          <View style={this.style.week}>
            {this.props.weekNumbers && <Text allowFontScaling={false} style={this.style.dayHeader}></Text>}
            {weekDaysNames.map((day, idx) => (
              <Text 
                allowFontScaling={false} 
                key={idx} 
                accessible={false} 
                style={this.style.dayHeader} 
                numberOfLines={1} 
                importantForAccessibility='no'>
                {day}
              </Text>
            ))}
          </View>
        }
      </View>
    );
  }
}

export default CalendarHeader;
