const express = require('express');
const path = require("path");
const app = express();

const http = require("http").Server(app);
const io = require("socket.io")(http);

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
            let newSorteo = _.chain(props).get("sorteo.values").reject(s => _.eq(charId, _.get(s, "char"))).value();

            return db.setSorteoForReto(_.get(char, "reto"), newSorteo);
        });
    });
};

const deleteSorteoEntryByMember = function (memberId) {
    return db.getMemberById(memberId).then(member => {
        return Promise.props({
            sorteo: db.getSorteoForReto(_.get(member, "reto"))
        }).then(props => {
            let newSorteo = _.chain(props).get("sorteo.values").reject(s => _.eq(memberId, s.member)).value();

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
        console.log("deleting member " + memberId);

        deleteUnexistingMembersFromSorteo();
        deleteUnexistingCharsFromSorteo();

        return db.getMemberById(memberId).then(member => {
            return db.deleteMember(memberId).then(() => {
                return `miembro ${_.get(member, "name")} eliminado`
            });
        });
    });
};

const unassignMember = function (memberId, pass) {
    return validatePass(pass).then(() => {
        console.log("unasigning member " + memberId);

        return db.getMemberById(memberId).then(member => {
            return deleteSorteoEntryByMember(memberId).then(() => {
                return `miembro ${_.get(member, "name")} disponible uwu`
            })
        });
    });
};

const unassignChar = function (charId, pass) {
    return validatePass(pass).then(() => {
        console.log("unasigning char " + charId);

        return db.getCharById(charId).then(char => {
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
        console.log("assigning char to member with id " + id);

        return deleteUnexistingMembersFromSorteo()
            .then(() => deleteUnexistingCharsFromSorteo())
            .then(() => {
                return db.getLastReto().then(reto => {
                    return Promise.props({
                        sorteo: db.getSorteoForReto(_.get(reto, "_id")),
                        chars: db.getAllCharsForReto(_.get(reto, "_id")),
                        member: db.getMemberById(id)
                    }).then(props => {
                        let assignedCharsIds = _.chain(props).get("sorteo.values").map("char").value();
                        let unassignedChars = _.chain(props.chars).reject(c => _.includes(assignedCharsIds, _.get(c, "_id"))).value();

                        if (!_.isEmpty(unassignedChars)) {
                            let charSorteo = _sortear([props.member._id], unassignedChars);
                            let charAsociado = _.chain(props).get("chars").find({_id: _.get(charSorteo, "0.char")}).value();
                            let newSorteo = _.unionBy(charSorteo, _.get(props, "sorteo.values"), "char");

                            console.log("appending ", charSorteo);

                            return db.setSorteoForReto(_.get(reto, "_id"), newSorteo).then(() => {
                                return `${_.get(props, "member.name")} asociado a personaje ${_.get(charAsociado, "name")}`;
                            });
                        } else {
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
        console.log("asigning member to char with id " + charId);

        return db.getLastReto().then(reto => {
            return Promise.props({
                sorteo: db.getSorteoForReto(_.get(reto, "_id")),
                members: db.getAllMembersForReto(_.get(reto, "_id")),
                char: db.getCharById(charId)
            }).then(props => {
                let assignedMembersIds = _.chain(props).get("sorteo.values").map("member").value();
                let unassignedMembersIds = _.chain(props.members).map("_id").difference(assignedMembersIds).value();

                if(!_.isEmpty(unassignedMembersIds)) {
                    let charSorteo = _sortear(unassignedMembersIds, [props.char]);
                    let miembroAsociado = _.chain(props).get("members").find({_id: _.get(charSorteo, "0.member")}).value();
                    let newSorteo = _.unionBy(charSorteo, _.get(props, "sorteo.values"), "char");

                    console.log("appending ", charSorteo);

                    return db.setSorteoForReto(_.get(reto, "_id"), newSorteo).then(() => {
                        return `${_.get(props, "char.name")} asociado a miembro ${_.get(miembroAsociado, "name")}`;
                    });
                } else {
                    return "No hay miembros sin personaje asignado";
                }
            });
        });
    });
};

const createReto = function (name, pass) {
    return validatePass(pass).then(() => {
        return db.createReto(name)
    });
};

const deleteLastReto = function(pass) {
    return validatePass(pass).then(() => {
        return db.getLastReto().then(reto => {
            return db.deleteReto(_.get(reto, "_id"));
        })
    });
};

const updateInfoText = function(txt, pass) {
    return validatePass(pass).then(() => {
        return db.setInfoTxt(txt);
    });
};

const getAllData = function () {
    return db.getLastReto().then(reto => {
        return Promise.props({
            infoTxt: db.getInfoTxt(),
            reto: reto,
            sorteo: db.getSorteoForReto(_.get(reto, "_id")),
            chars: db.getAllCharsForReto(_.get(reto, "_id")),
            members: db.getAllMembersForReto(_.get(reto, "_id"))
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

let userCount;

io.on("connection", function (socket) {
    const updateAllClients = () => {
        getAllData().then(data => {
            socket.emit("allData", data)
        });
    };

    userCount = userCount + 1;
    io.emit("usercount", userCount);

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

    socket.on('disconnect', function () {
        userCount = userCount - 1;

        io.emit("usercount", userCount)
    });
});

// listen for requests :)
let listener = http.listen(process.env.PORT || 3000, function () {
    console.log('Your app is listening on port ' + listener.address().port);

    userCount = 0;
});