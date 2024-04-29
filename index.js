const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
    res.send("Hello World");
});

app.get('/login', (req, res) => {
    res.send("<h2>Login page</h2>");
});

app.listen(port, () => {
    console.log("Listening on port 3000");
}); 