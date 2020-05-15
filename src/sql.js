'use strict';

var express = require('express');
var mysql = require('mysql');
const async = require('async');

var pool;

function handleDisconnect() {
  pool = mysql.createPool({
    connectionLimit : 10,
    acquireTimeout: 30000, //30 secs
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    host: process.env.MYSQL_HOST,
//    socketPath: process.env.MYSQL_SOCKET_PATH,
    database: process.env.MYSQL_DATABASE
  });                                             // Recreate the connection, since
                                                  // the old one cannot be reused.
  pool.on('error', function(err) {
    console.log('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect();                         // lost due to either server restart, or a
    } else {                                      // connnection idle timeout (the wait_timeout
      throw err;                                  // server variable configures this)
    }
  });
}

handleDisconnect();

function bin2hex(bin) {
  return parseInt(bin, 2).toString(16).toUpperCase();
}


function insertAssociationRecord (associationRecord, callback) {
  var srcid =  associationRecord.srcid;
  var dstid =  associationRecord.dstid;
  var assv = associationRecord.assv;

  pool.query('INSERT INTO Associations SET srcid = 0x'+srcid+', dstid = 0x'+dstid+', assv = '+assv, function (err, result) {
      if (err) {
        return callback(err);
      }

      console.log("Associations record stored in SQL for srcid/dstid: " + associationRecord.srcid + "/" + associationRecord.dstid);
      return callback(null, result);
    });
}


function getRandomAssociationRecord (srcid, callback) {
    // get cumulative probabilities
  pool.query('SELECT dstid, '+
       'CAST((SELECT sum(assv) ' +
       '      FROM Associations AS b2 ' +
       '     WHERE b2.srcid = 0x'+srcid+' ' +
       '     AND b2.dstid <= Associations.dstid ' +
       '     ) AS FLOAT) / ' +
       '(SELECT sum(assv) FROM Associations) ' +
       'AS CumProb ' +
       'FROM Associations ' +
       'ORDER BY dstid ', function (err, results) {
       if (err) {
         return callback(err);
       }

       pool.query('WITH CPAssociations(dstid, CumProb) AS ( ' +
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
         'WHERE CumProb >= ? ' +
         'ORDER BY CumProb ASC ' +
         'LIMIT 1', [Math.random()], function (err, results) {

          if (err || !results || results.length == 0) {
            return callback(err);
          }

          callback(null, bin2hex(results[0].dstid));
        });
     });
}


function getAssociationRecord(srcid, dstid, callback) {
  pool.query('SELECT * FROM Associations WHERE srcid = 0x'+srcid+' AND dstid = 0x'+dstid+' LIMIT 1', function (err, res) {
    if (err) {
      return callback(err);
    }

    var record = res[0];
    if (record) {
      record.srcid = bin2hex(record.srcid);
      record.dstid = bin2hex(record.dstid);
    }

    return callback(null, record);
  });
}

function updateAssociationRecord(srcid, dstid, assv, callback) {
  var set = {assv: assv};
  pool.query('UPDATE Associations SET ? WHERE srcid = 0x'+srcid+' AND dstid = 0x'+dstid, [set], function (err, res) {
    if (err) {
      return callback(err);
    }
    console.log("Associations record updated in SQL for srcid/dstid: " + srcid + "/" + dstid);
    return callback(null, res);
  });
}

function incrementAssociationRecord(srcid, dstid, callback) {
  pool.query('UPDATE Associations SET assv = assv + 1 WHERE srcid = 0x'+srcid+' AND dstid = 0x'+dstid, function (err, res) {
    if (err) {
      return callback(err);
    }
    console.log("Associations record incremented in SQL for srcid/dstid: " + srcid + "/" + dstid);
    return callback(null, res);
  });
}

function deleteAssociationRecord(srcid, dstid, callback) {
  pool.query('DELETE FROM Associations WHERE srcid = 0x'+srcid+' AND dstid = 0x'+dstid, function (err, res) {
    if (err) {
      return callback(err, false);
    }
    console.log("Associations record deleted in SQL for srcid/dstid: " + srcid + "/" + dstid);
    return callback(null, true);
  });
}

module.exports = {
  insertAssociationRecord: insertAssociationRecord,
  getRandomAssociationRecord: getRandomAssociationRecord,
  getAssociationRecord: getAssociationRecord,
  updateAssociationRecord: updateAssociationRecord,
  incrementAssociationRecord: incrementAssociationRecord,
  deleteAssociationRecord: deleteAssociationRecord
};