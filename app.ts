import express, {Express, Request, Response} from "express";
import { subscribeEmail, confirmSubscription } from './database';

const path = require('path');
const app : Express = express();
const PORT = process.env.PORT || 3000;


app.use(express.static(path.join(__dirname, '../public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('view engine', 'ejs');
app.set('views', './views');


app.get('/', (req: Request, res: Response) => {
    
    res.render('index', {title: 'Home', hosts: res.locals.hosts});
});


app.post('/subscribe', async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    try {
        await subscribeEmail(email);
        res.render('subscriptionResponse', { title: 'subscriptionResponse', message: email }); 
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.render('subscriptionResponse', { title: 'subscriptionResponse', message: "Error " + error.message }); 
        } else {
            res.render('subscriptionResponse', { title: 'subscriptionResponse', message: 'An unexpected error occurred.' });
        }
    }
});

app.get('/confirm', async (req: Request, res: Response) => {
    const token = req.query.token as string | undefined;

    if (!token) {
        return res.status(400).send('Invalid confirmation link.');
    }

    try {
        const result = await confirmSubscription(token);
        if (result.error) {
            return res.status(400).send(result.message);
        }
        res.send(result);
    } catch (err) {
        console.error('Error during confirmation:', err);
        res.status(500).send('Server error.');
    }
});


app.listen(PORT, () => {
console.log(`Server is running on http://localhost:${PORT}`);
});