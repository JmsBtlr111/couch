'use strict';

/**
 * The main app module declaration.
 * Defines the top level dependencies required including routing and the other app views.
 */
angular
    .module('app', ['ui.router', 'app.home_view', 'app.group_view', 'app.login_view'])
/**
 * The main app configuration.
 * Configures the app to redirect all unknown url paths to the root path.
 */
    .config(['$urlRouterProvider',
        function ($urlRouterProvider) {
            $urlRouterProvider
                .otherwise('/');
        }])
/**
 * The main app run function
 * Performs login check each time the app's state (url path) is changed.
 * If the user has not logged in, redirect them to the login page.
 */
    .run(['$rootScope', '$state', '$window', '$http',
        function ($rootScope, $state, $window, $http) {
            $rootScope.$on('$stateChangeStart', function (event, to, toParams, from, fromParams) {
                var require_login = to.data.require_login;

                if (require_login && typeof $rootScope.current_user === 'undefined') {
                    event.preventDefault();
                    $state.go('login');
                    return;
                }

                // This ensures that the currently listening users list is updated when the user leaves a group
                if (from.name === 'group') {
                    $http.delete('https://couch.firebaseio.com/group/' + fromParams['id'] + '/listeners/' + $rootScope.current_user.firebase_id + '.json')
                        .error(function (data) {
                            console.log(data);
                        });
                }
            });
        }]);