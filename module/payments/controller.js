import dotenv from "dotenv";
import { BigQuery } from "@google-cloud/bigquery";

import { generate6DigitNumber } from "../utils.js";

dotenv.config();

const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
const bigquery = new BigQuery({
  projectId: credentials.project_id,
  credentials,
});


const createPayments = async (req, res) => {
  try {
    const { member_id, payment_type, payment_id, paid_at, paid_till, amount } =
      req.body;
    const gymDetails = req.gym;
    const datasetId = process.env.DATASET_ID;
    const tableId = "payments";
    const projectId = process.env.PROJECT_ID;

    const payload = {
      id: `payment_${generate6DigitNumber()}`,
      gym_id: gymDetails.id,
      member_id,
      payment_type,
      payment_id,
      amount : Number(amount),
      paid_at: new Date(paid_at).toISOString(),
      paid_till: new Date(paid_till).toISOString(),
      created_at: new Date().toISOString(),
    };

    await bigquery.dataset(datasetId).table(tableId).insert([payload]);

    return res.status(200).send({
      message: "Payment created successfully",
      data: payload,
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    return res.status(500).send({ message: "Internal server error", error });
  }
};

const getPayments = async (req, res) => {
  try {
    const { id: gym_id } = req.gym;
    const { member_id } = req.query;
    const datasetId = process.env.DATASET_ID;
    const tableId = "payments";
    const projectId = process.env.PROJECT_ID;

    const query = `SELECT * FROM \`${projectId}.${datasetId}.${tableId}\` WHERE member_id = '${member_id}'`;
    const [rows] = await bigquery.query({ query });

    res.status(200).send(rows);
  } catch (error) {
    console.log(error);
    res.status(400).send("Error :", error);
  }
};

const getPaymentsByGym = async (req, res) => {
  try {
    const { id: gym_id } = req.gym;
    const { limit = 1, offset = 0, startDate, endDate } = req.query;

    const datasetId = process.env.DATASET_ID;
    const projectId = process.env.PROJECT_ID;

    const params = [
      {
        name: "gym_id",
        parameterType: { type: "STRING" },
        parameterValue: { value: gym_id },
      },
    ];

    // Base WHERE clause
    let whereClause = `WHERE p.gym_id = @gym_id`;

    // Optional: Default to current month if no dates provided
    let effectiveStartDate = startDate;
    let effectiveEndDate = endDate;
    if (!startDate && !endDate) {
      const today = new Date();
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      effectiveStartDate = firstOfMonth.toISOString().split("T")[0];
      effectiveEndDate = today.toISOString().split("T")[0];
    }

    if (effectiveStartDate) {
      whereClause += " AND p.paid_at >= @startDate";
      params.push({
        name: "startDate",
        parameterType: { type: "DATE" },
        parameterValue: { value: effectiveStartDate },
      });
    }

    if (effectiveEndDate) {
      whereClause += " AND p.paid_at <= @endDate";
      params.push({
        name: "endDate",
        parameterType: { type: "DATE" },
        parameterValue: { value: effectiveEndDate },
      });
    }

    // 1. Get total count
    const countQuery = `
      SELECT COUNT(*) as totalCount
      FROM \`${projectId}.${datasetId}.payments\` p
      ${whereClause}
    `;

    const [countResult] = await bigquery.query({
      query: countQuery,
      params: params.reduce((acc, { name, parameterValue }) => {
        acc[name] = parameterValue.value;
        return acc;
      }, {}),
    });

    const totalCount = countResult[0]?.totalCount || 0;

    // 2. Get paginated data
    const dataQuery = `
      SELECT p.*, m.name AS member_name
      FROM \`${projectId}.${datasetId}.payments\` p
      LEFT JOIN \`${projectId}.${datasetId}.members\` m
      ON p.member_id = m.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT @limit OFFSET @offset
    `;

    const fullParams = [
      ...params,
      {
        name: "limit",
        parameterType: { type: "INT64" },
        parameterValue: { value: parseInt(limit) },
      },
      {
        name: "offset",
        parameterType: { type: "INT64" },
        parameterValue: { value: parseInt(offset) },
      },
    ];

    const [rows] = await bigquery.query({
      query: dataQuery,
      params: fullParams.reduce((acc, { name, parameterValue }) => {
        acc[name] = parameterValue.value;
        return acc;
      }, {}),
    });

    // 3. Get total amount for selected dates
    const amountQuery = `
      SELECT SUM(p.amount) AS total_amount
      FROM \`${projectId}.${datasetId}.payments\` p
      ${whereClause}
    `;

    const [amountResult] = await bigquery.query({
      query: amountQuery,
      params: params.reduce((acc, { name, parameterValue }) => {
        acc[name] = parameterValue.value;
        return acc;
      }, {}),
    });

    const totalAmount = amountResult[0]?.total_amount || 0;

    // 4. Get last month's total amount
    const currentMonthAmountQuery = `
    SELECT SUM(p.amount) AS current_month_amount
    FROM \`${projectId}.${datasetId}.payments\` p
    WHERE p.gym_id = @gym_id
      AND DATE(p.paid_at) BETWEEN 
          DATE_TRUNC(CURRENT_DATE(), MONTH)
          AND CURRENT_DATE()
  `;

    const [currentMonthResult] = await bigquery.query({
      query: currentMonthAmountQuery,
      params: {
        gym_id,
      },
    });

    const currentMonthAmount = currentMonthResult[0]?.current_month_amount || 0;

    // ✅ Final response
    res.status(200).send({
      data: rows,
      totalCount,
      totalAmount,
      currentMonthAmount,
    });
  } catch (error) {
    console.error("BigQuery Error:", error);
    res
      .status(500)
      .send({ error: "Internal Server Error", details: error.message });
  }
};

const seed = async (req, res) => {
  const datasetId = process.env.DATASET_ID;
  const tableId = "payments";
  const projectId = process.env.PROJECT_ID;

  const payload = [];
  // await bigquery.dataset(datasetId).table(tableId).insert(payload);

  return res.status(200).send({ message: "Data seeded" });
};

export { createPayments, getPayments, getPaymentsByGym, seed };
