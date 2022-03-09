const request = require('supertest');
const mongoose = require('mongoose');
const { Genre } = require('../../models/genre');
const { User } = require('../../models/user');

let server;

describe('/api/genres', () => {
    beforeEach(() => {
        server = require('../../app');
    });
    afterEach(async () => {
        await Genre.deleteMany({});
    });

    describe('GET /', () => {
        it('Should return all genres', async () => {
            await Genre.collection.insertMany([
                { name: 'genre1' },
                { name: 'genre2' }
            ]);

            const res = await request(server).get('/api/genres');
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            expect(res.body.some(g => g.name === 'genre1')).toBeTruthy();
            expect(res.body.some(g => g.name === 'genre2')).toBeTruthy();
        });
    });

    describe('GET /:id', () => {
        it('Should return 404 error if invalid id is passed', async () => {
            const res = await request(server).get('/api/genres/1');
            expect(res.status).toBe(404);
        });

        it('Should return 404 error if given id does not exist in db', async () => {
            const id = mongoose.Types.ObjectId();
            const res = await request(server).get(`/api/genres/${id}`);
            expect(res.status).toBe(404);
        });

        it('Should return genre with requested id', async () => {
            const genre = new Genre({ name: 'genre1' });
            await genre.save();

            const res = await request(server).get(`/api/genres/${genre._id}`);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', genre.name);
        });
    });

    describe('POST /', () => {
        let token;
        let name;

        beforeEach(() => {
            token = new User().generateAuthToken();
            name = 'genre1';
        });

        // definition of happy path
        const exec = () => {
            return request(server)
                .post('/api/genres')
                .set('x-auth-token', token)
                .send({ name: name });
        }

        it('Should return 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('Should return 400 if genre is less than 5 characters', async () => {
            name = '1234';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('Should return 400 if genre is more than 50 characters', async () => {
            name = new Array(52).join('a');

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('Should save the genre if it is valid', async () => {
            await exec();

            const genre = await Genre.find({ name: 'genre1' });

            expect(genre).not.toBeNull();
        });

        it('Should return the genre if it is valid', async () => {
            const res = await exec();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', 'genre1');
        });
    });

    describe('PUT /:id', () => {
        let token;
        let genre;
        let id;
        let name;

        beforeEach(async () => {
            token = new User().generateAuthToken();
            genre = new Genre({ name: 'genre1' });
            await genre.save();
        });

        // definition of happy path
        const exec = async () => {
            return await request(server)
                .put(`/api/genres/${id}`)
                .set('x-auth-token', token)
                .send({ name: name });
        }

        it('Should return 400 if genre is less than 5 characters', async () => {
            id = genre._id;
            name = '1234';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('Should return 400 if genre is more than 50 characters', async () => {
            id = genre._id;
            name = new Array(52).join('a');

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('Should return 404 error if given id was not found', async () => {
            id = mongoose.Types.ObjectId();
            name = 'genre2';

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('Should return the edited genre if it is valid', async () => {
            id = genre._id;
            name = 'genre2';

            const res = await exec();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', 'genre2');
        });
    });

    describe('DELETE /:id', () => {
        let token;
        let genre;
        let id;

        beforeEach(async () => {
            const user = new User({ 
                _id: new mongoose.Types.ObjectId().toHexString(), 
                isAdmin: true
            });
            token = user.generateAuthToken();
            genre = new Genre({ name: 'genre1' });
            await genre.save();
        });

        const exec = async () => {
            return await request(server)
                .delete(`/api/genres/${id}`)
                .set('x-auth-token', token)
                .send();
        }

        it('Should return 404 error if given id was not found', async () => {
            id = mongoose.Types.ObjectId();

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('Should return the deleted genre if it is valid', async () => {
            id = genre._id;

            const res = await exec();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', 'genre1');
        });
    });
});