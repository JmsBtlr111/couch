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

application.controller('HomeCtrl', ['$scope', '$window', '$http', '$rootScope', function ($scope, $window, $http, $rootScope ) {
    var userKey = $window.R.currentUser.get('key');

    $http.get('/api/user?q={"filters":[{"name":"rdio_key","op":"eq","val":"' + userKey.toString() +'"}]}')
        .success(function (data) {
            $rootScope.user = data['objects'][0];
        })
        .error(function (data, status) {
            alert(status);
        });

    $scope.createNewGroup = function (newGroupName) {
        $http.post('/api/group', {
            'name': newGroupName
        }).success(function (data) {
            $rootScope.user.groups.push(data);
        }).error(function () {
        });
    };
}]);

application.controller('GroupCtrl', ['$scope', '$stateParams', '$http', '$rootScope', function ($scope, $stateParams, $http, $rootScope) {
    var group = {};

    $http.get('/api/group/' + $stateParams.id)
        .success(function (data) {
            group = data;
        });

    $http.get('/api/user/' + $rootScope.user.id)
        .success(function (data) {
            if ((group in data.groups)) {
                data.groups.push(group);
                $http.put('/api/user/' + $rootScope.user.id, {
                    'groups':data.groups
                });
            };
        });
}]);

application.controller('LoginCtrl', ['$scope', '$window', '$state', '$http', function ($scope, $window, $state, $http) {
    $scope.login = function () {
        $window.R.authenticate(function (authenticated) {
            if (authenticated) {
                var rdio_key = $window.R.currentUser.get('key');
                var first_name = $window.R.currentUser.get('firstName');
                var last_name = $window.R.currentUser.get('lastName');
                var image_url = $window.R.currentUser.get('icon');
                var user_url = $window.R.currentUser.get('url');

                $http.post('/api/user', {
                    'id':rdio_key,
                    'first_name':first_name,
                    'last_name':last_name,
                    'image_url':image_url,
                    'user_url':user_url
                }).success(function () {
                    $state.go('home');
                }).error(function (data, status) {
                    if (status == 400) {
                        $state.go('home');
                    }
                });
            }
        });
    };
}]);

application.run(['$rootScope', '$state', '$window', function ($rootScope, $state, $window) {
    $rootScope.user = {};

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

