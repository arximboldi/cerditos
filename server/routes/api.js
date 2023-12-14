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

// simplified state
router.get('/status', wrapper(async (req, res) => {
    const bank = await db.get('SELECT * FROM banks WHERE name=?', defaultBank);
    const count = await db.get('SELECT count(*) as count FROM pigs WHERE bank=?', defaultBank);
    const pigs = await db.all('SELECT id, bank, ready, kind FROM pigs');
    res.send({
        bank: bank,
        count: count,
        pigs: pigs,
    });
}));

router.get('/state', wrapper(async (req, res) => {
    const banks = await db.all('SELECT * FROM banks');
    const pigs = await db.all('SELECT * FROM pigs');
    res.send({
        banks: banks,
        pigs: pigs,
    });
}));

router.post('/key', wrapper(async (req, res) => {
    const {id} = req.body;
    console.log("changing key:", id);
    await db.run('UPDATE banks SET key=? WHERE name=?', id, defaultBank);
    res.send({id: id});
}))

router.post('/toggle', wrapper(async (req, res) => {
    const {force, key} = req.body;
    const b = await db.get("SELECT key, is_open FROM banks WHERE name=?", defaultBank);
    if (force || b.key == key) {
        await db.run('UPDATE banks SET is_open=? WHERE name=?',
                     !b.is_open,
                     defaultBank);
        res.send({is_open: !b.is_open});
    } else {
        res.status(403).send({is_open: b.is_open});
    }
}))

router.post('/add', wrapper(async (req, res) => {
    const {id} = req.body;
    console.log("adding pig:", id);
    await db.run('INSERT INTO pigs (id) VALUES (?)', id);
    res.send({id: id});
}))

router.post('/remove', wrapper(async (req, res) => {
    const {id} = req.body;
    console.log("removing pig:", id);
    await db.run('DELETE FROM pigs WHERE id=?', id);
    res.send({id: id});
}))

router.post('/save', wrapper(async (req, res) => {
    const {id} = req.body;
    console.log("put pig in bank:", id);
    await db.run('UPDATE pigs SET bank=? WHERE id=?', defaultBank, req.body.id);
    res.send({id: req.body.id, bank: defaultBank});
}))

router.post('/take', wrapper(async (req, res) => {
    const {id, force} = req.body;
    const {is_open} = await db.get('SELECT is_open FROM banks WHERE name=?', defaultBank);
    if (force || is_open) {
        console.log("put pig in bank:", id);
        await db.run('UPDATE pigs SET bank=null, ready=true WHERE id=?', id);
        res.send({id: id});
    } else {
        res.status(403).send({id: id, bank: defaultBank});
    }
}))

router.post('/reveal', wrapper(async (req, res) => {
    const {id, force} = req.body;
    const {bank, ready, dream} = await db.get('SELECT ready, dream FROM pigs WHERE id=?', id);
    if (force || (ready && !bank)) {
        await db.run('UPDATE pigs SET bank=null, ready=false WHERE id=?', id);
        res.send({id: id, dream: dream});
    } else {
        res.status(403).send({id: id});
    }
}))

router.post('/dream', wrapper(async (req, res) => {
    const {id, dream} = req.body;
    console.log("changing pig dream:", id, dream);
    await db.run('UPDATE pigs SET dream=? WHERE id=?', dream, id);
    res.send({id: id, dream: dream});
}))

router.post('/notes', wrapper(async (req, res) => {
    const {id, notes} = req.body;
    console.log("changing pig notes:", id, notes);
    await db.run('UPDATE pigs SET notes=? WHERE id=?', notes, id);
    res.send({id: id, notes: notes});
}))

router.post('/kind', wrapper(async (req, res) => {
    const {id, kind} = req.body;
    console.log("changing pig kind:", id, kind);
    await db.run('UPDATE pigs SET kind=? WHERE id=?', kind, id);
    res.send({id: id, kind: kind});
}))

module.exports = router;
