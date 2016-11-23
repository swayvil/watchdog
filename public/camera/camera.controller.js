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
        .controller('CameraController', Controller);

    function Controller(CameraService) {
        var vm = this;
        const limit = 36;
        vm.getDateList = getDateList;
        vm.getCameraList = getCameraList;
        vm.getSnapshots = getSnapshots;
        vm.getSnapshot = getSnapshot;
        vm.loadMore = loadMore;
        vm.snapshot = null;
        var isMoreSnapshotsToLoad = true;

        initController(vm);
        function initController(vm) {
            vm.pageData = {};
            vm.pageData.isInfiniteScrollDisabled = false;
            vm.getCameraList();
            vm.getSnapshots(false, vm.getDateList); // Call datelist after, so list of dates are already loaded in server memory
        }

        function findDateIndex(a, dateSearched) {
            for (var i = 0; i < a.length; i++) {
                if (a[i] == dateSearched) {
                    return i;
                }
            }
            return 0;
        }

        function findCameraIndex(a, cameraSearched) {
            if (cameraSearched == '%')
                return -1;
            for (var i = 0; i < a.length; i++) {
                if (a[i] == cameraSearched) {
                    return i;
                }
            }
            return -1;
        }

        function loadMore() {
            if (!vm.pageData.isInfiniteScrollDisabled) {
                getSnapshots(true);
            }
        }

        function getDateList() {
            CameraService.GetDateList().then(function (dateList) {
                vm.pageData.dateList = dateList;
                vm.pageData.dateSelected = vm.pageData.dateList[0];
            }).catch(function (data, status) {
                console.log(data);
            });
        }

        function getCameraList() {
            CameraService.GetCameraList().then(function (cameraList) {
                vm.pageData.cameraList = cameraList;
                vm.pageData.cameraSelected = 'All';
            }).catch(function (data, status) {
                console.log(data);
            });
        }

        function getSnapshots(isScrolling, callback) {
            vm.pageData.isInfiniteScrollDisabled = true;
            if (!isScrolling) {
                isMoreSnapshotsToLoad = true;
            }
            if (!isMoreSnapshotsToLoad) {
                vm.pageData.isInfiniteScrollDisabled = false;
                return;
            }

            CameraService.GetSnapshots(limit, isScrolling, vm.pageData.dateSelected, vm.pageData.cameraSelected).then(function (snapshots) {
                if (vm.pageData.snapshots == null || !isScrolling) {
                    vm.pageData.snapshots = snapshots.snapshotList;
                }
                else { // scrolling
                    for (var i = 0; i < snapshots.snapshotList.length; i++) {
                        vm.pageData.snapshots.push(snapshots.snapshotList[i]);
                    }
                }
                isMoreSnapshotsToLoad = snapshots.isMoreSnapshotsToLoad;
                vm.pageData.isInfiniteScrollDisabled = false;
                
                if (typeof(callback) == 'function')
                    callback();
            }).catch(function (data, status) {
                console.log(data);
                vm.pageData.isInfiniteScrollDisabled = false;
            });
        }

        function getSnapshot(id) {
            CameraService.GetSnapshot(id)
                .then(function (snapshot) {
                    vm.snapshot = snapshot;
                })
                .catch(function (error) {
                    FlashService.Error(error);
                });
        }
    }
})
();
