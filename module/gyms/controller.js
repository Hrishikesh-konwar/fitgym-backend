import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { BigQuery } from "@google-cloud/bigquery";

import { generate6DigitNumber, getHashedPassword } from "../utils.js";

// const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

const GOOGLE_KPRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCqUCbxh8c6zY9z\n70tSd2SR4Z8nlRqDwPH6zpbKVbWFZDfy5jAPtl/caoUhi04F8wU6x4Nes8HyqJeR\ndVGN8ptK28utHFksfGWCEkRkcMOirCqRo424QQWvfnehQeQmDT5JyJ8O5OCcBgAt\nCPL0MDulSc0JEPRXeBzCfp66mpMRiCaZvdgwXmtgUHRE1U91eBiMXMzzCURAcMIm\nWCdSM40U6JnZndYF5dJhsHge7fN7YZzE54bfw6vIyuEOFTN+Pi9DxFf2VIzCab2R\nymjqyOW033qE2J0yfHYDADCHG17UhJnh86stcLxzoXddYXcCwlJ4hudVr83srn0R\ng7YsLBDdAgMBAAECggEAE01/yG6i4DGFkXZ80zUobxdC/k26IlYnJs2szfReXSax\nZ6R6rIE3RqhE+/sJpgd334RWyZA2il3cxdXl3yBwxNB5+l4E5lOX/qC64yZbqe94\n6KZAjPJDpnL/NIXfCYgFOAAWtO2wXkaY1QHXZWElFXPymtUy2EoK+mk27L/RrNIR\no1upJTovXYo7ACNynD8OfgfQG6OhHTZI8HdU73F1niyxtzGB+Bsr3YT29Vp4i1Sl\n93KJPlYbsVSB97CNLtYiXUtrJxOWaB41hAORFnyApQqKY+I8Hx+4ZMOfsbXdNZuY\niF+EdgUfwmSFtnv1U+VG+H/JZ42FKJS9zwfQ/MBZ2QKBgQDq097wu9FRKgMaLVDn\nG24ljeSKUcFGFPdu7+ERDm4gShkqVd9uXudWRs2ExaUi/jYKDPSRFbpeI11rgkRe\nXOUFX6cWRrtQ+2b/9/Jk+uan7ZD4hQ+0GRJDxPSLGCsdMU+1SMEveh7ydedDTw8s\nLrs++rVQGbxLlxEvdC5wArW9dQKBgQC5qzOTpeTohcakiG1vvxgY/TOF4dXThkAi\nGX8Pe5meDkqTUcLlovCG/U//7SBAkYhX9d/k6giuktFoM4YDPXpzQvqhHK6GaePU\nR7OQlGanFf5IkLURIrnWIl6FBArOXErREysYmkk9mI/VSxHA+Mxt6RDl95mzzlL9\ntutYHbcQyQKBgHPld32GpMsTGg7cWLaHIjikrCvcJ7CH/oqhF4qMfauwBnWPhkN5\n0WESdrJVvafkoRUaycWlXKLDf4Lk+ws7e8jIKbXj2OUh/vbMD7To49fzdv5A5bw0\nN4B8/1h66CRzRuyo6Lee5REzQZ1Fsq5SrhVqNPxAh18jQtcR1y1vGPVVAoGASZgD\nrJ2QG16TOzpcbnPHYHhUiNfYQqyvFRUYGRH79PtjMfuxjgZE4qzbnezm4NEOwxbR\ndVISuOe3G1942iXvOGqvH1dYEi08wjLdiQxZmBcOoMLDEpS6Jpee8YiFpABPI4o+\nhdT5/PFQ6dGEqwGzPkmoig7XnL7GhIyRwm6c1okCgYEAqXSsSs+bCKA0XsGS+pNz\nT3ATQ81dGfO2dbg5/E4Uxli4LxkmdXlhxJ3N1/XvSGPU/KB7JD25G/q27Ce0Csp8\nrsOnSOd0Jx1oyu618oWsYwwJWgxRrXm4I1BBzWosC16k6MOjvPqbVJWu/a+4WXE9\nb14/OoRIP6UxzbvW1wGAKOs=\n-----END PRIVATE KEY-----\n"

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


dotenv.config();
const createGym = async (req, res) => {
  try {
    const { name, phone, email_id, password } = req.body;

    const datasetId = "gyms";
    const tableId = "gym";

    const hassedPassword = await getHashedPassword(password);

    const gym = {
      id: `Proxima_${generate6DigitNumber()}`,
      name,
      email_id,
      phone,
      role: "owner",
    };

    const query = `
    SELECT * 
    FROM \`nebulagym.gyms.gym\` 
    WHERE phone = ${phone}`;

    const [rows] = await bigquery.query({ query });
    if (rows.length > 0) {
      return res.status(400).send({ message: "Gym already exists" });
    }

    const payload = {
      id: gym.id,
      name: gym.name,
      email_id: gym.email_id,
      password: password,
      hassed_password: hassedPassword,
      role: "owner",
      phone: gym.phone,
      created_at: new Date().toISOString(),
    };

    const result = await bigquery
      .dataset(datasetId)
      .table(tableId)
      .insert([payload]);

    const token = jwt.sign(gym, process.env.JWT_SECRET );
    return res.header("x-auth-token", token).status(200).send(gym);
  } catch (error) {
    console.log(error);
    return res.status(400).send("Error :", error.message);
  }
};

const getGymDetials = async (req, res) => {
  try {
    const { id } = req.gym;
    const datasetId = process.env.DATASET_ID;
    const tableId = "gym";
    const projectId = process.env.PROJECT_ID;
    const query = `SELECT * FROM \`${projectId}.${datasetId}.${tableId}\` WHERE id = '${id}'`;
    const [rows] = await bigquery.query({ query });
    const gymDetails = rows[0];

    delete gymDetails.password;
    delete gymDetails.hassed_password;

    const token = jwt.sign(gymDetails, process.env.JWT_SECRET);

    return res.header("x-auth-token", token).status(200).send(gymDetails);
  } catch (error) {
    console.log(error);
    return res.status(400).send("Error :", error);
  }
};

const getDashboardDetails = async (req, res) => {
  try {
    const { id: gymId } = req.gym;
    const datasetId = process.env.DATASET_ID;
    const projectId = process.env.PROJECT_ID;

    // 1. Total number of members in the gym
    const memberCountQuery = `
      SELECT COUNT(*) AS member_count
      FROM \`${projectId}.${datasetId}.members\`
      WHERE gym_id = '${gymId}'
    `;

    // 2. Members whose paid_till is between 1st of the current month and the next 7 days
    const upcomingPaymentsQuery = `
      SELECT 
      m.id, 
      m.name, 
      m.email_id, 
      m.phone, 
      latest_payment.paid_till
      FROM \`${projectId}.${datasetId}.members\` m
      JOIN (
        SELECT 
        member_id, 
        MAX(paid_till) AS paid_till
        FROM \`${projectId}.${datasetId}.payments\`
        GROUP BY member_id
      ) latest_payment
      ON m.id = latest_payment.member_id
      WHERE m.gym_id = '${gymId}'
        AND DATE(TIMESTAMP(latest_payment.paid_till)) BETWEEN DATE_TRUNC(CURRENT_DATE(), MONTH)
        AND DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY)
    `;

    // 3. Total payment amount collected in the current month
    const currentMonthPaymentsQuery = `
      SELECT SUM(amount) AS total_amount
      FROM \`${projectId}.${datasetId}.payments\`
      WHERE gym_id = '${gymId}'
        AND DATE(TIMESTAMP(paid_at)) BETWEEN DATE_TRUNC(CURRENT_DATE(), MONTH)
        AND LAST_DAY(CURRENT_DATE())
    `;

        // 4. Total active members (paid_till after start of current month)
        const activeMembersQuery = `
        SELECT COUNT(*) AS active_member_count
        FROM (
          SELECT 
            member_id, 
            MAX(paid_till) AS latest_paid_till
          FROM \`${projectId}.${datasetId}.payments\`
          GROUP BY member_id
        ) latest
        JOIN \`${projectId}.${datasetId}.members\` m
          ON m.id = latest.member_id
        WHERE m.gym_id = '${gymId}'
          AND DATE(TIMESTAMP(latest.latest_paid_till)) >= DATE_TRUNC(CURRENT_DATE(), MONTH)
      `;
  

    // Run all queries in parallel
    const [
      memberCountResult,
      upcomingPaymentsResult,
      currentMonthAmountResult,
      activeMembersResult
    ] = await Promise.all([
      bigquery.query({ query: memberCountQuery }),
      bigquery.query({ query: upcomingPaymentsQuery }),
      bigquery.query({ query: currentMonthPaymentsQuery }),
      bigquery.query({ query: activeMembersQuery }),
    ]);

    // Build the response
    const response = {
      memberCount: memberCountResult[0][0].member_count,
      upcomingPayments: upcomingPaymentsResult[0],
      revenue: currentMonthAmountResult[0][0].total_amount || 0,
      totalActiveMembers: activeMembersResult[0][0].active_member_count || 0,
    };

    // Send success response
    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching dashboard details:", error);
    res.status(500).json({ error: "Failed to fetch dashboard details" });
  }
};

export { createGym, getGymDetials, getDashboardDetails };
