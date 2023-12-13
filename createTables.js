// Copyright 2015-2016, Google, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// [START createTables]
'use strict';

// [START setup]
var mysqlx = require('@mysql/xdevapi');
var prompt = require('prompt');
const async = require('async');
const sqlConfig = require('./keys/sql.json');

async function getMyDb() {
  var mySession = await mysqlx.getSession( {
  host: sqlConfig.host, port: 33060,
  user: sqlConfig.user, password: sqlConfig.pass} );

  const mySchema = mySession.getSchema(sqlConfig.db);
  if (!(await mySchema.existsInDatabase())) {
    await mySession.createSchema(sqlConfig.db);
  }

  await mySession.sql(`USE `+sqlConfig.db).execute();
  return mySession;
}

// [END setup]

// [START createTable]

var SQL_STRING_EC = 'CREATE TABLE EC (\n' +
'    equid BIGINT NOT NULL AUTO_INCREMENT,\n' +
'    astid VARCHAR(24) NOT NULL,\n' +
'    assv BIGINT UNSIGNED NOT NULL,\n' +
'    INDEX (equid),\n' +
'    INDEX (astid), \n' +
'    INDEX (assv),\n' +
'    INDEX (equid,astid),\n' +
'    UNIQUE (equid, astid)\n' +
');';


async function createECTable () {
  try {
    var myDb = await getMyDb();
    return await myDb.sql(SQL_STRING_EC).execute();
  } catch (err) {
    console.error(err);
  }
}

// [START main]
async function main() {
  var result = await createECTable();
  if (result) {
    console.log(result.getResults());
  }
}
main();
// [END main]
// [END createTables]
