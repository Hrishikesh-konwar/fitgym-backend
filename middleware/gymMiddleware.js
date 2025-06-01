import Joi from "joi";
import dotenv from "dotenv";
import { BigQuery } from "@google-cloud/bigquery";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

dotenv.config();

const bigquery = new BigQuery(); 
const validateCreateGym = (req, res, next) => {
  const { name, emailId, password, address } = req.body;

  const schema = Joi.object({
    name: Joi.string().required(),
    phone: Joi.number().required(),
    email_id: Joi.string().email().required(),
    password: Joi.string().required(),
  });
  const result = schema.validate(req.body);

  if (result.error) {
    return res.status(400).send(result.error.details[0].message);
  }
  next();
};

const validateLogin = async (req, res, next) => {
  const { email_id, password } = req.body;

  const schema = Joi.object({
    email_id: Joi.string().email().required(),
    password: Joi.string().required(),
  });
  const result = schema.validate(req.body);
  if (result.error) {
    return res.status(400).send(result.error.details[0].message);
  }

  const datasetId = process.env.DATASET_ID;
  const tableId = process.env.TABLE_ID;
  const projectId = process.env.PROJECT_ID;

  const query = `SELECT * FROM \`${projectId}.${datasetId}.${tableId}\` WHERE email_id = '${email_id}'`;
  const [rows] = await bigquery.query({ query });
  const gymDetails = rows[0];
  if (!gymDetails) {
    return res.status(400).send("Gym not found");
  }
  const isPasswordValid = await bcrypt.compare(password, gymDetails.hassed_password);
  if (!isPasswordValid) {
    return res.status(400).send("Invalid password");
  }
  req.gym = gymDetails;
  next();
};

const validateUser = async (req, res, next) => {
  const token = req.headers["x-auth-token"];
  if (!token) {
    return res.status(400).send("No token provided");
  }
  const decoded = await jwt.verify(token, process.env.JWT_SECRET);
  req.gym = decoded;
  next();
};

const validateMemberPayload = async (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    email_id: Joi.string().email().required(),
    phone: Joi.string().required(),
    joined_at: Joi.string().required(),
  });
  const result = schema.validate(req.body);
  if (result.error) {
    return res.status(400).send(result.error.details[0].message);
  }
  next();
};

const validatePayment = async (req, res, next) => {
  const schema = Joi.object({
    member_id: Joi.string().required(),
    payment_type: Joi.string().required(),
    payment_id: Joi.string().allow(null, ""),
    amount: Joi.string().required(),
    paid_at: Joi.string().required(),
    paid_till: Joi.string().required(),
  });
  const result = schema.validate(req.body);
  if (result.error) {
    return res.status(400).send(result.error.details[0].message);
  }
  next();
};

export {
  validateCreateGym,
  validateLogin,
  validateUser,
  validateMemberPayload,
  validatePayment,
};
