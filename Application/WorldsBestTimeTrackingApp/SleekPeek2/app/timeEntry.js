/// <reference path="..\Scripts\typings\angularjs\angular.d.ts" />
/// <reference path="..\Scripts\typings\moment\moment.d.ts" />
(function () {
    'use strict';
    var controllerId = 'timeEntry'; // must match... what?
    angular.module('app').controller(controllerId, ['common', 'timeTracking', '$routeParams', '$scope', timeEntry]);
    function timeEntry(common, timeTracking, $routeParams, $scope) {
        var getMsgFn = common.logger.getLogFn;
        var msg = getMsgFn(controllerId);
        var msgSuccess = getMsgFn(controllerId, 'success');
        var msgError = getMsgFn(controllerId, 'error');
        var msgWarning = getMsgFn(controllerId, 'warning');
        var vm = this;
        vm.timeEntries = [];
        vm.activeTimer = {};
        activate();
        function activate() {
            resetBlankTimeEntry();
            var promises = [getProjects(), updateTime()];
            var daysToPull = 10;
            for (var i = 0; i < daysToPull; i++) {
                promises.push(getTimeEntriesForDate(moment(Date.now()).subtract(i, 'days').format('YYYY-MM-DD')));
            }
            common.activateController(promises, controllerId).then(function () {
                if (vm.timeEntries.length === 0) {
                    // Nothing yet exists, so make the first group (today) manually
                    var newEntry = {
                        'data': [],
                        'dateDisplay': moment(Date.now()).format('YYYY-MM-DD'),
                    };
                    vm.timeEntries.push(newEntry);
                }
            });
        }
        // TODO - refactor to be more efficient and just keep track of the entries with
        // no TimeOut instead of looping through everything
        function updateTime() {
            if (vm.timeEntries !== undefined) {
                for (var i = 0; i < vm.timeEntries.length; i++) {
                    if (vm.timeEntries[i] !== undefined && vm.timeEntries[i].data != undefined) {
                        for (var j = 0; j < vm.timeEntries[i].data.length; j++) {
                            if (vm.timeEntries[i].data[j].TimeOut == undefined) {
                                var tin = moment(vm.timeEntries[i].data[j].TimeIn);
                                var tout = moment(Date.now());
                                var ms = tout.diff(tin);
                                var d = moment.duration(ms);
                                vm.timeEntries[i].data[j].TotalTime = Math.floor(d.asHours()) + moment.utc(ms).format(":mm:ss");
                            }
                        }
                    }
                }
            }
            // set active timer
            vm.activeTimer = common.$timeout(updateTime, 1000, true);
        }
        function getProjects() {
            return timeTracking.getProjects().success(function (response) {
                common.$timeout(function () {
                    var projects = response;
                    if (projects.length > 0) {
                        vm.projects = response;
                    }
                });
                return null;
            }).error(function (error) {
                common.reportError(error);
                return null;
            });
        }
        function resetBlankTimeEntry() {
            vm.blankTimeEntry = {
                'Projects': [],
                'Tasks': [],
                "ProjectRoleId": undefined,
                "ProjectTaskId": undefined,
                "Billable": true,
                "TimeIn": undefined,
                "TimeOut": undefined,
                "Hours": 0,
                "Comment": "",
                "isInEditMode": false
            };
        }
        // custom order by so days are from today into the past
        vm.daysOrderBy = function (day) { return -moment(day.dateDisplay); };
        vm.formatDuration = function (dur) {
            var t = moment.duration(dur);
            return Math.floor(t.asHours()) + moment.utc(t.asMilliseconds()).format(":mm:ss");
        };
        vm.formatToTime = function (datetime, relativeTo) {
            if (datetime) {
                var suffix = "";
                if (relativeTo) {
                    //var daysDiff = moment(datetime).dayOfYear() - moment(relativeTo).dayOfYear();
                    var daysDiff = moment(moment(datetime).startOf('day').diff(moment(relativeTo).startOf('day'), 'days'));
                    if (Number(daysDiff) > 0) {
                        suffix = " (+" + daysDiff + ")";
                    }
                    else if (Number(daysDiff) < 0) {
                        suffix = " (" + daysDiff + ")";
                    }
                }
                return moment(datetime).format("h:mm A") + suffix;
            }
            else {
                return "";
            }
        };
        vm.updateTasks = function () {
            vm.blankTimeEntry.Task = undefined;
            vm.blankTimeEntry.Tasks = vm.blankTimeEntry.Project.ProjectTasks;
            if (vm.blankTimeEntry.Tasks.length === 1)
                vm.blankTimeEntry.Task = vm.blankTimeEntry.Tasks[0];
            // If we don't have a role, let's add one called "Default".
            if (vm.blankTimeEntry.Project.ProjectRoles.length === 0) {
                var newDefaultRole = {
                    "Name": "Default",
                    "ProjectId": vm.blankTimeEntry.Project.ProjectId
                };
                timeTracking.postProjectRole(newDefaultRole).success(function (response) {
                    common.$timeout(function () {
                        var role = response;
                        vm.blankTimeEntry.Project.ProjectRoles.push(role);
                        // Set the role ID on our blank time entry entity
                        vm.blankTimeEntry.ProjectRoleId = role.ProjectRoleId;
                    });
                    return null;
                }).error(function (error) {
                    common.reportError(error);
                    return null;
                });
            }
            else {
                vm.blankTimeEntry.ProjectRoleId = vm.blankTimeEntry.Project.ProjectRoles[0].ProjectRoleId;
            }
        };
        vm.startWork = function (dayEntryDisplay) {
            if (vm.blankTimeEntry.TimeIn == undefined || vm.blankTimeEntry.TimeIn.length == 0) {
                vm.blankTimeEntry.TimeIn = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");
            }
            // Must be in a decent format for the api call
            vm.blankTimeEntry.TimeIn = convertTimeEntryToDate(vm.blankTimeEntry.TimeIn, dayEntryDisplay);
            if (vm.blankTimeEntry.TimeOut !== undefined && vm.blankTimeEntry.TimeOut !== null && vm.blankTimeEntry.TimeOut.length > 0) {
                vm.blankTimeEntry.TimeOut = convertTimeEntryToDate(vm.blankTimeEntry.TimeOut, dayEntryDisplay);
            }
            if (vm.blankTimeEntry.TimeIn == 'Invalid Date' || vm.blankTimeEntry.TimeOut == 'Invalid Date') {
                msgError("Entry not added. A date is invalid");
                return null;
            }
            vm.blankTimeEntry.ProjectTaskId = vm.blankTimeEntry.Task.ProjectTaskId;
            return timeTracking.postTimeEntry(vm.blankTimeEntry).success(function (response) {
                common.$timeout(function () {
                    // Refresh the day
                    refreshDay(vm.blankTimeEntry.TimeIn);
                    resetBlankTimeEntry();
                });
                return null;
            }).error(function (error) {
                common.reportError(error);
                return null;
            });
        };
        vm.stopWork = function (te) {
            if (te.TimeOut === undefined || te.TimeOut === null || te.TimeOut.length == 0) {
                te.TimeOut = moment(Date.now()).format("YYYY-MM-DDTHH:mm:ss");
            }
            return vm.updateEntry(te, true);
        };
        vm.resumeWork = function (te) {
            var newEntry = {
                "ProjectRoleId": te.ProjectRoleId,
                "ProjectTaskId": te.ProjectTaskId,
                "Billable": te.Billable,
                "TimeIn": moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
                "TimeOut": undefined,
                "Hours": 0,
                "Comment": te.Comment,
                "isInEditMode": false
            };
            return timeTracking.postTimeEntry(newEntry).success(function (response) {
                common.$timeout(function () {
                    // Refresh the day
                    refreshDay(newEntry.TimeIn);
                });
                return null;
            }).error(function (error) {
                common.reportError(error);
                return null;
            });
        };
        vm.updateEntry = function (te, resetBlankDay, dayEntryDisplay) {
            // validate times
            // This is the regular expression for date, time, or datetime (MM/DD/YYYY hh:mm:ss), military or am/pm separators of /-.
            //var rr = "^(?ni:(?=\d)(?'month'0?[1-9]|1[012])(?'sep'[/.-])((?'day'((?<!(\2((0?[2469])|11)\2))31)|(?<!\2(0?2)\2)(29|30)|((?<=((1[6-9]|[2-9]\d)(0[48]|[2468][048]|[13579][26])|(16|[2468][048]|[3579][26])00)\2\3\2)29)|((0?[1-9])|(1\d)|(2[0-8])))\2(?'year'((1[6-9])|([2-9]\d))\d\d)(?:(?=\x20\d)\x20|$))?((?<time>((0?[1-9]|1[012])(:[0-5]\d){0,2}(\x20[AP]M))|([01]\d|2[0-3])(:[0-5]\d){1,2}))?)$";
            if (te.TimeIn === undefined || te.TimeIn === null || te.TimeIn.length == 0) {
                te.TimeIn = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");
            }
            te.TimeIn = convertTimeEntryToDate(te.TimeIn, dayEntryDisplay);
            if (te.TimeOut !== undefined && te.TimeOut !== null && te.TimeOut.length > 0) {
                te.TimeOut = convertTimeEntryToDate(te.TimeOut, dayEntryDisplay);
            }
            if (te.TimeIn == 'Invalid Date' || te.TimeOut == 'Invalid Date') {
                msgError("Entry not updated. A date is invalid");
                return null;
            }
            return timeTracking.putTimeEntry(te).success(function (response) {
                common.$timeout(function () {
                    if (resetBlankDay) {
                        resetBlankTimeEntry();
                    }
                    te.isInEditMode = false;
                    // Refresh the day
                    refreshDay(te.TimeIn);
                });
                return null;
            }).error(function (error) {
                common.reportError(error);
                return null;
            });
        };
        function convertTimeEntryToDate(dateTimeAsString, dayEntryDisplay) {
            // it is more reliable to just compute the Date ourselves to avoid browser differences
            // (e.g. Chrome insists on converting the date to local time for us even though we create it in local time already)
            // try piecing it together
            // 1. count dashes
            var test = dateTimeAsString;
            var pieces = test.split(/[ T]/); // date and time split on space or T
            // is there a date part?
            var datepart = new Array();
            if (test.match(/[-\/T]/) != null) {
                datepart = pieces[0].split(/[\/-]/); // date could be dashes or slashes
                pieces.shift();
            }
            if (dayEntryDisplay !== undefined) {
                var dayEntryPieces = dayEntryDisplay.split("-");
                if (datepart.length == 0) {
                    // get day and month from day entry
                    datepart.push(dayEntryPieces[1]);
                    datepart.push(dayEntryPieces[2]);
                }
                if (datepart.length == 2) {
                    // assume we are missing the year, insert into front
                    datepart.splice(0, 0, dayEntryPieces[0]);
                }
            }
            if (pieces.length > 0) {
                var timepart = pieces[0].split(":");
                // get this out of the way..
                if (pieces[pieces.length - 1].toUpperCase() == 'PM') {
                    timepart[0] = String((Number(timepart[0]) + 12));
                }
            }
            while (timepart.length < 2) {
                timepart.push('0');
            }
            var testDate = (new Date(datepart[0], datepart[1] - 1, datepart[2], Number(timepart[0]), Number(timepart[1]))).toString();
            if (testDate == 'Invalid Date') {
                return testDate;
            }
            else {
                return moment(testDate).format("YYYY-MM-DDTHH:mm:ss");
            }
        }
        vm.beginEditEntry = function (te) {
            for (var dayIndex = 0; dayIndex < vm.timeEntries.length; dayIndex++) {
                for (var timeEntryIndex = 0; timeEntryIndex < vm.timeEntries[dayIndex].data.length; timeEntryIndex++) {
                    vm.timeEntries[dayIndex].data[timeEntryIndex].isInEditMode = false;
                }
            }
            te.isInEditMode = true;
        };
        vm.cancelEditEntry = function (te) {
            te.isInEditMode = false;
        };
        vm.deleteEntry = function (te) {
            {
                return timeTracking.deleteTimeEntry(te).success(function (response) {
                    common.$timeout(function () {
                        // Refresh the day
                        refreshDay(te.TimeIn);
                        resetBlankTimeEntry();
                    });
                    return null;
                }).error(function (error) {
                    common.reportError(error);
                    return null;
                });
            }
        };
        vm.totalDay = function (data) {
            if (data.length > 0) {
                var total = moment.duration(data[0].TotalTime);
                for (var i = 1; i < data.length; i++) {
                    var t = moment.duration(data[i].TotalTime).add(total);
                    total = t;
                }
                return vm.formatDuration(total);
            }
            else {
                return 0;
            }
        };
        vm.onTimeInSet = function (newDate, te) {
            te.TimeIn = moment(newDate).format('YYYY-MM-DDTHH:mm:ss');
        };
        vm.onTimeOutSet = function (newDate, te) {
            te.TimeOut = moment(newDate).format('YYYY-MM-DDTHH:mm:ss');
        };
        // A bit ugly - refactor
        function refreshDay(day) {
            var found = false;
            var dayOnly = day.substring(0, 10);
            for (var i = 0; i < vm.timeEntries.length; i++) {
                if (vm.timeEntries[i].dateDisplay == dayOnly) {
                    found = true;
                    return timeTracking.getTimeEntriesForDate(dayOnly).success(function (response) {
                        common.$timeout(function () {
                            if (response.length > 0) {
                                vm.timeEntries[i].data = response.reverse();
                            }
                        });
                        return null;
                    }).error(function (error) {
                        common.reportError(error);
                        return null;
                    });
                }
            }
            if (!found) {
                // new day, brand new, something makes you feel like seeing it through
                return timeTracking.getTimeEntriesForDate(dayOnly).success(function (response) {
                    common.$timeout(function () {
                        if (response.length > 0) {
                            var newEntry = {
                                'data': response.reverse(),
                                'dateDisplay': dayOnly,
                            };
                            vm.timeEntries.push(newEntry);
                        }
                    });
                    return null;
                }).error(function (error) {
                    common.reportError(error);
                    return null;
                });
            }
        }
        function getTimeEntriesForDate(dateToGet) {
            return timeTracking.getTimeEntriesForDate(dateToGet).success(function (response) {
                common.$timeout(function () {
                    if (response.length > 0) {
                        var newEntry = {
                            'data': response.reverse(),
                            'dateDisplay': dateToGet,
                        };
                        vm.timeEntries.push(newEntry);
                    }
                });
                return null;
            }).error(function (error) {
                common.reportError(error);
                return null;
            });
        }
    }
})();
//# sourceMappingURL=timeEntry.js.map