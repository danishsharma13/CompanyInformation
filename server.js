/*********************************************************************************
* WEB322 – Assignment 06
* I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
* of this assignment has been copied manually or electronically from any other source
* (including 3rd party web sites) or distributed to other students.
*
* Name: Danish Sharma
* Student ID: 148201205
* Date: December 01, 2021
*
* Online (Heroku) Link: https://serene-escarpment-15207.herokuapp.com/
*
********************************************************************************/
// Require libraries
const data_service = require("./data-service.js");
const dataServiceAuth = require("./data-service-auth");
const multer = require("multer");
const express = require("express");
const app = express();
const path = require("path");
const exphbs = require("express-handlebars");
const fileRead = require('fs');
const clientSession = require("client-sessions");

// Using static file - public
app.use(express.static('public'));

// Urlencoded for regular text form data
app.use(express.urlencoded({ extended: true }));

// storage and multer for multipart form data
const storage = multer.diskStorage({
    destination: "./public/images/uploaded",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({storage: storage});

// Using handlebars
app.engine('.hbs', exphbs({
    extname: '.hbs',
    helpers: {
        navLink: (url, options) => {
            return '<li' + ((url == app.locals.activeRoute) ? ' class="active" ' : '') 
                + '><a href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        equal: (lvalue, rvalue, options) => {
            if (arguments.length < 3) throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        }
    },
    defaultLayout: 'main'
}));
app.set('view engine', '.hbs');

// Config client-sessions
app.use(clientSession({
    cookieName: "session", 
    secret: "shhh_its_a_secret", 
    duration: 60 * 1000 * 2, // 60 * 1000 = 1 min, * 2 = 2 mins
    activeDuration:  60 * 1000
}));

// Ensure Login of User
const ensureLogin = (req, res, next) => {
    if (!req.session.user) {
        res.redirect("/login");
    } else {
        next();
    }
}

// On HTTP Start-up
const HTTP_PORT = process.env.PORT||8080;
const onHttpStart = () => console.log("Express http server listening on port: " + HTTP_PORT);

// Allowing access to templates
app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

//routes
// get - home
app.get("/", (req, res) => {
    res.render('home');
});

// get - about
app.get("/about", (req, res) => {
    res.render('about');
});

// get - employees
app.get("/employees", ensureLogin, (req, res) => {

    if(req.query.manager) {
        data_service.getEmployeesByManager(req.query.manager).then((data) => {
            if(data.length > 0) res.render('employees', { employees: data });
            else res.render('employees', {message: "No Result"});
        }).catch((err) => res.render('employees', {message: "No Result"}));
    }
    else if (req.query.status) {
        data_service.getEmployeesByStatus(req.query.status).then((data) => {
            if(data.length > 0) res.render('employees', { employees: data });
            else res.render('employees', {message: "No Result"});
        }).catch((err) => res.render('employees', {message: "No Result"}));
    }
    else if (req.query.department) {
        data_service.getEmployeesByDepartment(req.query.department).then((data) => {
            if(data.length > 0) res.render('employees', { employees: data });
            else res.render('employees', {message: "No Result"});
        }).catch((err) => res.render('employees', {message: "No Result"}));
    }
    else {
        data_service.getAllEmployees().then((data) => {
            if(data.length > 0) res.render('employees', { employees: data.sort((one, two) => one.employeeNum - two.employeeNum) });
            else res.render('employees', {message: "No Result"});
        }).catch((err) => res.render('employees', {message: "No Result"}));
    }
});

// get - employees add
app.get("/employees/add", ensureLogin, (req, res) => {
    data_service.getDepartments().then((departmentData) => {
        res.render('addEmployee', { department: departmentData});
    }).catch(() => res.render("addEmployee", {departments: []}));
});

// get - employees value
app.get("/employees/:val", ensureLogin, (req, res) => {
    let viewData = {};
    data_service.getEmployeeByNum(req.params.val).then((data) => {
        if(data) viewData.employee = data[0];
        else viewData.employee = null;
    }).catch((err) => viewData.employee = null)
    .then(data_service.getDepartments).then((data) => {
        viewData.departments = data;

        for(let i = 0; i < viewData.departments.length; i++) {
            if(viewData.departments[i].departmentId == viewData.employee.department) {
                viewData.departments[i].selected = true;
            }
        }
    }).catch(() => viewData.departments = [])
    .then(() => {
        if(viewData.employee == null) res.status(404).send("Employee Not Found");
        else res.render("employee", { viewData: viewData });
    });
});

// get - employees delete
app.get("/employees/delete/:empNum", ensureLogin, (req, res) => {
    data_service.deleteEmployeeByNum(req.params.empNum).then(() => {
        res.redirect("/employees");
    }).catch(() => res.status(500).send("Unable to Remove Employee / Employee not found"));
});

// post - employees add
app.post("/employees/add", ensureLogin, (req, res) => {
    data_service.addEmployee(req.body).then(() => {
        res.redirect("/employees");
    }).catch((err) => res.json({message: err}));
});

// post - employee update
app.post("/employee/update", ensureLogin, (req, res) => {
    data_service.updateEmployee(req.body).then(() => {
        res.redirect("/employees");
    }).catch((err) => res.status(500).json({message: err}));
});

// get - departments
app.get("/departments", ensureLogin, (req, res) => {
    data_service.getDepartments().then((data) => {
        console.log(data, 1);
        if(data.length > 0) res.render('departments', { departments: data.sort((one, two) => one.departmentId - two.departmentId) });
        else res.render('departments', {message: "No Result"});
    }).catch((err) => res.render('departments', {message: "No Result"}));
});

// get - departments add
app.get("/departments/add", ensureLogin, (req, res) => {
    res.render("addDepartment");
});

// get - departments value
app.get("/departments/:val", ensureLogin, (req, res) => {
    data_service.getDepartmentById(req.params.val).then((data) => {
        if(data.length > 0) res.render("department", { department: data[0] });
        else res.status(404).send("Department Not Found");
    }).catch(() => res.status(404).send("Department Not Found"));
});

// get - departments delete
app.get("/departments/delete/:val", ensureLogin, (req, res) => {
    data_service.deleteDepartmentById(req.params.val).then(() => {
        res.redirect("/departments");
    }).catch(() => res.status(500).send("Unable to Remove Department / Department not found"));
});

// post - departments add
app.post("/departments/add", ensureLogin, (req, res) => {
    data_service.addDepartment(req.body).then(() => {
        res.redirect("/departments");
    }).catch((err) => res.json({message: err}));
});

// post - department update
app.post("/department/update", ensureLogin, (req, res) => {
    data_service.updateDepartment(req.body).then(() => {
        res.redirect("/departments");
    }).catch((err) => res.json({message: err}));
});

// get - images
app.get("/images", ensureLogin, (req, res) => {
    fileRead.readdir(__dirname + "/public/images/uploaded", (error, data) => {
        if(error) {
            res.json({error: error});
        }
        else {
            res.render('images', {
                data: data
            });
        }
    });
});

// get - images add
app.get("/images/add", ensureLogin, (req, res) => {
    res.render('addImage');
});

// post - images add
app.post("/images/add", ensureLogin, upload.single("imageFile"), (req, res) => {
    res.redirect("/images");
});

// get - login
app.get("/login", (req, res) => {
    res.render('login');
});

// post - login
app.post("/login", (req, res) => {
    req.body.userAgent = req.get('User-Agent');
    dataServiceAuth.checkUser(req.body)
        .then((data) => {
            req.session.user = {
                userName: data.userName,
                email: data.email,
                loginHistory: data.loginHistory
            }
            res.redirect('/employees');
        })
        .catch((err) => res.render("login",  {errorMessage: err, userName: req.body.userName}));
});

// get - register
app.get("/register", (req, res) => {
    res.render("register");
});

// post - register
app.post("/register", (req, res) => {
    dataServiceAuth.registerUser(req.body)
        .then(() => res.render("register", {successMessage: "User created"}))
        .catch((err) => res.render("register", {errorMessage: err, userName: req.body.userName}));
});

// get - logout
app.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect("/");
});

// get - userHistory
app.get("/userHistory", ensureLogin, (req, res) => {
    res.render("userHistory");
});

//for any pages not in the routing path
app.use((req, res, next) => {
    res.status(404).send("No Page Found");
});

//if initialize() sends resolved promise then listen on HTTP_PORT
//otherwise catch the error and display it
data_service.initialize()
    .then(dataServiceAuth.initialize)
    .then(() => {
        app.listen(HTTP_PORT, onHttpStart);
    }).catch((error) => console.log(error));