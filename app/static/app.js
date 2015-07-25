var application = angular.module('application', ['ui.router', 'firebase']);

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

application.factory('RdioSearchFactory', function ($window, $q) {
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

application.controller('GroupCtrl', ['$scope', '$stateParams', '$window', '$http', '$rootScope', '$firebaseArray', 'RdioSearchFactory',
    function ($scope, $stateParams, $window, $http, $rootScope, $firebaseArray, RdioSearchFactory) {
        var listeners_ref = new Firebase('https://couch.firebaseio.com/group/' + $stateParams.id + '/listeners');
        $scope.listeners = $firebaseArray(listeners_ref);

        var playlist_ref = new Firebase('https://couch.firebaseio.com/group/' + $stateParams.id + '/playlist');
        $scope.playlist = $firebaseArray(playlist_ref);

        $scope.search_results = {};

        $http.post('/api/group/' + $stateParams.id, $rootScope.user);

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
    }]);

application.controller('LoginCtrl', ['$scope', '$window', '$state', '$http',
    function ($scope, $window, $state, $http) {
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

application.controller('PasswordController', function PasswordController($scope) {
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

application.run(['$rootScope', '$state', '$window', '$http',
    function ($rootScope, $state, $window, $http) {
        $rootScope.user = {};

        $rootScope.$on('$stateChangeStart', function (e, to, toParams, from, fromParams) {
            if (to.data && to.data.requireLogin) {
                if (!$window.R.authenticated()) {
                    e.preventDefault();
                    $state.go('login');
                }
            }

            if (from.name == 'group') {
                $http.delete('https://couch.firebaseio.com/group/' + fromParams['id'] + '/listeners/' + $rootScope.user.firebase_id + '.json')
                    .error(function (data) {
                        console.log(data);
                    });
            }

            if (to.name == 'group') {
                var firebase_user = {
                    id: $rootScope.user.id,
                    first_name: $rootScope.user.first_name,
                    last_name: $rootScope.user.last_name
                };
                $http.post('https://couch.firebaseio.com/group/' + toParams['id'] + '/listeners.json', firebase_user)
                    .success(function (data) {
                        $rootScope.user['firebase_id'] = data.name;
                    })
                    .error(function (data) {
                        console.log(data);
                    });
            }
        });
    }]);

