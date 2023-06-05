const request = require("supertest");
const app = require("../../../../app");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dayjs = require("dayjs");
const { AuthenticationController } = require("../../../../app/controllers");
const { User, Role, Car, UserCar } = require("../../../../app/models");

const userModel = User;
const roleModel = Role;
const carModel = Car;

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


describe("DELETE /v1/cars/:id", () => {
  let car;
  let token;

  const mockAdmin = {
    name: "brian",
    email: "brian@gmail.com",
    password: "123456"
  };

  beforeAll(async () => {
    const adminRole = await roleModel.findOne({ where: { name: "ADMIN" } });
    const user = await generateUser(mockAdmin, adminRole);
    const accessToken = authController.createTokenFromUser(user, adminRole);
    token = accessToken;
  });

  beforeEach(async () => {
    car = await carModel.create({
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

  it("should respond with 204 as status code", async () => {
    return request(app)
      .delete("/v1/cars/" + car.id)
      .set("Authorization", `Bearer ${token}`)
      .then((res) => {
        expect(res.statusCode).toBe(204);
      });
  });

  // it("should respond with 404 as status code", async () => {
  //   return request(app)
  //     .delete("/v1/cars/-100")
  //     .set("Authorization", `Bearer ${token}`)
  //     .then((res) => {
  //       expect(res.statusCode).toBe(404);
  //       expect(res.body.error).toEqual(
  //         expect.objectContaining({
  //           name: expect.any(String),
  //           message: expect.any(String),
  //         })
  //       );
  //     });
  // });
});
