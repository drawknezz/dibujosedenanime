const _ = require("./mixins");
const Promise = require("bluebird");

const mongodb = require("mongodb");
let uri = "mongodb://dibujosadmin:memosupremo3@ds255797.mlab.com:55797/heroku_3lctvmrc";

let collectionName = process.env.NODE_ENV === "local" ? "dibujoslocal" : "dibujos";

const getDB = (function() {
    let dbpromise = new Promise((res, rej) => {
        console.log("connecting to the DB...", new Date());
        return mongodb.MongoClient.connect(uri, {useNewUrlParser: true}).then(client => {
            let db = client.db("heroku_3lctvmrc");
            let dibujos = db.collection(collectionName);

            console.log("DB connected...", new Date());
            res(dibujos);
        }).catch(err => rej(err));
    });

    return function() {
        return dbpromise;
    }
})();

const setSorteoForReto = function(retoId, sorteoArr) {
    return new Promise(function(res, rej) {
        console.log("sorting for reto " + retoId);

        getDB().then(db => {
            db.find({
                reto: mongodb.ObjectID(retoId),
                type: "sorteo"
            }).toArray((err, docs) => {
                if (err) rej(err);

                if (_.isEmpty(docs)) {
                    db.insertOne({reto: mongodb.ObjectID(retoId), type: "sorteo", values: sorteoArr});
                    res("datos actualizados");
                } else {
                    db.updateOne({
                        reto: mongodb.ObjectID(retoId),
                        type: "sorteo"
                    }, {$set: {values: sorteoArr}}, function(err, numReplaced) {
                        console.log(_.get(numReplaced, "matchedCount") + " docs updated for sort");
                    });
                    res("datos actualizados");
                }
            })
        });
    });
};

const getSorteoForReto = function(retoId) {
    return new Promise(function(res, rej) {
        getDB().then(db => {
            db.findOne({reto: mongodb.ObjectID(retoId), type: "sorteo"}, (err, docs) => {
                if (err) rej(err);

                res(docs);
            })
        });
    });
};

const getAllCharsForReto = function(retoId) {
    return new Promise(function(res, rej) {
        getDB().then(db => {
            db.find({
                reto: mongodb.ObjectID(retoId),
                type: "char"
            }).toArray((err, docs) => {
                if (err) rej(err);
                res(docs);
            })
        });
    });
};

const getAllMembersForReto = function(retoId) {
    return new Promise(function(res, rej) {
        getDB().then(db => {
            db.find({
                type: "member",
                reto: mongodb.ObjectID(retoId)
            }).toArray((err, docs) => {
                if (err) rej(err);
                res(docs);
            })
        });
    });
};

const createMember = function(name, retoId) {
    return new Promise(function(res, rej) {
        getDB().then(db => {
            db.find({
                type: "member",
                reto: mongodb.ObjectID(retoId),
                name: new RegExp("^" + name + "$", "i")
            }).toArray((err, docs) => {
                if (err) rej(err);

                if (_.isEmpty(docs)) {
                    db.insertOne({
                        type: "member",
                        name: name,
                        reto: mongodb.ObjectID(retoId)
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

const deleteMember = function(id) {
    return new Promise(function(res, rej) {
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

const deleteChar = function(id) {
    return new Promise(function(res, rej) {
        getDB().then(db => {
            db.deleteOne(
                {_id: mongodb.ObjectID(id), type: "char"}, (err, docs) => {
                    if (err) rej("couldn't remove char with id " + id);
                    res("char " + id + " deleted")
                })
        })
    });
};

const getCharById = function(id) {
    return new Promise(function(res, rej) {
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

const getMemberById = function(id) {
    return new Promise(function(res, rej) {
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

const assignPermissionsToUser = function(userid, permissions) {
    return new Promise(function(res, rej) {
        getDB().then(db => {
            getUserById(userid).then(user => {
                db.updateOne({
                    type: "user",
                    fid: userid,
                }, {
                    $set: {
                        permissions: _.union(_.get(user, "permissions"), permissions)
                    }
                }, (err, docs) => {
                    if (err) rej(err);

                    res("usuario actualizado...");
                });
            })
        })
    });
};

const createChar = function(name, serie, retoId) {
    return new Promise(function(res, rej) {
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

const createReto = function(name) {
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

const getReto = function(id) {
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

const deleteReto = function(id) {
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

const getLastReto = function() {
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
                if (_.isEmpty(docs)) {
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

const createUser = function(name, fid) {
    return new Promise((res, rej) => {
        getDB().then(db => {
            db.find({type: "user", fid: fid}).toArray((err, docs) => {
                if (_.isEmpty(docs)) {
                    db.insertOne({
                        type: "user",
                        name: name,
                        fid: fid,
                        permissions: ["vote", "createmember"]
                    }, (err, docs) => {
                        if (err) rej(err);

                        res(`usuario ${name} (${fid}) creado`);
                    })
                } else {
                    db.updateOne({type: "user", fid: fid}, {$set: {name: name}}, (err, docs) => {
                        if (err) rej(err);

                        res(`usuario ${name} (${fid}) actualizado`);
                    })
                }
            });
        })
    })
};

const getUserById = function(fid) {
    return new Promise((res, rej) => {
        getDB().then(db => {
            db.findOne({type: "user", fid: fid}, (err, docs) => {
                if (err) rej(err);
                res(docs);
            });
        })
    })
};

const getEntryById = function(entryid) {
    return new Promise((res, rej) => {
        getDB().then(db => {
            db.findOne({type: "pollentry", _id: mongodb.ObjectID(entryid)}, (err, docs) => {
                if (err) rej(err);
                res(docs);
            });
        })
    })
};

const createPoll = function(name) {
    return new Promise((res, rej) => {
        getDB().then(db => {
            db.find({type: "poll", name: name}).toArray((err, docs) => {
                if (_.isEmpty(docs)) {
                    db.insertOne({type: "poll", name: name}, (err, docs) => {
                        if (err) rej(err);

                        res(`votacion ${name} creada...`);
                    })
                } else {
                    db.updateOne({type: "poll", name: name}, {$set: {name: name}}, (err, docs) => {
                        if (err) rej(err);

                        res(`votacion ${name} actualizada...`);
                    })
                }
            });
        })
    })
};

const createPollEntry = function(name, pollid) {
    return new Promise((res, rej) => {
        getDB().then(db => {
            getPollById(pollid).then(poll => {
                if (poll) {
                    db.insertOne({type: "pollentry", poll: mongodb.ObjectID(pollid), name: name}, (err, docs) => {
                        if (err) rej(err);

                        res(`opcion ${name} creada...`);
                    })
                } else {
                    rej("votacion inexistente :0")
                }
            });
        })
    });
};

const ensureUserHasNotVotedOnPoll = function(pollid, userid) {
    return new Promise((res, rej) => {
        getDB().then(db => {
            db.find({
                type: "entryvote",
                votepoll: mongodb.ObjectID(pollid),
                user: userid
            }).toArray((err, docs) => {
                if (!_.isEmpty(docs)) {
                    rej("ya votaste en esta votacion...");
                } else {
                    res(true)
                }
            });
        })
    })

};

const voteEntryPoll = function(entryid, pollid, userid) {
    return new Promise((res, rej) => {
        getDB().then(db => {
            getEntryById(entryid).then(entry => {
                if (entry) {

                    db.deleteMany({
                        type: "entryvote",
                        votepoll: mongodb.ObjectID(pollid),
                        user: {$in: [userid, null]}
                    }, (err, docs) => {
                        if (!userid) rej("debes estar logueado para votar...");

                        db.insertOne({
                                type: "entryvote",
                                entry: mongodb.ObjectID(entryid),
                                votepoll: mongodb.ObjectID(pollid),
                                user: userid
                            },
                            (err, docs) => {
                                if (err) rej(err);

                                res(`votaste por ${_.get(entry, "name")}...`);
                            })
                    })
                } else {
                    rej("opcion inexistente :0")
                }
            });
        });
    })
};

const deletePoll = function(pollId) {
    return new Promise((res, rej) => {
        getDB().then(db => {
            db.aggregate([
                {
                    $match: {
                        type: "poll",
                        _id: mongodb.ObjectID(pollId)
                    }
                },
                {
                    $lookup: {
                        from: collectionName,
                        let: {pollid: "$_id"},
                        pipeline: [
                            {$match: {$expr: {$and: [{$eq: ["$type", "pollentry"]}, {$eq: ["$poll", "$$pollid"]}]}}},
                            {
                                $lookup: {
                                    from: collectionName,
                                    localField: "_id",
                                    foreignField: "entry",
                                    as: "votes"
                                }
                            }
                        ],
                        as: "entries"
                    }
                }
            ]).toArray((err, docs) => {
                const pollids = _.map(docs, "_id");
                const entryIds = _.chain(docs).map("entries").flatten().map("_id").value();
                const votesIds = _.chain(docs).map("entries").flatten().map("votes").flatten().map("_id").value();

                db.deleteMany({$id: {$in: _.union(pollids, entryIds, votesIds)}})

            });
        });


        getDB().then(db => {
            db.deleteOne({
                "type": "poll",
                _id: mongodb.ObjectID(pollId)
            }, (err, docs) => {
                if (err) rej("no se pudo eliminar la votacion...");

                console.log(err);

                res("votacion eliminada")
            });
        })
    })
};

const getPollById = function(pollid) {
    return new Promise((res, rej) => {
        getDB().then(db => {
            db.findOne({
                "type": "poll",
                _id: mongodb.ObjectID(pollid)
            }, (err, docs) => {
                if (err) rej("error al consultar por la votacion...");

                res(docs)
            });
        })
    })
};

const getPollByName = function(name) {
    return new Promise((res, rej) => {
        getDB().then(db => {
            db.findOne({
                "type": "poll",
                name: name
            }, (err, docs) => {
                if (err) rej("error al consultar por la votacion...");

                res(docs)
            });
        })
    })
};

const getAllPolls = function() {
    return new Promise((res, rej) => {
        getDB().then(db => {
            db.aggregate([
                {
                    $match: {
                        type: "poll"
                    }
                },
                {
                    $lookup: {
                        from: collectionName,
                        let: {pollid: "$_id"},
                        pipeline: [
                            {$match: {$expr: {$and: [{$eq: ["$type", "pollentry"]}, {$eq: ["$poll", "$$pollid"]}]}}},
                            {
                                $lookup: {
                                    from: collectionName,
                                    localField: "_id",
                                    foreignField: "entry",
                                    as: "votes"
                                }
                            }
                        ],
                        as: "entries"
                    }
                }
            ]).toArray((err, docs) => {
                if (err) console.log("getAllPolls/ERROR: ", err);
                res(docs)
            });
        })
    })
};


const test = function() {
    getDB().then(db => {
        let cursor = db.aggregate([
            {
                $match: {
                    type: "poll",
                    _id: mongodb.ObjectID("5bac1f1857a01b1e104831d1")
                }
            },
            {
                $lookup: {
                    from: collectionName,
                    let: {pollid: "$_id"},
                    pipeline: [
                        {$match: {$expr: {$and: [{$eq: ["$type", "pollentry"]}, {$eq: ["$poll", "$$pollid"]}]}}},
                        {
                            $lookup: {
                                from: collectionName,
                                localField: "_id",
                                foreignField: "entry",
                                as: "votes"
                            }
                        }
                    ],
                    as: "entries"
                }
            }
        ]);

        let result = cursor.toArray((err, docs) => {
            const pollids = _.map(docs, "_id");
            const entryIds = _.chain(docs).map("entries").flatten().map("_id").value();
            const votesIds = _.chain(docs).map("entries").flatten().map("votes").flatten().map("_id").value();

            console.log(_.union(pollids, entryIds, votesIds));

        });
    })
};

module.exports = {
    getAllCharsForReto,
    getCharById,
    createChar,
    deleteChar,
    getAllMembersForReto,
    getMemberById,
    createMember,
    deleteMember,
    setSorteoForReto,
    getSorteoForReto,
    createReto,
    deleteReto,
    getLastReto,
    getInfoTxt,
    setInfoTxt,
    createUser,
    assignPermissionsToMember: assignPermissionsToUser,
    getUserById,
    createPoll,
    deletePoll,
    getPollByName,
    getAllPolls,
    getPollById,
    createPollEntry,
    voteEntryPoll,
    test: test
};
