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


async function insertECRecord (astid, equid, assv) {
  var myDb = await getMyDb();
  if (assv == null) assv = 1;
  try {
    var sql = (equid == null) ? 
      'INSERT INTO EC SET astid = 0x'+astid+', assv = '+assv
      :
      'INSERT INTO EC SET equid = '+equid+', astid = 0x'+astid+', assv = '+assv;
    var result = await myDb.sql(sql).execute();
    if (result.getAffectedItemsCount()) {
      if (equid == null) equid = result.getAutoIncrementValue();
      console.log("EC record stored in SQL for equid/astid: " + equid + "/" + astid);
      return equid;
    }
  } catch (err) {
    if ('info' in err && 'code' in err.info && err.info.code === 1062) {
      console.error("EC record already exists: " +equid + "/" + astid);
      return equid;
    }
    console.error(err);
    return null;
  } finally {
    myDb.close();
  }
  return null;
}


async function getRandomECAstId (astid) {
  var myDb = await getMyDb();
  try {
    // get a random equid for this astid
    var res = await myDb.sql(
      'select equid ' +
      'from EC ' +
      'where astid=0x' + astid + ' ' +
      'order by rand() ' +
      'limit 1'
    ).execute();
    var recRaw = res.fetchOne();
    if (recRaw == null) {
      console.log('NO EQUIDS FOUND FOR ASTID '+astid)
      return null;
    }
    var equid = recRaw[0];
    // get the associative values (counts) for all the linked astid's for this astid
    var result = await myDb.sql(
      'select astid, assv ' +
      'from EC ' +
      'where equid = ' + equid + ' ' +
      'and astid != 0x' + astid
    ).execute();

    // calculate cumulative probabilities
    var rows = result.fetchAll();
    console.log('ALL THE ASTIDS FOR EQUID '+JSON.stringify(rows,null,4))
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
      return bin2hex(recordRaw[0]); //astid
    }
  } catch (err) {
    console.error(err);
    return null;
  } finally {
    myDb.close();
  }
  return null;
}


async function getAssociativeValue(astid1, astid2) {
  var myDb = await getMyDb();
  try {
    var result = await myDb.sql('SELECT equid FROM EC WHERE astid = 0x'+astid1+' LIMIT 1').execute();
    var recordRaw = result.fetchOne();
    if (recordRaw) {
      var equid = recordRaw[0];
      var result2 = await myDb.sql('SELECT assv FROM EC WHERE equid='+equid+' AND astid=0x'+astid2+' LIMIT 1').execute();
      var recordRaw2 = result2.fetchOne();
      if (recordRaw2) {
        var assv = recordRaw2[0]
        return assv;
      }
    }
  } catch (err) {
    console.error(err);
    return null;
  } finally {
    myDb.close();
  }
  return null;
}

async function updateECRecord(equid, astid, assv) {
  var myDb = await getMyDb();
  try {
    var result = await myDb.sql('UPDATE EC SET assv = '+assv+' WHERE equid = '+equid+' AND astid = 0x'+astid).execute();
    if (result.getAffectedItemsCount()) {
      console.log("EC record updated in SQL for equid/astid: " + equid + "/" + astid);
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

async function incrementECRecord(astid1, astid2) {
  var myDb = await getMyDb();
  try {
    var equid = null;
    var result = await myDb.sql('SELECT equid FROM EC WHERE astid = 0x'+astid1).execute();
    var rows = result.fetchAll();
    if (rows != null && rows.length > 0) {
      var equids = rows.reduce(
        (string, row, i, array) => {
          string += row[0]
          if (i+1 < array.length) string += ', ';
          return string;
        }, 
        '('
      );
      equids += ")";

      var result2 = await myDb.sql('SELECT equid FROM EC WHERE astid = 0x'+astid2+' AND equid IN '+equids).execute();
      var recordRaw = result2.fetchOne();
      if (recordRaw) {
        equid = recordRaw[0];
        var incremented = await auxIncrementECRecord(equid, astid2);
        if (incremented) {
          return true;
        }
      }
    }
    
    var equid1 = await insertECRecord(astid1, equid);
    var equid2 = await insertECRecord(astid2, equid1);
    if (equid1 != null && equid2 != null) {
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

async function auxIncrementECRecord(equid, astid) {
  var myDb = await getMyDb();
  try {
    var result = await myDb.sql('UPDATE EC SET assv = assv + 1 WHERE equid = '+equid+' AND astid = 0x'+astid).execute();
    if (result.getAffectedItemsCount()) {
      console.log("EC record incremented in SQL for equid/astid: " + equid + "/" + astid);
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

async function deleteECRecord(equid, astid) {
  var myDb = await getMyDb();
  try {
    var result = await myDb.sql('DELETE FROM EC WHERE equid = '+equid+' AND astid = 0x'+astid).execute();
    if (result.getAffectedItemsCount()) {
      console.log("EC record deleted in SQL for equid/astid: " + equid + "/" + astid);
      return true;
    }
  } catch (err) {
    console.error(err);
    return false;
  } finally {
    myDb.close();
  }
  return true; // already gone, so .. success (idempotent)
}

module.exports = {
  insertECRecord: insertECRecord,
  getRandomECAstId: getRandomECAstId,
  getAssociativeValue: getAssociativeValue,
  updateECRecord: updateECRecord,
  incrementECRecord: incrementECRecord,
  deleteECRecord: deleteECRecord
};