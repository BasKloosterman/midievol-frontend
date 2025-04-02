import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';

const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: []
    }
]);

const root = createRoot(document.getElementById('app') as HTMLElement);
root.render(
    <React.StrictMode>
        <SnackbarProvider maxSnack={3}>
            <RouterProvider router={router} />
        </SnackbarProvider>
    </React.StrictMode>
);
