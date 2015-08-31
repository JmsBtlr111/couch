'use strict';

angular.module('app.group_view', ['ui.router', 'firebase']).
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
    factory('RdioPlayerFactory', function ($window, $timeout, $rootScope) {
        var factory = {};
        var TRACK_CHANGE_BUFFER = 4000;
        $rootScope.tattletale = new Tattletale('http://couch-music.herokuapp.com/log');

        factory.last_track_playing = null;

        factory.play = function(track) {
            console.log('playing ' + track.name);
            var config = {'source': track.key};
            $timeout(function () {
                $window.R.player.play(config);
                $rootScope.tattletale.log((new Date).getTime());
                factory.last_track_playing = track;
            }, TRACK_CHANGE_BUFFER);
        };

        // Play track from a position offset by a certain amount of time TODO: Test this works
        factory.play_from_offset = function(track) {
            console.log('playing ' + track.name);
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
    controller('GroupCtrl', ['$scope', '$stateParams', '$window', '$http', '$rootScope', '$firebaseArray','$firebaseObject', 'RdioSearchFactory', 'RdioPlayerFactory'/*, 'applicationLoggingService'*/,
        function ($scope, $stateParams, $window, $http, $rootScope, $firebaseArray, $firebaseObject, RdioSearchFactory, RdioPlayerFactory/*, applicationLoggingService*/) {
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
                            RdioPlayerFactory.play_from_offset($scope.playlist[0]);
                        }
                    });
                })
                .catch(function (error) {
                    console.log(error);
                });

            $scope.playlist.$watch(function (playlist_state) {
                if (playlist_state.event == 'child_added'){
                    if (!playlist_state.prevChild) {
                        console.log('track added, first_element in playlist');
                        RdioPlayerFactory.play($scope.playlist.$getRecord(playlist_state.key));
                    } else {
                        console.log('track added');
                    }
                } else if (playlist_state.event == 'child_removed') {
                    console.log('track removed, first_element in playlist');
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
                    // Check that the following variable exists for comparison
                    if (last_track_playing) {
                        $scope.playlist.$remove(last_track_playing).
                            then(function (ref) {
                                console.log(ref);
                            });
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

            $scope.addToPlaylist = function(track) {
                $scope.playlist.$add(track);
            };

            $scope.sendLogs = function() {
                $rootScope.tattletale.send()
            };

            angular.element($window).bind('beforeunload', function () {
                var request = new XMLHttpRequest();
                request.open('DELETE',
                    firebase_group_url + '/listeners/' + $rootScope.current_user.firebase_id + '.json',
                    false);  // `false` makes the request synchronous
                request.send(null);
            });
        }]);