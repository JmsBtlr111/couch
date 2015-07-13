var application = angular.module('application', ['ui.router']);

application.config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider
        .otherwise('/');

    $stateProvider
        .state('home', {
            url: '/',
            templateUrl: 'partials/home.html',
            controller: 'HomeCtrl'
            //data: {
            //    requireLogin: true
            //}
        })
        .state('group', {
            url: '/group/:id',
            templateUrl: 'partials/group.html',
            controller: 'GroupCtrl'
        })
        .state('login', {
            url: '/login',
            templateUrl: 'partials/login.html',
            controller: 'LoginCtrl'
        });
}]);

application.controller('HeaderCtrl', ['$scope', '$window', function ($scope, $window) {
}]);

application.controller('HomeCtrl', ['$scope', '$window', '$http', function ($scope, $window, $http) {
    var userKey = $window.R.currentUser.get('key');

    $http.get('/api/user/1')
        .success(function (data, status, headers, config) {
            $scope.user = data;
            alert(status);
        })
        .error(function (data, status, headers, config) {
            alert(status);
        });

}]);

application.controller('GroupCtrl', ['$scope', function ($scope) {

}]);

application.controller('LoginCtrl', ['$scope', '$window', '$state', '$http', function ($scope, $window, $state, $http) {
    $scope.login = function () {
        $window.R.authenticate(function (authenticated) {
            if (authenticated) {
                var rdio_key = $window.R.currentUser.get('key');
                var first_name = $window.R.currentUser.get('firstName');
                var last_name = $window.R.currentUser.get('lastName');
                var image_url = $window.R.currentUser.get('baseIcon');
                var user_url = $window.R.currentUser.get('url');

                $http.post('/api/user', {
                    'rdio_key':rdio_key,
                    'first_name':first_name,
                    'last_name':last_name,
                    'image_url':image_url,
                    'user_url':user_url
                }).success(function (results) {
                    alert(results.response);
                }).error(function (results) {
                    alert(results.response);
                });
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

