var express = require("express");
var http = require("http");

// const { npm_package_config_port: PORT, npm_package_config_domain: APPNAME } =
// 	process.env;

const PORT = 3305;
const APPNAME = "violation";
const app = express();
const server = http.createServer(app);

app.use(express.static(__dirname + "/build"));

app.get("*", (request, response) => {
  return response.sendFile(__dirname + "/build/index.html");
});

server.listen(PORT, () => {
  console.log(APPNAME + " listening on port", PORT);
});
