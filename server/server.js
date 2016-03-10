// hello.js

const http = require('http');
const url = require('url');
const addon = require('./build/Release/addon');

const hostname = '127.0.0.1';
const port = 1337;

http.createServer((req, res) => {
  res.writeHead(200, {"Content-Type": "application/json"});

  var queryObj = url.parse(req.url,true).query;
  console.log(addon.getJson(1,2));

  var json = JSON.stringify({ 
    res : addon.getJson(queryObj.startLng,queryObj.startLat,queryObj.endLng,queryObj.endLat),
    query : queryObj
  });
  // res.end(json);
  res.end("success_jsonpCallback(" + json + ")");
  // res.writeHead(200, { 'Content-Type': 'text/plain' });
  // res.end(addon.hello());
}).listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});


// console.log(addon.hello());

