var express = require('express');
var fs = require('fs');
var path = require('path');
var sqlite = require('sqlite3').verbose();

const stateDir = process.env.STATE_DIR;
const stateFile = process.env.STATE_FILE || "db.sqlite3";

function ensureDatabase(dir, file) {
    if (!dir)
        throw Error("need STATE_DIR for the database");

    if (!fs.existsSync(dir))
        fs.mkdirSync(dir, {recursive: true});

    const fullPath = path.join(dir, file)
    console.log("Opening database:", fullPath);

    const db = new sqlite.Database(fullPath, (err) => {
        if (err) console.error("Database error:", err.message);
    });

    const dbInitFile = path.join(__dirname, 'db.sql');
    const data = fs.readFileSync(dbInitFile, 'utf8');
    console.log("Perparing database with:", dbInitFile);
    db.exec(data);

    return db;
}

var db = ensureDatabase(stateDir, stateFile);

var router = express.Router();

router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});

module.exports = router;
