var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var config = require('../../config/config.js');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

describe('getReplNodes', function () {

  /*
    it('getReplNodes() should throw an error when pgpool is not reachable', function() {
      // stubbing config is not working because it is cached and so the stubbed config would always be used
      const badConfigPgp = {
        host: 'badhost',
        port: 9999,
        user: 'repmgr',
        password: 'rep123',
        database: 'repmgr'
      };
      this.configStub = sinon.stub(config, 'pgp').get(function() {
        return badConfigPgp;
      });
      return chai.assert.isRejected(getReplNodes());
    });
  */

  it('getReplNodes() should return an array with two records', function () {
    var getReplNodes = require('../../DAO/pg').getReplNodes;
    return getReplNodes()
      .then(data => {
        expect(data.rows).to.have.length(2);
      })
      .catch(error => {
        console.log('catched ' + error);
        expect.fail('got exception', 'expected result')
      });
  });

});
