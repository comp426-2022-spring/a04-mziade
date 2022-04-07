// Require Express.js
const express = require('express')
const app = express()
const args = require('minimist')(process.argv.slice(2))
// --port	Set the port number for the server to listen on. Must be an integer between 1 and 65535.
args['port', 'debug', 'log', 'help']
const port = args.port || process.env.PORT || 5000
const debug = args.debug || process.env.debug || 'false'
const log = args.log || process.env.log || 'true'
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

app.use( (req, res, next) => {
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


function coinFlip() {
	return Math.random() > 0.5 ? ("heads") : ("tails")
}

app.get('/app/flip', (req, res) => {
	var flip = coinFlip()
	res.status(200).json({ 'flip' : flip})
})

function coinFlips(flips) {
	const arr = []
	for(let i = 1; i <= flips; i++) {
	  arr.push(Math.random() > 0.5 ? ("heads") : ("tails"))
	}
	return arr
}

function countFlips(array) {
	const Tab = {tails: 0, heads: 0}
	for(let i = 0; i < array.length; i++) {
	  if(array[i] == "heads"){
		Tab.heads = Tab.heads + 1
	  } else {
		Tab.tails = Tab.tails + 1
	  }
	}
	if(Tab.heads == 0){
	  delete Tab.heads
	} if(Tab.tails ==0){
	  delete Tab.tails
	}
	return(Tab)
}
app.get('/app/flips/:number', (req, res) => {
	const flips = coinFlips(req.params.number)
	res.status(200).json({ 'raw': flips, "summary" : countFlips(flips)})
});

function flipACoin(call) {
	const Tab = {call: "", flip: "", result: ""}
	Tab.call = call
	Tab.flip = Math.random() > 0.5 ? ("heads") : ("tails")
	if(Tab.call == Tab.flip){
	  Tab.result = "win"
	} else {
	  Tab.result = "lose"
	}
	return Tab
}

app.get('/app/flip/call/heads', (req, res) => {
	res.status(200).json(flipACoin("heads"))
});

app.get('/app/flip/call/tails', (req, res) => {
	res.status(200).json(flipACoin("tails"))
});

// Default response for any other request
app.use(function(req, res){
    res.status(404).send('404 NOT FOUND')
});

