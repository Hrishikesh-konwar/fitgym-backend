import { BigQuery } from "@google-cloud/bigquery";
import dotenv from "dotenv";

import { generate6DigitNumber } from "../utils.js";

dotenv.config();

const credentials = {
  type: "service_account",
  project_id: process.env.GOOGLE_PROJECT_ID,
  private_key_id: "e86a45945b7f1c55b3962f8fe80e6ec4cc3d2b3a",
  private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  client_id: "106099264219896202590",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.GOOGLE_CLIENT_EMAIL)}`,
  universe_domain: "googleapis.com"
};


const bigquery = new BigQuery({
  projectId: credentials.project_id,
  credentials,
});
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
