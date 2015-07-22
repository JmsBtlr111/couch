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
            controller: 'GroupCtrl',
            params: {
                group: {value: 'no id provided'}
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

    $window.R.ready(function () {
        var search = new metronomik.search('search', 'Track');
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

application.run(['$rootScope', '$state', '$window', '$stateParams', function ($rootScope, $state, $window, $stateParams) {
    $rootScope.user = {};
    console.log($rootScope);

    // Define the socketio namespace
    var namespace = '/sockets';

    // Create the socket object
    var socket = io.connect('http://' + document.domain + ':' + location.port + namespace);

    // Event Listeners
    socket.once('connect', connect);
    socket.once('disconnect', disconnect);
    socket.on('confirm_connect', confirm_connect);
    socket.on('update_current_listeners', update_current_listeners);
    socket.on('update_current_playlist', update_current_playlist);

    // Connection event callback
    function connect() {
        socket.emit('connect', {data: 'duplicate'});
        console.log("Connection yo")
    }

    // Disconnection event callback
    function disconnect() {
        console.log("Disconnection")
    }

    // Connection confirmation callback
    function confirm_connect(msg) {
        console.log("Connection confirmed")
    }

    // Callback for an update to the current listeners
    function update_current_listeners(msg) {
        console.log(msg.listeners);
        $scope.listeners = [];
        $scope.$apply(function () {
            $scope.listeners = msg.listeners;
        });
    }

    // Callback for an update to the current playlist
    function update_current_playlist(msg) {
        console.log(msg.playlist);
    }

    $rootScope.$on('$stateChangeStart', function (event, toState, fromState, toParams, fromParams) {

        // Run when a user joins a group
        if(typeof toState.name !== 'undefined') {
            console.log("To: " + toParams.group);
            console.log("From: " + fromParams.group);
            if (toState.name.toString() == 'group') {
                socket.emit('join_group', {user_id: $rootScope.user.id, group_id: toParams.id});
            }
        }

        // Run when a user leaves a group
        if(typeof fromState.name !== 'undefined') {
            if (fromState.name.toString() == 'group') {
                console.log("To: " + toParams.group);
                console.log("From: " + fromParams.group);
                socket.emit('leave_group', {user_id: $rootScope.user.id, group_id: toParams.id});
            }
        }
    });

    $rootScope.$on('$stateChangeStart', function (e, to) {
        if (to.data && to.data.requireLogin) {
            if ($window.R.authenticated()) {
                return;
            } else {
                e.preventDefault();
                $state.go('login');
            }
        }
    });
}]);

