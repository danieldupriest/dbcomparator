const config = require('./config.js');
const mysql = require('mysql');
const util = require('util');

const main = async() => {
  const db1 = makeDb(config.db1);
  const db2 = makeDb(config.db2);

  const data1 = await buildData(db1);
  const data2 = await buildData(db2);

  const report = await generateComparisonReport(data1, data2); 
  displayReport(report, db1, db2);

  await db1.close();
  await db2.close();
}

main();

function displayReport(report, db1, db2) {
  console.log('\n==== The following tables were found to be identical ===\n');
  for (const table of report.identicalTables) {
    console.log(table);
  }

  if (report.extraTables.data1.length > 0) {
    console.log(`\n==== ${db1.config.host} had these extra tables ====\n`);
    
    for (const table of report.extraTables.data1) {
      console.log(table);
    }
  }

  if (report.extraTables.data2.length > 0) {
    console.log(`\n==== ${db2.config.host} had these extra tables ====\n`);
    
    for (const table of report.extraTables.data2) {
      console.log(table);
    }
  }

  console.log('\n==== The following tables had differences ====\n');
  for (const differentTable of report.differentTables) {
    const { diff1, diff2 } = differentTable;

    const db1Header = `Database: ${db1.config.host}`;
    const db2Header = `Database: ${db2.config.host}`;

    const diff1Lengths = diff1.map(d => d.length);
    const widestRow1 = Math.max(...diff1Lengths); 
    const col1MaxWidth = Math.max(db1Header.length, widestRow1);

    const diff2Lengths = diff2.map(d => d.length);
    const widestRow2 = Math.max(...diff2Lengths); 
    const col2MaxWidth = Math.max(db2Header.length, widestRow2);

    let col1Padding = col1MaxWidth - db1Header.length;
    let col2Padding = col2MaxWidth - db2Header.length;

    const totalWidth = col1MaxWidth + col2MaxWidth + 1;
    const titlePadding = totalWidth - differentTable.name.length;

    console.log(`\n┌${'─'.repeat(totalWidth)}┐`)
    console.log(`│${differentTable.name}${' '.repeat(titlePadding)}|`);
    console.log(`├${'─'.repeat(col1MaxWidth)}┬${'─'.repeat(col2MaxWidth)}┤`)
    console.log(`│${db1Header}${' '.repeat(col1Padding)}│${db2Header}${' '.repeat(col2Padding)}│`);    
    console.log(`│${'─'.repeat(col1MaxWidth)}┼${'─'.repeat(col2MaxWidth)}│`);    

    for (let i = 0; i < Math.max(diff1.length, diff2.length); i++) {
      const col1Text = (i < diff1.length) ? diff1[i] : "";
      const col2Text = (i < diff2.length) ? diff2[i] : "";
      
      col1Padding = col1MaxWidth - col1Text.length;
      col2Padding = col2MaxWidth - col2Text.length;

      console.log(`│${col1Text}${' '.repeat(col1Padding)}│${col2Text}${' '.repeat(col2Padding)}│`);
    }

    console.log(`└${'─'.repeat(col1MaxWidth)}┴${'─'.repeat(col2MaxWidth)}┘`)
  }
}

async function generateComparisonReport(data1, data2) {
  const {
    sharedTables,
    extraTables1,
    extraTables2
  } = await analyzeTables(data1, data2);

  const report = {
    identicalTables: [],
    differentTables: [],
    extraTables: {
      data1: extraTables1,
      data2: extraTables2,
    },
  }

  for (const table of sharedTables) {
    const {
      same,
      extra1,
      extra2,
    }  = await findRowDifferences(data1[table], data2[table]); 
    
    if (extra1.length == 0 && extra2.length == 0)
      report.identicalTables.push(table);
    
    else {
      const difference = {
        name: table,
        diff1: extra1,
        diff2: extra2,
      };

      report.differentTables.push(difference);
    }
  }

  return report;
}

async function findRowDifferences(rows1, rows2) {
  const same = [];
  const extra1 = [ ...rows1 ];
  const extra2 = [ ...rows2 ];
  
  for (let i = 0; i < rows1.length; i++) {
    for (let j = 0; j < rows2.length; j++) {
      const row1 = rows1[i];
      const row2 = rows2[j];

      if (syntaxMatch(row1, row2)) {
        const match = {
          data1: row1,
          data2: row2,
        }

        same.push(match);

        const index1 = extra1.indexOf(row1);
        extra1.splice(index1, 1);

        const index2 = extra2.indexOf(row2);
        extra2.splice(index2, 1);

        break;
      }
    }
  }

  return { same, extra1, extra2 };
}

function syntaxMatch(one, two) {
  const match = (one.toLowerCase() == two.toLowerCase());
  return match;
}

async function analyzeTables(first, second) {
  const shared = [];
  const extra1 = [];
  const extra2 = [];

  const firstTables = Object.keys(first);
  const secondTables = Object.keys(second);

  for (const table of firstTables) {
    if (!secondTables.includes(table)) extra1.push(table);
    else shared.push(table);
  }

  for (const table of secondTables) {
    if (!firstTables.includes(table)) extra2.push(table);
  }

  shared.sort();
  extra1.sort();
  extra2.sort();

  return {
    sharedTables: shared,
    extraTables1: extra1,
    extraTables2: extra2,
  };
}

function makeDb(config) {
  const connection = mysql.createConnection(config);

  return {
    config,
    query(sql) {
      return util.promisify(connection.query).call(connection ,sql, []);
    },
    close() {
      return util.promisify(connection.end).call(connection);
    }
  }
}

async function buildData(db) {
  const tables = await getTables(db);
  tables.sort();

  const results = {};

  for (const table of tables) {
    const schemaText = await getCreateSchema(db, table);
    const rows = schemaText.split('\n');
    results[table] = rows;
  }

  return results;
}

async function getTables(db) {
  const tables = await db.query(`
    SELECT * FROM information_schema.tables
    WHERE TABLE_SCHEMA = '${db.config.database}';`
  );
  return tables.map(t => t.TABLE_NAME);
}

async function getCreateSchema(db, table) {
  const results = await db.query(`SHOW CREATE TABLE ${table};`);
  const result = results[0];
  const raw = result['Create Table'];  
  return raw;
}
