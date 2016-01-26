(function () {
    'use strict';

    var controllerId = 'project'; // must match... what?

    // ??? why can it not find the function when common is passed
    angular.module('app').controller(controllerId, ['common', 'timeTracking', '$routeParams', '$scope', project]);

    function project(common, timeTracking, $routeParams, $scope) {
        var getMsgFn = common.logger.getLogFn;
        var msg = getMsgFn(controllerId);
        var msgSuccess = getMsgFn(controllerId, 'success');
        var msgError = getMsgFn(controllerId, 'error');
        var msgWarning = getMsgFn(controllerId, 'warning');

        var vm = this;

        vm.formatDate = formatDate;

        vm.projectId = undefined;
        if ($routeParams.projectId) {
            vm.projectId = $routeParams.projectId;
        }

        activate();

        function activate() {
            var dt = new Date(new Date().getTime() - (24 * 60 * 60 * 1000));
            var from = moment(dt).format("YYYY-MM-DD HH:mm:ss");
            var promises = [getProject(vm.projectId)];
            common.activateController(promises, controllerId).then(function () { });

            //    vm.name = "fiduciary";
        }

        function getProject(id) {
            return timeTracking.getProject(id)
                .success(function (response) {
                    common.$timeout(function () {
                        vm.project = response;
                        vm.blankRole =
                        {
                            'ProjectId' : id,
                            'Name': '',
                            'ExternalSystemKey': ''
                        };
                        vm.blankTask =
                        {
                            'ProjectId': id,
                            'Name': '',
                            'ExternalSystemKey': '',
                            'Billable': false,
                            'RequireComment' : false
                        };
                    })
                    return null;
                }).error(function (error) {
                    common.reportError(error);
                    vm.project = undefined;
                    return null;
                });
        }

        // Brian - is it bad form to use $scope. ?  This is how it's done in the documentation / courses
        // that I have used but it seems like you are doing something different in this project.  What
        // should I be doing instead of this??
        vm.addRole = function (roleToAdd) {
            timeTracking.postProjectRole(roleToAdd)
            .success(function (response) {
                common.$timeout(function () {
                    // Heavy-handed, but, let's update the project....
                    getProject(vm.projectId);
                })
                return null;
            }).error(function (error) {
                common.reportError(error);
                return null;
            });
        }

        vm.deleteRole = function (roleToDelete) {
            timeTracking.deleteProjectRole(roleToDelete.ProjectRoleId)
            .success(function (response) {
                common.$timeout(function () {
                    getProject(vm.projectId);
                })
                return null;
            });
        }

        function getTasks(projectId) {
            return connectorFactory.getProjectTasks(projectId)
                .success(function (response) {
                    common.$timeout(function () {
                        vm.tasks = response.Tasks;
                    })
                    return null;
                }).error(function (error) {
                    common.reportError(error);
                    vm.tasks = [];
                    return null;
                });
        }

        vm.addTask = function (taskToAdd) {
            timeTracking.postProjectTask(taskToAdd)
            .success(function (response) {
                common.$timeout(function () {
                    // Heavy-handed, but, let's update the project....
                    getProject(vm.projectId);
                })
                return null;
            }).error(function (error) {
                common.reportError(error);
                return null;
            });
        }

        vm.deleteTask = function (taskToDelete) {
            timeTracking.deleteProjectTask(taskToDelete.ProjectTaskId)
            .success(function (response) {
                common.$timeout(function () {
                    getProject(vm.projectId);
                })
                return null;
            }).error(function (error) {
                common.reportError(error);
                return null;
            });
        }

        function formatDate(date) {
            return moment(date).format("MM/DD/YYYY  HH:mm:ss");
        }

    }

})();