import {
    useState,
    useEffect,
    useCallback,
} from 'react';

import {Map, Set} from 'immutable';

import {client, debounce, defaultBank, defaultKinds} from './service';
import {useScanner} from './scanner';

import './Papi.css';

const stateTypes = ['fuera', 'hucha', 'listo'];
const showTypes = ['sueño', 'notas', 'tipo'];

function setToggle(s, v) {
    return s.has(v) ? s.delete(v) : s.add(v);
}

export function Papi() {
    const [editMode, setEditMode] = useState(false);

    const [state, setState] = useState({
        banks: new Map(),
        pigs: new Map(),
    });

    const [candidates, setCandidates] = useState(new Map());

    const [filter, setFilter] = useState({
        kinds: new Set(),
        states: new Set(),
    });

    const [show, setShow] = useState(new Set());

    function filterPig([id, p]) {
        return (filter.kinds.isEmpty() || filter.kinds.has(p.kind)) &&
            (filter.states.isEmpty()
             || (filter.states.has('listo') && p.ready)
             || (filter.states.has('hucha') && p.bank)
             || (filter.states.has('fuera') && !p.bank));
    }

    function toggleFilterKind(k) {
        setFilter({...filter, kinds: setToggle(filter.kinds, k) });
    }

    function toggleFilterState(k) {
        setFilter({...filter, states: setToggle(filter.states, k) });
    }

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
            pigs:  new Map(data.pigs.map((p) => [p.id, {
                ...p, timestamp: new Date(p.timestamp)
            }])),
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
        discardCandidate(id);
        updateState();
    }

    async function toggleBank() {
        await client.post('/toggle', {force: true});
        updateState();
    }

    const changeKind = useCallback(debounce(200, async (id, kind) => {
        console.log("changing kind: ", id, kind)
        await client.post("/kind", {id: id, kind: kind});
        await updateState();
    }), []);

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

    const thePigs = state.pigs.toArray()
          .filter(filterPig)
          .sort(([_1, a], [_2, b]) => b.timestamp.getTime() - a.timestamp.getTime());

    const pigs = thePigs.map(([id, p]) => {
        const isSelected = candidates.has(id);
        return (
            <li key={id}
                className={isSelected ? "selected" : ""}>
                <p className="pig-header">
                    <span className={`pig-header-kind kind-${p.kind}`}></span>
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
                {show.has('sueño') && (
                    <p>
                        <span className="pig-label">sueño:</span>
                        {!editMode ? p.dream : (
                            <input defaultValue={p.dream || ""}
                                   onChange={(e)=>changeDream(id, e.target.value)}/>
                        )}
                    </p>)}
                {show.has('notas') && (
                    <p>
                        <span className="pig-label">notas:</span>
                        {!editMode ? p.notes : (
                            <input defaultValue={p.notes || ""}
                                   onChange={(e)=>changeNotes(id, e.target.value)}/>
                        )}
                    </p>)}
                {show.has('tipo') && (
                    <p>
                        <span className="pig-label">tipo:</span>
                        {!editMode ? p.kind : defaultKinds.map((kind) => (
                            <span key={kind}>
                                <input type="checkbox" id={`pig-kind-${kind}-${id}`}
                                       checked={p.kind == kind}
                                       onChange={(e)=>changeKind(id, kind)}/>
                                <label htmlFor={`pig-kind-${kind}-${id}`}>{kind}</label>
                            </span>
                        ))}
                    </p>)}
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
            <h1>¡El panel de control de papi!</h1>
            {
                scanner.state === 'idle' ? (<button onClick={scanner.start}>ESCANEAR!</button>)
                    : scanner.state === 'starting' ? (<p>Empezando a escanear...</p>)
                    : scanner.state === 'error' ? (<p>No se puede escanear en este dispositivo.</p>)
                    : !popups.length ? (<p>Escaneando....</p>)
                    : null
            }
            <ul className="candidates">{popups}</ul>
            <h3>
                Cerditos {state.pigs.size}/{pigs.length}
            </h3>
            <div className="cerditos-menu">
                {
                    showTypes.map((t) => (
                        <span key={t}>
                            <input type="checkbox" id={`show-${t}`}
                                   defaultChecked={show.has(t)}
                                   onChange={(e)=>setShow(setToggle(show, t))} />
                            <label htmlFor={`show-${t}`}>{t}</label>
                        </span>
                    ))
                }&nbsp;
                <input type="checkbox" id="edit-mode"
                       defaultChecked={editMode}
                       onChange={(e)=>setEditMode(e.target.checked)}/>
                <label htmlFor="edit-mode">EDITAR</label>
            </div>
            <ul className="banks">
                {banks}
            </ul>
            <div className="filters">
                tipo: {
                    defaultKinds.map((kind) => (
                        <span key={kind}>
                            <input type="checkbox" id={`kind-filter-${kind}`}
                                   checked={filter.kinds.has(kind)}
                                   onChange={(e)=>toggleFilterKind(kind)}/>
                            <label htmlFor={`kind-filter-${kind}`}>{kind}</label>
                        </span>
                    ))
                }
                &nbsp; estado: {
                    stateTypes.map((s) => (
                        <span key={s}>
                            <input type="checkbox" id={`state-filter-${s}`}
                                   checked={filter.states.has(s)}
                                   onChange={(e)=>toggleFilterState(s)}/>
                            <label htmlFor={`state-filter-${s}`}>{s}</label>
                        </span>
                    ))
                }
            </div>
            <ul className="pigs">
                {pigs}
            </ul>
        </div>
    );
}

export default Papi;
