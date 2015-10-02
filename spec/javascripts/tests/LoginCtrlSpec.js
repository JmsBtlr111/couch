'use strict';

describe('Controller: loginCtrl', function () {
    var $scope, $window, $httpBackend, $rootScope, $controller, $http = null;

    beforeEach(module('app'));

    beforeEach(inject(function (_$rootScope_, _$controller_, _$httpBackend_, _$window_, _$http_) {
        $rootScope = _$rootScope_;
        $scope = _$rootScope_.$new();
        $controller = _$controller_;
        $httpBackend = _$httpBackend_;
        $window = _$window_;
        $http = _$http_;

        $window.R = {
            authenticate: function () {
                return true;
            },
            currentUser: {
                'attributes': {
                    'key': 1,
                    'firstName': 'james',
                    'lastName': 'butler',
                    'url': 'www.james.com'
                }
            }
        };

        $controller('LoginCtrl', {
            '$rootScope': $rootScope,
            '$scope': $scope,
            '$window': $window,
            '$http': $http
        });

        spyOn($window.R, 'authenticate');

        $scope.login();
    }));

    it('should call authenticate', function () {
        expect($window.R.authenticate).toHaveBeenCalled();
    });
});