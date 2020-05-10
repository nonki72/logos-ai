const { assert } = require('chai')
let app = require('../app');
const Sql = require('../src/sql');
const util = require('util');

describe("Sql associative value storage", async function() {

    describe("Association create get delete", async function() {
      it("Select a random Association", async function() {
        let association = {
            srcid: 12321,
            dstid: 34324,
            assv: 23
        };

        try {
          var deleteAssociationRecord = util.promisify(Sql.deleteAssociationRecord);
          const deleteOut = await deleteAssociationRecord(association.srcid,association.dstid);
          assert.ok(deleteOut);
        } catch(err) {}; 

        try {
          var insertAssociationRecord = util.promisify(Sql.insertAssociationRecord);
          const insertOut = await insertAssociationRecord(association);
          assert.equal(insertOut.affectedRows,1);

          var getAssociationRecord = util.promisify(Sql.getAssociationRecord);
          const getOut = await getAssociationRecord(association.srcid,association.dstid);
          assert.equal(getOut.srcid, association.srcid);
          assert.equal(getOut.dstid, association.dstid);
          assert.equal(getOut.assv, association.assv);  

          const deleteOut2 = await deleteAssociationRecord(association.srcid,association.dstid);
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
        let association1 = {
            srcid: 12321,
            dstid: 11111,
            assv: 23
        };
        let association2 = {
            srcid: 12321,
            dstid: 22222,
            assv: 2
        };
        let association3 = {
            srcid: 12321,
            dstid: 33333,
            assv: 15
        };

        try {
          var insertAssociationRecord = util.promisify(Sql.insertAssociationRecord);
          const insertOut1 = await insertAssociationRecord(association1);
          const insertOut2 = await insertAssociationRecord(association2);
          const insertOut3 = await insertAssociationRecord(association3);
        } catch(err) {}; 

        try {

          var getRandomAssociationRecord = util.promisify(Sql.getRandomAssociationRecord);
          const getRandomOut = await getRandomAssociationRecord(association1.srcid);
          console.log (JSON.stringify(getRandomOut,null ,4))
          assert.isNumber(getRandomOut);

          var deleteAssociationRecord = util.promisify(Sql.deleteAssociationRecord);
          const deleteOut1 = await deleteAssociationRecord(association1.srcid,association1.dstid);
          assert.ok(deleteOut1);
          const deleteOut2 = await deleteAssociationRecord(association2.srcid,association2.dstid);
          assert.ok(deleteOut2);
          const deleteOut3 = await deleteAssociationRecord(association3.srcid,association3.dstid);
          assert.ok(deleteOut3);
        } catch(err) {
          console.log(err);
          assert.fail();
        };
         
        return;
      });
    });


});
