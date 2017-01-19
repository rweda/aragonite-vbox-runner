# Aragonite VirtualBox Runner

This runner provides an easy way to communicate with an [Aragonite][] testing server from inside a VirtualBox to collect
the current test details, and report the testing results back to the server.

This package includes a communication library, ~~[`VBoxRunner.js`][]~~ that uses the ~~[`aragonite-vbox` API][]~~.

In addition to the library, a CLI utility (`vbox-runner`) provides a self-contained testing system that defines tasks to
run in a YAML file, similar to the files used by [GitLab CI][] and [Travis CI][].

## CLI Usage

### 1. YAML File

`vbox-runner` uses a YAML file to configure functionality.  A sample file is below.

```yml
port: 5720
repo: git
cwd: "~/my-project"
script:
  - echo "Success 55"
  - echo "Failure 12"
success_regex: "Success ([0-9]+)"
failure_regex: "Failure ([0-9]+)"
```

#### Connection

The runner needs to connect to an `aragonite-vbox` instance on an Aragonite server.  By default, it connects to the
gateway IP, which is the host machine's IP address if VirtualBox's network is set to NAT.

Alternatively, `host` can be set to an IP address or URL of the Aragonite server.

`aragonite-vbox` defaults to using port `5720`.  Provide a `port` entry if the port has been changed in the Aragonite
configuration.

#### Project Importing

The runner can automatically get files needed to test the project, and place them in the directory specified by `cwd`
(defaulting to `~`).

If `repo` is provided, the runner will attempt to fetch the project's files from the repository specified in the run
configuration passed to Aragonite using the software specified by `repo`.  Currently, only `git` is supported.

If `repo` isn't provided, the runner will download and unpack a file archive, if one was provided to the Aragonite run.
This can be disabled by setting `no-archive: true` in the configuration.

#### Test Commands

The runner will run shell commands specified by `script`.  Unless `ignore_failure: true` is provided in the YAML file,
any script failures will abort the entire environment, and report an error to Aragonite.

#### Success/Failure parsing

By default, the runner will report a success and failure count.  `success_regex` and `failure_regex` can provide simple
regex's that will be run on the entire script output, and matches will be reported to Aragonite.

### 2. Installation

Inside a VirtualBox machine, install Node.js and Git, and then run `npm install [-g] @aragonite/vbox-runner`.

Have a script run on machine startup that calls `aragonite-vbox-runner <YAML path>`, calling the CLI command wherever it
was installed, and providing the path to the YAML file containing the run configuration.

[Aragonite]: https://github.com/rweda/aragonite
[`VBoxRunner.js`]: https://rweda.github.io/aragonite-vbox-runner
[`aragonite-vbox` API]: https://rweda.github.io/aragonite
[GitLab CI]: https://about.gitlab.com/gitlab-ci/
[Travis CI]: https://travis-ci.org/
