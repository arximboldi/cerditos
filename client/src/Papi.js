import {
    useState,
    useEffect,
    useCallback,
} from 'react';

import {Map} from 'immutable';

import {client, debounce, defaultBank} from './service';
import {useScanner} from './scanner';

import './Papi.css';

export function Papi() {
    const [editMode, setEditMode] = useState(false);

    const [state, setState] = useState({
        banks: new Map(),
        pigs: new Map(),
    });

    const [candidates, setCandidates] = useState(new Map());

    function addCandidate(id) {
        setCandidates((v) => v.set(id, 'init'));
    }

    function discardCandidate(id) {
        setCandidates((v) => v.delete(id));
    }

    const scanner = useScanner((pig) => {
        console.log("Pig read!", pig);
        addCandidate(pig);
    });

    async function updateState() {
        const {data} = await client.get("/state")
        setState({
            banks: new Map(data.banks.map((p) => [p.name, p])),
            pigs:  new Map(data.pigs.map((p) => [p.id, p])),
        });
    }

    async function insertPigCandidate(id) {
        setCandidates((v) => v.set(id, 'adding'));
        try {
            await client.post('/add', {id: id})
            await updateState()
            discardCandidate(id)
        } catch(err) {
            console.log("Error adding candidate:", err);
            setCandidates((v) => v.set(id, 'error'))
        }
    }

    async function removePig(id) {
        await client.post('/remove', {id: id});
        console.log("Remove pig!");
        updateState();
    }

    async function takePig(id) {
        await client.post('/take', {id: id, force: true});
        updateState();
    }

    async function revealPig(id) {
        await client.post('/reveal', {id: id, force: true});
        updateState();
    }

    async function savePig(id) {
        await client.post('/save', {id: id});
        updateState();
    }

    async function makeKey(id) {
        await client.post('/key', {id: id});
        console.log("Make key!");
        updateState();
    }

    async function toggleBank() {
        await client.post('/toggle', {force: true});
        updateState();
    }

    const changeDream = useCallback(debounce(200, async (id, dream) => {
        console.log("changing dream: ", id, dream)
        await client.post("/dream", {id: id, dream: dream});
        await updateState();
    }), []);

    const changeNotes = useCallback(debounce(200, async (id, dream) => {
        console.log("changing dream: ", id, dream)
        await client.post("/notes", {id: id, notes: dream});
        await updateState();
    }), []);

    useEffect(() => {
        console.log("Requesting initial state")
        updateState();
    }, []);

    const popups = candidates.toArray().map(([k, v]) => {
        const isInserted = v === 'adding' || state.pigs.has(k);
        const isKey = k === state.banks.get(defaultBank).key;
        return (
            <li className="candidate" key={k}>
                <p>{k}</p>
                <button onClick={()=>makeKey(k)}
                        disabled={isKey || isInserted}>
                    Hacer llave
                </button>
                <span>&nbsp;</span>
                <button onClick={()=>insertPigCandidate(k)}
                        disabled={isInserted}>
                    Añadir
                </button>
                <span>&nbsp;</span>
                <button onClick={()=>discardCandidate(k)}>
                    Descartar
                </button>
            </li>
        );
    })

    const pigs = state.pigs.toArray().map(([id, p]) => {
        const isSelected = candidates.has(id);
        return (
            <li key={id}
                className={isSelected ? "selected" : ""}>
                <p className="pig-header">
                    <span className="pig-id">{id}</span>
                    <span className="pig-controls">
                        <span className="pig-tag">
                            {!editMode && p.bank == defaultBank? "[hucha]" : null}
                            {!editMode && p.ready ? "[listo]" : null}
                        </span>
                        {editMode ? (
                            p.bank == defaultBank ? (<button onClick={()=>takePig(id)}>Sacar</button>)
                                : p.ready ? (<button onClick={()=>revealPig(id)}>Usar</button>)
                                : (<button onClick={()=>savePig(id)}>Meter</button>)
                        ) : null}
                        {editMode ? (
                            <button onClick={()=>removePig(id)}>Borrar</button>
                        ) : null}
                    </span>
                </p>
                <p>
                    <span className="pig-label">sueño:</span>
                    {!editMode ? p.dream : (
                        <input defaultValue={p.dream || ""}
                               onChange={(e)=>changeDream(id, e.target.value)}/>
                    )}
                </p>
                <p>
                    <span className="pig-label">notas:</span>
                    {!editMode ? p.notes : (
                        <input defaultValue={p.notes || ""}
                               onChange={(e)=>changeNotes(id, e.target.value)}/>
                    )}
                </p>
            </li>
        );
    });

    const banks = state.banks.toArray().map(([name, b]) => {
        return (
            <li key={name} className="bank">
                <b>hucha:</b> {b.name}<br/>
                <b>llave:</b> {b.key}<br/>
                {!editMode ? null
                 : (<button onClick={toggleBank}>{b.is_open ? "Cerrar" : "Abrir"}</button>)}
            </li>
        );
    });

    return (
        <div className="papi" id="papi">
            <h1>El panel de papi!</h1>
            {
                scanner.state === 'idle' ? (<button onClick={scanner.start}>ESCANEAR!</button>)
                    : scanner.state === 'starting' ? (<p>Empezando a escanear...</p>)
                    : scanner.state === 'error' ? (<p>No se puede escanear en este dispositivo.</p>)
                    : !popups.length ? (<p>Escaneando....</p>)
                    : null
            }
            <ul className="candidates">{popups}</ul>
            <h3>
                Cerditos
            </h3>
            <div className="cerditos-menu">
                <input type="checkbox" id="edit-mode"
                       defaultChecked={editMode}
                       onChange={(e)=>setEditMode(e.target.checked)}/>
                <label htmlFor="edit-mode">EDITAR</label>
            </div>
            <ul className="banks">
                {banks}
            </ul>
            <ul className="pigs">
                {pigs}
            </ul>
        </div>
    );
}

export default Papi;
