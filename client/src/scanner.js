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
            console.log(`> Serial Number: ${serialNumber}`);
            console.log(`> Records: (${message.records.length})`);
            scanFn(serialNumber);
        }

        ndef.addEventListener("readingerror", onError);
        ndef.addEventListener("reading", onRead);
        ndef.scan()
            .then(okFn)
            .catch(errorFn);

        return () => {
            console.log("Cleanup!");
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

    useEffect(() => {
        if (state === 'starting') {
            return scanTags({
                scanFn: (tag) => {
                    console.log("Found tag!", tag);
                    cb(tag)
                },
                okFn: () => {
                    setState('scanning');
                },
                errorFn: (err) => {
                    setState('error');
                },
            });
        }
    }, [state]);

    return {
        state: state,
        start: start,
        stop: stop,
    };
}
