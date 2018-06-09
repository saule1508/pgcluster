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
    let catched = false;
    backupExists('pg01','20180604_backup')
    .then((data)=>{
       expect(catched).to.be.true;
    })
    .catch((error)=>{
       catched = true;
       expect(catched).to.be.true;
    })
  });

  it('backupExists() should return true if directory exists',function(){

    backupExists('pg01','test')
    .then((data)=>{
       expect(data).to.be.true;
    })
    .catch((error)=>{
       console.log('catched: ' + error);
       found = false;
       expect(found).to.be.false;
    })
  });

  it('backupExists() should return false if directory does not exist',function(){

    backupExists('pg01','somedir')
    .then((data)=>{
       expect(data).to.be.false;
    })
    .catch((error)=>{
       console.log(error);
       found = false;
       expect(found).to.be.false;
    })
  });

  it('backupExists() should return false when directories list is empty',function(){
    var expectedResponse = {result: [], error: null};
    this.getFilesForHostStub
    .returns(new Promise((resolve)=>resolve(expectedResponse)));

    backupExists('pg01','20180604_backup')
    .then((data)=>{
       expect(data).to.be.false;
    })
    .catch((error)=>{
       console.log('catching ');
       console.log(error);
       found = false;
       expect(found).to.be.true;
    })
  });
})


