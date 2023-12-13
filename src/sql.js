'use strict';

var mysql = require('mysql2/promise');
const sqlConfig = require('../keys/sql.json');
var mongo = require('mongodb');
var ObjectID = mongo.ObjectID;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
var myPool = mysql.createPool( {
  connectionLimit: 10, debug: false, waitForConnections: true,
  host: sqlConfig.host, port: sqlConfig.port,
  user: sqlConfig.user, password: sqlConfig.pass,
  database: sqlConfig.db
});
async function getMyDb() {

      return myPool;
}

// function bin2hex(bin) {
//   return Buffer.from(bin).toString('hex');
// }


async function insertECRecord (astid, equid, assv) {
  if (typeof astid != 'string' && ObjectID.isValid(astid)) {
    astid = astid.toString();
  }
  if (typeof equid != 'string' && ObjectID.isValid(equid)) {
    equid = equid.toString();
  }
  var myDb = await getMyDb();
  if (assv == null) assv = 1;
  try {
    var sql = (equid == null) ? 
      'INSERT INTO EC SET astid = "'+astid+'", assv = '+assv
      :
      'INSERT INTO EC SET equid = '+equid+', astid = "'+astid+'", assv = '+assv;
    var result = await myDb.query(sql);
    if (result[0].affectedRows) {
      if (equid == null) equid = result[0].insertId;
      console.log("EC record stored in SQL for equid/astid: " + equid + "/" + astid);
      return equid;
    }
  } catch (err) {
    if ('errno' in err && err.errno === 1062) {
      console.log("EC record already exists: " +equid + "/" + astid);
      return equid;
    } else {
      console.error(err);
    }
  }
  return null;
}

// TODO: add fields type argn fnmod fntype fnclas

async function getRandomECAstId (astid) {
  if (typeof astid != 'string' && ObjectID.isValid(astid)) {
    astid = astid.toString();
  }
  var myDb = await getMyDb();
  try {
    // get a random equid for this astid
    var query =
      'select equid ' +
      'from EC ' +
      'where astid="' + astid + '" ' +
      'order by rand() ' +
      'limit 1';
      
    var res = await myDb.query(query);
    var recRaw = res;
    if (recRaw == null) {
      console.log('NO EQUIDS FOUND FOR ASTID '+astid)
      return null;
    }
    var equid = recRaw[0][0].equid;
    // get the associative values (counts) for all the linked astid's for this astid
    var result = await myDb.query(
      'select astid, assv ' +
      'from EC ' +
      'where equid = ' + equid + ' ' +
      'and astid != "' + astid + '"'
    );

    // calculate cumulative probabilities
    var rows = result.results;
    if (rows == null || rows.length == 0) {
      return null;
    }
    console.log(rows.length+' ASTIDS FOR EQUID')
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
    console.log('MAX: '+max);
    var recordRaw = null;

    for(var i = 0; i< cumulativeRows.length; i++) {
      recordRaw = cumulativeRows[i];
      if (recordRaw[1] / max <= ran) {
        break;
      }
    }

    if (recordRaw) {
      return recordRaw[0]; //astid
    }
  } catch (err) {
    console.error(err);
    return null;
  } finally {
    
  }
  return null;
}

async function getRandomByWordFreqency (astid) {
  if (typeof astid != 'string' && ObjectID.isValid(astid)) {
    astid = astid.toString();
  }
  var myDb = await getMyDb();
  try {
    var count = await myDb.query(
        'select COUNT(*) from WordFreq'
    );

    var limit = count / 10;
    var random = getRandomInt(0, limit);

    // get a random equid for this astid
    var res = await myDb.query(
        'select astid ' +
        'from WordFreq ' +
        'order by assv ' +
        'limit ' + random + ' ' +
        'offset ' + random
    );
    var recRaw = res;
    if (recRaw == null) {
      console.error('NO ASTID FOUND FOR RANDOM OFFSET: ' + random)
      return null;
    }
    var astid = recRaw[0];
  } catch (err) {
    console.error(err);
    return null;
  } finally {
    
  }
  return null;
}


async function getAssociativeValue(astid1, astid2) {
  if (typeof astid1 != 'string' && ObjectID.isValid(astid1)) {
    astid1 = astid1.toString();
  }
  if (typeof astid2 != 'string' && ObjectID.isValid(astid2)) {
    astid2 = astid2.toString();
  }
  var myDb = await getMyDb();
  try {
    var result = await myDb.query('SELECT equid FROM EC WHERE astid = "'+astid1+'" LIMIT 1');
    var recordRaw = result.results;
    if (recordRaw) {
      var equid = recordRaw[0];
      var result2 = await myDb.query('SELECT assv FROM EC WHERE equid='+equid+' AND astid="'+astid2+'" LIMIT 1');
      var recordRaw2 = result2;
      if (recordRaw2) {
        var assv = recordRaw2[0]
        return assv;
      }
    }
  } catch (err) {
    console.error(err);
    return null;
  } finally {
    
  }
  return null;
}

async function updateECRecord(equid, astid, assv) {
  if (typeof astid != 'string' && ObjectID.isValid(astid)) {
    astid = astid.toString();
  }
  if (typeof equid != 'string' && ObjectID.isValid(equid)) {
    equid = equid.toString();
  }
  var myDb = await getMyDb();
  try {
    var result = await myDb.query('UPDATE EC SET assv = "'+assv+'" WHERE equid = '+equid+' AND astid = "'+astid+'"');
    if (result[0].affectedRows) {
      console.log("EC record updated in SQL for equid/astid: " + equid + "/" + astid);
      return true;
    }
  } catch (err) {
    console.error(err);
    return false;
  } finally {
    
  }
  return false;
}


// TODO when an astid is found with rows of differing equids, merge the two equivalence classes together to use one equid
async function incrementECRecord(astid1, astid2) {
  if (typeof astid1 != 'string' && ObjectID.isValid(astid1)) {
    astid1 = astid1.toString();
  }
  if (typeof astid2 != 'string' && ObjectID.isValid(astid2)) {
    astid2 = astid2.toString();
  }
  var myDb = await getMyDb();
  try {
    // find if equivalence class exists for either one of these
    var equid = null;
    var result1 = await myDb.query('SELECT equid, astid FROM EC WHERE astid = "'+astid1 + '"');
    var rows1 = result1[0];
    var result2 = await myDb.query('SELECT equid, astid FROM EC WHERE astid = "'+astid2 + '"');
    var rows2 = result2[0];

    // more than one EC row found
    var rows = rows1.concat(rows2);
    if (rows != null && rows.length > 1) {
      // there is more than one row
      // so there might be multiple equids
      // since equid+astid are unique sql column pairs
      // this means there is definately more than one equid (equivalence class)
      // if there are more than two rows
      // but since either astid is found in all of these they are actually the same
      // equivalence class
      // this is where they get merged, if needed
      var equidToMergeInto;
      var highestCount = 0;
      // get a list of all the unique equids along with their occurance count
      var equidsWithCounts = rows.reduce((total, row) => {
        let thisEquid = row.equid;
        let thisCountSoFar;
        if (!total.includes(thisEquid)) {
          total.push([thisEquid,1]);
          thisCountSoFar = 1;
        } else {
          let thisEquidIndex = total.indexOf(thisEquid);
          thisCountSoFar = total[thisEquidIndex][1] + 1;
          total[thisEquidIndex][1] = thisCountSoFar;
        }
        if (thisCountSoFar > highestCount) {
          highestCount = thisCountSoFar;
          equidToMergeInto = thisEquid;
        }
        return total;
      }, []);
      // now get a simple list of all the equids that are not the one we are going to merge into
      var equidsToMerge = equidsWithCounts.reduce((total, entry) => {
        let thisEquid = entry[0];
        let thisCount = entry[1];
        if (thisCount < highestCount) total.push(thisEquid);
        return total;
      }, []);
      // actually perform the merge by changing all the other equids to the equidToMergeInto
      if (equidsToMerge.length > 0) {
        var equidsToMergeString = equidsToMerge.reduce((string, entry, index) => {
          string += entry;
          if (index+1 < equidsToMerge.length) string += ', ';
          return string;
        }, '(');
        equidsToMergeString += ')';
        var res2 = await myDb.query('UPDATE EC SET equid = '+equidToMergeInto+' WHERE equid IN '+equidsToMergeString);
        if (res2[0].affectedRows >= 1) {
          throw new Error("Failed to merge EC equid "+equidToMergeInto+" for "+equidsToMergeString);
        }
        console.log("EC records merged in SQL to equid " + equidToMergeInto + " for " + equidsToMergeString);
      }
      // ensure records for both astids exist
      var equidApplied = await ensureBothRecordsExist(equidToMergeInto, astid1, astid2);
      if (equidApplied == null) return false;
      // now have many rows for same equid, this is the fixed state
      // actually increment the existing record
      var incremented = await auxIncrementECRecord(equidToMergeInto, astid2);
      if (!incremented) return false;
      return equidToMergeInto;
    }

    // there is only one row, or no rows

    // select one of these to be the final equid
    if (rows1 != null && rows1.length > 0) equid = rows1[0][0];
    else if (rows2 != null && rows2.length > 0) equid = rows2[0][0];
    // equid might still be null, thats fine one will be generated
    
    // ensure records for both astids exist
    equid = await ensureBothRecordsExist(equid, astid1, astid2);
    if (equid == null) return false;
    // actually increment the existing record
    var incremented = await auxIncrementECRecord(equid, astid2);
    if (!incremented) return false;
    return equid;
  } catch (err) {
    console.error(err);
    return false;
  } finally {
    
  }
}


// make zero, one, or two records using the same equid
// if equid is null it will be generated
async function ensureBothRecordsExist(equid, astid1, astid2) {
  if (typeof astid1 != 'string' && ObjectID.isValid(astid1)) {
    astid1 = astid1.toString();
  }
  if (typeof astid2 != 'string' && ObjectID.isValid(astid2)) {
    astid2 = astid2.toString();
  }
  if (typeof equid != 'string' && ObjectID.isValid(equid)) {
    equid = equid.toString();
  }
  // equid is pass by value, dont need to worry about changing it here
  try {
    await insertECRecord(astid1, equid);
    console.log("Created EC "+equid+" for "+astid1);

    await insertECRecord(astid2, equid);
    console.log("Created EC "+equid+" for "+astid2);
  } catch (err) {
    console.error(err);
    return null;
  }
  return equid;
}

async function auxIncrementECRecord(equid, astid) {
  if (typeof astid != 'string' && ObjectID.isValid(astid)) {
    astid = astid.toString();
  }
  if (typeof equid != 'string' && ObjectID.isValid(equid)) {
    equid = equid.toString();
  }
  var myDb = await getMyDb();
  try {
    var result = await myDb.query('UPDATE EC SET assv = assv + 1 WHERE equid = '+equid+' AND astid = "'+astid + '"');
    if (result[0].affectedRows >= 1) {
      console.log("EC record incremented in SQL for equid/astid: " + equid + "/" + astid);
      return true;
    }
    throw new Error("Failed to increment existing EC: "+equid+" and astid "+astid);
    console.error(JSON.stringify(result,null,4));
  } catch (err) {
    console.error(err);
    return false;
  } finally {
    
  }
  return false;
}

async function deleteECRecord(equid, astid) {
  if (typeof astid != 'string' && ObjectID.isValid(astid)) {
    astid = astid.toString();
  }
  if (typeof equid != 'string' && ObjectID.isValid(equid)) {
    equid = equid.toString();
  }
  var myDb = await getMyDb();
  try {
    var result = await myDb.query('DELETE FROM EC WHERE equid = '+equid+' AND astid = "'+astid + '"');
    if (result[0].affectedRows) {
      console.log("EC record deleted in SQL for equid/astid: " + equid + "/" + astid);
      return true;
    }
  } catch (err) {
    console.error(err);
    return false;
  } finally {
    
  }
  return true; // already gone, so .. success (idempotent)
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
  insertECRecord: insertECRecord,
  getRandomECAstId: getRandomECAstId,
  getAssociativeValue: getAssociativeValue,
  updateECRecord: updateECRecord,
  incrementECRecord: incrementECRecord,
  deleteECRecord: deleteECRecord
};