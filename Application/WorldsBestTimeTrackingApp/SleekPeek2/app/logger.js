(function () {
    'use strict';

    angular.module('common').factory('logger', ['$log', logger]);

    function logger($log) {
        var service = {
            getLogFn: getLogFn,
            log: log,
            logError: logError,
            logSuccess: logSuccess,
            logWarning: logWarning
        };

        return service;

        function getLogFn(moduleId, fnName) {
            fnName = fnName || 'log';
            switch (fnName.toLowerCase()) { // convert aliases
                case 'success':
                    fnName = 'logSuccess'; break;
                case 'error':
                    fnName = 'logError'; break;
                case 'warn':
                    fnName = 'logWarning'; break;
                case 'warning':
                    fnName = 'logWarning'; break;
            }

            var logFn = service[fnName] || service.log;
            return function (msg, data, showToast, overrideTimeOut) {
                logFn(msg, data, moduleId, (showToast === undefined) ? true : showToast, overrideTimeOut);
            };
        }

        function log(message, data, source, showToast, overrideTimeout) {
            logIt(message, data, source, showToast, 'info', overrideTimeout);
        }

        function logWarning(message, data, source, showToast, overrideTimeout) {
            logIt(message, data, source, showToast, 'warning', overrideTimeout);
        }

        function logSuccess(message, data, source, showToast, overrideTimeout) {
            logIt(message, data, source, showToast, 'success', overrideTimeout);
        }

        function logError(message, data, source, showToast, overrideTimeout) {
            logIt(message, data, source, showToast, 'error', overrideTimeout);
        }

        function logIt(message, data, source, showToast, toastType, overrideTimeOut) {
            var holdTimeOut = toastr.options.timeOut;
            if (overrideTimeOut != undefined) {
                toastr.options.timeOut = overrideTimeOut;
            }
            var write = (toastType === 'error') ? $log.error : $log.log;
            source = source ? '[' + source + '] ' : '';
            write(source, message, data);
            if (showToast) {
                if (toastType === 'error') {
                    toastr.error(message);
                } else if (toastType === 'warning') {
                    toastr.warning(message);
                } else if (toastType === 'success') {
                    toastr.success(message);
                } else {
                    toastr.info(message);
                }
            }
            toastr.options.timeOut = holdTimeOut;
        }
    }
})();