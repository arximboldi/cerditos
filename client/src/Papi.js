import { useState, useEffect } from 'react'
import axios from 'axios';
import {Map} from 'immutable';
import readPig from './reader';

const client = axios.create({baseURL: "/api"});


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
  return Promise.reject(error);
});


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

    async function updateStatus() {
        const data = await client.get("/state")
        console.log("Received data!", data.data);
        const newStatus = data.data;
        newStatus.pigs = new Map(data.data.pigs.map((p) => [p.id, p]));
        setStatus(data.data);
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

    function removePig(id) {
        client.post('/remove', {id: id})
            .then(() => {
                console.log("Remove pig!")
                updateStatus();
            }).catch((err) => {
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
                   <button onClick={()=>insertPigCandidate(k)}
                           disabled={v === 'adding'}>
                       Añadir
                   </button>
                   <button onClick={()=>discardCandidate(k)}>
                       Descartar
                   </button>
               </div>
    })

    const pigs = status.pigs.toArray().map(([id, p]) => {
        return <div key={id}>
                   {id}
                   <button onClick={()=>removePig(id)}>
                       BORRAR
                   </button>
               </div>
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
