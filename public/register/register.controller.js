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
        .controller('RegisterController', Controller);

    // UserService and FlashService are two factories
    function Controller($window, UserService, FlashService) {
        var vm = this; //Same name than controllerAs in app.js

        vm.user = null;
        vm.register = register;

        //initController();
        //function initController() {
        //    // get current user
        //    UserService.GetCurrent().then(function (user) {
        //        vm.user = user;
        //    });
        //}

        function register() {
            UserService.Register(vm.user)
                .then(function (response) {
                    if (response != null && response.error != null) {
                        FlashService.Error(response.error);
                    } else {
                        vm.user = null;
                        FlashService.Success('User added');
                    }
                })
                .catch(function (error) {
                    FlashService.Error(error);
                });
        }
    }
})();