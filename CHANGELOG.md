# Changelog

## [4.0.0](https://github.com/npm/agent/compare/v3.0.0...v4.0.0) (2025-09-18)
### ⚠️ BREAKING CHANGES
* `@npmcli/agent` now supports node `^20.17.0 || >=22.9.0`
### Bug Fixes
* [`cc633d3`](https://github.com/npm/agent/commit/cc633d3d55f585b177e59004d35383e9024faf4a) [#129](https://github.com/npm/agent/pull/129) align to npm 11 node engine range (@owlstronaut)
### Dependencies
* [`2eccb56`](https://github.com/npm/agent/commit/2eccb561f0fc241ed8f0c1573c53a1ce86b36e43) [#129](https://github.com/npm/agent/pull/129) `lru-cache@11.2.1`
### Chores
* [`44d60e7`](https://github.com/npm/agent/commit/44d60e78fbed18715c435684a4d20980d7d13786) [#124](https://github.com/npm/agent/pull/124) postinstall workflow updates (#124) (@owlstronaut)
* [`f3d6af9`](https://github.com/npm/agent/commit/f3d6af9b9f709ada6de3ee9d995c7038da804c2a) [#122](https://github.com/npm/agent/pull/122) bump minipass-fetch from 3.0.5 to 4.0.1 (#122) (@dependabot[bot])
* [`0ca160f`](https://github.com/npm/agent/commit/0ca160f062fc282e7e7ef88216a4503396f0a317) [#120](https://github.com/npm/agent/pull/120) bump nock from 13.5.6 to 14.0.3 (#120) (@dependabot[bot])
* [`63eb2f9`](https://github.com/npm/agent/commit/63eb2f9752b82373909746c396750ad9f4ef345e) [#127](https://github.com/npm/agent/pull/127) bump @npmcli/template-oss from 4.24.4 to 4.25.0 (#127) (@dependabot[bot], @npm-cli-bot)
* [`3c71f9a`](https://github.com/npm/agent/commit/3c71f9adb0cce1ec228c2de0ce420e4c86f7fe46) [#116](https://github.com/npm/agent/pull/116) postinstall for dependabot template-oss PR (@hashtagchris)

## [3.0.0](https://github.com/npm/agent/compare/v2.2.2...v3.0.0) (2024-08-26)

### ⚠️ BREAKING CHANGES

* `@npmcli/agent` now supports node `^18.17.0 || >=20.5.0`

### Bug Fixes

* [`5dbeb55`](https://github.com/npm/agent/commit/5dbeb555bd38ce52d8b526b0860d103237580ce4) [#113](https://github.com/npm/agent/pull/113) align to npm 10 node engine range (@hashtagchris)

### Chores

* [`bfdccc1`](https://github.com/npm/agent/commit/bfdccc1d8f93c05272057477a782e23f204f76a3) [#114](https://github.com/npm/agent/pull/114) bump @npmcli/eslint-config from 4.0.5 to 5.0.0 (@dependabot[bot])
* [`e3fd27f`](https://github.com/npm/agent/commit/e3fd27fa3ae84ebead169ee45f877bdd5a5ce657) [#113](https://github.com/npm/agent/pull/113) run template-oss-apply (@hashtagchris)
* [`21c1987`](https://github.com/npm/agent/commit/21c19874834fb00c7ab37268b385fb84deb2df04) [#99](https://github.com/npm/agent/pull/99) linting: no-unused-vars (@lukekarrys)
* [`488db1d`](https://github.com/npm/agent/commit/488db1df0025ba07e4de42e62638e1c49759687f) [#99](https://github.com/npm/agent/pull/99) bump @npmcli/template-oss to 4.22.0 (@lukekarrys)
* [`f797fa1`](https://github.com/npm/agent/commit/f797fa12c19915486b0aa662bfdbcf7824f8054a) [#95](https://github.com/npm/agent/pull/95) re-implement skipped windows test (#95) (@lukekarrys)
* [`603173b`](https://github.com/npm/agent/commit/603173ba1582ff633882c27c5dbe8a2dc41e3a42) [#111](https://github.com/npm/agent/pull/111) postinstall for dependabot template-oss PR (@hashtagchris)
* [`0c7400c`](https://github.com/npm/agent/commit/0c7400c1c8d0f9976bbd12b8348a94184a0fa5f6) [#111](https://github.com/npm/agent/pull/111) bump @npmcli/template-oss from 4.22.0 to 4.23.1 (@dependabot[bot])

## [2.2.2](https://github.com/npm/agent/compare/v2.2.1...v2.2.2) (2024-04-01)

### Bug Fixes

* [`30f7443`](https://github.com/npm/agent/commit/30f7443ddf74879a2066ac3fb91d1238a4b1e102) [#94](https://github.com/npm/agent/pull/94) set socks proxy socket family (#94) (@lukekarrys)

## [2.2.1](https://github.com/npm/agent/compare/v2.2.0...v2.2.1) (2024-02-01)

### Bug Fixes

* [`88212cc`](https://github.com/npm/agent/commit/88212ccbfebdc10ec97656e5ffc8415a9aa84de8) [#92](https://github.com/npm/agent/pull/92) properly differentiate http and https proxies (#92) (@Torbjorn-Svensson)

### Chores

* [`9ffc694`](https://github.com/npm/agent/commit/9ffc69422e74024bffc72af68ffa6f9175a2d6b7) [#90](https://github.com/npm/agent/pull/90) postinstall for dependabot template-oss PR (@lukekarrys)
* [`7243097`](https://github.com/npm/agent/commit/7243097fe24986340a9dce49ba7116798b21727b) [#90](https://github.com/npm/agent/pull/90) bump @npmcli/template-oss from 4.21.1 to 4.21.3 (@dependabot[bot])
* [`ee9ea76`](https://github.com/npm/agent/commit/ee9ea767488f553a8c8d72accad494246e937934) [#88](https://github.com/npm/agent/pull/88) postinstall for dependabot template-oss PR (@lukekarrys)
* [`e169c95`](https://github.com/npm/agent/commit/e169c95a01fd7023e9ead948c331a032db3c2c51) [#88](https://github.com/npm/agent/pull/88) bump @npmcli/template-oss from 4.19.0 to 4.21.1 (@dependabot[bot])
* [`cfdcf70`](https://github.com/npm/agent/commit/cfdcf70a47f8b2aff924a00a9bb635a624ee6906) [#73](https://github.com/npm/agent/pull/73) move proxy:null to correct test (@lukekarrys)

## [2.2.0](https://github.com/npm/agent/compare/v2.1.1...v2.2.0) (2023-10-02)

### Features

* [`e24eb6c`](https://github.com/npm/agent/commit/e24eb6c042424e6a83d5fb37a7ff91f7daf6f6f2) [#59](https://github.com/npm/agent/pull/59) use agent-base (@lukekarrys)

### Bug Fixes

* [`d2608ea`](https://github.com/npm/agent/commit/d2608ea5ed6bf973a316c128ecf77601e4254f3e) [#59](https://github.com/npm/agent/pull/59) remove unnecessary utils and cleanup destructuring (@lukekarrys)
* [`4d4b70c`](https://github.com/npm/agent/commit/4d4b70c2a99011909b8f3b58f1e23fcb45cf2ff2) [#67](https://github.com/npm/agent/pull/67) set proxy from env vars based on truthiness (@lukekarrys)

## [2.1.1](https://github.com/npm/agent/compare/v2.1.0...v2.1.1) (2023-09-08)

### Bug Fixes

* [`9937e66`](https://github.com/npm/agent/commit/9937e6602d8448f65f05e17b4d5c2264caeae25e) [#55](https://github.com/npm/agent/pull/55) use current agent to determine secure proxy (@lukekarrys)

## [2.1.0](https://github.com/npm/agent/compare/v2.0.0...v2.1.0) (2023-08-30)

### Features

* [`707bff4`](https://github.com/npm/agent/commit/707bff49da5838c3c803e91c66c4959bc7672a45) [#50](https://github.com/npm/agent/pull/50) use third party proxy agents (@lukekarrys)

## [2.0.0](https://github.com/npm/agent/compare/v1.1.0...v2.0.0) (2023-08-15)

### ⚠️ BREAKING CHANGES

* support for node 14 has been removed

### Bug Fixes

* [`c18b8b3`](https://github.com/npm/agent/commit/c18b8b395faee9e0be78c29bca0d4e85be2424cd) [#47](https://github.com/npm/agent/pull/47) drop node14 support (@lukekarrys)
* [`5c59b3d`](https://github.com/npm/agent/commit/5c59b3df2a86b5ef3debab4c589ebf95f82f1259) [#47](https://github.com/npm/agent/pull/47) use lru-cache named export (@lukekarrys)

### Dependencies

* [`6a72624`](https://github.com/npm/agent/commit/6a72624a419a6aa75167d1c171fcde7cf5677e49) [#47](https://github.com/npm/agent/pull/47) bump lru-cache from 7.18.3 to 10.0.1

## [1.1.0](https://github.com/npm/agent/compare/v1.0.0...v1.1.0) (2023-05-16)

### Features

* [`93bdc11`](https://github.com/npm/agent/commit/93bdc118b3f0b3e627061f7c049aabf066741d8c) [#38](https://github.com/npm/agent/pull/38) implement getAgent function (#38) (@nlf)
* [`35bad06`](https://github.com/npm/agent/commit/35bad06f7bd8f6d3a69cd8e7d6ab7100b2ab2c5e) [#37](https://github.com/npm/agent/pull/37) implement socks proxy (#37) (@nlf)
* [`471f70b`](https://github.com/npm/agent/commit/471f70bed388ce8bbe2154bfc2e749fb55bfbc84) [#35](https://github.com/npm/agent/pull/35) implement the family flag for restricting tcp family (#35) (@nlf)
* [`ac89410`](https://github.com/npm/agent/commit/ac89410bd8b79b130b16c428ec5b2aa2a751c57f) [#34](https://github.com/npm/agent/pull/34) implement dns cache (#34) (@nlf)
* [`1f97e18`](https://github.com/npm/agent/commit/1f97e1800b712d51a0c16b183f64144656db3672) [#30](https://github.com/npm/agent/pull/30) implement granular timeouts (#30) (@nlf)

### Bug Fixes

* [`6eede82`](https://github.com/npm/agent/commit/6eede82b98468172e2f3db2724cc9bce5ae0bd54) [#41](https://github.com/npm/agent/pull/41) pass parameters into errors so we can attach context to them (#41) (@nlf)

### Documentation

* [`00a212a`](https://github.com/npm/agent/commit/00a212a0c3b43652f1331601e53b89b6c1443f11) [#42](https://github.com/npm/agent/pull/42) add a README (#42) (@nlf)

## [1.0.0](https://github.com/npm/agent/compare/v0.0.1...v1.0.0) (2022-12-08)

### ⚠️ BREAKING CHANGES

* `@npmcli/agent` is now compatible with the following semver range for node: `^14.17.0 || ^16.13.0 || >=18.0.0`

### Features

* [`0c17ff4`](https://github.com/npm/agent/commit/0c17ff4730d838769f883323713c00067a4a314b) [#9](https://github.com/npm/agent/pull/9) postinstall for dependabot template-oss PR (@lukekarrys)
* [`eb1fbfc`](https://github.com/npm/agent/commit/eb1fbfc701725664243d46e0f7b7022bec34b2aa) initial commit (@nlf)

### Bug Fixes

* [`f06b8ea`](https://github.com/npm/agent/commit/f06b8ead5d5ad486cd696b07b93858686e7169f7) dont use an agent for the CONNECT request (@nlf)
