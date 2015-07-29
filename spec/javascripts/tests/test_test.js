/**
 * Created by hugobateman on 25/07/15.
 */
//
describe('PasswordController', function () {
    beforeEach(module('application'));

    var $controller;

    beforeEach(inject(function (_$controller_) {
        // The injector unwraps the underscores (_) from around the parameter names when matching
        $controller = _$controller_;
    }));

    describe('$scope.grade', function () {
        it('sets the strength to "strong" if the password length is >8 chars', function () {
            var $scope = {};
            var controller = $controller('PasswordController', {$scope: $scope});
            $scope.password = 'longerthaneightchars';
            $scope.grade();
            expect($scope.strength).toEqual('strong');
        });
    });
});

describe('LoginCtrl', function () {
    beforeEach(module('application'));

    var $httpBackend, $scope, $window, $state, createController, authRequestHandler;

    beforeEach(inject(function ($injector) {
        // Set up the mock http service responses
        $httpBackend = $injector.get('$httpBackend');

        // backend definition common for all tests
        authRequestHandler = $httpBackend.when('POST', '/api/user')
            .respond({userId: 'userX'}, {'A-Token': 'xxx'});

        // Get hold of a scope (i.e. the root scope)
        $scope = $injector.get('$scope');

        $state = $injector.get('$state');

        // The $controller service is used to create instances of controllers
        var $controller = $injector.get('$controller');

        $window = $injector.get('$window');

        createController = function () {
            return $controller('LoginCtrl', {
                '$scope': $scope,
                '$window': $window,
                '$state': $state,
                '$http': $httpBackend
            });
        };
    }));

    it('Login test', function () {
        $httpBackend.expectPOST('/api/user');
        var controller = createController;
        $window.R = new Object('R Object');
        $window.R.currentUser = {
            'key': 'key_val',
            'firstName': 'firstName_val',
            'lastName': 'lastName_val',
            'icon': 'icon_val',
            'url': 'url_val'
        };
        $scope.login();
        $httpBackend.flush()
    })
});
