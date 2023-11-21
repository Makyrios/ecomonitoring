const mysql = require('mysql2');
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

// Taxes constants
const FIRST_LEVEL_TAX = 17536.42;
const SECOND_LEVEL_TAX = 4016.11;
const THIRD_LEVEL_TAX = 598.4;
const FOURTH_LEVEL_TAX = 138.57;


hbs.registerHelper('divide', (a, b) => a / b);
hbs.registerHelper('multiply', (a, b) => a * b);
hbs.registerHelper('gt', (a, b) => a > b);
hbs.registerHelper('subtract', (a, b) => a - b);
hbs.registerHelper('toFixed', (a, b) => parseFloat(a).toFixed(b));
hbs.registerHelper('distFixed', (dist) => parseFloat(dist).toFixed(3));
hbs.registerHelper('crFixed', (dist) => parseFloat(dist).toFixed(8));
hbs.registerHelper('checkValue', function (value) {
  if (value < 0 || value == null) {
    return '-';
  }
  return value;
});
hbs.registerHelper('checkValueNull', function (value) {
  if (value < 0 || value == null || value == 0) {
    return '-';
  }
  return value;
});
hbs.registerHelper('riskHQColor', function (value) {
  if (value < 0) {
    return "";
  }

  if (value < 1) {
    return "low";
  }
  else if (value == 1) {
    return "medium";
  }
  else {
    return "high";
  }
});
hbs.registerHelper('riskCRColor', function (value) {
  if (value < 0) {
    return "";
  }

  if (value < 0.000001) {
    return "very-low";
  }
  else if (value >= 0.000001 && value < 0.0001) {
    return "low";
  }
  else if (value >= 0.0001 && value < 0.001) {
    return "medium";
  }
  else {
    return "high";
  }
});


function calculateAddLadd(Ca) {
  BW = 65, EF = 350,
  Tout = 5.3, Tin = 18.7, AT = 70,
  Vout = 1.4, Vin = 0.63, ED = 30;
  return (((Ca*Tout*Vout)+(Ca*Tin*Vin))*EF*ED)/(BW*AT*365);
}

hbs.registerHelper('calculateHq', (Ca, RfC) => {
  if (Ca <= 0 || RfC <= 0) {
    return '-1';
  }
  return Ca / RfC;
});

hbs.registerHelper('calculateCr', (Ca, SF) => {
  if (Ca <= 0 || SF <= 0) {
    return '-1';
  }
  return calculateAddLadd(Ca) * SF;
});

function GetMi(qmi, qnorm, t) {
  console.log("qmi " + qmi);
  console.log("qnorm " + qnorm);
  return 3.6 * Math.pow(10, -3) * (qmi - qnorm) * t;
}

hbs.registerHelper('calculateDamage', (mass, mfr, concentration, tlv) => {
  if (mass <= 0 || mfr <= 0 || tlv <= 0) {
    return '-1';
  }
  console.log("mass " + mass);
  console.log("mfr " + mfr);
  if (mass <= mfr / 114.1552) {
    return '-1';
  }
  minWage = 6700;
  Ai = 1;
  if (tlv > 1) {
    Ai = 10 / tlv;
  }
  else {
    Ai = 1 / tlv;
  }
  Knas = 1.80;
  Kf = 1.25
  Kt = Knas * Kf;
  Kzi = 1;
  if (concentration > 0 && concentration > tlv) {
    Kzi = concentration / tlv;
  }
  t = 8760;
  return GetMi(mass * 0.031709, mfr / 3600, t) * minWage * Ai * Kt * Kzi;
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
  c.name AS company_name,\
  pol.name AS pollutant_name,\
  p.amountpollution,\
  p.concentration,\
  pol.tlv,\
  pol.mass_flow_rate,\
  pol.rfc,\
  pol.sf,\
  pol.danger,\
  p.date \
FROM \
  company c \
JOIN \
  pollution p ON c.idcompany = p.idcompany \
JOIN \
  pollutant pol ON p.idpollutant = pol.idpollutant ORDER BY p.idpollution;", function (err, pollutions) {
    if (err) return console.log(err);
    res.render("index.hbs", {
      pollution: pollutions,
    });
  });
});

app.get("/company", function (req, res) {
  connection.query("SELECT * FROM company", (err, companies) => {
    if (err) {
      console.log(err);
    }
    res.render("company.hbs", {
      company: companies
    });
  });
});

app.get("/pollutant", function (req, res) {
  connection.query("SELECT * FROM pollutant", (err, pollutants) => {
    if (err) {
      console.log(err);
    }
    res.render("pollutant.hbs", {
      pollutant: pollutants
    });
  });
});


app.get('/companies', (req, res) => {
  connection.query("SELECT * FROM company", (err, results) => {
    if (err) {
      throw err;
    }
    res.json(results);
  });
});

app.get('/pollutants', (req, res) => {
  connection.query("SELECT * FROM pollutant", (err, results) => {
    if (err) {
      throw err;
    }
    res.json(results);
  });
});

app.get("/taxes", function (req, res) {
  connection.query(
  "SELECT c.name AS company_name, ptant.name AS pollutant_name, p.amountpollution, ptant.tax_rate, p.date FROM pollution p\
  INNER JOIN company c ON p.idcompany = c.idcompany\
  INNER JOIN pollutant ptant ON p.idpollutant = ptant.idpollutant ORDER BY p.idpollution;", (err, pollutions) => {
    if (err) {
      console.log(err);
    }
    res.render("taxes.hbs", {
      pollution: pollutions
    });
  });
});

app.get("/damage", function (req, res) {
  connection.query(
  "SELECT c.name AS company_name, ptant.name AS pollutant_name, p.amountpollution, p.concentration, ptant.mass_flow_rate, ptant.tlv, p.date FROM pollution p\
  INNER JOIN company c ON p.idcompany = c.idcompany\
  INNER JOIN pollutant ptant ON p.idpollutant = ptant.idpollutant ORDER BY p.idpollution;", (err, pollutions) => {
    if (err) {
      console.log(err);
    }
    res.render("damage.hbs", {
      pollution: pollutions
    });
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
    p.concentration,\
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
    "SELECT * FROM company WHERE idcompany = ?", [idcompany], function (err, data) {
      if (err) return console.log(err);
      res.render("editcompany.hbs", {
        company: data[0]
      });
    });
});

app.get("/editpollutant/:idpollutant", function (req, res) {
  const idpollutant = req.params.idpollutant;
  connection.query(
    "SELECT * FROM pollutant WHERE idpollutant = ?", [idpollutant], function (err, data) {
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
  const concentration = req.body.concentration;
  const date = req.body.date;

  connection.query("INSERT INTO pollution (amountpollution, concentration, idcompany, idpollutant, date) VALUES (?, ?, ?, ?, ?) AS newPoll \
  ON DUPLICATE KEY UPDATE amountpollution=newPoll.amountpollution", [amountpollution, concentration, idcompany, idpollutant, date], function (err, data) {
    if (err) {
      console.log(err);
    }
  });
  res.redirect("/add-pollution");
});

app.post("/add-company", urlencodedParser, function (req, res) {
  if (!req.body) return res.sendStatus(400);
  const company_name = req.body.company_name;
  const economic_type = req.body.economic_type;
  const ownership = req.body.ownership;
  const address = req.body.address;

  connection.query("INSERT INTO company(name, economic_type, ownership, address) VALUES (?, ?, ?, ?)\
   as newcomp ON DUPLICATE KEY UPDATE address = newcomp.address, economic_type = newcomp.economic_type, \
   ownership = newcomp.ownership", [company_name, economic_type, ownership, address], function (err, data) {
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
  const rfc = req.body.rfc;
  const sf = req.body.sf;
  const danger = req.body.danger;
  let tax_rate = req.body.tax_rate;
  // If tax_rate is nog given use constants
  if (tax_rate == null || tax_rate < 0) {
    if (danger == 1) {
      tax_rate = FIRST_LEVEL_TAX;
    }
    else if (danger == 2) {
      tax_rate = SECOND_LEVEL_TAX;
    }
    else if (danger == 3) {
      tax_rate = THIRD_LEVEL_TAX;
    }
    else if (danger == 4) {
      tax_rate = FOURTH_LEVEL_TAX;
    }
  }

  connection.query("INSERT INTO pollutant(name, mass_flow_rate, tlv, rfc, sf, danger, tax_rate) VALUES (?, ?, ?, ?, ?, ?, ?) as newpol " +
    "ON DUPLICATE KEY UPDATE mass_flow_rate = newpol.mass_flow_rate, tlv = newpol.tlv, rfc=newpol.rfc, sf=newpol.sf, danger = newpol.danger, tax_rate=newpol.tax_rate",
    [pollutant_name, mass_flow_rate, tlv, rfc, sf, danger, tax_rate],
    function (err, data) {
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
  const concentration = req.body.concentration;
  const date = req.body.date;

  connection.query("UPDATE pollution SET amountpollution = ?, concentration = ?,\
   idcompany = ?,\
   idpollutant = ?,\
   date = ? WHERE idpollution = ?", [amountpollution, concentration, idcompany, idpollutant, date, idpollution], function (err, data) {
      if (err) return console.log(err);
      res.redirect("/");
    });
});

app.post("/editcompany", urlencodedParser, function (req, res) {
  if (!req.body) return res.sendStatus(400);
  const idcompany = req.body.idcompany;
  const economic_type = req.body.economic_type;
  const ownership = req.body.ownership;
  const address = req.body.address;

  connection.query("UPDATE company SET economic_type = ?, ownership = ?, address = ? \
   WHERE idcompany = ?", [economic_type, ownership, address, idcompany], function (err, data) {
      if (err) return console.log(err);
      res.redirect("/company");
    });
});

app.post("/editpollutant", urlencodedParser, function (req, res) {
  if (!req.body) return res.sendStatus(400);
  const idpollutant = req.body.idpollutant;
  const mass_flow_rate = req.body.mass_flow_rate;
  const tlv = req.body.tlv;
  const rfc = req.body.rfc;
  const sf = req.body.sf;
  const danger = req.body.danger;
  let tax_rate = req.body.tax_rate;
  // If tax_rate is nog given use constants
  if (tax_rate == null || tax_rate < 0) {
    if (danger == 1) {
      tax_rate = FIRST_LEVEL_TAX;
    }
    else if (danger == 2) {
      tax_rate = SECOND_LEVEL_TAX;
    }
    else if (danger == 3) {
      tax_rate = THIRD_LEVEL_TAX;
    }
    else if (danger == 4) {
      tax_rate = FOURTH_LEVEL_TAX;
    }
  }

  connection.query("UPDATE pollutant SET mass_flow_rate = ?, tlv = ?, rfc = ?, sf = ?, danger = ?, tax_rate = ? \
   WHERE idpollutant = ?", [mass_flow_rate, tlv, rfc, sf, danger, tax_rate, idpollutant], function (err, data) {
      if (err) return console.log(err);
      res.redirect("/pollutant");
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
    res.redirect("/company");
  });
});

app.post("/deletepollutant/:idpollutant", function (req, res) {
  const idpollutant = req.params.idpollutant;
  connection.query("DELETE FROM pollutant WHERE idpollutant=?", [idpollutant], function (err, data) {
    if (err) return console.log(err);
    res.redirect("/pollutant");
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
    res.redirect("/company");
  }, 100);
});

app.post('/import-pollutant', uploadFile.single('import-pollutant-file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  importFileToPollutantDb(process.cwd() + '/uploads/' + req.file.filename);
  setTimeout(() => {
    res.redirect("/pollutant");
  }, 100);
});

app.post('/import-pollution', uploadFile.single('import-pollution-file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  importFileToPollutionDb(process.cwd() + '/uploads/' + req.file.filename);
  setTimeout(() => {
    res.redirect("/");
  }, 100);
});


function importFileToPollutionDb(exFile) {
  readXlsxFile(exFile).then((rows) => {
    rows.shift();

    for (let i = 0; i < rows.length; i++) {
      const companyName = rows[i][0];
      const pollutantName = rows[i][1];
      const amountpollution = rows[i][2];
      const concentration = rows[i][3];
      const date = rows[i][4];
      
      connection.query("INSERT INTO pollution (amountpollution, concentration, idcompany, idpollutant, date) VALUES \
      (?, ?, (SELECT idcompany FROM company WHERE name=?), \
      (SELECT idpollutant FROM pollutant WHERE name=?), ?) AS newpollution \
      ON DUPLICATE KEY UPDATE amountpollution = newpollution.amountpollution, concentration=newpollution.concentration;",
       [amountpollution, concentration, companyName, pollutantName, date], function (err, data) {
        if (err) {
          if (err.code == 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
            console.log('Неправильний формат даних');
            return console.log(err);
          }
        }
      });
    }
  })
}

function importFileToCompanyDb(exFile) {
  readXlsxFile(exFile).then((rows) => {
    rows.shift();

    for (let i = 0; i < rows.length; i++) {
      const companyName = rows[i][0];
      const economic_type = rows[i][1];
      const ownership = rows[i][2];
      const address = rows[i][3];

      connection.query("INSERT INTO company(name, economic_type, ownership, address) VALUES (?, ?, ?, ?)\
      as newcomp ON DUPLICATE KEY UPDATE address = newcomp.address, economic_type = newcomp.economic_type, \
      ownership = newcomp.ownership", [companyName, economic_type, ownership, address], function (err, data) {
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
      const rfc = rows[i][3];
      const sf = rows[i][4];
      const danger = rows[i][5];
      let tax_rate = rows[i][6];
      // If tax_rate is nog given use constants
      if (tax_rate == null || tax_rate < 0) {
        if (danger == 1) {
          tax_rate = FIRST_LEVEL_TAX;
        }
        else if (danger == 2) {
          tax_rate = SECOND_LEVEL_TAX;
        }
        else if (danger == 3) {
          tax_rate = THIRD_LEVEL_TAX;
        }
        else if (danger == 4) {
          tax_rate = FOURTH_LEVEL_TAX;
        }
      }

      connection.query("INSERT INTO pollutant(name, mass_flow_rate, tlv, rfc, sf, danger, tax_rate) VALUES (?, ?, ?, ?, ?, ?, ?) as newpol " +
        "ON DUPLICATE KEY UPDATE mass_flow_rate = newpol.mass_flow_rate, tlv = newpol.tlv, rfc=newpol.rfc, sf = newpol.sf, danger = newpol.danger, tax_rate = newpol.tax_rate",
         [pollutantName, mass_flow_rate, tlv, rfc, sf, danger, tax_rate], function (err, data) {
          if (err) {
            throw err;
          }
        });
    }
  });
}


const port = 3000;
app.listen(port, () => {
  console.log(`App listening on port ${port}`)
});
