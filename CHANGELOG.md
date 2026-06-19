# Changelog

## [5.0.2](https://github.com/npm/agent/compare/v5.0.1...v5.0.2) (2026-06-19)
### Bug Fixes
* [`78e3d44`](https://github.com/npm/agent/commit/78e3d44433bc22146da63a09d967272b1f2bc6bf) [#170](https://github.com/npm/agent/pull/170) retain idle timeout for free sockets (#170) (@hexa00)
### Chores
* [`c9d9a64`](https://github.com/npm/agent/commit/c9d9a64112922504623e18bcbc9cb18f99f68ef2) [#167](https://github.com/npm/agent/pull/167) bump @npmcli/template-oss from 5.1.0 to 5.1.1 (#167) (@dependabot[bot], @npm-cli-bot)

## [5.0.1](https://github.com/npm/agent/compare/v5.0.0...v5.0.1) (2026-05-26)
### Bug Fixes
* [`a6854f0`](https://github.com/npm/agent/commit/a6854f07aeddf69c633bdf26493aa4e3408e34a0) [#105](https://github.com/npm/agent/pull/105) don't put opts.headers into the agent itself (#105) (@shunf4)
* [`af2890c`](https://github.com/npm/agent/commit/af2890c5529767f02746447c7fa6e596aba0158c) [#159](https://github.com/npm/agent/pull/159) dispatch pending requests when a connection fails (@manzoorwanijk)
### Chores
* [`8a58a04`](https://github.com/npm/agent/commit/8a58a044142aff7ed32ad03ca3dc81ae354d8525) [#162](https://github.com/npm/agent/pull/162) add backport branch (#162) (@owlstronaut)
* [`66ad22c`](https://github.com/npm/agent/commit/66ad22c90ca16385f906bab8b1317c682613924b) [#158](https://github.com/npm/agent/pull/158) bump @npmcli/eslint-config from 6.0.1 to 7.0.0 (@dependabot[bot])
* [`2cd0bfa`](https://github.com/npm/agent/commit/2cd0bfae2540c1ec959e20491d0f7fbeadeb09ea) [#156](https://github.com/npm/agent/pull/156) bump minipass-fetch from 5.0.2 to 6.0.0 (#156) (@dependabot[bot])
* [`0a0c7f5`](https://github.com/npm/agent/commit/0a0c7f5cf1941680787e0eaa0d79fdbfea043eb0) [#157](https://github.com/npm/agent/pull/157) postinstall for dependabot template-oss PR (@npm-cli-bot)
* [`8aba6ca`](https://github.com/npm/agent/commit/8aba6cad05d354551773459ea48454c3939403ce) [#157](https://github.com/npm/agent/pull/157) bump @npmcli/template-oss from 5.0.0 to 5.1.0 (@dependabot[bot])

## [5.0.0](https://github.com/npm/agent/compare/v4.0.0...v5.0.0) (2026-05-07)
### ⚠️ BREAKING CHANGES
* `@npmcli/agent` now supports node `^22.22.2 || ^24.15.0 || >=26.0.0`
### Features
* [`fa21411`](https://github.com/npm/agent/commit/fa21411091c780e389d01889b3146db082da3415) [#154](https://github.com/npm/agent/pull/154) bump to new node engine range (@owlstronaut)
### Dependencies
* [`6c1b9b3`](https://github.com/npm/agent/commit/6c1b9b336354c01b96aa4c64dbe4d7fdf1c04b7c) [#154](https://github.com/npm/agent/pull/154) `https-proxy-agent@9.0.0`
* [`822ca80`](https://github.com/npm/agent/commit/822ca80a4bea0c36e2336d575e39c88d9b6be4f4) [#154](https://github.com/npm/agent/pull/154) `socks-proxy-agent@10.0.0`
* [`7243503`](https://github.com/npm/agent/commit/72435034ce1439b1a4570447c29b4abd2b42f794) [#154](https://github.com/npm/agent/pull/154) `http-proxy-agent@9.0.0`
* [`a928f1b`](https://github.com/npm/agent/commit/a928f1b7096de5388de8044ce0be55512b123de3) [#154](https://github.com/npm/agent/pull/154) `agent-base@9.0.0`
### Chores
* [`37ca679`](https://github.com/npm/agent/commit/37ca6790006378f88bd1fff2cb2719f1fcee7095) [#154](https://github.com/npm/agent/pull/154) fix tests (@owlstronaut)
* [`1126d9c`](https://github.com/npm/agent/commit/1126d9cc4c020e34771b28dd6997b0c2e2dc8d3c) [#154](https://github.com/npm/agent/pull/154) template-oss-apply (@owlstronaut)
* [`462a88b`](https://github.com/npm/agent/commit/462a88bba72f4a976cd0a8182d8ccc3f6f5e6442) [#154](https://github.com/npm/agent/pull/154) template-oss-apply (@owlstronaut)
* [`80ae79a`](https://github.com/npm/agent/commit/80ae79a9c2a4e430a6f9c5be51750a00994a1253) [#154](https://github.com/npm/agent/pull/154) bumping @npmcli/template-oss from 4.30.0 to 5.0.0 (@owlstronaut)
* [`f090723`](https://github.com/npm/agent/commit/f0907234aeb233bf98401aba64df8366dcdfb06c) [#151](https://github.com/npm/agent/pull/151) inline socksv5 code for tests (#151) (@wraithgar)
* [`43b907b`](https://github.com/npm/agent/commit/43b907b94975884a71c6296068a185355df361d8) [#136](https://github.com/npm/agent/pull/136) bump @npmcli/eslint-config from 5.1.0 to 6.0.0 (#136) (@dependabot[bot])
* [`c6f00b8`](https://github.com/npm/agent/commit/c6f00b85003cb8a4f45ba29a406aa2a8e8254cc9) [#135](https://github.com/npm/agent/pull/135) bump minipass-fetch from 4.0.1 to 5.0.0 (#135) (@dependabot[bot])
* [`662d23a`](https://github.com/npm/agent/commit/662d23a53e823649f44b06d86c73c06569e93b53) [#146](https://github.com/npm/agent/pull/146) bump @npmcli/template-oss from 4.29.0 to 4.30.0 (#146) (@dependabot[bot], @npm-cli-bot)

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
