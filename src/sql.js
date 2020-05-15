'use strict';

var express = require('express');
var mysqlx = require('@mysql/xdevapi');
const async = require('async');

var _myDb = null;

async function getMyDb() {
  if (_myDb != null) return _myDb;
  var mySession = await mysqlx.getSession( {
  host: process.env.MYSQL_HOST, port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER, password: process.env.MYSQL_PASSWORD} );

  await mySession.sql(`USE `+process.env.MYSQL_DATABASE).execute();
  return mySession;
}

getMyDb();

function bin2hex(bin) {
  return Buffer.from(bin).toString('hex');
}


async function insertAssociationRecord (associationRecord) {
  var srcid =  associationRecord.srcid;
  var dstid =  associationRecord.dstid;
  var assv = associationRecord.assv;

  try {
    var myDb = await getMyDb();
    var result = await myDb.sql('INSERT INTO Associations SET srcid = 0x'+srcid+', dstid = 0x'+dstid+', assv = '+assv).execute();
    console.log("Associations record stored in SQL for srcid/dstid: " + associationRecord.srcid + "/" + associationRecord.dstid);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}


async function getRandomAssociationRecord (srcid) {
  try {
    var myDb = await getMyDb();
    // get cumulative probabilities
    var result = await myDb.sql('SELECT dstid, '+
       'CAST((SELECT sum(assv) ' +
       '      FROM Associations AS b2 ' +
       '     WHERE b2.srcid = 0x'+srcid+' ' +
       '     AND b2.dstid <= Associations.dstid ' +
       '     ) AS FLOAT) / ' +
       '(SELECT sum(assv) FROM Associations) ' +
       'AS CumProb ' +
       'FROM Associations ' +
       'ORDER BY dstid').execute();

    var result2 = await myDb.sql('WITH CPAssociations(dstid, CumProb) AS ( ' +
     'SELECT dstid, ' +
     'CAST((SELECT sum(assv) ' +
          'FROM Associations AS b2 ' +
          'WHERE b2.dstid <= Associations.dstid ' +
          ') AS FLOAT) / ' +
     '(SELECT sum(assv) FROM Associations) ' +
     'FROM Associations ' +
     ') ' +
     'SELECT dstid ' +
     'FROM CPAssociations ' +
     'WHERE CumProb >= '+Math.random()+' ' +
     'ORDER BY CumProb ASC ' +
     'LIMIT 1').execute();

    var recordRaw = result.fetchOne();
    return bin2hex(recordRaw[0]); //dstid
  } catch (err) {
    console.error(err);
    return null;
  }
}


async function getAssociationRecord(srcid, dstid) {
  try {
    var myDb = await getMyDb();
    var result = await myDb.sql('SELECT * FROM Associations WHERE srcid = 0x'+srcid+' AND dstid = 0x'+dstid+' LIMIT 1').execute();
    var recordRaw = result.fetchOne();
    var record = {
      srcid: bin2hex(recordRaw[0]),
      dstid: bin2hex(recordRaw[1]),
      assv: recordRaw[2]
    };
    return record;
  } catch (err) {
    console.error(err);
    return null;
  }

}

async function updateAssociationRecord(srcid, dstid, assv) {
  var set = {assv: assv};
  try {
    var myDb = await getMyDb();
    var result = await myDb.sql('UPDATE Associations SET '+set+' WHERE srcid = 0x'+srcid+' AND dstid = 0x'+dstid).execute();
    console.log("Associations record updated in SQL for srcid/dstid: " + srcid + "/" + dstid);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function incrementAssociationRecord(srcid, dstid) {
  try {
    var myDb = await getMyDb();
    var result = await myDb.sql('UPDATE Associations SET assv = assv + 1 WHERE srcid = 0x'+srcid+' AND dstid = 0x'+dstid).execute();
    console.log("Associations record incremented in SQL for srcid/dstid: " + srcid + "/" + dstid);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }

}

async function deleteAssociationRecord(srcid, dstid) {
  try {
    var myDb = await getMyDb();
    var result = await myDb.sql('DELETE FROM Associations WHERE srcid = 0x'+srcid+' AND dstid = 0x'+dstid).execute();
    console.log("Associations record deleted in SQL for srcid/dstid: " + srcid + "/" + dstid);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

module.exports = {
  insertAssociationRecord: insertAssociationRecord,
  getRandomAssociationRecord: getRandomAssociationRecord,
  getAssociationRecord: getAssociationRecord,
  updateAssociationRecord: updateAssociationRecord,
  incrementAssociationRecord: incrementAssociationRecord,
  deleteAssociationRecord: deleteAssociationRecord
};