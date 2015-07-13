var application = angular.module('application', ['ui.router']);

application.config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider
        .otherwise('/');

    $stateProvider
        .state('home', {
            url: '/',
            templateUrl: 'partials/home.html',
            controller: 'HomeCtrl',
            data: {
                requireLogin: true
            }
        })
        .state('login', {
            url: '/login',
            templateUrl: 'partials/login.html',
            controller: 'LoginCtrl'
        });
}]);

application.controller('HeaderCtrl', ['$scope', '$window', function ($scope, $window) {
}]);

application.controller('HomeCtrl', ['$scope', '$window', function ($scope, $window) {
    $scope.currentUser = $window.R.currentUser.get('firstName');
}]);

application.controller('LoginCtrl', ['$scope', '$window', '$state', function ($scope, $window, $state) {
    $scope.login = function () {
        $window.R.authenticate(function (authenticated) {
            if (authenticated) {
                $state.go('home');
            };
        });
    };
}]);

application.run(['$rootScope', '$state', '$window', function ($rootScope, $state, $window) {
    $rootScope.$on('$stateChangeStart', function (e, to) {
        if (to.data && to.data.requireLogin) {
            if ($window.R.authenticated()) {
                return;
            } else {
                e.preventDefault();
                $state.go('login');
            };
        };
    });
}]);

