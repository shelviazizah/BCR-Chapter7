const request = require("supertest");
const app = require("../../../../app");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dayjs = require("dayjs");
const { AuthenticationController } = require("../../../../app/controllers");
const { User, Role, Car, } = require("../../../../app/models");

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

describe("PUT /v1/cars/:id", () => {
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

  it("should respond with 200 as status code", async () => {
    const name = "Avanza New";
    const price = 100000;
    const size = "Small";
    const image = "image1.jpg";

    const response = await request(app)
      .put("/v1/cars/" + car.id)
      .set("Content-Type", "application/json")
      .set("Authorization", `Bearer ${token}`)
      .send({ name, price, size, image });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        name,
        price,
        size,
        image,
      })
    );
  });

  it("should respond with 404 as status code", async () => {
    const id = [];
    const name = "Avanza";
    const price = 100000;
    const size = "Small";
    const image = "image1.jpg";

    const response = await request(app)
      .put("/v1/cars/" + id)
      .set("Content-Type", "application/json")
      .set("Authorization", `Bearer ${token}`)
      .send({ name, price, size, image });
      expect(response.statusCode).toBe(404);
      expect(response.body.error).toEqual(
      expect.objectContaining({
        name: expect.any(String),
        message: expect.any(String),
      })
    );
  });
});
