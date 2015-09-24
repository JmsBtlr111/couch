/**
 * Created by hugobateman on 25/07/15.
 */
//
//describe('PasswordController', function () {
//    beforeEach(module('application'));
//
//    var $controller;
//
//    beforeEach(inject(function (_$controller_) {
//        // The injector unwraps the underscores (_) from around the parameter names when matching
//        $controller = _$controller_;
//    }));
//
//    describe('$scope.grade', function () {
//        it('sets the strength to "strong" if the password length is >8 chars', function () {
//            var $scope = {};
//            var controller = $controller('PasswordController', {$scope: $scope});
//            $scope.password = 'longerthaneightchars';
//            $scope.grade();
//            expect($scope.strength).toEqual('strong');
//        });
//    });
//});

describe('LoginCtrl', function () {
    beforeEach(module('app'));

    var $httpBackend, $scope, $window, $state, $rootScope, createController, authRequestHandler;

    beforeEach(inject(function ($injector) {
        $httpBackend = $injector.get('$httpBackend');

        //authRequestHandler = $httpBackend.when('POST', '/api/user')
        //    .respond({userId: 'userX'}, {'A-Token': 'xxx'});

        authRequestHandler = $httpBackend.when('GET', 'login_view/login_view.html')
            .respond({userId: 'userX'}, {'A-Token': 'xxx'});

        $scope = $injector.get('$scope');
        $state = $injector.get('$state');
        $window = $injector.get('$window');
        $rootScope = $injector.get('$rootScope');

        console.log(module)

        var $controller = $injector.get('$controller');

        createController = function () {
            return $controller('LoginCtrl', {
                '$scope': $scope,
                '$window': $window,
                '$state': $state,
                '$http': $httpBackend,
                '$rootScope': $rootScope
            });
        };
    }));

    it('Login test', function () {
        $httpBackend.expectGET('login_view/login_view.html');
        var controller = createController;
        //controller.$scope.login
        console.log(createController());
        $httpBackend.flush()
    })
});


//describe('HomeCtrl', function () {
//    beforeEach(module('application'));
//
//    var $httpBackend, $scope, $window, $rootScope, createController;
//
//    beforeEach(inject(function ($injector) {
//        $httpBackend = $injector.get('$httpBackend');
//
//        authRequestHandler = $httpBackend.when('GET', '/api/user')
//            .respond({userId: 'userX'}, {'A-Token': 'xxx'});
//
//        $scope = _$scope_;
//        $window = _$window_;
//        $rootScope = _$rootScope_;
//
//        var $controller = _$controller_;
//
//        createController = function () {
//            return $controller('HomeCtrl', {
//                '$scope': $scope,
//                '$window': $window,
//                '$http': $httpBackend,
//                '$rootScope': $rootScope
//            });
//        };
//    }));
//});