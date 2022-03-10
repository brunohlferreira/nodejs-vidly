const request = require('supertest');
const mongoose = require('mongoose');
const { Customer } = require('../../models/customer');
const { Genre } = require('../../models/genre');
const { Movie } = require('../../models/movie');
const { Rental } = require('../../models/rental');
const { User } = require('../../models/user');

let app;
let server;

describe('/api/movies', () => {
    let customer;
    let genre;
    let movie;
    let rental;

    beforeEach(() => {
        app = require('../../app');
        server = app.listen();
    });

    afterEach(async () => {
        await server.close();
        await Customer.deleteMany({});
        await Genre.deleteMany({});
        await Movie.deleteMany({});
        await Rental.deleteMany({});
        await User.deleteMany({});
    });

    describe('GET /', () => {
        it('Should return array of rentals', async () => {
            customer = new Customer({
                name: 'customer1',
                phone: '12345'
            });
            await customer.save();
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
            rental = new Rental({
                customer: {
                    _id: customer._id,
                    name: customer.name,
                    phone: customer.phone
                },
                movie: {
                    _id: movie._id,
                    title: movie.title,
                    dailyRentalRate: movie.dailyRentalRate
                }
            });
            await rental.save();

            const res = await request(app).get('/api/rentals');
            expect(res.status).toBe(200);
        });
    });

    describe('POST /', () => {
        let token;
        let customerId;
        let movieId;

        beforeEach(async () => {
            token = new User().generateAuthToken();
            customer = new Customer({
                name: 'customer1',
                phone: '12345'
            });
            await customer.save();
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
                .post(`/api/rentals`)
                .set('x-auth-token', token)
                .send({ customerId, movieId });
        }

        it('Should return 401 if client is not logged in', async () => {
            token = '';
            customerId = customer._id;
            movieId = movie._id;

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('Should return 400 if invalid customerId', async () => {
            customerId = 1;
            movieId = movie._id;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('Should return 400 if invalid movieId', async () => {
            customerId = customer._id;
            movieId = 1;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('Should return 400 if user does not exist', async () => {
            customerId = mongoose.Types.ObjectId();
            movieId = movie._id;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('Should return 400 if movie does not exist', async () => {
            customerId = customer._id;
            movieId = mongoose.Types.ObjectId();

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('Should return 400 if movie is not in stock', async () => {
            await Movie.updateOne({ _id: movie._id }, { numberInStock: 0 });

            customerId = customer._id;
            movieId = movie._id;

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('Should return the rental if it is valid', async () => {
            customerId = customer._id;
            movieId = movie._id;

            const res = await exec();

            expect(res.body).toHaveProperty('_id');
        });
    });
});