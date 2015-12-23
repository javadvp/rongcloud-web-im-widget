/// <reference path="../../../typings/tsd.d.ts"/>

var conversationController = angular.module("rongWebimWidget.conversationController", ["rongWebimWidget.conversationServer"]);

conversationController.controller("conversationController", ["$scope", "conversationServer",
    function($scope: any, conversationServer: ConversationServer) {

        function adjustScrollbars() {
            setTimeout(function() {
                var ele = document.getElementById("Messages");
                if (!ele)
                    return;
                ele.scrollTop = ele.scrollHeight;
            }, 0);
        }



        $scope.currentConversation = <WidgetModule.Conversation>{
            title: "",
            targetId: "",
            targetType: ""
        }

        $scope.messageList = [];

        $scope.messageContent = "";

        conversationServer.onConversationChangged = function(conversation: WidgetModule.Conversation) {

            conversationServer.current.title = conversation.title;
            conversationServer.current.targetId = conversation.targetId;
            conversationServer.current.targetType = conversation.targetType;

            $scope.currentConversation.title = conversation.title;
            $scope.currentConversation.targetId = conversation.targetId;
            $scope.currentConversation.targetType = conversation.targetType;

            //TODO:获取历史消息
            //
            $scope.messageList.splice(0, $scope.messageList.length);

            

            RongIMLib.RongIMClient.getInstance().getHistoryMessages(+conversation.targetType, conversation.targetId, null, 5, {
                onSuccess: function(list, has) {
                    for (let i = 0; i < list.length; i++) {
                        $scope.messageList.push(WidgetModule.Message.convert(list[i]));
                    }
                    adjustScrollbars();
                    $scope.$apply();
                },
                onError: function() {

                }
            });

        }

        conversationServer.onReceivedMessage = function(msg: WidgetModule.Message) {
            console.log(msg);
            if (msg.targetId === $scope.currentConversation.targetId) {
                $scope.messageList.push(WidgetModule.Message.convert(msg));
                adjustScrollbars();
                $scope.$apply();
            }
        }

        function packDisplaySendMessage(msg: RongIMLib.MessageContent, messageType: string) {
            var ret = new RongIMLib.Message();

            ret.content = msg;

            ret.conversationType = $scope.currentConversation.targetType;
            ret.targetId = $scope.currentConversation.targetId;
            ret.senderUserId = conversationServer.loginUser.id;

            ret.messageDirection = RongIMLib.MessageDirection.SEND;
            ret.sentTime = (new Date()).getTime();
            ret.messageType = messageType;

            return ret;
        }



        $scope.send = function() {
            console.log($scope.currentConversation, conversationServer.loginUser);

            var msg = RongIMLib.TextMessage.obtain($scope.messageContent);
            var userinfo = new RongIMLib.UserInfo();
            userinfo.userId = conversationServer.loginUser.id;
            userinfo.name = conversationServer.loginUser.name;
            userinfo.portraitUri = conversationServer.loginUser.portraitUri;
            msg.userInfo = userinfo;

            RongIMLib.RongIMClient.getInstance().sendMessage(+$scope.currentConversation.targetType, $scope.currentConversation.targetId, msg, null, {
                onSuccess: function(retMessage: RongIMLib.Message) {
                    console.log("send success");
                },
                onError: function() {

                }
            });

            var content = packDisplaySendMessage(msg, WidgetModule.MessageType.TextMessage);
            $scope.messageList.push(WidgetModule.Message.convert(content));

            adjustScrollbars();
            $scope.messageContent = "";
            // $scope.$apply();
        }


    }]);