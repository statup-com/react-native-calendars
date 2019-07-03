import PropTypes from 'prop-types';
import { View, ViewPropTypes } from 'react-native';

const viewPropTypes = ViewPropTypes || View.propTypes;

const SharedPropTypes = {
  // Initially visible month. Default = Date()
  currentDate: PropTypes.any,
  // Callback to change the month of the current date
  changeMonth: PropTypes.func,
  // Callback to change the year of the current date
  changeYear: PropTypes.func,
  // Date format in calendar title. Formatting values: http://arshaw.com/xdate/#Formatting
  dateFormat: PropTypes.string,
  // Provide custom day rendering component
  dayComponent: PropTypes.any,
  // Disables changing month when click on days of other months (when hideExtraDays is false). Default = false
  disableMonthChange: PropTypes.bool,
  // Disable days by default. Default = false
  disabledByDefault: PropTypes.bool,
  // Display loading indicador. Default = false
  displayLoadingIndicator: PropTypes.bool,
  // If firstDay=1 week starts from Monday. Note that dayNames and dayNamesShort should still start from Sunday.
  firstDay: PropTypes.number,
  // Style passed to the header
  headerStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.array]),
  //  Hide day names. Default = false
  hideDayNames: PropTypes.bool,
  // Do not show days of other months in month page. Default = false
  hideExtraDays: PropTypes.bool,
  // Collection of dates that have to be marked. Default = {}
  markedDates: PropTypes.object,
  // Date marking style [simple/period/multi-dot/multi-period]. Default = 'simple'
  markingType: PropTypes.string,
  // Maximum date that can be selected, dates after maxDate will be grayed out. Default = undefined
  maxDate: PropTypes.any,
  // Minimum date that can be selected, dates before minDate will be grayed out. Default = undefined
  minDate: PropTypes.any,
  // Handler which gets executed when date changes in calendar. Default = undefined
  onDateChange: PropTypes.func,
  // Handler which gets executed on day long press. Default = undefined
  onDayLongPress: PropTypes.func,
  // Handler which gets executed on day press. Default = undefined
  onDayPress: PropTypes.func,
  // Handler which gets executed when visible month changes in calendar. Default = undefined
  onVisibleDateChange: PropTypes.func,
  // Show week numbers. Default = false
  showWeekNumbers: PropTypes.bool,
  // Specify style for calendar container element. Default = {}
  style: viewPropTypes.style,
  // Specify theme properties to override specific styles for calendar parts. Default = {}
  theme: PropTypes.object,
};

export const GenericPropTypes = {
  ...SharedPropTypes,
  // Hide single navigation arrows. Default = false
  hideSingleArrows: PropTypes.bool,
  // Hide double navigation arrows. Default = false
  hideDoubleArrows: PropTypes.bool,
  // Replace default single arrows with custom ones (direction can be 'left' or 'right')
  renderSingleArrow: PropTypes.func,
  // Replace default double arrows with custom ones (direction can be 'left' or 'right')
  renderDoubleArrow: PropTypes.func,
  // Handler which gets executed when the single left arrow icon is pressed. 
  onPressSingleArrowLeft: PropTypes.func,
  // Handler which gets executed when the single right arrow icon is pressed. 
  onPressSingleArrowRight: PropTypes.func,
  // Handler which gets executed when the double left arrow icon is pressed. 
  onPressDoubleArrowLeft: PropTypes.func,
  // Handler which gets executed when the double right arrow icon is pressed. 
  onPressDoubleArrowRight: PropTypes.func,
  // Handler which gets executed when the header section is pressed. 
  onPressHeader: PropTypes.func,
};

export const CalendarPropTypes = {
  ...SharedPropTypes,
  // Hide month navigation arrows. Default = false
  hideMonthArrows: PropTypes.bool,
  // Hide year navigation arrows. Default = false
  hideYearArrows: PropTypes.bool,
  // Replace default month arrows with custom ones (direction can be 'left' or 'right')
  renderMonthArrow: PropTypes.func,
  // Replace default year arrows with custom ones (direction can be 'left' or 'right')
  renderYearArrow: PropTypes.func,
  // Handler which gets executed when the date goes to the previous month
  onSubtractMonth: PropTypes.func,
  // Handler which gets executed when the date goes to the next month
  onSubtractYear: PropTypes.func,
  // Handler which gets executed when the date goes to the previous year
  onAddMonth: PropTypes.func,
  // Handler which gets executed when the date goes to the next year
  onAddYear: PropTypes.func,
};