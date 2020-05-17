const { assert } = require('chai')
let app = require('../app');
const Sql = require('../src/sql');
const util = require('util');
var mongo = require('mongodb');
var ObjectID = mongo.ObjectID;

describe("Sql associative value storage", async function() {

    describe("Association create get increment get delete", async function() {
      it("Select a random Association", async function() {
        let srcid = new ObjectID();
        let dstid = new ObjectID();
        let assv = 23;

        try {
          const equid = await Sql.insertECRecord(srcid);
          assert.isNumber(equid);

          const equid2 = await Sql.insertECRecord(dstid, equid, assv);
          assert.equal(equid, equid2);

          const assvOut = await Sql.getAssociativeValue(srcid, dstid);
          assert.equal(assv, assvOut);

          const incOut = await Sql.incrementECRecord(srcid, dstid);
          assert.equal(incOut,true);

          const assvOut2 = await Sql.getAssociativeValue(srcid, dstid);
          assert.equal(assvOut2,assv+1);

          const deleteOut = await Sql.deleteECRecord(equid, srcid);
          assert.ok(deleteOut);

          const deleteOut2 = await Sql.deleteECRecord(equid, dstid);
          assert.ok(deleteOut2);
        } catch(err) {
          console.log(err);
          assert.fail();
        };

        return;
      });
    });


    describe("Association create get random", async function() {
      it("Select a random Association", async function() {
        let srcid = new ObjectID();
        let association1 = {
            srcid: srcid,
            dstid: new ObjectID(),
            assv: 23
        };
        let association2 = {
            srcid: srcid,
            dstid: new ObjectID(),
            assv: 2
        };
        let association3 = {
            srcid: srcid,
            dstid: new ObjectID(),
            assv: 15
        };
        
        var equid;
        try {
          equid = await Sql.insertECRecord(association1.srcid);
          const insertOut1 = await Sql.insertECRecord(association1.dstid, equid, association1.assv);
          const insertOut2 = await Sql.insertECRecord(association2.dstid, equid, association2.assv);
          const insertOut3 = await Sql.insertECRecord(association3.dstid, equid, association3.assv);
        } catch(err) {}; 

        try {

          const getRandomOut = await Sql.getRandomECAstId(srcid);
          assert.isString(getRandomOut);
          console.log("got random by association: " + getRandomOut);

          const deleteOut0 = await Sql.deleteECRecord(equid, association1.srcid);
          assert.ok(deleteOut0);
          const deleteOut1 = await Sql.deleteECRecord(equid, association1.dstid);
          assert.ok(deleteOut1);
          const deleteOut2 = await Sql.deleteECRecord(equid, association2.dstid);
          assert.ok(deleteOut2);
          const deleteOut3 = await Sql.deleteECRecord(equid, association3.dstid);
          assert.ok(deleteOut3);
        } catch(err) {
          console.log(err);
          assert.fail();
        };
         
        return;
      });
    });


});
