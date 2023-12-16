import {
    useState,
    useEffect,
} from 'react';

export function scanTags({scanFn, errorFn, okFn}) {
    try {
        console.log("NDEFReader: ", window.NDEFReader)
        const ndef = new window.NDEFReader();

        function onError() {
            console.log("Argh! Cannot read data from the NFC tag. Try another one?");
        }

        function onRead({message, serialNumber}) {
            console.log(`> serial no: ${serialNumber}`);
            console.log(`> records: (${message.records.length})`);
            scanFn(serialNumber);
        }

        ndef.addEventListener("readingerror", onError);
        ndef.addEventListener("reading", onRead);
        ndef.scan()
            .then(okFn)
            .catch(errorFn);

        return () => {
            console.log("cleanup scanner");
            ndef.removeEventListener("readingerror", onError);
            ndef.removeEventListener("reading", onRead);
        };
    } catch (error) {
        errorFn(error);
    }
}


export function useScanner(cb) {
    const [state, setState] = useState('idle');

    function start() {
        setState('starting');
    };

    function stop() {
        setState('idle');
    };

    function cancel() {
        setState('');
    };

    const active =
          state == 'starting' ||
          state === 'scanning';

    useEffect(() => {
        if (active) {
            return scanTags({
                scanFn: (tag) => {
                    console.log("Found tag!", tag);
                    cb(tag)
                },
                okFn: () => {
                    console.log("scan ok")
                    setState('scanning');
                },
                errorFn: (err) => {
                    console.log("scan error")
                    setState('error');
                },
            });
        }
    }, [active]);

    return {
        state: state,
        start: start,
        stop: stop,
        cancel: cancel,
    };
}
