const express = require('express');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');

const stateDir = process.env.STATE_DIR;
const stateFile = process.env.STATE_FILE || "db.sqlite3";
const defaultBank = 'olivia';

async function ensureDatabase(dir, file) {
    if (!dir)
        throw Error("need STATE_DIR for the database");

    if (!fs.existsSync(dir))
        fs.mkdirSync(dir, {recursive: true});

    const fullPath = path.join(dir, file)
    console.log("Opening database:", fullPath);

    const db = await sqlite.open({
        filename: fullPath,
        driver: sqlite3.Database,
    });

    const dbInitFile = path.join(__dirname, 'db.sql');
    const data = fs.readFileSync(dbInitFile, 'utf8');
    console.log("Perparing database with:", dbInitFile);

    await db.exec(data);
    return db;
}

var db = null;

(async () => {
    db = await ensureDatabase(stateDir, stateFile);
})();

var router = express.Router();

const wrapper = (controller) => async (req, res, next) => {
    try {
        await controller(req, res);
    } catch (err) {
        console.error("Unhandled error:", err.stack)
        res.status(500).send({error: err});
    }
};

router.use(express.json());

router.get('/status', wrapper(async (req, res) => {
    const status = await db.get('SELECT * FROM banks WHERE name=?', defaultBank);
    const count = await db.get('SELECT count(*) as count FROM pigs WHERE bank=?', defaultBank);
    status.count = count.count;
    res.send(status);
}));

router.get('/state', wrapper(async (req, res) => {
    const banks = await db.all('SELECT * FROM banks');
    const pigs = await db.all('SELECT * FROM pigs');
    res.send({
        banks: banks,
        pigs: pigs,
    });
}));

router.post('/add', wrapper(async (req, res) => {
    console.log("adding pig:", req.body.id);
    await db.run('INSERT INTO pigs (id) VALUES (?)', req.body.id);
    res.send({id: req.body.id});
}))

router.post('/remove', wrapper(async (req, res) => {
    console.log("removing pig:", req.body.id);
    await db.run('DELETE FROM pigs WHERE id=?', req.body.id);
    res.send({id: req.body.id});
}))

router.post('/dream', wrapper(async (req, res) => {
    console.log("changing pig dream:", req.body.id, req.body.dream);
    await db.run('UPDATE pigs SET dream=? WHERE id=?', req.body.dream, req.body.id);
    res.send({id: req.body.id});
}))

router.post('/notes', wrapper(async (req, res) => {
    console.log("changing pig note:", req.body.id, req.body.notes);
    await db.run('UPDATE pigs SET notes=? WHERE id=?', req.body.notes, req.body.id);
    res.send({id: req.body.id});
}))

module.exports = router;
