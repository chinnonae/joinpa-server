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
        if(err){
          sendDbError();
          return;
        }
        JSON.parse(cevent.inviteList).forEach(function(friend) {
          event.pendingList.push(friend._id);
        });
        event.save(function(err) {
          //handle error
          if(err){
            sendDbError();
            return;
          }
          //send notification
          res.status(200).json({
            message: 'The ' + event.name + ' event has been created'
          });
        });


      }
    );
  }); //end of POST /event/create


  app.get('/event/invitedEvent', function(req, res, next) {
    var thisUserId = req.user.uid;

    findEvent({
      pendingList: thisUserId,
      date: { $gt: new Date()}
    }, function(err, results) {
        if(err){
          sendDbError();
          return;
        }
        res.status(200).json({
          result: results
        });
      });

  }); //end of GET /event/events


  app.post('/event/invite', function(req, res, next) {
    var invitation = req.body;

    Event.findOne({ // find the event
      _id: invitation.eventId
    }, function(err, event) {
      event.pendingList.push(invitation.friendId); // add friend to pendingList
      event.save(function(err) {
        if(err){
          sendDbError(res, err);
          return;
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
      event.save(function(err) {
        res.status(200).json({
          message: 'you have joined the event ' + event.name
        });
      });


    });
  }); //end of POST /event/join


  app.post('/event/decline', function(req, res, next) {
    var info = req.body;
    console.log('0');
    Event.findOne({
      _id: info.eventId
    }, function(err, event) {
      console.log(err);
      console.log(event);
      if(err) {
        sendDbError();
        return;
      }
      if(removeUserIdFromList(event.pendingList, req.user.uid).length > 0) {
        console.log('1');
      } else if(removeUserIdFromList(event.joinedList, req.user.uid).length > 0) {
        console.log('2');
      } else {
        console.log('3');
        return;
      }
      event.declinedList.push(req.user.uid);
      event.save(function(err) {
        if(err){

        }
        res.status(200).json({
          message: 'you have declined the event ' + event.name
        });
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
          sendDbError();
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
        sendDbError();
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
  }); //end of POST /event/remove


  app.get('/event/joinedEvent', function(req, res, next) {
    var thisUserId = req.user.uid;
    findEvent({
      $or: [
        { joinedList: thisUserId },
        { host: thisUserId }
      ],
      date: { $gt: new Date() }
    }, function(err, results) {
      if(err){
        sendDbError();
        return;
      }
      console.log(results);
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
      findEvent({
          host: { $in: friends },
          date: { $gt: new Date() }
        }, function(err, results) {
        if(err){
          sendDbError(res, err);
          return;
        }
        res.status(200).json({
          result: results
        });
      });
    });
  }); //end of GET /event/publicEvent

};

function removeUserIdFromList(list, id){
  for(var i = 0; i < list.length; i++) { //if this user is in list
    console.log(list[i]);
    console.log(id);
    if(list[i] == id) {
      console.log('-------');
      var removed = list.splice(i,1); // remove this user from list
      console.log('a' + removed);
      console.log('b' + list);
      return removed;
    }
  }
  return [];
}

function findEvent(query, callback){
  Event.find(query)
    .select('_id name host icon date declinedList pendingList joinedList place timestamp')
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
