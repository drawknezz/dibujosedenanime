import OpenSocket from "socket.io-client";
import _ from './mixins';

let loc = /localhost/.test(window.location.href) ? "http://localhost:3001" : null;
const socket = OpenSocket(loc);

function emitAction(data) {
    socket.emit({
        action: _.get(data, "action"),
        data: _.get(data, "data")
    })
}

function onSocket(eventName, cb) {
    socket.on(eventName, cb);
}

function socketEmit(data) {
    let args = _.toArray(arguments);
    _.applyBound(socket, "emit", args);
}

export { emitAction, onSocket, socketEmit }