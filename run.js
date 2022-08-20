require('dotenv');

const mysql = require('mysql');

const con = mysql.createConnection({
  host: "staging-ditto-mysql.cq8ahneygmzx.us-west-2.rds.amazonaws.com",
  user: "ditto",
  password: "aCMpU3Ew2QzXGitrSTAGING",
  database: "ditto",
});

const tables = [
  "answers",
  "attachments",
  "blocks",
  "categories",
  "contacts",
  "devices",
  "embeds",
  "friends",
  "groups",
  "GroupCategories",
  "hangs",
  "HangCategories",
  "hangMessages",
  "interests",
  "media",
  "messages",
  "hangMessageAttachments",
  "hangMessageEmbeds",
  "pings",
  "prompts",
  "reactions",
  "subcategories",
  "thoughts",
  "thoughtAttachments",
  "thoughtEmbeds",
  "users",
  "UserContacts",
  "userFriendData",
  "userGroupData",
  "userHangData",
  "userThoughtData",
  "userThreadData",
]

const 

con.connect((err) => {
  if(err) throw err;
  console.log("Connected");
  con.query(`SHOW TABLES;`, (err, result) => {
    if (err) throw err;
    console.log(result);
  })
  for (const table of tables) {
    con.query(`SHOW CREATE TABLE ${table};`, (err, result) => {
      if (err) throw err;
      console.log(JSON.stringify(result,null,2));
    });
  }
})
