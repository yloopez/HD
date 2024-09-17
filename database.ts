import {createPool } from "mysql2/promise";
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const pool = createPool({
    host: process.env.MYSQL_HOST ,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
});

//I know this is not secure, this Email does not have any other use than testing this XOXO
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD_APP
    }
});

export async function subscribeEmail(email: string): Promise<void> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const query = "INSERT INTO SUBSCRIBER (SUB_EMAIL, SUB_ACTIVE, CONFIRM_TOKEN) VALUES (?, ?, ?)";
    try {
        await pool.query(query, [email, false, token]);

        const confirmUrl = `http://localhost:3000/confirm?token=${token}`;
        const mailOptions = {
            from: 'yebl20242024@gmail.com',
            to: email,
            subject: 'Confirm Your Subscription',
            html: `<p>Click the following link to confirm your subscription: <a href="${confirmUrl}">Confirm Subscription</a></p>`
        };
        await transporter.sendMail(mailOptions);
        
    } catch (error) {
        throw error;
    }
}

export async function confirmSubscription(token: string): Promise<{ error?: boolean; message?: string }> {
    try {
        const [rows] = await pool.query(`SELECT * FROM SUBSCRIBER WHERE CONFIRM_TOKEN = ?`, [token]);
        const subscribers: any[] = rows as any[];

        if (subscribers.length === 0) {
            return { error: true, message: 'Invalid or expired token.' };
        }

        const updateSql = `UPDATE SUBSCRIBER SET SUB_ACTIVE = TRUE, CONFIRM_TOKEN = NULL WHERE CONFIRM_TOKEN = ?`;
        await pool.query(updateSql, [token]);

        return { message: 'Subscription confirmed successfully!' };
    } catch (err) {
        console.error('Error during confirmation:', err);
        throw err;
    }
}

