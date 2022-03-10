const request = require('supertest');
const mongoose = require('mongoose');
const { Movie } = require('../../models/movie');
const { Rental } = require('../../models/rental');
const { User } = require('../../models/user');

let app;
let server;
let token;
let customerId;
let movieId;
let movie;
let rental;

describe('/api/returns', () => {
    beforeEach(async () => {
        app = require('../../app');
        server = app.listen();
        token = new User().generateAuthToken();

        customerId = mongoose.Types.ObjectId();
        movieId = mongoose.Types.ObjectId();

        movie = new Movie({
            _id: movieId,
            title: '12345',
            genre: {
                name: '12345'
            },
            numberInStock: 10,
            dailyRentalRate: 2
        });
        await movie.save();

        rental = new Rental({
            customer: {
                _id: customerId,
                name: '12345',
                phone: '12345'
            },
            movie: {
                _id: movieId,
                title: '12345',
                dailyRentalRate: 2
            }
        });
        await rental.save();
    });

    afterEach(async () => {
        await server.close();
        await Movie.deleteMany({});
        await Rental.deleteMany({});
    });

    const exec = () => {
        return request(server)
            .post('/api/returns')
            .set('x-auth-token', token)
            .send({ customerId, movieId });
    }

    it('Should return 401 if client is not logged in', async () => {
        token = '';

        const res = await exec();

        expect(res.status).toBe(401);
    });

    it('Should return 400 if customerId is not provided', async () => {
        customerId = '';

        const res = await exec();

        expect(res.status).toBe(400);
    });

    it('Should return 400 if movieId is not provided', async () => {
        movieId = '';

        const res = await exec();

        expect(res.status).toBe(400);
    });

    it('Should return 404 if no rental found for provided customer/movie', async () => {
        await Rental.deleteMany({});

        const res = await exec();

        expect(res.status).toBe(404);
    });

    it('Should return 400 if return is already processed', async () => {
        rental.dateReturned = new Date();
        await rental.save();

        const res = await exec();

        expect(res.status).toBe(400);
    });

    it('Should return 200 if request is valid', async () => {
        const res = await exec();

        expect(res.status).toBe(200);
    });

    it('Should set the returnDate if input is valid', async () => {
        const res = await exec();

        rental = await Rental.findById(rental._id);
        const diff = new Date() - rental.dateReturned;

        expect(diff).toBeLessThan(10 * 1000);
    });

    it('Should calculate the rentalFee if input is valid', async () => {
        const res = await exec();

        rental = await Rental.findById(rental._id);
        const diff = rental.dateReturned - rental.dateOut;
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

        expect(rental.rentalFee).toBe(days * rental.movie.dailyRentalRate);
    });

    it('Should increase the movie stock if input is valid', async () => {
        const res = await exec();

        const movieInDb = await Movie.findById(movieId);

        expect(movieInDb.numberInStock).toBe(movie.numberInStock + 1);
    });

    it('Should return the rental if input is valid', async () => {
        const res = await exec();

        expect(Object.keys(res.body)).toEqual(
            expect.arrayContaining([
                'dateOut',
                'dateReturned',
                'rentalFee',
                'customer',
                'movie'
            ])
        );
    });
});