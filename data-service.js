// Sequelize for Postgres database
const Sequelize = require('sequelize');

// Creating Postgres connection
var sequelize = new Sequelize('d1vprl3df5pfuj', 'fgcmqjgmokztjf', '82cad713673d4f772d9a8d8a243cd3302b1978bdea438caadf420af67ee7ed8b', {
    host: 'ec2-18-214-195-34.compute-1.amazonaws.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
    ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});

// Define "Employee" model
var employee = sequelize.define('Employee', {
    employeeNum: {
        type: Sequelize.INTEGER,
        primaryKey: true, // Using employeeNum as primary key
        autoIncrement: true // Auto incrementing number for primary key
    },
    firstName: Sequelize.STRING,
    lastName: Sequelize.STRING,
    email: Sequelize.STRING,
    SSN: Sequelize.STRING,
    addressStreet: Sequelize.STRING,
    addressCity: Sequelize.STRING,
    addressState: Sequelize.STRING,
    addressPostal: Sequelize.STRING,
    maritalStatus: Sequelize.STRING,
    isManager: Sequelize.BOOLEAN,
    employeeManagerNum: Sequelize.INTEGER,
    status: Sequelize.STRING,
    hireDate: Sequelize.STRING
});

var department = sequelize.define('Department', {
    departmentId: {
        type: Sequelize.INTEGER,
        primaryKey: true, // Using departmentId as primary key
        autoIncrement: true // Auto incrementing number for primary key
    },
    departmentName: Sequelize.STRING
});

// Department have many Employees so it will have a hasMany relationship
department.hasMany(employee, {foreignKey: 'department'});

module.exports.initialize = () => new Promise((res, rej) => {
    sequelize.sync()
        .then(() => res("Database has a secure connection..."))
        .catch(() => rej("unable to sync the database..."));
});

module.exports.getAllEmployees = () => new Promise((res, rej) => {
    sequelize.sync()
        .then(() => {
            employee.findAll({raw : true})
                .then((employees) => res(employees))
                .catch(() => rej("no result returned"));
        })
        .catch(() => rej("unable to sync the database..."));
});

module.exports.getManagers = () => new Promise((res, rej) => {
    sequelize.sync()
        .then(() => {
            employee.findAll({
                where: { isManager: true }
            })
                .then((employees) => res(employees))
                .catch(() => rej("no result returned"));
        })
        .catch(() => rej("unable to sync the database..."));
});

module.exports.getDepartments = () => new Promise((res, rej) => {
    sequelize.sync()
        .then(() => {
            department.findAll( {raw : true} )
                .then((departments) => res(departments))
                .catch(() => rej("no result returned"));
        })
        .catch(() => rej("unable to sync to the database..."));
});

module.exports.addEmployee = (empData) => new Promise((res, rej) => {
    empData.isManager = (empData.isManager) ? true : false;

    for(const key in empData) {
        if (empData[key] == "") empData[key] = null;
    }

    sequelize.sync()
        .then(() => {
            employee.create(empData)
                .then(() => res("Employee data has been created"))
                .catch(() => rej("unable to create employee"));
        })
        .catch(() => rej("unable to sync to the database..."));
});

module.exports.getEmployeesByStatus = (empStatus) => new Promise((res, rej) => {
    sequelize.sync()
        .then(() => {
            employee.findAll({
                where: { status: empStatus }
            })
                .then((employees) => res(employees))
                .catch(() => rej("no result returned"));
        })
        .catch(() => rej("unable to sync the database..."));
});

module.exports.getEmployeesByManager = (empManager) => new Promise((res, rej) => {
    sequelize.sync()
        .then(() => {
            employee.findAll({
                where: { employeeManagerNum: empManager }
            })
                .then((employees) => res(employees))
                .catch(() => rej("no result returned"));
        })
        .catch(() => rej("unable to sync the database..."));
});

module.exports.getEmployeesByDepartment = (empDept) => new Promise((res, rej) => {
    sequelize.sync()
        .then(() => {
            employee.findAll({
                where: { department: empDept }
            })
                .then((employees) => res(employees))
                .catch(() => rej("no result returned"));
        })
        .catch(() => rej("unable to sync the database..."));
});

module.exports.getEmployeeByNum = (empNum) => new Promise((res, rej) => {
    sequelize.sync()
        .then(() => {
            employee.findAll({
                where: { employeeNum: empNum }
            })
                .then((employeeData) => res(employeeData))
                .catch(() => rej("no result returned"));
        })
        .catch(() => rej("unable to sync the database..."));
});

module.exports.updateEmployee = (empData) => new Promise((res, rej) => {
    empData.isManager = (empData.isManager) ? true : false;

    for(const key in empData) {
        if (empData[key] == "") empData[key] = null;
    }

    sequelize.sync()
        .then(() => {
            employee.update(empData, {
                where: {employeeNum: empData.employeeNum }
            })
                .then(() => res("Employee data have been updated"))
                .catch(() => rej("unable to update employee"));
        })
        .catch(() => rej("unable to sync to the database..."));
});

module.exports.deleteEmployeeByNum = (empNum) => new Promise((res, rej) => {
    sequelize.sync()
        .then(() => {
            employee.destroy({ 
                where: { employeeNum: empNum }
            })
                .then(() => res("Employee data have been deteled"))
                .catch(() => rej("unable to destroy employee"));
        })
        .catch(() => rej("unable to sync to the database..."));
});

module.exports.getDepartmentById = (deptId) => new Promise ((res, rej) => {
    sequelize.sync()
        .then(() => {
            department.findAll({
                where: { departmentId: deptId }
            })
                .then((departmentData) => res(departmentData))
                .catch(() => rej("no result returned"));
        })
        .catch(() => rej("unable to sync the database..."));
});

module.exports.addDepartment = (deptData) => new Promise((res, rej) => {
    for(const key in deptData) {
        if (deptData[key] == "") deptData[key] = null;
    }

    sequelize.sync()
        .then(() => {
            department.create(deptData)
                .then(() => res("Department data have been created"))
                .catch(() => rej("unable to create department"));
        })
        .catch(() => rej("unable to sync to the database..."));
});

module.exports.updateDepartment = (deptData) => new Promise((res, rej) => {
    for(const key in deptData) {
        if (deptData[key] == "") deptData[key] = null;
    }

    sequelize.sync()
        .then(() => {
            department.update(deptData, {
                where: { departmentId: deptData.departmentId }
            })
                .then(() => res("Department data have been updated"))
                .catch(() => rej("unable to update department"));
        })
        .catch(() => rej("unable to sync to the database..."));
});

module.exports.deleteDepartmentById = (deptId) => new Promise((res, rej) => {
    sequelize.sync()
        .then(() => {
            department.destroy({ where: { departmentId: deptId } })
                .then(() => res("Department data have been deteled"))
                .catch(() => rej("unable to destroy department"));
        })
        .catch(() => rej("unable to sync to the database..."));
});