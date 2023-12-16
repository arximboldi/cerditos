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

    const [candidate, setCandidate] = useState(null);

    const [status, setStatus] = useState({
        bank: {name: defaultBank, is_open: false, key: null},
        pigs: new Map(),
        count: 0,
    });

    function discardCandidate() {
        setCandidate(null);
    }

    async function takeCandidate() {
        const id = candidate.id;
        await client.post("/take", {id: id});
        updateStatus();
    }

    async function saveCandidate() {
        const id = candidate.id;
        setCandidate(null);
        await client.post("/save", {id: id});
        updateStatus();
    }

    async function revealCandidate() {
        const id = candidate.id;
        setCandidate(null);
        const {data} = await client.post("/reveal", {id: id});
        setCandidate(data);
        updateStatus();
    }

    async function updateStatus() {
        const {data} = await client.get("/status")
        setStatus({
            ...data,
            pigs: new Map(data.pigs.map((p) => [p.id, p])),
        });
    }

    const scanner = useScanner((pig) => {
        console.log("Un cerdito!", pig);
        console.log("outside:", status.bank.key, pig)
        if (pig == status.bank.key) {
            console.log("toggle!");
            client.post("/toggle", {key: pig}).then(updateStatus);
        } else {
            setCandidate({id: pig});
        }
    })

    useEffect(() => {
        console.log("Requesting initial status")
        updateStatus();
    }, []);

    const welcome = (
        <div className="popup">
            <p>¡Bienvenida a la hucha cibernética de los <i>cerditos</i>!</p>
            <button className="important"
                    onClick={scanner.start}
                    disabled={scanner.state === 'starting'}>
                Empezar
            </button>
        </div>
    );

    const error = (
        <div className="popup">
            <p>Este dispositivo no sabe escanear <i>cerditos</i> 😞</p>
            <button className="important"
                    onClick={scanner.start}
                    disabled={scanner.state === 'starting'}>
                Probar de nuevo
            </button>
            <button onClick={scanner.cancel}>
                Cancelar
            </button>
        </div>
    );

    const candidateCoin =
          candidate == null || !status.pigs.has(candidate.id) ? null : (
              <div className={`coin kind-${status.pigs.get(candidate.id).kind}`}></div>
          );

    const candidateMessage =
          candidate == null ? null
          : candidate.dream != null ? (
              <div className="popup">
                  <p><i>He soñado que {candidate.dream}.</i></p>
                  <button onClick={discardCandidate}>
                      ¡Qué bien!
                  </button>
              </div>
          ) : !status.pigs.has(candidate.id) ? (
              <div className="popup">
                  <p>¡Esto no es un cerdito valido!</p>
                  <button onClick={discardCandidate}>
                      Aceptar
                  </button>
              </div>
          ) : (() => {
              const pig = status.pigs.get(candidate.id);
              return pig.bank == defaultBank ? (
                  <div className="popup">
                      {candidateCoin}
                      <p>¡Este cerdito está en la hucha!</p>
                      {status.bank.is_open ? (
                          <button className="important" onClick={takeCandidate}>
                              Sacar de la hucha
                          </button>
                      ) : (
                          <p className="annotation">
                              La hucha está cerrada.<br/>
                              Para abrir la hucha necesitas el cerdito llave.
                          </p>
                      )}
                      <button onClick={discardCandidate}>
                          Cancelar
                      </button>
                  </div>
              ) : pig.ready ? (
                  <div className="popup">
                      {candidateCoin}
                      <p>¡Este cerdito está listo para contarte lo que ha soñado!</p>
                      <button className="important" onClick={revealCandidate}>
                          Revelar sueño
                      </button>
                      <button onClick={discardCandidate}>
                          En otro momento
                      </button>
                  </div>
              ) : (
                  <div className="popup">
                      {candidateCoin}
                      <p>¡Has encontrado un nuevo cerdito!</p>
                      <button className="important" onClick={saveCandidate}>
                          Meter en la hucha
                      </button>
                      <button onClick={discardCandidate}>
                          Cancelar
                      </button>
                  </div>
              )
          })();

    const coins = status.pigs.toArray().filter(([k,p]) => p.bank == defaultBank).map(([k,p]) =>
        <div key={k} className={`coin kind-${p.kind} ${candidate && candidate.id==k ? "candidate" : ""}`}>
        </div>
    );

    const hucha = (
        <div className="hucha">
            <div className={`lock lock-${status.bank.is_open ? "open" : "closed"}`}>
                { status.bank.is_open ? "🔓" : "🔒"}
            </div>
            <div className="coins">
                {coins}
            </div>
        </div>
    );

    return (
        <div id="bebe">
            {scanner.state == 'idle' || scanner.state == 'starting' ? welcome
             : scanner.state == 'error' ? error
             : candidateMessage}
            {hucha}
        </div>
    );
}
