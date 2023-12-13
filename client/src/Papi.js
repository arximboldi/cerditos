import {
    useState,
    useEffect,
    useCallback,
} from 'react';

import axios from 'axios';
import {Map} from 'immutable';
import readPig from './reader';

import './Papi.css';

const client = axios.create({baseURL: "/api"});
const defaultBank = 'olivia';

client.interceptors.request.use(function (config) {
    document.body.classList.add('loading-indicator');
    return config
}, function (error) {
    return Promise.reject(error);
});

client.interceptors.response.use(function (response) {
    document.body.classList.remove('loading-indicator');
    return response;
}, function (error) {
    document.body.classList.remove('loading-indicator');
    return Promise.reject(error);
});

function debounce(wait, func, immediate) {
    var timeout;
    return function() {
        var context = this, args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};

function Papi() {
    const [editMode, setEditMode] = useState(false);

    const [started, setStarted] = useState(false);

    const [status, setStatus] = useState({
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

    async function updateStatus() {
        const {data} = await client.get("/state")
        setStatus({
            banks: new Map(data.banks.map((p) => [p.name, p])),
            pigs:  new Map(data.pigs.map((p) => [p.id, p])),
        });
    }

    async function insertPigCandidate(id) {
        setCandidates((v) => v.set(id, 'adding'));
        try {
            await client.post('/add', {id: id})
            await updateStatus()
            discardCandidate(id)
        } catch(err) {
            console.log("Error adding candidate:", err);
            setCandidates((v) => v.set(id, 'error'))
        }
    }

    async function removePig(id) {
        await client.post('/remove', {id: id});
        console.log("Remove pig!");
        updateStatus();
    }

    async function makeKey(id) {
        await client.post('/key', {id: id});
        console.log("Make key!");
        updateStatus();
    }

    async function toggleBank() {
        await client.post('/toggle', {force: true});
        updateStatus();
    }

    const changeDream = useCallback(debounce(200, async (id, dream) => {
        console.log("changing dream: ", id, dream)
        await client.post("/dream", {id: id, dream: dream});
        await updateStatus();
    }));

    const changeNotes = useCallback(debounce(200, async (id, dream) => {
        console.log("changing dream: ", id, dream)
        await client.post("/notes", {id: id, notes: dream});
        await updateStatus();
    }));

    useEffect(() => {
        if (started) {
            return readPig((pig) => {
                console.log("Pig read!", pig);
                addCandidate(pig);
            });
        }
    }, [started]);

    useEffect(() => {
        console.log("Requesting status")
        updateStatus();
    }, []);


    const popups = candidates.toArray().map(([k, v]) => {
        const isInserted = v === 'adding' || status.pigs.has(k);
        const isKey = k == status.banks.get(defaultBank).key;
        return <li className="candidate" key={k}>
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
    })

    const pigs = status.pigs.toArray().map(([id, p]) => {
        const isSelected = candidates.has(id);
        return <li key={id}
                   className={isSelected ? "selected" : ""}>
                   <p className="pig-id"><span>{id}</span>
                       {editMode ? (
                           <button onClick={()=>removePig(id)}>
                               Borrar
                           </button>
                       ) : null}
                   </p>
                   <p>
                       <span>sueño:</span>
                       {!editMode ? p.dream : (
                           <input defaultValue={p.dream || ""}
                                  onChange={(e)=>changeDream(id, e.target.value)}/>
                       )}
                   </p>
                   <p>
                       <span>notas:</span>
                       {!editMode ? p.notes : (
                           <input defaultValue={p.notes || ""}
                                  onChange={(e)=>changeNotes(id, e.target.value)}/>
                       )}
                   </p>
               </li>
    });

    const banks = status.banks.toArray().map(([name, b]) => {
        return <li key={name} class="bank">
                   <b>hucha:</b> {b.name}<br/>
                   <b>llave:</b> {b.key}<br/>
                   {!editMode ? null
                    : (<button onClick={toggleBank}>{b.is_open ? "Cerrar" : "Abrir"}</button>)}
               </li>;
    });

    return <div className="papi" id="papi">
               <h1>El panel de papi!</h1>
               {
                   !started ? (<button onClick={()=>setStarted(true)}>ESCANEAR!</button>)
                       : !popups.length ? (<p>Escaneando....</p>)
                       : null
               }
               <ul className="candidates">{popups}</ul>
               <h3>
                   Cerditos
               </h3>
               <div class="cerditos-menu">
                   <input type="checkbox" id="edit-mode"
                          defaultChecked={editMode}
                          onChange={(e)=>setEditMode(e.target.checked)}/>
                   <label htmlFor="edit-mode">EDITAR</label>
               </div>
               <ul class="banks">
                   {banks}
               </ul>
               <ul className="pigs">
                   {pigs}
               </ul>
           </div>
    ;
}

export default Papi;
