import { useState, useEffect } from 'react'
import axios from 'axios';

import readPig from './reader';

const client = axios.create({baseURL: "/api"});


function Papi() {
    const [started, setStarted] = useState(false);

    const [status, setStatus] = useState({
        banks: [],
        pigs: [],
    });

    console.log("started", started);
    useEffect(() => {
        if (started) {
            return readPig((pig) => {
                console.log("Pig read!", pig);
            });
        }
    }, [started]);

    useEffect(() => {
        console.log("Requesting status")
        client.get("/state").then(data => {
            console.log("Received data!", data.data);
            setStatus(data.data);
        });
    }, []);

    const intro = started
          ? (<p>Escaneando....</p>)
          : (<button onClick={()=>setStarted(true)}>ESCANEAR!</button>);

    const pigs = status.pigs.map(p => {
        <p>{JSON.stringify(p)}</p>
    });

    return <div className="papi">
               <h1>El panel de papi!</h1>
               {intro}
               <hr/>
               <h3>Cerditos</h3>
               <div>{pigs}</div>
           </div>
    ;
}

export default Papi;
