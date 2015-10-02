'use strict';

/**
 * The login view module declaration.
 * Declares the app router as a dependency.
 */
angular
    .module('app.login_view', ['ui.router'])
/**
 * The login view configuration.
 * Adds the login view's path to the routing logic.
 */
    .config(['$stateProvider',
        function ($stateProvider) {
            $stateProvider.state('login', {
                url: '/login',
                templateUrl: 'login_view/login_view.html',
                controller: 'LoginCtrl',
                data: {
                    require_login: false
                }
            });
        }])
/**
 * The login view's controller.
 * Authenticates the user with Rdio using Oauth.
 * Redirects the user to their homepage.
 */
    .controller('LoginCtrl', ['$scope', '$window', '$state', '$http', '$rootScope',
        function ($scope, $window, $state, $http, $rootScope) {
            $scope.login = function () {
                $window.R.authenticate(authenticateCallback);
            };

            var authenticateCallback = function (authenticated) {
                // If successfully authenticated, store their basic info in Couch's DB via REST API
                if (authenticated) {
                    var rdio_user = $window.R.currentUser['attributes'];

                    var user = {
                        'id': rdio_user['key'],
                        'first_name': rdio_user['firstName'],
                        'last_name': rdio_user['lastName'],
                        'user_url': rdio_user['url']
                    };

                    $http.get('/api/user/' + user.id)
                        .success(function (data) {
                            $rootScope.current_user = data;
                        })
                        // If the user doesn't exist in Couch DB yet, add them
                        .error(function (data, status) {
                            if (status == 404) {
                                $http.post('/api/user', user)
                                    .success(function (data) {
                                        $rootScope.current_user = data;
                                    });
                            }
                        })
                        // Redirect user to home
                        .finally(function () {
                            $state.go('home');
                        });
                } else {
                    // If not successful authentication, send user back to login screen again
                    $state.go('login');
                }
            };
        }]);