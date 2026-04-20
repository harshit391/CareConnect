import { Request, Response } from "express";
import prisma from "../prisma";
import { CreateAppointmentDTO } from "../types/appointment.types";
import { reqE, reqS } from "../utils/logger.utils";
import { startOfDay, endOfDay } from "date-fns";

export const createAppointment = async (
    req: Request,
    res: Response
): Promise<void> => {
    const {
        userId,
        hospitalId,
        date,
        expiration,
        paidPrice,
    }: CreateAppointmentDTO = req.body;

    if (
        !userId ||
        !hospitalId ||
        !date ||
        !expiration ||
        paidPrice === undefined
    ) {
        res.status(400).json({ message: "Missing required fields" });
        return;
    }

    try {
        reqS("CREATE APPOINTMENT");

        const result = await prisma.$transaction(async (tx: any) => {
            const doctor = await tx.hospital.findUnique({
                where: { id: hospitalId },
            });

            if (!doctor) {
                throw new Error("Doctor not found");
            }

            const now = new Date();
            const nextDate = new Date(now);
            nextDate.setDate(now.getDate() + 1);

            let lastDate =
                doctor.freeSlotDate == null
                    ? nextDate
                    : new Date(doctor.freeSlotDate);

            if (lastDate <= now) {
                lastDate = nextDate;
            }

            const appointment = await tx.appointment.create({
                data: {
                    userId,
                    hospitalId,
                    date: lastDate,
                    paidPrice,
                },
            });

            const totalAppointments = await tx.appointment.count({
                where: { hospitalId, date: lastDate },
            });

            if (totalAppointments >= (doctor.maxAppointments || 20)) {
                const newLastDate = new Date(lastDate);
                newLastDate.setDate(lastDate.getDate() + 1);

                await tx.hospital.update({
                    where: { id: hospitalId },
                    data: {
                        freeSlotDate: newLastDate,
                    },
                });
            }

            return appointment;
        });

        res.status(201).send(result);

        reqE();
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to create appointment" });
    }
};

export const getAppointmentById = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { id } = req.params;

    try {
        const appointment = await prisma.appointment.findUnique({
            where: { id },
            include: {
                User: true,
                Hospital: {
                    include: {
                        parent: true,
                        specialities: true,
                    },
                },
            },
        });

        if (!appointment) {
            res.status(404).json({ message: "Appointment not found" });
            return;
        }

        const now = new Date();

        console.log("appointment", appointment);
        console.log("Current date:", now);
        console.log("Appointment date:", appointment.date);

        if (appointment.date < now && appointment.status === "PENDING") {
            await prisma.appointment.update({
                where: { id },
                data: {
                    status: "EXPIRED",
                },
            });
        }

        res.status(200).json(appointment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch appointment" });
        return;
    }
};

export const getAppointments = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { status } = req.query;

    console.log("Fetching appointments...");

    if (!status) {
        res.status(400).send({ error: "Status is required" });
        return;
    }

    try {
        const appointments = await prisma.appointment.findMany({
            where: {
                status: status as string,
            },
            include: {
                Hospital: {
                    include: {
                        specialities: true,
                    },
                },
                User: true,
            },
        });

        res.status(200).send(appointments);
    } catch (error) {
        console.error("Error fetching appointments:", error);
        res.status(500).send({ error: "Something went wrong" });
    }
};

export const getAppointmentsByDate = async (
    req: Request,
    res: Response
): Promise<void> => {
    console.log("Fetching appointments by date...");

    const { userId, role, date } = req.query;

    if (!userId) {
        res.status(400).send({ error: "User ID is required" });
        return;
    }

    if (!date) {
        res.status(400).send({ error: "Date is required" });
        return;
    }

    const selectedDate = new Date(date as string);
    const dayStart = startOfDay(selectedDate);
    const dayEnd = endOfDay(selectedDate);

    console.log("User ID:", userId);
    console.log("Date:", selectedDate);

    try {
        const appointments =
            role === "PATIENT"
                ? await prisma.appointment.findMany({
                      where: {
                          userId: userId as string,
                      },
                      orderBy: {
                          date: "desc",
                      },
                      include: {
                          Hospital: {
                              include: {
                                  specialities: true,
                              },
                          },
                          User: true,
                      },
                  })
                : await prisma.appointment.findMany({
                      where: {
                          date: {
                              gte: dayStart,
                              lte: dayEnd,
                          },
                          hospitalId: userId as string,
                      },
                      include: {
                          Hospital: {
                              include: {
                                  specialities: true,
                              },
                          },
                          User: true,
                      },
                  });

        res.status(200).send(appointments);
    } catch (error) {
        console.error("Error fetching appointments:", error);
        res.status(500).send({ error: "Something went wrong" });
    }
};

export const requestRefund = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;
        const { bankDetails } = req.body;
        const requesterId = req.idFromToken;

        if (!id) {
            res.status(400).send({ error: "Appointment ID is required" });
            return;
        }

        if (!bankDetails) {
            res.status(400).send({ error: "Bank details are required" });
            return;
        }

        const existing = await prisma.appointment.findUnique({ where: { id } });
        if (!existing || existing.userId !== requesterId) {
            res.status(403).send({ error: "Not authorized to modify this appointment" });
            return;
        }

        const appointment = await prisma.appointment.update({
            where: { id },
            data: {
                status: "REFUND_IN_PROGRESS",
                bankDetails,
            },
        });

        res.status(200).send(appointment);
    } catch (error) {
        console.error("Error updating appointment:", error);
        res.status(500).send({ error: "Something went wrong" });
    }
};

export const updateStatus = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;
        const { status, doctorCharges } = req.body;
        const requesterId = req.idFromToken;

        if (!id) {
            res.status(400).send({ error: "Appointment ID is required" });
            return;
        }

        if (!status) {
            res.status(400).send({ error: "Status is required" });
            return;
        }

        const existing = await prisma.appointment.findUnique({ where: { id } });
        if (!existing || (existing.userId !== requesterId && existing.hospitalId !== requesterId)) {
            res.status(403).send({ error: "Not authorized to modify this appointment" });
            return;
        }

        const statusUpperCase = status.toUpperCase();

        const appointment = await prisma.appointment.update({
            where: { id },
            data: { status: statusUpperCase, doctorCharges: doctorCharges },
        });

        res.status(200).send(appointment);
    } catch (error) {
        console.error("Error updating appointment:", error);
        res.status(500).send({ error: "Something went wrong" });
    }
};

export const approveRefund = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;

        console.log("Approving refund for appointment with ID:", id);

        if (!id) {
            res.status(400).send({ error: "Appointment ID is required" });
            return;
        }

        const appointment = await prisma.appointment.update({
            where: { id },
            data: { status: "REFUNDED" },
        });

        res.status(200).send(appointment);
    } catch (error) {
        console.error("Error approving refund:", error);
        res.status(500).send({ error: "Something went wrong" });
    }
};

export const rejectRefund = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;

        console.log("Rejecting refund for appointment with ID:", id);

        if (!id) {
            res.status(400).send({ error: "Appointment ID is required" });
            return;
        }

        const appointment = await prisma.appointment.update({
            where: { id },
            data: { status: "EXPIRED", bankDetails: {} },
        });

        res.status(200).send(appointment);
    } catch (error) {
        console.error("Error rejecting refund:", error);
        res.status(500).send({ error: "Something went wrong" });
    }
};

export const cancelAppointment = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;
        const requesterId = req.idFromToken;

        if (!id) {
            res.status(400).send({ error: "Appointment ID is required" });
            return;
        }

        const existing = await prisma.appointment.findUnique({ where: { id } });
        if (!existing || (existing.userId !== requesterId && existing.hospitalId !== requesterId)) {
            res.status(403).send({ error: "Not authorized to modify this appointment" });
            return;
        }

        const appointment = await prisma.appointment.update({
            where: { id },
            data: { status: "CANCELLED" },
        });

        res.status(200).send(appointment);
    } catch (error) {
        console.error("Error cancelling appointment:", error);
        res.status(500).send({ error: "Something went wrong" });
    }
};

export const payFine = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;
        const { fineAmount } = req.body;

        console.log("Paying fine for appointment with ID:", id);

        if (!id) {
            res.status(400).send({ error: "Appointment ID is required" });
            return;
        }

        const appointment = await prisma.appointment.update({
            where: { id },
            data: { paidCharges: fineAmount, doctorCharges: 0 },
        });

        res.status(200).send(appointment);
    } catch (error) {
        console.error("Error paying fine:", error);
        res.status(500).send({ error: "Something went wrong" });
    }
};
