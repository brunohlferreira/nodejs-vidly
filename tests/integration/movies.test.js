const request = require('supertest');
const mongoose = require('mongoose');
const { Genre } = require('../../models/genre');
const { Movie } = require('../../models/movie');
const { User } = require('../../models/user');

let app;
let server;

describe('/api/movies', () => {
    let genre;

    beforeEach(() => {
        app = require('../../app');
        server = app.listen();
    });
    afterEach(async () => {
        await server.close();
        await Genre.deleteMany({});
        await Movie.deleteMany({});
    });

    describe('GET /', () => {
        it('Should return array of movies', async () => {
            genre = new Genre({
                name: 'genre1'
            });
            await genre.save();
            const r = await Movie.insertMany([
                {
                    title: 'movie1',
                    genre: {
                        _id: genre._id,
                        name: genre.name
                    },
                    numberInStock: 10,
                    dailyRentalRate: 2
                },
                {
                    title: 'movie2',
                    genre: {
                        _id: genre._id,
                        name: genre.name
                    },
                    numberInStock: 15,
                    dailyRentalRate: 5
                }
            ]);
            //console.log(r);

            const res = await request(app).get('/api/movies');
            //console.log(res.body);
            expect(res.status).toBe(200);
            //expect(res.body.length).toBe(2);
            //expect(res.body.some(g => g.name === 'movie1')).toBeTruthy();
            //expect(res.body.some(g => g.name === 'movie2')).toBeTruthy();
        });
    });

    describe('GET /:id', () => {
        it('Should return 404 error if invalid id is passed', async () => {
            const res = await request(app).get('/api/movies/1');

            expect(res.status).toBe(404);
        });

        it('Should return 404 error if given id does not exist in db', async () => {
            const id = mongoose.Types.ObjectId();
            const res = await request(app).get(`/api/movies/${id}`);

            expect(res.status).toBe(404);
        });

        it('Should return movie with requested id', async () => {
            genre = new Genre({
                name: 'genre1'
            });
            await genre.save();
            const movie = new Movie({
                title: 'movie1',
                genre: {
                    _id: genre._id,
                    name: genre.name
                },
                numberInStock: 10,
                dailyRentalRate: 2
            });
            await movie.save();

            const res = await request(app).get(`/api/movies/${movie._id}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('title', movie.title);
        });
    });

    describe('POST /', () => {
        let token;
        let title;
        let genre;
        let numberInStock;
        let dailyRentalRate;

        beforeEach(async () => {
            token = new User().generateAuthToken();
            genre = new Genre({
                name: 'genre1'
            });
            await genre.save();
        });

        const exec = () => {
            return request(app)
                .post(`/api/movies`)
                .set('x-auth-token', token)
                .send({ title, genreId: genre._id, numberInStock, dailyRentalRate });
        }

        it('Should return 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('Should return 400 if movie is less than 5 characters', async () => {
            title = '1234';
            genreId = genre._id;
            numberInStock = 10;
            dailyRentalRate = 2;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('Should save the movie if it is valid', async () => {
            title = 'movie1';
            genreId = genre._id;
            numberInStock = 10;
            dailyRentalRate = 2;

            await exec();

            const movie = await Movie.find({ name: 'movie1' });

            expect(movie).not.toBeNull();
        });

        it('Should return the movie if it is valid', async () => {
            title = 'movie1';
            genreId = genre._id;
            numberInStock = 10;
            dailyRentalRate = 2;

            const res = await exec();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('title', 'movie1');
        });
    });

    describe('PUT /:id', () => {
        let token;
        let movie;
        let id;
        let title;
        let genre;
        let numberInStock;
        let dailyRentalRate;

        beforeEach(async () => {
            token = new User().generateAuthToken();
            genre = new Genre({
                name: 'genre1'
            });
            await genre.save();
            movie = new Movie({
                title: 'movie1',
                genre: {
                    _id: genre._id,
                    name: genre.name
                },
                numberInStock: 10,
                dailyRentalRate: 2
            });
            await movie.save();
        });

        const exec = () => {
            return request(app)
                .put(`/api/movies/${id}`)
                .set('x-auth-token', token)
                .send({ title, genreId: genre._id, numberInStock, dailyRentalRate });
        }

        it('Should return 400 if movie is less than 5 characters', async () => {
            id = movie._id;
            title = '1234';
            genreId = genre._id;
            numberInStock = 10;
            dailyRentalRate = 2;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('Should return 404 error if given id was not found', async () => {
            id = mongoose.Types.ObjectId();
            title = 'movie3';
            genreId = genre._id;
            numberInStock = 10;
            dailyRentalRate = 2;

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('Should return the edited movie if it is valid', async () => {
            id = movie._id;
            title = 'movie3';
            genreId = genre._id;
            numberInStock = 10;
            dailyRentalRate = 2;

            const res = await exec();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('title', 'movie3');
        });
    });

    describe('DELETE /:id', () => {
        let token;
        let movie;
        let id;

        beforeEach(async () => {
            const user = new User({ 
                _id: new mongoose.Types.ObjectId().toHexString(), 
                isAdmin: true
            });
            token = user.generateAuthToken();
            movie = new Movie({
                title: 'movie1',
                genre: {
                    name: 'genre1'
                },
                numberInStock: 10,
                dailyRentalRate: 2
            });
            await movie.save();
        });

        const exec = () => {
            return request(app)
                .delete(`/api/movies/${id}`)
                .set('x-auth-token', token)
                .send();
        }

        it('Should return 404 error if given id was not found', async () => {
            id = mongoose.Types.ObjectId();

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('Should return the deleted movie if it is valid', async () => {
            id = movie._id;

            const res = await exec();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('title', 'movie1');
        });
    });
});