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


});
