'use strict';

(function() {
	var DateServices = {
		pad: function(v, l) {
			while (v.length < l)
				v = '0' + v;
			return v;
		},

		format: function(date) {
			if (date)
				return this.pad( (date.getMonth() + 1).toString(), 2) + '-' + this.pad( date.getDate().toString(), 2) + '-' + date.getFullYear().toString();
		},

		clone: function(date) {
			return new Date(date.getTime());
		},

		getMonthAndYearString: function(date) {
			var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
			return months[date.getMonth()] + ' ' + date.getFullYear();
		},

		getStartDateInWeeks: function(date, dayOfWeek) {
            while (date.getDay() !== dayOfWeek)
                date.setDate(date.getDate() - 1);
            return date;
        },

        isValidDate: function(string) {
        	var format_regex = /^\d{1,2}-\d{1,2}-\d{4}$/,
        		dateObj = {};
        	if (!format_regex.test(string))
        		return false;
        	
        	var parts = string.split('-'),
        		month = parseInt(parts[0], 10),
        		day = parseInt(parts[1], 10),
        		year = parseInt(parts[2], 10);

        	if (year < 1000 || year > 3000 || month == 0 || month > 12)
        		return false;

        	var monthLength = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];
        	if(year % 400 == 0 || (year % 100 != 0 && year % 4 == 0))
       			monthLength[1] = 29;

       		if (day == 0 || day > monthLength[month - 1])
       			return false;

       		return new Date(year, month - 1, day);
        },

        getDateObject: function(string) {
        	var date = this.isValidDate(string);
        	if (date)
        		return date;
        },

        isSameDay: function(date, comparer) {
        	var comparer = comparer || new Date();
        	return date.getFullYear() === comparer.getFullYear() && date.getMonth() === comparer.getMonth() && date.getDate() === comparer.getDate();
        },

        isOutOfDateRange: function(date, start, end) {
        	return ( start && this.isBefore(date, start) ) || ( end && this.isAfter(date, end) );
        },

        isBefore: function(date, comparer) {
        	return date.getTime() < comparer.getTime();
        },

        isAfter: function(date, comparer) {
        	return date.getTime() > comparer.getTime();
        },
	};

	var DatePicker = React.createClass({displayName: 'DatePicker',
		getInitialState: function() {
			var stateObj = this.props,
				view = this.props.selectedDate || this.props.startDate;
			stateObj.view = DateServices.clone(view);
			stateObj.dateFormat = 'MM-DD-YYYY';
			stateObj.error = false;
			stateObj.errorMessage = '';
			stateObj.inputValue = null;

			return stateObj;
		},

		toggleCalendar: function() {
			this.refs.calendar.toggle();
		},

		hideCalendar: function() {
			this.refs.calendar.hide();
		},

		setDateState: function(date) {
			if (DateServices.isOutOfDateRange(date))
				return;

			var prevMonth = this.state.selectedDate ? DateServices.clone(this.state.selectedDate).getMonth() : '';

			this.setState({
				selectedDate: date,
				inputValue: DateServices.format(date)
			});

			if (!prevMonth || date.getMonth() !== prevMonth)
				this.refs.calendar.onMove(date, (date.getMonth() - prevMonth) > 0);
				this.refs.calendar.refs.monthHeader.move(date, (date.getMonth() - prevMonth) > 0);
		},

		selectDate: function(date) {
			this.setDateState(date);
    		this.refs.calendar.hide();
    		this.clearError();
		},

		changeInput: function(e) {
			this.setState({ inputValue: e.target.value })
		},

		onError: function(message) {
			this.setState({
				error: true,
				errorMessage: message
			});
		},

		clearError: function() {
			this.setState({
				error: false,
				errorMessage: ''
			});			
		},

		inputBlur: function(e) {
			var inputDate = this.state.inputValue,
				formattedDate;

			if (inputDate) {
				formattedDate = DateServices.getDateObject(inputDate);

				if (formattedDate) {
					if (DateServices.isOutOfDateRange(formattedDate, this.props.startDate, this.props.endDate)) {
						this.onError('Please choose a date between ' + DateServices.format(this.props.startDate) + ' and ' + DateServices.format(this.props.endDate));
					} else {
						this.setDateState(formattedDate);
						this.clearError();
					}
				} else {
					this.onError('Did you input in the format of ' + this.props.dateFormat + '?');
				}
			}
		},

		render: function() {
			return React.createElement('div', {className: 'date-picker'},
					React.createElement('h1', {className: 'header'}, this.props.title),
					React.createElement('p', {className: 'alert' + (this.state.error ? ' show' : ' hide')}, this.state.errorMessage),
					React.createElement('div', {className: 'field-group'},
	    				React.createElement('input', {
							type: 'text',
							className: 'input-field' + (this.state.error ? ' error' : ''),
							placeholder: this.props.dateFormat,
							value: this.state.inputValue,
							onChange: this.changeInput,
							onFocus: this.hideCalendar,
							onBlur: this.inputBlur
						}),
						React.createElement('span', {
							className: 'icon-calendar',
							onClick: this.toggleCalendar
						})
					),
    				React.createElement(Calendar, {
    					ref: 'calendar',
    					view: this.state.view,
    					selectedDate: this.state.selectedDate,
    					startDate: this.props.startDate,
    					endDate: this.props.endDate,
    					weekOrder: this.props.weekOrder,
    					dayOfWeek: this.props.dayOfWeek,
    					selectDate: this.selectDate,
    				})
    		);
		}
	});

	var Calendar = React.createClass({displayName: 'Calendar',
		getInitialState: function() {
            return {
                visible: false
            };
        },

        toggle: function() {
        	if (this.state.visible)
        		this.hide();
        	else
        		this.show();
        },

        show: function() {
        	this.setState({ visible: true });
        },

        hide: function() {
        	this.setState({ visible: false });
        },

        onMove: function(view, goForward) {
        	this.refs.weeks.moveTo(view, goForward);
        },

        onTransitionEnd: function() {
        	this.refs.monthHeader.enable();
        },

		render: function() {
			return React.createElement('div', {
						className: 'calendar' + (this.state.visible ? ' show' : ' hide'),
					},
    				React.createElement(MonthHeader, {
    					ref: 'monthHeader',
    					view: this.props.view,
    					startDate: this.props.startDate,
    					endDate: this.props.endDate,
    					onMove: this.onMove
    				}),
    				React.createElement(WeekHeader, {
    					weekOrder: this.props.weekOrder,
    				}),
    				React.createElement(Weeks, {
    					ref: 'weeks',
    					view: this.props.view,
						selectedDate: this.props.selectedDate,
    					startDate: this.props.startDate,
    					endDate: this.props.endDate,
    					dayOfWeek: this.props.dayOfWeek,
    					selectDate: this.props.selectDate,
    					onTransitionEnd: this.onTransitionEnd
    				})
    		);
		}
	});

	var MonthHeader = React.createClass({displayName: 'MonthHeader',
		getInitialState: function() {
    		return {
    			view: DateServices.clone(this.props.view),
    			enabled: true
    		};
    	},

    	goBackward: function() {
    		var updatedView = DateServices.clone(this.state.view);

    		updatedView.setMonth(updatedView.getMonth() - 1);

    		if (!this.isOutOfDateRange(updatedView))
    			this.move(updatedView, false);
    	},

    	goForward: function() {
    		var updatedView = DateServices.clone(this.state.view);

    		updatedView.setMonth(updatedView.getMonth() + 1);

    		if (!this.isOutOfDateRange(updatedView))
    			this.move(updatedView, true);
    	},

    	move: function(view, goForward) {
    		if (!this.state.enabled) return;

    		this.setState({
    			view: view,
    			enabled: false
    		});

    		this.props.onMove(view, goForward);
    	},

    	enable: function() {
    		this.setState({enabled: true});
    	},

    	isOutOfDateRange: function(date) {
    		return DateServices.isOutOfDateRange(date, this.props.startDate, this.props.endDate);
    	},

		render: function() {
			var enabled = this.state.enabled,
				prevView = DateServices.clone(this.state.view),
				nextView = DateServices.clone(this.state.view),
				atStart = false,
				atEnd = false;

			prevView.setMonth(prevView.getMonth() - 1);
			nextView.setMonth(nextView.getMonth() + 1);

			atStart = this.isOutOfDateRange( prevView );
			atEnd = this.isOutOfDateRange( nextView );

			return React.createElement('div', {className: 'month-header'},
                React.createElement('span', {
                	className: 'icon-left-open' + (enabled && !atStart ? '' : ' disabled'),
                	onClick: this.goBackward
                }),
                React.createElement('span', null, DateServices.getMonthAndYearString(this.state.view)),
                React.createElement('span', {
                	className: 'icon-right-open' + (enabled && !atEnd ? '' : ' disabled'),
                	onClick: this.goForward
                })
				
			);
		}
	});

	var WeekHeader = React.createClass({displayName: 'WeekHeader',
    	render: function() {
    		var weekOrder = this.props.weekOrder || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    		return React.createElement('div', {className: 'week-header'},
    				weekOrder.map(function(week) {
		    			return React.createElement('span', {
		    				dayOfWeek: this.props.dayOfWeek
		    			}, week);
		    		}.bind(this))
    		);
    	}
    });

	var Weeks = React.createClass({displayName: 'Weeks',
		getInitialState: function() {
    		return {
    			view: DateServices.clone(this.props.view),
    			updatedView: DateServices.clone(this.props.view),
    			transitioning: null
    		};
    	},

    	componentDidMount: function() {
    		this.refs.current.getDOMNode().addEventListener("transitionend", this.onTransitionEnd);
    	},

    	onTransitionEnd: function() {
    		this.setState({
    			transitioning: null,
    			view: DateServices.clone(this.state.updatedView)
    		});

    		this.props.onTransitionEnd();
    	},

    	getWeekStartDates: function(view) {
    		view = DateServices.clone(view);
    		view.setDate(1);

    		var viewMonth = view.getMonth(),
    			dayOfWeek = this.props.dayOfWeek || 0,
    			startDate = DateServices.getStartDateInWeeks(DateServices.clone(view), dayOfWeek),
    			current = DateServices.clone(startDate),
    			weekStartDates = [];

    		do {
    			weekStartDates.push(DateServices.clone(current));
    			current.setDate(current.getDate() + 7);
    		} while (current.getMonth() === viewMonth)
    		

    		return weekStartDates;
    	},

    	moveTo: function(view, goForward) {
    		this.setState({
    			transitioning: goForward ? 'left' : 'right',
    			updatedView: DateServices.clone(view)
    		});
    	},

		render: function() {
			return React.createElement('div', {className: 'weeks-body'},
					React.createElement('div', {
						ref: 'current',
						className: 'current' + (this.state.transitioning ? (' transitioning ' + this.state.transitioning) : ''),
						onTransitionEnd: this.props.onTransitionEnd
					},this.renderWeeks(this.state.view)),
					React.createElement('div', {
						ref: 'duplicate',
						className: 'duplicate' + (this.state.transitioning ? (' transitioning ' + this.state.transitioning) : ''),
						onTransitionEnd: this.props.onTransitionEnd
					},this.renderWeeks(this.state.updatedView))
			);
		},

		renderWeeks: function(view) {
			var month = view.getMonth(),
				weekStartDates = this.getWeekStartDates(view);
			
			return weekStartDates.map(function(weekStart) {
				return React.createElement(Week, {
					startDate: this.props.startDate,
					endDate: this.props.endDate,
					weekStart: weekStart,
					month: month,
					selectedDate: this.props.selectedDate,
					selectDate: this.props.selectDate
				});
			}.bind(this));
		}
	});

	var Week = React.createClass({displayName: 'Week',
		getDatesArr: function(startDate) {
			var dates = [],
				clone;

			for (var i = 0; i < 7; i++) {
				clone = DateServices.clone(startDate);
				dates.push(clone);
				startDate.setDate(startDate.getDate() + 1);
			}
			
			return dates;
		},

		setDateClass: function(date) {
			var status = '';

			if (date.getMonth() !== this.props.month)
				status += ' not-current-month';
			if ( DateServices.isSameDay(date) )
				status += ' today';
			if (this.props.selectedDate && DateServices.isSameDay(date, this.props.selectedDate)) 
				status += ' selected';
			if (this.isDisabled(date))
				status += ' disabled'

			return status ? status : '';
		},

		selectDate: function(date) {
			if (!this.isDisabled(date))
				this.props.selectDate(date);
		},

		isDisabled: function(date) {
			return DateServices.isOutOfDateRange( date, this.props.startDate, this.props.endDate  );
		},

		render: function() {
			var daysArr = this.getDatesArr(this.props.weekStart);

			return React.createElement('div', {className: 'week'},
					daysArr.map(function(date) {
						return React.createElement('span', {
							className: 'day' + this.setDateClass(date),
							onClick: this.selectDate.bind(null, date)
						}, date.getDate())
					}.bind(this))
			);
		}
	});

	var SETTING = (function() {
		var today = new Date(),
			oneYearLater = new Date(new Date().setYear(today.getFullYear() + 1));

		return {
			title: 'Book an appointment with us!',
			startDate: today,
			endDate: oneYearLater,
			weekOrder: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
			dayOfWeek: 1 //starts at monday
		};
	})();

	React.render(React.createElement(DatePicker, SETTING), document.querySelector('#datepicker'));
})();