const mongoose = require('mongoose');
const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const errorhandler = require('errorhandler');
const db = mongoose.connection;

app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(errorhandler());

const connectToDb = async () => {
	try {
		await mongoose.connect('mongodb://localhost:27017/accounts', { useNewUrlParser: true, useUnifiedTopology: true });
	} 
	catch (error) {
		console.error(error);
	}
};

connectToDb();

// Listen for errors after initial connection.
db.on('error', console.error.bind(console, 'connection error:'));

// Do once after initial connection.
db.once('open', () => {
	console.log('We\'re connected to the database');
});

// Mongoose schema
const accountSchema = new mongoose.Schema({
	name: String,
	balance: Number
});

// Mongoose model
const Account = mongoose.model('Account', accountSchema);

//GET
app.get('/accounts', (req, res, next) => {
	Account.find((err, accounts) => {
		if (err) return console.error(err);
		if (accounts.length === 0) {
			return res.send('No accounts available');
		}
		res.send(accounts);
	});
});

//POST
app.post('/accounts', async (req, res, next) => {
	const account = new Account({ name: req.body.name, balance: req.body.balance });
	try {
		const newAccount = await account.save();
		res.status(201).json({ newAccount });
	} catch (err) {
		res.status(400).json({ message: err.message });
	}
});

//PUT
app.put('/accounts/:id', async (req, res, next) => {
	try {
		const account = await Account.updateOne({_id: req.params.id}, {balance: req.body.balance});
		if (!account) return res.status(404).send('The account with the given ID was not found.');
		res.status(201).send('The requested account has been updated.');
	} catch (err) {
		res.status(400).send(`${err.message}. Most likely because the account ID doesn't exist.`);
	}
});

//DELETE
app.delete('/accounts/:id', async (req, res, next) => {
	try {
		const account = await Account.findOneAndRemove({_id: req.params.id}, {useFindAndModify: false});
		if (!account) return res.status(404).send('The account with the given ID was not found.');
		res.status(201).send(account);
	} catch (err) {
		res.status(400).send(err.message);
	}
});

app.listen(3000);