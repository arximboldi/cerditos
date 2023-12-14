import {
    useState,
    useEffect,
} from 'react';

import {Map} from 'immutable';

import logo from './logo.svg';

import './Bebe.css';

import {client, debounce, defaultBank} from './service';
import {useScanner} from './scanner';

export function Bebe() {
    const scanner = useScanner((pig) => {
        console.log("Un cerdito!", pig);
    })

    const [status, setStatus] = useState({
        bank: {name: defaultBank, is_open: false, key: null},
        pigs: new Map(),
        count: 0,
    });

    async function updateStatus() {
        const {data} = await client.get("/status")
        setStatus({...data,
            pigs: new Map(data.pigs.map((p) => [p.id, p])),
        });
    }

    useEffect(() => {
        console.log("Requesting initial status")
        updateStatus();
    }, []);

    const welcome = (
            <div className="popup">
                Bienvenida a la hucha cibernética de los <i>cerditos</i>
                <br/>
                <button onClick={scanner.start} disabled={scanner.state === 'starting'}>
                    Empezar
                </button>
            </div>
    );

    const error = (
        <div className="popup">
            Este dispositivo no sabe escanear <i>cerditos</i> 😞
            <br/>
            <button onClick={scanner.start} disabled={scanner.state === 'starting'}>
                Probar de nuevo
            </button>
        </div>
    );

    const coins = status.pigs.toArray().map(([k,p]) =>
        <div key={k} className={`coin kind-${p.kind}`}>
        </div>
    );

    const hucha = (
        <div className="hucha">
            { status.bank.is_locked ? "🔓" : "🔒"}
            <div className="coins">
                {coins}
            </div>
        </div>
    );

    return (
        <div id="bebe">
            {scanner.state == 'idle' || scanner.state == 'starting' ? welcome
             : scanner.state == 'error' ? error
             : null}
        {hucha}
        </div>
    );
}
