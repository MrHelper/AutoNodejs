var Datastore = require('nedb'),

  db = new Datastore({
    filename: 'db/auto.db',
    autoload: true
  });

const hisrow = 100;

function GetApiKey() {
  db.find({
    type: 'api'
  }, function (err, docs) {
    if (docs.length != 0) {
      $('#apiKey').val(docs[0].api);
      $('#secretKey').val(docs[0].secret);
      UpdateApiKey(docs[0].api, docs[0].secret);
    }
  });
}

function SetApiKey(apiKey, secretKey) {
  db.find({
    type: 'api'
  }, function (err, docs) {
    if (docs.length == 0) {
      db.insert({
        type: 'api',
        api: apiKey,
        secret: secretKey
      }, function (err, newDocs) {});
    } else {
      db.update({
        type: 'api'
      }, {
        $set: {
          api: apiKey,
          secret: secretKey
        }
      }, {}, function (err, numReplaced) {});
    }
    UpdateApiKey(apiKey,secretKey);
  });
}

function SetFav(symbol) {
  db.find({
    type: 'fav'
  }, function (err, docs) {
    if (docs.length == 0) {
      db.insert({
        type: 'fav',
        sym: symbol
      }, function (err, newDocs) {});
    } else {
      db.update({
        type: 'fav'
      }, {
        $set: {
          sym: symbol
        }
      }, {}, function (err, numReplaced) {});
    }
  });
}

function GetFav() {
  db.find({
    type: 'fav'
  }, function (err, docs) {
    if (docs.length != 0) {
      AddFavRow(docs[0].sym);
    }
  });
}

function SetAuto(sym) {
  db.find({
    type: 'auto'
  }, function (err, docs) {
    if (docs.length == 0) {
      db.insert({
        type: 'auto',
        aut: sym
      }, function (err, newDocs) {});
    } else {
      db.update({
        type: 'auto'
      }, {
        $set: {
          aut: sym
        }
      }, {}, function (err, numReplaced) {});
    }
  });
}

function GetAuto() {
  db.find({
    type: 'auto'
  }, function (err, docs) {
    if (docs.length != 0)
      CreateAutoList(docs[0].aut);
  });
}

function SetHistory(ordId, data) {
  db.count({
    type: 'his'
  }, function (err, count) {
    if (count >= hisrow) {
      db.find({
        type: 'his'
      }).sort({
        time: 1
      }).limit(1).exec(function (err, docs) {
        db.remove({
          _id: docs[0]._id
        }, {}, function (err, numRemoved) {
          db.insert({
            type: 'his',
            orderId: ordId,
            his: data,
            time: (new Date).getTime()
          }, function (err, newDocs) {
            GetHistory()
          });
        });
      });
    } else {
      db.insert({
        type: 'his',
        orderId: ordId,
        his: data,
        time: (new Date).getTime()
      }, function (err, newDocs) {
        GetHistory()
      });
    }
  });
}

function GetHistory() {
  db.find({
    type: 'his'
  }).sort({
    time: -1
  }).limit(hisrow / 5).exec(function (err, docs) {
    LoadHis(docs);
  });
}

function SetTrade(ordId, symb, side, pri, amo) {
  db.insert({
    type: 'trade',
    orderId: ordId,
    symbol: symb,
    side: side,
    amount: amo,
    price_b: pri,
    price_s: 0,
    sell: false,
    time: (new Date).getTime()
  }, function (err, newDocs) {
    GetLastestPriceAll();
  });
}

function GetTrade() {
  db.find({
    type: 'trade'
  }).sort({
    time: -1
  }).exec(function (err, docs) {
    LoadTradeList(docs);
  });
}

function SetSellTrade(symb, pri) {
  db.update({
    type: 'trade',
    symbol: symb,
    price_s: 0
  }, {
    $set: {
      price_s: pri,
      sell: true
    }
  }, {}, function (err, numReplaced) {
    GetLastestPriceAll();
  });
}

function DeleteTrade(id) {
  db.remove({
    type: 'trade',
    _id: id
  }, {
    multi: true
  }, function (err, numRemoved) {
    RemoveTrade(id);
  });
}
