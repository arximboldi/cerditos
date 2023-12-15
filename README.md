# cerditos

![logo](client/src/pic/backs.svg)

Cerditos is a physical-virtual currency for dirty little animals.

## Development environment

Install the [Nix package manager](https://nixos.org/download) and:
```
nix-shell
```
All following command must be run inside a Nix shell.

### Run backend

```
cd server
npm run start
```

## Run development frontend server

```
cd client
npm run start
```

## Build production frontend

```
cd client
npm run build
```

## Run production backend

Pass the directory where to store the database in the `STATE_DIR`
environment variable and the port in `PORT`, when running `npm run
start` on the `server` folder.

Set up `/` to serve the frontend files and `/api` to proxy to the
backend server.
