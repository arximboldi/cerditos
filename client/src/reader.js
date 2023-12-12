
export default function readPig(cb) {
    try {
        console.log("NDEFReader: ", window.NDEFReader)
        const ndef = new window.NDEFReader();
        function onError() {
            console.log("Argh! Cannot read data from the NFC tag. Try another one?");
        }

        function onRead({message, serialNumber}) {
            cb(serialNumber);
            console.log(`> Serial Number: ${serialNumber}`);
            console.log(`> Records: (${message.records.length})`);
        }

        ndef.addEventListener("readingerror", onError);
        ndef.addEventListener("reading", onRead);
        ndef.scan()
            .then(() => console.log("Scan ok!"))
            .catch(err => console.error("Scan error:", err));

        return () => {
            console.log("Cleanup!");
            ndef.removeEventListener("readingerror", onError);
            ndef.removeEventListener("reading", onRead);
        };
    } catch (error) {
        console.error("Can't read pigs on this device", error);
    }
}
