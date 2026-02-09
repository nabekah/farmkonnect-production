import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";

export const veterinaryServicesRouter = router({
  // Get all veterinarians with filtering
  getVeterinarians: publicProcedure
    .input(
      z.object({
        specialization: z.string().optional(),
        region: z.string().optional(),
        telemedicineOnly: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      // Mock data - replace with database queries
      const veterinarians = [
        {
          id: 1,
          name: "Dr. Kwame Osei",
          license: "GVC-2019-0456",
          specialization: "Livestock, Poultry",
          clinic: "Accra Veterinary Clinic",
          region: "Greater Accra",
          experience: 12,
          rating: 4.8,
          reviews: 45,
          telemedicine: true,
          consultationFee: 150,
          phone: "+233-24-XXXX-XXXX",
          email: "kwame@accravet.gh",
        },
        {
          id: 2,
          name: "Dr. Ama Mensah",
          license: "GVC-2020-0789",
          specialization: "Fish Farming, Aquaculture",
          clinic: "Tema Aquaculture Veterinary Center",
          region: "Greater Accra",
          experience: 8,
          rating: 4.6,
          reviews: 32,
          telemedicine: true,
          consultationFee: 120,
          phone: "+233-27-XXXX-XXXX",
          email: "ama@temaaquavet.gh",
        },
      ];

      let filtered = veterinarians;

      if (input.specialization) {
        filtered = filtered.filter(v =>
          v.specialization.toLowerCase().includes(input.specialization!.toLowerCase())
        );
      }

      if (input.region) {
        filtered = filtered.filter(v => v.region === input.region);
      }

      if (input.telemedicineOnly) {
        filtered = filtered.filter(v => v.telemedicine);
      }

      return filtered;
    }),

  // Get veterinarian by ID
  getVeterinarian: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      // Mock data
      return {
        id: input.id,
        name: "Dr. Kwame Osei",
        license: "GVC-2019-0456",
        specialization: "Livestock, Poultry",
        clinic: "Accra Veterinary Clinic",
        region: "Greater Accra",
        experience: 12,
        rating: 4.8,
        reviews: 45,
        telemedicine: true,
        consultationFee: 150,
        phone: "+233-24-XXXX-XXXX",
        email: "kwame@accravet.gh",
        bio: "Experienced veterinarian with 12 years of practice",
        availableSlots: [
          { date: "2026-02-10", times: ["09:00", "10:00", "14:00", "15:00"] },
          { date: "2026-02-11", times: ["09:00", "11:00", "16:00"] },
        ],
      };
    }),

  // Book appointment
  bookAppointment: protectedProcedure
    .input(
      z.object({
        veterinarianId: z.number(),
        appointmentDate: z.string(),
        appointmentTime: z.string(),
        animalType: z.string(),
        reason: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Mock implementation
      return {
        success: true,
        appointmentId: Math.random().toString(36).substr(2, 9),
        message: "Appointment booked successfully",
        confirmation: {
          veterinarian: "Dr. Kwame Osei",
          date: input.appointmentDate,
          time: input.appointmentTime,
          type: input.animalType,
          confirmationCode: "APT-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
        },
      };
    }),

  // Get user's appointments
  getUserAppointments: protectedProcedure.query(async ({ ctx }) => {
    // Mock data
    return [
      {
        id: 1,
        veterinarian: "Dr. Kwame Osei",
        date: "2026-02-15",
        time: "10:00",
        animalType: "Cattle",
        reason: "Health checkup",
        status: "confirmed",
        confirmationCode: "APT-ABC123",
      },
      {
        id: 2,
        veterinarian: "Dr. Ama Mensah",
        date: "2026-02-20",
        time: "14:00",
        animalType: "Fish",
        reason: "Water quality assessment",
        status: "pending",
        confirmationCode: "APT-XYZ789",
      },
    ];
  }),

  // Cancel appointment
  cancelAppointment: protectedProcedure
    .input(z.object({ appointmentId: z.number() }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        message: "Appointment cancelled successfully",
      };
    }),

  // Get prescriptions
  getPrescriptions: protectedProcedure.query(async ({ ctx }) => {
    // Mock data
    return [
      {
        id: 1,
        veterinarian: "Dr. Kwame Osei",
        animal: "Cow - Bessie",
        medication: "Amoxicillin 500mg",
        dosage: "2 tablets twice daily",
        duration: "7 days",
        issuedDate: "2026-02-01",
        expiryDate: "2026-05-01",
        status: "active",
        daysUntilExpiry: 81,
        fulfilled: true,
        pharmacy: "Accra Pharmacy",
      },
      {
        id: 2,
        veterinarian: "Dr. Ama Mensah",
        animal: "Fish Tank - Tank A",
        medication: "Methylene Blue",
        dosage: "5ml per 100L water",
        duration: "3 days",
        issuedDate: "2026-02-05",
        expiryDate: "2026-02-12",
        status: "expiring_soon",
        daysUntilExpiry: 3,
        fulfilled: false,
        pharmacy: null,
      },
    ];
  }),

  // Renew prescription
  renewPrescription: protectedProcedure
    .input(z.object({ prescriptionId: z.number() }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        message: "Prescription renewal request sent to veterinarian",
        newPrescriptionId: Math.random().toString(36).substr(2, 9),
      };
    }),

  // Get prescription details
  getPrescriptionDetails: protectedProcedure
    .input(z.object({ prescriptionId: z.number() }))
    .query(async ({ input }) => {
      return {
        id: input.prescriptionId,
        veterinarian: "Dr. Kwame Osei",
        veterinarianLicense: "GVC-2019-0456",
        animal: "Cow - Bessie",
        medication: "Amoxicillin 500mg",
        dosage: "2 tablets twice daily",
        duration: "7 days",
        issuedDate: "2026-02-01",
        expiryDate: "2026-05-01",
        reason: "Bacterial infection treatment",
        instructions: "Give with food. Complete full course even if symptoms improve",
        sideEffects: "May cause mild digestive upset",
        contraindications: "Do not use with tetracycline antibiotics",
        fulfilled: true,
        pharmacy: "Accra Pharmacy",
        pharmacyPhone: "+233-24-XXXX-XXXX",
        administrationLog: [
          { date: "2026-02-01", time: "08:00", administered: true },
          { date: "2026-02-01", time: "20:00", administered: true },
          { date: "2026-02-02", time: "08:00", administered: true },
        ],
      };
    }),
});
