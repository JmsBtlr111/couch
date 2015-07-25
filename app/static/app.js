var app = angular.module('application', ['ui.router', 'firebase']);

app.config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider
        .otherwise('/');

    $stateProvider
        .state('home', {
            url: '/',
            templateUrl: 'partials/home.html',
            controller: 'HomeCtrl',
            data: {
                require_login: true
            }
        })
        .state('group', {
            url: '/group/:id',
            templateUrl: 'partials/group.html',
            controller: 'GroupCtrl',
            data: {
                require_login: true
            }
        })
        .state('login', {
            url: '/login',
            templateUrl: 'partials/login.html',
            controller: 'LoginCtrl',
            data: {
                require_login: false
            }
        });
}]);

app.factory('RdioSearchFactory', function ($window, $q) {
    var factory = {};

    factory.search = function (search_text) {
        var deferred = $q.defer();
        console.log('factory searching for:' + search_text);
        setTimeout(function () {
            current_request = $window.R.request({
                method: 'searchSuggestions',
                content: {
                    query: search_text,
                    types: 'track',
                    extras: '-*,name,artist,key,icon'
                },
                success: function (response) {
                    console.log('success' + response.status);
                    deferred.resolve(response.result);
                },
                error: function (response) {
                    console.log('error: ' + response.message);
                    deferred.reject(response.result);
                },
                complete: function () {
                    current_request = null;
                }
            });
        }, 500);
        return deferred.promise;
    };
    return factory;
});

app.factory('RdioPlayerFactory', function () {
    var factory = {};



    return factory;
});

app.controller('HeaderCtrl', ['$scope', '$window', function ($scope, $window) {
}]);

app.controller('HomeCtrl', ['$scope', '$window', '$http', '$rootScope', function ($scope, $window, $http, $rootScope) {
    var user_key = $rootScope.current_user.id;
    $scope.user_first_name = $rootScope.current_user.first_name;

    $http.get('/api/user/' + user_key.toString())
        .success(function (data) {
            $rootScope.current_user['groups'] = data['groups'];
        })
        .error(function (data) {
            console.log(data);
        });

    $scope.createNewGroup = function (new_group_name) {
        $http.post('/api/group', {'name': new_group_name})
            .success(function (data) {
                // TODO: Post the user to the newly created group
                $rootScope.current_user.groups.push(data);
            })
            .error(function (data) {
                console.log(data);
            });
    };
}]);

app.controller('GroupCtrl', ['$scope', '$stateParams', '$window', '$http', '$rootScope', '$firebaseArray', 'RdioSearchFactory',
    function ($scope, $stateParams, $window, $http, $rootScope, $firebaseArray, RdioSearchFactory) {
        var firebase_user = {
            id: $rootScope.current_user.id,
            first_name: $rootScope.current_user.first_name,
            last_name: $rootScope.current_user.last_name
        };

        // Add current user to firebase as a currently listening user
        $http.post('https://couch.firebaseio.com/group/' + $stateParams.id + '/listeners.json', firebase_user)
            .success(function (data) {
                $rootScope.current_user['firebase_id'] = data.name;
            })
            .error(function (data) {
                console.log(data);
            });

        var listeners_ref = new Firebase('https://couch.firebaseio.com/group/' + $stateParams.id + '/listeners');
        $scope.listeners = $firebaseArray(listeners_ref);

        var playlist_ref = new Firebase('https://couch.firebaseio.com/group/' + $stateParams.id + '/playlist');
        $scope.playlist = $firebaseArray(playlist_ref);

        $scope.search_results = {};

        // Add current user to the current group in our db (expect 409 HTTP response code if user already in group)
        $http.post('/api/group/' + $stateParams.id, $rootScope.current_user);

        $scope.search = function (searchText) {
            RdioSearchFactory.search(searchText)
                .then(function (data) {
                    $scope.search_results = data;
                })
                .catch(function (data) {
                    console.log(data);
                });
        };

        $scope.add_to_playlist = function(track) {
            $scope.playlist.$add(track);
        };

        angular.element($window).bind('beforeunload', function () {
            var request = new XMLHttpRequest();
            request.open('DELETE',
                'https://couch.firebaseio.com/group/' + $stateParams.id + '/listeners/' + $rootScope.current_user.firebase_id + '.json',
                false);  // `false` makes the request synchronous
            request.send(null);
        });
    }]);

app.controller('LoginCtrl', ['$scope', '$window', '$state', '$http', '$rootScope',
    function ($scope, $window, $state, $http, $rootScope) {
        $scope.login = function () {
            $window.R.authenticate(function (authenticated) {
                if (authenticated) {
                    var rdio_key = $window.R.currentUser.get('key');
                    var first_name = $window.R.currentUser.get('firstName');
                    var last_name = $window.R.currentUser.get('lastName');
                    var image_url = $window.R.currentUser.get('icon');
                    var user_url = $window.R.currentUser.get('url');

                    var user = {
                        'id': rdio_key,
                        'first_name': first_name,
                        'last_name': last_name,
                        'image_url': image_url,
                        'user_url': user_url
                    };

                    $rootScope.current_user = user;
                    $http.post('/api/user', user);
                    $state.go('home');
                } else {
                    $state.go('login');
                }
            });
        };
    }]);

app.run(['$rootScope', '$state', '$window', '$http',
    function ($rootScope, $state, $window, $http) {
        $rootScope.$on('$stateChangeStart', function (event, to, toParams, from, fromParams) {
            var require_login = to.data.require_login;

            if (require_login && typeof $rootScope.current_user === 'undefined') {
                event.preventDefault();
                $state.go('login');
            }

            if (from.name == 'group') {
                $http.delete('https://couch.firebaseio.com/group/' + fromParams['id'] + '/listeners/' + $rootScope.current_user.firebase_id + '.json')
                    .error(function (data) {
                        console.log(data);
                    });
            }
        });
    }]);

