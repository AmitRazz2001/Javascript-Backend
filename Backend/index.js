import Express from "express";
import 'dotenv/config'

const app = Express();

app.get('/', (req, res) => {
    res.send("Hello World");
})

app.get('/api/jokes', (req, res) => {
    const jokes = [
        {
            'id': 1,
            'title': 'Joke 1',
            'content': 'This is first joke'  
        },
        {
            'id': 2,
            'title': 'Joke 2',
            'content': 'This is second joke'  
        },
        {
            'id': 3,
            'title': 'Joke 3',
            'content': 'This is third joke'  
        },
        {
            'id': 4,
            'title': 'Joke 4',
            'content': 'This is fourth joke'  
        },{
            'id': 5,
            'title': 'Joke 5',
            'content': 'This is fifth joke'  
        },
        {
            'id': 6,
            'title': 'Joke 6',
            'content': 'This is last joke'  
        },

    ]
    res.send(jokes);
})

const port  = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Listening server on port: ${port}`);
})