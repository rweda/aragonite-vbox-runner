"use strict";

var eventToPromise = require("event-to-promise");

/**
 * Connects to an Aragonite server (running aragonite-vbox) from inside a spawned VirtualBox machine.
 *
 * @prop {Promise<Object>} machine Resolves to the machine info sent by Aragonite.
 * @prop {Promise<Object>} conf    Resolves to the run info sent by Aragonite.
*/
class VBoxRunner {

  /**
   * Start a connection to an Aragonite server.
   * @param {string} host an IP address or domain name o fthe Aragonite server
   * @param {string} port the port that `aragonite-vbox` is running on.
   * @return {Promise} resolves once the connection has opened.
  */
  connect(host, port) {
    this.socket = require("socket.io-client")("http://"+host+":"+port);
    this.machine = eventToPromise(this.socket, "machine");
    this.conf = eventToPromise(this.socket, "conf");
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
