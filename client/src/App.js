import {Papi} from './Papi';
import {Bebe} from './Bebe';

import './App.css';

import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Bebe/>,
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
