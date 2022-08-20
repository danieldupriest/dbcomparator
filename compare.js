const config = require('./config.js');
const mysql = require('mysql');
const util = require('util');

function makeDb(config) {
  const connection = mysql.createConnection(config);

  return {
    query(sql, args) {
      return util.promisify(connection.query).call(connection ,sql, args = []);
    },
    close() {
      return util.promisify(connection.end).call(connection);
    }
  }
}

const main = async() => {
  const db1 = makeDb(config.db1);
  const db2 = makeDb(config.db2);

  
  const tables1 = await getTables(db1);
  //console.log(tables1);
  //const schema1 = await getCreateSchema(con1, 'friends');

  await db1.close();
  await db2.close();
}

const getTables = async(db) => {
  const tables = await db.query('SELECT table_name FROM information_schema.tables');
  console.log(tables);
}

const getCreateSchema = async(con, table) => {
  return await query(con, `SHOW CREATE TABLE ${table};`);
}

main();
