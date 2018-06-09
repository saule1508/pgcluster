var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var backupExists = require('../../business/backup').backupExists;
var utils = require('../../business/utils');

describe('backupExists',function(){
  beforeEach(function(){
    var expectedResponse = {result: ['20180604_backup','20180605_backup','test'], error: null};
    this.getFilesForHostStub = sinon.stub(utils,'getFilesForHost')
    .returns(new Promise((resolve)=>resolve(expectedResponse)))
  })
  afterEach( function() {;
    this.getFilesForHostStub.restore();
  });


  it('backupExists() should throw an error when not stubbed',function(){
    this.getFilesForHostStub.restore();
    backupExists('pg01','20180604_backup')
    .then((found)=>{
      assert.fail("expected to go in catch block");
    })
    .catch((error)=>{
       let catched = true;
       expect(catched).to.be.true;
    })
  });

  it('backupExists() should return true if directory exists',function(){

      backupExists('pg01','test')
      .then((found)=>{
        expect(found).to.be.true;
      })
     .catch((e)=>{
        console.log('catched');
        console.log(e);
        assert.fails("should not be catched");
     })
  });

  it('backupExists() should return false if directory does not exist',function(){
      backupExists('pg01','dummydir')
      .then((found)=>{
        expect(found).to.be.false;
      })
     .catch((e)=>{
        assert.fails("should not be catched");
     })

  });

  it('backupExists() should return false when directories list is empty',function(){
    var expectedResponse = {result: [], error: null};
    this.getFilesForHostStub
    .returns(new Promise((resolve)=>resolve(expectedResponse)));

    backupExists('pg01','20180604_backup')
    .then((found)=>{
      expect(found).to.be.false;
    })
    .catch((e)=>{
      assert.fails("should not be catched");
    })
  });
  it('backupExists() should throw when getFilesFromHost throws an error',function(){
    this.getFilesForHostStub.restore();
    this.getFilesForHostStub = sinon.stub(utils,'getFilesForHost')
    .returns(new Promise((resolve,reject)=>reject("something bad")));

    backupExists('pg01','20180604_backup')
    .then((found)=>{
      assert.fails("Exception should be catched");
    })
    .catch((e)=>{
      expect(true).to.be.true;
    })
  });


})


