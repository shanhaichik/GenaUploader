var express = require('express');
var swig = require('swig');
var app = express();

var config = require('./core/conf');

// Configuration
app.engine('html', swig.renderFile);

app.set('view engine', 'html');
app.set('views', __dirname + '/views');

// Disable cache
app.set('view cache', false);
swig.setDefaults({
	cache: false
});

app.use(express.static(__dirname + '/public'));


/* ======== API ======== */

// index page
app.get('/', function (req, res) {
	res.render('index');
});

// upload page
app.post('/upload', function (req, res) {
	console.log(req);
});

app.listen(config.server.port, function () {
	console.log(config.server.notice);
});