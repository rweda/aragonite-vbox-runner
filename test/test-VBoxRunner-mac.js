"use strict";

var Promise = require("bluebird");
var chai = require("chai");
var should = chai.should();
var express = require("express");
var eventToPromise = require("event-to-promise");

var VBoxRunner = require("../VBoxRunner");

describe("VBoxRunner#mac", function() {

  let runner = null;
  let host = "localhost";
  let listener = null;
  let server = null;

  beforeEach(function() {
    runner = new VBoxRunner();
    server = Promise.promisifyAll(require("http").createServer());
    let io = require("socket.io")(server);
    io.on("connection", function(socket) {
      socket.on("mac", function(data) {
        io.emit("testMac", data);
      });
    });
    listener = server.listen(0);
    return eventToPromise(server, "listening")
      .then(() => { runner.connect(host, listener.address().port); });
  });

  afterEach(function() {
    runner.disconnect();
    return server.closeAsync();
  });

  it("should send a single MAC address", function() {
    let awk = eventToPromise(runner.socket, "testMac");
    runner.socket.emit("mac", "SingleAddr");
    return awk
      .then(function(mac) {
        mac.should.equal("SingleAddr");
      });
  });

});
