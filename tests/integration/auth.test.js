const request = require('supertest');
const bcrypt = require('bcrypt');
const { User } = require('../../models/user');

let app;
let server;

describe('/api/auth', () => {
    let user;
    let email;
    let password;

    beforeEach(async () => {
        app = require('../../app');
        server = app.listen();
        user = new User({
            name: 'User1', 
            email: 'email@email.com',
            password: 'password'
        });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        await user.save();
    });
    afterEach(async () => {
        await server.close();
        await User.deleteMany({});
    });

    const exec = () => {
        return request(app)
            .post('/api/auth')
            .send({ email, password });
    }

    it('Should return 400 if invalid email', async () => {
        email = 'email2@email.com';
        password = 'password';

        const res = await exec();

        expect(res.status).toBe(400);
    });

    it('Should return 400 if invalid password', async () => {
        email = 'email@email.com';
        password = 'password1';

        const res = await exec();

        expect(res.status).toBe(400);
    });

    it('Should return 200 if valid user', async () => {
        email = 'email@email.com';
        password = 'password';

        const res = await exec();

        expect(res.status).toBe(200);
    });
});