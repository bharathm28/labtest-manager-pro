import { db } from '@/db';
import { testBeds } from '@/db/schema';

async function main() {
    const now = new Date();
    
    const getRandomPastDate = (minDays: number, maxDays: number): string => {
        const daysAgo = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
        const date = new Date(now);
        date.setDate(date.getDate() - daysAgo);
        return date.toISOString();
    };

    const sampleTestBeds = [
        {
            name: 'EMC Chamber',
            description: '3m Anechoic Chamber for EMI/EMC Testing',
            location: 'Lab Building A, Floor 1',
            status: 'available',
            createdAt: getRandomPastDate(180, 730),
        },
        {
            name: 'Thermal Shock Chamber',
            description: 'Temperature cycling from -40°C to +150°C',
            location: 'Lab Building A, Floor 2',
            status: 'in_use',
            createdAt: getRandomPastDate(180, 730),
        },
        {
            name: 'Vibration Test Bed',
            description: '6-axis vibration table with 5kN force',
            location: 'Lab Building B, Floor 1',
            status: 'available',
            createdAt: getRandomPastDate(180, 730),
        },
        {
            name: 'Environmental Chamber',
            description: 'Temperature & Humidity testing chamber',
            location: 'Lab Building A, Floor 2',
            status: 'available',
            createdAt: getRandomPastDate(180, 730),
        },
        {
            name: 'Drop Test Station',
            description: 'Free fall drop testing equipment',
            location: 'Lab Building B, Floor 1',
            status: 'maintenance',
            createdAt: getRandomPastDate(180, 730),
        },
        {
            name: 'Salt Spray Chamber',
            description: 'Corrosion testing with salt fog',
            location: 'Lab Building C, Floor 1',
            status: 'available',
            createdAt: getRandomPastDate(180, 730),
        },
        {
            name: 'High Voltage Test Bench',
            description: 'Dielectric strength and insulation testing',
            location: 'Lab Building A, Floor 3',
            status: 'in_use',
            createdAt: getRandomPastDate(180, 730),
        }
    ];

    await db.insert(testBeds).values(sampleTestBeds);
    
    console.log('✅ Test beds seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});