'use strict';

angular.module('app.home_view', ['ui.router']).
    config(['$stateProvider',
        function ($stateProvider) {
            $stateProvider.state('home', {
                url: '/',
                templateUrl: 'home_view/home_view.html',
                controller: 'HomeCtrl',
                data: {
                    require_login: true
                }
            });
        }]).
    controller('HomeCtrl', ['$scope', '$window', '$http', '$rootScope', function ($scope, $window, $http, $rootScope) {
        $http.get('/api/user/' + $rootScope.current_user.id)
            .success(function (data) {
                $rootScope.current_user['groups'] = data['groups'];
            })
            .error(function (data) {
                console.log(data);
            });

        $scope.createNewGroup = function (new_group_name) {
            $http.post('/api/group', {'name': new_group_name})
                .success(function (data) {
                    $http.post('/api/group/' + data['id'], {'id': $rootScope.current_user.id})
                        .success(function (data) {
                            $rootScope.current_user.groups.push(data);
                        })
                        .error(function (data) {
                            console.log(data);
                        })
                })
                .error(function (data) {
                    console.log(data);
                });
        };

        $scope.leaveGroup = function (group_to_leave) {
            $http.delete('/api/group/' + group_to_leave.id, {params: {id: $rootScope.current_user.id}})
                .success(function (data) {
                    $rootScope.current_user.groups.pop(data);
                })
                .error(function (data, status) {
                    if (status != 404) {
                        console.log(data);
                    }
                });
        }
    }]);