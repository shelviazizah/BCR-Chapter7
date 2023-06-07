
const dayjs = require('dayjs');
const { CarController } = require('../controllers');

const { Car, UserCar } = require('../../app/models');

const carModel = Car;
const userCarModel = UserCar;
const carController = new CarController({ carModel, userCarModel, dayjs });

describe('Get list query from request', () => {
    const mockReq = {
        query: {
            size: 10,
            availableAt: new Date(),
        },
    };

    it('it must return object from inputted query from request', () => {
        let response = carController.getListQueryFromRequest(mockReq);
        expect(response).toBeDefined();
    });
});