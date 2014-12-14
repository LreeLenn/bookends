var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

global.expect = chai.expect;
global.fail = chai.assert.fail.bind(chai.assert);
