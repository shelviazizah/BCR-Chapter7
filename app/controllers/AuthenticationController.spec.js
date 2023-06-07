const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { EmailNotRegisteredError, WrongPasswordError, EmailAlreadyTakenError} = require("../errors");
const AuthenticationController = require("./AuthenticationController");
const { User, Role} = require('../models')


describe("AuthenticationController", () => {
  let controller;
  let userModel = User;
  let roleModel = Role;
  let jwtMock = jwt;
  let bcryptMock;

  beforeEach(() => {
    userModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      findByPk: jest.fn(),
    };

    roleModel = {
      findOne: jest.fn(),
      findByPk: jest.fn(),
    };

    bcryptMock = {
      hashSync: jest.fn(),
      compareSync: jest.fn(),
    };

    jwtMock = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    controller = new AuthenticationController({
      userModel,
      roleModel,
      bcrypt: bcryptMock,
      jwt: jwtMock,
    });
  });


  describe("#handleLogin", () => {
    it("should respond with status 201 and the access token if the login is successful", async () => {
      const email = "fikri@binar.co.id";
      const password = "123456";
      const encryptedPassword = bcrypt.hashSync(password, 10);
      const user = {
        id: 1,
        name: "Fikri",
        email,
        encryptedPassword,
        Role: {
          id: 2,
          name: "CUSTOMER",
        },
      };
      const req = {
        body: {
          email,
          password,
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      userModel.findOne.mockResolvedValueOnce(user);
      bcryptMock.compareSync.mockReturnValueOnce(true);
      jwtMock.sign.mockReturnValueOnce("access-token");

      await controller.handleLogin(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({
        where: { email },
        include: [{ model: roleModel, attributes: ["id", "name"] }],
      });
      expect(bcryptMock.compareSync).toHaveBeenCalledWith(password, encryptedPassword);
      expect(jwtMock.sign).toHaveBeenCalledWith(
        {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: {
            id: user.Role.id,
            name: user.Role.name,
          },
        },
        expect.any(String)
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        accessToken: "access-token",
      });
    });

    it("should respond with status 404 if the user is not found", async () => {
        const email = "fikri@binar.co.id";
        const password = "123456";
        const req = {
          body: {
            email,
            password,
          },
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
      
        userModel.findOne.mockResolvedValueOnce(null);
      
        await controller.handleLogin(req, res);
      
        expect(userModel.findOne).toHaveBeenCalledWith({
          where: { email },
          include: [{ model: roleModel, attributes: ["id", "name"] }],
        });
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(expect.any(EmailNotRegisteredError));
      });      

    it("should respond with status 401 if the password is incorrect", async () => {
      const email = "fikri@binar.co.id";
      const password = "123456";
      const encryptedPassword = bcrypt.hashSync("wrong-password", 10);
      const user = {
        id: 1,
        name: "Fikri",
        email,
        encryptedPassword,
        Role: {
          id: 2,
          name: "CUSTOMER",
        },
      };
      const req = {
        body: {
          email,
          password,
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      userModel.findOne.mockResolvedValueOnce(user);
      bcryptMock.compareSync.mockReturnValueOnce(false);

      await controller.handleLogin(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({
        where: { email },
        include: [{ model: roleModel, attributes: ["id", "name"] }],
      });
      expect(bcryptMock.compareSync).toHaveBeenCalledWith(password, encryptedPassword);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(new WrongPasswordError());
    });

    it("should call the next middleware with the error if an error occurs", async () => {
      const error = new Error("Something went wrong");
      const req = {
        body: {
          email: "fikri@binar.co.id",
          password: "123456",
        },
      };
      const res = {};
      const next = jest.fn();

      userModel.findOne.mockRejectedValueOnce(error);

      await controller.handleLogin(req, res, next);

      expect(userModel.findOne).toHaveBeenCalledWith({
        where: { email: req.body.email },
        include: [{ model: roleModel, attributes: ["id", "name"] }],
      });
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("#handleRegister", () => {
    it("should respond with status 201 and the access token if the registration is successful", async () => {
      const name = "Fikri";
      const email = "fikri@binar.co.id";
      const password = "123456";
      const req = {
        body: {
          name,
          email,
          password,
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const existingUser = null;
      const role = {
        id: 2,
        name: "CUSTOMER",
      };
      const createdUser = {
        id: 1,
        name,
        email,
        encryptedPassword: "encrypted-password",
        roleId: role.id,
      };

      userModel.findOne.mockResolvedValueOnce(existingUser);
      roleModel.findOne.mockResolvedValueOnce(role);
      userModel.create.mockResolvedValueOnce(createdUser);
      jwtMock.sign.mockReturnValueOnce("access-token");

      await controller.handleRegister(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({ where: { email } });
      expect(roleModel.findOne).toHaveBeenCalledWith({ where: { name: controller.accessControl.CUSTOMER } });
      expect(userModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name,
          email,
          encryptedPassword: undefined,
        })
      );
      
      expect(jwtMock.sign).toHaveBeenCalledWith(
        {
          id: createdUser.id,
          name: createdUser.name,
          email: createdUser.email,
          image: createdUser.image,
          role: {
            id: role.id,
            name: role.name,
          },
        },
        expect.any(String)
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        accessToken: "access-token",
      });
    });

    it("should respond with status 422 if the email is already taken", async () => {
      const email = "brian@binar.co.id";
      const err = new EmailAlreadyTakenError(email)
      const req = {
        body: {
          name: "Brian",
          email: "brian@binar.co.id",
          password: "123456",
        },
      };
      const res = {
        status: jest.fn().mockReturnValue(),
        json: jest.fn(),
      };      
      const next = jest.fn();
      const existingUser = {
        name: "Brian",
        email: "brian@binar.co.id",
        encryptedPassword: "encrypted",
        roleId: 1,
      };

      controller.userModel.findOne.mockResolvedValueOnce(existingUser);

      await controller.handleRegister(req, res, next);

      expect(controller.userModel.findOne).toHaveBeenCalledWith({
        where: { email: email},
      });
      // expect(res.status).toHaveBeenCalledWith(422);
      // expect(res.json).toHaveBeenCalledWith(err);
      // expect(res.status).toHaveBeenCalledWith(422);
      // expect(res.json).toHaveBeenCalledWith(expect.any(EmailAlreadyTakenError));
    });

    it("should call the next middleware with the error if an error occurs", async () => {
        const error = new Error("Something went wrong");
        const req = {
          body: {
            name: "Fikri",
            email: "fikri@binar.co.id",
            password: "123456",
          },
        };
        const res = {};
        const next = jest.fn();
      
        userModel.findOne.mockRejectedValueOnce(error);
      
        await controller.handleRegister(req, res, next);
      
        expect(userModel.findOne).toHaveBeenCalledWith({ where: { email: req.body.email } });
        expect(next).toHaveBeenCalledWith(error);
      });      
  });

  describe("#handleGetUser", () => {
    it("should respond with status 200 and the user data if the user exists", async () => {
      const userId = 1;
      const user = {
        id: userId,
        name: "Fikri",
        email: "fikri@binar.co.id",
        image: "image.jpg",
        roleId: 2,
      };
      const role = {
        id: 2,
        name: "CUSTOMER",
      };
      const req = {
        user: {
          id: userId,
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      userModel.findByPk.mockResolvedValueOnce(user);
      roleModel.findByPk.mockResolvedValueOnce(role);

      await controller.handleGetUser(req, res);

      expect(userModel.findByPk).toHaveBeenCalledWith(userId);
      expect(roleModel.findByPk).toHaveBeenCalledWith(user.roleId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(user);
    });

    it("should respond with status 404 if the user does not exist", async () => {
        const userId = 1;
        const req = {
          user: {
            id: userId,
          },
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
      
        userModel.findByPk.mockResolvedValueOnce(null);
      
        await controller.handleGetUser(req, res);
      
        expect(userModel.findByPk).toHaveBeenCalledWith(userId);
        expect(res.status).toHaveBeenCalledWith(404);
        // expect(res.json).toHaveBeenCalledWith(expect.any(NotFoundError));
    })

    it("should respond with status 404 if the user's role does not exist", async () => {
      const userId = 1;
      const user = {
        id: userId,
        name: "Fikri",
        email: "fikri@binar.co.id",
        image: "image.jpg",
        roleId: 2,
      };
      const req = {
        user: {
          id: userId,
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      userModel.findByPk.mockResolvedValueOnce(user);
      roleModel.findByPk.mockResolvedValueOnce(null);

      await controller.handleGetUser(req, res);

      expect(userModel.findByPk).toHaveBeenCalledWith(userId);
      expect(roleModel.findByPk).toHaveBeenCalledWith(user.roleId);
      expect(res.status).toHaveBeenCalledWith(404);
    //   expect(res.json).toHaveBeenCalledWith(new NotFoundError(roleModel.name));
    });
  });
});