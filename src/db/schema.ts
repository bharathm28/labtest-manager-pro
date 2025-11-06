import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

// Companies table
export const companies = sqliteTable('companies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  remarks: text('remarks'),
  createdAt: text('created_at').notNull(),
});

// Contact Persons table
export const contactPersons = sqliteTable('contact_persons', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  companyId: integer('company_id').references(() => companies.id).notNull(),
  name: text('name').notNull(),
  designation: text('designation'),
  phone: text('phone'),
  email: text('email').notNull(),
  createdAt: text('created_at').notNull(),
});

// Employees table
export const employees = sqliteTable('employees', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  designation: text('designation'),
  email: text('email').notNull(),
  phone: text('phone'),
  department: text('department'),
  employeeCode: text('employee_code').unique(),
  createdAt: text('created_at').notNull(),
});

// Test Beds table
export const testBeds = sqliteTable('test_beds', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  location: text('location'),
  status: text('status').notNull().default('available'),
  createdAt: text('created_at').notNull(),
});

// Service Requests table (SRF/Job Cards)
export const serviceRequests = sqliteTable('service_requests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  jobCardNumber: text('job_card_number').notNull().unique(),
  companyId: integer('company_id').references(() => companies.id).notNull(),
  contactPersonId: integer('contact_person_id').references(() => contactPersons.id),
  productName: text('product_name').notNull(),
  productDescription: text('product_description'),
  quantity: integer('quantity'),
  testType: text('test_type'),
  specialRequirements: text('special_requirements'),
  status: text('status').notNull().default('requested'),
  requestedDate: text('requested_date'),
  agreedDate: text('agreed_date'),
  materialReceivedDate: text('material_received_date'),
  testingStartDate: text('testing_start_date'),
  testingEndDate: text('testing_end_date'),
  completionDate: text('completion_date'),
  assignedEmployeeId: integer('assigned_employee_id').references(() => employees.id),
  assignedTestbedId: integer('assigned_testbed_id').references(() => testBeds.id),
  dcNumber: text('dc_number'),
  dcVerified: integer('dc_verified', { mode: 'boolean' }).default(false),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Status History table
export const statusHistory = sqliteTable('status_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  serviceRequestId: integer('service_request_id').references(() => serviceRequests.id).notNull(),
  status: text('status').notNull(),
  notes: text('notes'),
  changedBy: text('changed_by'),
  changedAt: text('changed_at').notNull(),
});

// Activity Logs table
export const activityLogs = sqliteTable('activity_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  entityType: text('entity_type').notNull(),
  entityId: integer('entity_id').notNull(),
  action: text('action').notNull(),
  fieldName: text('field_name'),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  reason: text('reason'),
  performedBy: text('performed_by'),
  timestamp: text('timestamp').notNull(),
  metadata: text('metadata'),
});

// Inventory table
export const inventory = sqliteTable('inventory', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type'),
  serialNumber: text('serial_number').unique(),
  description: text('description'),
  status: text('status').notNull().default('available'),
  currentLocation: text('current_location'),
  assignedToEmployeeId: integer('assigned_to_employee_id').references(() => employees.id),
  assignedDate: text('assigned_date'),
  assignedReason: text('assigned_reason'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Inventory Logs table
export const inventoryLogs = sqliteTable('inventory_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  inventoryId: integer('inventory_id').references(() => inventory.id).notNull(),
  action: text('action').notNull(),
  employeeId: integer('employee_id').references(() => employees.id),
  fromLocation: text('from_location'),
  toLocation: text('to_location'),
  reason: text('reason'),
  performedBy: text('performed_by'),
  timestamp: text('timestamp').notNull(),
  notes: text('notes'),
});

// Test Bed Tasks table
export const testbedTasks = sqliteTable('testbed_tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  serviceRequestId: integer('service_request_id').references(() => serviceRequests.id).notNull(),
  testbedId: integer('testbed_id').references(() => testBeds.id).notNull(),
  assignedEmployeeId: integer('assigned_employee_id').references(() => employees.id),
  status: text('status').notNull().default('queued'),
  priority: text('priority').default('normal'),
  scheduledStartDate: text('scheduled_start_date'),
  scheduledEndDate: text('scheduled_end_date'),
  actualStartDate: text('actual_start_date'),
  actualEndDate: text('actual_end_date'),
  queuePosition: integer('queue_position').default(0),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Test Bed Task Transfers table
export const testbedTaskTransfers = sqliteTable('testbed_task_transfers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  taskId: integer('task_id').references(() => testbedTasks.id).notNull(),
  fromTestbedId: integer('from_testbed_id').references(() => testBeds.id).notNull(),
  toTestbedId: integer('to_testbed_id').references(() => testBeds.id).notNull(),
  reason: text('reason').notNull(),
  transferredBy: text('transferred_by'),
  transferredAt: text('transferred_at').notNull(),
  notes: text('notes'),
});