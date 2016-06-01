
var Event = require('../Models/Event');
var logger = require('../logger');
var UserUtil = require('../Utils/UserUtil');
var ANS = require('../Utils/AndroidNotificationSender');
var User = require('../Models/User');

module.exports.assignRoute = function(app){

  app.post('/event/create', function(req, res, next) {
    var cevent = req.body;

    /*
      create new document of Event
    */
    Event.create({
      name: cevent.name,
      host: req.user.uid,
      isPrivate: cevent.isPrivate,
      icon: cevent.icon,
      joinedList: [],
      pendingList: cevent.pendingList,
      declinedList: [],
      place: cevent.place,
      date: cevent.date,
      timestamp: cevent.timestamp
      }, function(err, event){

        if(err){ //if error when create an Event on database
          sendDbError();
          return;
        }

        /*
          save new pendingList
        */
        event.save(function(err) {
          if(err){ //if error while saving Event to database
            sendDbError();
            return;
          }

          /*
            find users' deviceKeys with IDs' in pendingList
          */
          User.find({
            _id: { $in: event.pendingList }
          }).select('deviceKey')
            .exec(function(err, results) { //callback

              if(err){ //database error, notifications cannot be fired.
                DbErrorCantNotify(err);
                return;
              }

              /*
                for each user, notify that he/she is invited to an event.
              */
              results.forEach(function(user) {
                ANS.notify(user.deviceKey, 'New Event', 'You are invited to ' + event.name + ' event.');
              });
            });

          /*
            send back a response that an event is created.
          */
          res.status(200).json({ //
              message: 'The ' + event.name + ' event has been created'
          });
        });
      }
    );
  }); //end of POST /event/create


  app.get('/event/invitedEvent', function(req, res, next) {
    var thisUserId = req.user.uid;

    /*
      find Events that this user is invited, and not yet occured
    */
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

    /*
      Find the event this user want to invited a friend to.
    */
    Event.findOne({ // find the event
      _id: invitation.eventId
    }, function(err, event) {

      /*
        add this user friend to pendingList and save.
      */
      event.pendingList.push(invitation.friendId);
      event.save(function(err) {

        if(err){
          sendDbError(res, err);
          return;
        }

            if(err){ // if error while looking for deviceKey in database.
              DbErrorCantNotify(err);
              return;
            }

            //notify this user friend.
            ANS.notify(user.deviceKey, 'New Event', 'You are invited to ' + event.name + ' event.');

          });
        /*
          send back a response that the invitation is sent.
        */
        res.status(200).json({
          message: 'The invitation has been sent'
        });
      });
    });//end of POST /event/create


  app.post('/event/join', function(req, res, next) {
    var info = req.body;

    /*
      Find an event with eventId.
    */
    Event.findOne({
      _id: info.eventId
    }, function(err, event) {

      //if user exists in pendingList
      if(removeUserIdFromList(event.pendingList, req.user.uid).length > 0) {

      }

      //else if this Event is public Event and user exists in declinedList
      else if (!event.isPrivate && removeUserIdFromList(event.declinedList, req.user.uid).length > 0) {

      }

      //else if this Event is public Event and user doesn't exists in joinedList
      else if (!event.isPriavte && event.joinedList.indexOf(req.user.uid) < 0) {

      }

      //else
      else {
        return;
      }

      /*
        add user to joinedList and save.
      */
      event.joinedList.push(req.user.uid);
      event.save(function(err) {
        if(err){
          return;
        }

        /*
          send back a response tell a user that he/she joined the event.
        */
        res.status(200).json({
          message: 'you have joined the event ' + event.name
        });
      });


    });
  }); //end of POST /event/join


  app.post('/event/decline', function(req, res, next) {
    var info = req.body;

    /*
      Find an Event with eventId.
    */
    Event.findOne({
      _id: info.eventId
    }, function(err, event) {

      if(err) { //if error occur while searching an event.
        sendDbError();
        return;
      }

      // if user exists in pedningList
      if(removeUserIdFromList(event.pendingList, req.user.uid).length > 0) {

      }

      // else if user exists in joinedList
      else if(removeUserIdFromList(event.joinedList, req.user.uid).length > 0) {

      }

      // else
      else {
        return;
      }

      /*
        Put user's id in declinedList and save.
      */
      event.declinedList.push(req.user.uid);
      event.save(function(err) {

        if(err){ // if error occur while saving.
          sendDbError();
          return;
        }

        /*
          send back a response that a user declined an event.
        */
        res.status(200).json({
          message: 'you have declined the event ' + event.name
        });
      });
    });
  }); //end of POST /event/decline


  app.post('/event/edit', function(req, res, next) {
    var info = req.body;

    /*
      Find an Event with eventId.
    */
    Event.findOne({
      _id: info.eventId
    }, function(err, event) {

      // collect the old name of this event.
      var oldName = event.name;

      // copy new attribute to the event.
      for(var key in info) {
        if(key != 'eventId') {
          if(key == 'place'){
            event["place"] = (info["place"]);
          }else {
            event[key] = info[key];
          }
        }
      }

      // save
      event.save(function(err) {

        if(err) { //if error occur while saving.
          sendDbError();
          return;
        }

        /*
          Find users' deviceKeys and send notifications that the event is edited.
        */
        var toNotify = event.joinedList;
        User.find({
          _id: { $in: toNotify }
        }).select('deviceKey')
          .exec(function(err, results) {

            if(err){ // if error occur while searching deviceKeys.
              DbErrorCantNotify(err);
              return;
            }

            // for each user, send notifications.
            results.forEach(function(user) {
              ANS.notify(user.deviceKey, 'An Event is edited', 'The ' + oldName + ' event has been edited.');
            });
          });

        /*
          send back a response that the event is successfully edited.
        */
        res.status(200).json({
          message: 'The event ' + event.name + ' has been edited.'
        });
      });
    });
  }); //end of POST /event/edit


  app.post('/event/remove', function(req, res, next) {
    var thisUserId = req.user.uid;
    var info = req.body;

    /*
      Remove an event with _id match eventId
    */
    Event.remove({
      _id: info.eventId
    },function(err, event){

      if(err){ // if error occur while removing.
        sendDbError();
        return;
      }

      /*
        Find user in all list, and notify that the event is removed.
      */
      var toNotify = event.joinedList.concat(event.pendingList, event.declinedList);
      User.find({
          _id: { $in: toNotify }
        })
        .select('deviceKey')
        .exec(function(err, results) {

          if(err) { // if error occur while searching deviceKeys.
            DbErrorCantNotify(err);
            return;
          }

          // for each user, send notification.
          results.forEach(function(user) {
            ANS.notify(user.deviceKey, 'An Event is cancelled', 'The ' + event.name + ' event has been cancelled.');
          });
        });

      /*
        send back a response that the event is removed.
      */
      res.status(200).json({
        message: 'The event ' + event.name + ' has been cancel.'
      });
    });
  }); //end of POST /event/remove


  app.get('/event/joinedEvent', function(req, res, next) {
    var thisUserId = req.user.uid;

    /*
      Find an Event that this user joined or hosted.
    */
    findEvent({
        joinedList: thisUserId ,
        date: { $gt: new Date() }
      },
      function(err, results) {
        if(err){
          sendDbError();
          return;
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
      if(friends.length <= 0) res.status(200).json({
        result: []
      });
      findEvent({
          host: { $in: friends },
          date: { $gt: new Date() },
          joinedList: { $not: { $eq: thisUserId } }
        }, function(err, results) {
        if(err){
          console.log(err);
          sendDbError(res, err);
          return;
        }
        res.status(200).json({
          result: results
        });
      });
    });
  }); //end of GET /event/publicEvent


  app.get('/event/myEvent', function(req, res, next) {
    var thisUserId = req.user.uid;
    findEvent({
      host: thisUserId,
      date: { $gt: new Date() }
    }, function(err, results) {
      if(err){
        sendDbError();
        return;
      }
      res.status(200).json({
        result: results
      });
    });
  }); //end of GET /event/myEvent


}; //end of module.exports

function removeUserIdFromList(list, id){
  for(var i = 0; i < list.length; i++) { //if this user is in list
    if(list[i] == id) {
      var removed = list.splice(i,1); // remove this user from list
      return removed;
    }
  }
  return [];
}

function findEvent(query, callback){
  Event.find(query)
    .select('_id name host icon date declinedList pendingList joinedList place timestamp isPrivate')
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

function DbErrorCantNotify(err){
  logger.error('database error, notifications cannot be fired');
  logger.error(err);
}
