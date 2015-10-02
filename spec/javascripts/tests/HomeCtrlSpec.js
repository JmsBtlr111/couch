'use strict';

describe('Controller: HomeCtrl', function () {
    var $scope, $httpBackend, $rootScope, $controller, $http = null;

    beforeEach(module('app'));

    beforeEach(inject(function (_$rootScope_, _$controller_, _$httpBackend_, _$http_) {
        $rootScope = _$rootScope_;
        $scope = _$rootScope_.$new();
        $controller = _$controller_;
        $httpBackend = _$httpBackend_;
        $http = _$http_;

        $rootScope.current_user = {
            'id': '1',
            'groups': {}
        };

        $httpBackend.when('GET', '/api/user/1').respond({'groups': 'james'});

        spyOn($http, 'get');
        spyOn($http, 'post');

        $controller('HomeCtrl', {
            '$rootScope': $rootScope,
            '$scope': $scope,
            '$http': $http
        });

        $scope.createNewGroup('james');
    }));

    it('should get user data from API', function () {
        //expect($http.get).toHaveBeenCalledWith('/api/user/1');
        $httpBackend.expectGET('/api/user/1');
    });

    it('should store the groups in the current_user', function () {
        expect($rootScope.current_user['groups']).toEqual('james');
    })
});