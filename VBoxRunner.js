"use strict";

var eventToPromise = require("event-to-promise");

class VBoxRunner {

  /**
   * Start a connection to an Aragonite server.
   * @param {string} host an IP address or domain name o fthe Aragonite server
   * @param {string} port the port that `aragonite-vbox` is running on.
   * @return {Promise} resolves once the connection has opened.
  */
  connect(host, port) {
    this.socket = require("socket.io-client")("http://"+host+":"+port);
    return eventToPromise(this.socket, "connect");
  }

  /**
   * Links this socket connection to the VirtualBox environment via MAC address.
   * @param {string|string[]} mac the MAC address(es) of the VirtualBox machine.
   * @return {Promise} resolves once linking messages have been sent.
  */
  mac(mac) {
    if(typeof mac === "string") {
      this.socket.emit("mac", mac);
      return Promise.resolve();
    }
    for(const addr of mac) {
      this.socket.emit("mac", mac);
    }
    return Promise.resolve();
  }

  /**
   * Disconnect from the Socket.
  */
  disconnect() {
    this.socket.close();
  }

}

module.exports = VBoxRunner;
