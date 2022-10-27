//=========================================================================================== imports
const express = require('express')
const fs = require('fs')
const cors = require("cors")
const bodyParser = require('body-parser');

//========================================================================================= constants
const PORT = process.env.PORT || 3001

//========================================================================================= functions
/**
 * @param {String} path Path of the JSON file
 * @param {Function} cb A callback function
 * @return {undefined}
 */
function readJSON(path, cb) {
    fs.readFile(path, 'utf8', (err, jsonString) => {
        if (err) return console.error(err)
        return cb(JSON.parse(jsonString))
    })
}

/**
 * @param {Object} data Object to add to JSON file
 * @param {String} path Path of the JSON file
 * @return {undefined}
 */
function appendJSON(path, data) {
    readJSON(path, jsonObject => {
        jsonObject[data.id] = data
        fs.writeFile(path, JSON.stringify(jsonObject), (err) => { if (err) console.error(err) })
    })
}


/**
 * Transform the list of territories into an organized structure
 * @param {*} dataObject Object which contains the list of territories by ID
 */
function parseTerritory(dataObject) {
    let complexRegions = filter(dataObject, 'type', 'complexRegion')
    Object.keys(complexRegions).forEach(regionId => {
        complexRegions[regionId]['children'] = filter(dataObject, 'parentId', regionId)
    })

    let mergedRegions = filter(dataObject, 'type', 'mergedRegion')
    Object.keys(mergedRegions).forEach(regionId => {
        mergedRegions[regionId]['children'] = filter(dataObject, 'parentId', regionId)
    })

    let resultObject = {}
    resultObject['singleRegion'] = filter(dataObject, 'type', 'singleRegion')
    resultObject['autoDepartment'] = filter(dataObject, 'type', 'autoDepartment')
    resultObject['complexRegion'] = complexRegions
    resultObject['mergedRegion'] = mergedRegions

    return resultObject
}

function filter(object, field, value) {
    let array = Object.values(object)
    let result = {}
    array.forEach(territory => {
        if (territory[field] === value) result[territory.id] = territory
    })

    return result
}

//==================================================================================== express config
const app = express()
app.use(cors())
app.use(bodyParser.json())

//============================================================================================ routes
app.get('/api/raw/:data/:subdata?', (req, res) => {
    readJSON('./data/' + req.params.data + '.json', jsonObject => {
        if (req.params.subdata) return res.send(jsonObject[req.params.subdata])
        res.send(jsonObject)
    })
})

app.get('/api/computed/territories', (req, res) => {
    readJSON('./data/territories.json', jsonObject => {
        res.send(parseTerritory(jsonObject))
    })
})

app.post('/api/:data', (req, res) => {
    appendJSON('./data/' + req.params.data + '.json', req.body)
    res.send({ content: 'La proposition a bien été enregistrée.' })
})

app.listen(PORT, () => console.log(`Listening on port ${PORT} ...`))