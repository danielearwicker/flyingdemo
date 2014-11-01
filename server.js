require('http').createServer(
  require('ecstatic')({ root: __dirname })
).listen(8080, '0.0.0.0');
