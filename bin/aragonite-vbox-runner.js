"use strict";

var pkg = require("../package");
var VBoxRunner = require("../VBoxRunner");

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
   * Starts communication with the Aragonite server.
   * @return {Promise} resolves once connection has been established, and basic information has been received.
  */
  connect() {
    return Promise.resolve();
  }

  /**
   * Runs required setup before running tests: install packages, clone or unpack project, etc.
   * @return {Promise} resolves once environment is fully setup.
  */
  setup() {
    return Promise.resolve();
  }

  /**
   * Runs the script provided by the user.
   * @return {Promise} resolves once the script has finished.
  */
  runScript() {
    return Promise.resolve();
  }

  /**
   * Processes the results from running the script, and reports results to the Aragonite server.
   * @return {Promise} resolves once results are reported to Aragonite.
  */
  reportResult() {
    return Promise.resolve();
  }

  /**
   * Cleans up from the run and reports to Aragonite.
   * @return {Promise} resolves once all cleanup is completed, and Aragonite has been informed of completion.
  */
  finish() {
    return Promise.resolve();
  }

}

module.exports = CLI;

if(require.main === module) {
  let cli = new CLI();
  cli.start();
}
