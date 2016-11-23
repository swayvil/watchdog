/*--
Copyright (c) 2016 swayvil

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
++*/

(function () {
    'use strict';

    angular
        .module('app')
        .factory('CameraService', Service);

    function Service($http, $q) {
        var service = {};

        service.GetDateList = GetDateList;
        service.GetCameraList = GetCameraList;
        service.GetSnapshots = GetSnapshots;
        service.GetSnapshot = GetSnapshot;

        return service;

        function GetDateList() {
            return $http.get('/camera/datelist').then(handleSuccess, handleError);
        }

        function GetCameraList() {
            return $http.get('/camera/cameralist').then(handleSuccess, handleError);
        }

        function GetSnapshots(limit, isScrolling, date, camera) {
            return $http.get('/camera/snapshots/' + limit + '/' + isScrolling + '/' + date + '/' + camera).then(handleSuccess, handleError);
        }

        function GetSnapshot(id) {
            return $http.get('/camera/snapshot/' + id).then(handleSuccess, handleError);
        }

        // private functions

        function handleSuccess(res) {
            return res.data;
        }

        function handleError(res) {
            return $q.reject(res.data);
        }
    }
})();
