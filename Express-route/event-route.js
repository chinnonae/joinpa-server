var Event = require('../Models/Event');
var logger = require('../logger');
var UserUtil = require('../Utils/UserUtil');

module.exports.assignRoute = function(app){

  app.post('/event/create', function(req, res, next) {
    var cevent = req.body;
    console.log(cevent);
    Event.create({
      name: cevent.name,
      host: req.user.uid,
      isPrivate: cevent.isPrivate,
      icon: cevent.icon,
      joinedList: [],
      pendingList: [],
      declinedList: [],
      place: JSON.parse(cevent.place),
      date: cevent.date,
      timeStamp: cevent.timeStamp
      }, function(err, event){
        JSON.parse(cevent.inviteList).forEach(function(friend) {
          event.pendingList.push(friend._id);
        });
        event.save(function(err) {
          //handle error
          if(err){

          }
          //send notification
          res.status(200).json({
            message: 'The ' + event.name + ' event has been created'
          });
        });


      }
    );
  }); //end of POST /event/create


  app.get('/event/unfinishedEvent', function(req, res, next) {
    var thisUserId = req.user.uid;

    findEvent({
      $or: [
        { pendingList: thisUserId },
        { joinedList: thisUserId },
        {
          $or: [
            {
              declinedList: thisUserId,
              isPrivate: false
            }
         ]
       },
       { host: thisUserId }
      ],
      date: { $gt: new Date()}
    }, thisUserId, function(err, results) {
        if(err){

        }
        res.status(200).json({
          result: results
        });
      });

  }); //end of GET /event/events


  app.post('/event/invite', function(req, res, next) {
    var invitiation = req.body;

    Event.findOne({ // find the event
      _id: invitation.eventId
    }, function(err, event) {
      event.pendingList.push(invitation.friendId); // add friend to pendingList
      event.save(function(err) {
        if(err){
          sendDbError(res, err);
        }
        //send notification
        res.status(200).json({
          message: 'The invitation has been sent'
        });
      });

    });


  }); //end of POST /event/create


  app.post('/event/join', function(req, res, next) {
    var info = req.body;

    Event.findOne({
      _id: info.eventId
    }, function(err, event) {
      if(removeUserIdFromList(event.pendingList, req.user.uid).length > 0) {

      } else if (!event.isPrivate && removeUserIdFromList(event.declinedList, req.user.uid).length > 0) {

      } else {
        return;
      }
      event.joinedList.push(req.user.uid);
      res.status(200).json({
        message: 'you have joined the event ' + event.name
      });

    });
  }); //end of POST /event/join


  app.post('/event/decline', function(req, res, next) {
    var info = req.body;

    Event.findOne({
      _id: info.eventId
    }, function(err, event) {
      if(err) {
        sendDbError();
      }
      if(removeUserIdFromList(event.pendingList, req.user.uid).length > 0) {

      } else if(removeUserIdFrom(event.joinedList, req.user.uid).length > 0) {

      } else {
        return;
      }
      event.declinedList.push(req.user.uid);
      res.status(200).json({
        message: 'you have declined the event ' + event.name
      });
    }

    );

  }); //end of POST /event/decline


  app.post('/event/edit', function(req, res, next) {
    var info = req.body;
    Event.findOne({
      _id: info.eventId
    }, function(err, event) {
      for(var key in info) {
        if(key != 'eventId') {
          event[key] = info[key];
        }
      }
      event.save(function(err) {
        if(err) {
          //handle error
          return;
        }
        res.status(200).json({
          message: 'The event ' + event.name + ' has been edited.'
        });
      });
    });
  }); //end of POST /event/edit


  app.post('/event/remove', function(req, res, next) {
    var thisUserId = req.user.uid;
    var info = req.body;
    Event.remove({
      _id: info.eventId
    },function(err, event){
      if(err){
        //handle error
        return;
      }
      var toNotify = event.joinedList.concat(event.pendingList, event.declinedList);
      toNotify.forEach(function(user){
        //notify user
      });
      res.status(200).json({
        message: 'The event ' + event.name + ' has been cancel.'
      });
    });
  }); //end of DELETE /event/delete


  app.get('/event/joinedEvent', function(req, res, next) {
    var thisUserId = req.user.uid;
    findEvent({
      $or: [
        { joinedList: thisUserId },
        { host: thisUserId }
      ]
    }, thisUserId, function(err, results) {
      if(err){

      }
      res.status(200).json({
        result: results
      });
    });
  }); //end of GET /event/joinedEvent


  app.get('/event/publicEvent', function(req, res, next) {
    var thisUserId = req.user.uid;
    UserUtil.findOne({ _id: thisUserId }, function(err, user) {
      var beautified = UserUtil.beautify(user);
      var friends = [];
      beautified.friends.forEach(function(friend){
        friends.push(friend._id);
      });
      console.log(friends);
      if(friends.length <= 0) res.status(200).json({
        result: []
      });
      console.log('----------');
      findEvent({ host: { $in: friends }}, thisUserId, function(err, results) {
        console.log(err);
        console.log(results);
        if(err){
          sendDbError(res, err);
        }
        res.status(200).json({
          result: results
        });
      });
    });
  }); //end of GET /event/publicEvent

};

function removeUserIdFromList(list, id){
  for(var i = 0; i < event.pendingList.length; i++) { //if this user is in list
    if(event.pendingList[i] === req.user.uid) {
      return event.pendingList.splice(i,1); // remove this user from list
    }
  }
  return [];
}

function findEvent(query, thisUserId, callback){
  Event.find(query)
    .select('_id name host icon date declinedList pendingList joinedList place')
    .populate({
      path: 'pendingList',
      select: '_id username email avatar'
    })
    .populate({
      path: 'joinedList',
      select: '_id username email avatar'
    })
    .populate({
      path: 'declinedList',
      select: '_id username email avatar'
    })
    .populate({
      path: 'host',
      select: '_id username email avatar'
    })
    .exec(function(err, results) {
      callback(err, results);
    });
}

function sendDbError(res, err){
  logger.error(err);
  res.status(500).json({
    message: 'database error'
  });
}
