import { db } from '@/db';
import { statusHistory } from '@/db/schema';

async function main() {
    const now = new Date();
    const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
    
    const sampleStatusHistory = [
        // Service Request 1 (status: requested) - 1 entry
        {
            serviceRequestId: 1,
            status: 'requested',
            notes: 'Initial service request received from customer for product testing',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: daysAgo(60),
        },

        // Service Request 2 (status: requested) - 1 entry
        {
            serviceRequestId: 2,
            status: 'requested',
            notes: 'New testing request submitted by client',
            changedBy: 'lakshmi.k@artl.in',
            changedAt: daysAgo(58),
        },

        // Service Request 3 (status: replied) - 2 entries
        {
            serviceRequestId: 3,
            status: 'requested',
            notes: 'Service request received for automotive component testing',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: daysAgo(55),
        },
        {
            serviceRequestId: 3,
            status: 'replied',
            notes: 'Quotation sent to client with estimated timeline and pricing',
            changedBy: 'karthik.bhat@artl.in',
            changedAt: daysAgo(54),
        },

        // Service Request 4 (status: replied) - 2 entries
        {
            serviceRequestId: 4,
            status: 'requested',
            notes: 'Testing request received for electronic components',
            changedBy: 'lakshmi.k@artl.in',
            changedAt: daysAgo(52),
        },
        {
            serviceRequestId: 4,
            status: 'replied',
            notes: 'Detailed quotation prepared and sent to customer',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: daysAgo(51),
        },

        // Service Request 5 (status: srf_filled) - 3 entries
        {
            serviceRequestId: 5,
            status: 'requested',
            notes: 'Initial request for industrial equipment testing',
            changedBy: 'karthik.bhat@artl.in',
            changedAt: daysAgo(50),
        },
        {
            serviceRequestId: 5,
            status: 'replied',
            notes: 'Commercial proposal sent with testing specifications',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: daysAgo(49),
        },
        {
            serviceRequestId: 5,
            status: 'srf_filled',
            notes: 'Service Request Form completed and verified by customer',
            changedBy: 'lakshmi.k@artl.in',
            changedAt: daysAgo(47),
        },

        // Service Request 6 (status: srf_filled) - 3 entries
        {
            serviceRequestId: 6,
            status: 'requested',
            notes: 'Service request initiated for mechanical testing',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: daysAgo(48),
        },
        {
            serviceRequestId: 6,
            status: 'replied',
            notes: 'Testing proposal and cost estimate shared with client',
            changedBy: 'karthik.bhat@artl.in',
            changedAt: daysAgo(47),
        },
        {
            serviceRequestId: 6,
            status: 'srf_filled',
            notes: 'SRF documentation completed and signed',
            changedBy: 'lakshmi.k@artl.in',
            changedAt: daysAgo(45),
        },

        // Service Request 7 (status: agreed) - 4 entries
        {
            serviceRequestId: 7,
            status: 'requested',
            notes: 'Testing request for power supply units received',
            changedBy: 'lakshmi.k@artl.in',
            changedAt: daysAgo(46),
        },
        {
            serviceRequestId: 7,
            status: 'replied',
            notes: 'Technical and commercial quotation sent to customer',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: daysAgo(45),
        },
        {
            serviceRequestId: 7,
            status: 'srf_filled',
            notes: 'Service Request Form filled and reviewed',
            changedBy: 'karthik.bhat@artl.in',
            changedAt: daysAgo(43),
        },
        {
            serviceRequestId: 7,
            status: 'agreed',
            notes: 'Terms and conditions agreed, Purchase Order received',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: daysAgo(42),
        },

        // Service Request 8 (status: agreed) - 4 entries
        {
            serviceRequestId: 8,
            status: 'requested',
            notes: 'New request for sensor calibration testing',
            changedBy: 'karthik.bhat@artl.in',
            changedAt: daysAgo(44),
        },
        {
            serviceRequestId: 8,
            status: 'replied',
            notes: 'Calibration testing proposal sent with timeline',
            changedBy: 'lakshmi.k@artl.in',
            changedAt: daysAgo(43),
        },
        {
            serviceRequestId: 8,
            status: 'srf_filled',
            notes: 'SRF completed with detailed test requirements',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: daysAgo(41),
        },
        {
            serviceRequestId: 8,
            status: 'agreed',
            notes: 'Commercial terms finalized, work order confirmed',
            changedBy: 'karthik.bhat@artl.in',
            changedAt: daysAgo(40),
        },

        // Service Request 9 (status: agreed) - 4 entries
        {
            serviceRequestId: 9,
            status: 'requested',
            notes: 'Request received for battery pack testing',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: daysAgo(42),
        },
        {
            serviceRequestId: 9,
            status: 'replied',
            notes: 'Testing specifications and quotation delivered to client',
            changedBy: 'lakshmi.k@artl.in',
            changedAt: daysAgo(41),
        },
        {
            serviceRequestId: 9,
            status: 'srf_filled',
            notes: 'Service Request Form documentation finalized',
            changedBy: 'karthik.bhat@artl.in',
            changedAt: daysAgo(39),
        },
        {
            serviceRequestId: 9,
            status: 'agreed',
            notes: 'Agreement signed, testing schedule confirmed',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: daysAgo(38),
        },

        // Service Request 10 (status: material_received) - 5 entries
        {
            serviceRequestId: 10,
            status: 'requested',
            notes: 'Testing request for circuit boards submitted',
            changedBy: 'lakshmi.k@artl.in',
            changedAt: daysAgo(40),
        },
        {
            serviceRequestId: 10,
            status: 'replied',
            notes: 'Comprehensive quotation with test methodology sent',
            changedBy: 'karthik.bhat@artl.in',
            changedAt: daysAgo(39),
        },
        {
            serviceRequestId: 10,
            status: 'srf_filled',
            notes: 'SRF completed with customer specifications',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: daysAgo(37),
        },
        {
            serviceRequestId: 10,
            status: 'agreed',
            notes: 'Terms agreed, awaiting material dispatch from client',
            changedBy: 'lakshmi.k@artl.in',
            changedAt: daysAgo(36),
        },
        {
            serviceRequestId: 10,
            status: 'material_received',
            notes: 'Test samples received and verified against DC number',
            changedBy: 'karthik.bhat@artl.in',
            changedAt: daysAgo(34),
        },

        // Service Request 11 (status: material_received) - 5 entries
        {
            serviceRequestId: 11,
            status: 'requested',
            notes: 'Service request for motor controller testing',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: daysAgo(38),
        },
        {
            serviceRequestId: 11,
            status: 'replied',
            notes: 'Testing plan and commercial terms shared',
            changedBy: 'lakshmi.k@artl.in',
            changedAt: daysAgo(37),
        },
        {
            serviceRequestId: 11,
            status: 'srf_filled',
            notes: 'Service Request Form filled with technical details',
            changedBy: 'karthik.bhat@artl.in',
            changedAt: daysAgo(35),
        },
        {
            serviceRequestId: 11,
            status: 'agreed',
            notes: 'Purchase order received, material dispatch requested',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: daysAgo(34),
        },
        {
            serviceRequestId: 11,
            status: 'material_received',
            notes: 'Motor controllers received with proper documentation',
            changedBy: 'lakshmi.k@artl.in',
            changedAt: daysAgo(32),
        },

        // Service Request 12 (status: material_received) - 5 entries
        {
            serviceRequestId: 12,
            status: 'requested',
            notes: 'Initial request for hydraulic system testing',
            changedBy: 'karthik.bhat@artl.in',
            changedAt: daysAgo(36),
        },
        {
            serviceRequestId: 12,
            status: 'replied',
            notes: 'Detailed testing proposal sent with equipment requirements',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: daysAgo(35),
        },
        {
            serviceRequestId: 12,
            status: 'srf_filled',
            notes: 'SRF documentation completed and approved',
            changedBy: 'lakshmi.k@artl.in',
            changedAt: daysAgo(33),
        },
        {
            serviceRequestId: 12,
            status: 'agreed',
            notes: 'Commercial agreement finalized, logistics arranged',
            changedBy: 'karthik.bhat@artl.in',
            changedAt: daysAgo(32),
        },
        {
            serviceRequestId: 12,
            status: 'material_received',
            notes: 'Hydraulic components received and inspected',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: daysAgo(30),
        },

        // Service Request 13 (status: testing) - 6 entries
        {
            serviceRequestId: 13,
            status: 'requested',
            notes: 'Testing request for LED driver units',
            changedBy: 'lakshmi.k@artl.in',
            changedAt: daysAgo(34),
        },
        {
            serviceRequestId: 13,
            status: 'replied',
            notes: 'Quotation for LED driver testing sent to customer',
            changedBy: 'karthik.bhat@artl.in',
            changedAt: daysAgo(33),
        },
        {
            serviceRequestId: 13,
            status: 'srf_filled',
            notes: 'Service Request Form completed with test parameters',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: daysAgo(31),
        },
        {
            serviceRequestId: 13,
            status: 'agreed',
            notes: 'Terms accepted, material shipment scheduled',
            changedBy: 'lakshmi.k@artl.in',
            changedAt: daysAgo(30),
        },
        {
            serviceRequestId: 13,
            status: 'material_received',
            notes: 'LED driver samples received and logged in system',
            changedBy: 'karthik.bhat@artl.in',
            changedAt: daysAgo(28),
        },
        {
            serviceRequestId: 13,
            status: 'testing',
            notes: 'Testing commenced on assigned test bed',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: daysAgo(26),
        },

        // Service Request 14 (status: testing) - 6 entries
        {
            serviceRequestId: 14,
            status: 'requested',
            notes: 'Service request for transformer testing',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: daysAgo(32),
        },
        {
            serviceRequestId: 14,
            status: 'replied',
            notes: 'Testing methodology and pricing proposal delivered',
            changedBy: 'lakshmi.k@artl.in',
            changedAt: daysAgo(31),
        },
        {
            serviceRequestId: 14,
            status: 'srf_filled',
            notes: 'SRF filled with transformer specifications',
            changedBy: 'karthik.bhat@artl.in',
            changedAt: daysAgo(29),
        },
        {
            serviceRequestId: 14,
            status: 'agreed',
            notes: 'Work order confirmed, preparing for material receipt',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: daysAgo(28),
        },
        {
            serviceRequestId: 14,
            status: 'material_received',
            notes: 'Transformers received with proper packaging',
            changedBy: 'lakshmi.k@artl.in',
            changedAt: daysAgo(26),
        },
        {
            serviceRequestId: 14,
            status: 'testing',
            notes: 'Electrical testing in progress on dedicated test bed',
            changedBy: 'karthik.bhat@artl.in',
            changedAt: daysAgo(24),
        },

        // Service Request 15 (status: testing) - 6 entries
        {
            serviceRequestId: 15,
            status: 'requested',
            notes: 'Request for control panel testing received',
            changedBy: 'karthik.bhat@artl.in',
            changedAt: daysAgo(30),
        },
        {
            serviceRequestId: 15,
            status: 'replied',
            notes: 'Comprehensive testing proposal with timeline sent',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: daysAgo(29),
        },
        {
            serviceRequestId: 15,
            status: 'srf_filled',
            notes: 'Service Request Form documentation completed',
            changedBy: 'lakshmi.k@artl.in',
            changedAt: daysAgo(27),
        },
        {
            serviceRequestId: 15,
            status: 'agreed',
            notes: 'Agreement signed, logistics coordinated',
            changedBy: 'karthik.bhat@artl.in',
            changedAt: daysAgo(26),
        },
        {
            serviceRequestId: 15,
            status: 'material_received',
            notes: 'Control panels received and initial inspection completed',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: daysAgo(24),
        },
        {
            serviceRequestId: 15,
            status: 'testing',
            notes: 'Functional testing and performance evaluation ongoing',
            changedBy: 'lakshmi.k@artl.in',
            changedAt: daysAgo(22),
        },

        // Service Request 16 (status: completed) - 7 entries
        {
            serviceRequestId: 16,
            status: 'requested',
            notes: 'Testing request for power inverters',
            changedBy: 'lakshmi.k@artl.in',
            changedAt: daysAgo(28),
        },
        {
            serviceRequestId: 16,
            status: 'replied',
            notes: 'Technical and commercial proposal submitted',
            changedBy: 'karthik.bhat@artl.in',
            changedAt: daysAgo(27),
        },
        {
            serviceRequestId: 16,
            status: 'srf_filled',
            notes: 'SRF completed with detailed test specifications',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: daysAgo(25),
        },
        {
            serviceRequestId: 16,
            status: 'agreed',
            notes: 'Purchase order received, material dispatch confirmed',
            changedBy: 'lakshmi.k@artl.in',
            changedAt: daysAgo(24),
        },
        {
            serviceRequestId: 16,
            status: 'material_received',
            notes: 'Inverter units received and verified',
            changedBy: 'karthik.bhat@artl.in',
            changedAt: daysAgo(22),
        },
        {
            serviceRequestId: 16,
            status: 'testing',
            notes: 'Comprehensive testing conducted as per standards',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: daysAgo(20),
        },
        {
            serviceRequestId: 16,
            status: 'completed',
            notes: 'Testing successfully completed, reports generated',
            changedBy: 'lakshmi.k@artl.in',
            changedAt: daysAgo(15),
        },

        // Service Request 17 (status: completed) - 7 entries
        {
            serviceRequestId: 17,
            status: 'requested',
            notes: 'Service request for voltage regulator testing',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: daysAgo(26),
        },
        {
            serviceRequestId: 17,
            status: 'replied',
            notes: 'Detailed quotation with test procedures sent',
            changedBy: 'karthik.bhat@artl.in',
            changedAt: daysAgo(25),
        },
        {
            serviceRequestId: 17,
            status: 'srf_filled',
            notes: 'Service Request Form finalized with customer inputs',
            changedBy: 'lakshmi.k@artl.in',
            changedAt: daysAgo(23),
        },
        {
            serviceRequestId: 17,
            status: 'agreed',
            notes: 'Commercial terms finalized, work order issued',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: daysAgo(22),
        },
        {
            serviceRequestId: 17,
            status: 'material_received',
            notes: 'Voltage regulators received with documentation',
            changedBy: 'karthik.bhat@artl.in',
            changedAt: daysAgo(20),
        },
        {
            serviceRequestId: 17,
            status: 'testing',
            notes: 'Performance and reliability testing in progress',
            changedBy: 'lakshmi.k@artl.in',
            changedAt: daysAgo(18),
        },
        {
            serviceRequestId: 17,
            status: 'completed',
            notes: 'All testing completed successfully, final report prepared',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: daysAgo(12),
        },

        // Service Request 18 (status: reported) - 8 entries
        {
            serviceRequestId: 18,
            status: 'requested',
            notes: 'Initial testing request for relay modules',
            changedBy: 'karthik.bhat@artl.in',
            changedAt: daysAgo(24),
        },
        {
            serviceRequestId: 18,
            status: 'replied',
            notes: 'Comprehensive testing proposal with pricing sent',
            changedBy: 'lakshmi.k@artl.in',
            changedAt: daysAgo(23),
        },
        {
            serviceRequestId: 18,
            status: 'srf_filled',
            notes: 'SRF documentation completed and verified',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: daysAgo(21),
        },
        {
            serviceRequestId: 18,
            status: 'agreed',
            notes: 'Terms agreed, purchase order processed',
            changedBy: 'karthik.bhat@artl.in',
            changedAt: daysAgo(20),
        },
        {
            serviceRequestId: 18,
            status: 'material_received',
            notes: 'Relay modules received and inspection completed',
            changedBy: 'lakshmi.k@artl.in',
            changedAt: daysAgo(18),
        },
        {
            serviceRequestId: 18,
            status: 'testing',
            notes: 'Electrical and mechanical testing conducted',
            changedBy: 'ramesh.iyer@artl.in',
            changedAt: daysAgo(16),
        },
        {
            serviceRequestId: 18,
            status: 'completed',
            notes: 'Testing completed with all parameters met',
            changedBy: 'karthik.bhat@artl.in',
            changedAt: daysAgo(10),
        },
        {
            serviceRequestId: 18,
            status: 'reported',
            notes: 'Final test report issued and delivered to customer',
            changedBy: 'lakshmi.k@artl.in',
            changedAt: daysAgo(5),
        },
    ];

    await db.insert(statusHistory).values(sampleStatusHistory);
    
    console.log('✅ Status history seeder completed successfully - 81 entries created');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});