const express = require('express');
const sql     = require('mssql/msnodesqlv8'); 
const cors    = require('cors');
require('dotenv').config();

const app  = express();
app.use(cors());
app.use(express.json());

// DB CONFIG
const dbConfig = {
  server:   process.env.DB_SERVER   || 'DESKTOP-4I814ME\\SQLEXPRESS',
  database: process.env.DB_NAME     || 'FitnessCenterDB',
  driver:   process.env.DB_DRIVER   || 'ODBC Driver 17 for SQL Server', 
  options: {
    trustedConnection: true
  }
};

async function getPool() {
  return sql.connect(dbConfig);
}

// MEMBERS

// GET all members
app.get('/api/members', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT  m.MemberID,
              m.MemberName,
              m.MemberGender,
              m.BirthDate,
              m.PhoneNumber,
              m.WorkoutPlan,
              c.CoachName        AS AssignedCoach,
              c.CoachID          AS CoachID,
              mp.PlanDescription AS MembershipPlan,
              mp.MembershipID    AS PlanID,
              m.PlanStartDate,
              dbo.fn_GetMemberAge(m.MemberID)       AS Age,
              dbo.fn_GetPlanEndDate(m.MemberID)     AS PlanEndDate,
              dbo.fn_IsMemberPlanActive(m.MemberID) AS PlanActive
      FROM    Members m
      LEFT JOIN Coach          c  ON m.CoachID = c.CoachID
      LEFT JOIN MembershipPlan mp ON m.PlanID  = mp.MembershipID
      ORDER BY m.MemberID
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single member profile
app.get('/api/members/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('MemberID', sql.Int, req.params.id)
      .query('SELECT * FROM dbo.fn_GetMemberProfile(@MemberID)');
    res.json(result.recordset[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add member
app.post('/api/members', async (req, res) => {
  const { name, gender, birthDate, phone, workoutPlan, coachID, planID, planStartDate } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('Name',          sql.NVarChar, name)
      .input('Gender',        sql.NVarChar, gender)
      .input('BirthDate',     sql.Date,     birthDate)
      .input('Phone',         sql.NVarChar, phone)
      .input('WorkoutPlan',   sql.NVarChar, workoutPlan  || null)
      .input('CoachID',       sql.Int,      coachID      || null)
      .input('PlanID',        sql.Int,      planID       || null)
      .input('PlanStartDate', sql.Date,     planStartDate|| null)
      .query(`
        INSERT INTO Members
          (MemberID, MemberName, MemberGender, BirthDate, PhoneNumber, WorkoutPlan, CoachID, PlanID, PlanStartDate)
        VALUES
          ((SELECT ISNULL(MAX(MemberID),0)+1 FROM Members),
           @Name, @Gender, @BirthDate, @Phone, @WorkoutPlan, @CoachID, @PlanID, @PlanStartDate)
      `);
    res.json({ success: true });
  } catch (err) {
    if (err.number === 2627 || err.number === 2601)
      return res.status(400).json({ error: 'A member with this phone number already exists.' });
    res.status(500).json({ error: err.message });
  }
});

// PUT update member
app.put('/api/members/:id', async (req, res) => {
  const { name, gender, phone, workoutPlan, coachID, planID, planStartDate } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('MemberID',      sql.Int,      req.params.id)
      .input('Name',          sql.NVarChar, name)
      .input('Gender',        sql.NVarChar, gender)
      .input('Phone',         sql.NVarChar, phone)
      .input('WorkoutPlan',   sql.NVarChar, workoutPlan  || null)
      .input('CoachID',       sql.Int,      coachID      || null)
      .input('PlanID',        sql.Int,      planID       || null)
      .input('PlanStartDate', sql.Date,     planStartDate|| null)
      .query(`
        UPDATE Members SET
          MemberName    = @Name,
          MemberGender  = @Gender,
          PhoneNumber   = @Phone,
          WorkoutPlan   = @WorkoutPlan,
          CoachID       = @CoachID,
          PlanID        = @PlanID,
          PlanStartDate = @PlanStartDate
        WHERE MemberID = @MemberID
      `);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE member
app.delete('/api/members/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const tx   = new sql.Transaction(pool);
    await tx.begin();
    try {
      await tx.request().input('ID', sql.Int, req.params.id)
        .query('DELETE FROM Attend WHERE MemberID = @ID');
      await tx.request().input('ID', sql.Int, req.params.id)
        .query('DELETE FROM Uses   WHERE MemberID = @ID');
      await tx.request().input('ID', sql.Int, req.params.id)
        .query('DELETE FROM Members WHERE MemberID = @ID');
      await tx.commit();
      res.json({ success: true });
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// COACHES
app.get('/api/coaches', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT  c.CoachID,
              c.CoachName,
              c.CoachGender,
              c.Salary,
              c.PhoneNumber,
              dbo.fn_GetCoachMemberCount(c.CoachID)      AS MembersCount,
              dbo.fn_GetCoachClassCount(c.CoachID)       AS ClassesLed,
              dbo.fn_GetCoachCertificateCount(c.CoachID) AS Certificates
      FROM    Coach c
      ORDER BY c.CoachID
    `);
    // Attach certificates list to each coach
    for (const coach of result.recordset) {
      const certs = await pool.request()
        .input('CoachID', sql.Int, coach.CoachID)
        .query('SELECT CertificateName FROM CoachCertificate WHERE CoachID = @CoachID');
      coach.CertificateList = certs.recordset.map(r => r.CertificateName);
    }
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/coaches', async (req, res) => {
  const { name, gender, salary, phone } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('Name',   sql.NVarChar, name)
      .input('Gender', sql.NVarChar, gender)
      .input('Salary', sql.Int,      salary)
      .input('Phone',  sql.NVarChar, phone)
      .query(`
        INSERT INTO Coach (CoachID, CoachName, CoachGender, Salary, PhoneNumber)
        VALUES ((SELECT ISNULL(MAX(CoachID),0)+1 FROM Coach), @Name, @Gender, @Salary, @Phone)
      `);
    res.json({ success: true });
  } catch (err) {
    if (err.number === 2627 || err.number === 2601)
      return res.status(400).json({ error: 'A coach with this phone number already exists.' });
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/coaches/:id', async (req, res) => {
  const { name, gender, salary, phone } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('CoachID', sql.Int,      req.params.id)
      .input('Name',    sql.NVarChar, name)
      .input('Gender',  sql.NVarChar, gender)
      .input('Salary',  sql.Int,      salary)
      .input('Phone',   sql.NVarChar, phone)
      .query(`
        UPDATE Coach SET CoachName=@Name, CoachGender=@Gender, Salary=@Salary, PhoneNumber=@Phone
        WHERE CoachID=@CoachID
      `);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/coaches/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const tx   = new sql.Transaction(pool);
    await tx.begin();
    try {
      await tx.request().input('ID', sql.Int, req.params.id)
        .query('DELETE FROM CoachCertificate WHERE CoachID = @ID');
      await tx.request().input('ID', sql.Int, req.params.id)
        .query('DELETE FROM Coach WHERE CoachID = @ID');
      await tx.commit();
      res.json({ success: true });
    } catch (err) {
      await tx.rollback();
      if (err.number === 547)
        return res.status(400).json({ error: 'Cannot delete: members or classes are still assigned to this coach.' });
      throw err;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CLASSES
app.get('/api/classes', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT  cl.ClassID,
              cl.ClassName,
              cl.Capacity,
              cl.LeadingCoachID,
              c.CoachName                                AS LeadingCoach,
              dbo.fn_GetClassAttendanceCount(cl.ClassID) AS Attendees,
              dbo.fn_GetClassAvailableSpots(cl.ClassID)  AS AvailableSpots,
              dbo.fn_IsClassFull(cl.ClassID)             AS IsFull
      FROM    Class cl
      JOIN    Coach c ON cl.LeadingCoachID = c.CoachID
      ORDER BY cl.ClassID
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/classes', async (req, res) => {
  const { name, capacity, coachID } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('Name',     sql.NVarChar, name)
      .input('Capacity', sql.Int,      capacity)
      .input('CoachID',  sql.Int,      coachID)
      .query(`
        INSERT INTO Class (ClassID, ClassName, Capacity, LeadingCoachID)
        VALUES ((SELECT ISNULL(MAX(ClassID),0)+1 FROM Class), @Name, @Capacity, @CoachID)
      `);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/classes/:id', async (req, res) => {
  const { name, capacity, coachID } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('ClassID',  sql.Int,      req.params.id)
      .input('Name',     sql.NVarChar, name)
      .input('Capacity', sql.Int,      capacity)
      .input('CoachID',  sql.Int,      coachID)
      .query(`
        UPDATE Class SET ClassName=@Name, Capacity=@Capacity, LeadingCoachID=@CoachID
        WHERE ClassID=@ClassID
      `);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/classes/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const tx   = new sql.Transaction(pool);
    await tx.begin();
    try {
      await tx.request().input('ID', sql.Int, req.params.id)
        .query('DELETE FROM Attend WHERE ClassID = @ID');
      await tx.request().input('ID', sql.Int, req.params.id)
        .query('DELETE FROM Host   WHERE ClassID = @ID');
      await tx.request().input('ID', sql.Int, req.params.id)
        .query('DELETE FROM Class  WHERE ClassID = @ID');
      await tx.commit();
      res.json({ success: true });
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Enroll member in class
app.post('/api/enrollments', async (req, res) => {
  const { memberID, classID } = req.body;
  try {
    const pool = await getPool();
    // Check capacity first
    const check = await pool.request()
      .input('ClassID', sql.Int, classID)
      .query('SELECT dbo.fn_IsClassFull(@ClassID) AS IsFull');
    if (check.recordset[0].IsFull) {
      return res.status(400).json({ error: 'Class is full.' });
    }
    await pool.request()
      .input('MemberID', sql.Int, memberID)
      .input('ClassID',  sql.Int, classID)
      .query('INSERT INTO Attend (MemberID, ClassID) VALUES (@MemberID, @ClassID)');
    res.json({ success: true });
  } catch (err) {
    if (err.number === 2627 || err.number === 2601)
      return res.status(400).json({ error: 'Member is already enrolled in this class.' });
    res.status(500).json({ error: err.message });
  }
});

// Delete enrollment
app.delete('/api/enrollments', async (req, res) => {
  const { memberID, classID } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('MemberID', sql.Int, memberID)
      .input('ClassID',  sql.Int, classID)
      .query('DELETE FROM Attend WHERE MemberID=@MemberID AND ClassID=@ClassID');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// EQUIPMENT
app.get('/api/equipment', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT  e.EquipmentID,
              e.EquipmentType,
              dbo.fn_GetLastMaintenanceDate(e.EquipmentID) AS LastMaintained
      FROM    Equipment e
      ORDER BY e.EquipmentID
    `);
    // Attach branch list to each equipment
    for (const eq of result.recordset) {
      const branches = await pool.request()
        .input('EID', sql.Int, eq.EquipmentID)
        .query('SELECT BranchID FROM Contain WHERE EquipmentID = @EID');
      eq.Branches = branches.recordset.map(r => r.BranchID);
    }
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/equipment', async (req, res) => {
  const { type } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('Type', sql.NVarChar, type)
      .query(`
        INSERT INTO Equipment (EquipmentID, EquipmentType)
        VALUES ((SELECT ISNULL(MAX(EquipmentID),0)+1 FROM Equipment), @Type)
      `);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/equipment/:id', async (req, res) => {
  const { type } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('ID',   sql.Int,      req.params.id)
      .input('Type', sql.NVarChar, type)
      .query('UPDATE Equipment SET EquipmentType=@Type WHERE EquipmentID=@ID');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/equipment/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const tx   = new sql.Transaction(pool);
    await tx.begin();
    try {
      await tx.request().input('ID', sql.Int, req.params.id)
        .query('DELETE FROM MaintenanceLog WHERE EquipmentID = @ID');
      await tx.request().input('ID', sql.Int, req.params.id)
        .query('DELETE FROM Uses    WHERE EquipmentID = @ID');
      await tx.request().input('ID', sql.Int, req.params.id)
        .query('DELETE FROM Contain WHERE EquipmentID = @ID');
      await tx.request().input('ID', sql.Int, req.params.id)
        .query('DELETE FROM Equipment WHERE EquipmentID = @ID');
      await tx.commit();
      res.json({ success: true });
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add maintenance log
app.post('/api/maintenance', async (req, res) => {
  const { equipmentID, logDate, description } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('EquipmentID',  sql.Int,      equipmentID)
      .input('LogDate',      sql.Date,     logDate)
      .input('Description',  sql.NVarChar, description)
      .query(`
        INSERT INTO MaintenanceLog (EquipmentID, LogDate, LogDescription)
        VALUES (@EquipmentID, @LogDate, @Description)
      `);
    res.json({ success: true });
  } catch (err) {
    if (err.number === 2627 || err.number === 2601)
      return res.status(400).json({ error: 'A log for this equipment on that date already exists.' });
    res.status(500).json({ error: err.message });
  }
});

// MEMBERSHIP PLANS
app.get('/api/plans', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT  mp.MembershipID,
              mp.PlanDescription,
              mp.Duration,
              mp.Price,
              dbo.fn_GetAnnualCost(mp.MembershipID) AS AnnualCost,
              (SELECT COUNT(*) FROM Members m WHERE m.PlanID = mp.MembershipID) AS MemberCount
      FROM    MembershipPlan mp
      ORDER BY mp.Duration
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/plans', async (req, res) => {
  const { description, duration, price } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('Description', sql.NVarChar,    description)
      .input('Duration',    sql.Int,          duration)
      .input('Price',       sql.Int,          price)
      .query(`
        INSERT INTO MembershipPlan (MembershipID, Duration, Price, PlanDescription)
        VALUES ((SELECT ISNULL(MAX(MembershipID),0)+1 FROM MembershipPlan), @Duration, @Price, @Description)
      `);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/plans/:id', async (req, res) => {
  const { description, duration, price } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('PlanID',      sql.Int,       req.params.id)
      .input('Description', sql.NVarChar,  description)
      .input('Duration',    sql.Int,       duration)
      .input('Price',       sql.Int,       price)
      .query(`
        UPDATE MembershipPlan SET PlanDescription=@Description, Duration=@Duration, Price=@Price
        WHERE MembershipID=@PlanID
      `);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/plans/:id', async (req, res) => {
  try {
    const pool = await getPool();
    // Guard: check no active members on this plan
    const check = await pool.request()
      .input('PlanID', sql.Int, req.params.id)
      .query('SELECT COUNT(*) AS cnt FROM Members WHERE PlanID = @PlanID');
    if (check.recordset[0].cnt > 0)
      return res.status(400).json({ error: 'Cannot delete: members are currently subscribed to this plan.' });
    await pool.request()
      .input('PlanID', sql.Int, req.params.id)
      .query('DELETE FROM MembershipPlan WHERE MembershipID = @PlanID');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// BRANCHES

// GET all branches
app.get('/api/branches', async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT 
        bm.BranchID,
        bm.OpenHours,
        bm.AddressStreet,
        bm.AddressCity,
        bm.ManagerID,
        bm.ManagerName,
        bm.ManagerEmail,
        bm.ManagerPhoneNumber,

        COUNT(DISTINCT c.EquipmentID) AS EquipmentCount,
        COUNT(DISTINCT h.ClassID) AS ClassesHosted

      FROM Branch_Manager bm
      LEFT JOIN Contain c ON bm.BranchID = c.BranchID
      LEFT JOIN Host h ON bm.BranchID = h.BranchID

      GROUP BY 
        bm.BranchID,
        bm.OpenHours,
        bm.AddressStreet,
        bm.AddressCity,
        bm.ManagerID,
        bm.ManagerName,
        bm.ManagerEmail,
        bm.ManagerPhoneNumber

      ORDER BY bm.BranchID
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error('GET /api/branches error:', err);
    res.status(500).json({ error: err.message });
  }
});


// POST add new branch with manager
app.post('/api/branches', async (req, res) => {
  try {
    const {
      street,
      city,
      hours,
      managerName,
      managerEmail,
      managerPhone
    } = req.body;

    if (!street || !city || !hours || !managerName || !managerPhone) {
      return res.status(400).json({
        error: 'Street, city, open hours, manager name, and manager phone are required.'
      });
    }

    const pool = await getPool();

    const result = await pool.request()
      .input('OpenHours', sql.VarChar(20), hours)
      .input('AddressStreet', sql.VarChar(100), street)
      .input('AddressCity', sql.VarChar(50), city)
      .input('ManagerName', sql.VarChar(100), managerName)
      .input('ManagerEmail', sql.VarChar(100), managerEmail || null)
      .input('ManagerPhoneNumber', sql.VarChar(20), managerPhone)
      .query(`
        DECLARE @NewBranchID INT;
        DECLARE @NewManagerID INT;

        SELECT @NewBranchID = ISNULL(MAX(BranchID), 0) + 1
        FROM Branch_Manager;

        SELECT @NewManagerID = ISNULL(MAX(ManagerID), 0) + 1
        FROM Branch_Manager;

        INSERT INTO Branch_Manager
        (
          BranchID,
          OpenHours,
          AddressStreet,
          AddressCity,
          ManagerID,
          ManagerName,
          ManagerEmail,
          ManagerPhoneNumber
        )
        VALUES
        (
          @NewBranchID,
          @OpenHours,
          @AddressStreet,
          @AddressCity,
          @NewManagerID,
          @ManagerName,
          @ManagerEmail,
          @ManagerPhoneNumber
        );

        SELECT 
          BranchID,
          OpenHours,
          AddressStreet,
          AddressCity,
          ManagerID,
          ManagerName,
          ManagerEmail,
          ManagerPhoneNumber
        FROM Branch_Manager
        WHERE BranchID = @NewBranchID;
      `);

    res.status(201).json({
      success: true,
      branch: result.recordset[0]
    });

  } catch (err) {
    console.error('POST /api/branches error:', err);

    if (err.number === 2627 || err.number === 2601) {
      return res.status(400).json({
        error: 'Manager email or phone number already exists.'
      });
    }

    if (err.number === 547) {
      return res.status(400).json({
        error: 'Invalid data. Manager phone number must match your database rule, usually starting with 01.'
      });
    }

    res.status(500).json({ error: err.message });
  }
});


// PUT update branch hours
app.put('/api/branches/:id/hours', async (req, res) => {
  try {
    const { hours } = req.body;

    if (!hours) {
      return res.status(400).json({ error: 'Open hours are required.' });
    }

    const pool = await getPool();

    const result = await pool.request()
      .input('BranchID', sql.Int, req.params.id)
      .input('OpenHours', sql.VarChar(20), hours)
      .query(`
        UPDATE Branch_Manager
        SET OpenHours = @OpenHours
        WHERE BranchID = @BranchID;

        SELECT @@ROWCOUNT AS affectedRows;
      `);

    if (result.recordset[0].affectedRows === 0) {
      return res.status(404).json({ error: 'Branch not found.' });
    }

    res.json({ success: true });

  } catch (err) {
    console.error('PUT /api/branches/:id/hours error:', err);
    res.status(500).json({ error: err.message });
  }
});


// PUT update branch manager
app.put('/api/branches/:id/manager', async (req, res) => {
  try {
    const branchId = Number(req.params.id);

    const managerName =
      req.body.managerName ||
      req.body.ManagerName ||
      req.body.name ||
      req.body.Name;

    const managerEmail =
      req.body.managerEmail ||
      req.body.ManagerEmail ||
      req.body.email ||
      req.body.Email ||
      null;

    const managerPhone =
      req.body.managerPhone ||
      req.body.ManagerPhone ||
      req.body.managerPhoneNumber ||
      req.body.ManagerPhoneNumber ||
      req.body.phone ||
      req.body.Phone;

    if (!branchId) {
      return res.status(400).json({ error: 'Invalid branch ID.' });
    }

    if (!managerName || !managerPhone) {
      console.log('Received body:', req.body);

      return res.status(400).json({
        error: 'Manager name and manager phone are required.'
      });
    }

    const pool = await getPool();

    const result = await pool.request()
      .input('BranchID', sql.Int, branchId)
      .input('ManagerName', sql.VarChar(100), managerName)
      .input('ManagerEmail', sql.VarChar(100), managerEmail)
      .input('ManagerPhoneNumber', sql.VarChar(20), managerPhone)
      .query(`
        UPDATE Branch_Manager
        SET 
          ManagerName = @ManagerName,
          ManagerEmail = @ManagerEmail,
          ManagerPhoneNumber = @ManagerPhoneNumber
        WHERE BranchID = @BranchID;

        SELECT @@ROWCOUNT AS affectedRows;
      `);

    if (result.recordset[0].affectedRows === 0) {
      return res.status(404).json({ error: 'Branch not found.' });
    }

    res.json({
      success: true,
      message: 'Manager updated successfully.'
    });

  } catch (err) {
    console.error('PUT /api/branches/:id/manager error:', err);

    if (err.number === 2627 || err.number === 2601) {
      return res.status(400).json({
        error: 'Manager email or phone number already exists.'
      });
    }

    if (err.number === 547) {
      return res.status(400).json({
        error: 'Invalid manager phone number. It must start with 01.'
      });
    }

    res.status(500).json({ error: err.message });
  }
});


// DELETE branch
app.delete('/api/branches/:id', async (req, res) => {
  const branchId = Number(req.params.id);

  if (!branchId) {
    return res.status(400).json({ error: 'Invalid branch ID.' });
  }

  let transaction;

  try {
    const pool = await getPool();
    transaction = new sql.Transaction(pool);

    await transaction.begin();

    await transaction.request()
      .input('BranchID', sql.Int, branchId)
      .query(`
        DELETE FROM Host
        WHERE BranchID = @BranchID;
      `);

    await transaction.request()
      .input('BranchID', sql.Int, branchId)
      .query(`
        DELETE FROM Contain
        WHERE BranchID = @BranchID;
      `);

    const deleteBranchResult = await transaction.request()
      .input('BranchID', sql.Int, branchId)
      .query(`
        DELETE FROM Branch_Manager
        WHERE BranchID = @BranchID;

        SELECT @@ROWCOUNT AS affectedRows;
      `);

    if (deleteBranchResult.recordset[0].affectedRows === 0) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Branch not found.' });
    }

    await transaction.commit();

    res.json({ success: true });

  } catch (err) {
    console.error('DELETE /api/branches/:id error:', err);

    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackErr) {
        console.error('Rollback error:', rollbackErr);
      }
    }

    res.status(500).json({ error: err.message });
  }
});

// LOOKUP ENDPOINTS  (for dropdowns in the UI)

app.get('/api/lookup/coaches', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT CoachID, CoachName FROM Coach ORDER BY CoachName');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/lookup/plans', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT MembershipID, PlanDescription FROM MembershipPlan ORDER BY Duration');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/lookup/classes', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT ClassID, ClassName FROM Class ORDER BY ClassName');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/lookup/equipment', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT EquipmentID, EquipmentType FROM Equipment ORDER BY EquipmentType');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/lookup/members', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT MemberID, MemberName FROM Members ORDER BY MemberName');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`\n Fitness Center API running on http://localhost:${PORT}`);
  console.log(` Attempting to connect to SQL Server...`);
  
  try {
      await getPool();
      console.log(` SUCCESS: Connected to FitnessCenterDB! You can now refresh your browser.`);
  } catch (err) {
      console.log(`\n SQL DATABASE CONNECTION FAILED. EXACT ERROR:`);
      console.error(err);
  }
});