const config = require('../config');
const MongoClient = require('mongodb').MongoClient;
const fs = require('fs');

async function insert(id) {
    const insertdata = await MongoClient.connect(config.mongodb_url, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        await insertdata.db("pmpermit").collection("data").insertOne({ number: id, times: 1, permit: false })
        return "inserted"

    } catch (err) {
        return "insert_error"
    } finally {
        insertdata.close();
    }

}

async function updateviolant(id, timesvio) { const updatewrite = await MongoClient.connect(config.mongodb_url, { useNewUrlParser: true, useUnifiedTopology: true });
// promise update times data

    try {

        await updatewrite.db("pmpermit").collection("data").updateOne({ number: id }, { $set: { times: timesvio } })
        return "updated"

    } catch (err) {
        return "update_error"
    } finally {
        updatewrite.close();
    }
}

async function readdb(id) { //Promise read data

    try {
        var mongoread = await MongoClient.connect(config.mongodb_url, { useNewUrlParser: true, useUnifiedTopology: true })

        var result = await mongoread.db("pmpermit").collection("data").find({ number: id }).toArray()
        if (result[0] === undefined) {
            return ({
                status: "not_found"
            })
        } else {
            return ({
                status: "found",
                number: result[0].number,
                times: result[0].times,
                permit: result[0].permit
            })
        }
    } catch (err) {
        return "read_error"
    } finally {
        mongoread.close();
    }
}

async function permitacton(id) {
    const updatewrite = await MongoClient.connect(config.mongodb_url, { useNewUrlParser: true, useUnifiedTopology: true });
    try {

        await updatewrite.db("pmpermit").collection("data").updateOne({ number: id }, { $set: { times: 1, permit: true } })
        fs.readFile(__dirname + `/tempdata/${id}.json`, { encoding: 'utf8' },
            async function(err, data) {
                if (err) {
                    fs.writeFile(__dirname + `/tempdata/${id}.json`, JSON.stringify({
                        status: "found",
                        number: id,
                        times: 1,
                        permit: true

                    }), (ert) => {
                        if (ert) {
                            console.log(ert)
                        } else {}
                    })
                } else {
                    fs.unlink(__dirname + `/tempdata/${id}.json`, async function(erryt) {
                        if (erryt) {} else {
                            fs.writeFile(__dirname + `/tempdata/${id}.json`, JSON.stringify({
                                status: "found",
                                number: id,
                                times: 1,
                                permit: true

                            }), (ert) => {
                                if (ert) {
                                    console.log(ert)
                                } else {}
                            })
                        }
                    })
                }
            })
    } catch (err) {
        return "error"
    } finally {
        updatewrite.close();
    }
}
async function nopermitacton(id) {
    const updatewrite = await MongoClient.connect(config.mongodb_url, { useNewUrlParser: true, useUnifiedTopology: true });
    try {

        await updatewrite.db("pmpermit").collection("data").updateOne({ number: id }, { $set: { times: 1, permit: false } })
        fs.readFile(__dirname + `/tempdata/${id}.json`, { encoding: 'utf8' },
            async function(err, data) {
                if (err) {} else {
                    fs.unlink(__dirname + `/tempdata/${id}.json`, async function(erryt) {
                        if (erryt) {} else {}
                    })
                }
            })
    } catch (err) {
        return "error"
    } finally {
        updatewrite.close();
    }
}
async function handler(id) {

    async function checkfile(id) {
        try {
            return JSON.parse(await fs.readFileSync(__dirname + `/tempdata/${id}.json`, { encoding: 'utf8' }))
        } catch (error) {
            return await readdb(id)
        }
    }

    const read = await checkfile(id);

    if (read.status === "found" && read.permit === true) {
        fs.readFile(__dirname + `/tempdata/${id}.json`, { encoding: 'utf8' },
            async function(err, data) {
                if (err) {
                    fs.writeFile(__dirname + `/tempdata/${id}.json`, JSON.stringify({
                        status: "found",
                        number: id,
                        times: 1,
                        permit: true

                    }), (ert) => {})
                } else {}
            })
        return "permitted"
    }
}

module.exports = {
    handler,
    permitacton,
    nopermitacton
}
