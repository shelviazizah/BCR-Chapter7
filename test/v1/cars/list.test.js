const request = require("supertest");
const app = require("../../../app");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dayjs = require("dayjs");
const { CarController, AuthenticationController } = require("../../../app/controllers");
const { User, Role, Car, UserCar } = require("../../../app/models");

const userModel = User;
const roleModel = Role;
const carModel = Car;
const userCarModel = UserCar;

const authController = new AuthenticationController({
  bcrypt,
  jwt,
  roleModel,
  userModel
});

const generateUser = async (mockData, role) => {
  return await authController.userModel.create({
    name: mockData.name,
    email: mockData.email,
    encryptedPassword: authController.encryptPassword(mockData.password),
    roleId: role.id
  });
};

describe("GET /v1/cars", () => {
  let token;
  let car;

  const mockCustomer = {
    name: "fikri",
    email: "fikri@gmail.com",
    password: "123456"
  };

  beforeAll(async () => {
    const userRole = await roleModel.findOne({ where: { name: "CUSTOMER" } });
    const user = await generateUser(mockCustomer, userRole);
    const accessToken = authController.createTokenFromUser(user, userRole);
    token = accessToken;
  });

  beforeEach(async () => {
    car = await Car.create({
      name: "Avanza",
      price: 100000,
      size: "Small",
      image: "image1.jpg",
    });
  });

  afterEach(async () => {
    if (car) {
      await car.destroy();
    }
  });

  it("should respond with 200 as status code", async () => {
    const name = "Avanza";
    const price = 100000;
    const size = "Small";
    const image = "image1.jpg";

    return request(app)
      .get("/v1/cars")
      .set("Content-Type", "application/json")
      .set("Authorization", `Bearer ${token}`)
      .then((res) => {
        expect(res.statusCode).toBe(200);
      });
  });
});
