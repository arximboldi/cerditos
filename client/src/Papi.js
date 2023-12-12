import { useState, useEffect } from 'react'
import axios from 'axios';
import {Map} from 'immutable';
import readPig from './reader';

const client = axios.create({baseURL: "/api"});


function Papi() {
    const [started, setStarted] = useState(false);

    const [status, setStatus] = useState({
        banks: [],
        pigs: new Map(),
    });

    const [candidates, setCandidates] = useState(new Map());

    function addCandidate(id) {
        setCandidates((v) => v.set(id, 'init'));
    }

    function discardCandidate(id) {
        setCandidates((v) => v.delete(id));
    }

    function updateStatus() {
        client.get("/state").then(data => {
            console.log("Received data!", data.data);
            const newStatus = data.data;
            newStatus.pigs = new Map(data.data.pigs.map((p) => [p.id, p]));
            setStatus(data.data);
        });
    }

    function insertCandidate(id) {
        setCandidates((v) => v.set(id, 'adding'));
        client.post('/add', {id: id})
            .then(() => {
                console.log("Added candidate!")
                discardCandidate(id)
                updateStatus();
            }).catch((err) => {
                console.log("Error adding candidate:", err);
                setCandidates((v) => v.set(id, 'error'))
            });
    }

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

    const intro = started
          ? (<p>Escaneando....</p>)
          : (<button onClick={()=>setStarted(true)}>ESCANEAR!</button>);

    const popups = candidates.toArray().map(([k, v]) => {
        return <div key={k}>
                   <p>{k}</p> <p>{v}</p>
                   <button onClick={()=>insertCandidate(k)}
                           disabled={v === 'adding'}>
                       Añadir
                   </button>
                   <button onClick={()=>discardCandidate(k)}>
                       Descartar
                   </button>
               </div>
    })

    const pigs = status.pigs.toArray().map(p => {
        return <p>{JSON.stringify(p)}</p>
    });

    return <div className="papi">
               <h1>El panel de papi!</h1>
               {intro}
               {popups}
               <hr/>
               <h3>Cerditos</h3>
               <div>{pigs}</div>
           </div>
    ;
}

export default Papi;
