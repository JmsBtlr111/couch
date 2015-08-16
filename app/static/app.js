'use strict';

angular.module('app', ['ui.router', 'app.home_view', 'app.group_view', 'app.login_view']).
    config(['$urlRouterProvider',
        function ($urlRouterProvider) {
            $urlRouterProvider
                .otherwise('/');
        }]).
    run(['$rootScope', '$state', '$window', '$http',
        function ($rootScope, $state, $window, $http) {
            $rootScope.$on('$stateChangeStart', function (event, to, toParams, from, fromParams) {
                var require_login = to.data.require_login;

                if (require_login && typeof $rootScope.current_user === 'undefined') {
                    event.preventDefault();
                    $state.go('login');
                    return;
                }

                if (from.name === 'group') {
                    $http.delete('https://couch.firebaseio.com/group/' + fromParams['id'] + '/listeners/' + $rootScope.current_user.firebase_id + '.json')
                        .error(function (data) {
                            console.log(data);
                        });
                }
            });
        }]);