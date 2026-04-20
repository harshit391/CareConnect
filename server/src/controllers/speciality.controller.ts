import { Request, Response } from "express";
import prisma from "../prisma";

export const getAllSpecialities = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { severity } = req.query;
        console.log("Received severity:", severity);

        const allSpecialities = await prisma.speciality.findMany({
            select: {
                id: true,
                name: true,
                description: true,
                tags: true,
                count: true,
            },
        });

        let filteredSpecialities = allSpecialities;

        if (
            severity &&
            ["Low", "Moderate", "High"].includes(severity as string)
        ) {
            const specialitiesWithMatchCount = allSpecialities.map(
                (speciality: any) => {
                    const matchingTagsCount = speciality.tags.filter((tag: any) => {
                        const tagObj =
                            typeof tag === "string" ? JSON.parse(tag) : tag;
                        return tagObj.severity === severity;
                    }).length;

                    return {
                        ...speciality,
                        matchingTagsCount,
                    };
                }
            );

            filteredSpecialities = specialitiesWithMatchCount
                .filter((speciality: any) => speciality.matchingTagsCount > 0)
                .sort((a: any, b: any) => b.matchingTagsCount - a.matchingTagsCount);
        }

        console.log("Filtered specialities:", filteredSpecialities.length);

        res.status(200).send(filteredSpecialities);
    } catch (error) {
        console.error("Error fetching specialties:", error);
        res.status(500).send({
            message: "An error occurred while fetching specialties",
            error,
        });
    }
};

export const getSpecialityIds = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const allSpecialities = await prisma.speciality.findMany({
            select: {
                id: true,
            },
        });

        const ids = allSpecialities.map((speciality: any) => speciality.id);

        res.status(200).send({ ids: ids });
    } catch (error) {
        console.error("Error fetching specialties:", error);
        res.status(500).send({
            message: "An error occurred while fetching specialties",
            error,
        });
    }
};

export const getTopSpecialities = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { severity } = req.query;

        console.log("Received severity:", severity);

        if (
            !severity ||
            !["Low", "Moderate", "High"].includes(severity as string)
        ) {
            res.status(400).send({
                message:
                    "Invalid severity parameter. Must be 'Low', 'Moderate', or 'High'.",
            });
            return;
        }

        const allSpecialities: any[] = await prisma.$queryRaw`
                SELECT
                id,
                name,
                description,
                tags,
                count
                FROM "Speciality"
            `;

        const specialitiesWithMatchCount = allSpecialities.map((speciality: any) => {
            const matchingTagsCount = speciality.tags.filter((tag: any) => {
                const tagObj = typeof tag === "string" ? JSON.parse(tag) : tag;
                return tagObj.severity === severity;
            }).length;

            return {
                ...speciality,
                matchingTagsCount,
            };
        });

        const specialities = specialitiesWithMatchCount
            .filter((specialty: any) => specialty.matchingTagsCount > 0)
            .sort((a: any, b: any) => b.matchingTagsCount - a.matchingTagsCount);

        res.status(200).send(specialities.slice(0, 8));
    } catch (error) {
        console.error("Error fetching specialties by severity:", error);
        res.status(500).send({
            message: "An error occurred while fetching specialties by severity",
            error,
        });
    }
};

export const getSpecialityById = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { id } = req.params;
    try {
        const speciality = await prisma.speciality.findUnique({
            where: { id: id },
            include: {
                hospitals: {
                    include: {
                        specialities: true,
                        parent: true,
                    },
                },
            },
        });

        if (!speciality) {
            res.status(404).send({ message: "Speciality not found" });
            return;
        }

        res.status(200).send(speciality);
    } catch (error) {
        res.status(500).send({
            message: "An error occurred while fetching speciality",
            error,
        });
    }
};

export const getDoctorSpecialities = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { id } = req.params;
    try {
        const doctor = await prisma.hospital.findUnique({
            where: { id: id },
            include: {
                specialities: true,
            },
        });

        if (!doctor) {
            res.status(404).send({ message: "Doctor not found" });
            return;
        }

        res.status(200).send(doctor.specialities);
    } catch (error) {
        res.status(500).send({
            message: "An error occurred while fetching speciality",
            error,
        });
    }
};

export const createSpecialities = async (
    req: Request,
    res: Response
): Promise<void> => {
    const specialities = req.body;

    try {
        specialities.forEach((speciality: any) => {
            const count = {
                doctorCount: 0,
                hospitalCount: 0,
                lowSeverity: 0,
                mediumSeverity: 0,
                highSeverity: 0,
            };
            const tags = speciality.tags as Array<{ severity: string }>;

            tags.forEach((tag) => {
                switch ((tag.severity || "").toLowerCase()) {
                    case "low":
                        count.lowSeverity++;
                        break;
                    case "medium":
                        count.mediumSeverity++;
                        break;
                    case "high":
                        count.highSeverity++;
                        break;
                }
            });

            speciality.count = count;
        });

        const createdSpecialities = await prisma.speciality.createMany({
            data: specialities,
        });

        res.status(201).send(createdSpecialities);
    } catch (error) {
        console.error("Error creating specialities:", error);
        res.status(500).send({
            message: "An error occurred while creating specialities",
            error,
        });
    }
};

export const assignSpecialityToDoctor = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { id } = req.params;
    const { specialtyId } = req.body;

    console.log("Received data:", specialtyId);

    try {
        const doctor = await prisma.hospital.findUnique({
            where: { id: id },
            include: {
                specialities: true,
            },
        });

        console.log("Doctor found:", doctor);

        if (!doctor) {
            res.status(404).send({ message: "Doctor not found" });
            return;
        }

        const speciality = await prisma.speciality.findUnique({
            where: { id: specialtyId },
        });

        if (!speciality) {
            res.status(404).send({ message: "Speciality not found" });
            return;
        }

        console.log("Speciality found:", speciality);

        const tags = speciality.tags as Array<{ severity: string }>;

        let low = 0,
            medium = 0,
            high = 0;

        tags.forEach((tag) => {
            switch ((tag.severity || "").toLowerCase()) {
                case "low":
                    low++;
                    break;
                case "medium":
                    medium++;
                    break;
                case "high":
                    high++;
                    break;
            }
        });

        await prisma.$executeRaw`
            UPDATE "Speciality"
            SET count = jsonb_set(
                count,
                '{doctorCount}', ((count->>'doctorCount')::int + 1)::text::jsonb
            )
            WHERE id = ${speciality.id};
        `;

        const updatedDoctor = await prisma.hospital.update({
            where: { id: id },
            data: {
                specialities: {
                    connect: { id: specialtyId },
                },
            },
            include: {
                specialities: true,
            },
        });

        await prisma.$executeRaw`
            UPDATE "Hospital"
            SET count = jsonb_set(
                jsonb_set(
                    jsonb_set(
                        count,
                        '{lowSeverity}', ((count->>'lowSeverity')::int + ${low})::text::jsonb
                    ),
                    '{mediumSeverity}', ((count->>'mediumSeverity')::int + ${medium})::text::jsonb
                ),
                '{highSeverity}', ((count->>'highSeverity')::int + ${high})::text::jsonb
            )
            WHERE id = ${doctor.id};
        `;

        if (!updatedDoctor) {
            res.status(404).send({ message: "Doctor not found" });
            return;
        }

        if (doctor.parentId) {
            const alreadyConnected = await prisma.hospitalSpeciality.findFirst({
                where: {
                    hospitalId: doctor.parentId,
                    specialityId: specialtyId,
                },
            });

            if (!alreadyConnected) {
                await prisma.hospitalSpeciality.create({
                    data: {
                        hospitalId: doctor.parentId,
                        specialityId: specialtyId,
                    },
                });

                await prisma.$executeRaw`
                    UPDATE "Speciality"
                    SET count = jsonb_set(
                        count,
                        '{hospitalCount}', ((count->>'hospitalCount')::int + 1)::text::jsonb
                    )
                    WHERE id = ${speciality.id};
                `;
            }

            await prisma.hospital.update({
                where: { id: doctor.parentId },
                data: {
                    specialities: {
                        connect: { id: specialtyId },
                    },
                },
            });

            await prisma.$executeRaw`
                UPDATE "Hospital"
                SET count = jsonb_set(
                    jsonb_set(
                        jsonb_set(
                            count,
                            '{lowSeverity}', ((count->>'lowSeverity')::int + ${low})::text::jsonb
                        ),
                        '{mediumSeverity}', ((count->>'mediumSeverity')::int + ${medium})::text::jsonb
                    ),
                    '{highSeverity}', ((count->>'highSeverity')::int + ${high})::text::jsonb
                )
                WHERE id = ${doctor.parentId};
            `;
        } else {
            res.status(404).send({ message: "Parent not found" });
            return;
        }

        console.log("Updated doctor:", updatedDoctor);

        res.status(200).send(speciality);
    } catch (error) {
        console.error("Error updating doctor:", error);

        res.status(500).send({
            message: "An error occurred while fetching speciality",
            error,
        });
    }
};

export const bulkAssignSpecialities = async (
    req: Request,
    res: Response
): Promise<void> => {
    const doctorsData = req.body;

    if (!Array.isArray(doctorsData)) {
        res.status(400).send({
            message:
                "Invalid input format. Expected array of doctor-speciality objects.",
        });
        return;
    }

    try {
        for (const entry of doctorsData) {
            const { id: doctorId, specialities } = entry;

            if (
                !doctorId ||
                !Array.isArray(specialities) ||
                specialities.length === 0
            ) {
                console.warn(
                    `Skipping invalid entry: ${JSON.stringify(entry)}`
                );
                return;
            }

            const doctor = await prisma.hospital.findUnique({
                where: { id: doctorId },
                include: { specialities: true },
            });

            if (!doctor) {
                console.warn(`Doctor not found: ${doctorId}`);
                return;
            }

            for (const specialtyId of specialities) {
                const speciality = await prisma.speciality.findUnique({
                    where: { id: specialtyId },
                });

                if (!speciality) {
                    console.warn(`Speciality not found: ${specialtyId}`);
                    return;
                }

                const tags = speciality.tags as Array<{ severity: string }>;
                let low = 0,
                    medium = 0,
                    high = 0;

                tags.forEach((tag) => {
                    switch ((tag.severity || "").toLowerCase()) {
                        case "low":
                            low++;
                            break;
                        case "medium":
                            medium++;
                            break;
                        case "high":
                            high++;
                            break;
                    }
                });

                await prisma.$executeRaw`
                    UPDATE "Speciality"
                    SET count = jsonb_set(
                        count,
                        '{doctorCount}', ((count->>'doctorCount')::int + 1)::text::jsonb
                    )
                    WHERE id = ${speciality.id};
                `;

                await prisma.hospital.update({
                    where: { id: doctorId },
                    data: {
                        specialities: {
                            connect: { id: specialtyId },
                        },
                    },
                });

                await prisma.$executeRaw`
                    UPDATE "Hospital"
                    SET count = jsonb_set(
                        jsonb_set(
                            jsonb_set(
                                count,
                                '{lowSeverity}', ((count->>'lowSeverity')::int + ${low})::text::jsonb
                            ),
                            '{mediumSeverity}', ((count->>'mediumSeverity')::int + ${medium})::text::jsonb
                        ),
                        '{highSeverity}', ((count->>'highSeverity')::int + ${high})::text::jsonb
                    )
                    WHERE id = ${doctor.id};
                `;

                if (doctor.parentId) {
                    const alreadyConnected =
                        await prisma.hospitalSpeciality.findFirst({
                            where: {
                                hospitalId: doctor.parentId,
                                specialityId: specialtyId,
                            },
                        });

                    if (!alreadyConnected) {
                        await prisma.hospitalSpeciality.create({
                            data: {
                                hospitalId: doctor.parentId,
                                specialityId: specialtyId,
                            },
                        });

                        await prisma.$executeRaw`
                            UPDATE "Speciality"
                            SET count = jsonb_set(
                                count,
                                '{hospitalCount}', ((count->>'hospitalCount')::int + 1)::text::jsonb
                            )
                            WHERE id = ${speciality.id};
                        `;
                    }

                    await prisma.hospital.update({
                        where: { id: doctor.parentId },
                        data: {
                            specialities: {
                                connect: { id: specialtyId },
                            },
                        },
                    });

                    await prisma.$executeRaw`
                        UPDATE "Hospital"
                        SET count = jsonb_set(
                            jsonb_set(
                                jsonb_set(
                                    count,
                                    '{lowSeverity}', ((count->>'lowSeverity')::int + ${low})::text::jsonb
                                ),
                                '{mediumSeverity}', ((count->>'mediumSeverity')::int + ${medium})::text::jsonb
                            ),
                            '{highSeverity}', ((count->>'highSeverity')::int + ${high})::text::jsonb
                        )
                        WHERE id = ${doctor.parentId};
                    `;
                }
            }
        }

        res.status(200).send({ message: "Doctors updated successfully" });
    } catch (error) {
        console.error("Error updating doctors:", error);
        res.status(500).send({
            message: "An error occurred during bulk update",
            error,
        });
    }
};

export const removeSpecialityFromDoctor = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { id } = req.params;
    const { specialtyId } = req.body;

    console.log("Removing specialty:", specialtyId, "from doctor:", id);

    try {
        const doctor = await prisma.hospital.findUnique({
            where: { id: id },
            include: {
                specialities: true,
            },
        });

        console.log("Doctor found:", doctor);

        if (!doctor) {
            res.status(404).send({ message: "Doctor not found" });
            return;
        }

        const hasSpecialty = doctor.specialities.some(
            (spec: any) => spec.id === specialtyId
        );

        if (!hasSpecialty) {
            res.status(404).send({
                message: "Doctor does not have this specialty",
            });
            return;
        }

        const speciality = await prisma.speciality.findUnique({
            where: { id: specialtyId },
        });

        if (!speciality) {
            res.status(404).send({ message: "Speciality not found" });
            return;
        }

        console.log("Speciality found:", speciality);

        const tags = speciality.tags as Array<{ severity: string }>;

        let low = 0,
            medium = 0,
            high = 0;

        tags.forEach((tag) => {
            switch ((tag.severity || "").toLowerCase()) {
                case "low":
                    low++;
                    break;
                case "medium":
                    medium++;
                    break;
                case "high":
                    high++;
                    break;
            }
        });

        await prisma.$executeRaw`
            UPDATE "Speciality"
            SET count = jsonb_set(
                count,
                '{doctorCount}', ((count->>'doctorCount')::int - 1)::text::jsonb
            )
            WHERE id = ${speciality.id};
        `;

        const updatedDoctor = await prisma.hospital.update({
            where: { id: id },
            data: {
                specialities: {
                    disconnect: { id: specialtyId },
                },
            },
            include: {
                specialities: true,
            },
        });

        await prisma.$executeRaw`
            UPDATE "Hospital"
            SET count = jsonb_set(
                jsonb_set(
                    jsonb_set(
                        count,
                        '{lowSeverity}', ((count->>'lowSeverity')::int - ${low})::text::jsonb
                    ),
                    '{mediumSeverity}', ((count->>'mediumSeverity')::int - ${medium})::text::jsonb
                ),
                '{highSeverity}', ((count->>'highSeverity')::int - ${high})::text::jsonb
            )
            WHERE id = ${doctor.id};
        `;

        if (doctor.parentId) {
            const otherDoctorsWithSpecialty = await prisma.hospital.count({
                where: {
                    parentId: doctor.parentId,
                    specialities: {
                        some: {
                            id: specialtyId,
                        },
                    },
                    id: {
                        not: id,
                    },
                },
            });

            if (otherDoctorsWithSpecialty === 0) {
                await prisma.hospital.update({
                    where: { id: doctor.parentId },
                    data: {
                        specialities: {
                            disconnect: { id: specialtyId },
                        },
                    },
                });

                await prisma.$executeRaw`
                    UPDATE "Speciality"
                    SET count = jsonb_set(
                        count,
                        '{hospitalCount}', ((count->>'hospitalCount')::int - 1)::text::jsonb
                    )
                    WHERE id = ${speciality.id};
                `;

                await prisma.$executeRaw`
                    UPDATE "Hospital"
                    SET count = jsonb_set(
                        jsonb_set(
                            jsonb_set(
                                count,
                                '{lowSeverity}', ((count->>'lowSeverity')::int - ${low})::text::jsonb
                            ),
                            '{mediumSeverity}', ((count->>'mediumSeverity')::int - ${medium})::text::jsonb
                        ),
                        '{highSeverity}', ((count->>'highSeverity')::int - ${high})::text::jsonb
                    )
                    WHERE id = ${doctor.parentId};
                `;
            }
        }

        console.log("Updated doctor:", updatedDoctor);

        res.status(200).send({
            message: "Specialty removed successfully",
            doctor: updatedDoctor,
        });
    } catch (error) {
        console.error("Error removing specialty from doctor:", error);

        res.status(500).send({
            message: "An error occurred while removing specialty",
            error,
        });
    }
};
