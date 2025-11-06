import { db } from '@/db';
import { statusHistory } from '@/db/schema';

async function main() {
    const sampleStatusHistory = [
        // Service Request 19 - Completed progression (7 entries)
        {
            serviceRequestId: 19,
            status: 'requested',
            notes: 'Service request submitted by customer for Automotive ECU testing',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: new Date('2024-01-15T09:30:00Z').toISOString(),
        },
        {
            serviceRequestId: 19,
            status: 'replied',
            notes: 'Quotation sent with test plan and pricing for EMC and environmental testing',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: new Date('2024-01-17T14:20:00Z').toISOString(),
        },
        {
            serviceRequestId: 19,
            status: 'srf_filled',
            notes: 'Service Request Form completed with technical specifications and test standards',
            changedBy: 'lakshmi.k@artl.in',
            changedAt: new Date('2024-01-20T10:15:00Z').toISOString(),
        },
        {
            serviceRequestId: 19,
            status: 'agreed',
            notes: 'Purchase order PO-2024-001 received, terms finalized',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: new Date('2024-01-23T11:45:00Z').toISOString(),
        },
        {
            serviceRequestId: 19,
            status: 'material_received',
            notes: 'Test samples received and verified against DC number DC-2024-019',
            changedBy: 'karthik.bhat@artl.in',
            changedAt: new Date('2024-01-25T08:30:00Z').toISOString(),
        },
        {
            serviceRequestId: 19,
            status: 'testing',
            notes: 'Testing commenced on EMC compliance and temperature cycling',
            changedBy: 'karthik.bhat@artl.in',
            changedAt: new Date('2024-01-26T09:00:00Z').toISOString(),
        },
        {
            serviceRequestId: 19,
            status: 'completed',
            notes: 'Testing completed successfully, all parameters within specifications, preparing report',
            changedBy: 'karthik.bhat@artl.in',
            changedAt: new Date('2024-02-05T16:30:00Z').toISOString(),
        },

        // Service Request 22 - Currently in testing (6 entries)
        {
            serviceRequestId: 22,
            status: 'requested',
            notes: 'Service request submitted by customer for Power Supply Unit testing',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: new Date('2024-02-01T10:00:00Z').toISOString(),
        },
        {
            serviceRequestId: 22,
            status: 'replied',
            notes: 'Quotation sent with test plan and pricing for power quality analysis',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: new Date('2024-02-03T15:30:00Z').toISOString(),
        },
        {
            serviceRequestId: 22,
            status: 'srf_filled',
            notes: 'Service Request Form completed with input/output specifications and load testing requirements',
            changedBy: 'divya.rao@artl.in',
            changedAt: new Date('2024-02-06T11:20:00Z').toISOString(),
        },
        {
            serviceRequestId: 22,
            status: 'agreed',
            notes: 'Purchase order received, testing scope and timeline confirmed',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: new Date('2024-02-08T14:00:00Z').toISOString(),
        },
        {
            serviceRequestId: 22,
            status: 'material_received',
            notes: 'Test samples received and verified against DC number DC-2024-022',
            changedBy: 'arjun.menon@artl.in',
            changedAt: new Date('2024-02-10T09:15:00Z').toISOString(),
        },
        {
            serviceRequestId: 22,
            status: 'testing',
            notes: 'Testing commenced on load regulation and efficiency measurements',
            changedBy: 'arjun.menon@artl.in',
            changedAt: new Date('2024-02-12T10:30:00Z').toISOString(),
        },

        // Service Request 25 - Material received stage (4 entries)
        {
            serviceRequestId: 25,
            status: 'requested',
            notes: 'Service request submitted by customer for LED Driver testing',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: new Date('2024-02-08T09:45:00Z').toISOString(),
        },
        {
            serviceRequestId: 25,
            status: 'replied',
            notes: 'Quotation sent with test plan and pricing for photometric and electrical testing',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: new Date('2024-02-10T16:00:00Z').toISOString(),
        },
        {
            serviceRequestId: 25,
            status: 'agreed',
            notes: 'Purchase order received, test requirements and deliverables finalized',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: new Date('2024-02-13T13:30:00Z').toISOString(),
        },
        {
            serviceRequestId: 25,
            status: 'material_received',
            notes: 'Test samples received and verified against DC number DC-2024-025',
            changedBy: 'lakshmi.k@artl.in',
            changedAt: new Date('2024-02-16T08:45:00Z').toISOString(),
        },

        // Service Request 28 - Early stage (2 entries)
        {
            serviceRequestId: 28,
            status: 'requested',
            notes: 'Service request submitted by customer for Battery Management System testing',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: new Date('2024-02-12T11:00:00Z').toISOString(),
        },
        {
            serviceRequestId: 28,
            status: 'replied',
            notes: 'Quotation sent with test plan and pricing for battery cycling and safety testing',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: new Date('2024-02-15T14:45:00Z').toISOString(),
        },
    ];

    await db.insert(statusHistory).values(sampleStatusHistory);
    
    console.log('✅ Status history seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});