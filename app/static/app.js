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
        setTimeout(function () {
            current_request = $window.R.request({
                method: 'searchSuggestions',
                content: {
                    query: search_text,
                    types: 'track',
                    extras: '-*,name,artist,key,icon'
                },
                success: function (response) {
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

app.factory('RdioPlayerFactory', function ($window) {
    var factory = {};

    factory.play = function(track) {
        var initial_position = Math.floor(((new Date).getTime() - track.start_time)/1000);
        var config = {'source': track.key, 'initialPosition': initial_position};
        $window.R.player.play(config);
    };

    return factory;
});

app.controller('HeaderCtrl', ['$scope', '$window', function ($scope, $window) {
}]);

app.controller('HomeCtrl', ['$scope', '$window', '$http', '$rootScope', function ($scope, $window, $http, $rootScope) {
    $http.get('/api/user/' + $rootScope.current_user.id)
        .success(function (data) {
            $rootScope.current_user['groups'] = data['groups'];
        })
        .error(function (data) {
            console.log(data);
        });

    $scope.createNewGroup = function (new_group_name) {
        $http.post('/api/group', {'name': new_group_name})
            .success(function (data) {
                $http.post('/api/group/' + data['id'], {'id': $rootScope.current_user.id})
                    .success(function (data) {
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
}]);

app.controller('GroupCtrl', ['$scope', '$stateParams', '$window', '$http', '$rootScope', '$firebaseArray', 'RdioSearchFactory', 'RdioPlayerFactory',
    function ($scope, $stateParams, $window, $http, $rootScope, $firebaseArray, RdioSearchFactory, RdioPlayerFactory) {
        // TODO: Move this call to a state resolve function, if response code is 404 send user to home
        // Add current user to the current group in our db (expect 409 HTTP response code if user already in group)
        $http.post('/api/group/' + $stateParams.id, $rootScope.current_user)
            .error(function (data) {
                console.log(data);
            });

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

        $window.R.ready(function () {
            if ($scope.playlist.length) {
                RdioPlayerFactory.play($scope.playlist[0]);
            }
        });

        $scope.search_results = {};

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
            if (!$scope.playlist.length) {
                track.start_time = (new Date).getTime();
            } else {
                track.start_time = 0;
            }

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
                    var rdio_user = $window.R.currentUser['attributes'];

                    var user = {
                        'id': rdio_user['key'],
                        'first_name': rdio_user['firstName'],
                        'last_name': rdio_user['lastName'],
                        'image_url': rdio_user['icon'],
                        'user_url': rdio_user['url']
                    };

                    $http.get('/api/user/' + user.id)
                        .success(function (data) {
                            console.log('user_found');
                            $rootScope.current_user = data;
                        })
                        .error(function (data, status) {
                            console.log(data);
                            console.log(status);
                            if (status == 404) {
                                $http.post('/api/user', user)
                                    .success(function (data) {
                                        $rootScope.current_user = data;
                                    });
                            }
                        })
                        .finally(function () {
                            $state.go('home');
                        });
                } else {
                    console.log('Not Authenticated');
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

