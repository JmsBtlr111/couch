var app = angular.module('application', ['ui.router', 'firebase']);

app.config(['$stateProvider', '$urlRouterProvider',
    function ($stateProvider, $urlRouterProvider) {
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

app.factory('RdioPlayerFactory', function ($window, $timeout) {
    var factory = {};

    factory.last_track_playing = null;

    factory.play = function (track) {
        console.log(track);
        factory.last_track_playing = track;
        var time_since_track_moved_to_top_of_playlist = (new Date).getTime() - track.firebase_start_time;
        var initial_position = Math.floor((time_since_track_moved_to_top_of_playlist) / 1000);
        var config = {'source': track.key, 'initialPosition': initial_position};
        $timeout(function () {
            $window.R.player.play(config);
            //console.log('Couch plays at: ' + (new Date).getTime())
        }, 1000 - time_since_track_moved_to_top_of_playlist);
    };

    factory.playPausePlay = function (track) {
        factory.last_track_playing = track;
        var time_since_track_moved_to_top_of_playlist = (new Date).getTime() - track.firebase_start_time;
        var initial_position = Math.floor((time_since_track_moved_to_top_of_playlist) / 1000);
        var config = {'source': track.key, 'initialPosition': initial_position};
        $window.R.player.play(config);
        $window.R.player.pause();
        $timeout(function () {
            $window.R.player.play();
            console.log('Couch plays at: ' + (new Date).getTime())
        }, 1000 - time_since_track_moved_to_top_of_playlist);
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

    $scope.leaveGroup = function (group_to_leave) {
        $http.delete('/api/group/' + group_to_leave.id, {params: {id: $rootScope.current_user.id}})
            .success(function (data) {
                $rootScope.current_user.groups.pop(data);
            })
            .error(function (data, status) {
                if (status != 404) {
                    console.log(data);
                }
            });
    }
}]);

app.controller('GroupCtrl', ['$scope', '$stateParams', '$window', '$http', '$rootScope', '$firebaseArray', '$firebaseObject', 'RdioSearchFactory', 'RdioPlayerFactory',
    function ($scope, $stateParams, $window, $http, $rootScope, $firebaseArray, $firebaseObject, RdioSearchFactory, RdioPlayerFactory) {
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

        // Create reference to user object in the firebase.
        var user_ref = new Firebase('https://couch.firebaseio.com/group/' + $stateParams.id + '/listeners/' + $rootScope.current_user['firebase_id']);
        $scope.user = $firebaseObject(user_ref);

        // Once user reference is loaded, add a listener function.
        $scope.user.$loaded().then(function() {
            $scope.user.$watch(function (user_state) {
                var round_trip_time = (new Date).getTime() - $rootScope.local_time;
                console.log("approx latency: " + round_trip_time / 2)
            });
        });

        $scope.playlist.$watch(function (playlist_state) {
            if (playlist_state.event == 'child_added' && !playlist_state.prevChild) {
                console.log('child added, first_element in playlist');
                RdioPlayerFactory.play($scope.playlist.$getRecord(playlist_state.key))
            } else if (playlist_state.event == 'child_removed') {
                console.log('child removed, first_element in playlist');
                logTimeDifference();
                if ($scope.playlist.length) {
                    var next_track_key = $scope.playlist.$keyAt(0);
                    var next_track = $scope.playlist.$getRecord(next_track_key);
                    RdioPlayerFactory.play(next_track);
                } else {
                    RdioPlayerFactory.last_track_playing = null;
                }
            }
        });

        $window.R.player.on('change:playingTrack', function (playing_track) {
            if (!playing_track) {
                var last_track_playing = RdioPlayerFactory.last_track_playing;
                // Check that the following variable exist for comparison
                if (last_track_playing) {
                    // This condition checks if you are the first to reach the end of the track
                    if (last_track_playing.$id == $scope.playlist.$keyAt(0)) {
                        if ($scope.playlist.length >= 2) {
                            $scope.playlist[1].firebase_start_time = Firebase.ServerValue.TIMESTAMP;
                            $scope.playlist[1].client_start_time = (new Date).getTime();
                            $scope.playlist.$save(1);
                            //console.log((new Date).getTime() - $scope.playlist[1].start_time);
                        }
                        $scope.playlist.$remove(last_track_playing);
                    }
                }
            } else {
                console.log('Track Playing at: ' + (new Date).getTime());
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

        $scope.addToPlaylist = function (track) {
            if (!$scope.playlist.length) {
                track.firebase_start_time = Firebase.ServerValue.TIMESTAMP;
                track.client_start_time = (new Date).getTime();
            } else {
                track.firebase_start_time = 0;
                track.client_start_time = 0;
            }
            $scope.playlist.$add(track);
            logLatency()
        };

        var logTimeDifference = function () {
            var user = $scope.listeners.$getRecord($rootScope.current_user['firebase_id']);
            user['firebase_time'] = Firebase.ServerValue.TIMESTAMP;
            user['client_time'] = (new Date).getTime();
            $scope.listeners.$save(user);
            var updated_user = $scope.listeners.$getRecord($rootScope.current_user['firebase_id']);
            console.log(updated_user['firebase_time'] - updated_user['client_time']);
        };

        var logLatency = function () {
            $scope.user['firebase_time'] = Firebase.ServerValue.TIMESTAMP;
            $scope.user.$save();
            $rootScope.local_time = (new Date).getTime();
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

