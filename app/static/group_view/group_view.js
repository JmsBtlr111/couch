'use strict';

/**
 * The group view module declaration.
 * Declares the app router and firebase as dependencies.
 */
angular
    .module('app.group_view', ['ui.router', 'firebase'])
/**
 * The group view configuration.
 * Adds the group view's path to the routing logic. Requires login.
 */
    .config(['$stateProvider',
        function ($stateProvider) {
            $stateProvider.state('group', {
                url: '/group/:id',
                templateUrl: 'group_view/group_view.html',
                controller: 'GroupCtrl',
                data: {
                    require_login: true
                }
            });
        }])
/**
 * RdioSearchFactory definition.
 * This factory returns an object with a method to search the Rdio music database.
 */
    .factory('RdioSearchFactory', function ($window, $q) {
        var factory = {};

        // The search function returns a promise which resolves either to the search result or a rejection message.
        // This allows the function to behave in an asynchronous manner.
        factory.search = function (search_text) {
            var deferred = $q.defer();
            var current_request;
            // If search takes longer than 500ms, timeout.
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
    })
/**
 * The RdioPlayerFactory definition.
 * This factory returns an object with methods to control the music playback.
 */
    .factory('RdioPlayerFactory', function ($window, $timeout, $rootScope) {
        var factory = {};
        var INTER_TRACK_TIME_BUFFER = 500;

        factory.last_track_playing = null;

        // This method plays the given track after the Inter-Track Time Buffer expires.
        factory.play = function(track) {
            var config = {'source': track.key};
            $timeout(function () {
                if($rootScope.finishedSong) {
                    $rootScope.tattletale.log('previous_track_finished: True');
                } else if(factory.last_track_playing) {
                    $rootScope.tattletale.log('previous_track_finished: False');
                }
                $rootScope.tattletale.log('track_id: ' + track.$id + ', track_duration: ' + track.duration);
                factory.last_track_playing = track;
                $window.R.player.play(config);
                $rootScope.tattletale.log('play_time: ' + (new Date).getTime());
                $rootScope.finishedSong = false;
            }, INTER_TRACK_TIME_BUFFER);
        };

        // EXPERIMENTAL: This method plays the given track from an offset.
        factory.playFromOffset = function(track) {
            console.log('playing ' + track.name);
            factory.last_track_playing = track;
            var time_since_track_moved_to_top_of_playlist = (new Date).getTime() - track.firebase_start_time;
            var initial_position = Math.floor((time_since_track_moved_to_top_of_playlist)/1000);
            var config = {'source': track.key, 'initialPosition': initial_position};
            $window.R.player.play(config);
        };

        // EXPERIMENTAL: This method prefetches the track before the INTER_TRACK_TIME_BUFFER has expired to improve synchronicity.
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
            }, INTER_TRACK_TIME_BUFFER);
        };

        // Mutes the playback
        factory.mute = function () {
            $window.R.player.volume(0.0);
        };

        // Unmutes the playback
        factory.maxVolume = function () {
            $window.R.player.volume(1.0);
        };

        return factory;
    })
/**
 * The group view's controller.
 * Initializes client2server logging framework.
 * Adds user to the group via Couch API.
 * Updates currently listening user's list.
 * Initializes playlist.
 * Binds search + addToPlaylist functions to DOM elements.
 * Handles distributed playback event logic.
 */
    .controller('GroupCtrl', ['$scope', '$stateParams', '$window', '$http', '$rootScope', '$firebaseArray','$firebaseObject', 'RdioSearchFactory', 'RdioPlayerFactory',
        function ($scope, $stateParams, $window, $http, $rootScope, $firebaseArray, $firebaseObject, RdioSearchFactory, RdioPlayerFactory) {
            var firebase_group_url = 'https://couch.firebaseio.com/group/' + $stateParams.id;
            $rootScope.tattletale = new Tattletale('http://couch-music.herokuapp.com/log');
            $rootScope.finishedSong = false;

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

            // Initialize currently listening users list
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

            // Initialize playlist
            var playlist_ref = new Firebase(firebase_group_url + '/playlist');
            $scope.playlist = $firebaseArray(playlist_ref);

            $scope.playlist.$loaded()
                .then(function () {
                    $window.R.ready(function () {
                        RdioPlayerFactory.maxVolume();
                        if ($scope.playlist.length) {
                            RdioPlayerFactory.playFromOffset($scope.playlist[0]);
                        }
                    });
                })
                .catch(function (error) {
                    console.log(error);
                });

            // Playlist event handling logic.
            $scope.playlist.$watch(function (playlist_state) {
                console.log(playlist_state);
                // Handle a 'track added to playlist' event.
                if (playlist_state.event.toString() == 'child_added'){
                    // If the track added is the first in the playlist, start playback.
                    if (!playlist_state.prevChild) {
                        var first_track = $scope.playlist.$getRecord(playlist_state.key);
                        $rootScope.tattletale.log('first_in_playlist: True');
                        RdioPlayerFactory.play(first_track);
                    } else {
                        console.log('track added');
                    }
                }
                // Handle a 'track removed from playlist' event, only the first track is ever removed.
                else if (playlist_state.event.toString() === 'child_removed') {
                    // If there are still more tracks on the playlist, play the next one.
                    if ($scope.playlist.length) {
                        var next_track_key = $scope.playlist.$keyAt(0);
                        var next_track = $scope.playlist.$getRecord(next_track_key);
                        $rootScope.tattletale.log('first_in_playlist: False');
                        RdioPlayerFactory.play(next_track);
                    } else {
                        RdioPlayerFactory.last_track_playing = null;
                    }
                }
            });

            // Player event handling logic.
            $window.R.player.on('change:playingTrack', function (playing_track) {
                console.log(playing_track);
                // When a track finishes, remove the track from the playlist
                if (!playing_track) {
                    var last_track_playing = RdioPlayerFactory.last_track_playing;
                    // Check that the following variable exists before comparison
                    if (last_track_playing) {
                        $rootScope.finishedSong = true;
                        $scope.playlist.$remove(last_track_playing);
                    }
                }
            });

            // Initialize search logic.
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

            // When a user leaves the group, mute playback and send client2server logs for that session.
            $scope.$on('$destroy', function () {
                RdioPlayerFactory.mute();
                $rootScope.tattletale.send();
            });

            // In the case that the user closes the window:
            // Remove the user from the currently listening users with a synchronous blocking API call.
            angular.element($window).bind('beforeunload', function () {
                var request = new XMLHttpRequest();
                request.open('DELETE',
                    firebase_group_url + '/listeners/' + $rootScope.current_user.firebase_id + '.json',
                    false);  // `false` makes the request synchronous
                request.send(null);
            });
        }]);