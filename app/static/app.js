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

    $http.get('/api/user/' + userKey.toString())
        .success(function (data) {
            $rootScope.user = data;
        })
        .error(function (data, status) {
            alert(status);
            console.log(data);
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

application.controller('GroupCtrl', ['$scope', '$stateParams', '$window', '$http', '$rootScope', function ($scope, $stateParams, $window, $http, $rootScope) {
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

    // Disconnect from web-socket when state changes
    $rootScope.$on('$stateChangeStart',function(event, toState, toParams, fromState, fromParams){
        console.log("toState: " + toState.name.toString() + " fromState: " + fromState.name.toString());
        socket.disconnect()
        });

    var namespace = '/group';

    // Event handler for connection request generated by socket.io
    var socket = io.connect('http://' + document.domain + ':' + location.port + namespace);
    socket.on('connect', function() {
        socket.emit('my event', {data: ''});
    });

    // Handle for servers request for user information
    socket.on('info_request', function(msg) {
        socket.emit('info_response', {user_id: $rootScope.user.id, group_id: $stateParams.id});
    });

    // Handle updates to the list of users currently listening
    socket.on('current_listeners', function(msg) {
        console.log(msg.listeners)
    });

    // Handle updates to the playlist
    socket.on('playlist', function(msg) {
        console.log(msg.playlist)
    });

    //$window.R.player.play({source: "a3032151"})
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
                    if (status == 409) {
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

