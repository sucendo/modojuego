var http = require('http');
var server = http.createServer();
 
function mensaje(petic, resp) {
	resp.writeHead(200, {'content-type': 'text/plain'});
	resp.write('Hola Mundo');
	resp.end();
}
server.on('request', mensaje);
 
server.listen(3000, function () {
  	console.log('La Aplicación está funcionando en el puerto 3000');
});

/*var opbeat = require('opbeat').start()

var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.use(opbeat.middleware.express())

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index');
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});*/
