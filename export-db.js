const Database = require('better-sqlite3');
const fs = require('fs');

const db = new Database('prisma/dev.db');

const tables = ['Semester', 'Subject', 'Material', 'Task', 'SubjectNote', 'ClassSchedule', 'Attachment'];

tables.forEach(table => {
  const rows = db.prepare('SELECT * FROM ' + table).all();
  if (rows.length > 0) {
    const headers = Object.keys(rows[0]).join(',');
    const csvData = rows.map(row =>
      Object.values(row).map(val =>
        typeof val === 'string' && val.includes(',') ? '"' + val.replace(/"/g, '""') + '"' : val
      ).join(',')
    ).join('\n');
    const csv = headers + '\n' + csvData;
    fs.writeFileSync(table + '.csv', csv);
    console.log('✅ Exported ' + table + ': ' + rows.length + ' records');
  }
});

db.close();
console.log('📁 All tables exported to CSV files');