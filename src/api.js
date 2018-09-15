import OpenSocket from "socket.io-client";
import _ from './mixins';

const socket = OpenSocket();

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