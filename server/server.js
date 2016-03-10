// hello.js

const http = require('http');
// const querystring = require('querystring');
const url = require('url');
const addon = require('./build/Release/addon');

const hostname = '127.0.0.1';
const port = 1337;

http.createServer((req, res) => {
  res.writeHead(200, {"Content-Type": "application/json"});
  var otherArray = ["item1", "item2"];
  var otherObject = { item1: "item1val", item2: "item2val" };
  var urlparse = url.parse(req.url,true).query;
  // var query = querystring.parse(url);
  var json = JSON.stringify({ 
    anObject: otherObject, 
    anArray: otherArray, 
    another: addon.hello(),
    url:urlparse,
    // query: query,
    // req:req
  });
  // res.end(json);
  res.end("success_jsonpCallback(" + json + ")");
  // res.writeHead(200, { 'Content-Type': 'text/plain' });
  // res.end(addon.hello());
}).listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});


// console.log(addon.hello());

