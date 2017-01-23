"use strict";

var Promise = require("bluebird");
var pkg = require("../package");
var VBoxRunner = require("../VBoxRunner");
var yaml = require("js-yaml");
var fs = Promise.promisifyAll(require("fs"));
var customError = require("custom-error");
var execAsync = require("child-process-promise").exec;

let errors = {
}

/**
 * A self-contained CLI controlled by a user-written YAML file like GitLab CI/Travis CI, and uses {@link VBoxRunner} to
 * communicate with an Aragonite server.
*/
class CLI {

  /**
   * Entrypoint.
   * @return {Promise} resolves once all tasks are finished.
  */
  start() {
    this.cli();
    this
      .handleConfig()
      .then(() => this.connect())
      .then(() => this.setup())
      .then(() => this.runScript())
      .then(() => this.reportResult())
      .then(() => this.finish());
  }

  /**
   * Parses CLI arguments.
  */
  cli() {
    this.opts = require("commander");
    this.opts
      .version(pkg.version)
      .usage("[options] <config.yaml>")
      .parse(process.argv);
  }

  /**
   * Load and process the YAML configuration file.
   * @return {Promise} resolves once the configuration has been parsed.
  */
  handleConfig() {
    fs
      .readFileAsync(this.opts.args[0], "utf8")
      .then(file => {
        this.config = yaml.safeLoad(file);
      });
  }

  /**
   * Returns the hostname specified in the config, or looks up the gateway IP.
   * @TODO: Works in Linux, OSX, Windows 10.  Test `network.get_gateway_ip` on Win 7, etc, and parse `ipconfig` if it
   *   doesn't work.
   * @return {Promise<string>}
  */
  get host() {
    if(this.config.host) { return Promise.resolve(this.config.host); }
    let network = Promise.promisifyAll(require("network"));
    return network.get_gateway_ipAsync();
  }

  /**
   * Return a port specified in the config, or default to 5720.
   * @return {Promise<number>}
  */
  get port() {
    if(this.config.port) { return Promise.resolve(this.config.port); }
    return Promise.resolve(5720);
  }

  /**
   * Returns the active MAC addresses.
   * @return {Promise<string[]>}
  */
  get mac() {
    let network = Promise.promisifyAll(require("network"));
    return network
      .get_interfaces_list()
      .then(list => {
        list.map(i => i.mac_address.replace(/\:/, ""));
      });
  }

  /**
   * Starts communication with the Aragonite server.
   * @return {Promise} resolves once connection has been established, and basic information has been received.
  */
  connect() {
    let machine = null;
    let conf = null;
    return  Promise
      .all([this.host, this.port])
      .then((host, port) => {
        this.runner = new VBoxRunner();
        this.runner.connect(host, port);
        machine = this.runner.machine;
        conf = this.runner.conf;
      })
      .then(() => { this.mac; })
      .then(mac => { this.runner.mac(mac); })
      .then(() => { Promise.all[machine, conf]); })
      .then((machine, conf) => {
        this.machine = machine;
        this.conf = conf;
      });
  }

  /**
   * Runs required setup before running tests: install packages, clone or unpack project, etc.
   * @return {Promise} resolves once environment is fully setup.
   * @TODO Add a 'setup' section to the YAML script.
  */
  setup() {
    return Promise.resolve();
  }

  /**
   * Runs the script provided by the user.
   * @return {Promise} resolves once the script has finished.
  */
  runScript() {
    let task = Promise.resolve();
    this.log = [];
    if(!this.config.script) {
      this.config.script = [];
    }
    for(const cmd of this.config.script) {
      task = task.then(() => {
        let child = execAsync(cmd);
        child.childProcess.stdout.on("data", (msg) => { this.log.push({ type: "stdout", msg: msg }); });
        child.childProcess.stderr.on("data", (msg) => { this.log.push({ type: "stderr", msg: msg }); });
      });
      if(this.config.ignore_errors) {
        task = task.catch(err => { return true; });
      }
    }
    return task;
  }

  /**
   * Processes the results from running the script, and reports results to the Aragonite server.
   * @return {Promise} resolves once results are reported to Aragonite.
  */
  reportResult() {
    if(!this.config.format) {
      return Promise.resolve();
    }
    if(!this[this.config.format]) {
      return Promise.reject(new Error("Report format " + this.config.format + " is not supported."));
    }
    return this[this.config.format]()
      .then(report => {
        return this.runner.report(report);
      });
  }

  /**
   * Create a report in the "goodbad" format.
   * @return {Promise<Object>} a goodbad report.
  */
  goodbad() {
    if(!this.config.goodbad) {
      return Promise.reject(new Error("goodbad report requires a 'goodbad' config section."));
    }
    let log = this.log.map(l => l.msg).reduce((l, entry) => "" + l + entry, "");
    let report = {
      format: "goodbad"
    };
    for(field of ["success", "good"]) {
      if(!this.config.goodbad[field]) {
        return Promise.reject(new Error("goodbad configuration needs a '" + field + "' regex."));
      }
    }
    report.success = log.test(new RegExp(this.config.goodbad.success));
    let good = log.match(new RegExp(this.config.goodbad.good));
    if(!good || !good[1] || isNaN(parseInt(good[1], 10))) {
      return Promise.reject(new Error("goodbad 'good' regex failed."));
    }
    report.good = parseInt(good[1], 10);
    for(field of ["bad", "skipped", "duration"]) {
      if(!this.config.goodbad[field]) { continue; }
      let val = log.match(new RegExp(this.config.goodbad[field]));
      if(val && val[1] && !isNaN(parseInt(val[1], 10))) { report[field] = parseInt(val[1], 10); }
    }
    return Promise.resolve(report);
  }

  /**
   * Cleans up from the run and reports to Aragonite.
   * @return {Promise} resolves once all cleanup is completed, and Aragonite has been informed of completion.
   * @TODO: add cleanup command section to the configuration.
  */
  finish() {
    return this.runner.done();
  }

}

CLI.errors = errors;

module.exports = CLI;

if(require.main === module) {
  let cli = new CLI();
  cli.start();
}
