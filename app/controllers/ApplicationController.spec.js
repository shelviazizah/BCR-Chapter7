const { NotFoundError } = require("../errors");
const ApplicationController = require("./ApplicationController");
const ApplicationError = require('../errors/ApplicationError')

describe('ApplicationError', () => {
  it('This Application Error', () => {
    const error = new ApplicationError('Error', 'Error', { });

    expect(error.name).toBe('Error');
    expect(error.message).toBe('Error');
    expect(error.details).toEqual({});
  });

  it('should return the correct JSON representation', () => {
    const error = new ApplicationError('Error', 'Error', { });
    const expectedJSON = {
      error: {
        name: 'Error',
        message: 'Error',
        details: { },
      },
    };

    const json = error.toJSON();
    expect(json).toEqual(expectedJSON);
  });
});


describe("ApplicationController", () => {
  let controller;

  beforeEach(() => {
    controller = new ApplicationController();
    error = new ApplicationError();
  });

  describe("#handleGetRoot", () => {
    it("should respond with status 200 and the expected response body", () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      controller.handleGetRoot(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: "OK",
        message: "BCR API is up and running!",
      });
    });
  });

  describe("#handleNotFound", () => {
    it("should respond with status 404 and the expected error response body", () => {
      const req = {
        method: "GET",
        url: "/not-found",
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      controller.handleNotFound(req, res);

      const expectedError = new NotFoundError(req.method, req.url);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          name: expectedError.name,
          message: expectedError.message,
          details: expectedError.details,
        },
      });
    });
  });

  describe("#handleError", () => {
    it("should respond with status 500 and the expected error response body", () => {
      const err = new ApplicationError();
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      controller.handleError(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      // expect(res.json).toHaveBeenCalledWith(new ApplicationError());
      expect(res.json).toHaveBeenCalledWith({
        error: {
          name: err.name,
          message: err.message,
          details: err.details || null,
        },
      });
    });
  });

  describe("#getOffsetFromRequest", () => {
    it("should return the correct offset value based on the request query", () => {
      const req = {
        query: {
          page: "3",
          pageSize: "10",
        },
      };

      const offset = controller.getOffsetFromRequest(req);

      expect(offset).toBe(20);
    });

    it("should return the default offset value if the request query does not provide page and pageSize", () => {
      const req = {
        query: {},
      };

      const offset = controller.getOffsetFromRequest(req);

      expect(offset).toBe(0);
    });
  });

  describe("#buildPaginationObject", () => {
    it("should return the correct pagination object based on the request query and count", () => {
      const req = {
        query: {
          page: "2",
          pageSize: "5",
        },
      };
      const count = 15;

      const pagination = controller.buildPaginationObject(req, count);

      expect(pagination).toEqual({
        page: "2",
        pageCount: 3,
        pageSize: "5",
        count: 15,
      });
    });

    it("should return the default pagination object if the request query does not provide page and pageSize", () => {
      const req = {
        query: {},
      };
      const count = 20;

      const pagination = controller.buildPaginationObject(req, count);

      expect(pagination).toEqual({
        page: 1,
        pageCount: 2,
        pageSize: 10,
        count: 20,
      });
    });
  });
});

