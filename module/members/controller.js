import { BigQuery } from "@google-cloud/bigquery";
import dotenv from "dotenv";

import { generate6DigitNumber } from "../utils.js";

dotenv.config();

const bigquery = new BigQuery();

const createMember = async (req, res) => {
  const { id: gym_id, name: gym_name } = req.gym;
  const { name, email_id, phone, joined_at } = req.body;
  try {
    const datasetId = process.env.DATASET_ID;
    const tableId = "members";
    const projectId = process.env.PROJECT_ID;

    const query = `SELECT * FROM \`${projectId}.${datasetId}.${tableId}\` WHERE email_id = '${email_id}' AND gym_id = '${gym_id}'`;
    const [rows] = await bigquery.query({ query });

    if (rows.length > 0) {
      return res.status(400).json({ message: "Member already exists" });
    }

    const payload = {
      id: `${gym_name.toLowerCase().slice(0, 4)}_${generate6DigitNumber()}`,
      gym_id,
      name,
      email_id,
      phone,
      joined_at: new Date(joined_at).toISOString(),
      created_at: new Date().toISOString(),
    };

    await bigquery.dataset(datasetId).table(tableId).insert([payload]);

    return res.status(200).send({
      message: "Member created successfully",
      data: payload,
    });
  } catch (error) {
    console.error("Insert Error:", JSON.stringify(error, null, 2));
    return res
      .status(400)
      .send({ message: "Error inserting row", error: error.message });
  }
};

const getMembers = async (req, res) => {
  try {
    const { id: gym_id } = req.gym;
    const datasetId = process.env.DATASET_ID;
    const tableId = 'members';
    const projectId = process.env.PROJECT_ID;

    const query = `SELECT * FROM \`${projectId}.${datasetId}.${tableId}\` WHERE gym_id = '${gym_id}' ORDER BY name`;
    const [rows] = await bigquery.query({ query });

    res.status(200).send(rows);
  } catch (error) {
    console.log(error);
    res.status(400).send("Error :", error);
  }
};

const getMemberById = async () => {
  const { id: gym_id } = req.gym;
  const { member_id } = req.query;
  try {
    const query = `SELECT * FROM \`${projectId}.${datasetId}.${tableId}\` WHERE gym_id = '${gym_id}' AND id = '${member_id}'`;
    const [rows] = await bigquery.query({ query });

    res.status(200).send(rows[0]);
  } catch (error) {
    console.log(error);
    res.status(400).send("Error :", error);
  }
};
export { createMember, getMembers, getMemberById };
