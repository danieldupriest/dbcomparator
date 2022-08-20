# DB Comparator
Compare table schema between mysql servers and generate a text report of the differences. As the SQL language is case-insensitive, schema with different case but identical letters will be considered equivalent. The report is best viewed in a wide screen terminal or a text editor with small font size.

## Setup

1. Clone the project.
2. Run `npm i` inside the directory.
3. Copy `config.js.sample` to `config.js` and fill in the information for the two databases you wish to compare.

## Running

1. Run `npm run compare`.
