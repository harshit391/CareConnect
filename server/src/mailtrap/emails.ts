import {
    PASSWORD_RESET_REQUEST_TEMPLATE,
    PASSWORD_RESET_SUCCESS_TEMPLATE,
    VERIFICATION_EMAIL_TEMPLATE,
    WELCOME_EMAIL,
} from "./emailTemplates";
import { client } from "./mailtrap.config";

export const sendVerificationEmail = async (
    email: string,
    verificationToken: string
) => {
    try {
        const response = await client.sendMail({
            from: "Care Connect",
            to: email,
            subject: "Verify your email",
            html: VERIFICATION_EMAIL_TEMPLATE.replace(
                "{verificationCode}",
                verificationToken
            ),
        });

        console.log("Email Sent SuccessFully", response);
    } catch (error) {
        console.log("Email Sent Failed", error);
        throw new Error("Email Sent Failed");
    }
};

export const sendWelcomeEmail = async (email: string, name: string) => {
    try {
        const response = await client.sendMail({
            from: "Care Connect",
            to: email,
            subject: "Logged in Success",
            html: WELCOME_EMAIL.replace("{company_info_name}", "Care Connect")
                .replace("{name}", name)
                .replace("{company_info_address}", process.env.COMPANY_ADDRESS || "CareConnect Healthcare")
                .replace("{company_info_city}", process.env.COMPANY_CITY || "New Delhi")
                .replace(
                    "{company_info_zip_code}",
                    process.env.COMPANY_ZIP || "110001"
                )
                .replace("{company_info_country}", process.env.COMPANY_COUNTRY || "India"),
        });

        console.log("Welcome Email Sent SuccessFully", response);
    } catch (error) {
        throw new Error("Welcome Email Sent Failed");
    }
};

export const sendPasswordResetEmail = async (email: string, resetURL: string) => {
    try {
        const response = await client.sendMail({
            from: "Care Connect",
            to: email,
            subject: "Reset Your Password",
            html: PASSWORD_RESET_REQUEST_TEMPLATE.replace(
                "{resetURL}",
                resetURL
            ),
        });

        console.log("Password Reset Email Sent SuccessFully", response);
    } catch (error) {
        console.log("Password Reset Email Sent Failed", error);
        throw new Error("Password Reset Email Sent Failed");
    }
};

export const sendResetSuccessfullEmail = async (email: string) => {
    try {
        const response = await client.sendMail({
            from: "Care Connect",
            to: email,
            subject: "Password Reset Successful",
            html: PASSWORD_RESET_SUCCESS_TEMPLATE,
        });

        console.log("Password Reset Success Email Sent SuccessFully", response);
    } catch (error) {
        console.log("Password Reset Success Email Sent Failed", error);
        throw new Error("Password Reset Success Email Sent Failed");
    }
};
