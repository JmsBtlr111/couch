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
                    extras: '-*,name,artist,key,icon,duration'
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

    factory.last_track_playing = null;

    factory.play = function(track) {
        console.log('Track Start Time: ' + track.start_time);
        factory.last_track_playing = track;
        var time_since_track_moved_to_top_of_playlist = (new Date).getTime() - track.start_time;
        var initial_position = Math.floor((time_since_track_moved_to_top_of_playlist)/1000);
        var config = {'source': track.key, 'initialPosition': initial_position};
        console.log('Time Since Track Moved: ' + time_since_track_moved_to_top_of_playlist);
        console.log('Before Play: ' + (new Date).getTime());
        $window.R.player.play(config);
        console.log('After Play: ' + (new Date).getTime());
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
            .error(function (data, status) {
                if (status != 409) {
                    console.log(data);
                }
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

        $scope.playlist.$loaded()
            .then(function () {
                $window.R.ready(function () {
                    if ($scope.playlist.length) {
                        console.log('tracks detected... play song');
                        RdioPlayerFactory.play($scope.playlist[0]);
                    }
                });
            })
            .catch(function (error) {
                console.log(error);
            });

        $scope.playlist.$watch(function (playlist_state) {
            console.log('playlist changed');
            console.log(playlist_state);
            if (playlist_state.event == 'child_added' && !playlist_state.prevChild) {
                console.log('child added, first_element in playlist');
                RdioPlayerFactory.play($scope.playlist.$getRecord(playlist_state.key))
            } else if (playlist_state.event == 'child_removed') {
                console.log('child removed, first_element in playlist');
                console.log('playlist length: ' + $scope.playlist.length);
                if ($scope.playlist.length) {
                    var next_track_key = $scope.playlist.$keyAt(0);
                    var next_track = $scope.playlist.$getRecord(next_track_key);
                    console.log(next_track);
                    RdioPlayerFactory.play(next_track);
                }
            }
        });

        $window.R.player.on('change:playingTrack', function (playing_track) {
            if (!playing_track) {
                var last_track_playing = RdioPlayerFactory.last_track_playing;
                if (last_track_playing && last_track_playing.$id == $scope.playlist[0].$id) {
                    if ($scope.playlist.length >= 2) {
                        $scope.playlist[1].start_time = (new Date).getTime();
                        $scope.playlist.$save(1);
                    }
                    console.log('Before Remove: ' + (new Date).getTime());
                    $scope.playlist.$remove(last_track_playing);
                    console.log('After Remove: ' + (new Date).getTime());
                }
            }
        });

        $scope.search_results = {};

        $scope.search = function (search_text) {
            RdioSearchFactory.search(search_text)
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

