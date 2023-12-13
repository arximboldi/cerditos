import Papi from './Papi';

import logo from './logo.svg';
import './App.css';

import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";

function Root() {
    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <p>
                    Edit <code>src/App.js</code> and save to reload.
                </p>
                <a
                    className="App-link"
                    href="https://reactjs.org"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Learn React!
                </a>
            </header>
        </div>
    );
}

const router = createBrowserRouter([
    {
        path: "/",
        element: <Root/>,
    },
    {
        path: "/papi",
        element: <Papi/>,
    },
]);

function App() {
    return <RouterProvider router={router} />
}

export default App;
