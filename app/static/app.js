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

app.controller('GroupCtrl', ['$scope', '$stateParams', '$window', '$http', '$rootScope', '$firebaseArray', '$firebaseObject', 'RdioSearchFactory',
    function ($scope, $stateParams, $window, $http, $rootScope, $firebaseArray, $firebaseObject, RdioSearchFactory) {
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

        var now_playing_ref = new Firebase('https://couch.firebaseio.com/group/' + $stateParams.id + '/now_playing');
        var now_playing = $firebaseObject(now_playing_ref);
        now_playing.$bindTo($scope, 'now_playing');

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

                    $rootScope.current_user = user;
                    $http.post('/api/user', user);
                    $state.go('home');
                } else {
                    $state.go('login');
                }
            });
        };
    }]);

app.controller('PasswordController', function PasswordController($scope) {
  $scope.password = '';
  $scope.grade = function() {
    var size = $scope.password.length;
    if (size > 8) {
      $scope.strength = 'strong';
    } else if (size > 3) {
      $scope.strength = 'medium';
    } else {
      $scope.strength = 'weak';
    }
  };
});

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

