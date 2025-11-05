import { db } from '@/db';
import { companies } from '@/db/schema';

async function main() {
    const today = new Date();
    
    const sampleCompanies = [
        {
            name: 'TechCorp Industries',
            address: '123 Tech Park, Bangalore, Karnataka 560001',
            phone: '+91-80-12345678',
            email: 'info@techcorp.in',
            createdAt: new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            name: 'ElectroSys Ltd',
            address: '45 Electronics Hub, Pune, Maharashtra 411014',
            phone: '+91-20-87654321',
            email: 'contact@electrosys.com',
            createdAt: new Date(today.getTime() - 150 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            name: 'NanoChip Solutions',
            address: '789 Innovation Center, Hyderabad, Telangana 500081',
            phone: '+91-40-23456789',
            email: 'info@nanochip.in',
            createdAt: new Date(today.getTime() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            name: 'Precision Electronics',
            address: '234 Industrial Area, Chennai, Tamil Nadu 600032',
            phone: '+91-44-98765432',
            email: 'sales@precisionelec.com',
            createdAt: new Date(today.getTime() - 100 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            name: 'Advanced Testing Labs',
            address: '56 Science Park, Gurgaon, Haryana 122001',
            phone: '+91-124-3456789',
            email: 'info@advancedtesting.in',
            createdAt: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            name: 'MicroTech Systems',
            address: '890 Tech Valley, Noida, Uttar Pradesh 201301',
            phone: '+91-120-7654321',
            email: 'support@microtech.com',
            createdAt: new Date(today.getTime() - 75 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            name: 'Quantum Electronics',
            address: '12 Research Park, Mumbai, Maharashtra 400001',
            phone: '+91-22-34567890',
            email: 'contact@quantum.in',
            createdAt: new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        }
    ];

    await db.insert(companies).values(sampleCompanies);
    
    console.log('✅ Companies seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});