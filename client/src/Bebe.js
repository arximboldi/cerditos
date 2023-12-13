
import logo from './logo.svg';

import './Bebe.css';

import {useScanner} from './scanner';

export function Bebe() {
    const scanner = useScanner((pig) => {
        console.log("Un cerdito!", pig);
    })

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
                Empezar
            </button>
        </div>
    );

    return (
        <div id="bebe">
            {scanner.state == 'idle' || scanner.state == 'starting' ? welcome : null}
        </div>
    );
}
