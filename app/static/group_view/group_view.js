'use strict';

angular.module('app.group_view', ['ui.router', 'firebase', 'applicationLoggingService']).
    constant('LOGGING_CONFIG', {
        LOGGING_TYPE: 'remote',
        REMOTE_LOGGING_ENDPOINT: 'couch-music.herokuapp.com/client_logs',
        REMOTE_ERROR_REPORT_ENDPOINT: 'couch-music.herokuapp.com/client_error_report',
        LOGGING_LEVEL: "debug"
    }).
    config(['$stateProvider',
        function ($stateProvider) {
            $stateProvider.state('group', {
                url: '/group/:id',
                templateUrl: 'group_view/group_view.html',
                controller: 'GroupCtrl',
                data: {
                    require_login: true
                }
            });
        }]).
    factory('RdioSearchFactory', function ($window, $q) {
        var factory = {};

        factory.search = function (search_text) {
            var deferred = $q.defer();
            var current_request;
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
    }).
    factory('RdioPlayerFactory', function ($window, $timeout) {
        var factory = {};
        var TRACK_CHANGE_BUFFER = 4000;

        factory.last_track_playing = null;

        factory.play = function(track) {
            console.log(track);
            factory.last_track_playing = track;
            var config = {'source': track.key};
            $timeout(function () {
                $window.R.player.play(config);
            }, TRACK_CHANGE_BUFFER);
        };

        // Play track from a position offset by a certain amount of time TODO: Test this works
        factory.play_from_offset = function(track) {
            console.log(track);
            factory.last_track_playing = track;
            var time_since_track_moved_to_top_of_playlist = (new Date).getTime() - track.firebase_start_time;
            var initial_position = Math.floor((time_since_track_moved_to_top_of_playlist)/1000);
            var config = {'source': track.key, 'initialPosition': initial_position};
            $window.R.player.play(config);
        };

        factory.playPausePlay = function(track) {
            factory.last_track_playing = track;
            var time_since_track_moved_to_top_of_playlist = (new Date).getTime() - track.firebase_start_time;
            var initial_position = Math.floor((time_since_track_moved_to_top_of_playlist)/1000);
            var config = {'source': track.key, 'initialPosition': initial_position};
            $window.R.player.play(config);
            $window.R.player.pause();
            $timeout(function () {
                $window.R.player.play();
                console.log('Couch plays at: ' + (new Date).getTime())
            }, 1000 - time_since_track_moved_to_top_of_playlist);
        };

        return factory;
    }).
    controller('GroupCtrl', ['$scope', '$stateParams', '$window', '$http', '$rootScope', '$firebaseArray','$firebaseObject', 'RdioSearchFactory', 'RdioPlayerFactory',
        function ($scope, $stateParams, $window, $http, $rootScope, $firebaseArray, $firebaseObject, RdioSearchFactory, RdioPlayerFactory) {
            applicationLoggingService.debug({
                message: 'talis test ok'
            });

            var firebase_group_url = 'https://couch.firebaseio.com/group/' + $stateParams.id;

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

            var listeners_ref = new Firebase(firebase_group_url + '/listeners');
            $scope.listeners = $firebaseArray(listeners_ref);

            $scope.listeners.$loaded()
                .then(function () {
                    // Add current user to firebase as a currently listening user
                    $scope.listeners.$add(firebase_user)
                        .then(function (user_ref) {
                            $rootScope.current_user['firebase_id'] = user_ref.key();
                            $rootScope.local_time = 0;
                            $scope.user = $firebaseObject(user_ref);
                            $scope.user.$watch(function () {
                                var round_trip_time = (new Date).getTime() - $rootScope.local_time;
                                console.log("approx latency: " + round_trip_time / 2)
                            });
                        });
                })
                .catch(function (error) {
                   console.log(error);
                });

            var playlist_ref = new Firebase(firebase_group_url + '/playlist');
            $scope.playlist = $firebaseArray(playlist_ref);

            $scope.playlist.$loaded()
                .then(function () {
                    $window.R.ready(function () {
                        if ($scope.playlist.length) {
                            console.log('tracks detected... play song');
                            RdioPlayerFactory.play_from_offset($scope.playlist[0]);
                        }
                    });
                })
                .catch(function (error) {
                    console.log(error);
                });

            $scope.playlist.$watch(function (playlist_state) {
                if (playlist_state.event == 'child_added' && !playlist_state.prevChild) {
                    console.log('child added, first_element in playlist');
                    RdioPlayerFactory.play($scope.playlist.$getRecord(playlist_state.key))
                } else if (playlist_state.event == 'child_removed') {
                    console.log('child removed, first_element in playlist');
                    if ($scope.playlist.length) {
                        var next_track_key = $scope.playlist.$keyAt(0);
                        var next_track = $scope.playlist.$getRecord(next_track_key);
                        RdioPlayerFactory.play(next_track);
                        logLatency();
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

            $scope.addToPlaylist = function(track) {
                if (!$scope.playlist.length) {
                    track.firebase_start_time = Firebase.ServerValue.TIMESTAMP;
                    track.client_start_time = (new Date).getTime();
                } else {
                    track.firebase_start_time = 0;
                    track.client_start_time = 0;
                }
                $scope.playlist.$add(track);
            };

            var logLatency = function () {
                $scope.user['firebase_time'] = Firebase.ServerValue.TIMESTAMP;
                $scope.user.$save()
                $rootScope.local_time = (new Date).getTime();
            };


            angular.element($window).bind('beforeunload', function () {
                var request = new XMLHttpRequest();
                request.open('DELETE',
                    firebase_group_url + '/listeners/' + $rootScope.current_user.firebase_id + '.json',
                    false);  // `false` makes the request synchronous
                request.send(null);
            });
        }]);