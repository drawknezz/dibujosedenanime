const _ = require("./mixins");
const Promise = require("bluebird");

const mongodb = require("mongodb");
let uri = "mongodb://dibujosadmin:memosupremo3@ds255797.mlab.com:55797/heroku_3lctvmrc";

let collectionName = process.env.NODE_ENV === "local" ? "dibujoslocal" : "dibujos";

const getDB = (function () {
    let dbpromise = new Promise((res, rej) => {
        console.log("connecting to the DB...", new Date());
        return mongodb.MongoClient.connect(uri, {useNewUrlParser: true}).then(client => {
            let db = client.db("heroku_3lctvmrc");
            let dibujos = db.collection(collectionName);

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
            db.findOne({reto: mongodb.ObjectID(retoId), type: "sorteo"}, (err, docs) => {
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
                reto: mongodb.ObjectID(retoId),
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
                reto: mongodb.ObjectID(retoId)
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

                        res(docs);
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

const assignPermissionsToUser = function (userid, permissions) {
    return new Promise(function (res, rej) {
        getDB().then(db => {
            getUserById(userid).then(user => {
                console.log(`promoting member ${_.get(user, "name")}(${userid})`);
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

                        res(docs);
                    })
                } else {
                    rej(`el personaje ${name} ya existe`)
                }
            })
        });
    });
};

const createReto = function (name, tossed) {
    return new Promise((res, rej) => {
        debugger;
        getDB().then(db => {
            db.insertOne({
                type: "reto",
                name,
                fecha: new Date(),
                tossed: Boolean(tossed)
            }, (err, docs) => {
                if (err) rej(err);

                res(`reto ${tossed ? "" : "a eleccion"} ${name} creado uwu`);
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

const getInfoTxt = function () {
    return new Promise((res, rej) => {
        getDB().then(db => {
            db.findOne({type: "info"}, (err, docs) => {
                if (err) rej(err);
                res(docs);
            })
        });
    })
};

const setInfoTxt = function (txt) {
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

const createUser = function (name, fid) {
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

const getUserById = function (fid) {
    return new Promise((res, rej) => {
        getDB().then(db => {
            db.findOne({type: "user", fid: fid}, (err, docs) => {
                if (err) rej(err);
                res(docs);
            });
        })
    })
};

const getEntryById = function (entryid) {
    return new Promise((res, rej) => {
        getDB().then(db => {
            db.findOne({type: "pollentry", _id: mongodb.ObjectID(entryid)}, (err, docs) => {
                if (err) rej(err);
                res(docs);
            });
        })
    })
};

const createPoll = function (name) {
    return new Promise((res, rej) => {
        getDB().then(db => {
            db.find({type: "poll", name: name}).toArray((err, docs) => {
                if (_.isEmpty(docs)) {
                    db.insertOne({type: "poll", name: name, status: "active"}, (err, docs) => {
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

const createPollEntry = function (name, pollid, userid) {
    return new Promise((res, rej) => {
        getDB().then(db => {
            Promise.props({
                user: getUserById(userid),
                poll: getPollById(pollid)
            }).then(({user, poll}) => {
                if (poll) {
                    db.insertOne({type: "pollentry", poll: mongodb.ObjectID(pollid), name: name}, (err, docs) => {
                        if (err) rej(err);
                        console.log(`opcion ${name} creada por ${_.get(user, "name", "usuario anonimo")}...`);
                        res(`opcion ${name} creada por ${_.get(user, "name", "usuario anonimo")}...`);
                    })
                } else {
                    rej("votacion inexistente :0")
                }
            } );
        })
    });
};

const ensureUserHasNotVotedOnPoll = function (pollid, userid) {
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

const voteEntryPoll = function (entryid, pollid, userid) {
    return new Promise((res, rej) => {
        getDB().then(db => {
            Promise.props({
                entry: getEntryById(entryid),
                user: getUserById(userid)
            }).then(data => {
                db.deleteMany({
                    type: "entryvote",
                    votepoll: mongodb.ObjectID(pollid),
                    user: {$in: [userid, null]}
                }, (err, docs) => {
                    if (!data.user) {
                        rej("debes estar logueado para votar...");
                    } else {
                        if (data.entry) {
                            db.insertOne({
                                    type: "entryvote",
                                    entry: mongodb.ObjectID(entryid),
                                    votepoll: mongodb.ObjectID(pollid),
                                    user: userid
                                },
                                (err, docs) => {
                                    if (err) rej(err);

                                    res(`votaste por ${_.get(data, "entry.name")}...`);
                                })

                        } else {
                            rej("opcion inexistente :0")
                        }
                    }
                })
            });
        });
    })
};

const deletePollEntry = function (entryid, pollid) {
    return new Promise((res, rej) => {
        getDB().then(db => {
            db.deleteMany({
                type: "entryvote",
                votepoll: mongodb.ObjectID(pollid),
                entry: mongodb.ObjectID(entryid)
            }, (err, docs) => {
                db.deleteOne({
                        type: "pollentry",
                        _id: mongodb.ObjectID(entryid),
                        poll: mongodb.ObjectID(pollid),
                    },
                    (err, docs) => {
                        if (err) rej(err);

                        res(`entrada eliminada...`);
                    })
            })
        });
    })
};

const deleteInvalidUserVotes = function() {
    return new Promise((res, rej) => {
        getDB().then(db => {
            db.aggregate([
                {
                    $match: {
                        type: "entryvote"
                    }
                },
                {
                    $lookup: {
                        from: collectionName,
                        localField: "user",
                        foreignField: "fid",
                        as: "user"
                    }
                },
                {
                    $match: {
                        user: {$size: 0}
                    }
                }
            ]).toArray((err, docs) => {
                db.deleteMany({_id: {$in: _.chain(docs).map("_id").map(id => mongodb.ObjectID(id)).value()}}, (err, ddocs) => {
                    if (err) rej(err);
                    if (_.gt(_.get(ddocs, "deletedCount", 0), 0)) {
                        console.log(`removed ${_.get(ddocs, "deletedCount")} votes coz they had invalid users`);
                    }
                    res();
                });
            })
        })
    })
};

const deletePoll = function (pollId) {
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

const closePoll = function (pollId) {
    return new Promise((res, rej) => {
        getDB().then(db => {
            getPollById(pollId).then(poll => {
                if (!poll) rej("no se encontro la votacion :0");

                db.updateOne({
                    type: "poll",
                    _id: mongodb.ObjectID(pollId)
                }, {
                    $set: {
                        status: "closed"
                    }
                }, (err, docs) => {
                    if (err) rej(err);

                    res(`votacion ${_.get(poll, "name")} cerrada...`);
                })
            })
        })
    });
};

const activatePoll = function (pollId) {
    return new Promise((res, rej) => {
        getDB().then(db => {
            getPollById(pollId).then(poll => {
                if (!poll) rej("no se encontro la votacion :0");

                db.updateOne({
                    type: "poll",
                    _id: mongodb.ObjectID(pollId)
                }, {
                    $set: {
                        status: "active"
                    }
                }, (err, docs) => {
                    if (err) rej(err);

                    res(`votacion ${_.get(poll, "name")} activada...`);
                })
            })
        })
    });
};

const getPollById = function (pollid) {
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

const getPollByName = function (name) {
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

const getAllPolls = function () {
    return new Promise((res, rej) => {
        return deleteInvalidUserVotes().then(() => {
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
                                        let: {entryid: "$_id"},
                                        pipeline: [
                                            {$match: {$expr: {$and: [{$eq: ["$type", "entryvote"]}, {$eq: ["$entry", "$$entryid"]}, {$eq: ["$votepoll", "$$pollid"]}]}}},
                                            {
                                                $lookup: {
                                                    from: collectionName,
                                                    let: {userid: "$user"},
                                                    pipeline: [
                                                        {
                                                            $match: {
                                                                $expr: {
                                                                    $and: [
                                                                        {$eq: ["$type", "user"]},
                                                                        {$eq: ["$fid", "$$userid"]}
                                                                    ]
                                                                }
                                                            }
                                                        },
                                                        {
                                                            $project: {name: 1}
                                                        }
                                                    ],
                                                    as: "username"
                                                }
                                            }
                                        ],
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
            });
        });
    })
};


const test = function () {
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
    assignPermissionsToUser,
    getUserById,
    createPoll,
    deletePoll,
    getPollByName,
    getAllPolls,
    getPollById,
    createPollEntry,
    voteEntryPoll,
    deletePollEntry,
    closePoll,
    activatePoll,
    test: test
};
