const { assert } = require('chai')
let app = require('../app');
const Sql = require('../src/sql');
const util = require('util');
var mongo = require('mongodb');
var ObjectID = mongo.ObjectID;

describe("Sql associative value storage", async function() {

    describe("Association create get increment get delete", async function() {
      it("Select a random Association", async function() {
        let association = {
            srcid: new ObjectID(),
            dstid: new ObjectID(),
            assv: 23
        };

        try {
          const deleteOut = await Sql.deleteAssociationRecord(association.srcid,association.dstid);
          assert.ok(deleteOut);
        } catch(err) {}; 

        try {
          const insertOut = await Sql.insertAssociationRecord(association);
          assert.equal(insertOut,true);

          const getOut = await Sql.getAssociationRecord(association.srcid,association.dstid);
          assert.equal(getOut.srcid, association.srcid);
          assert.equal(getOut.dstid, association.dstid);
          assert.equal(getOut.assv, association.assv);

          const incOut = await Sql.incrementAssociationRecord(association.srcid, association.dstid);
          assert.equal(incOut,true);

          const getOut2 = await Sql.getAssociationRecord(association.srcid,association.dstid);
          assert.equal(getOut2.assv,association.assv+1);

          const deleteOut2 = await Sql.deleteAssociationRecord(association.srcid,association.dstid);
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

        try {
          const insertOut1 = await Sql.insertAssociationRecord(association1);
          const insertOut2 = await Sql.insertAssociationRecord(association2);
          const insertOut3 = await Sql.insertAssociationRecord(association3);
        } catch(err) {}; 

        try {

          const getRandomOut = await Sql.getRandomAssociationRecord(association1.srcid);
          assert.isString(getRandomOut);

          const deleteOut1 = await Sql.deleteAssociationRecord(association1.srcid,association1.dstid);
          assert.ok(deleteOut1);
          const deleteOut2 = await Sql.deleteAssociationRecord(association2.srcid,association2.dstid);
          assert.ok(deleteOut2);
          const deleteOut3 = await Sql.deleteAssociationRecord(association3.srcid,association3.dstid);
          assert.ok(deleteOut3);
        } catch(err) {
          console.log(err);
          assert.fail();
        };
         
        return;
      });
    });


});
