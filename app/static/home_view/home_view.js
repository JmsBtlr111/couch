'use strict';

/**
 * The home view module declaration.
 * Declares the app router as a dependency.
 */
angular
    .module('app.home_view', ['ui.router'])
/**
 * The home view configuration.
 * Adds the home view's path to the routing logic. Requires login.
 */
    .config(['$stateProvider',
        function ($stateProvider) {
            $stateProvider.state('home', {
                url: '/',
                templateUrl: 'home_view/home_view.html',
                controller: 'HomeCtrl',
                data: {
                    require_login: true
                }
            });
        }])
/**
 * The home view's controller.
 * Fetches the user's current groups.
 * Allows user to create new groups.
 * Allows user to leave groups.
 */
    .controller('HomeCtrl', ['$scope', '$http', '$rootScope', function ($scope, $http, $rootScope) {
        // GET current user's groups from Couch API
        $http.get('/api/user/' + $rootScope.current_user.id)
            .success(function (data) {
                $rootScope.current_user['groups'] = data['groups'];
            })
            .error(function (data) {
                console.log(data);
            });

        $scope.createNewGroup = function (new_group_name) {
            // POST new group to Couch API
            $http.post('/api/group', {'name': new_group_name})
                .success(function (data) {
                    $http.post('/api/group/' + data['id'], {'id': $rootScope.current_user.id})
                        .success(function (data) {
                            // Update currently displayed groups on user's screen
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
            // DELETE current user from specific group using Couch API
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