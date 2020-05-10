const { assert } = require('chai')
let app = require('../app');
const Sql = require('../src/sql');

describe("Sql associative value storage", function() {

    describe("Association select", function() {
      it("Select a random Association", function(done) {
        let association = {
            srcid: 12321,
            dstid: 34324,
            assv: 23
        };


        Sql.deleteAssociationRecord(association.srcid,association.dstid, function(err, deleted) {
          if (err) {
            assert.fail(err);
          }

          assert.ok(deleted);

          Sql.insertAssociationRecord(association, function(err, result) {
            if (err) {
              assert.fail(err);
            }

            Sql.getAssociationRecord(association.srcid,association.dstid, function(err, result) {
              if (err) {
                assert.fail(err);
              }

              assert.equal(result.srcid, association.srcid);
              assert.equal(result.dstid, association.dstid);
              assert.equal(result.assv, association.assv);  

              Sql.deleteAssociationRecord(association.srcid,association.dstid, function(err, deleted) {
                if (err) {
                  assert.fail(err);
                }

                assert.ok(deleted);
                done();
              });
            });
          });
        });
      });
    });


});
