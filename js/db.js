var Datastore = require('nedb'),
	db = new Datastore({
		filename: 'db/auto.db',
		autoload: true
	});

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
	console.log(sym);
}

function GetAuto() {
	db.find({
		type: 'auto'
	}, function (err, docs) {
		if (docs.length != 0)
			CreateAutoList(docs[0].aut);
	});
}

function SetHistory(data) {
	db.insert({
		type: 'his',
		his: data,
		amo: amount
	}, function (err, newDocs) {});
}

function GetHistory() {
	db.find({
		type: 'his'
	}, function (err, docs) {
		console.log(docs);
	});
}
