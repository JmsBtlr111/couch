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

application.controller('HomeCtrl', ['$scope', '$window', '$http', '$rootScope', function ($scope, $window, $http, $rootScope) {
    var userKey = $window.R.currentUser.get('key');

    $http.get('/api/user/' + userKey.toString())
        .success(function (data) {
            $rootScope.user = data;
        });

    $scope.createNewGroup = function (newGroupName) {
        $http.post('/api/group', {
            'name': newGroupName
        }).success(function (data) {
            $rootScope.user.groups.push(data);
        });
    };
}]);

application.controller('GroupCtrl', ['$scope', '$stateParams', '$window', '$http', '$rootScope', function ($scope, $stateParams, $window, $http, $rootScope) {
    $http.post('/api/group/' + $stateParams.id, $rootScope.user);

    $scope.listeners = [];

    var namespace = '/group';
    var connected = false;

    // Event handler for connection request generated by socket.io
    var socket = io.connect('http://' + document.domain + ':' + location.port + namespace);
    socket.once('connect', function () {
        socket.emit('connect', {data: 'duplicate'});
        connected = true;
        console.log("Connection yo")
    });

    // Handle for servers request for user information
    socket.on('info_request', info_request);
    socket.on('update_current_listeners', update_current_listeners);
    socket.on('update_current_playlist', update_current_playlist);

    function info_request(msg) {
        socket.emit('info_response', {user_id: $rootScope.user.id, group_id: $stateParams.id});
    }

    // Handle updates to the list of users currently listening
    function update_current_listeners(msg) {
        console.log(msg.listeners);
        $scope.listeners = [];
        $scope.$apply(function () {
            $scope.listeners = msg.listeners;
        });
    }

    // Handle updates to the playlist
    function update_current_playlist(msg) {
        //console.log(msg.playlist);
        // This is where we'll receive all the updates to the playlist and use it to update the appropriate widgets
    }

    //Disconnect from web-socket when state changes
    $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState) {
        if (fromState.name.toString() == 'group') {
            socket.emit('disconnect_group', {user_id: $rootScope.user.id, group_id: $stateParams.id});
            socket.removeListener('info_request', info_request);
            socket.removeListener('update_current_listeners', update_current_listeners);
            socket.removeListener('update_current_playlist', update_current_playlist);
            connected = false;
        }
        if (toState.name.toString() == 'group') {
            socket.emit('update_listeners', {user_id: $rootScope.user.id, group_id: $stateParams.id});
            connected = true
        }
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
                    'id': rdio_key,
                    'first_name': first_name,
                    'last_name': last_name,
                    'image_url': image_url,
                    'user_url': user_url
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
            }
            ;
        }
        ;
    });
}]);

