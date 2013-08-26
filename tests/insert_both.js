if (Meteor.isServer) {
  var collection1 = new Meteor.Collection("test_insert_collection1");

  Tinytest.addAsync("insert - collection1 document should have extra property added to it before it is inserted", function (test, next) {
    var tmp = {};

    collection1.remove({});

    collection1.before("insert", function (userId, doc) {
      console.log("test_insert_collection1 BEFORE INSERT!")
      // There should be no userId because the insert was initiated
      // on the server -- there's no correlation to any specific user
      tmp.userId = userId;  // HACK: can't test here directly otherwise refreshing test stops execution here
      doc.before_insert_value = true;
    });

    collection1.insert({start_value: true}, function () {
      test.equal(collection1.find({start_value: true, before_insert_value: true}).count(), 1);
      test.equal(tmp.userId, undefined);
      next();
    });
  });
}

var collection2 = new Meteor.Collection("test_insert_collection2");

if (Meteor.isServer) {
  // full client-side access
  collection2.allow({
    insert: function () { return true; },
    update: function () { return true; },
    remove: function () { return true; }
  });

  Meteor.methods({
    test_insert_reset_collection2: function () {
      collection2.remove({});
    }
  });

  Meteor.publish("test_insert_publish_collection2", function () {
    return collection2.find();
  });

  collection2.before("insert", function (userId, doc) {
    console.log("test_insert_collection2 HOOK HAS BEEN CALLED!", userId, doc)
    doc.server_value = true;
  });
}

if (Meteor.isClient) {
  Meteor.subscribe("test_insert_publish_collection2");

  Tinytest.addAsync("insert - collection2 document should have client-added and server-added extra properties added to it before it is inserted", function (test, next) {
    collection2.before("insert", function (userId, doc) {
      console.log("test_insert_collection2 BEFORE INSERT!")
      test.notEqual(userId, undefined, "the userId should be present since we are on the client");
      test.equal(collection2.find({start_value: true}).count(), 0, "collection2 should not have the test document in it");
      doc.client_value = true;
    });

    collection2.after("insert", function (userId, doc) {
      console.log("test_insert_collection2 AFTER INSERT!", doc)
      test.equal(collection2.find({start_value: true, client_value: true, server_value: true}).count(), 1, "collection2 should have the test document with client_value AND server_value in it");
      test.notEqual(doc._id, undefined, "the test document should have an _id");
      next();
    });

    InsecureLogin.ready(function () {
      Meteor.call("test_insert_reset_collection2", function (err, result) {
        console.log("test_insert_collection2 INSERT!");
        collection2.insert({start_value: true});
      });
    });
  });
}

/*
if (Meteor.isServer) {
  var collection_s_null = new Meteor.Collection(null);
  collection_s_null.before("insert", function (userId, doc) {});
  collection_s_null.insert({server_null_test: 1});

  var collection_s_named = new Meteor.Collection("s_named");
  collection_s_named.before("insert", function (userId, doc) {});
  collection_s_named.insert({server_named_test: 1});
}

if (Meteor.isClient) {
  var collection_c_null = new Meteor.Collection(null);
  collection_c_null.before("insert", function (userId, doc) {});
  collection_c_null.insert({client_null_test: 1});

  var collection_c_named = new Meteor.Collection("c_named");
  collection_c_named.before("insert", function (userId, doc) {});
  collection_c_named.insert({client_named_test: 1});
}

var collection_cs_named = new Meteor.Collection("cs_named");
if (Meteor.isServer) {
  collection_cs_named.allow({ insert: function () { return true; }, update: function () { return true; }, remove: function () { return true; } });

}
if (Meteor.isClient) {
  collection_cs_named.before("insert", function (userId, doc) {});
  collection_cs_named.insert({client_server_named_test: 1});
}
*/