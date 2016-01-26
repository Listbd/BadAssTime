(function () {
    'use strict';

    // Controller name is handy for logging
    var controllerId = 'login';

    // Define the controller on the module.
    // Inject the dependencies. 
    // Point to the controller definition function.
    angular.module('app').controller(controllerId,
       ['common', '$location', 'timeTracking', 'authService', login]);

    function login(common, $location, timeTracking, authService) {
        var getMsgFn = common.logger.getLogFn;
        var msg = getMsgFn(controllerId);
        var msgSuccess = getMsgFn(controllerId, 'success');
        var msgError = getMsgFn(controllerId, 'error');
        var msgWarning = getMsgFn(controllerId, 'warning');

        // Using 'Controller As' syntax, so we assign this to the vm variable (for viewmodel).
        var vm = this;

        // Bindable properties and functions are placed on vm.
        vm.errorMessage = '';
        vm.login = login;
        vm.signup = signup;
        vm.username = '';
        vm.password = '';
        vm.rememberme = false;
        vm.isProcessing = false;

        activate();

        function activate() {
            authService.clearCredentials();
            var promises = [];
            common.activateController(promises, controllerId)
                .then(function () { /*log('Activated View');*/ });
        }

        //#region Internal Methods   

        function login() {
            vm.isProcessing = true;
            vm.errorMessage = '';

            var loginModel = {
                Username: vm.username,
                Password: vm.password,
                //RememberMe: vm.rememberme
            };

            return timeTracking.getUser(vm.username, vm.password)
                .success(function (response) {
                    authService.setCredentials(vm.username, vm.password);
                    $location.path('/timeEntry/');
                    //msgSuccess("Welcome Back!");
                }).error(function (error) {
                    common.reportError(error);
                    vm.errorMessage = "Unauthorized";
                });

        }

        function signup() {
            return timeTracking.postUser(vm.username, vm.password)
                .success(function (response) {
                    msgSuccess("Welcome to Time Tracking Paradise");
                    authService.setCredentials(vm.username, vm.password);
                    $location.path('/projects/');
                }).error(function (error) {
                    common.reportError(error);
                    vm.errorMessage = "Tragically, we cannot accept your membership request";
                })
        }

        //#endregion
    }
})();