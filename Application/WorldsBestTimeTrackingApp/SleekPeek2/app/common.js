(function () {
    'use strict';

    // Define the common module 
    // Contains services:
    //  - common
    //  - logger
    //  - spinner
    var commonModule = angular.module('common', []);

    // Must configure the common service and set its 
    // events via the commonConfigProvider
    commonModule.provider('commonConfig', function () {
        this.config = {
            // These are the properties we need to set
            //controllerActivateSuccessEvent: '',
            //spinnerToggleEvent: ''
        };

        this.$get = function () {
            return {
                config: this.config
            };
        };
    });

    commonModule.factory('common', ['$q', '$http', '$rootScope', '$timeout', '$location', 'commonConfig', 'logger', common]);

    function common($q, $http, $rootScope, $timeout, $location, commonConfig, logger) {
        var throttles = {};

        var service = {
            // common angular dependencies
            $broadcast: $broadcast,
            $q: $q,
            $http: $http,
            $timeout: $timeout,
            $location: $location,
            $rootScope: $rootScope,
            // generic
            activateController: activateController,
            logger: logger, // for accessibility
            generateGuid: generateGuid,
            reportError: reportError
        };

        return service;

        function activateController(promises, controllerId) {
            return $q.all(promises).then(function (eventArgs) {
                var data = { controllerId: controllerId };
                $broadcast(commonConfig.config.controllerActivateSuccessEvent, data);
            });
        }

        function $broadcast() {
            return $rootScope.$broadcast.apply($rootScope, arguments);
        }

        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                       .toString(16)
                       .substring(1);
        };

        function generateGuid() {
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                   s4() + '-' + s4() + s4() + s4();
        }

        // Report error, assuming time tracker api structure
        function reportError(error) {
            if (error.Message !== undefined && error.Message.length > 0) {
                var errmsg = error.Message;
                if (error.Errors !== undefined && error.Errors.length > 0) {
                    for (var i = 0; i < error.Errors.length; i++) {
                        if (error.Errors[i].Message != undefined && error.Errors[i].Message.length > 0) {
                            errmsg += ' ' + error.Errors[i].Message;
                        }
                    }
                }
                var errFn = logger.getLogFn('', 'error');
                errFn(errmsg);
            }
        }
    }
})();