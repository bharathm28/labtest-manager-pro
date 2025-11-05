import { db } from '@/db';
import { employees } from '@/db/schema';

async function main() {
    const now = new Date();
    
    const sampleEmployees = [
        {
            name: 'Dr. Ramesh Iyer',
            designation: 'Senior Test Engineer',
            email: 'ramesh.iyer@artl.in',
            phone: '+91-98765-00001',
            department: 'Testing',
            createdAt: new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000)).toISOString(),
        },
        {
            name: 'Lakshmi Krishnan',
            designation: 'Lab Technician',
            email: 'lakshmi.k@artl.in',
            phone: '+91-98765-00002',
            department: 'Testing',
            createdAt: new Date(now.getTime() - (320 * 24 * 60 * 60 * 1000)).toISOString(),
        },
        {
            name: 'Arjun Menon',
            designation: 'Testing Engineer',
            email: 'arjun.menon@artl.in',
            phone: '+91-98765-00003',
            department: 'Testing',
            createdAt: new Date(now.getTime() - (280 * 24 * 60 * 60 * 1000)).toISOString(),
        },
        {
            name: 'Divya Rao',
            designation: 'Senior Test Engineer',
            email: 'divya.rao@artl.in',
            phone: '+91-98765-00004',
            department: 'EMC Testing',
            createdAt: new Date(now.getTime() - (245 * 24 * 60 * 60 * 1000)).toISOString(),
        },
        {
            name: 'Karthik Bhat',
            designation: 'Lab Manager',
            email: 'karthik.bhat@artl.in',
            phone: '+91-98765-00005',
            department: 'Operations',
            createdAt: new Date(now.getTime() - (210 * 24 * 60 * 60 * 1000)).toISOString(),
        },
        {
            name: 'Meera Nambiar',
            designation: 'Testing Engineer',
            email: 'meera.n@artl.in',
            phone: '+91-98765-00006',
            department: 'Environmental Testing',
            createdAt: new Date(now.getTime() - (175 * 24 * 60 * 60 * 1000)).toISOString(),
        },
        {
            name: 'Sanjay Pillai',
            designation: 'Senior Technician',
            email: 'sanjay.pillai@artl.in',
            phone: '+91-98765-00007',
            department: 'Testing',
            createdAt: new Date(now.getTime() - (140 * 24 * 60 * 60 * 1000)).toISOString(),
        },
        {
            name: 'Anita Shetty',
            designation: 'Quality Engineer',
            email: 'anita.shetty@artl.in',
            phone: '+91-98765-00008',
            department: 'Quality Assurance',
            createdAt: new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000)).toISOString(),
        },
    ];

    await db.insert(employees).values(sampleEmployees);
    
    console.log('✅ Employees seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});