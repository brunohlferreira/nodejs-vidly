const request = require('supertest');
const { Genre } = require('../../models/genre');
const { User } = require('../../models/user');

let app;
let server;

describe('auth middleware', () => {
    let token;

    beforeEach(() => {
        app = require('../../app');
        server = app.listen();
        token = new User().generateAuthToken();
    });
    afterEach(async () => {
        await server.close();
        await Genre.deleteMany({});
    });

    const exec = () => {
        return request(app)
            .post('/api/genres')
            .set('x-auth-token', token)
            .send({ name: 'genre1' });
    }

    it('Should return 401 if no token is provided', async () => {
        token = '';

        const res = await exec();

        expect(res.status).toBe(401);
    });

    it('Should return 400 if token is invalid', async () => {
        token = 'a';

        const res = await exec();

        expect(res.status).toBe(400);
    });

    it('Should return 200 if token is valid', async () => {
        const res = await exec();

        expect(res.status).toBe(200);
    });
});