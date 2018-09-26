const express = require('express');
const path = require("path");
const fs = require("fs");
const app = express();
const mongodb = require("mongodb");

const http = require("http").Server(app);
const io = require("socket.io")(http);

if (process.env.NODE_ENV === 'local') {
    //para probar login de facebook en local, en prod no es necesario
    const https = require("https");
    let sslOptions = {
        key: fs.readFileSync('key.pem'),
        cert: fs.readFileSync('cert.pem'),
        passphrase: "1234"
    };
    https.Server(sslOptions, app).listen(8443);
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

const _ = require("./mixins");
const Promise = require("bluebird");
const db = require("./db_manager");

const handleError = error => console.log("unhandled promise error: ", error);
process.removeListener("unhandledRejection", handleError);
process.on("unhandledRejection", handleError);

app.get("/", function (request, response) {
    response.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const validatePass = function (pass) {
    let validPass = process.env.PASS || "12345";

    return new Promise((res, rej) => {
        if (_.eq(validPass, pass)) res();
        rej("Password no válido")
    })
};

const _sortear = function (membersIds, chars) {
    let shuffled = _.chain(membersIds).shuffle().map(m => ({member: m})).value();

    let sorted = _.chain(chars)
        .shuffle()
        .zip(shuffled)
        .map(_.compact)
        .filter(a => a.length === 2)
        .map(pair => _.extend({}, _.nth(pair, 0), _.nth(pair, 1)))
        .map(o => ({
            char: _.get(o, "_id"),
            charName: _.get(o, "name"),
            member: _.get(o, "member")
        }))
        .value();

    //elimino los elementos si es que existe algun miembro mas de una vez

    return _.chain(membersIds).map(m => _.find(sorted, {member: m})).compact().value()
};

const deleteSorteoEntryByChar = function (charId) {
    return db.getCharById(charId).then(char => {
        return Promise.props({
            sorteo: db.getSorteoForReto(_.get(char, "reto"))
        }).then(props => {
            let newSorteo = _.chain(props).get("sorteo.values").reject(s => _.eq(charId, _.toString(_.get(s, "char")))).value();

            return db.setSorteoForReto(_.get(char, "reto"), newSorteo);
        });
    });
};

const deleteSorteoEntryByMember = function (memberId) {
    return db.getMemberById(memberId).then(member => {
        return Promise.props({
            sorteo: db.getSorteoForReto(_.get(member, "reto"))
        }).then(props => {
            let newSorteo = _.chain(props).get("sorteo.values").reject(s => _.eq(memberId, _.toString(_.get(s, "member")))).value();

            return db.setSorteoForReto(_.get(member, "reto"), newSorteo);
        });
    });
};

const deleteUnexistingMembersFromSorteo = function () {
    return db.getLastReto().then(reto => {
        return Promise.props({
            sorteo: db.getSorteoForReto(_.get(reto, "_id")),
            members: db.getAllMembersForReto(_.get(reto, "_id"))
        }).then(props => {
            let existingMembersIds = _.chain(props).get("members").map("_id").map(_.toString).value();
            let newSorteo = _.chain(props).get("sorteo.values").filter(s => _.includes(existingMembersIds, _.toString(_.get(s, "member")))).value();

            return db.setSorteoForReto(_.get(reto, "_id"), newSorteo);
        });
    });
};

const deleteUnexistingCharsFromSorteo = function () {
    return db.getLastReto().then(reto => {
        return Promise.props({
            sorteo: db.getSorteoForReto(_.get(reto, "_id")),
            chars: db.getAllCharsForReto(_.get(reto, "_id"))
        }).then(props => {
            let existingCharsIds = _.chain(props).get("chars").map("_id").map(_.toString).value();
            let newSorteo = _.chain(props).get("sorteo.values").filter(s => _.includes(existingCharsIds, _.toString(_.get(s, "char")))).value();

            return db.setSorteoForReto(_.get(reto, "_id"), newSorteo);
        });
    });
};

const sortear = function (pass) {
    return validatePass(pass).then(() => {
        console.log("sorteando...");

        return db.getLastReto().then(reto => {
            return Promise.props({
                chars: db.getAllCharsForReto(_.get(reto, "_id")),
                members: db.getAllMembersForReto(_.get(reto, "_id"))
            }).then(props => {
                if (_.isEmpty(_.get(props, "chars", []))) {
                    return "crea algunos personajes antes de sortear...";
                } else if (_.isEmpty(_.get(props, "members", []))) {
                    return "crea algunos miembros antes de sortear..."
                } else {
                    let sorteo = _sortear(_.map(props.members, "_id"), props.chars);
                    return db.setSorteoForReto(_.get(reto, "_id"), sorteo);
                }
            });
        });
    });
};

const deleteChar = function (id, pass) {
    return validatePass(pass).then(() => {
        return db.getCharById(id).then(char => {
            console.log(`deleting char ${_.get(char, "name")} (${id})`);
            return db.deleteChar(id).then(function () {
                return Promise.all([deleteUnexistingMembersFromSorteo(), deleteUnexistingCharsFromSorteo()])
                    .then(() => `personaje ${_.get(char, "name")} eliminado`);
            });
        });
    });
};

const createChar = function (name, serie, pass) {
    return validatePass(pass).then(() => {
        console.log("creating char ", name);

        return db.getLastReto().then(reto => {
            return db.createChar(name, serie, _.get(reto, "_id"));
        });
    });
};

const createManyChars = function (chars, pass) {
    return validatePass(pass).then(() => {

        return db.getLastReto().then(reto => {
            console.log("creating chars ", chars);

            return Promise.all(
                _.chain(chars).map(c => db.createChar(c.name, c.serie, _.get(reto, "_id"))).value()
            ).then(() => `${chars.length} personajes creados`);
        });
    });
};

const createMember = function (name) {
    return db.getLastReto().then(reto => {
        console.log("creating member " + name);
        return db.createMember(name, _.get(reto, "_id")).then(() => {
            return `miembro ${name} creado con exito c;`
        });
    });
};

const deleteMember = function (memberId, pass) {
    return validatePass(pass).then(() => {
        deleteUnexistingMembersFromSorteo();
        deleteUnexistingCharsFromSorteo();

        return db.getMemberById(memberId).then(member => {
            console.log(`deleting member ${_.get(member, "name")} (${memberId})`);
            return db.deleteMember(memberId).then(() => {
                return `miembro ${_.get(member, "name")} eliminado`
            });
        });
    });
};

const unassignMember = function (memberId, pass) {
    return validatePass(pass).then(() => {
        return db.getMemberById(memberId).then(member => {
            console.log(`unasigning member ${_.get(member, "name")} (${memberId})`);
            return deleteSorteoEntryByMember(memberId).then(() => {
                return `miembro ${_.get(member, "name")} disponible uwu`
            })
        });
    });
};

const unassignChar = function (charId, pass) {
    return validatePass(pass).then(() => {
        return db.getCharById(charId).then(char => {
            console.log(`unasigning char ${_.get(char, "name")} (${charId})`);
            return deleteSorteoEntryByChar(charId).then(() => {
                return `personaje ${_.get(char, "name")} disponible uwu`
            });
        });
    });
};

/**
 para asignar un char libre a un miembro
 */
const assignCharToMember = function (id, pass) {
    return validatePass(pass).then(() => {
        return deleteUnexistingMembersFromSorteo()
            .then(() => deleteUnexistingCharsFromSorteo())
            .then(() => {
                return db.getLastReto().then(reto => {
                    return Promise.props({
                        sorteo: db.getSorteoForReto(_.get(reto, "_id")),
                        chars: db.getAllCharsForReto(_.get(reto, "_id")),
                        member: db.getMemberById(id)
                    }).then(props => {
                        console.log(`assigning char to member ${_.get(props, "member.name")} (${id})`);

                        let assignedCharsIds = _.chain(props).get("sorteo.values").map("char").map(_.toString).value();
                        let unassignedChars = _.chain(props.chars).reject(c => _.includes(assignedCharsIds, _.toString(_.get(c, "_id")))).value();

                        if (!_.isEmpty(unassignedChars)) {
                            let charSorteo = _sortear([_.get(props, "member._id")], unassignedChars);
                            let charAsociado = _.chain(props).get("chars").find({_id: mongodb.ObjectID(_.get(charSorteo, "0.char"))}).value();
                            let newSorteo = _.unionBy(charSorteo, _.get(props, "sorteo.values"), "char");

                            return db.setSorteoForReto(_.toString(_.get(reto, "_id")), newSorteo).then(() => {
                                console.log(`${_.get(props, "member.name")} asociado a personaje ${_.get(charAsociado, "name")}`);
                                return `${_.get(props, "member.name")} asociado a personaje ${_.get(charAsociado, "name")}`;
                            });
                        } else {
                            console.log("No hay personajes para asignar...");
                            return "No hay personajes para asignar...";
                        }
                    });
                });
            });
    });
};

/**
 para asignar un miembro libre a un char
 */
const assignMemberToChar = function (charId, pass) {
    return validatePass(pass).then(() => {
        return db.getLastReto().then(reto => {
            return Promise.props({
                sorteo: db.getSorteoForReto(_.get(reto, "_id")),
                members: db.getAllMembersForReto(_.get(reto, "_id")),
                char: db.getCharById(charId)
            }).then(props => {
                console.log(`asigning member to char ${_.get(props, "char.name")} (${charId})`);
                let assignedMembersIds = _.chain(props).get("sorteo.values").map("member").map(_.toString).value();
                let unassignedMembersIds = _.chain(props).get("members").map("_id").map(_.toString).difference(assignedMembersIds).map(mongodb.ObjectID).value();

                if (!_.isEmpty(unassignedMembersIds)) {
                    let charSorteo = _sortear(unassignedMembersIds, [props.char]);
                    let miembroAsociado = _.chain(props).get("members").find({_id: mongodb.ObjectID(_.get(charSorteo, "0.member"))}).value();
                    let newSorteo = _.unionBy(charSorteo, _.get(props, "sorteo.values"), "char");

                    return db.setSorteoForReto(_.toString(_.get(reto, "_id")), newSorteo).then(() => {
                        console.log(`${_.get(props, "char.name")} asociado a miembro ${_.get(miembroAsociado, "name")}`);
                        return `${_.get(props, "char.name")} asociado a miembro ${_.get(miembroAsociado, "name")}`;
                    });
                } else {
                    console.log("No hay miembros sin personaje asignado");
                    return "No hay miembros sin personaje asignado";
                }
            });
        });
    });
};

const createReto = function (name, pass) {
    return validatePass(pass).then(() => {
        console.log(`creating reto ${name}`);
        return db.createReto(name)
    });
};

const deleteLastReto = function (pass) {
    return validatePass(pass).then(() => {
        return db.getLastReto().then(reto => {
            console.log(`eliminando reto ${_.get(reto, "name")}`);
            return db.deleteReto(_.get(reto, "_id"));
        })
    });
};

const updateInfoText = function (txt, pass) {
    return validatePass(pass).then(() => {
        return db.setInfoTxt(txt);
    });
};

const createUser = function(name, fid) {
    return db.createUser(name, fid);
};

const promoteMember = function (memberid, pass) {
    return validatePass(pass).then(() => {
        return db.assignPermissionsToMember(id, ["any"]);
    });
};

const testForPermissions = function(userId, permissions) {
    return new Promise((res, rej) => {
        return db.getUserById(userId).then(user => {
            let userpermissions = _.get(user, "permissions");

            if (_.includes(userpermissions, "any") || _.chain(permissions).ensureArray().difference(userpermissions).isEmpty().value()) {
                res(`${_.get(user, "name", "hmm")}, tienes permisos para eso uwu...`)
            } else {
                rej(`${_.get(user, "name", "hmm")}, no tienes permisos para eso...`);
            }
        })
    })
};

const createPoll = function(name, userId) {
    return new Promise((res, rej) => {
        return testForPermissions(userId, "createpoll").then(() => {
            return db.createPoll(name).then(() => {
                res("votacion creada con exito")
            })
        }).catch(err => rej(err));
    });
};

const createPollEntry = function(name, pollid, userId) {
    return new Promise(res => {
        return testForPermissions(userId, "createpollentry").then(() => {
            return db.createPollEntry(name).then(() => {
                res("opcion creada con exito")
            })
        });
    });
};

const getAllData = function () {
    return db.getLastReto().then(reto => {
        return Promise.props({
            infoTxt: db.getInfoTxt(),
            reto: reto,
            sorteo: db.getSorteoForReto(_.get(reto, "_id")),
            chars: db.getAllCharsForReto(_.get(reto, "_id")),
            members: db.getAllMembersForReto(_.get(reto, "_id")),
            polls: db.getAllPolls()
        }).then(props => {
            let fullChars = _.chain(props.chars).map(c => {
                let sorteoElement = _.find(_.get(props, "sorteo.values"), {char: _.get(c, "_id")});
                return _.extend({}, c, {
                    assignedTo: _.chain(props.members).find({_id: _.get(sorteoElement, "member")}).get("name").value()
                });
            }).value();

            let fullMembers = _.chain(props.members).map(m => {
                let sorteoElement = _.find(_.get(props, "sorteo.values"), {member: _.get(m, "_id")});
                return _.extend({}, m, {
                    assignedTo: _.chain(props.chars).find({_id: _.get(sorteoElement, "char")}).get("name").value()
                });
            }).value();

            return _.extend({}, props, {
                chars: fullChars,
                members: fullMembers
            });
        })
    });
};

let connectedUsers = [];

io.on("connection", function (socket) {
    const updateAllClients = () => {
        getAllData().then(data => {
            io.emit("allData", data)
        });
    };

    connectedUsers = [...connectedUsers, {clientid: _.get(socket, "client.id"), name: ""}];
    io.emit("usercount", connectedUsers);

    socket.on('disconnect', function () {
        connectedUsers = _.reject(c => c.clientid === _.get(socket, "client.id"));

        io.emit("usercount", connectedUsers);
    });

    socket.on("createuser", ({name, facebookId}) => {
        //la unica forma de que se llame esto es que el usuario se haya logueado en este cliente
        connectedUsers = _.chain(connectedUsers)
            .map(c => _.get(c, "clientid") === _.get(socket, "client.id") ? _.extend({}, c, {
                name: _.chain(name).words().first().value()
            }) : c)
            .tap(cu => io.emit("usercount", cu)).value();

        createUser(name, facebookId).then(resp => {
            console.log(resp);
        }).catch(err => {
            console.log("ERROR: ", err);
        });
    });

    socket.on("allData", function () {
        updateAllClients();
    });

    socket.on("editinfotext", ({txt, pass}) => {
        updateInfoText(txt, pass).then(resp => {
            updateAllClients();
            socket.emit("msg", resp);
        }).catch(err => {
            console.log("ERROR: ", err);
            socket.emit("err", err);
        })
    });

    socket.on("deletelastreto", ({pass}) => {
        deleteLastReto(pass).then(resp => {
            updateAllClients();
            socket.emit("msg", resp);
        }).catch(err => {
            console.log("ERROR: ", err);
            socket.emit("err", err);
        })
    });

    socket.on("sortear", ({pass}) => {
        sortear(pass).then(resp => {
            updateAllClients();
            socket.emit("msg", resp);
        }).catch(err => {
            console.log("ERROR: ", err);
            socket.emit("err", err);
        })
    });

    socket.on("createmember", ({name}) => {
        createMember(name).then(resp => {
            updateAllClients();
            socket.emit("msg", resp);
        }).catch(err => {
            console.log("ERROR: ", err);
            socket.emit("err", err);
        })
    });

    socket.on("createmanychars", ({chars, pass}) => {
        createManyChars(chars, pass).then(resp => {
            updateAllClients();
            socket.emit("msg", resp);
        }).catch(err => {
            console.log("ERROR: ", err);
            socket.emit("err", err);
        })
    });

    socket.on("createchar", ({name, serie, pass}) => {
        createChar(name, serie, pass).then(resp => {
            updateAllClients();
            socket.emit("msg", resp);
        }).catch(err => {
            console.log("ERROR: ", err);
            socket.emit("err", err);
        })
    });

    socket.on("deletechar", ({id, pass}) => {
        deleteChar(id, pass).then(resp => {
            updateAllClients();
            socket.emit("msg", resp);
        }).catch(err => {
            console.log("ERROR: ", err);
            socket.emit("err", err);
        })
    });

    socket.on("assignchartomember", ({id, pass}) => {
        assignCharToMember(id, pass).then(resp => {
            updateAllClients();
            socket.emit("msg", resp);
        }).catch(err => {
            console.log("ERROR: ", err);
            socket.emit("err", err);
        })
    });

    socket.on("deletemember", ({id, pass}) => {
        deleteMember(id, pass).then(resp => {
            updateAllClients();
            socket.emit("msg", resp);
        }).catch(err => {
            console.log("ERROR: ", err);
            socket.emit("err", err);
        })
    });

    socket.on("createreto", ({name, pass}) => {
        createReto(name, pass).then(resp => {
            updateAllClients();
            socket.emit("msg", resp);
        }).catch(err => {
            console.log("ERROR: ", err);
            socket.emit("err", err);
        })
    });

    socket.on("unassignmember", ({id, pass}) => {
        unassignMember(id, pass).then(resp => {
            updateAllClients();
            socket.emit("msg", resp);
        }).catch(err => {
            console.log("ERROR: ", err);
            console.log("[ERROR] ->", err);
            socket.emit("err", err);
        })
    });

    socket.on("unassignchar", ({id, pass}) => {
        unassignChar(id, pass).then(resp => {
            updateAllClients();
            socket.emit("msg", resp);
        }).catch(err => {
            console.log("ERROR: ", err);
            socket.emit("err", err);
        })
    });

    socket.on("assignmembertochar", ({id, pass}) => {
        assignMemberToChar(id, pass).then(resp => {
            updateAllClients();
            socket.emit("msg", resp);
        }).catch(err => {
            console.log("ERROR: ", err);
            socket.emit("err", err);
        });
    });

    socket.on("promotemember", ({id, pass}) => {
        promoteMember(id, pass).then(resp => {
            updateAllClients();
            socket.emit("msg", resp);
        }).catch(err => {
            console.log("ERROR: ", err);
            socket.emit("err", err);
        });
    });

    socket.on("createpoll", ({name, userid}) => {
        createPoll(name, userid).then(resp => {
            updateAllClients();
            socket.emit("msg", resp);
        }).catch(err => {
            console.log("ERROR: ", err);
            socket.emit("err", err);
        });
    });

    socket.on("createpollentry", ({name, pollid, userid}) => {
        createPollEntry(name, pollid, userid).then(resp => {
            updateAllClients();
            socket.emit("msg", resp);
        }).catch(err => {
            console.log("ERROR: ", err);
            socket.emit("err", err);
        });
    })
});

// listen for requests :)
let listener = http.listen(process.env.PORT || 3000, function () {
    console.log('Your app is listening on port ' + listener.address().port);
});