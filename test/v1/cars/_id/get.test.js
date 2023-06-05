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

describe("GET /v1/cars/:id", () => {
  let car;
  let token;

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
    const response = await request(app)
      .get("/v1/cars/" + car.id)
      .set("Authorization", `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        name: car.name,
        price: car.price,
        size: car.size,
        image: car.image,
      })
    );
  });

  // it("should respond with 404 as status code", async () => {
    // const id = -98;
  
    // const response = await request(app)
      // .get("/v1/cars/-100")
      // .set("Authorization", `Bearer ${token}`);
    // expect(response.statusCode).toBe(404);

    // if (response.statusCode === 404) {
    //   expect(response.body).toEqual(
    //     expect.not.objectContaining({
    //       id: id,
    //     })
    //   );
    // }
  
    // expect(response.body.error).toEqual(
    //   expect.objectContaining({
    //     name: expect.any(String),
    //     message: expect.any(String),
    //   })
    // );
  // });
  
});
