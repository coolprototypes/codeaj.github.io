var SERVICE_ROOT = 'v0.1/';
var myApp = angular.module('myApp', ['ngRoute', 'ngAnimate', 'angularFileUpload']);
// configure our routes
myApp.config(function($routeProvider) {
    $routeProvider
            .when('/', {
                templateUrl: 'templates/notes.html',
                controller: 'NoteController'
            });
});
myApp.directive('onSelect', function($http) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs, ctrl) {
            element.on('click', function() {
                $('.selected').removeClass('selected');
                element.addClass('selected');
            });
        }
    };
});
function showButtons($scope, showArr) {
    var buttons = ['showAddNote', 'showForm', 'showAddTopic', 'showAddSubTopic',
        'showEdit', 'showDelete'];
    for (var n = 0; n < buttons.length; n++) {
        $scope[buttons[n]] = false;
    }
    for (var n = 0; n < showArr.length; n++) {
        $scope[showArr[n]] = true;
    }
}
;
var showHide = function($scope, showArr, hideArr) {
    for (var n = 0; n < showArr.length; n++) {
        $scope[showArr[n]] = true;
    }
    for (var n = 0; n < hideArr.length; n++) {
        $scope[hideArr[n]] = false;
    }
};
var setEmpty = function($scope, setArr) {
    for (var n = 0; n < setArr.length; n++) {
        $scope[setArr[n]] = '';
    }
};
myApp.controller('ParentController', function($scope) {
});
myApp.factory('Data', function() {
    var data = {};
    return data;
});
myApp.factory('WebServiceHandler', function($q, $http) {

    var executeService = function(payload) {
        var deferred = $q.defer();
        $('.please-wait').show();
        $http({
            method: payload[0],
            url: SERVICE_ROOT + payload[1],
            data: payload[2],
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': '*/*',
                'X-Requested-With': 'XMLHttpRequest'
            }
        }).success(function(data, status, headers, config) {
            deferred.resolve({'status': status, 'data': data});
            $('.please-wait').hide();
        }).error(function(data, status, headers, config) {
            deferred.reject({'status': status, 'data': data});
            $('.please-wait').hide();
        });
        return deferred.promise;
    };

    return {
        callService: executeService
    };
});

var NoteController = ['$scope', '$http', '$timeout', '$upload', 'WebServiceHandler', 'Data',
    '$location', function($scope, $http, $timeout, $upload, WebServiceHandler, Data, $location) {

        $scope.atHome = true;
        $scope.showSubjects = true;
        $scope.breadCrumbIndex = 0;
        $scope.selection = [];
        $scope.indexStack = [];
        $scope.img_id = "false";
        $scope.img_name = "false";

        WebServiceHandler.callService(['GET', 'subjects.json', {}]).then(function(response) {
            $scope.inputChanged = [];
            $scope.subjects = response.data.message;
            _.each($scope.subjects, function() {
                $scope.inputChanged.push(false)
            });
        }, function(failureReason) {
            alert(failureReason.data.message);
        });

        $scope.showImage = function(imgName) {
            console.log(imgName);
            $scope.showImg = "true";
            $scope.imageSrc = 'v0.1/' + imgName;
        }

        $scope.createClicked = function() {
            if ($scope.showCreateEdit)
                return;
            $scope.createClick = !$scope.createClick;
            $scope.dataUrl = '';
        };

        $scope.addSubject = function() {
            $scope.editPlaceholder = 'Please enter the subject name.';
            $scope.subjectCreate = true;
            setForCreate();
        };

        $scope.addNote = function() {
            $scope.editPlaceholder = 'Please enter the note text.';
            $scope.addType = 'note';
            setForCreate();
        };

        $scope.addTopic = function() {
            $scope.editPlaceholder = 'Please enter the topic text.';
            $scope.addType = 'topic';
            setForCreate();
        };

        $scope.addSubtopic = function() {
            $scope.editPlaceholder = 'Please enter the subtopic text.';
            $scope.addType = 'subtopic';
            setForCreate();
        };

        var setForCreate = function() {
            $scope.editText = '';
            $scope.showCreateEdit = !$scope.showCreateEdit;
            $scope.createClick = !$scope.createClick;
            $scope.createInProgress = true;
        };

        $scope.deleteDialog = function() {
            if ($('.selected').length === 0 || $scope.showCreateEdit)
                return;
            $scope.deleteForm = !$scope.deleteForm;
        };

        $scope.makeSelection = function(selection) {
            $scope.selection = selection;
        };

        $scope.updateCurrent = function() {
            if ($('.selected').length === 0 || $scope.showCreateEdit)
                return;
            $scope.dataUrl = '';
            switch ($scope.breadCrumbIndex) {
                case 0 :
                    $scope.editText = $scope.subjects[$scope.selection[1]].name;
                    $scope.showCreateEdit = true;
                    $scope.createInProgress = false;
                    break;
                case 1:
                    if ($scope.selection[0] === 'note') {
                        $scope.editText = $scope.notes[$scope.selection[1]].text;
                        $scope.img_id = "" + $scope.notes[$scope.selection[1]].img_ref;
                        $scope.showCreateEdit = true;
                        $scope.createInProgress = false;
                    } else {
                        $scope.editText = $scope.topics[$scope.selection[1]].topic.text;
                        $scope.img_id = "" + $scope.topics[$scope.selection[1]].topic.img_ref;
                        $scope.showCreateEdit = true;
                        $scope.createInProgress = false;
                    }
                    break;
                case 2:
                    if ($scope.selection[0] === 'note') {
                        $scope.editText = $scope.topicNotes[$scope.selection[1]].text;
                        $scope.img_id = "" + $scope.topicNotes[$scope.selection[1]].img_ref;
                        $scope.showCreateEdit = true;
                        $scope.createInProgress = false;
                    } else {
                        $scope.editText = $scope.subtopics[$scope.selection[1]].subtopic.text;
                        $scope.img_id = "" + $scope.subtopics[$scope.selection[1]].subtopic.img_ref;
                        $scope.showCreateEdit = true;
                        $scope.createInProgress = false;
                    }
                    break;
                case 3:
                    $scope.editText = $scope.noteData.topics[$scope.indexStack[1].parentIndex].
                            subtopics[$scope.indexStack[2].parentIndex].
                            notes[$scope.selection[1]].text;
                    $scope.img_id = "" + $scope.noteData.topics[$scope.indexStack[1].parentIndex].
                            subtopics[$scope.indexStack[2].parentIndex].
                            notes[$scope.selection[1]].img_ref;
                    $scope.showCreateEdit = true;
                    $scope.createInProgress = false;
                    break;
            }
        };

        $scope.moveBack = function(index) {
            switch (index) {
                case 0 :
                    $('.selected').removeClass('selected');
                    $('.bread-crumb-container span').removeClass('activeLink').eq(0).
                            addClass('activeLink');
                    showHide($scope, ['atHome', 'showSubjects'],
                            ['showTopics', 'showSubtopics', 'showNotes']);
                    setEmpty($scope, ['selectedSubject', 'selectedTopic', 'selectedSubtopic']);
                    $scope.breadCrumbIndex = 0;
                    $scope.indexStack = [];
                    break;
                case 1 :
                    $('.selected').removeClass('selected');
                    $('.bread-crumb-container span').removeClass('activeLink').eq(0).
                            addClass('activeLink');
                    showHide($scope, ['showTopics'],
                            ['atHome', 'showSubjects', 'showSubtopics', 'showNotes']);
                    setEmpty($scope, ['selectedTopic', 'selectedSubtopic']);
                    $scope.breadCrumbIndex = 1;
                    $scope.indexStack = _.first($scope.indexStack, 1);
                    break;
                case 2 :
                    $('.selected').removeClass('selected');
                    $('.bread-crumb-container span').removeClass('activeLink').eq(0).
                            addClass('activeLink');
                    showHide($scope, ['showSubtopics'],
                            ['showTopics', 'atHome', 'showSubjects', 'showNotes']);
                    setEmpty($scope, ['selectedSubtopic']);
                    $scope.breadCrumbIndex = 2;
                    $scope.indexStack = _.first($scope.indexStack, 2);
                    break;
            }
        };
        var clickIndex = 0;
        $(document).on('keyup', function(event) {
            switch (event.which) {
                case 37: // left
                case 27: // escape
                    if ($scope.breadCrumbIndex === 0 || $scope.showCreateEdit)
                        return;
                    $scope.$apply(function() {
                        $scope.moveBack($scope.breadCrumbIndex - 1);
                    });
                    break;
                case 39: // right
                case 32: // spacebar
                    if ($('.selected').length === 0 || $scope.showCreateEdit)
                        return;
                    $scope.$apply(function() {
                        $scope.moveForward();
                    });
                    break;
                case 38: // up arrow
                    if ($scope.showCreateEdit)
                        return;
                    switch ($scope.breadCrumbIndex) {
                        case 0:
                            clickIndex = 0 === clickIndex ? $('.subject-list .select-rows').length
                                    - 1 : --clickIndex;
                            $('.subject-list .select-rows').eq(clickIndex).click();
                            break;
                        case 1:
                            clickIndex = 0 === clickIndex ? $('.topic-container .select-rows').
                                    length - 1 : --clickIndex;
                            $('.topic-container .select-rows').eq(clickIndex).click();
                            break;
                        case 2:
                            clickIndex = 0 === clickIndex ? $('.subtopic-container .select-rows').
                                    length - 1 : --clickIndex;
                            $('.subtopic-container .select-rows').eq(clickIndex).click();
                            break;
                    }
                    break;
                case 40: // down arrow
                    switch ($scope.breadCrumbIndex) {
                        case 0:
                            if ($('.subject-list .selected').length === 0)
                                clickIndex = -1;
                            clickIndex = $('.subject-list .select-rows').length === clickIndex + 1
                                    ? 0 : ++clickIndex;
                            $('.subject-list .select-rows').eq(clickIndex).click();
                            break;
                        case 1:
                            if ($('.topic-container .selected').length === 0)
                                clickIndex = -1;
                            clickIndex = $('.topic-container .select-rows').length ===
                                    clickIndex + 1 ? 0 : ++clickIndex;
                            $('.topic-container .select-rows').eq(clickIndex).click();
                            break;
                        case 2:
                            if ($('.subtopic-container .selected').length === 0)
                                clickIndex = -1;
                            clickIndex = $('.subtopic-container .select-rows').length ===
                                    clickIndex + 1 ? 0 : ++clickIndex;
                            $('.subtopic-container .select-rows').eq(clickIndex).click();
                            break;
                    }
            }
        });
        $(document).ready(function() {
            $(document).swipe({
                swipeLeft: function(event, direction, distance, duration, fingerCount) {
                    if ($scope.breadCrumbIndex === 0)
                        return;
                    $scope.$apply(function() {
                        $scope.moveBack($scope.breadCrumbIndex - 1);
                    });
                },
                swipeRight: function(event, direction, distance, duration, fingerCount) {
                    if ($('.selected').length === 0 || $scope.showCreateEdit)
                        return;
                    $scope.$apply(function() {
                        $scope.moveForward();
                    });
                }
            });
        });


        $scope.moveForward = function() {
            if ($('.selected').length === 0 || $scope.showCreateEdit)
                return;
            switch ($scope.breadCrumbIndex) {
                case 0 :
                    var subjectId = $scope.subjects[$scope.selection[1]].id;
                    var payload = ['GET', 'notes_' + subjectId + '.json', JSON.stringify({})];
                    WebServiceHandler.callService(payload).then(function(response) {
                        $scope.noteData = response.data.message;
                        $scope.selectedSubject = $scope.subjects[$scope.selection[1]].name;
                        $scope.notes = $scope.noteData.notes;
                        $scope.topics = $scope.noteData.topics;
                        $scope.atHome = false;
                        $scope.showSubjects = false;
                        $scope.showTopics = true;
                        $('.selected').removeClass('selected');
                        $('.bread-crumb-container span').removeClass('activeLink').eq(1).
                                addClass('activeLink');
                        $scope.indexStack.push({parentIndex: $scope.selection[1],
                            parentId: subjectId});
                        $scope.breadCrumbIndex = 1;
                    }, function(failureReason) {
                        alert(failureReason.data.message);
                    });
                    break;
                case 1:
                    if ($scope.selection[0] === 'note')
                        return;
                    $scope.selectedTopicId = $scope.topics[$scope.selection[1]].topic.id;
                    $scope.selectedTopic = $scope.topics[$scope.selection[1]].topic.text;
                    $scope.topicNotes = $scope.topics[$scope.selection[1]].notes;
                    $scope.subtopics = $scope.topics[$scope.selection[1]].subtopics;
                    $scope.atHome = false;
                    $scope.showSubjects = false;
                    $scope.showTopics = false;
                    $scope.showSubtopics = true;
                    $('.selected').removeClass('selected');
                    $('.bread-crumb-container span').removeClass('activeLink').eq(2).
                            addClass('activeLink');
                    $scope.indexStack.push({parentIndex: $scope.selection[1],
                        parentId: $scope.selectedTopicId});
                    $scope.breadCrumbIndex = 2;
                    break;
                case 2:
                    if ($scope.selection[0] === 'note')
                        return;
                    $scope.selectedsubTopicId =
                            $scope.topics[$scope.indexStack[1].parentIndex].
                            subtopics[$scope.selection[1]].subtopic.id;
                    $scope.selectedSubtopic = $scope.topics[$scope.indexStack[1].parentIndex].
                            subtopics[$scope.selection[1]].subtopic.text;
                    $scope.subtopicNotes = $scope.topics[$scope.indexStack[1].parentIndex].
                            subtopics[$scope.selection[1]].notes;
                    $scope.atHome = false;
                    $scope.showSubjects = false;
                    $scope.showTopics = false;
                    $scope.showSubtopics = false;
                    $scope.showNotes = true;
                    $('.selected').removeClass('selected');
                    $('.bread-crumb-container span').removeClass('activeLink').eq(3).
                            addClass('activeLink');
                    $scope.indexStack.push({parentIndex: $scope.selection[1],
                        parentId: $scope.selectedsubTopicId});
                    $scope.breadCrumbIndex = 3;
                    break;
            }
        };

        $scope.create = function() {
            switch ($scope.breadCrumbIndex) {
                case 0 :
                    var payload = ['POST', 'subject', JSON.stringify({"name": $scope.editText})];
                    WebServiceHandler.callService(payload).then(function(response) {
                        $scope.subjects.push(response.data.message);
                        $scope.subjectCreate = false;
                        $scope.showCreateEdit = !$scope.showCreateEdit;
                    }, function(failureReason) {
                        alert(failureReason.data.message);
                    });
                    break;
                case 1:
                    switch ($scope.addType) {
                        case 'note' :
                            var url = 'note/' + $scope.indexStack[0].parentId;
                            input = {"text": $scope.editText,
                                "parent_type": "subject",
                                "parent_id": $scope.indexStack[0].parentId,
                                "img_id": $scope.img_id};
                            var payload = ['POST', url, JSON.stringify(input)];
                            WebServiceHandler.callService(payload).then(function(response) {
                                $scope.noteData.notes.push(response.data.message);
                                $scope.showCreateEdit = !$scope.showCreateEdit;
                            }, function(failureReason) {
                                alert(failureReason.data.message);
                            });
                            break;
                        case 'topic' :
                            var url = 'topic/' + $scope.indexStack[0].parentId;
                            input = {"text": $scope.editText,
                                "img_id": $scope.img_id};
                            var payload = ['POST', url, JSON.stringify(input)];
                            WebServiceHandler.callService(payload).then(function(response) {
                                $scope.noteData.topics.push({"topic": response.data.message,
                                    "notes": [], "subtopics": []});
                                $scope.showCreateEdit = !$scope.showCreateEdit;
                            }, function(failureReason) {
                                alert(failureReason.data.message);
                            });
                            break;
                    }
                    break;
                case 2:
                    switch ($scope.addType) {
                        case 'note' :
                            var url = 'note/' + $scope.indexStack[0].parentId;
                            input = {"text": $scope.editText,
                                "parent_type": "topic",
                                "parent_id": $scope.indexStack[1].parentId,
                                "img_id": $scope.img_id};
                            var payload = ['POST', url, JSON.stringify(input)];
                            WebServiceHandler.callService(payload).then(function(response) {
                                $scope.noteData.topics[$scope.indexStack[1].parentIndex].
                                        notes.push(response.data.message);
                                $scope.showCreateEdit = !$scope.showCreateEdit;
                            }, function(failureReason) {
                                alert(failureReason.data.message);
                            });
                            break;
                        case 'subtopic' :
                            var url = 'subtopic/' + $scope.indexStack[0].parentId + '/' +
                                    $scope.indexStack[1].parentId;
                            input = {"text": $scope.editText,
                                "img_id": $scope.img_id};
                            var payload = ['POST', url, JSON.stringify(input)];
                            WebServiceHandler.callService(payload).then(function(response) {
                                $scope.noteData.topics[$scope.indexStack[1].parentIndex].subtopics.
                                        push({"subtopic": response.data.message, "notes": []});
                                $scope.showCreateEdit = !$scope.showCreateEdit;
                            }, function(failureReason) {
                                alert(failureReason.data.message);
                            });
                            break;
                    }
                    break;
                case 3:
                    var url = 'note/' + $scope.indexStack[0].parentId;
                    input = {"text": $scope.editText,
                        "parent_type": "subtopic",
                        "parent_id": $scope.indexStack[2].parentId,
                        "img_id": $scope.img_id};
                    var payload = ['POST', url, JSON.stringify(input)];
                    WebServiceHandler.callService(payload).then(function(response) {
                        $scope.noteData.topics[$scope.indexStack[1].parentIndex].
                                subtopics[$scope.indexStack[2].parentIndex].notes.
                                push(response.data.message);
                        $scope.showCreateEdit = !$scope.showCreateEdit;
                    }, function(failureReason) {
                        alert(failureReason.data.message);
                    });
                    break;
            }

        };

        $scope.update = function() {
            index = $scope.selection[1];
            switch ($scope.breadCrumbIndex) {
                case 0 :
                    var subjectObj = {"name": $scope.editText};
                    var payload = ['PUT', 'subject/' + $scope.subjects[index].id, JSON.stringify(subjectObj)];
                    WebServiceHandler.callService(payload).then(function() {
                        $scope.subjects[index].name = $scope.editText;
                        $scope.showCreateEdit = false;
                    }, function(failureReason) {
                        alert(failureReason.data.message);
                    });
                    break;
                case 1:
                    switch ($scope.selection[0]) {
                        case 'note' :
                            var url = 'note/' + $scope.indexStack[0].parentId + '/' +
                                    $scope.notes[$scope.selection[1]].id;
                            input = {"text": $scope.editText,
                                "parent_type": "subject",
                                "parent_id": $scope.indexStack[0].parentId,
                                "img_id": $scope.img_id};
                            var payload = ['PUT', url, JSON.stringify(input)];
                            WebServiceHandler.callService(payload).then(function(response) {
                                $scope.noteData.notes[$scope.selection[1]] = response.data.message;
                                $scope.showCreateEdit = !$scope.showCreateEdit;
                            }, function(failureReason) {
                                alert(failureReason.data.message);
                            });
                            break;
                        case 'topic' :
                            var url = 'topic/' + $scope.indexStack[0].parentId + '/' +
                                    $scope.topics[$scope.selection[1]].topic.id;
                            input = {"text": $scope.editText,
                                "img_id": $scope.img_id};
                            var payload = ['PUT', url, JSON.stringify(input)];
                            WebServiceHandler.callService(payload).then(function(response) {
                                $scope.noteData.topics[$scope.selection[1]].topic
                                        = response.data.message;
                                $scope.showCreateEdit = !$scope.showCreateEdit;
                            }, function(failureReason) {
                                alert(failureReason.data.message);
                            });
                            break;
                    }
                    break;
                case 2:
                    switch ($scope.selection[0]) {
                        case 'note' :
                            var url = 'note/' + $scope.indexStack[0].parentId + '/' +
                                    $scope.topicNotes[$scope.selection[1]].id;
                            input = {"text": $scope.editText,
                                "parent_type": "topic",
                                "parent_id": $scope.indexStack[1].parentId,
                                "img_id": $scope.img_id};
                            var payload = ['PUT', url, JSON.stringify(input)];
                            WebServiceHandler.callService(payload).then(function(response) {
                                $scope.noteData.topics[$scope.indexStack[0].parentIndex]
                                        .notes[$scope.selection[1]] = response.data.message;
                                $scope.showCreateEdit = !$scope.showCreateEdit;
                            }, function(failureReason) {
                                alert(failureReason.data.message);
                            });
                            break;
                        case 'subtopic' :
                            var url = 'subtopic/' + $scope.indexStack[0].parentId + '/' +
                                    $scope.indexStack[1].parentId + '/' +
                                    $scope.subtopics[$scope.selection[1]].subtopic.id;
                            input = {"text": $scope.editText,
                                "img_id": $scope.img_id};
                            var payload = ['PUT', url, JSON.stringify(input)];
                            WebServiceHandler.callService(payload).then(function(response) {
                                $scope.noteData.topics[$scope.indexStack[1].parentIndex]
                                        .subtopics[$scope.selection[1]].subtopic
                                        = response.data.message;
                                $scope.showCreateEdit = !$scope.showCreateEdit;
                            }, function(failureReason) {
                                alert(failureReason.data.message);
                            });
                            break;
                    }
                    break;
                case 3:
                    var url = 'note/' + $scope.indexStack[0].parentId + '/' +
                            $scope.subtopicNotes[$scope.selection[1]].id;
                    input = {"text": $scope.editText,
                        "parent_type": "subtopic",
                        "parent_id": $scope.indexStack[2].parentId,
                        "img_id": $scope.img_id};
                    var payload = ['PUT', url, JSON.stringify(input)];
                    WebServiceHandler.callService(payload).then(function(response) {
                        $scope.noteData.topics[$scope.indexStack[1].parentIndex].
                                subtopics[$scope.indexStack[2].parentIndex].notes
                                [$scope.selection[1]] = response.data.message;
                        $scope.showCreateEdit = !$scope.showCreateEdit;
                    }, function(failureReason) {
                        alert(failureReason.data.message);
                    });
                    break;
            }
        };

        $scope.delete = function(index) {
            index = $scope.selection[1];
            switch ($scope.breadCrumbIndex) {
                case 0 :
                    var payload = ['DELETE', 'subject/' + $scope.subjects[index].id, {}];
                    WebServiceHandler.callService(payload).then(function() {
                        $scope.subjects.splice(index, 1);
                        $scope.deleteForm = !$scope.deleteForm;
                    }, function(failureReason) {
                        alert(JSON.stringify(failureReason.data.message));
                    });
                    break;
                case 1:
                    switch ($scope.selection[0]) {
                        case 'note' :
                            var url = 'note/' + $scope.indexStack[0].parentId + '/' +
                                    $scope.indexStack[0].parentId + '/' +
                                    $scope.notes[$scope.selection[1]].id;
                            var payload = ['DELETE', url, JSON.stringify({})];
                            WebServiceHandler.callService(payload).then(function(response) {
                                $scope.noteData.notes.splice($scope.selection[1], 1);
                                $scope.deleteForm = false;
                            }, function(failureReason) {
                                alert(failureReason.data.message);
                            });
                            break;
                        case 'topic' :
                            var url = 'topic/' + $scope.indexStack[0].parentId + '/' +
                                    $scope.topics[$scope.selection[1]].topic.id;
                            var payload = ['DELETE', url, JSON.stringify({})];
                            WebServiceHandler.callService(payload).then(function(response) {
                                $scope.noteData.topics.splice($scope.selection[1], 1);
                                $scope.deleteForm = false;
                            }, function(failureReason) {
                                alert(failureReason.data.message);
                            });
                            break;
                    }
                    break;
                case 2:
                    switch ($scope.selection[0]) {
                        case 'note' :
                            var url = 'note/' + $scope.indexStack[0].parentId + '/' +
                                    $scope.indexStack[1].parentId + '/' +
                                    $scope.topicNotes[$scope.selection[1]].id;
                            var payload = ['DELETE', url, JSON.stringify({})];
                            WebServiceHandler.callService(payload).then(function(response) {
                                $scope.noteData.topics[$scope.indexStack[1].parentIndex].
                                        notes.splice($scope.selection[1], 1);
                                $scope.deleteForm = false;
                            }, function(failureReason) {
                                alert(failureReason.data.message);
                            });
                            break;
                        case 'subtopic' :
                            var url = 'subtopic/' + $scope.indexStack[0].parentId + '/' +
                                    $scope.topics[$scope.indexStack[1].parentIndex].topic.id + '/' +
                                    $scope.topics[$scope.indexStack[1].parentIndex].
                                    subtopics[$scope.selection[1]].subtopic.id;
                            var payload = ['DELETE', url, JSON.stringify({})];
                            WebServiceHandler.callService(payload).then(function(response) {
                                $scope.topics[$scope.indexStack[1].parentIndex].subtopics.
                                        splice($scope.selection[1], 1);
                                $scope.deleteForm = false;
                            }, function(failureReason) {
                                alert(failureReason.data.message);
                            });
                            break;
                    }
                    break;
                case 3:
                case 'note' :
                    var url = 'note/' + $scope.indexStack[0].parentId + '/' +
                            $scope.indexStack[2].parentId + '/' +
                            $scope.subtopicNotes[$scope.selection[1]].id;
                    var payload = ['DELETE', url, JSON.stringify({})];
                    WebServiceHandler.callService(payload).then(function(response) {
                        $scope.noteData.topics[$scope.indexStack[1].parentIndex].
                                subtopics[$scope.indexStack[2].parentIndex].notes.
                                splice($scope.selection[1], 1);
                        $scope.deleteForm = false;
                    }, function(failureReason) {
                        alert(failureReason.data.message);
                    });
                    break;
            }

        };

        $scope.fileReaderSupported = window.FileReader != null;
        $scope.uploadRightAway = true;
        $scope.onFileSelect = function($files) {
            $scope.selectedFiles = [];
            $scope.progress = [];
            if ($scope.upload && $scope.upload.length > 0) {
                for (var i = 0; i < $scope.upload.length; i++) {
                    if ($scope.upload[i] != null) {
                        $scope.upload[i].abort();
                    }
                }
            }
            $scope.upload = [];
            $scope.uploadResult = [];
            $scope.selectedFiles = $files;
            $scope.dataUrl = [];
            for (var i = 0; i < $files.length; i++) {
                var $file = $files[i];
                if (window.FileReader && $file.type.indexOf('image') > -1) {
                    var fileReader = new FileReader();
                    fileReader.readAsDataURL($files[i]);
                    var loadFile = function(fileReader, index) {
                        fileReader.onload = function(e) {
                            $timeout(function() {
                                $scope.dataUrl = e.target.result;
                            });
                        }
                    }(fileReader, i);
                }
                $scope.progress[i] = -1;
                if ($scope.uploadRightAway) {
                    $scope.start(i);
                }
            }
        };

        $scope.start = function(index) {
            $scope.progress[index] = 0;
            $scope.errorMsg = null;
            $scope.upload[index] = $upload.upload({
                url: 'v0.1/uploadFile',
                method: 'POST',
                headers: {'my-header': 'my-header-value'},
                data: {
                    myModel: $scope.myModel
                },
                file: $scope.selectedFiles[index],
                fileFormDataName: 'myFile'
            }).then(function(response) {
                $scope.img_id = response.data.message.id;
                $scope.img_name = response.data.message.url;
            }, function(response) {
                if (response.status > 0)
                    $scope.errorMsg = response.status + ': ' + response.data;
            }, function(evt) {
                // Math.min is to fix IE which reports 200% sometimes
                $scope.progress[index] = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
            });
        };
    }];
