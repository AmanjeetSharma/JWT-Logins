import express, { json } from 'express';

const app = express();

app.use(json());

app.get('/', (req, res) => {
    res.send('<h1 style="color:red; background:#39FF14; text-align:center;">Hello, World!</h1>');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);  
});