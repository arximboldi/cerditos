import { useState, useEffect } from 'react'
import axios from 'axios';

import readPig from './reader';

const client = axios.create({baseURL: "/api"});


function Papi() {
    const [started, setStarted] = useState(false);

    const [status, setStatus] = useState(null);

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
        client.get("/status").then(data => {
            console.log("Received data!", data.data);
            setStatus(data.data);
        });
    }, []);

    return <div className="papi">
               <p>This is the papi interface!</p>
               {started
                ? (<p>Scanning....</p>)
                : (<button onClick={()=>setStarted(true)}>ENABLE SCAN</button>)}
               <hr/>
               Hola
           </div>
    ;
}

export default Papi;
