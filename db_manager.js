const _ = require("./mixins");
const Promise = require("bluebird");

const mongodb = require("mongodb");
let uri = "mongodb://dibujosadmin:memosupremo3@ds255797.mlab.com:55797/heroku_3lctvmrc";

const getDB = (function () {
    let dbpromise = new Promise((res, rej) => {
        console.log("connecting to the DB...", new Date());
        return mongodb.MongoClient.connect(uri, {useNewUrlParser: true}).then(client => {
            let db = client.db("heroku_3lctvmrc");
            let dibujos = process.env.NODE_ENV === "local" ? db.collection("dibujoslocal") : db.collection("dibujos");

            console.log("DB connected...", new Date());
            res(dibujos);
        }).catch(err => rej(err));
    });

    return function () {
        return dbpromise;
    }
})();

const setSorteoForReto = function (retoId, sorteoArr) {
    return new Promise(function (res, rej) {
        console.log("sorting for reto " + retoId);

        getDB().then(db => {
            db.find({
                reto: retoId,
                type: "sorteo"
            }).toArray((err, docs) => {
                if (err) rej(err);

                if (_.isEmpty(docs)) {
                    db.insertOne({reto: retoId, type: "sorteo", values: sorteoArr});
                    res("datos actualizados");
                } else {
                    db.updateOne({
                        reto: retoId,
                        type: "sorteo"
                    }, {$set: {values: sorteoArr}}, function (err, numReplaced) {
                        console.log(_.get(numReplaced, "matchedCount") + " docs updated for sort");
                    });
                    res("datos actualizados");
                }
            })
        });
    });
};

const getSorteoForReto = function (retoId) {
    return new Promise(function (res, rej) {
        getDB().then(db => {
            db.findOne({reto: retoId, type: "sorteo"}, (err, docs) => {
                if (err) rej(err);

                res(docs);
            })
        });
    });
};

const getAllCharsForReto = function (retoId) {
    return new Promise(function (res, rej) {
        getDB().then(db => {
            db.find({
                reto: retoId,
                type: "char"
            }).toArray((err, docs) => {
                if (err) rej(err);
                res(docs);
            })
        });
    });
};

const getAllMembersForReto = function (retoId) {
    return new Promise(function (res, rej) {
        getDB().then(db => {
            db.find({
                type: "member",
                reto: retoId
            }).toArray((err, docs) => {
                if (err) rej(err);
                res(docs);
            })
        });
    });
};

const createMember = function (name, retoId) {
    return new Promise(function (res, rej) {
        getDB().then(db => {
            db.find({
                type: "member",
                reto: retoId,
                name: new RegExp("^" + name + "$", "i")
            }).toArray((err, docs) => {
                if (err) rej(err);

                if (_.isEmpty(docs)) {
                    db.insertOne({
                        type: "member",
                        name: name,
                        reto: retoId
                    }, (err, docs) => {
                        if (err) rej(`no se pudo crear miembro ${name}, error: ${err}`);

                        res(`miembro ${name} creado`);
                    })
                } else {
                    rej(`ya existe un miembro con nombre ${name}`);
                }
            })
        });
    });
};

const deleteMember = function (id) {
    return new Promise(function (res, rej) {
        getDB().then(db => {
            db.deleteOne({
                "type": "member",
                _id: mongodb.ObjectID(id)
            }, (err, docs) => {
                if (err) rej("no se pudo eliminar al miembro...");

                console.log(err);

                res("member " + id + " deleted")
            })
        });
    });
};

const deleteChar = function (id) {
    return new Promise(function (res, rej) {
        getDB().then(db => {
            db.deleteOne(
                {_id: mongodb.ObjectID(id), type: "char"}, (err, docs) => {
                    if (err) rej("couldn't remove char with id " + id);
                    res("char " + id + " deleted")
                })
        })
    });
};

const getCharById = function (id) {
    return new Promise(function (res, rej) {
        getDB().then(db => {
            db.find({
                type: "char",
                _id: mongodb.ObjectID(id)
            }).toArray((err, docs) => {
                if (err) rej(err);
                res(_.first(docs));
            })
        });
    });
};

const getMemberById = function (id) {
    return new Promise(function (res, rej) {
        getDB().then(db => {
            db.find({
                type: "member",
                _id: mongodb.ObjectID(id)
            }).toArray((err, docs) => {
                if (err) rej(err);
                res(_.first(docs));
            })
        })
    });
};

const createChar = function (name, serie, retoId) {
    return new Promise(function (res, rej) {
        getDB().then(db => {
            db.find({
                type: "char",
                name: new RegExp(name, "i"),
                serie: new RegExp(serie, "i"),
                reto: retoId
            }).toArray((err, docs) => {
                if (err) rej(err);

                if (_.isEmpty(docs)) {
                    db.insertOne({
                        type: "char",
                        name: name,
                        serie: serie,
                        reto: retoId
                    }, (err, docs) => {
                        if (err) rej("No se pudo crear el personaje " + name + ": " + err);

                        res("personaje " + name + " creado c:");
                    })
                } else {
                    rej(`el personaje ${name} ya existe`)
                }
            })
        });
    });
};

const createReto = function (name) {
    return new Promise((res, rej) => {
        debugger;
        getDB().then(db => {
            db.insertOne({
                type: "reto",
                name: name,
                fecha: new Date()
            }, (err, docs) => {
                if (err) rej(err);

                res(`reto ${name} creado uwu`);
            });
        })
    })
};

const getReto = function (id) {
    return new Promise((res, rej) => {
        getDB().then(db => {
            db.find({
                type: "reto",
                _id: mongodb.ObjectID(id)
            }).toArray((err, docs) => {
                if (err) rej(err);
                res(_.first(docs));
            });
        });
    })
};

const deleteReto = function (id) {
    return new Promise((res, rej) => {
        return getReto(id).then(reto => {
            return Promise.props({
                reto: new Promise((res, rej) => {
                    getDB().then(db => {
                        db.deleteMany({_id: mongodb.ObjectID(id)}, (err, docs) => {
                            if (err) rej(err);

                            res(docs);
                        });
                    });
                }),
                sorteo: new Promise((res, rej) => {
                    getDB().then(db => {
                        db.deleteMany({type: "sorteo", reto: id}, (err, docs) => {
                            if (err) rej(err);

                            res(docs);
                        });
                    });
                }),
                chars: new Promise((res, rej) => {
                    getDB().then(db => {
                        db.deleteMany({type: "char", reto: id}, (err, docs) => {
                            if (err) rej(err);

                            res(docs);
                        });
                    });
                }),
                members: new Promise((res, rej) => {
                    getDB().then(db => {
                        db.deleteMany({type: "member", reto: id}, (err, docs) => {
                            if (err) rej(err);

                            res(docs);
                        });
                    });
                }),
            }).then(data => {
                res(`reto ${_.get(reto, "name")} eliminado, junto con ${_.get(data, "chars.deletedCount")} personajes y ${_.get(data, "members.deletedCount")} miembros`);
            });
        })
    })
};

const getLastReto = function () {
    return new Promise((res, rej) => {
        getDB().then(db => {
            db.find({type: "reto"}).toArray((err, docs) => {
                if (err) rej(err);

                res(_.chain(docs).sortBy("fecha").last().value());
            })
        });
    })
};

const getInfoTxt = function() {
    return new Promise((res, rej) => {
        getDB().then(db => {
            db.findOne({type: "info"}, (err, docs) => {
                if (err) rej(err);
                res(docs);
            })
        });
    })
};

const setInfoTxt = function(txt) {
    return new Promise((res, rej) => {
        getDB().then(db => {
            db.find({type: "info"}).toArray((err, docs) => {
                if(_.isEmpty(docs)) {
                    db.insertOne({type: "info", txt: txt}, (err, docs) => {
                        if (err) rej(err);

                        res("mensaje actualizado");
                    })
                } else {
                    db.updateOne({type: "info"}, {$set: {txt: txt}}, (err, docs) => {
                        if (err) rej(err);

                        res("mensaje actualizado");
                    })
                }
            });
        })
    })
};

const test = function () {

};

module.exports = {
    getAllCharsForReto: getAllCharsForReto,
    getCharById: getCharById,
    createChar: createChar,
    deleteChar: deleteChar,
    getAllMembersForReto: getAllMembersForReto,
    getMemberById: getMemberById,
    createMember: createMember,
    deleteMember: deleteMember,
    setSorteoForReto: setSorteoForReto,
    getSorteoForReto: getSorteoForReto,
    createReto: createReto,
    deleteReto: deleteReto,
    getLastReto: getLastReto,
    getInfoTxt,
    setInfoTxt,
    test: test
};
