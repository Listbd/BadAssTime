(function () {
    'user strict';

    var factoryId = 'timeTracking';

    angular.module('app').factory(factoryId, ['common', 'commonConfig', 'authService', timeTracking]);

    function timeTracking(common, cfg, authService) {
        var $http = common.$http;
        var $q = common.$q;
        var apiurl = "https://csgprohackathonapi.azurewebsites.net/api";
        //var apiurl = "http://localhost:57214/api";

        var service = {
            getUser: getUser,
            postUser: postUser,
            getProjects: getProjects,
            getProject: getProject,
            postProject: postProject,
            deleteProject: deleteProject,
            getProjectHours : getProjectHours,
            postProjectRole: postProjectRole,
            deleteProjectRole : deleteProjectRole,
            postProjectTask: postProjectTask,
            deleteProjectTask: deleteProjectTask,
            getTimeEntries: getTimeEntries,
            getTimeEntriesForDate : getTimeEntriesForDate,
            postTimeEntry: postTimeEntry,
            putTimeEntry: putTimeEntry,
            deleteTimeEntry : deleteTimeEntry

        };
        return service;

        function getUser(user, password) {
            var url = apiurl + "/users?format=json&callId=" + common.generateGuid();
            //$http.defaults.headers.common.Authorization = 'Basic RHVkZTg6cGFzc3dvcmQ=';
            //return $http.get(url, { withCredentials: true });

            var auth = btoa(user + ":" + password);

            var r = $http({
                url: url,
                method: 'GET',
                headers: { 'Authorization': 'Basic ' + auth } // RHVkZTg6cGFzc3dvcmQ=' }
            });
            return r;
        }

        function postUser(user, password) {
            var url = apiurl + "/users?format=json&callId=" + common.generateGuid();

            var userdata = {
                "Password": password,
                "UserName": user,
                "Name": user,
                "Email": user + "@" + user + ".com",
                "TimeZoneId": "Pacific Standard Time",
                "UseStopwatchApproachToTimeEntry": true,
                "ExternalSystemKey": user
            };

            var r = $http.post(url, userdata);
            return r;
        }


        function getProjects() {
            var url = apiurl + "/Projects?format=json&callId=" + common.generateGuid();
            var r = $http({
                url: url,
                method: 'GET',
                headers: { 'Authorization': 'Basic ' + authService.getAuthCode() } // RHVkZTg6cGFzc3dvcmQ=' }
            });
            return r;

        }

        function getProject(projectId) {
            var url = apiurl + "/Projects/" + projectId + "?format=json&callId=" + common.generateGuid();
            var r = $http({
                url: url,
                method: 'GET',
                headers: { 'Authorization': 'Basic ' + authService.getAuthCode() } // RHVkZTg6cGFzc3dvcmQ=' }
            });
            return r;

        }

        function postProject(project) {
            var url = apiurl + "/Projects?format=json&callId=" + common.generateGuid();
            var r = $http({
                url: url,
                method: 'POST',
                headers: { 'Authorization': 'Basic ' + authService.getAuthCode() },
                data: project
            });
            return r;
        }

        function deleteProject(projectId) {
            var url = apiurl + "/Projects/" + projectId + "?format=json&callId=" + common.generateGuid();
            var r = $http({
                url: url,
                method: 'DELETE',
                headers: { 'Authorization': 'Basic ' + authService.getAuthCode() }
            });
            return r;
        }

        function getProjectHours(format, from, to) {
            var url = apiurl + "/ProjectHours?format=" + format;
            // TODO - add 1 day to "to" so it includes the end date and not just up to it
            if (from != undefined && to != undefined) {
                url += "&dateStart=" + from + "&dateEnd=" + to;
            }
            url += "&callId=" + common.generateGuid();
            return url;
        }

        function postProjectRole(projectRole) {
            var url = apiurl + "/ProjectRoles?format=json&callId=" + common.generateGuid();
            var r = $http({
                url: url,
                method: 'POST',
                headers: { 'Authorization': 'Basic ' + authService.getAuthCode() },
                data: projectRole
            });
            return r;
        }

        function deleteProjectRole(projectRoleId) {
            var url = apiurl + "/ProjectRoles/" + projectRoleId + "?format=json&callId=" + common.generateGuid();
            var r = $http({
                url: url,
                method: 'DELETE',
                headers: { 'Authorization': 'Basic ' + authService.getAuthCode() }
            });
            return r;
        }

        function postProjectTask(projectTask) {
            var url = apiurl + "/ProjectTasks?format=json&callId=" + common.generateGuid();
            var r = $http({
                url: url,
                method: 'POST',
                headers: { 'Authorization': 'Basic ' + authService.getAuthCode() },
                data: projectTask
            });
            return r;
        }

        function deleteProjectTask(projectTaskId) {
            var url = apiurl + "/ProjectTasks/" + projectTaskId + "?format=json&callId=" + common.generateGuid();
            var r = $http({
                url: url,
                method: 'DELETE',
                headers: { 'Authorization': 'Basic ' + authService.getAuthCode() }
            });
            return r;
        }

        function getTimeEntries() {
            var url = apiurl + "/TimeEntries" + "?format=json&callId=" + common.generateGuid();
            var r = $http({
                url: url,
                method: 'GET',
                headers: { 'Authorization': 'Basic ' + authService.getAuthCode() }
            });
            return r;
        }

        function getTimeEntriesForDate(timeDate) {
            var url = apiurl + "/TimeEntries/date/" + timeDate + "?format=json&callId=" + common.generateGuid();
            var r = $http({
                url: url,
                method: 'GET',
                headers: { 'Authorization': 'Basic ' + authService.getAuthCode() }
            });
            return r;
        }


        function postTimeEntry(timeEntry) {
            var url = apiurl + "/TimeEntries?format=json&callId=" + common.generateGuid();
            var r = $http({
                url: url,
                method: 'POST',
                headers: { 'Authorization': 'Basic ' + authService.getAuthCode() },
                data: timeEntry
            });
            return r;
        }

        function putTimeEntry(timeEntry) {
            var url = apiurl + "/TimeEntries/" + timeEntry.TimeEntryId + "?format=json&callId=" + common.generateGuid();
            var r = $http({
                url: url,
                method: 'PUT',
                headers: { 'Authorization': 'Basic ' + authService.getAuthCode() },
                data: timeEntry
            });
            return r;
        }

        function deleteTimeEntry(timeEntry) {
            var url = apiurl + "/TimeEntries/" + timeEntry.TimeEntryId + "?format=json&callId=" + common.generateGuid();
            var r = $http({
                url: url,
                method: 'DELETE',
                headers: { 'Authorization': 'Basic ' + authService.getAuthCode() }
            });
            return r;
        }
    }

})();