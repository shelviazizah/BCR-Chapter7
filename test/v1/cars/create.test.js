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

// const carController = new CarController({
//   carModel,
//   userCarModel,
//   dayjs
// });

const generateUser = async (mockData, role) => {
  return await authController.userModel.create({
    name: mockData.name,
    email: mockData.email,
    encryptedPassword: authController.encryptPassword(mockData.password),
    roleId: role.id
  });
};

// const generateCar = async (mockData) => {
//   return await carController.carModel.create({
//     name: mockData.name,
//     price: mockData.price,
//     image: mockData.image,
//     size: mockData.size,
//     isCurrentlyRented: false
//   });
// };

describe("POST /v1/cars", () => {
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

  it("should respond with status code 201", async () => {
    const name = "Avanza";
    const price = 100000;
    const size = "Small";
    const image = "image1.jpg";

    const response = await request(app)
      .post("/v1/cars")
      .set("Content-Type", "application/json")
      .set("Authorization", `Bearer ${token}`)
      .send({ name, price, size, image });
      expect(response.statusCode).toBe(201);
      expect(response.body).toEqual(
      expect.objectContaining({
        name,
        price,
        size,
        image
      })
    );
  });

  it("should respond with status code 422", async () => {
    const mockAdmin = {
      name: "brian",
      email: "brian@gmail.com",
      password: "123456"
    };
  
    const adminRole = await roleModel.findOne({ where: { name: "ADMIN" } });
    const user = await generateUser(mockAdmin, adminRole);
    const accessToken = authController.createTokenFromUser(user, adminRole);
    const token = accessToken;
  
    const name = ['False'];
    const price = "1000";
    const size = "Small";
    const image = "";
  
    const response = await request(app)
      .post("/v1/cars")
      .set("Content-Type", "application/json")
      .set("Authorization", `Bearer ${token}`)
      .send({ name, price, size, image });
  
    expect(response.statusCode).toBe(422);
    expect(response.body).toEqual(
      expect.objectContaining({
        error: {
          name: expect.any(String),
          message: expect.any(String)
        }
      })
    );
  });  
});
