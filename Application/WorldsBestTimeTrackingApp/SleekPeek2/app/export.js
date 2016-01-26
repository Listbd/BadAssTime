(function () {
    'use strict';

    // Controller name is handy for logging
    var controllerId = 'export';

    // Define the controller on the module.
    // Inject the dependencies. 
    // Point to the controller definition function.
    angular.module('app').controller(controllerId,
       ['common', '$location', 'timeTracking', exportData]);

    function exportData(common, $location, timeTracking) {
        var getMsgFn = common.logger.getLogFn;
        var msg = getMsgFn(controllerId);
        var msgSuccess = getMsgFn(controllerId, 'success');
        var msgError = getMsgFn(controllerId, 'error');
        var msgWarning = getMsgFn(controllerId, 'warning');

        // Using 'Controller As' syntax, so we assign this to the vm variable (for viewmodel).
        var vm = this;

        // Bindable properties and functions are placed on vm.
        vm.errorMessage = '';
        vm.exportTimeData = exportTimeData;
        vm.isProcessing = false;
        vm.jsonresponse = '';

        vm.renderHtml = function () {
            return $sce.trustAsHtml(vm.jsonresponse);
        }

        activate();

        function activate() {
            var promises = [];
            common.activateController(promises, controllerId)
                .then(function () { /*log('Activated View');*/ });
        }

        function exportTimeData(fmt) {
            // TODO - this is fragile right now, need to use a datepicker
            if (vm.from != undefined && vm.to != undefined) {
                var from = vm.from;
                var dt = new Date(vm.to);
                dt.setDate(dt.getDate() + 1); // web service is non-inclusive end date
                var to = dt.toISOString().slice(0, 10);
            }
            var win = window.open(timeTracking.getProjectHours(fmt, from, to));
        }


    }
})();