'use strict';

var express = require('express');
var mysqlx = require('@mysql/xdevapi');
const async = require('async');


async function getMyDb() {
  var mySession = await mysqlx.getSession( {
  host: process.env.MYSQL_HOST, port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER, password: process.env.MYSQL_PASSWORD} );

  await mySession.sql(`USE `+process.env.MYSQL_DATABASE).execute();
  return mySession;
}

function bin2hex(bin) {
  return Buffer.from(bin).toString('hex');
}


async function insertAssociationRecord (associationRecord) {
  var srcid =  associationRecord.srcid;
  var dstid =  associationRecord.dstid;
  var assv = associationRecord.assv;
  var myDb = await getMyDb();

  try {
    var result = await myDb.sql('INSERT INTO Associations SET srcid = 0x'+srcid+', dstid = 0x'+dstid+', assv = '+assv).execute();
    if (result.getAffectedItemsCount()) {
      console.log("Associations record stored in SQL for srcid/dstid: " + srcid + "/" + dstid);
      return true;
    }
  } catch (err) {
    if ('info' in err && 'code' in err.info && err.info.code === 1062) {
      console.error("Associations record already exists: " +srcid + "/" + dstid);
      return true;
    }
    console.error(err);
    return false;
  } finally {
    myDb.close();
  }
  return false;
}


async function getRandomAssociationRecord (srcid) {
  var myDb = await getMyDb();
  try {
    // get the associative values (counts) for all the linked dstid's for this srcid
    var result = await myDb.sql(
      'select dstid, assv ' +
      'from Associations ' +
      'where srcid=0x' + srcid
    ).execute();

    // calculate cumulative probabilities
    var rows = result.fetchAll();
    if (rows == null || rows.length == 0) {
      return null;
    }
    var cumulativeRows = [];
    var cum = 0;
    for (var i=0; i < rows.length; i++) {
      var row = rows[i];
      cum += row[1]; // add assv to cum
      cumulativeRows.push([ row[0], cum ]);
    }

    // get a random one by probability
    var ran = Math.random();
    var max = cumulativeRows[cumulativeRows.length-1][1];
    console.log('max: '+max);
    var recordRaw = null;

    for(var i = 0; i< cumulativeRows.length; i++) {
      recordRaw = cumulativeRows[i];
      if (recordRaw[1] / max <= ran) {
        break;
      }
    }

    if (recordRaw) {
      return bin2hex(recordRaw[0]); //dstid
    }
  } catch (err) {
    console.error(err);
    return null;
  } finally {
    myDb.close();
  }
  return null;
}


async function getAssociationRecord(srcid, dstid) {
  var myDb = await getMyDb();
  try {
    var result = await myDb.sql('SELECT * FROM Associations WHERE srcid = 0x'+srcid+' AND dstid = 0x'+dstid+' LIMIT 1').execute();
    var recordRaw = result.fetchOne();
    if (recordRaw) {
      var record = {
        srcid: bin2hex(recordRaw[0]),
        dstid: bin2hex(recordRaw[1]),
        assv: recordRaw[2]
      };
      return record;
    }
  } catch (err) {
    console.error(err);
    return null;
  } finally {
    myDb.close();
  }
  return null;
}

async function updateAssociationRecord(srcid, dstid, assv) {
  var set = {assv: assv};
  var myDb = await getMyDb();
  try {
    var result = await myDb.sql('UPDATE Associations SET '+set+' WHERE srcid = 0x'+srcid+' AND dstid = 0x'+dstid).execute();
    if (result.getAffectedItemsCount()) {
      console.log("Associations record updated in SQL for srcid/dstid: " + srcid + "/" + dstid);
      return true;
    }
  } catch (err) {
    console.error(err);
    return false;
  } finally {
    myDb.close();
  }
  return false;
}

async function incrementAssociationRecord(srcid, dstid) {
  var myDb = await getMyDb();
  try {
    var result = await myDb.sql('UPDATE Associations SET assv = assv + 1 WHERE srcid = 0x'+srcid+' AND dstid = 0x'+dstid).execute();
    if (result.getAffectedItemsCount()) {
      console.log("Associations record incremented in SQL for srcid/dstid: " + srcid + "/" + dstid);
      return true;
    }
  } catch (err) {
    console.error(err);
    return false;
  } finally {
    myDb.close();
  }
  return false;
}

async function deleteAssociationRecord(srcid, dstid) {
  var myDb = await getMyDb();
  try {
    var result = await myDb.sql('DELETE FROM Associations WHERE srcid = 0x'+srcid+' AND dstid = 0x'+dstid).execute();
    if (result.getAffectedItemsCount()) {
      console.log("Associations record deleted in SQL for srcid/dstid: " + srcid + "/" + dstid);
      return true;
    }
  } catch (err) {
    console.error(err);
    return false;
  } finally {
    myDb.close();
  }
  return false;
}

module.exports = {
  insertAssociationRecord: insertAssociationRecord,
  getRandomAssociationRecord: getRandomAssociationRecord,
  getAssociationRecord: getAssociationRecord,
  updateAssociationRecord: updateAssociationRecord,
  incrementAssociationRecord: incrementAssociationRecord,
  deleteAssociationRecord: deleteAssociationRecord
};