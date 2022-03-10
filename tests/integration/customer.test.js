const request = require('supertest');
const mongoose = require('mongoose');
const { Customer } = require('../../models/customer');
const { User } = require('../../models/user');

let app;
let server;

describe('/api/customers', () => {
    beforeEach(() => {
        app = require('../../app');
        server = app.listen();
    });
    afterEach(async () => {
        await server.close();
        await Customer.deleteMany({});
    });

    describe('GET /', () => {
        it('Should return array of customers', async () => {
            await Customer.insertMany([
                { name: 'customer1', phone: '12345' },
                { name: 'customer2', phone: '12345' }
            ]);

            const res = await request(app).get('/api/customers');

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            expect(res.body.some(g => g.name === 'customer1')).toBeTruthy();
            expect(res.body.some(g => g.name === 'customer2')).toBeTruthy();
        });
    });

    describe('GET /:id', () => {
        it('Should return 404 error if invalid id is passed', async () => {
            const res = await request(app).get('/api/customers/1');
            expect(res.status).toBe(404);
        });

        it('Should return 404 error if given id does not exist in db', async () => {
            const id = mongoose.Types.ObjectId();
            const res = await request(app).get(`/api/customers/${id}`);
            expect(res.status).toBe(404);
        });

        it('Should return customer with requested id', async () => {
            const customer = new Customer({ name: 'customer1', phone: '12345' });
            await customer.save();

            const res = await request(app).get(`/api/customers/${customer._id}`);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', customer.name);
        });
    });

    describe('PUT /:id', () => {
        let token;
        let customer;
        let id;
        let name;
        let phone;

        beforeEach(async () => {
            token = new User().generateAuthToken();
            customer = new Customer({ name: 'customer1', phone: '12345' });
            await customer.save();
        });

        const exec = () => {
            return request(app)
                .put(`/api/customers/${id}`)
                .set('x-auth-token', token)
                .send({ name, phone });
        }

        it('Should return 400 if customer is less than 5 characters', async () => {
            id = customer._id;
            name = '1234';
            phone = '1234';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('Should return 400 if customer is more than 50 characters', async () => {
            id = customer._id;
            name = new Array(52).join('a');
            phone = new Array(52).join('a');

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('Should return 404 error if given id was not found', async () => {
            id = mongoose.Types.ObjectId();
            name = 'customer2';
            phone = '12345';

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('Should return the edited customer if it is valid', async () => {
            id = customer._id;
            name = 'customer2';
            phone = '12345';

            const res = await exec();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', 'customer2');
        });
    });

    describe('DELETE /:id', () => {
        let token;
        let customer;
        let id;

        beforeEach(async () => {
            const user = new User({ 
                _id: new mongoose.Types.ObjectId().toHexString(), 
                isAdmin: true
            });
            token = user.generateAuthToken();
            customer = new Customer({ name: 'customer1', phone: '12345' });
            await customer.save();
        });

        const exec = () => {
            return request(app)
                .delete(`/api/customers/${id}`)
                .set('x-auth-token', token)
                .send();
        }

        it('Should return 404 error if given id was not found', async () => {
            id = mongoose.Types.ObjectId();

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('Should return the deleted customer if it is valid', async () => {
            id = customer._id;

            const res = await exec();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', 'customer1');
        });
    });
});