const mysql = require('mysql');
const express = require("express");
const app = express();
const exphbs = require('express-handlebars');
const hbs = require('hbs');
const multer = require('multer');
const readXlsxFile = require('read-excel-file/node');
const dotenv = require('dotenv').config({
  path: 'config.env'
});

const urlencodedParser = express.urlencoded({ extended: false });

hbs.registerHelper('divide', function (a, b) {
  return a / b;
});

hbs.registerHelper('multiply', function (a, b) {
  return a * b;
});

hbs.registerHelper('gt', function (a, b) {
  return (a > b);
});

hbs.registerHelper('subtract', function (a, b) {
  return a - b;
});

hbs.registerHelper('distanceFixed', function(distance) {
  return distance.toFixed(2);
});

app.set("view engine", "hbs");

app.use(express.static(__dirname + '/public'));

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});


connection.connect(function (err) {
  if (err) {
    return console.error("Error-connect: " + err.message);
  } else {
    console.log("Connection to MySQL OK!");
  }
});

app.get("/", function (req, res) {
  connection.query("SELECT \
  p.idpollution,\
  c.idcompany AS idcompany,\
  c.name AS company_name,\
  pol.name AS pollutant_name,\
  p.amountpollution,\
  pol.idpollutant AS idpollutant,\
  pol.tlv,\
  pol.mass_flow_rate,\
  p.date \
FROM \
  company c \
JOIN \
  pollution p ON c.idcompany = p.idcompany \
JOIN \
  pollutant pol ON p.idpollutant = pol.idpollutant ORDER BY p.idpollution;", function (err, pollutions) {
    if (err) return console.log(err);
    connection.query("SELECT * FROM company", function (err, companies) {
      if (err) return console.log(err);
      connection.query("SELECT * from pollutant", function (err, pollutants) {
        if (err) return console.log(err);
        res.render("index.hbs", {
          pollution: pollutions,
          company: companies,
          pollutant: pollutants
        });
      });
    });
  });
});

app.get('/companies', (req, res) => {
  connection.query("SELECT idcompany, name FROM company", (err, results) => {
    if (err) {
      throw err;
    }
    res.json(results);
  });
});

app.get('/pollutants', (req, res) => {
  connection.query("SELECT idpollutant, name FROM pollutant", (err, results) => {
    if (err) {
      throw err;
    }
    res.json(results);
  });
});

app.get("/add-pollution", function (req, res) {
  res.render("addpollution.hbs");
});

app.get("/add-company", function (req, res) {
  res.render("addcompany.hbs");
});

app.get("/add-pollutant", function (req, res) {
  res.render("addpollutant.hbs");
});


app.get("/editpollution/:idpollution", function (req, res) {
  const idpollution = req.params.idpollution;
  connection.query(
    "SELECT \
    p.idpollution, \
    c.idcompany AS idcompany, \
    pol.idpollutant, \
    p.amountpollution, \
    pol.tlv, \
    pol.mass_flow_rate, \
    p.date \
  FROM \
    company c \
  JOIN \
    pollution p ON c.idcompany = p.idcompany \
  JOIN \
    pollutant pol ON p.idpollutant = pol.idpollutant \
  WHERE p.idpollution = ?", [idpollution], function (err, data) {
      if (err) return console.log(err);
      res.render("editpollution.hbs", {
        pollution: data[0]
      });
    });
});

app.get("/editcompany/:idcompany", function (req, res) {
  const idcompany = req.params.idcompany;
  connection.query(
    "SELECT idcompany, name, address FROM company WHERE idcompany = ?", [idcompany], function (err, data) {
      if (err) return console.log(err);
      res.render("editcompany.hbs", {
        company: data[0]
      });
    });
});

app.get("/editpollutant/:idpollutant", function (req, res) {
  const idpollutant = req.params.idpollutant;
  connection.query(
    "SELECT idpollutant, mass_flow_rate, tlv FROM pollutant WHERE idpollutant = ?", [idpollutant], function (err, data) {
      if (err) return console.log(err);
      res.render("editpollutant.hbs", {
        pollutant: data[0]
      });
    });
});

app.post("/add-pollution", urlencodedParser, function (req, res) {
  if (!req.body) return res.sendStatus(400);
  const idcompany = req.body.idcompany;
  const idpollutant = req.body.idpollutant;
  const amountpollution = req.body.amountpollution;
  const date = req.body.date;

  connection.query("INSERT INTO pollution (amountpollution, idcompany, idpollutant, date) VALUES (?, ?, ?, ?) AS newPoll \
  ON DUPLICATE KEY UPDATE amountpollution=newPoll.amountpollution", [amountpollution, idcompany, idpollutant, date], function (err, data) {
    if (err) {
      console.log(err);
    }
  });
  res.redirect("/add-pollution");
});

app.post("/add-company", urlencodedParser, function (req, res) {
  if (!req.body) return res.sendStatus(400);
  const company_name = req.body.company_name;
  const address = req.body.address;

  connection.query("INSERT INTO company(name, address) VALUES (?, ?) as newcomp ON DUPLICATE KEY UPDATE address = newcomp.address", [company_name, address], function (err, data) {
    if (err) {
      console.log(err);
      throw err;
    }
  });
  res.redirect("/add-company");
});

app.post("/add-pollutant", urlencodedParser, function (req, res) {
  if (!req.body) return res.sendStatus(400);
  const pollutant_name = req.body.name;
  const mass_flow_rate = req.body.mass_flow_rate;
  const tlv = req.body.tlv;

  connection.query("INSERT INTO pollutant(name, mass_flow_rate, tlv) VALUES (?, ?, ?) as newcomp " +
    "ON DUPLICATE KEY UPDATE mass_flow_rate = newcomp.mass_flow_rate, tlv = newcomp.tlv", [pollutant_name, mass_flow_rate, tlv], function (err, data) {
      if (err) {
        throw err;
      }
    });
  res.redirect("/add-pollutant");
});

app.post("/editpollution", urlencodedParser, function (req, res) {
  if (!req.body) return res.sendStatus(400);
  const idpollution = req.body.idpollution;
  const idcompany = req.body.idcompany;
  const idpollutant = req.body.idpollutant;
  const amountpollution = req.body.amountpollution;
  const date = req.body.date;

  connection.query("UPDATE pollution SET amountpollution = ?,\
   idcompany = ?,\
   idpollutant = ?,\
   date = ? WHERE idpollution = ?", [amountpollution, idcompany, idpollutant, date, idpollution], function (err, data) {
      if (err) return console.log(err);
      res.redirect("/");
    });
});

app.post("/editcompany", urlencodedParser, function (req, res) {
  if (!req.body) return res.sendStatus(400);
  const idcompany = req.body.idcompany;
  const name = req.body.name;
  const address = req.body.address;

  connection.query("UPDATE company SET address = ? \
   WHERE idcompany = ?", [name, address, idcompany], function (err, data) {
      if (err) return console.log(err);
      res.redirect("/");
    });
});

app.post("/editpollutant", urlencodedParser, function (req, res) {
  if (!req.body) return res.sendStatus(400);
  const idpollutant = req.body.idpollutant;
  const mass_flow_rate = req.body.mass_flow_rate;
  const tlv = req.body.tlv;

  connection.query("UPDATE pollutant SET mass_flow_rate = ?, tlv = ? \
   WHERE idpollutant = ?", [mass_flow_rate, tlv, idpollutant], function (err, data) {
      if (err) return console.log(err);
      res.redirect("/");
    });
});


app.post("/deletepollution/:idpollution", function (req, res) {
  const idpollution = req.params.idpollution;
  connection.query("DELETE FROM pollution WHERE idpollution=?", [idpollution], function (err, data) {
    if (err) return console.log(err);
    res.redirect("/");
  });
});

app.post("/deletecompany/:idcompany", function (req, res) {
  const idcompany = req.params.idcompany;
  connection.query("DELETE FROM company WHERE idcompany=?", [idcompany], function (err, data) {
    if (err) return console.log(err);
    res.redirect("/");
  });
});

app.post("/deletepollutant/:idpollutant", function (req, res) {
  const idpollutant = req.params.idpollutant;
  connection.query("DELETE FROM pollutant WHERE idpollutant=?", [idpollutant], function (err, data) {
    if (err) return console.log(err);
    res.redirect("/");
  });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.cwd() + '/uploads/')
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + file.originalname)
  },
});
const uploadFile = multer({ storage: storage });


app.post('/import-company', uploadFile.single('import-company-file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  importFileToCompanyDb(process.cwd() + '/uploads/' + req.file.filename);
  setTimeout(() => {
    res.redirect("/add-company");
  }, 100);
});

app.post('/import-pollutant', uploadFile.single('import-pollutant-file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  importFileToPollutantDb(process.cwd() + '/uploads/' + req.file.filename);
  setTimeout(() => {
    res.redirect("/add-pollutant");
  }, 100);
});

app.post('/import-pollution', uploadFile.single('import-pollution-file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  importFileToPollutionDb(process.cwd() + '/uploads/' + req.file.filename);
  setTimeout(() => {
    res.redirect("/add-pollution");
  }, 100);
});

function importFileToCompanyDb(exFile) {
  readXlsxFile(exFile).then((rows) => {
    rows.shift();

    for (let i = 0; i < rows.length; i++) {
      const companyName = rows[i][0];
      const address = rows[i][1];

      connection.query("INSERT INTO company(name, address) VALUES (?, ?) as newcomp ON DUPLICATE KEY UPDATE address = newcomp.address", [companyName, address], function (err, data) {
        if (err) {
          console.log(err);
          throw err;
        }
      });
    }
  });
}

function importFileToPollutantDb(exFile) {
  readXlsxFile(exFile).then((rows) => {
    rows.shift();

    for (let i = 0; i < rows.length; i++) {
      const pollutantName = rows[i][0];
      const mass_flow_rate = rows[i][1];
      const tlv = rows[i][2];

      connection.query("INSERT INTO pollutant(name, mass_flow_rate, tlv) VALUES (?, ?, ?) as newcomp " +
        "ON DUPLICATE KEY UPDATE mass_flow_rate = newcomp.mass_flow_rate, tlv = newcomp.tlv", [pollutantName, mass_flow_rate, tlv], function (err, data) {
          if (err) {
            throw err;
          }
        });
    }
  });
}

function importFileToPollutionDb(exFile) {
  readXlsxFile(exFile).then((rows) => {
    rows.shift();

    for (let i = 0; i < rows.length; i++) {
      const companyName = rows[i][0];
      const pollutantName = rows[i][1];
      const amountpollution = rows[i][2];
      const date = rows[i][3];

      connection.query("INSERT INTO pollution (amountpollution, idcompany, idpollutant, date) VALUES \
      (?, (SELECT idcompany FROM company WHERE name=?), \
      (SELECT idpollutant FROM pollutant WHERE name=?), ?) AS newpollution ON DUPLICATE KEY UPDATE amountpollution = newpollution.amountpollution;", [amountpollution, companyName, pollutantName, date], function (err, data) {
        if (err) {
          if (err.code == 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
            console.log('Неправильний формат даних');
            return console.log(err);
          } else {
            console.log(err);
          }
        }
      });
    }
  })
}

const port = 3000;
app.listen(port, () => {
  console.log(`App listening on port ${port}`)
});
