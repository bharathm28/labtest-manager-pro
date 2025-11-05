import { db } from '@/db';
import { contactPersons } from '@/db/schema';

async function main() {
    const now = new Date();
    const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

    const sampleContactPersons = [
        {
            companyId: 1,
            name: 'Rajesh Kumar',
            designation: 'Senior Engineer',
            phone: '+91-98765-43210',
            email: 'rajesh.kumar@techcorp.in',
            createdAt: daysAgo(145),
        },
        {
            companyId: 1,
            name: 'Priya Sharma',
            designation: 'QA Manager',
            phone: '+91-98765-43211',
            email: 'priya.sharma@techcorp.in',
            createdAt: daysAgo(140),
        },
        {
            companyId: 2,
            name: 'Amit Patel',
            designation: 'Technical Lead',
            phone: '+91-98765-43212',
            email: 'amit.patel@electrosys.com',
            createdAt: daysAgo(130),
        },
        {
            companyId: 2,
            name: 'Sneha Reddy',
            designation: 'Project Manager',
            phone: '+91-98765-43213',
            email: 'sneha.reddy@electrosys.com',
            createdAt: daysAgo(125),
        },
        {
            companyId: 3,
            name: 'Vikram Singh',
            designation: 'Design Engineer',
            phone: '+91-98765-43214',
            email: 'vikram.singh@nanochip.in',
            createdAt: daysAgo(110),
        },
        {
            companyId: 4,
            name: 'Kavita Joshi',
            designation: 'Quality Head',
            phone: '+91-98765-43215',
            email: 'kavita.joshi@precisionelec.com',
            createdAt: daysAgo(95),
        },
        {
            companyId: 4,
            name: 'Rahul Verma',
            designation: 'R&D Manager',
            phone: '+91-98765-43216',
            email: 'rahul.verma@precisionelec.com',
            createdAt: daysAgo(90),
        },
        {
            companyId: 5,
            name: 'Anjali Mehta',
            designation: 'Test Engineer',
            phone: '+91-98765-43217',
            email: 'anjali.mehta@advancedtesting.in',
            createdAt: daysAgo(75),
        },
        {
            companyId: 6,
            name: 'Suresh Nair',
            designation: 'Senior Manager',
            phone: '+91-98765-43218',
            email: 'suresh.nair@microtech.com',
            createdAt: daysAgo(60),
        },
        {
            companyId: 6,
            name: 'Deepa Iyer',
            designation: 'Procurement Head',
            phone: '+91-98765-43219',
            email: 'deepa.iyer@microtech.com',
            createdAt: daysAgo(55),
        },
        {
            companyId: 7,
            name: 'Arun Desai',
            designation: 'Technical Director',
            phone: '+91-98765-43220',
            email: 'arun.desai@quantum.in',
            createdAt: daysAgo(40),
        },
        {
            companyId: 7,
            name: 'Pooja Gupta',
            designation: 'Operations Manager',
            phone: '+91-98765-43221',
            email: 'pooja.gupta@quantum.in',
            createdAt: daysAgo(30),
        },
    ];

    await db.insert(contactPersons).values(sampleContactPersons);
    
    console.log('✅ Contact persons seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});