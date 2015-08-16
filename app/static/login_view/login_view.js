'use strict';

angular.module('app.login_view', ['ui.router']).
    config(['$stateProvider',
        function ($stateProvider) {
            $stateProvider.state('login', {
                url: '/login',
                templateUrl: 'login_view/login_view.html',
                controller: 'LoginCtrl',
                data: {
                    require_login: false
                }
            });
        }]).
    controller('LoginCtrl', ['$scope', '$window', '$state', '$http', '$rootScope',
        function ($scope, $window, $state, $http, $rootScope) {
            $scope.login = function () {
                $window.R.authenticate(function (authenticated) {
                    if (authenticated) {
                        var rdio_user = $window.R.currentUser['attributes'];

                        var user = {
                            'id': rdio_user['key'],
                            'first_name': rdio_user['firstName'],
                            'last_name': rdio_user['lastName'],
                            'image_url': rdio_user['icon'],
                            'user_url': rdio_user['url']
                        };

                        $http.get('/api/user/' + user.id)
                            .success(function (data) {
                                $rootScope.current_user = data;
                            })
                            .error(function (data, status) {
                                console.log(data);
                                console.log(status);
                                if (status == 404) {
                                    $http.post('/api/user', user)
                                        .success(function (data) {
                                            $rootScope.current_user = data;
                                        });
                                }
                            })
                            .finally(function () {
                                $state.go('home');
                            });
                    } else {
                        $state.go('login');
                    }
                });
            };
        }]);