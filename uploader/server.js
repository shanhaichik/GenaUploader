var express = require('express');
var swig = require('swig');
var bodyParser     = require('body-parser');
var morgan         = require('morgan');
var multer  = require('multer');
var app = express();

var config = require('./core/conf');

var db = (function(){
	var arr = [];
	
	for(var i = 3; i < 10000; i++) {
		arr.push(i);
	}
	
	return arr;
})();

// Configuration
app.engine('html', swig.renderFile);

app.set('view engine', 'html');
app.set('views', __dirname + '/views');

// Disable cache
app.set('view cache', false);
swig.setDefaults({
	cache: false
});

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(multer({ dest: './uploads/'}));

app.use(express.static(__dirname + '/public'));
 

/* ======== API ======== */

// index page
app.get('/', function (req, res) {
	res.render('index',{db:db});
});

app.post('/', function (req, res) {
	res.sendStatus(404);
});
// upload page
app.post('/upload', function (req, res) {
	if (!req.files) {
		 //res.sendStatus(400);
		res.send({name:'hello'});
	} else {
	//	res.header('Content-Type','text/html');
		res.send(req.files)
	}
});

app.listen(config.server.port, function () {
	console.log(config.server.notice);
});