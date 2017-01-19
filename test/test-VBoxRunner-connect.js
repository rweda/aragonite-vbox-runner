"use strict";

var Promise = require("bluebird");
var chai = require("chai");
var should = chai.should();
var express = require("express");
var eventToPromise = require("event-to-promise");

var VBoxRunner = require("../VBoxRunner");

describe("VBoxRunner#connect", function() {

  let runner = null;
  let host = "localhost";
  let server = null;

  beforeEach(function() {
    runner = new VBoxRunner();
    server = Promise.promisifyAll(require("http").createServer());
    let io = require("socket.io")(server);
    io.on("connection", function(socket) {
      socket.on("test", function() {
        io.emit("test-done");
      });
    });
    server.listen(0);
    return eventToPromise(server, "listening");
  });

  afterEach(function() {
    runner.disconnect();
    return server.closeAsync();
  });

  it("should connect to a Socket", function() {
    return runner
      .connect(host, server.address().port)
      .then(function() {
        let awk = eventToPromise(runner.socket, "test-done");
        runner.socket.emit("test");
        return awk;
      });
  });

});
