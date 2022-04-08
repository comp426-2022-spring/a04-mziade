// Require Express.js
const express = require('express')
const app = express()
const fs = require('fs')
const db = require('./database.js')
const args = require('minimist')(process.argv.slice(2))
// --port	Set the port number for the server to listen on. Must be an integer between 1 and 65535.
args['port', 'debug', 'log', 'help']
const port = args.port || process.env.PORT || 5000
const debug = args.debug || process.env.debug || 'false'
const log = args.log || process.env.log || 'true'
if(log == 'false'){
// Use morgan for logging to files
// Create a write stream to append (flags: 'a') to a file
const WRITESTREAM = fs.createWriteStream('accesslog', { flags: 'a' })
// Set up the access logging middleware
app.use(morgan('combined', { stream: WRITESTREAM }))
}
const help = (`
server.js [options]

--port	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.

--debug	If set to true, creates endlpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws 
            an error with the message "Error test successful." Defaults to 
            false.

--log		If set to false, no log files are written. Defaults to true.
            Logs are always written to database.

--help	Return this message and exit.
`)
// If --help or -h, echo help text to STDOUT and exit
if (args.help || args.h) {
    console.log(help)
    process.exit(0)
}


// Start an app server
const server = app.listen(port, () => {
    console.log('App listening on port %PORT%'.replace('%PORT%',port))
});

app.get('/app/', (req, res) => {
    // Respond with status 200
	res.statusCode = 200;
	// Respond with status message "OK"
		res.statusMessage = 'OK';
		res.writeHead( res.statusCode, { 'Content-Type' : 'text/plain' });
		res.end(res.statusCode+ ' ' +res.statusMessage)
});

app.use("/app/new/user", (req, res, next) => {
	let logdata = {
        remoteaddr: req.ip,
        remoteuser: req.user,
        time: Date.now(),
        method: req.method,
        url: req.url,
        protocol: req.protocol,
        httpversion: req.httpVersion,
        status: res.statusCode,
        referer: req.headers['referer'],
        useragent: req.headers['user-agent']
    }
    const stmt = db.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocal, httpversion, status, referer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    const info = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocal, logdata.httpversion, logdata.status, logdata.referer, logdata.useragent)
    res.status(200).json(info)
	next()
})

app.get("/app/log/access", (req, res) => {	
    try {
        const stmt = db.prepare('SELECT * FROM accesslog').all()
        res.status(200).json(stmt)
    } catch {
        console.error(e)
    }
});

app.use("/app/error", (req, res) => {
	console.log("Error test successful")
})




// Default response for any other request
app.use(function(req, res){
    res.status(404).send('404 NOT FOUND')
});

