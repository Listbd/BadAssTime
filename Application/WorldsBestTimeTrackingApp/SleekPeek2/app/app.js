(function () {
    'use strict';

    var app = angular.module('app', ['ngCookies', 'ngRoute', 'ngGrid', 'ngResource', 'ngAnimate', 'angular-loading-bar', 'common', 'ui.bootstrap.datetimepicker']);

    app.config(function ($routeProvider) {
        $routeProvider
            .when('/timeEntry', {
                templateUrl: 'app/timeEntry.html'
            })
          .when('/projects', {
              templateUrl: 'app/projects.html'
          })            
          .when('/project/:projectId', {
              templateUrl: 'app/project.html'
          })        
          .when('/export', {
              templateUrl: 'app/export.html'
          })
          .when('/', {
              templateUrl: 'app/login.html'
          })
          .otherwise({
              redirectTo: '/'
          });
    })

    app.controller('navController', function ($scope, $location) {
        // Brian, not sure how to get rid of $scope here...
        $scope.isActive = function (route) {
            return route === $location.path();
        }
    });

})();
