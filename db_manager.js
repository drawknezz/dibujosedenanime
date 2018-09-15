const _ = require("./mixins");
const store = require("nedb");
const Promise = require("bluebird");
const db = new store({filename: 'db/dibujos.db'});
db.loadDatabase(err => err && console.log("Error loading DB dibujos", err));
let moment = require("moment");

const getDataForDate = function (date) {
    return new Promise(function (res, rej) {
        db.find({fecha: date}, function (err, docs) {
            if (err) rej(err);
            res(docs);
        })
    });
};

const getRetoForWeekNum = function (weekNum) {
    return new Promise(function (res, rej) {
        db.find({semana: weekNum, type: "reto"}, function (err, docs) {
            if (err) rej(err);

            res(_.first(docs));
        })
    });
};

const setRetoForWeekNum = function (weekNum, reto) {
    return new Promise(function (res, rej) {
        console.log("saving reto " + reto + " for week " + weekNum);

        db.find({
            semana: weekNum,
            type: "reto"
        }, (err, docs) => {
            if (err) rej(err);
            if (!docs.length && !_.isEmpty(reto)) {
                db.insert({semana: weekNum, type: "reto", name: reto});
                res("reto agregado");
            } else {
                db.update({
                    semana: weekNum,
                    type: "reto"
                }, {$set: {name: reto}}, {multi: true}, function (err, numReplaced) {
                    console.log(`{{numReplaced}} docs updated`);
                });
                res("reto actualizado");
            }
        })
    });
};

const setSorteoForReto = function (retoId, sorteoArr) {
    return new Promise(function (res, rej) {
        console.log("sorting for reto " + retoId);

        db.find({
            reto: retoId,
            type: "sorteo"
        }, (err, docs) => {
            if (err) rej(err);

            if (!docs.length) {
                db.insert({reto: retoId, type: "sorteo", values: sorteoArr});
                res("datos actualizados");
            } else {
                db.update({
                    reto: retoId,
                    type: "sorteo"
                }, {$set: {values: sorteoArr}}, {multi: true}, function (err, numReplaced) {
                    console.log(numReplaced + "docs updated for sort");
                });
                res("datos actualizados");
            }
        })
    });
};

const getSorteoForReto = function (retoId) {
    return new Promise(function (res, rej) {
        db.find({reto: retoId, type: "sorteo"}, function (err, docs) {
            if (err) rej(err);

            res(_.first(docs));
        })
    });
};

const getAllCharsForReto = function (retoId) {
    return new Promise(function (res, rej) {
        db.find({
            reto: retoId,
            type: "char"
        }, (err, docs) => {
            if (err) rej(err);
            res(docs);
        })
    });
};

const getAllMembersForReto = function (retoId) {
    return new Promise(function (res, rej) {
        db.find({
            type: "member",
            reto: retoId
        }, (err, docs) => {
            if (err) rej(err);
            res(docs);
        })
    });
};

const createMember = function (name, retoId) {
    return new Promise(function (res, rej) {
        db.find({
            type: "member",
            reto: retoId,
            name: new RegExp("^" + name + "$", "i")
        }, (err, docs) => {
            if (err) rej(err);

            if (_.isEmpty(docs)) {
                db.insert({
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
};

const deleteMember = function (id) {
    return new Promise(function (res, rej) {
        db.remove({
            _id: id,
            type: "member"
        }, (err, docs) => {
            if (err) rej("couldn't remove member with id " + id);

            res("member " + id + " deleted")
        })
    });
};

const deleteChar = function (id) {
    return new Promise(function (res, rej) {
        db.remove({
            _id: id,
            type: "char"
        }, (err, docs) => {
            if (err) rej("couldn't remove char with id " + id);
            res("char " + id + " deleted")
        })
    });
};

const getCharById = function (id) {
    return new Promise(function (res, rej) {
        db.find({
            type: "char",
            _id: id
        }, (err, docs) => {
            if (err) rej(err);
            res(_.first(docs));
        })
    });
};

const getMemberById = function (id) {
    return new Promise(function (res, rej) {
        db.find({
            type: "member",
            _id: id
        }, (err, docs) => {
            if (err) rej(err);
            res(_.first(docs));
        })
    });
};

const createChar = function (name, serie, retoId) {
    return new Promise(function (res, rej) {
        db.find({
            type: "char",
            name: new RegExp(name, "i"),
            serie: new RegExp(serie, "i"),
            reto: retoId
        }, (err, docs) => {
            if (err) rej(err);

            if (_.isEmpty(docs)) {
                db.insert({
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
};

const createReto = function (name) {
    return new Promise((res, rej) => {
        db.insert({
            type: "reto",
            name: name,
            fecha: new Date()
        }, (err, docs) => {
            if (err) rej(err);

            res(`reto ${name} creado uwu`);
        });
    })
};

const getReto = function(id) {
    return new Promise((res, rej) => {
        db.find({
            type: "reto",
            _id: id
        }, (err, docs) => {
            if (err) rej(err);
            res(_.first(docs));
        });
    })
};

const deleteReto = function (id) {
    return new Promise((res, rej) => {
        return getReto(id).then(reto => {
            return Promise.props({
                reto: new Promise((res, rej) => {
                    db.remove({_id: id}, {multi: true}, (err, docs) => {
                        if (err) rej(err);

                        res(docs);
                    });
                }),
                sorteo: new Promise((res, rej) => {
                    db.remove({type: "sorteo", reto: id}, {multi: true}, (err, docs) => {
                        if (err) rej(err);

                        res(docs);
                    });
                }),
                chars: new Promise((res, rej) => {
                    db.remove({type: "char", reto: id}, {multi: true}, (err, docs) => {
                        if (err) rej(err);

                        res(docs);
                    });
                }),
                members: new Promise((res, rej) => {
                    db.remove({type: "member", reto: id}, {multi: true}, (err, docs) => {
                        if (err) rej(err);

                        res(docs);
                    });
                }),
            }).then(data => {
                res(`reto ${_.get(reto, "name")} eliminado, junto con ${_.get(data, "chars")} personajes y ${_.get(data, "members")} miembros`);
            });
        })
    })
};

const getLastReto = function () {
    return new Promise((res, rej) => {
        db.find({type: "reto"}, (err, docs) => {
            if (err) rej(err);

            res(_.chain(docs).sortBy("fecha").last().value());
        })
    })
};

const validatePass = function (pass) {
    return new Promise(function (res, rej) {
        db.find({type: "pass", value: pass}, function (docs) {
            if (_.isEmpty(docs)) rej();

            res();
        })
    })
};

const test = function () {
    //update retos con date
    db.find({type: "reto", semana: {$exists: true}, fecha: {$exists: false}}, (err, docs) => {
        _.chain(docs).each(r => {
            let d = moment().week(_.get(r, "semana")).toDate();
            db.update({type: "reto", _id: r._id}, {$set: {fecha: d}}, (err, docs) => {
                if (err) console.log("ERROR: ", err);
                console.log(`reto ${r.name} actualizado con fecha ${d}`);
            });
        }).value()
    });

    db.find({type: "reto"}, (err, retos) => {
        //update sorteos con id de cada reto
        db.find({type: "sorteo", semana: {$exists: true}, reto: {$exists: false}}, (err, docs) => {
            _.chain(docs).each(s => {
                let sem = _.get(s, "semana");
                let r = _.find(retos, {semana: sem});
                db.update({_id: s._id}, {$set: {reto: r._id}}, (err, docs) => {
                    console.log(`sorteo semana ${sem} asociado a reto `, r);
                })
            }).value();
        });

        //update chars con id de cada reto
        db.find({type: "char", semana: {$exists: true}, reto: {$exists: false}}, (err, docs) => {
            _.chain(docs).each(s => {
                let sem = _.get(s, "semana");
                let r = _.find(retos, {semana: sem});
                db.update({_id: s._id}, {$set: {reto: r._id}}, (err, docs) => {
                    console.log(`char ${s} asociado a reto `, r);
                })
            }).value();
        });
    });

    //update members con id del ultimo reto
    getLastReto().then(reto => {
        db.find({type: "member"}, (err, docs) => {
            _.chain(docs).each(m => {
                db.update({_id: m._id}, {$set: {reto: reto._id}}, (err, docs) => {
                    console.log(`member `, m ,` asociado a reto ${reto.name}`);
                })
            }).value();
        });
    });

};

module.exports = {
    setRetoForWeekNum: setRetoForWeekNum,
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
    test: test
};