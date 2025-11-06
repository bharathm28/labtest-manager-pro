import { db } from '@/db';
import { testbedTasks } from '@/db/schema';

async function main() {
    const now = new Date();
    
    const sampleTestbedTasks = [
        // Test Bed 1 (EMC Chamber): 1 in_progress + 2 queued
        {
            serviceRequestId: 3, // Industrial Controller PLC-300
            testbedId: 1,
            assignedEmployeeId: 3,
            status: 'in_progress',
            priority: 'high',
            scheduledStartDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            scheduledEndDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
            actualStartDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            actualEndDate: null,
            queuePosition: 0,
            notes: 'EMC radiated emissions testing in progress. Frequency sweep 30MHz-1GHz ongoing. Est. 65% complete.',
            createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            serviceRequestId: 5, // Power Supply Unit PSU-24V-10A
            testbedId: 1,
            assignedEmployeeId: 5,
            status: 'queued',
            priority: 'normal',
            scheduledStartDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            scheduledEndDate: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000).toISOString(),
            actualStartDate: null,
            actualEndDate: null,
            queuePosition: 1,
            notes: 'Conducted immunity testing scheduled. Waiting for current EMC test to complete.',
            createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            serviceRequestId: 7, // RF Transceiver Module RF-2.4G-BLE
            testbedId: 1,
            assignedEmployeeId: 2,
            status: 'queued',
            priority: 'urgent',
            scheduledStartDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
            scheduledEndDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            actualStartDate: null,
            actualEndDate: null,
            queuePosition: 2,
            notes: 'URGENT: Bluetooth SIG qualification testing required. FCC Part 15 compliance critical path item.',
            createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },

        // Test Bed 2 (Thermal Shock Chamber): 1 in_progress + 3 queued
        {
            serviceRequestId: 4, // Temperature Sensor Array TSA-8CH
            testbedId: 2,
            assignedEmployeeId: 4,
            status: 'in_progress',
            priority: 'normal',
            scheduledStartDate: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            scheduledEndDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
            actualStartDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            actualEndDate: null,
            queuePosition: 0,
            notes: 'Temperature cycling test: -40°C to +85°C. Cycle 18/100 completed. All 8 channels within specification.',
            createdAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            serviceRequestId: 8,
            testbedId: 2,
            assignedEmployeeId: 4,
            status: 'queued',
            priority: 'high',
            scheduledStartDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            scheduledEndDate: new Date(now.getTime() + 11 * 24 * 60 * 60 * 1000).toISOString(),
            actualStartDate: null,
            actualEndDate: null,
            queuePosition: 1,
            notes: 'Environmental stress screening for automotive components. High priority customer.',
            createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            serviceRequestId: 9,
            testbedId: 2,
            assignedEmployeeId: 4,
            status: 'queued',
            priority: 'normal',
            scheduledStartDate: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString(),
            scheduledEndDate: new Date(now.getTime() + 16 * 24 * 60 * 60 * 1000).toISOString(),
            actualStartDate: null,
            actualEndDate: null,
            queuePosition: 2,
            notes: 'Thermal shock testing for LED modules. Standard test protocol.',
            createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            serviceRequestId: 10,
            testbedId: 2,
            assignedEmployeeId: 4,
            status: 'queued',
            priority: 'normal',
            scheduledStartDate: new Date(now.getTime() + 17 * 24 * 60 * 60 * 1000).toISOString(),
            scheduledEndDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(),
            actualStartDate: null,
            actualEndDate: null,
            queuePosition: 3,
            notes: 'Temperature humidity cycling for industrial sensors.',
            createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        },

        // Test Bed 3 (Vibration Test Bed): 1 in_progress + 1 queued
        {
            serviceRequestId: 6, // Motor Drive Inverter MDI-15K
            testbedId: 3,
            assignedEmployeeId: 6,
            status: 'in_progress',
            priority: 'urgent',
            scheduledStartDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            scheduledEndDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            actualStartDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            actualEndDate: null,
            queuePosition: 0,
            notes: 'High voltage isolation testing in progress. Hipot testing at 4.5kV completed successfully. Partial discharge testing ongoing.',
            createdAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            serviceRequestId: 11,
            testbedId: 3,
            assignedEmployeeId: 6,
            status: 'queued',
            priority: 'high',
            scheduledStartDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            scheduledEndDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            actualStartDate: null,
            actualEndDate: null,
            queuePosition: 1,
            notes: 'Vibration testing for automotive ECU. Random vibration per ISO 16750-3.',
            createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },

        // Test Bed 5 (Drop Test Station): 2 queued (available - no in_progress)
        {
            serviceRequestId: 12,
            testbedId: 5,
            assignedEmployeeId: 1,
            status: 'queued',
            priority: 'normal',
            scheduledStartDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            scheduledEndDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            actualStartDate: null,
            actualEndDate: null,
            queuePosition: 1,
            notes: 'Drop test for ruggedized tablet enclosure. IEC 60068-2-31 protocol.',
            createdAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            serviceRequestId: 13,
            testbedId: 5,
            assignedEmployeeId: 1,
            status: 'queued',
            priority: 'low',
            scheduledStartDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
            scheduledEndDate: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString(),
            actualStartDate: null,
            actualEndDate: null,
            queuePosition: 2,
            notes: 'Package drop testing for consumer electronics shipping validation.',
            createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        },

        // Test Bed 7 (High Voltage Test Bench): 1 queued (available)
        {
            serviceRequestId: 14,
            testbedId: 7,
            assignedEmployeeId: 8,
            status: 'queued',
            priority: 'high',
            scheduledStartDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
            scheduledEndDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
            actualStartDate: null,
            actualEndDate: null,
            queuePosition: 1,
            notes: 'High voltage isolation testing for medical power supply. IEC 60601-1 compliance.',
            createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        },
    ];

    await db.insert(testbedTasks).values(sampleTestbedTasks);
    
    console.log('✅ Testbed tasks seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});